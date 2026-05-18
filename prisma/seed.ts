import { PrismaClient, StatusType, StoreUserRoleType, type Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { bootstrapRbac } from "../src/config/rbac/rbac-bootstrap";
import { PERMS, ROLE_DEFS, STORE_OWNER_PERMS } from "../src/config/rbac/rbac-defs";

const prisma = new PrismaClient();

const SHIFT_LEAD_EXCLUDE = new Set<string>([
  PERMS.stores.delete,
  PERMS.store_roles.delete,
  PERMS.employees.delete,
  PERMS.expenses.delete,
]);

const PERMS_THU_NGAN: string[] = [
  PERMS.categories.list,
  PERMS.menu_items.list,
  PERMS.tables.list,
  PERMS.tables.update,
  PERMS.orders.list,
  PERMS.orders.create,
  PERMS.orders.detail,
  PERMS.orders.update,
  PERMS.orders.advance,
  PERMS.orders.revert,
];

const PERMS_PHA_CHE: string[] = [
  PERMS.statuses.list,
  PERMS.menu_items.list,
  PERMS.orders.list,
  PERMS.orders.detail,
  PERMS.orders.update,
  PERMS.orders.advance,
  PERMS.orders.revert,
];

const PERMS_PHUC_VU: string[] = [
  PERMS.areas.list,
  PERMS.tables.list,
  PERMS.tables.update,
  PERMS.orders.list,
  PERMS.orders.create,
  PERMS.orders.detail,
];

async function createStoreRoleWithPermissions(
  storeId: number,
  name: string,
  permissionCodes: string[],
) {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
  });
  const found = new Set(permissions.map((p) => p.code));
  const missing = permissionCodes.filter((c) => !found.has(c));
  if (missing.length > 0) {
    console.warn(`⚠️  Thiếu permission khi tạo vai trò "${name}":`, missing);
  }

  const storeRole = await prisma.storeRole.create({
    data: { storeId, name },
  });

  if (permissions.length > 0) {
    await prisma.storeRolePermission.createMany({
      data: permissions.map((p) => ({
        storeRoleId: storeRole.id,
        permissionId: p.id,
      })),
    });
  }

  return storeRole;
}

async function addEmployeeToStore(
  storeId: number,
  passwordHash: string,
  person: { name: string; phone: string },
  storeRoleIds: number[],
) {
  const user = await prisma.user.create({
    data: {
      name: person.name,
      phone: person.phone,
      passwordHash,
    },
  });
  const storeUser = await prisma.storeUser.create({
    data: {
      userId: user.id,
      storeId,
      role: StoreUserRoleType.employee,
    },
  });
  if (storeRoleIds.length > 0) {
    await prisma.storeUserRole.createMany({
      data: storeRoleIds.map((storeRoleId) => ({
        storeUserId: storeUser.id,
        storeRoleId,
      })),
    });
  }
  return user;
}

/** Cửa hàng lớn: 4 vai trò, 6 nhân viên (một vai trò / gộp vai trò / gần trùng vai trò POS) */
async function seedCoffeeShopStaff(storeId: number, passwordHash: string) {
  console.log(`\n👥 Seed nhân sự & vai trò cửa hàng (coffee) #${storeId}...`);

  const [thuNgan, phaChe, phucVu, quanLyCa] = await Promise.all([
    createStoreRoleWithPermissions(storeId, "Thu ngân", PERMS_THU_NGAN),
    createStoreRoleWithPermissions(storeId, "Pha chế", PERMS_PHA_CHE),
    createStoreRoleWithPermissions(storeId, "Phục vụ", PERMS_PHUC_VU),
    createStoreRoleWithPermissions(
      storeId,
      "Quản lý ca",
      STORE_OWNER_PERMS.filter((c) => !SHIFT_LEAD_EXCLUDE.has(c)),
    ),
  ]);

  await addEmployeeToStore(storeId, passwordHash, { name: "Nguyễn Thị Mai", phone: "0902345678" }, [
    thuNgan.id,
  ]);
  await addEmployeeToStore(storeId, passwordHash, { name: "Trần Văn Hùng", phone: "0902345679" }, [
    phaChe.id,
  ]);
  await addEmployeeToStore(storeId, passwordHash, { name: "Lê Minh Anh", phone: "0902345680" }, [
    phucVu.id,
    thuNgan.id,
  ]);
  await addEmployeeToStore(storeId, passwordHash, { name: "Phạm Quốc Bảo", phone: "0902345681" }, [
    quanLyCa.id,
  ]);
  await addEmployeeToStore(storeId, passwordHash, { name: "Hoàng Thu Giang", phone: "0902345682" }, [
    phaChe.id,
    phucVu.id,
  ]);
  await addEmployeeToStore(storeId, passwordHash, { name: "Đỗ Văn Kiên", phone: "0902345683" }, [
    thuNgan.id,
  ]);

  console.log(
    `   ✔ 4 vai trò (Thu ngân, Pha chế, Phục vụ, Quản lý ca) + 6 nhân viên (SĐT 0902345678–0902345683, pass: password123).`,
  );
}

