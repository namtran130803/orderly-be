import {
  PrismaClient,
  StatusType,
  StoreUserRoleType,
  AttendanceStatus,
  LeaveRequestStatus,
  OverrideType,
  SalaryType,
  SubscriptionSource,
  SubscriptionStatus,
  type Prisma,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { bootstrapRbac } from "../src/config/rbac/rbac-bootstrap";
import {
  PERMS,
  ROLE_DEFS,
  STORE_OWNER_PERMS,
} from "../src/config/rbac/rbac-defs";
import { lockPayroll } from "../src/modules/payroll/payroll.service";

const prisma = new PrismaClient();

// ============================================================
// UTILS
// ============================================================
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function vnDateOnly(y: number, month: number, day: number): Date {
  return new Date(
    `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00.000Z`,
  );
}
function vnDateTime(y: number, month: number, day: number, h: number, min: number): Date {
  return new Date(
    `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+07:00`,
  );
}
function daysInMonth(y: number, month: number): number {
  return new Date(y, month, 0).getDate();
}
function todayVnDateString(): string {
  const now = new Date();
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vnTime = new Date(now.getTime() + vnOffsetMs);
  const y = vnTime.getUTCFullYear();
  const m = String(vnTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vnTime.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function prevMonthYear(y: number, m: number) {
  return m <= 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
}
/** Tạo ngày ngẫu nhiên trong khoảng daysAgo ngày trở về trước */
function randomDateBefore(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(7, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return d;
}

// ============================================================
// DATA CONSTANTS
// ============================================================
const SUBSCRIPTION_PLANS = [
  { code: "D30",  name: "Gói 30 ngày",  days: 30,  price: 2_000 },
  { code: "D90",  name: "Gói 90 ngày",  days: 90,  price: 3_000 },
  { code: "D180", name: "Gói 180 ngày", days: 180, price: 4_000 },
  { code: "D360", name: "Gói 360 ngày", days: 360, price: 5_000 },
];

const PEAK_ORDER_HOURS = [
  8, 8, 9, 9, 10, 10, 11, 11, 12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 19, 19, 20, 21,
];

const EXPENSE_IMPORT_TITLES = [
  "Nhập cà phê hạt Arabica", "Nhập cà phê Robusta", "Nhập sữa tươi",
  "Nhập sữa đặc", "Nhập trà ô long", "Nhập đào ngâm", "Nhập vải thiều",
  "Nhập đường cát", "Nhập ly nhựa ống hút", "Nhập topping trân châu",
  "Nhập thạch dừa", "Nhập kem tươi", "Nhập bột matcha", "Nhập nước cốt dừa",
  "Nhập siro đường đen", "Nhập đá viên", "Nhập bột cacao", "Nhập hạnh nhân lát",
  "Nhập trái cây tươi", "Nhập bột bánh kem", "Nhập bơ lạt", "Nhập phô mai",
  "Nhập trứng gà", "Nhập bột mì đa dụng", "Nhập socola chip",
];
const EXPENSE_OPERATING_TITLES = [
  "Tiền điện", "Tiền nước", "Tiền internet", "Bảo trì máy pha",
  "Quảng cáo Facebook", "Quảng cáo Google Ads", "Phí POS", "Mua khăn giấy",
  "Mua hộp mang về", "Thuê ship giao hàng", "Mua nước rửa chén",
  "Sửa máy lạnh", "Mua đồng phục nhân viên", "Phí nền tảng giao hàng",
  "Mua túi giấy in logo",
];

// 200 tên tiếng Việt đa dạng
const MALE_NAMES = [
  "Nguyễn Văn An", "Trần Văn Bình", "Lê Quốc Huy", "Phạm Minh Tuấn",
  "Hoàng Đức Hiếu", "Vũ Đình Khang", "Đặng Công Thành", "Bùi Tiến Dũng",
  "Đỗ Hoàng Long", "Hồ Đức Mạnh", "Ngô Văn Phát", "Dương Chí Công",
  "Lâm Quốc Thắng", "Mai Đình Nghĩa", "Tạ Văn Tài", "Trịnh Văn Hào",
  "Phan Công Minh", "Cao Văn Đức", "Đinh Thành Nam", "Lý Hoàng Phúc",
  "Võ Quốc Toàn", "Kiều Văn Tú", "Lưu Đức Hải", "Tô Minh Trí",
  "Huỳnh Thanh Bình", "Châu Văn Đạt", "Mạc Quang Vinh", "Nông Văn Lực",
  "Tống Đình Sơn", "Vương Tiến Hùng", "Đoàn Văn Khánh", "Thái Bá Tùng",
  "Quách Hoàng Liêm", "Diệp Văn Quân", "Ưng Thế Hào", "Tăng Văn Hiển",
  "Khúc Trọng Minh", "Thẩm Văn Lâm", "Đàm Công Chính", "Cù Văn Lộc",
];
const FEMALE_NAMES = [
  "Nguyễn Thị Mai", "Trần Thị Lan", "Lê Minh Anh", "Phạm Thu Hà",
  "Hoàng Thu Giang", "Vũ Thị Hạnh", "Đặng Ngọc Linh", "Bùi Thanh Hương",
  "Đỗ Thị Quỳnh", "Hồ Ngọc Trâm", "Ngô Bích Ngọc", "Dương Hồng Nhung",
  "Lâm Khánh Vy", "Mai Phương Thảo", "Tạ Hoàng Yến", "Trịnh Thị Hoa",
  "Phan Thị Hồng", "Cao Thị Thu", "Đinh Thanh Huyền", "Lý Thúy Vy",
  "Võ Kim Ngân", "Kiều Thị Phương", "Lưu Ngọc Ánh", "Tô Thị Bích",
  "Huỳnh Thị Xuân", "Châu Mỹ Linh", "Phùng Thị Yến", "Nông Thị Hà",
  "Tống Thanh Tuyền", "Vương Thị Duyên", "Đoàn Thị Ngân", "Thái Thị Loan",
  "Quách Thị Hương", "Diệp Thu Hà", "Lê Thị Minh Tâm", "Nguyễn Ngọc Lan",
  "Lê Thị Ngọc", "Trần Thị Dung", "Bùi Thị Thúy", "Hoàng Thị Thương",
];

// Danh sách SĐT duy nhất — đủ cho nhiều users
let _phoneCounter = 1;
function nextPhone(): string {
  const n = _phoneCounter++;
  return `09${String(n).padStart(8, "0")}`;
}
function pickName(male: boolean): string {
  return male ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
}

// ============================================================
// STORE TEMPLATES — nhiều loại hình kinh doanh thực tế
// ============================================================
const STORE_TEMPLATES = [
  // Cà phê
  { type: "coffee" as const, namePrefix: "Cà Phê", suffixes: ["Sài Gòn", "Mộc", "Xưa", "Phố", "Làng", "Ven Sông", "Đình", "Nhà", "Vườn", "Quê Hương"] },
  { type: "coffee" as const, namePrefix: "Coffee", suffixes: ["House", "Garden", "Roastery", "Corner", "Street", "Lab", "Bar", "Station", "Nest", "Spot"] },
  // Trà sữa
  { type: "tea" as const, namePrefix: "Trà Sữa", suffixes: ["Ngọc Sương", "Đồng Xanh", "Thiên Đường", "Mây Trắng", "Hương Thơm", "Phố Cổ", "Sao Khuê", "Hồng Trà", "Tuyết Mai", "Ngàn Hoa"] },
  { type: "tea" as const, namePrefix: "Bon Bon", suffixes: ["Tea", "Milk Tea", "Fresh", "Original", "Special", "Premium", "Classic", "Fusion", "Select", "Elite"] },
  // Bánh
  { type: "bakery" as const, namePrefix: "Bánh", suffixes: ["Mì Phương", "Ngon Bơ", "Ngọt Ngào", "Vàng Ươm", "Nhà Làm", "Thơm Lừng", "Giòn Tan", "Truyền Thống", "Hương Vị", "Bình Dân"] },
  { type: "bakery" as const, namePrefix: "Pastry & Cake", suffixes: ["Studio", "House", "Boutique", "Artisan", "Delight", "Corner", "Lab", "Kitchen", "Workshop", "Nest"] },
];

const VN_CITIES_DISTRICTS = [
  { city: "TP.HCM", districts: ["Quận 1", "Quận 3", "Quận 5", "Quận 7", "Quận 9", "Quận 10", "Quận 12", "Bình Thạnh", "Gò Vấp", "Tân Phú", "Tân Bình", "Bình Chánh"] },
  { city: "Hà Nội", districts: ["Hoàn Kiếm", "Đống Đa", "Ba Đình", "Cầu Giấy", "Hai Bà Trưng", "Thanh Xuân", "Hà Đông", "Long Biên", "Hoàng Mai"] },
  { city: "Đà Nẵng", districts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn", "Liên Chiểu", "Cẩm Lệ"] },
  { city: "Cần Thơ", districts: ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn", "Thốt Nốt"] },
  { city: "Bình Dương", districts: ["Thuận An", "Dĩ An", "Thủ Dầu Một", "Bến Cát"] },
  { city: "Đồng Nai", districts: ["Biên Hòa", "Long Khánh", "Nhơn Trạch"] },
  { city: "Huế", districts: ["Phú Hội", "Phú Nhuận", "Vĩnh Ninh", "Phú Hiệp"] },
  { city: "Nha Trang", districts: ["Vĩnh Nguyên", "Vĩnh Hòa", "Xương Huân", "Vĩnh Phước"] },
  { city: "Vũng Tàu", districts: ["Phường 1", "Phường 2", "Phường 5", "Phường 7", "Thắng Tam"] },
  { city: "Hải Phòng", districts: ["Hồng Bàng", "Lê Chân", "Ngô Quyền", "Kiến An"] },
];
const STREET_NAMES = [
  "Nguyễn Văn Linh", "Lê Văn Sỹ", "Nguyễn Huệ", "Đinh Tiên Hoàng",
  "Trần Hưng Đạo", "Lê Lợi", "Pasteur", "Nam Kỳ Khởi Nghĩa", "Hai Bà Trưng",
  "Điện Biên Phủ", "Cách Mạng Tháng 8", "Bùi Thị Xuân", "Võ Văn Tần",
  "Nguyễn Thị Minh Khai", "Lý Tự Trọng", "Đồng Khởi", "Tôn Đức Thắng",
  "Hùng Vương", "Quang Trung", "Lý Thường Kiệt",
];

function randomAddress(): string {
  const cityData = pick(VN_CITIES_DISTRICTS);
  const district = pick(cityData.districts);
  const street = pick(STREET_NAMES);
  const num = randomInt(1, 300);
  return `${num} ${street}, ${district}, ${cityData.city}`;
}

// ============================================================
// RBAC / PERMISSIONS
// ============================================================
const SHIFT_LEAD_EXCLUDE = new Set<string>([
  PERMS.stores.delete,
  PERMS.store_roles.delete,
  PERMS.employees.delete,
  PERMS.expenses.delete,
]);
const PERMS_EMPLOYEE_VIEW = [
  PERMS.areas.list, PERMS.categories.list, PERMS.menu_items.list,
  PERMS.tables.list, PERMS.statuses.list, PERMS.schedule.view,
  PERMS.stores.role_modules,
];
const PERMS_THU_NGAN: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.tables.update, PERMS.orders.list, PERMS.orders.create,
  PERMS.orders.detail, PERMS.orders.update, PERMS.orders.advance,
  PERMS.orders.revert, PERMS.attendance.scan, PERMS.leave.create,
];
const PERMS_PHA_CHE: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.orders.list, PERMS.orders.detail, PERMS.orders.update,
  PERMS.orders.advance, PERMS.orders.revert,
  PERMS.attendance.scan, PERMS.leave.create,
];
const PERMS_PHUC_VU: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.tables.update, PERMS.orders.list, PERMS.orders.create,
  PERMS.orders.detail, PERMS.attendance.scan, PERMS.leave.create,
];
const PERMS_BAKER: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.orders.list, PERMS.orders.detail, PERMS.orders.update,
  PERMS.orders.advance, PERMS.orders.revert,
  PERMS.attendance.scan, PERMS.leave.create,
];
const PERMS_BARISTA: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.orders.list, PERMS.orders.create, PERMS.orders.detail,
  PERMS.orders.advance, PERMS.orders.revert,
  PERMS.attendance.scan, PERMS.leave.create,
];

// ============================================================
// SUBSCRIPTION HELPERS
// ============================================================
async function seedSubscriptionPlans() {
  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { days: plan.days },
      update: { code: plan.code, name: plan.name, price: plan.price, isActive: true },
      create: { ...plan, isActive: true },
    });
  }
}

