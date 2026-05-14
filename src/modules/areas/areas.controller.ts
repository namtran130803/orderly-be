import { Request, Response, NextFunction } from 'express';
import * as service from '@/modules/areas/areas.service';
import { sendSuccess } from '@/lib/response';
import { CreateAreaDto, UpdateAreaDto, ReorderAreasDto } from '@/modules/areas/areas.schema';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const areas = await service.listAreas(req.store!.id);
    sendSuccess(res, areas, 'Danh sách khu vực và bàn');
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as CreateAreaDto;
    const area = await service.createArea(req.store!.id, dto);
    sendSuccess(res, area, 'Tạo khu vực thành công', 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as UpdateAreaDto;
    const area = await service.updateArea(req.store!.id, Number(req.params.areaId), dto);
    sendSuccess(res, area, 'Cập nhật khu vực thành công');
  } catch (err) {
    next(err);
  }
}

export async function reorder(req: Request, res: Response, next: NextFunction) {
  try {
    const dto = req.body as ReorderAreasDto;
    const areas = await service.reorderAreas(req.store!.id, dto.ids);
    sendSuccess(res, areas, 'Sắp xếp khu vực thành công');
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteArea(req.store!.id, Number(req.params.areaId));
    sendSuccess(res, null, 'Đã xóa khu vực');
  } catch (err) {
    next(err);
  }
}
