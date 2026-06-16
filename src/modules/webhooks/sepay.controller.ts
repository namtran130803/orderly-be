import { Request, Response, NextFunction } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import { PaymentStatus } from "@prisma/client";
import { env } from "@/config/env";
import { prisma } from "@/config/prisma";
import { ApiError } from "@/lib/response";
import {
  getStoreSubscription,
  renewFromPaidPayment,
} from "@/modules/subscriptions/subscriptions.service";
import { broadcastSubscriptionPaymentPaid } from "@/realtime/broadcast-subscription";

type SepayPayload = {
  id?: number | string;
  code?: string;
  content?: string;
  description?: string;
  transferType?: string;
  transferAmount?: number | string;
  [key: string]: unknown;
};

function getRawBody(req: Request) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body, "utf8");
  return Buffer.from(JSON.stringify(req.body ?? {}), "utf8");
}

function verifySignature(req: Request, rawBody: Buffer) {
  if (!env.SEPAY_WEBHOOK_SECRET) return;
  const header =
    req.header("x-sepay-signature") ??
    req.header("x-signature") ??
    req.header("sepay-signature");
  if (!header) throw ApiError.unauthorized("Thiếu chữ ký webhook Sepay");

  const expected = createHmac("sha256", env.SEPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  const normalizedHeader = header.replace(/^sha256=/i, "").trim();
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(normalizedHeader, "hex");
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw ApiError.unauthorized("Chữ ký webhook Sepay không hợp lệ");
  }
}

function normalizeTransferType(type: unknown) {
  return String(type ?? "").trim().toLowerCase();
}

function isIncomingTransfer(type: unknown) {
  const normalized = normalizeTransferType(type);
  return ["in", "credit", "deposit", "receive", "incoming"].includes(normalized);
}

function parseAmount(value: unknown) {
  if (typeof value === "number") return value;
  const text = String(value ?? "").replace(/[^\d.-]/g, "");
  return Number(text || 0);
}

function extractPaymentCode(payload: SepayPayload) {
  const haystack = [
    payload.code,
    payload.content,
    payload.description,
  ]
    .filter(Boolean)
    .join(" ");
  const direct = String(payload.code ?? "").trim();
  if (direct.startsWith(env.PAYMENT_CODE_PREFIX)) return direct;

  const escapedPrefix = env.PAYMENT_CODE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = haystack.match(new RegExp(`${escapedPrefix}[A-Z0-9]+`, "i"));
  return match?.[0]?.toUpperCase() ?? null;
}

async function logWebhook(
  payload: SepayPayload,
  status: string,
  message?: string,
  storeId?: number,
  paymentCode?: string | null,
) {
  await prisma.paymentWebhookLog.create({
    data: {
      storeId,
      providerTxnId: payload.id != null ? String(payload.id) : null,
      paymentCode: paymentCode ?? null,
      status,
      message,
      payload: payload as any,
    },
  });
}

export async function handle(req: Request, res: Response, next: NextFunction) {
  let payload: SepayPayload = {};
  let paymentCode: string | null = null;

  try {
    const rawBody = getRawBody(req);
    verifySignature(req, rawBody);
    payload = JSON.parse(rawBody.toString("utf8")) as SepayPayload;
    paymentCode = extractPaymentCode(payload);

    if (!isIncomingTransfer(payload.transferType)) {
      await logWebhook(payload, "IGNORED", "Không phải giao dịch tiền vào", undefined, paymentCode);
      res.status(200).json({ success: true });
      return;
    }

    if (!paymentCode) {
      await logWebhook(payload, "IGNORED", "Không tìm thấy mã thanh toán");
      res.status(200).json({ success: true });
      return;
    }

    const providerTxnId = payload.id != null ? String(payload.id) : null;
    const amount = parseAmount(payload.transferAmount);

    const payment = await prisma.payment.findUnique({
      where: { paymentCode },
      include: { plan: true },
    });
    if (!payment) {
      await logWebhook(payload, "IGNORED", "Mã thanh toán không tồn tại", undefined, paymentCode);
      res.status(200).json({ success: true });
      return;
    }

    if (providerTxnId) {
      const existing = await prisma.payment.findFirst({
        where: {
          providerTxnId,
          id: { not: payment.id },
        },
      });
      if (existing) {
        await logWebhook(payload, "DUPLICATE", "Trùng mã giao dịch Sepay", payment.storeId, paymentCode);
        res.status(200).json({ success: true });
        return;
      }
    }

    if (payment.status === PaymentStatus.PAID) {
      await logWebhook(payload, "DUPLICATE", "Thanh toán đã được xử lý", payment.storeId, paymentCode);
      res.status(200).json({ success: true });
      return;
    }

    if (amount !== payment.amount) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          providerTxnId,
          providerPayload: payload as any,
        },
      });
      await logWebhook(payload, "FAILED", "Số tiền không khớp", payment.storeId, paymentCode);
      res.status(200).json({ success: true });
      return;
    }

    const paidAt = new Date();
    const paidPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        providerTxnId,
        providerPayload: payload as any,
        paidAt,
      },
    });
    await renewFromPaidPayment(paidPayment.id, paidAt);
    const subscription = await getStoreSubscription(payment.storeId);
    await broadcastSubscriptionPaymentPaid(payment.storeId, {
      paymentId: payment.id,
      paymentCode: payment.paymentCode,
      amount: payment.amount,
      planDays: payment.plan.days,
      subscription: {
        status: subscription.status,
        isReadOnly: subscription.isReadOnly,
        currentPeriodStart:
          subscription.currentPeriodStart?.toISOString() ?? null,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        daysRemaining: subscription.daysRemaining,
      },
    });
    await logWebhook(payload, "PAID", "Gia hạn thành công", payment.storeId, paymentCode);

    res.status(200).json({ success: true });
  } catch (err) {
    try {
      await logWebhook(payload, "ERROR", err instanceof Error ? err.message : "Webhook error", undefined, paymentCode);
    } catch {
      // ignore logging failure
    }
    next(err);
  }
}
