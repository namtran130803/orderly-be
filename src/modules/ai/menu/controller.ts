import type { Request, Response, NextFunction } from 'express';
import * as menuService from '@/modules/ai/menu/service';
import { sendSuccess } from '@/lib/response';
import type { AnalyzeMenuDto, GenerateMenuDto } from '@/modules/ai/menu/schema';

export async function analyzeMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as AnalyzeMenuDto;
    const description = await menuService.analyzeMenuImage(req.store!.id, dto);
    sendSuccess(res, { description }, 'Phân tích menu thành công');
  } catch (err) {
    next(err);
  }
}

export async function generateMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as GenerateMenuDto;
    const result = await menuService.generateMenu(req.store!.id, dto);
    sendSuccess(res, result, 'Tạo menu thành công', 201);
  } catch (err) {
    next(err);
  }
}
