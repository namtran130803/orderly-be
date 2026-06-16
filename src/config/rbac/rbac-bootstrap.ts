import { prisma } from '@/config/prisma';
import { MODULE_DEFS, STORE_OWNER_PERMS, ROLE_DEFS } from '@/config/rbac/rbac-defs';

export async function bootstrapRbac() {
  await syncPermissions();
  await syncSystemRoles();
  await ensureAdminRolePermissions();
  await ensureStoreOwnerRolePermissions();
}

// Đồng bộ permission với DB (tạo mới và xóa bỏ các permission không còn định nghĩa)
async function syncPermissions() {
  const allApis = MODULE_DEFS.flatMap((m) => m.apis);
  const activeCodes = new Set(allApis.map((api) => api.code));

  // Xóa các permission không còn trong MODULE_DEFS (quan hệ với RolePermission sẽ tự cascade delete)
  await prisma.permission.deleteMany({
    where: {
      code: { notIn: Array.from(activeCodes) },
    },
  });

  const existingCodes = await prisma.permission.findMany({
    select: { code: true },
  });
  const existingSet = new Set(existingCodes.map((p) => p.code));

  for (const api of allApis) {
    if (!existingSet.has(api.code)) {
      await prisma.permission.create({
        data: { code: api.code, name: api.name },
      });
    }
  }
}

// Chỉ tạo role và gán quyền nếu role chưa có
async function syncSystemRoles() {
  const allPerms = await prisma.permission.findMany();

  for (const roleDef of [ROLE_DEFS.ADMIN, ROLE_DEFS.STORE_OWNER]) {
    const existing = await prisma.role.findUnique({
      where: { code: roleDef.code },
    });
    if (existing) continue;

    const role = await prisma.role.create({
      data: {
        code: roleDef.code,
        name: roleDef.name,
        isSystem: true,
      },
    });

    const permCodes =
      roleDef.code === ROLE_DEFS.ADMIN.code
        ? allPerms.map((p) => p.code)
        : STORE_OWNER_PERMS;

    const rolePerms = allPerms.filter((p) => permCodes.includes(p.code));
    if (rolePerms.length > 0) {
      await prisma.rolePermission.createMany({
        data: rolePerms.map((p) => ({
          roleId: role.id,
          permissionId: p.id,
        })),
      });
    }
  }
}

/** Bổ sung permission mới cho admin (toàn bộ). */
async function ensureAdminRolePermissions() {
  const role = await prisma.role.findUnique({
    where: { code: ROLE_DEFS.ADMIN.code },
  });
  if (!role) return;

  const all = await prisma.permission.findMany();
  const existing = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    select: { permissionId: true },
  });
  const have = new Set(existing.map((e) => e.permissionId));
  const toAdd = all.filter((p) => !have.has(p.id));
  if (toAdd.length === 0) return;

  await prisma.rolePermission.createMany({
    data: toAdd.map((p) => ({ roleId: role.id, permissionId: p.id })),
    skipDuplicates: true,
  });
}

/** Bổ sung permission mới cho chủ cửa hàng theo STORE_OWNER_PERMS. */
async function ensureStoreOwnerRolePermissions() {
  const role = await prisma.role.findUnique({
    where: { code: ROLE_DEFS.STORE_OWNER.code },
  });
  if (!role) return;

  const perms = await prisma.permission.findMany({
    where: { code: { in: [...STORE_OWNER_PERMS] } },
  });
  const existing = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
    select: { permissionId: true },
  });
  const have = new Set(existing.map((e) => e.permissionId));
  const toAdd = perms.filter((p) => !have.has(p.id));
  if (toAdd.length === 0) return;

  await prisma.rolePermission.createMany({
    data: toAdd.map((p) => ({ roleId: role.id, permissionId: p.id })),
    skipDuplicates: true,
  });
}
