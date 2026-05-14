import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/expenses/expenses.service';
import { sendSuccess } from '@/lib/response';
import { ExpenseQueryDto, CreateExpenseDto, UpdateExpenseDto } from '@/modules/expenses/expenses.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = req.query as unknown as ExpenseQueryDto;
    const result = await service.listExpenses(req.store!.id, query);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateExpenseDto;
    const expense = await service.createExpense(req.store!.id, dto);
    sendSuccess(res, expense, 'Tạo phiếu chi thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateExpenseDto;
    const expense = await service.updateExpense(req.store!.id, Number(req.params.expenseId), dto);
    sendSuccess(res, expense, 'Cập nhật phiếu chi thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteExpense(req.store!.id, Number(req.params.expenseId));
    sendSuccess(res, null, 'Đã xóa phiếu chi');
  } catch (err) {
    next(err);
  }
}