async function seedActiveSubscription(storeId: number, days = 360) {
  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + days);

  await prisma.storeSubscription.upsert({
    where: { storeId },
    update: { status: SubscriptionStatus.ACTIVE, currentPeriodStart: startsAt, currentPeriodEnd: endsAt },
    create: { storeId, status: SubscriptionStatus.ACTIVE, currentPeriodStart: startsAt, currentPeriodEnd: endsAt },
  });
  await prisma.subscriptionPeriod.create({
    data: { storeId, source: SubscriptionSource.LEGACY_GRACE, days, startsAt, endsAt },
  });
}

/**
 * Seed lịch sử thanh toán thực tế — nhiều giao dịch cho từng store
 * Tổng số payment sẽ là count, với phân phối trạng thái ngẫu nhiên.
 */
async function seedPaymentsForStore(storeId: number, userId: number, count: number) {
  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { days: "asc" } });
  if (plans.length === 0) return;

  const statuses: ("PAID" | "PENDING" | "EXPIRED" | "CANCELLED" | "FAILED")[] = [
    "PAID", "PAID", "PAID", "PAID", "PAID",  // 50% PAID
    "PENDING", "PENDING",                      // 20% PENDING
    "EXPIRED",                                 // 10% EXPIRED
    "CANCELLED",                               // 10% CANCELLED
    "FAILED",                                  // 10% FAILED
  ];

  for (let i = 0; i < count; i++) {
    // Skewed probability for plan selection: 30 days (55%), 90 days (25%), 180 days (12%), 360 days (8%)
    let plan = plans[0];
    const roll = Math.random() * 100;
    if (roll < 55) {
      plan = plans[0] || plan;
    } else if (roll < 80) {
      plan = plans[1] || plan;
    } else if (roll < 92) {
      plan = plans[2] || plan;
    } else {
      plan = plans[3] || plan;
    }
    const status = pick(statuses);
    const daysAgo = randomInt(0, 365);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(randomInt(7, 22), randomInt(0, 59), 0, 0);

    const paymentData: any = {
      storeId, userId,
      planId: plan.id,
      amount: plan.price,
      paymentCode: `PAY${storeId.toString().padStart(4, "0")}${i.toString().padStart(6, "0")}`,
      transferContent: `ORDERLY ${storeId} ${i}`,
      provider: "SEPAY",
      status,
      createdAt,
    };
    if (status === "PAID") {
      paymentData.paidAt = createdAt;
      paymentData.providerTxnId = `txn-${storeId}-${i}`;
    }

    const payment = await prisma.payment.create({ data: paymentData });

    if (status === "PAID") {
      const startsAt = new Date(createdAt);
      const endsAt = new Date(startsAt);
      endsAt.setDate(endsAt.getDate() + plan.days);
      await prisma.subscriptionPeriod.create({
        data: {
          storeId, paymentId: payment.id,
          source: SubscriptionSource.PAYMENT,
          days: plan.days, startsAt, endsAt,
        },
      });
    }
  }
}

