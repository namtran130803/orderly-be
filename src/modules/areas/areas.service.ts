import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import { CreateAreaDto, UpdateAreaDto } from '@/modules/areas/areas.schema';

async function assertAreaOwnership(areaId: number, storeId: number) {
  const area = await prisma.area.findUnique({ where: { id: areaId } });
  if (!area) throw ApiError.notFound('Area');
  if (area.storeId !== storeId) throw ApiError.forbidden();
  return area;
}

function generateTablePrefix(areaName: string): string {
  const normalized = areaName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const words = normalized.split(/\s+/).filter(Boolean);
  let prefix = '';
  for (const word of words) {
    const char = word.charAt(0);
    if (/[a-zA-Z0-9]/.test(char)) {
      prefix += char.toUpperCase();
    }
  }
  return prefix;
}

export async function listAreas(storeId: number) {
  return prisma.area.findMany({
    where: { storeId },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createArea(storeId: number, dto: CreateAreaDto) {
  return prisma.$transaction(async (tx) => {
    // Tìm sortOrder lớn nhất hiện tại để xếp khu vực mới vào cuối
    const lastArea = await tx.area.findFirst({
      where: { storeId },
      orderBy: { sortOrder: 'desc' },
    });
    const nextSortOrder = (lastArea?.sortOrder ?? 0) + 1;

    const area = await tx.area.create({
      data: {
        storeId,
        name: dto.name,
        sortOrder: nextSortOrder,
      },
    });

    // Tự động tạo N bàn
    const prefix = generateTablePrefix(dto.name);
    const tablesData = Array.from({ length: dto.tableCount }, (_, i) => ({
      areaId: area.id,
      name: `Bàn ${prefix}${String(i + 1).padStart(2, '0')}`,
      sortOrder: i + 1,
    }));

    await tx.table.createMany({
      data: tablesData,
    });

    return tx.area.findUnique({ where: { id: area.id } });
  });
}

export async function updateArea(storeId: number, areaId: number, dto: UpdateAreaDto) {
  const area = await assertAreaOwnership(areaId, storeId);

  return prisma.$transaction(async (tx) => {
    // Cập nhật tên khu vực nếu có
    if (dto.name) {
      await tx.area.update({
        where: { id: areaId },
        data: { name: dto.name },
      });
    }

    // Đồng bộ số lượng bàn nếu tableCount thay đổi
    if (dto.tableCount !== undefined) {
      const currentTables = await tx.table.findMany({
        where: { areaId },
        orderBy: { sortOrder: 'asc' },
      });

      const currentCount = currentTables.length;
      const targetCount = dto.tableCount;

      if (targetCount > currentCount) {
        // Thêm các bàn còn thiếu
        const prefix = generateTablePrefix(dto.name || area.name);
        const newTablesData = Array.from({ length: targetCount - currentCount }, (_, i) => {
          const order = currentCount + i + 1;
          const tableName = (targetCount - currentCount === 1 && dto.newTableName) 
            ? dto.newTableName 
            : `Bàn ${prefix}${String(order).padStart(2, '0')}`;
          return {
            areaId,
            name: tableName,
            sortOrder: order,
          };
        });
        await tx.table.createMany({ data: newTablesData });
      } else if (targetCount < currentCount) {
        // Xóa các bàn thừa từ cuối danh sách
        const excessTables = currentTables.slice(targetCount);
        const excessTableIds = excessTables.map((t) => t.id);
        await tx.table.deleteMany({
          where: { id: { in: excessTableIds } },
        });
      }
    }

    return tx.area.findUnique({ where: { id: areaId } });
  });
}

export async function reorderAreas(storeId: number, ids: number[]) {
  return prisma.$transaction(async (tx) => {
    const currentAreas = await tx.area.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });

    if (ids.length !== currentAreas.length) {
      throw ApiError.badRequest('Danh sách khu vực không khớp với dữ liệu hiện tại');
    }

    const areaIdSet = new Set(currentAreas.map((area) => area.id));
    if (!ids.every((id) => areaIdSet.has(id))) {
      throw ApiError.badRequest('Danh sách ID khu vực không hợp lệ');
    }

    for (let index = 0; index < ids.length; index += 1) {
      await tx.area.update({
        where: { id: ids[index] },
        data: { sortOrder: index + 1 },
      });
    }

    return tx.area.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });
  });
}

export async function deleteArea(storeId: number, areaId: number) {
  await assertAreaOwnership(areaId, storeId);
  await prisma.area.delete({
    where: { id: areaId },
  });
}
