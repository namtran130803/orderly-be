import { prisma } from '@/config/prisma';
import { MODULE_DEFS, STORE_OWNER_PERMS, ROLE_DEFS } from '@/config/rbac/rbac-defs';

export async function bootstrapRbac() {
  await syncPermissions();
  await syncSystemRoles();
}

// Chỉ tạo permission nếu chưa có trong DB
async function syncPermissions() {
  const allApis = MODULE_DEFS.flatMap((m) => m.apis);
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