// ============================================================
// STORE ROLE HELPERS
// ============================================================
async function createStoreRoleWithPermissions(storeId: number, name: string, permissionCodes: string[]) {
  const permissions = await prisma.permission.findMany({ where: { code: { in: permissionCodes } } });
  const storeRole = await prisma.storeRole.create({ data: { storeId, name } });
  if (permissions.length > 0) {
    await prisma.storeRolePermission.createMany({
      data: permissions.map((p) => ({ storeRoleId: storeRole.id, permissionId: p.id })),
    });
  }
  return storeRole;
}

async function addEmployeeToStore(
  storeId: number, passwordHash: string,
  person: { name: string; phone: string },
  storeRoleIds: number[],
  salary?: { salaryType: SalaryType; baseSalary: number; hourlyRate?: number; workDays?: number[] },
) {
  const user = await prisma.user.create({ data: { name: person.name, phone: person.phone, passwordHash } });
  const storeUser = await prisma.storeUser.create({
    data: {
      userId: user.id, storeId,
      role: StoreUserRoleType.employee,
      salaryType: salary?.salaryType ?? SalaryType.MONTHLY,
      baseSalary: salary?.baseSalary ?? 7_000_000,
      hourlyRate: salary?.hourlyRate ?? null,
      workDays: salary?.workDays ?? [],
    },
  });
  if (storeRoleIds.length > 0) {
    await prisma.storeUserRole.createMany({
      data: storeRoleIds.map((storeRoleId) => ({ storeUserId: storeUser.id, storeRoleId })),
    });
  }
  return { user, storeUser };
}

/** Seed nhân viên cơ bản cho 1 cửa hàng — 3-6 người */
async function seedStoreEmployees(storeId: number, passwordHash: string, storeType: "coffee" | "tea" | "bakery") {
  const roleConfigs =
    storeType === "bakery"
      ? [
          { name: "Thu ngân", perms: PERMS_THU_NGAN },
          { name: "Thợ làm bánh", perms: PERMS_BAKER },
          { name: "Barista", perms: PERMS_BARISTA },
          { name: "Quản lý ca", perms: STORE_OWNER_PERMS.filter((c) => !SHIFT_LEAD_EXCLUDE.has(c)) },
        ]
      : [
          { name: "Thu ngân", perms: PERMS_THU_NGAN },
          { name: "Pha chế", perms: PERMS_PHA_CHE },
          { name: "Phục vụ", perms: PERMS_PHUC_VU },
          { name: "Quản lý ca", perms: STORE_OWNER_PERMS.filter((c) => !SHIFT_LEAD_EXCLUDE.has(c)) },
        ];

  const roleMap = new Map<string, number>();
  for (const cfg of roleConfigs) {
    const role = await createStoreRoleWithPermissions(storeId, cfg.name, cfg.perms);
    roleMap.set(cfg.name, role.id);
  }

  const numEmployees = randomInt(3, 6);
  const employeeIds: number[] = [];
  const roleNames = roleConfigs.map((r) => r.name);

  for (let i = 0; i < numEmployees; i++) {
    const male = Math.random() > 0.45;
    const name = pickName(male);
    const phone = nextPhone();
    const assignedRole = roleNames[i % roleNames.length];
    const roleId = roleMap.get(assignedRole)!;

    const isHourly = Math.random() < 0.3;
    const result = await addEmployeeToStore(
      storeId, passwordHash,
      { name, phone },
      [roleId],
      isHourly
        ? { salaryType: SalaryType.HOURLY, baseSalary: 0, hourlyRate: randomInt(45_000, 65_000), workDays: [1,2,3,4,5] }
        : { salaryType: SalaryType.MONTHLY, baseSalary: randomInt(6_500_000, 12_000_000) },
    );
    employeeIds.push(result.storeUser.id);
  }

  return employeeIds;
}

