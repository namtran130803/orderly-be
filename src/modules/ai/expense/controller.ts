import { Request, Response, NextFunction } from 'express';
import * as expenseService from '@/modules/ai/expense/service';
import { sendSuccess } from '@/lib/response';
import type { AnalyzeExpenseDto, GenerateExpenseDto } from '@/modules/ai/expense/schema';

export async function analyzeExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as AnalyzeExpenseDto;
    const description = await expenseService.analyzeExpenseImage(req.store!.id, dto);
    sendSuccess(res, { description }, 'Phân tích chi tiêu thành công');
  } catch (err) {
    next(err);
  }
}

export async function generateExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as GenerateExpenseDto;
    const result = await expenseService.generateExpenses(req.store!.id, dto);
    sendSuccess(res, result, 'Tạo chi tiêu thành công', 201);
  } catch (err) {
    next(err);
  }
}
