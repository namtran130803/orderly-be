import type { Request, Response, NextFunction } from "express";
import { sendSuccess, sendPaginated } from "@/lib/response";
import * as service from "./payments.service";
import type { ListPaymentsQueryDto } from "./payments.schema";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ListPaymentsQueryDto;
    const result = await service.listPayments(query);
    sendPaginated(res, result.data, result.pagination);
  } catch (err) {
    next(err);
  }
}