// ============================================================
// MENU / AREA / TABLE DATA
// ============================================================
const COFFEE_MENU: Record<string, { items: { name: string; price: number }[]; sort: number }> = {
  "Cà phê Việt Nam": {
    sort: 1,
    items: [
      { name: "Cà phê Đen Đá", price: 29_000 }, { name: "Cà phê Sữa Đá", price: 35_000 },
      { name: "Bạc Xỉu", price: 39_000 }, { name: "Cà phê Muối", price: 45_000 },
      { name: "Cà phê Trứng", price: 55_000 }, { name: "Cà phê Dừa", price: 50_000 },
    ],
  },
  "Cà phê pha máy": {
    sort: 2,
    items: [
      { name: "Espresso", price: 35_000 }, { name: "Americano", price: 40_000 },
      { name: "Cappuccino", price: 50_000 }, { name: "Latte", price: 50_000 },
      { name: "Caramel Macchiato", price: 55_000 }, { name: "Mocha", price: 55_000 },
      { name: "Flat White", price: 55_000 },
    ],
  },
  "Trà trái cây": {
    sort: 3,
    items: [
      { name: "Trà Đào Cam Sả", price: 45_000 }, { name: "Trà Vải Nhiệt Đới", price: 45_000 },
      { name: "Trà Olong Sen Vàng", price: 50_000 }, { name: "Trà Sữa Trân Châu Đường Đen", price: 45_000 },
      { name: "Trà Sữa Nướng", price: 49_000 }, { name: "Trà Chanh Dây", price: 42_000 },
    ],
  },
  "Đá xay": {
    sort: 4,
    items: [
      { name: "Matcha Đá Xay", price: 55_000 }, { name: "Cookies & Cream", price: 55_000 },
      { name: "Chocolate Đá Xay", price: 55_000 }, { name: "Dâu Tây Đá Xay", price: 55_000 },
      { name: "Bơ Đá Xay", price: 60_000 },
    ],
  },
  "Bánh ngọt": {
    sort: 5,
    items: [
      { name: "Bánh Croissant bơ tỏi", price: 35_000 }, { name: "Tiramisu", price: 45_000 },
      { name: "Mousse Chanh Dây", price: 40_000 }, { name: "Cheesecake Dâu", price: 50_000 },
      { name: "Bánh Flan Caramel", price: 25_000 },
    ],
  },
};

const TEA_MENU: Record<string, { items: { name: string; price: number }[]; sort: number }> = {
  "Trà sữa": {
    sort: 1,
    items: [
      { name: "Trà Sữa Trân Châu Đường Đen", price: 42_000 }, { name: "Trà Sữa Okinawa", price: 45_000 },
      { name: "Trà Sữa Matcha", price: 48_000 }, { name: "Trà Sữa Khoai Môn", price: 45_000 },
      { name: "Trà Sữa Bạc Hà", price: 45_000 }, { name: "Trà Sữa Hoa Đậu Biếc", price: 50_000 },
    ],
  },
  "Trà trái cây": {
    sort: 2,
    items: [
      { name: "Trà Đào Cam Sả", price: 42_000 }, { name: "Trà Vải", price: 42_000 },
      { name: "Trà Ổi Hồng", price: 45_000 }, { name: "Trà Táo Đỏ", price: 45_000 },
      { name: "Trà Chanh Leo", price: 42_000 }, { name: "Trà Dâu Rừng", price: 48_000 },
    ],
  },
  "Đá xay": {
    sort: 3,
    items: [
      { name: "Sinh tố Bơ", price: 45_000 }, { name: "Sinh tố Dâu", price: 40_000 },
      { name: "Đá xay Sầu Riêng", price: 55_000 }, { name: "Sinh tố Xoài", price: 42_000 },
    ],
  },
  "Topping": {
    sort: 4,
    items: [
      { name: "Trân châu đen", price: 8_000 }, { name: "Trân châu trắng", price: 8_000 },
      { name: "Thạch dừa", price: 8_000 }, { name: "Pudding", price: 10_000 },
      { name: "Hạt é", price: 5_000 }, { name: "Kem phô mai", price: 12_000 },
    ],
  },
};

const BAKERY_MENU: Record<string, { items: { name: string; price: number }[]; sort: number }> = {
  "Bánh mì Âu": {
    sort: 1,
    items: [
      { name: "Bánh Mì Bơ Tỏi", price: 25_000 }, { name: "Croissant trứng muối", price: 40_000 },
      { name: "Bánh Mì Que Pate", price: 30_000 }, { name: "Bánh Mì Sốt Bò Bít Tết", price: 55_000 },
      { name: "Bánh Mì Gà Xé Phay", price: 45_000 },
    ],
  },
  "Bánh ngọt": {
    sort: 2,
    items: [
      { name: "Tiramisu", price: 45_000 }, { name: "Bánh Mousse Xoài", price: 42_000 },
      { name: "Cheesecake Đào", price: 50_000 }, { name: "Bánh Opera Socola", price: 55_000 },
      { name: "Macaron nhiều vị", price: 35_000 }, { name: "Eclair Kem Vani", price: 38_000 },
    ],
  },
  "Bánh mặn": {
    sort: 3,
    items: [
      { name: "Pizza Mini Nhân Thịt", price: 45_000 }, { name: "Bánh Hamburger Bò", price: 55_000 },
      { name: "Hotdog Phô Mai", price: 35_000 }, { name: "Bánh Pastel Nhân Gà", price: 40_000 },
    ],
  },
  "Đồ uống": {
    sort: 4,
    items: [
      { name: "Americano", price: 35_000 }, { name: "Latte", price: 45_000 },
      { name: "Cappuccino", price: 45_000 }, { name: "Chocolate Nóng", price: 40_000 },
      { name: "Matcha Latte", price: 45_000 }, { name: "Nước Cam Tươi", price: 35_000 },
    ],
  },
};