/** Cửa hàng nhỏ: 2 vai trò, 2 nhân viên */
async function seedTeaShopStaff(storeId: number, passwordHash: string) {
  console.log(`\n👥 Seed nhân sự & vai trò cửa hàng (trà sữa) #${storeId}...`);

  const [thuNgan, phaCheTra] = await Promise.all([
    createStoreRoleWithPermissions(storeId, "Thu ngân", PERMS_THU_NGAN),
    createStoreRoleWithPermissions(storeId, "Pha chế trà sữa", PERMS_PHA_CHE),
  ]);

  await addEmployeeToStore(storeId, passwordHash, { name: "Nguyễn Ngọc Lan", phone: "0903456790" }, [
    thuNgan.id,
  ]);
  await addEmployeeToStore(storeId, passwordHash, { name: "Trịnh Anh Tú", phone: "0903456791" }, [
    phaCheTra.id,
    thuNgan.id,
  ]);

  console.log(
    `   ✔ 2 vai trò + 2 nhân viên (0903456790, 0903456791 — Tú gồm pha chế + thu ngân).`,
  );
}

async function main() {
  console.log("Bắt đầu seed dữ liệu mẫu...");

  // 1. Dọn dẹp toàn bộ dữ liệu cũ (Full Wipe)
  console.log("🧹 Đang dọn dẹp toàn bộ dữ liệu cũ...");
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"${name}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
    console.log("✨ Đã dọn dẹp sạch sẽ cơ sở dữ liệu.");
  } catch (error) {
    console.log("⚠️ Lỗi khi TRUNCATE, chuyển sang deleteMany...");
    // Fallback if TRUNCATE fails
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.storeUserRole.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.table.deleteMany();
    await prisma.area.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.category.deleteMany();
    await prisma.status.deleteMany();
    await prisma.storeUser.deleteMany();
    await prisma.store.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
  }

  // 2. Đồng bộ RBAC (modules, permissions, roles mặc định)
  await bootstrapRbac();
  console.log("🔐 Đã đồng bộ permissions & roles");

  const passwordHash = await bcrypt.hash("password123", 12);

  // 3. Tạo User mặc định (Admin)
  const user = await prisma.user.create({
    data: {
      name: "Trần Trọng Nam",
      phone: "0901234567",
      passwordHash,
    },
  });
  console.log(`👤 User Admin: ${user.name}`);

  // Gán role admin cho user mặc định
  const adminRole = await prisma.role.findUnique({ where: { code: ROLE_DEFS.ADMIN.code } });
  if (adminRole) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: adminRole.id },
    });
    console.log(`👑 Đã gán role admin cho user ${user.name}`);
  }

  // 4. Tạo Store mặc định
  const store = await prisma.store.create({
    data: {
      userId: user.id,
      name: "Orderly Coffee & Tea",
      address: "123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM",
    },
  });
  console.log(`🏪 Cửa hàng chính: ${store.name}`);

  await prisma.storeUser.create({
    data: {
      userId: user.id,
      storeId: store.id,
      role: StoreUserRoleType.owner,
    },
  });

  await seedCoffeeShopStaff(store.id, passwordHash);

  const ownerPhuc = await prisma.user.create({
    data: {
      name: "Võ Hồng Phúc",
      phone: "0903456789",
      passwordHash,
    },
  });
  const storeOwnerGlobalRole = await prisma.role.findUnique({
    where: { code: ROLE_DEFS.STORE_OWNER.code },
  });
  if (storeOwnerGlobalRole) {
    await prisma.userRole.create({
      data: { userId: ownerPhuc.id, roleId: storeOwnerGlobalRole.id },
    });
    console.log(`👑 Đã gán role hệ thống "${ROLE_DEFS.STORE_OWNER.name}" cho ${ownerPhuc.name}`);
  }

  const store2 = await prisma.store.create({
    data: {
      userId: ownerPhuc.id,
      name: "Trà Sữa Bon Bon — Chi nhánh Lê Văn Sỹ",
      address: "415 Lê Văn Sỹ, Phường 12, Quận 3, TP.HCM",
    },
  });
  console.log(`🏪 Cửa hàng thứ hai: ${store2.name}`);

  await prisma.storeUser.create({
    data: {
      userId: ownerPhuc.id,
      storeId: store2.id,
      role: StoreUserRoleType.owner,
    },
  });

  await seedTeaShopStaff(store2.id, passwordHash);

  // Lặp qua tất cả các cửa hàng hiện có trong hệ thống để nạp danh mục, khu vực, món ăn, và phiếu nhập đồng nhất
  const allStores = await prisma.store.findMany();
  for (const s of allStores) {
    console.log(`\n▶ Bắt đầu nạp dữ liệu cho cửa hàng: ${s.name}`);

    // 3. Tạo Statuses chuẩn
    await prisma.status.createMany({
      data: [
        { storeId: s.id, name: "Chờ xử lý", type: StatusType.start, sortOrder: 1 },
        { storeId: s.id, name: "Đang pha chế", type: StatusType.mid, sortOrder: 5 },
        { storeId: s.id, name: "Kiểm tra chất lượng", type: StatusType.mid, sortOrder: 10 },
        { storeId: s.id, name: "Đóng gói", type: StatusType.mid, sortOrder: 15 },
        { storeId: s.id, name: "Hoàn thành", type: StatusType.end, sortOrder: 20 },
      ],
    });

    // 4. Tạo Categories
    const catCoffee = await prisma.category.create({
      data: { storeId: s.id, name: "Cà phê truyền thống", sortOrder: 1 },
    });
    const catMachine = await prisma.category.create({
      data: { storeId: s.id, name: "Cà phê pha máy", sortOrder: 2 },
    });
    const catTea = await prisma.category.create({
      data: { storeId: s.id, name: "Trà Trái cây & Trà Sữa", sortOrder: 3 },
    });
    const catIceBlended = await prisma.category.create({
      data: { storeId: s.id, name: "Đá xay (Ice Blended)", sortOrder: 4 },
    });
    const catCake = await prisma.category.create({
      data: { storeId: s.id, name: "Bánh ngọt & Đồ ăn nhẹ", sortOrder: 5 },
    });

    // 5. Tạo Menu Items
    await prisma.menuItem.createMany({
      data: [
        // Cà phê truyền thống
        { categoryId: catCoffee.id, name: "Cà phê Đen Đá", price: 29000 },
        { categoryId: catCoffee.id, name: "Cà phê Sữa Đá", price: 35000 },
        { categoryId: catCoffee.id, name: "Bạc Xỉu", price: 39000 },
        { categoryId: catCoffee.id, name: "Cà phê Muối", price: 45000 },
        { categoryId: catCoffee.id, name: "Cà phê Trứng", price: 55000 },
        // Cà phê pha máy
        { categoryId: catMachine.id, name: "Espresso", price: 35000 },
        { categoryId: catMachine.id, name: "Americano", price: 40000 },
        { categoryId: catMachine.id, name: "Cappuccino", price: 50000 },
        { categoryId: catMachine.id, name: "Latte", price: 50000 },
        { categoryId: catMachine.id, name: "Caramel Macchiato", price: 55000 },
        // Trà Trái cây & Trà Sữa
        { categoryId: catTea.id, name: "Trà Đào Cam Sả", price: 45000 },
        { categoryId: catTea.id, name: "Trà Vải Nhiệt Đới", price: 45000 },
        { categoryId: catTea.id, name: "Trà Olong Sen Vàng", price: 50000 },
        {
          categoryId: catTea.id,
          name: "Trà Sữa Trân Châu Đường Đen",
          price: 45000,
        },
        { categoryId: catTea.id, name: "Trà Sữa Nướng", price: 49000 },
        // Đá xay
        { categoryId: catIceBlended.id, name: "Matcha Đá Xay", price: 55000 },
        { categoryId: catIceBlended.id, name: "Cookies & Cream", price: 55000 },
        {
          categoryId: catIceBlended.id,
          name: "Chocolate Đá Xay",
          price: 55000,
        },
        // Bánh ngọt
        { categoryId: catCake.id, name: "Bánh Croissant bơ tỏi", price: 35000 },
        { categoryId: catCake.id, name: "Tiramisu truyền thống", price: 45000 },
        { categoryId: catCake.id, name: "Bánh Mousse Chanh Dây", price: 40000 },
        { categoryId: catCake.id, name: "Bánh Cheesecake Dâu", price: 50000 },
        { categoryId: catCake.id, name: "Hạt hướng dương", price: 15000 },
      ],
    });

    // 6. Tạo Areas & Tables
    const area1 = await prisma.area.create({
      data: { storeId: s.id, name: "Tầng 1", sortOrder: 1 },
    });
    const area2 = await prisma.area.create({
      data: { storeId: s.id, name: "Tầng 2", sortOrder: 2 },
    });
    const areaGarden = await prisma.area.create({
      data: { storeId: s.id, name: "Sân vườn", sortOrder: 3 },
    });
    const areaBar = await prisma.area.create({
      data: { storeId: s.id, name: "Quầy Bar", sortOrder: 4 },
    });

    await prisma.table.createMany({
      data: [
        // Tầng 1
        { areaId: area1.id, name: "Bàn 101", sortOrder: 1 },
        { areaId: area1.id, name: "Bàn 102", sortOrder: 2 },
        { areaId: area1.id, name: "Bàn 103", sortOrder: 3 },
        { areaId: area1.id, name: "Bàn 104", sortOrder: 4 },
        { areaId: area1.id, name: "Bàn 105", sortOrder: 5 },
        { areaId: area1.id, name: "Bàn 106", sortOrder: 6 },
        // Tầng 2
        { areaId: area2.id, name: "Bàn 201", sortOrder: 1 },
        { areaId: area2.id, name: "Bàn 202", sortOrder: 2 },
        { areaId: area2.id, name: "Bàn 203", sortOrder: 3 },
        { areaId: area2.id, name: "Bàn 204", sortOrder: 4 },
        { areaId: area2.id, name: "Bàn 205", sortOrder: 5 },
        { areaId: area2.id, name: "Bàn 206", sortOrder: 6 },
        { areaId: area2.id, name: "Bàn 207", sortOrder: 7 },
        { areaId: area2.id, name: "Bàn 208", sortOrder: 8 },
        // Sân vườn
        { areaId: areaGarden.id, name: "Bàn SV1", sortOrder: 1 },
        { areaId: areaGarden.id, name: "Bàn SV2", sortOrder: 2 },
        { areaId: areaGarden.id, name: "Bàn SV3", sortOrder: 3 },
        { areaId: areaGarden.id, name: "Bàn SV4", sortOrder: 4 },
        { areaId: areaGarden.id, name: "Bàn SV5", sortOrder: 5 },
        // Quầy Bar
        { areaId: areaBar.id, name: "Ghế Bar 1", sortOrder: 1 },
        { areaId: areaBar.id, name: "Ghế Bar 2", sortOrder: 2 },
        { areaId: areaBar.id, name: "Ghế Bar 3", sortOrder: 3 },
        { areaId: areaBar.id, name: "Ghế Bar 4", sortOrder: 4 },
      ],
    });

    // 7. Tạo Expenses (phiếu chi)
    const expenseTitles = [
      "Nhập hạt cà phê Arabica Cầu Đất",
      "Nhập hạt cà phê Robusta Đắk Lắk",
      "Nhập sữa tươi tiệt trùng Vinamilk",
      "Nhập sữa đặc Ngôi Sao Phương Nam",
      "Nhập trà ô long hoa nhài",
      "Nhập đào ngâm đóng hộp",
      "Nhập vải thiều đóng hộp",
      "Nhập đường cát trắng",
      "Nhập ly nhựa và ống hút sinh học",
      "Nhập bột bánh ngọt và kem béo",
      "Thanh toán tiền điện tháng này",
      "Thanh toán tiền nước",
      "Thanh toán tiền internet",
      "Lương nhân viên ca sáng",
      "Lương nhân viên ca tối",
      "Mua nước ngọt bổ sung",
      "Nhập đá viên",
      "Bảo trì bếp gas",
      "Mua chén đũa mới",
      "Chi phí quảng cáo Facebook",
      "Thiết kế banner khai trương",
      "Thuê ship giao hàng",
      "Mua khăn giấy",
      "Mua nước rửa chén",
      "Mua hộp mang về",
      "In tem logo cửa hàng",
      "Mua ly nhựa và ống hút",
      "Thuê mặt bằng",
      "Phí duy trì phần mềm POS",
    ];

    const expenseEntries: Prisma.ExpenseCreateManyInput[] = [];
    const now = new Date();

    const utcMidnightDaysAgo = (days: number) =>
      new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - days,
        ),
      );

    // 30 existing invoices
    for (let dOffset = 0; dOffset < 10; dOffset++) {
      const targetDate = utcMidnightDaysAgo(dOffset);

      for (let i = 0; i < 3; i++) {
        const title = expenseTitles[(dOffset * 3 + i) % expenseTitles.length];
        const amount = (Math.floor(Math.random() * 15) + 5) * 100000;

        const createdAt = new Date(targetDate.getTime());
        createdAt.setHours(8 + i * 3, 0, 0, 0);

        expenseEntries.push({
          storeId: s.id,
          title,
          amount,
          rawDate: targetDate,
          createdAt,
        });
      }
    }

    // 80 additional expenses across more days
    const moreTitles = [
      "Mua cà phê hạt rang xay",
      "Nhập siro bơ sữa",
      "Mua topping trân châu",
      "Nhập thạch dừa",
      "Mua pudding đậu đỏ",
      "Nhập sữa tươi không đường",
      "Mua kem tươi đánh bông",
      "Nhập bột cacao nguyên chất",
      "Mua matcha bột",
      "Nhập bánh quy ốc quế",
      "Mua mứt hoa quả các loại",
      "Nhập nước cốt dừa",
      "Mua siro đường mía",
      "Nhập mật ong rừng",
      "Mua trà túi lọc các loại",
      "Nhập cà phê hòa tan",
      "Mua bột sữa đậu nành",
      "Nhập tinh dầu vani",
      "Mua chocolate đen",
      "Nhập hạnh nhân lát",
      "Mua bánh cookie vụn",
      "Nhập dừa sấy khô",
      "Mua siro dâu tây",
      "Nhập bột rau câu",
      "Mua đậu đỏ hầm sẵn",
      "Nhập trân châu trắng",
      "Mua trái cây tươi (dâu, việt quất)",
      "Nhập bạc hà tươi",
      "Mua gừng tươi pha chế",
      "Nhập sả tươi",
      "Mua chanh dây đông lạnh",
      "Nhập matcha đá xay",
      "Mua siro dừa",
      "Nhập nước cốt chanh",
      "Mua bột pudding",
      "Nhập bánh flan",
      "Mua thạch cà phê",
      "Nhập hạt é",
      "Mua hạt chia",
      "Nhập nha đam",
      "Mua bí đỏ cho sinh tố",
      "Nhập khoai môn",
      "Mua khoai lang tím",
      "Nhập bơ sáp",
      "Mua sầu riêng đông lạnh",
      "Nhập dừa tươi",
      "Mua xoài chín",
      "Nhập cam tươi vắt",
      "Mua bưởi da xanh",
      "Nhập dâu tây đông lạnh",
      "Mua việt quất đông lạnh",
      "Nhập cherry nhập khẩu",
      "Mua kiwi",
      "Nhập táo xanh",
      "Mua siro lựu",
      "Nhập nước ép lựu đóng chai",
      "Mua trà thảo mộc",
      "Nhập bánh trung thu",
      "Mua bánh mochi",
      "Nhập bánh macaron",
      "Mua bánh donut",
      "Nhập bánh pancake",
      "Mua bánh waffle",
      "Nhập bánh crepe",
      "Mua bánh bông lan cuộn",
      "Nhập bánh su kem",
      "Mua bánh tart trứng",
      "Nhập bánh mì que bơ tỏi",
      "Mua bánh pizza mini",
      "Nhập bánh hamburger",
      "Mua xúc xích Đức",
      "Nhập phô mai con bò cười",
      "Mua sốt mayonnaise",
      "Nhập tương ớt",
      "Mua tương cà",
      "Nhập dầu oliu pha chế",
      "Mua giấy bạc gói hàng",
      "Nhập túi giấy kraft",
      "Mua decal dán cửa hàng",
    ];

    // Spread expenses across last 30 days
    for (let i = 0; i < 80; i++) {
      const dayOffset = Math.floor(i / 3) % 30;
      const targetDate = utcMidnightDaysAgo(dayOffset);

      const amount = (Math.floor(Math.random() * 50) + 1) * 10000;
      const createdAt = new Date(targetDate.getTime());
      createdAt.setHours(7 + (i % 12), 0, 0, 0);

      expenseEntries.push({
        storeId: s.id,
        title: moreTitles[i % moreTitles.length],
        amount,
        rawDate: targetDate,
        createdAt,
      });
    }

    await prisma.expense.createMany({ data: expenseEntries });

    // 8. Tạo Orders (đơn hàng mẫu)
    const menuItems = await prisma.menuItem.findMany({ where: { category: { storeId: s.id } } });
    const orderStatuses = await prisma.status.findMany({
      where: { storeId: s.id },
      orderBy: { sortOrder: "asc" },
    });
    const orderTables = await prisma.table.findMany({
      where: { area: { storeId: s.id } },
      include: { area: true },
    });

    const orderEntries: {
      storeId: number;
      tableSnapshot: string | null;
      statusId: number;
      statusSnapshot: string;
      createdAt: Date;
    }[] = [];
    const orderItemEntries: {
      orderIdx: number;
      statusId: number;
      statusSnapshot: string | null;
      nameSnapshot: string;
      priceSnapshot: number;
      qty: number;
    }[] = [];

    let totalOrders = 0;
    for (const st of orderStatuses) {
      const count = 5 + Math.floor(Math.random() * 11);
      totalOrders += count;

      for (let i = 0; i < count; i++) {
        const orderIdx = orderEntries.length;

        const hours = 7 + Math.floor(Math.random() * 11);
        const minutes = Math.floor(Math.random() * 60);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(orderIdx / 10) - 1);
        createdAt.setHours(hours, minutes, 0, 0);

        orderEntries.push({
          storeId: s.id,
          tableSnapshot: null,
          statusId: st.id,
          statusSnapshot: st.name,
          createdAt,
        });

        const itemCount = 1 + Math.floor(Math.random() * 4);
        const usedIndices = new Set<number>();
        for (let j = 0; j < itemCount; j++) {
          let idx: number;
          do {
            idx = Math.floor(Math.random() * menuItems.length);
          } while (usedIndices.has(idx));
          usedIndices.add(idx);

          const mi = menuItems[idx];
          const qty = 1 + Math.floor(Math.random() * 3);

          orderItemEntries.push({
            orderIdx,
            statusId: st.id,
            statusSnapshot: st.name,
            nameSnapshot: mi.name,
            priceSnapshot: Number(mi.price),
            qty,
          });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      const createdOrders = await Promise.all(
        orderEntries.map((o) =>
          tx.order.create({ data: o }),
        ),
      );

      await tx.orderItem.createMany({
        data: orderItemEntries.map((item) => ({
          orderId: createdOrders[item.orderIdx].id,
          statusId: item.statusId,
          statusSnapshot: item.statusSnapshot,
          nameSnapshot: item.nameSnapshot,
          priceSnapshot: item.priceSnapshot,
          qty: item.qty,
        })),
      });
    });

    console.log(
      `✔ Đã nạp danh mục, thực đơn phong phú, 4 khu vực bàn, ${expenseEntries.length} phiếu chi và ${totalOrders} đơn hàng mẫu.`,
    );
  }

  console.log(
    "\n✅ Seed dữ liệu mẫu hoàn tất!\n" +
      "   Đăng nhập admin / chủ CH1: 0901234567 — password123\n" +
      "   Chủ CH2 (dashboard chủ cửa hàng): 0903456789 — password123\n" +
      "   Nhân viên Orderly Coffee: 0902345678 … 0902345683 — password123\n" +
      "   Nhân viên Bon Bon: 0903456790, 0903456791 — password123",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
