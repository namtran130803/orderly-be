import { Request, Response, NextFunction } from "express";
import * as service from "@/modules/auth/auth.service";
import { sendSuccess } from "@/lib/response";
import { RegisterDto, LoginDto } from "@/modules/auth/auth.schema";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const dto = req.body as RegisterDto;
    const result = await service.register(dto);
    sendSuccess(res, result, "Đăng ký tài khoản thành công", 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as LoginDto;
    const result = await service.login(dto);
    sendSuccess(res, result, "Đăng nhập thành công");
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await service.getUserProfile(req.user!.id);
    sendSuccess(res, profile, "Thông tin tài khoản");
  } catch (err) {
    next(err);
  }
}