// ============================================================
// SEED STORE DATA (menu + areas + tables + orders)
// ============================================================
async function seedStoreData(storeId: number, menuType: "coffee" | "tea" | "bakery", seedDays: number) {
  // Statuses
  const statuses = [
    { storeId, name: "Chờ xử lý", type: StatusType.start, sortOrder: 1 },
    { storeId, name: "Đang pha chế", type: StatusType.mid, sortOrder: 5 },
    { storeId, name: "Kiểm tra", type: StatusType.mid, sortOrder: 10 },
    { storeId, name: "Đóng gói", type: StatusType.mid, sortOrder: 15 },
    { storeId, name: "Hoàn thành", type: StatusType.end, sortOrder: 20 },
  ];
  await prisma.status.createMany({ data: statuses });

  const menuData = menuType === "coffee" ? COFFEE_MENU : menuType === "tea" ? TEA_MENU : BAKERY_MENU;

  for (const [catName, catDef] of Object.entries(menuData)) {
    const cat = await prisma.category.create({ data: { storeId, name: catName, sortOrder: catDef.sort } });
    await prisma.menuItem.createMany({ data: catDef.items.map((item) => ({ categoryId: cat.id, ...item })) });
  }

  const areaNames = menuType === "bakery"
    ? ["Trong nhà", "Ngoài sân", "Quầy bánh", "Khu VIP"]
    : ["Tầng 1", "Tầng 2", "Sân vườn", "Quầy Bar"];

  const areaIdMap = new Map<string, number>();
  for (let i = 0; i < areaNames.length; i++) {
    const area = await prisma.area.create({ data: { storeId, name: areaNames[i], sortOrder: i + 1 } });
    areaIdMap.set(areaNames[i], area.id);
  }

  const tableLabels = menuType === "bakery"
    ? { "Trong nhà": ["TN1","TN2","TN3","TN4","TN5"], "Ngoài sân": ["NS1","NS2","NS3"], "Quầy bánh": ["Q1","Q2","Q3","Q4"], "Khu VIP": ["VIP1","VIP2"] }
    : { "Tầng 1": ["101","102","103","104","105","106"], "Tầng 2": ["201","202","203","204","205","206","207"], "Sân vườn": ["SV1","SV2","SV3","SV4","SV5"], "Quầy Bar": ["Bar1","Bar2","Bar3","Bar4"] };

  const allTableIds: number[] = [];
  for (const [areaName, tables] of Object.entries(tableLabels)) {
    const areaId = areaIdMap.get(areaName)!;
    for (let i = 0; i < tables.length; i++) {
      const table = await prisma.table.create({ data: { areaId, name: `Bàn ${tables[i]}`, sortOrder: i + 1 } });
      allTableIds.push(table.id);
    }
  }

  const menuItems = await prisma.menuItem.findMany({ where: { category: { storeId } } });
  const orderStatuses = await prisma.status.findMany({ where: { storeId }, orderBy: { sortOrder: "asc" } });
  const endStatus = orderStatuses.find((s) => s.type === StatusType.end)!;
  const pipelineStatuses = orderStatuses.filter((s) => s.type !== StatusType.end);

  if (!endStatus || menuItems.length === 0) return;

  const tableRows = await prisma.table.findMany({ where: { id: { in: allTableIds } }, select: { id: true, name: true } });
  const tableNameById = new Map(tableRows.map((t) => [t.id, t.name]));

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const orderEntries: any[] = [];
  const orderItemEntries: any[] = [];

  const pushOrder = (status: { id: number; name: string }, daysAgo: number) => {
    const orderIdx = orderEntries.length;
    const orderDate = new Date(todayUtc);
    orderDate.setUTCDate(orderDate.getUTCDate() - daysAgo);
    orderDate.setUTCHours(pick(PEAK_ORDER_HOURS), randomInt(0, 59), randomInt(0, 59), 0);

    const useTable = allTableIds.length > 0 && Math.random() < 0.72;
    const tableId = useTable ? pick(allTableIds) : null;
    const tableSnapshot = tableId != null ? (tableNameById.get(tableId) ?? null) : null;

    orderEntries.push({ storeId, tableId, tableSnapshot, statusId: status.id, statusSnapshot: status.name, createdAt: orderDate });

    const itemCount = randomInt(1, 4);
    const used = new Set<number>();
    for (let j = 0; j < itemCount; j++) {
      let idx: number;
      do { idx = randomInt(0, menuItems.length - 1); } while (used.has(idx));
      used.add(idx);
      const mi = menuItems[idx];
      orderItemEntries.push({
        orderIdx,
        statusId: status.id, statusSnapshot: status.name,
        nameSnapshot: mi.name, priceSnapshot: Number(mi.price),
        qty: randomInt(1, 3),
      });
    }
  };

  for (let daysAgo = 0; daysAgo < seedDays; daysAgo++) {
    const day = new Date(todayUtc);
    day.setUTCDate(day.getUTCDate() - daysAgo);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    // Cuối tuần nhiều hơn, ngày thường ít hơn — realistic
    const completedPerDay = weekend ? randomInt(18, 35) : randomInt(10, 22);
    for (let i = 0; i < completedPerDay; i++) pushOrder(endStatus, daysAgo);
    if (daysAgo <= 3) {
      for (let i = 0; i < randomInt(1, 4); i++) pushOrder(pick(pipelineStatuses), daysAgo);
    }
  }

  await prisma.$transaction(async (tx) => {
    const createdOrders = await Promise.all(orderEntries.map((o) => tx.order.create({ data: o })));
    await tx.orderItem.createMany({
      data: orderItemEntries.map((item) => ({
        orderId: createdOrders[item.orderIdx].id,
        statusId: item.statusId, statusSnapshot: item.statusSnapshot,
        nameSnapshot: item.nameSnapshot, priceSnapshot: item.priceSnapshot, qty: item.qty,
      })),
    });
    for (let i = 0; i < createdOrders.length; i++) {
      const entry = orderEntries[i];
      const created = createdOrders[i];
      if (entry.statusId !== endStatus.id && entry.tableId != null && Math.random() < 0.9) {
        await tx.table.update({ where: { id: entry.tableId }, data: { orderId: created.id } });
      }
    }
  });

  console.log(`   ✔ ${Object.keys(menuData).length} DM, ${menuItems.length} món, ${allTableIds.length} bàn, ${orderEntries.length} đơn`);
  return { allTableIds, menuItems, orderStatuses };
}

