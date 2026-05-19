import { prisma } from '@/config/prisma';
import { ApiError } from '@/lib/response';
import type { UpdateDefaultWorkDaysDto, CreateOverrideDto } from '@/modules/schedule/schedule.schema';
import { startOfVnDayFromDateString } from '@/lib/date-vn';
import type { OverrideMap } from '@/lib/schedule-helpers';

export async function getSchedule(storeId: number) {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { defaultWorkDays: true },
  });
  if (!store) throw ApiError.notFound('Store');

  const overrides = await prisma.scheduleOverride.findMany({
    where: { storeId },
    orderBy: { date: 'asc' },
  });

  return {
    defaultWorkDays: store.defaultWorkDays,
    overrides: overrides.map((o) => ({
      id: o.id,
      date: o.date.toISOString().slice(0, 10),
      type: o.type,
    })),
  };
}

export async function updateDefaultWorkDays(
  storeId: number,
  dto: UpdateDefaultWorkDaysDto,
) {
  const sorted = [...new Set(dto.defaultWorkDays)].sort((a, b) => a - b);
  return prisma.store.update({
    where: { id: storeId },
    data: { defaultWorkDays: sorted },
    select: { defaultWorkDays: true },
  });
}

export async function createOverride(storeId: number, dto: CreateOverrideDto) {
  const day = startOfVnDayFromDateString(dto.date);
  return prisma.scheduleOverride.create({
    data: {
      storeId,
      date: day,
      type: dto.type,
    },
  });
}

export async function deleteOverride(storeId: number, overrideId: number) {
  const o = await prisma.scheduleOverride.findFirst({
    where: { id: overrideId, storeId },
  });
  if (!o) throw ApiError.notFound('ScheduleOverride');

  await prisma.scheduleOverride.delete({ where: { id: overrideId } });
}

/** Override trong khoảng tháng — dùng cho chấm công & bảng lương. */
export async function loadOverridesForMonth(
  storeId: number,
  year: number,
  month: number,
): Promise<OverrideMap> {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));

  const rows = await prisma.scheduleOverride.findMany({
    where: {
      storeId,
      date: { gte: first, lte: last },
    },
  });

  const map: OverrideMap = new Map();
  for (const r of rows) {
    map.set(r.date.toISOString().slice(0, 10), r.type);
  }
  return map;
}
