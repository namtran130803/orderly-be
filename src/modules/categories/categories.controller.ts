import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/categories/categories.service';
import { sendSuccess } from '@/lib/response';
import { CreateCategoryDto, UpdateCategoryDto } from '@/modules/categories/categories.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await service.listCategories(req.store!.id);
    sendSuccess(res, categories, 'Danh sách danh mục');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateCategoryDto;
    const category = await service.createCategory(req.store!.id, dto);
    sendSuccess(res, category, 'Tạo danh mục thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateCategoryDto;
    const category = await service.updateCategory(req.store!.id, Number(req.params.catId), dto);
    sendSuccess(res, category, 'Cập nhật danh mục thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteCategory(req.store!.id, Number(req.params.catId));
    sendSuccess(res, null, 'Đã xóa danh mục');
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body as { ids: number[] };
    await service.reorderCategories(req.store!.id, ids);
    sendSuccess(res, null, 'Đã cập nhật thứ tự danh mục');
  } catch (err) {
    next(err);
  }
}