// ============================================================
// SEED EXPENSES
// ============================================================
async function seedExpenses(storeId: number, daysRange: number) {
  const endStatus = await prisma.status.findFirst({ where: { storeId, type: StatusType.end }, select: { id: true } });
  if (!endStatus) return 0;

  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const rangeStart = new Date(todayUtc);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - daysRange);

  const orderItems = await prisma.orderItem.findMany({
    where: { order: { storeId, statusId: endStatus.id, createdAt: { gte: rangeStart } } },
    select: { priceSnapshot: true, qty: true },
  });

  let revenue = orderItems.reduce((s, r) => s + r.priceSnapshot * r.qty, 0);
  if (revenue < 1_000_000) revenue = 30_000_000;

  const expenseRatio = 0.32 + Math.random() * 0.1;
  const totalExpense = Math.round(revenue * expenseRatio);
  const lineCount = randomInt(80, 130);
  const weights = Array.from({ length: lineCount }, () => randomInt(30, 120));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const rows: Prisma.ExpenseCreateManyInput[] = [];
  let allocated = 0;
  for (let i = 0; i < lineCount; i++) {
    const isLast = i === lineCount - 1;
    const amount = isLast ? totalExpense - allocated : Math.round((weights[i]! / weightSum) * totalExpense);
    allocated += amount;

    const daysAgo = randomInt(0, daysRange);
    const rawDate = new Date(todayUtc);
    rawDate.setUTCDate(rawDate.getUTCDate() - daysAgo);
    const createdAt = new Date(rawDate);
    createdAt.setUTCHours(randomInt(8, 19), randomInt(0, 59), 0, 0);

    const isImport = Math.random() < 0.65;
    rows.push({
      storeId, title: isImport ? pick(EXPENSE_IMPORT_TITLES) : pick(EXPENSE_OPERATING_TITLES),
      amount: Math.max(50_000, amount), rawDate, createdAt,
    });
  }

  await prisma.expense.createMany({ data: rows });
  return rows.length;
}

// ============================================================
// SEED ATTENDANCE (cho staff đặt trước)
// ============================================================
async function seedAttendance(storeId: number, employeeIds: number[], y: number, m: number) {
  const todayStr = todayVnDateString();
  const [todayY, todayM, todayD] = todayStr.split("-").map(Number);
  const todayDate = new Date(todayY, todayM - 1, todayD);
  const seedMonthDate = new Date(y, m - 1, 1);
  if (seedMonthDate > todayDate) return 0;

  const dim = daysInMonth(y, m);
  const maxDay = m === todayM && y === todayY ? todayD : dim;

  const rows: Prisma.AttendanceCreateManyInput[] = [];

  for (const eid of employeeIds) {
    const workDays = [1, 2, 3, 4, 5, ...(Math.random() > 0.5 ? [6] : [])];
    const startHour = pick([7, 8, 8, 9]);
    const endHour = startHour + 8;
    const ratio = 0.8 + Math.random() * 0.18;

    for (let d = 1; d <= maxDay; d++) {
      const dt = new Date(y, m - 1, d);
      const wd = dt.getDay() === 0 ? 7 : dt.getDay();
      if (!workDays.includes(wd)) continue;
      if (Math.random() > ratio) continue;

      const isToday = d === todayD && m === todayM && y === todayY;
      if (isToday) continue;

      const late = Math.random() < 0.12 ? randomInt(5, 25) : 0;
      const cin = vnDateTime(y, m, d, startHour, late);
      const cout = vnDateTime(y, m, d, endHour, randomInt(0, 15));
      const workMinutes = Math.max(0, (endHour - startHour) * 60 - late);

      rows.push({
        employeeId: eid, date: vnDateOnly(y, m, d),
        checkIn: cin, checkOut: cout,
        workMinutes, status: AttendanceStatus.WORK,
      });
    }
  }

  if (rows.length > 0) await prisma.attendance.createMany({ data: rows });
  return rows.length;
}

async function seedLeaveRequests(storeId: number, employeeIds: number[], reviewerId: number) {
  const todayStr = todayVnDateString();
  const [y, m, today] = todayStr.split("-").map(Number);
  const nm = m >= 12 ? 1 : m + 1;
  const ny = m >= 12 ? y + 1 : y;

  const leaves: Prisma.LeaveRequestCreateManyInput[] = [];

  for (let i = 0; i < Math.min(employeeIds.length, 4); i++) {
    const eid = employeeIds[i];
    if (!eid) continue;

    if (i === 0) {
      leaves.push({ storeId, employeeId: eid, fromDate: vnDateOnly(ny, nm, 3), toDate: vnDateOnly(ny, nm, 5), isPaid: true, reason: "Nghỉ phép năm", status: LeaveRequestStatus.PENDING });
    }
    if (i === 1 && today > 7) {
      leaves.push({ storeId, employeeId: eid, fromDate: vnDateOnly(y, m, Math.max(1, today - 7)), toDate: vnDateOnly(y, m, Math.max(1, today - 6)), isPaid: true, reason: "Ốm đau", status: LeaveRequestStatus.APPROVED, reviewedBy: reviewerId });
    }
    if (i === 2 && today > 4) {
      leaves.push({ storeId, employeeId: eid, fromDate: vnDateOnly(y, m, Math.max(1, today - 4)), toDate: vnDateOnly(y, m, Math.max(1, today - 4)), isPaid: false, reason: "Việc gia đình", status: LeaveRequestStatus.REJECTED, reviewedBy: reviewerId });
    }
    if (i === 3) {
      leaves.push({ storeId, employeeId: eid, fromDate: vnDateOnly(ny, nm, 10), toDate: vnDateOnly(ny, nm, 12), isPaid: true, reason: "Đám cưới bạn thân", status: LeaveRequestStatus.PENDING });
    }
  }

  if (leaves.length > 0) await prisma.leaveRequest.createMany({ data: leaves });
  return leaves.length;
}

async function seedScheduleOverrides(storeId: number) {
  const todayStr = todayVnDateString();
  const [y, m] = todayStr.split("-").map(Number);
  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const dt = new Date(y, m - 1, d);
    if (dt.getDay() === 0) {
      await prisma.scheduleOverride.create({ data: { storeId, date: vnDateOnly(y, m, d), type: OverrideType.WORKING_DAY } }).catch(() => {});
      break;
    }
  }
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu mẫu...\n");

  // ── Dọn dữ liệu cũ ─────────────────────────────────────────
  console.log("🧹 Dọn dẹp dữ liệu cũ...");
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== "_prisma_migrations")
    .map((name) => `"${name}"`)
    .join(", ");

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`);
  } catch {
    console.log("   ⚠️ TRUNCATE lỗi, dùng deleteMany...");
    for (const model of [
      "userRole", "rolePermission", "storeUserRole", "storeRolePermission",
      "attendanceEditLog", "paymentWebhookLog", "subscriptionPeriod", "payment",
      "userTrialGrant", "storeSubscription", "orderItem", "order", "expense",
      "attendance", "payrollSnapshot", "leaveRequest", "scheduleOverride",
      "table", "menuItem", "category", "area", "status", "storeUser", "storeRole",
      "store", "user", "role", "permission", "subscriptionPlan",
    ] as const) {
      await (prisma as any)[model].deleteMany();
    }
  }
  console.log("   ✔ Đã xóa dữ liệu cũ");

  await bootstrapRbac();
  console.log("🔐 Đã đồng bộ RBAC\n");

  await seedSubscriptionPlans();
  console.log("📦 Seeded subscription plans: 30/90/180/360 ngày\n");

  const passwordHash = await bcrypt.hash("password123", 12);

  const adminRole = await prisma.role.findUnique({ where: { code: ROLE_DEFS.ADMIN.code } });
  const storeOwnerRole = await prisma.role.findUnique({ where: { code: ROLE_DEFS.STORE_OWNER.code } });

  // ── ADMIN ───────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: "Trần Trọng Nam", phone: "0901234567", passwordHash },
  });
  if (adminRole) {
    await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id } });
  }
  console.log(`👤 Admin: ${admin.name} (0901234567 / password123)`);

  const todayStr = todayVnDateString();
  const [curY, curM] = todayStr.split("-").map(Number);
  const { y: prevY, m: prevM } = prevMonthYear(curY, curM);

  // ── CỬA HÀNG 1: Orderly Coffee & Tea (admin sở hữu) ────────
  console.log("\n☕ [1/3 main stores] Orderly Coffee & Tea...");
  const store1 = await prisma.store.create({
    data: { userId: admin.id, name: "Orderly Coffee & Tea", address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM", defaultWorkDays: [1,2,3,4,5,6] },
  });
  await prisma.storeUser.create({ data: { userId: admin.id, storeId: store1.id, role: StoreUserRoleType.owner } });
  await seedActiveSubscription(store1.id, 360);
  await seedPaymentsForStore(store1.id, admin.id, 80);

  const staff1 = await seedStoreEmployees(store1.id, passwordHash, "coffee");
  await seedScheduleOverrides(store1.id);
  await seedStoreData(store1.id, "coffee", 18);
  await seedExpenses(store1.id, 18);
  const attCur1 = await seedAttendance(store1.id, staff1, curY, curM);
  const attPrev1 = await seedAttendance(store1.id, staff1, prevY, prevM);
  await seedLeaveRequests(store1.id, staff1, admin.id);
  try { await lockPayroll(store1.id, { month: prevM, year: prevY }); } catch { /* ok */ }
  console.log(`   📊 ${attCur1 + attPrev1} chấm công`);

  // ── CỬA HÀNG 2: Trà Sữa Bon Bon ───────────────────────────
  console.log("\n🧋 [2/3 main stores] Trà Sữa Bon Bon...");
  const owner2 = await prisma.user.create({ data: { name: "Võ Hồng Phúc", phone: "0903456789", passwordHash } });
  if (storeOwnerRole) await prisma.userRole.create({ data: { userId: owner2.id, roleId: storeOwnerRole.id } });
  const store2 = await prisma.store.create({
    data: { userId: owner2.id, name: "Trà Sữa Bon Bon", address: "415 Lê Văn Sỹ, Phường 12, Quận 3, TP.HCM", defaultWorkDays: [1,2,3,4,5,6] },
  });
  await prisma.storeUser.create({ data: { userId: owner2.id, storeId: store2.id, role: StoreUserRoleType.owner } });
  await seedActiveSubscription(store2.id, 180);
  await seedPaymentsForStore(store2.id, owner2.id, 50);
  const staff2 = await seedStoreEmployees(store2.id, passwordHash, "tea");
  await seedStoreData(store2.id, "tea", 12);
  await seedExpenses(store2.id, 12);
  const att2 = await seedAttendance(store2.id, staff2, curY, curM);
  await seedLeaveRequests(store2.id, staff2, owner2.id);
  console.log(`   📊 ${att2} chấm công`);

  // ── CỬA HÀNG 3: Bánh Mì & Croissant ───────────────────────
  console.log("\n🥖 [3/3 main stores] Bánh Mì & Croissant...");
  const owner3 = await prisma.user.create({ data: { name: "Lê Thị Minh Tâm", phone: "0905678901", passwordHash } });
  if (storeOwnerRole) await prisma.userRole.create({ data: { userId: owner3.id, roleId: storeOwnerRole.id } });
  const store3 = await prisma.store.create({
    data: { userId: owner3.id, name: "Bánh Mì & Croissant — Nguyễn Huệ", address: "50 Nguyễn Huệ, Quận 1, TP.HCM", defaultWorkDays: [1,2,3,4,5,6,7] },
  });
  await prisma.storeUser.create({ data: { userId: owner3.id, storeId: store3.id, role: StoreUserRoleType.owner } });
  await seedActiveSubscription(store3.id, 90);
  await seedPaymentsForStore(store3.id, owner3.id, 40);
  const staff3 = await seedStoreEmployees(store3.id, passwordHash, "bakery");
  await seedStoreData(store3.id, "bakery", 9);
  await seedExpenses(store3.id, 9);
  const att3 = await seedAttendance(store3.id, staff3, curY, curM);
  await seedLeaveRequests(store3.id, staff3, owner3.id);
  console.log(`   📊 ${att3} chấm công`);

  // ── BULK STORES: ~47 cửa hàng thêm ────────────────────────
  console.log("\n🏪 Seeding bulk stores (~47 stores)...");
  const storeTypes: ("coffee" | "tea" | "bakery")[] = ["coffee", "coffee", "coffee", "tea", "tea", "bakery"];
  const subStatusOptions: ("ACTIVE" | "TRIAL" | "EXPIRED")[] = ["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE", "TRIAL", "EXPIRED"];

  for (let i = 0; i < 47; i++) {
    const storeType = pick(storeTypes);
    const template = STORE_TEMPLATES.filter((t) => t.type === storeType)[0];
    const storeName = `${template.namePrefix} ${pick(template.suffixes)} ${i + 1}`;
    const address = randomAddress();
    const isMale = Math.random() > 0.4;
    const ownerName = pickName(isMale);
    const ownerPhone = nextPhone();

    // Ngày tạo store — phân tán trong 2 năm
    const createdDaysAgo = randomInt(1, 700);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - createdDaysAgo);
    createdAt.setHours(randomInt(8, 18), randomInt(0, 59), 0, 0);

    const owner = await prisma.user.create({
      data: { name: ownerName, phone: ownerPhone, passwordHash, createdAt },
    });
    if (storeOwnerRole) {
      await prisma.userRole.create({ data: { userId: owner.id, roleId: storeOwnerRole.id } });
    }

    const store = await prisma.store.create({
      data: { userId: owner.id, name: storeName, address, defaultWorkDays: [1,2,3,4,5,6], createdAt },
    });
    await prisma.storeUser.create({ data: { userId: owner.id, storeId: store.id, role: StoreUserRoleType.owner } });

    // Subscription — đa dạng trạng thái
    const subStatus = pick(subStatusOptions);
    if (subStatus === "ACTIVE") {
      const daysLeft = randomInt(10, 360);
      await seedActiveSubscription(store.id, daysLeft);
    } else if (subStatus === "TRIAL") {
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + randomInt(1, 14));
      await prisma.storeSubscription.create({
        data: { storeId: store.id, status: SubscriptionStatus.TRIAL, currentPeriodStart: createdAt, currentPeriodEnd: trialEnds },
      });
    } else {
      const expiredAt = new Date();
      expiredAt.setDate(expiredAt.getDate() - randomInt(1, 90));
      await prisma.storeSubscription.create({
        data: { storeId: store.id, status: SubscriptionStatus.EXPIRED, currentPeriodStart: createdAt, currentPeriodEnd: expiredAt },
      });
    }

    // Payments — phân bổ ngẫu nhiên theo thâm niên store
    const paymentCount = Math.min(Math.floor(createdDaysAgo / 30) * randomInt(1, 4) + randomInt(1, 5), 30);
    await seedPaymentsForStore(store.id, owner.id, paymentCount);

    // Menu + orders — chỉ seed cho store còn active hoặc trial
    const seedDays = subStatus === "EXPIRED" ? 0 : Math.min(createdDaysAgo, 2);
    if (seedDays > 0) {
      await seedStoreData(store.id, storeType, seedDays);
      await seedExpenses(store.id, seedDays);

      const employees = await seedStoreEmployees(store.id, passwordHash, storeType);
      await seedAttendance(store.id, employees, curY, curM);
      if (Math.random() > 0.5) await seedAttendance(store.id, employees, prevY, prevM);
    }

    if ((i + 1) % 10 === 0) {
      console.log(`   ✔ ${i + 1}/47 stores seeded`);
    }
  }

  // ── Tổng kết ───────────────────────────────────────────────
  const allUsers = await prisma.user.count();
  const allStores = await prisma.store.count();
  const allEmployees = await prisma.storeUser.count();
  const allOrders = await prisma.order.count();
  const allOrderItems = await prisma.orderItem.count();
  const allPayments = await prisma.payment.count();
  const allPeriods = await prisma.subscriptionPeriod.count();
  const allAttendances = await prisma.attendance.count();
  const allLeaves = await prisma.leaveRequest.count();
  const allExpenses = await prisma.expense.count();
  const allMenuItems = await prisma.menuItem.count();
  const allTables = await prisma.table.count();

  console.log(`\n${"=".repeat(60)}`);
  console.log("✅ SEED HOÀN TẤT");
  console.log(`${"=".repeat(60)}`);
  console.log(`   👤 Users:              ${allUsers}`);
  console.log(`   🏪 Cửa hàng:           ${allStores}`);
  console.log(`   👥 StoreUsers:         ${allEmployees}`);
  console.log(`   🧾 Đơn hàng:           ${allOrders} (${allOrderItems} items)`);
  console.log(`   💳 Payments:           ${allPayments}`);
  console.log(`   📅 SubscriptionPeriods:${allPeriods}`);
  console.log(`   📋 Chấm công:          ${allAttendances}`);
  console.log(`   📝 Đơn nghỉ:           ${allLeaves}`);
  console.log(`   💰 Phiếu chi:          ${allExpenses}`);
  console.log(`   🍽️  Món:               ${allMenuItems}`);
  console.log(`   🪑 Bàn:                ${allTables}`);
  console.log(`\n${"─".repeat(60)}`);
  console.log("📞 THÔNG TIN ĐĂNG NHẬP CHÍNH");
  console.log(`${"─".repeat(60)}`);
  console.log(`   Admin / CH1:   0901234567 — password123`);
  console.log(`   Chủ CH2:       0903456789 — password123`);
  console.log(`   Chủ CH3:       0905678901 — password123`);
  console.log(`   Bulk stores:   0900000001 ~ ... — password123`);
  console.log(`${"=".repeat(60)}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
