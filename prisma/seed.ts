import {
  PrismaClient,
  StatusType,
  StoreUserRoleType,
  AttendanceStatus,
  LeaveRequestStatus,
  OverrideType,
  SalaryType,
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

const SHIFT_LEAD_EXCLUDE = new Set<string>([
  PERMS.stores.delete,
  PERMS.store_roles.delete,
  PERMS.employees.delete,
  PERMS.expenses.delete,
]);

// ============================================
// QUYỀN NHÂN VIÊN THEO VAI TRÒ
// ============================================

// ============================================
// QUYỀN XEM CHUNG CHO TẤT CẢ NHÂN VIÊN
// ============================================
const PERMS_EMPLOYEE_VIEW = [
  PERMS.areas.list,           // Xem khu vực
  PERMS.categories.list,      // Xem danh mục menu
  PERMS.menu_items.list,      // Xem món
  PERMS.tables.list,          // Xem bàn
  PERMS.statuses.list,        // Xem quy trình/trạng thái đơn
  PERMS.schedule.view,        // Xem lịch làm việc
  PERMS.stores.role_modules,  // Xem mô-đun chức năng
];

/** Thu ngân: Xem menu/bàn, tạo và quản lý đơn hàng, chấm công, xin nghỉ */
const PERMS_THU_NGAN: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.tables.update,        // Cập nhật trạng thái bàn
  PERMS.orders.list,          // Xem danh sách đơn
  PERMS.orders.create,        // Tạo đơn hàng
  PERMS.orders.detail,        // Xem chi tiết đơn
  PERMS.orders.update,        // Sửa đơn
  PERMS.orders.advance,       // Chuyển trạng thái đơn
  PERMS.orders.revert,        // Hoàn tác đơn
  PERMS.attendance.scan,      // Quét QR chấm công (nhân viên tự chấm)
  PERMS.leave.create,         // Tạo đơn nghỉ phép
  // Lưu ý:
  // - attendance.qr (tạo QR): chỉ Quản lý ca / Chủ cửa hàng
  // - attendance.list, leave.list, payroll.list: quyền quản lý xem tất cả
  // - Nhân viên tự xem dữ liệu của mình qua các endpoint /me
];

/** Pha chế: Xem và cập nhật đơn, chuyển trạng thái */
const PERMS_PHA_CHE: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.orders.list,          // Xem đơn hàng
  PERMS.orders.detail,        // Xem chi tiết đơn
  PERMS.orders.update,        // Cập nhật đơn
  PERMS.orders.advance,       // Chuyển trạng thái đơn
  PERMS.orders.revert,        // Hoàn tác
  PERMS.attendance.scan,      // Chấm công
  PERMS.leave.create,         // Xin nghỉ phép
];

/** Phục vụ: Quản lý bàn, tạo đơn, chấm công */
const PERMS_PHUC_VU: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.tables.update,        // Cập nhật bàn
  PERMS.orders.list,          // Xem đơn
  PERMS.orders.create,        // Tạo đơn (gọi món)
  PERMS.orders.detail,        // Xem chi tiết
  PERMS.attendance.scan,      // Chấm công
  PERMS.leave.create,         // Xin nghỉ phép
];

/** Thợ làm bánh: Tương tự pha chế - làm việc trong bếp */
const PERMS_BAKER: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.orders.list,
  PERMS.orders.detail,
  PERMS.orders.update,
  PERMS.orders.advance,
  PERMS.orders.revert,
  PERMS.attendance.scan,
  PERMS.leave.create,
];

/** Barista: Pha cà phê, tạo đơn, quản lý trạng thái */
const PERMS_BARISTA: string[] = [
  ...PERMS_EMPLOYEE_VIEW,
  PERMS.orders.list,
  PERMS.orders.create,
  PERMS.orders.detail,
  PERMS.orders.advance,
  PERMS.orders.revert,
  PERMS.attendance.scan,
  PERMS.leave.create,
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
    console.warn(
      `   ⚠️  Thiếu permission khi tạo vai trò "${name}":`,
      missing.join(", "),
    );
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
  salary?: {
    salaryType: SalaryType;
    baseSalary: number;
    hourlyRate?: number;
    workDays?: number[];
  },
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
      salaryType: salary?.salaryType ?? SalaryType.MONTHLY,
      baseSalary: salary?.baseSalary ?? 7_000_000,
      hourlyRate: salary?.hourlyRate ?? null,
      workDays: salary?.workDays ?? [],
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
  return { user, storeUser };
}

function vnDateOnly(y: number, month: number, day: number): Date {
  // Noon UTC — tránh lệch ngày khi lưu @db.Date
  return new Date(
    `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T12:00:00.000Z`,
  );
}

function vnDateTime(
  y: number,
  month: number,
  day: number,
  h: number,
  min: number,
): Date {
  return new Date(
    `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00+07:00`,
  );
}

function daysInMonth(y: number, month: number): number {
  return new Date(y, month, 0).getDate();
}

/** Ngày hôm nay theo timezone VN (YYYY-MM-DD) */
function todayVnDateString(): string {
  const now = new Date();
  // Tính ngày theo VN: cộng 7 giờ offset, sau đó lấy UTC parts
  const vnOffsetMs = 7 * 60 * 60 * 1000;
  const vnTime = new Date(now.getTime() + vnOffsetMs);
  const y = vnTime.getUTCFullYear();
  const m = String(vnTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vnTime.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prevMonthYear(y: number, m: number) {
  return m <= 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Giờ cao điểm quán (VN business hours). */
const PEAK_ORDER_HOURS = [
  8, 8, 9, 9, 10, 10, 11, 11, 12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 19,
  19, 20, 21,
];

const EXPENSE_IMPORT_TITLES = [
  "Nhập cà phê hạt Arabica",
  "Nhập cà phê Robusta",
  "Nhập sữa tươi",
  "Nhập sữa đặc",
  "Nhập trà ô long",
  "Nhập đào ngâm",
  "Nhập vải thiều",
  "Nhập đường cát",
  "Nhập ly nhựa ống hút",
  "Nhập topping trân châu",
  "Nhập thạch dừa",
  "Nhập kem tươi",
  "Nhập bột matcha",
  "Nhập nước cốt dừa",
  "Nhập siro đường đen",
  "Nhập đá viên",
  "Nhập bột cacao",
  "Nhập hạnh nhân lát",
  "Nhập trái cây tươi",
  "Nhập bột bánh kem",
];

const EXPENSE_OPERATING_TITLES = [
  "Tiền điện",
  "Tiền nước",
  "Tiền internet",
  "Bảo trì máy pha",
  "Quảng cáo Facebook",
  "Phí POS",
  "Mua khăn giấy",
  "Mua hộp mang về",
  "Thuê ship giao hàng",
  "Mua nước rửa chén",
];

const VIETNAMESE_NAMES_MALE = [
  "Nguyễn Văn An",
  "Trần Văn Bình",
  "Lê Quốc Huy",
  "Phạm Minh Tuấn",
  "Hoàng Đức Hiếu",
  "Vũ Đình Khang",
  "Đặng Công Thành",
  "Bùi Tiến Dũng",
  "Đỗ Hoàng Long",
  "Hồ Đức Mạnh",
  "Ngô Văn Phát",
  "Dương Chí Công",
  "Lâm Quốc Thắng",
  "Mai Đình Nghĩa",
  "Tạ Văn Tài",
];
const VIETNAMESE_NAMES_FEMALE = [
  "Nguyễn Thị Mai",
  "Trần Thị Lan",
  "Lê Minh Anh",
  "Phạm Thu Hà",
  "Hoàng Thu Giang",
  "Vũ Thị Hạnh",
  "Đặng Ngọc Linh",
  "Bùi Thanh Hương",
  "Đỗ Thị Quỳnh",
  "Hồ Ngọc Trâm",
  "Ngô Bích Ngọc",
  "Dương Hồng Nhung",
  "Lâm Khánh Vy",
  "Mai Phương Thảo",
  "Tạ Hoàng Yến",
];
const VIETNAMESE_PHONES = [
  "0901111111",
  "0901111112",
  "0901111113",
  "0901111114",
  "0901111115",
  "0901111116",
  "0901111117",
  "0901111118",
  "0901111119",
  "0901111120",
  "0901111121",
  "0901111122",
  "0901111123",
  "0901111124",
  "0901111125",
  "0901111126",
  "0901111127",
  "0901111128",
  "0901111129",
  "0901111130",
  "0901111131",
  "0901111132",
  "0901111133",
  "0901111134",
  "0901111135",
];

let phoneIdx = 0;
function nextPhone(): string {
  return VIETNAMESE_PHONES[phoneIdx++ % VIETNAMESE_PHONES.length];
}
function nextName(male = true): string {
  return male ? pick(VIETNAMESE_NAMES_MALE) : pick(VIETNAMESE_NAMES_FEMALE);
}

async function seedStoreStaff(
  storeId: number,
  passwordHash: string,
  configs: {
    roleName: string;
    perms: string[];
  }[],
  employees: {
    name: string;
    phone: string;
    male: boolean;
    roleNames: string[];
    salary: {
      salaryType: SalaryType;
      baseSalary: number;
      hourlyRate?: number;
      workDays?: number[];
    };
  }[],
) {
  const roleMap = new Map<string, { id: number }>();
  for (const cfg of configs) {
    const role = await createStoreRoleWithPermissions(
      storeId,
      cfg.roleName,
      cfg.perms,
    );
    roleMap.set(cfg.roleName, role);
  }

  const results: { user: { id: number }; storeUser: { id: number } }[] = [];
  for (const emp of employees) {
    const roleIds = emp.roleNames.map((rn) => roleMap.get(rn)!.id);
    const result = await addEmployeeToStore(
      storeId,
      passwordHash,
      emp,
      roleIds,
      emp.salary,
    );
    results.push(result);
  }
  return results;
}

async function seedOrderlyCoffee(storeId: number, passwordHash: string) {
  console.log(`\n☕ Seed Orderly Coffee & Tea #${storeId}...`);

  const staff = await seedStoreStaff(
    storeId,
    passwordHash,
    [
      { roleName: "Thu ngân", perms: PERMS_THU_NGAN },
      { roleName: "Pha chế", perms: PERMS_PHA_CHE },
      { roleName: "Phục vụ", perms: PERMS_PHUC_VU },
      {
        roleName: "Quản lý ca",
        perms: STORE_OWNER_PERMS.filter((c) => !SHIFT_LEAD_EXCLUDE.has(c)),
      },
    ],
    [
      {
        name: "Nguyễn Thị Mai",
        phone: nextPhone(),
        male: false,
        roleNames: ["Thu ngân"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 8_000_000 },
      },
      {
        name: "Trần Văn Hùng",
        phone: nextPhone(),
        male: true,
        roleNames: ["Pha chế"],
        salary: {
          salaryType: SalaryType.HOURLY,
          baseSalary: 0,
          hourlyRate: 55_000,
          workDays: [1, 2, 3, 4, 5],
        },
      },
      {
        name: "Lê Minh Anh",
        phone: nextPhone(),
        male: false,
        roleNames: ["Phục vụ", "Thu ngân"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 7_000_000 },
      },
      {
        name: "Phạm Quốc Bảo",
        phone: nextPhone(),
        male: true,
        roleNames: ["Quản lý ca"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 12_000_000 },
      },
      {
        name: "Hoàng Thu Giang",
        phone: nextPhone(),
        male: false,
        roleNames: ["Pha chế", "Phục vụ"],
        salary: {
          salaryType: SalaryType.MONTHLY,
          baseSalary: 7_500_000,
          workDays: [1, 2, 3, 4, 5],
        },
      },
      {
        name: "Đỗ Văn Kiên",
        phone: nextPhone(),
        male: true,
        roleNames: ["Thu ngân"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 8_500_000 },
      },
    ],
  );

  console.log(
    `   ✔ 6 nhân viên (SĐT: ${staff.map((s) => s.user.id).join(", ")}, pass: password123)`,
  );
  return staff.map((s) => s.storeUser.id);
}

async function seedBonBon(storeId: number, passwordHash: string) {
  console.log(`\n🧋 Seed Trà Sữa Bon Bon #${storeId}...`);

  const staff = await seedStoreStaff(
    storeId,
    passwordHash,
    [
      { roleName: "Thu ngân", perms: PERMS_THU_NGAN },
      { roleName: "Pha chế", perms: PERMS_PHA_CHE },
    ],
    [
      {
        name: "Nguyễn Ngọc Lan",
        phone: nextPhone(),
        male: false,
        roleNames: ["Thu ngân"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 7_200_000 },
      },
      {
        name: "Trịnh Anh Tú",
        phone: nextPhone(),
        male: true,
        roleNames: ["Pha chế", "Thu ngân"],
        salary: {
          salaryType: SalaryType.HOURLY,
          baseSalary: 0,
          hourlyRate: 50_000,
          workDays: [1, 2, 3, 4, 5, 6],
        },
      },
      {
        name: "Lê Thị Ngọc",
        phone: nextPhone(),
        male: false,
        roleNames: ["Pha chế"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 6_800_000 },
      },
    ],
  );

  console.log(`   ✔ 3 nhân viên`);
  return staff.map((s) => s.storeUser.id);
}

async function seedBakery(storeId: number, passwordHash: string) {
  console.log(`\n🥖 Seed Bánh Mì & Croissant #${storeId}...`);

  const staff = await seedStoreStaff(
    storeId,
    passwordHash,
    [
      { roleName: "Thu ngân", perms: PERMS_THU_NGAN },
      { roleName: "Thợ làm bánh", perms: PERMS_BAKER },
      { roleName: "Barista", perms: PERMS_BARISTA },
    ],
    [
      {
        name: "Phan Thị Hồng",
        phone: nextPhone(),
        male: false,
        roleNames: ["Thu ngân"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 7_500_000 },
      },
      {
        name: "Nguyễn Hoàng Nam",
        phone: nextPhone(),
        male: true,
        roleNames: ["Thợ làm bánh"],
        salary: {
          salaryType: SalaryType.HOURLY,
          baseSalary: 0,
          hourlyRate: 60_000,
          workDays: [1, 2, 3, 4, 5, 6],
        },
      },
      {
        name: "Vũ Thị Hạnh",
        phone: nextPhone(),
        male: false,
        roleNames: ["Thợ làm bánh", "Barista"],
        salary: {
          salaryType: SalaryType.MONTHLY,
          baseSalary: 8_000_000,
          workDays: [1, 2, 3, 4, 5],
        },
      },
      {
        name: "Đặng Minh Quân",
        phone: nextPhone(),
        male: true,
        roleNames: ["Barista", "Thu ngân"],
        salary: { salaryType: SalaryType.MONTHLY, baseSalary: 7_000_000 },
      },
    ],
  );

  console.log(`   ✔ 4 nhân viên`);
  return staff.map((s) => s.storeUser.id);
}

async function seedScheduleOverrides(storeId: number) {
  // Lấy ngày hôm nay theo timezone VN
  const todayStr = todayVnDateString();
  const [y, m] = todayStr.split('-').map(Number);

  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const dt = new Date(y, m - 1, d);
    if (dt.getDay() === 0) {
      await prisma.scheduleOverride
        .create({
          data: {
            storeId,
            date: vnDateOnly(y, m, d),
            type: OverrideType.WORKING_DAY,
          },
        })
        .catch(() => {});
      break;
    }
  }

  for (let d = 1; d <= daysInMonth(y, m); d++) {
    const dt = new Date(y, m - 1, d);
    if (dt.getDay() === 3) {
      await prisma.scheduleOverride
        .create({
          data: { storeId, date: vnDateOnly(y, m, d), type: OverrideType.OFF },
        })
        .catch(() => {});
      break;
    }
  }
}

async function seedAttendance(
  storeId: number,
  employeeIds: number[],
  y: number,
  m: number,
) {
  // Lấy ngày hôm nay theo timezone VN (+07:00)
  const todayStr = todayVnDateString();
  const [todayY, todayM, todayD] = todayStr.split('-').map(Number);
  const todayDate = new Date(todayY, todayM - 1, todayD);
  const seedMonthDate = new Date(y, m - 1, 1);

  // Nếu tháng seed là tháng tương lai → không seed
  if (seedMonthDate > todayDate) {
    return 0;
  }

  const configs = [
    {
      empIdx: 0,
      workDays: [1, 2, 3, 4, 5, 6],
      startHour: 8,
      startMin: 0,
      endHour: 17,
      endMin: 0,
      mins: 480,
      ratio: 0.95,
    },
    {
      empIdx: 1,
      workDays: [1, 2, 3, 4, 5],
      startHour: 9,
      startMin: 0,
      endHour: 18,
      endMin: 0,
      mins: 480,
      ratio: 0.8,
    },
    {
      empIdx: 2,
      workDays: [1, 2, 3, 4, 5, 6],
      startHour: 7,
      startMin: 30,
      endHour: 16,
      endMin: 30,
      mins: 480,
      ratio: 0.9,
    },
    {
      empIdx: 3,
      workDays: [1, 2, 3, 4, 5, 6],
      startHour: 8,
      startMin: 0,
      endHour: 18,
      endMin: 0,
      mins: 540,
      ratio: 0.85,
    },
    {
      empIdx: 4,
      workDays: [1, 2, 3, 4, 5],
      startHour: 8,
      startMin: 30,
      endHour: 17,
      endMin: 30,
      mins: 480,
      ratio: 0.9,
    },
    {
      empIdx: 5,
      workDays: [1, 2, 3, 4, 5, 6],
      startHour: 8,
      startMin: 0,
      endHour: 17,
      endMin: 0,
      mins: 480,
      ratio: 0.85,
    },
  ];

  const rows: Prisma.AttendanceCreateManyInput[] = [];
  const dim = daysInMonth(y, m);

  // Chỉ seed đến ngày hiện tại hoặc cuối tháng
  const maxDay = m === todayM && y === todayY
    ? todayD
    : dim;

  for (let idx = 0; idx < employeeIds.length && idx < configs.length; idx++) {
    const cfg = configs[idx];
    const eid = employeeIds[idx];
    if (!eid) continue;

    const daysOff = new Set<number>();
    const paidLeaveDays = new Set<number>();
    const unpaidLeaveDays = new Set<number>();

    if (idx === 0) {
      paidLeaveDays.add(Math.min(maxDay, 14));
    }
    if (idx === 1) {
      paidLeaveDays.add(7);
      paidLeaveDays.add(8);
    }
    if (idx === 2) {
      unpaidLeaveDays.add(Math.min(maxDay, 16));
    }
    if (idx === 4) {
      paidLeaveDays.add(Math.min(maxDay, 11));
      paidLeaveDays.add(Math.min(maxDay, 12));
    }
    if (idx === 5 && maxDay >= 20) {
      daysOff.add(3);
      daysOff.add(4);
      daysOff.add(5);
    }

    for (let d = 1; d <= maxDay; d++) {
      const dt = new Date(y, m - 1, d);
      const wd = dt.getDay() === 0 ? 7 : dt.getDay();
      if (!cfg.workDays.includes(wd)) continue;
      if (daysOff.has(d)) continue;

      // Ngày hiện tại: bỏ qua để test chấm công QR
      const isToday = d === todayD && m === todayM && y === todayY;

      if (paidLeaveDays.has(d)) {
        rows.push({
          employeeId: eid,
          date: vnDateOnly(y, m, d),
          checkIn: null,
          checkOut: null,
          workMinutes: null,
          status: AttendanceStatus.PAID_LEAVE,
        });
        continue;
      }
      if (unpaidLeaveDays.has(d)) {
        rows.push({
          employeeId: eid,
          date: vnDateOnly(y, m, d),
          checkIn: null,
          checkOut: null,
          workMinutes: null,
          status: AttendanceStatus.UNPAID_LEAVE,
        });
        continue;
      }

      if (Math.random() > cfg.ratio) continue;

      const late = Math.random() < 0.15 ? randomInt(5, 30) : 0;
      const early = Math.random() < 0.1 ? randomInt(5, Math.min(20, cfg.endMin)) : 0;
      const actualMins = Math.max(0, cfg.mins - late - early);
      const cin = vnDateTime(y, m, d, cfg.startHour, Math.min(59, cfg.startMin + late));

      if (isToday) {
        // Bỏ qua ngày hiện tại để nhân viên có thể test chấm công QR
        continue;
      }

      // Các ngày trước đó: tạo đầy đủ check-in/check-out
      const cout = vnDateTime(y, m, d, cfg.endHour, Math.max(0, cfg.endMin - early));
      rows.push({
        employeeId: eid,
        date: vnDateOnly(y, m, d),
        checkIn: cin,
        checkOut: cout,
        workMinutes: actualMins,
        status: AttendanceStatus.WORK,
      });
    }
  }

  if (rows.length > 0) {
    await prisma.attendance.createMany({ data: rows });
  }
  return rows.length;
}

async function seedLeaveRequests(
  storeId: number,
  employeeIds: number[],
  reviewerId: number,
) {
  // Lấy ngày hôm nay theo timezone VN
  const todayStr = todayVnDateString();
  const [y, m, today] = todayStr.split('-').map(Number);

  // Tháng tiếp theo cho đơn PENDING (xin nghỉ sắp tới)
  const nm = m >= 12 ? 1 : m + 1;
  const ny = m >= 12 ? y + 1 : y;

  const leaves: Prisma.LeaveRequestCreateManyInput[] = [];

  // Đơn xin nghỉ tương lai (tháng sau) - PENDING
  if (employeeIds[0]) {
    leaves.push({
      storeId,
      employeeId: employeeIds[0],
      fromDate: vnDateOnly(ny, nm, 2),
      toDate: vnDateOnly(ny, nm, 4),
      isPaid: true,
      reason: "Nghỉ phép năm đi du lịch Đà Lạt",
      status: LeaveRequestStatus.PENDING,
    });
  }

  // Đơn trong tháng hiện tại - chỉ tạo nếu ngày chưa qua
  if (employeeIds[2] && today > 5) {
    // Đơn bị từ chối (ngày đã qua)
    leaves.push({
      storeId,
      employeeId: employeeIds[2],
      fromDate: vnDateOnly(y, m, Math.max(1, today - 5)),
      toDate: vnDateOnly(y, m, Math.max(1, today - 5)),
      isPaid: false,
      reason: "Việc gia đình đột xuất",
      status: LeaveRequestStatus.REJECTED,
      reviewedBy: reviewerId,
    });
  }

  if (employeeIds[1] && today > 8) {
    // Đơn đã duyệt (ngày đã qua)
    leaves.push({
      storeId,
      employeeId: employeeIds[1],
      fromDate: vnDateOnly(y, m, Math.max(1, today - 8)),
      toDate: vnDateOnly(y, m, Math.max(1, today - 7)),
      isPaid: true,
      reason: "Ốm đau — nghỉ bù",
      status: LeaveRequestStatus.APPROVED,
      reviewedBy: reviewerId,
    });
  }

  // Đơn xin nghỉ tương lai (tháng sau) - PENDING
  if (employeeIds[3]) {
    leaves.push({
      storeId,
      employeeId: employeeIds[3],
      fromDate: vnDateOnly(ny, nm, 10),
      toDate: vnDateOnly(ny, nm, 12),
      isPaid: true,
      reason: "Đám cưới bạn thân",
      status: LeaveRequestStatus.PENDING,
    });
  }

  if (employeeIds[4] && today > 10) {
    // Đơn đã duyệt (ngày đã qua)
    leaves.push({
      storeId,
      employeeId: employeeIds[4],
      fromDate: vnDateOnly(y, m, Math.max(1, today - 10)),
      toDate: vnDateOnly(y, m, Math.max(1, today - 9)),
      isPaid: true,
      reason: "Khám sức khỏe định kỳ",
      status: LeaveRequestStatus.APPROVED,
      reviewedBy: reviewerId,
    });
  }

  // Đơn xin nghỉ tương lai (tháng sau) - PENDING
  if (employeeIds[5]) {
    leaves.push({
      storeId,
      employeeId: employeeIds[5],
      fromDate: vnDateOnly(ny, nm, 15),
      toDate: vnDateOnly(ny, nm, 15),
      isPaid: false,
      reason: "Việc riêng — không lương",
      status: LeaveRequestStatus.PENDING,
    });
  }

  if (leaves.length > 0) {
    await prisma.leaveRequest.createMany({ data: leaves });
  }
  return leaves.length;
}

async function seedStoreData(
  storeId: number,
  menuType: "coffee" | "tea" | "bakery",
) {
  const statuses = [
    { storeId, name: "Chờ xử lý", type: StatusType.start, sortOrder: 1 },
    { storeId, name: "Đang pha chế", type: StatusType.mid, sortOrder: 5 },
    { storeId, name: "Kiểm tra", type: StatusType.mid, sortOrder: 10 },
    { storeId, name: "Đóng gói", type: StatusType.mid, sortOrder: 15 },
    { storeId, name: "Hoàn thành", type: StatusType.end, sortOrder: 20 },
  ];
  await prisma.status.createMany({ data: statuses });

  const menuData: Record<
    string,
    { items: { name: string; price: number }[]; sort: number }
  > =
    menuType === "coffee"
      ? {
          "Cà phê Việt Nam": {
            sort: 1,
            items: [
              { name: "Cà phê Đen Đá", price: 29000 },
              { name: "Cà phê Sữa Đá", price: 35000 },
              { name: "Bạc Xỉu", price: 39000 },
              { name: "Cà phê Muối", price: 45000 },
              { name: "Cà phê Trứng", price: 55000 },
            ],
          },
          "Cà phê pha máy": {
            sort: 2,
            items: [
              { name: "Espresso", price: 35000 },
              { name: "Americano", price: 40000 },
              { name: "Cappuccino", price: 50000 },
              { name: "Latte", price: 50000 },
              { name: "Caramel Macchiato", price: 55000 },
              { name: "Mocha", price: 55000 },
            ],
          },
          "Trà trái cây": {
            sort: 3,
            items: [
              { name: "Trà Đào Cam Sả", price: 45000 },
              { name: "Trà Vải Nhiệt Đới", price: 45000 },
              { name: "Trà Olong Sen Vàng", price: 50000 },
              { name: "Trà Sữa Trân Châu Đường Đen", price: 45000 },
              { name: "Trà Sữa Nướng", price: 49000 },
              { name: "Trà Chanh Dây", price: 42000 },
            ],
          },
          "Đá xay": {
            sort: 4,
            items: [
              { name: "Matcha Đá Xay", price: 55000 },
              { name: "Cookies & Cream", price: 55000 },
              { name: "Chocolate Đá Xay", price: 55000 },
              { name: "Dâu Tây Đá Xay", price: 55000 },
            ],
          },
          "Bánh ngọt": {
            sort: 5,
            items: [
              { name: "Bánh Croissant bơ tỏi", price: 35000 },
              { name: "Tiramisu", price: 45000 },
              { name: "Mousse Chanh Dây", price: 40000 },
              { name: "Cheesecake Dâu", price: 50000 },
              { name: "Bánh Flan Caramel", price: 25000 },
            ],
          },
        }
      : menuType === "tea"
        ? {
            "Trà sữa": {
              sort: 1,
              items: [
                { name: "Trà Sữa Trân Châu Đường Đen", price: 42000 },
                { name: "Trà Sữa Okinawa", price: 45000 },
                { name: "Trà Sữa Matcha", price: 48000 },
                { name: "Trà Sữa Khoai Môn", price: 45000 },
              ],
            },
            "Trà trái cây": {
              sort: 2,
              items: [
                { name: "Trà Đào Cam Sả", price: 42000 },
                { name: "Trà Vải", price: 42000 },
                { name: "Trà Ổi Hồng", price: 45000 },
                { name: "Trà Táo Đỏ", price: 45000 },
              ],
            },
            Topping: {
              sort: 3,
              items: [
                { name: "Trân châu đen", price: 8000 },
                { name: "Trân châu trắng", price: 8000 },
                { name: "Thạch dừa", price: 8000 },
                { name: "Pudding", price: 10000 },
                { name: "Hạt é", price: 5000 },
              ],
            },
            "Đá xay": {
              sort: 4,
              items: [
                { name: "Sinh tố Bơ", price: 45000 },
                { name: "Sinh tố Dâu", price: 40000 },
                { name: "Đá xay Sầu Riêng", price: 55000 },
              ],
            },
          }
        : {
            "Bánh mì Âu": {
              sort: 1,
              items: [
                { name: "Bánh Mì Bơ Tỏi", price: 25000 },
                { name: "Croissant trứng muối", price: 40000 },
                { name: "Bánh Mì Que Pate", price: 30000 },
                { name: "Bánh Mì Sốt Bò Bít Tết", price: 55000 },
              ],
            },
            "Bánh ngọt": {
              sort: 2,
              items: [
                { name: "Tiramisu", price: 45000 },
                { name: "Bánh Mousse Xoài", price: 42000 },
                { name: "Cheesecake Đào", price: 50000 },
                { name: "Bánh Opera Socola", price: 55000 },
                { name: "Macaron nhiều vị", price: 35000 },
              ],
            },
            "Bánh mặn": {
              sort: 3,
              items: [
                { name: "Pizza Mini Nhân Thịt", price: 45000 },
                { name: "Bánh Hamburger Bò", price: 55000 },
                { name: "Hotdog Phô Mai", price: 35000 },
                { name: "Bánh Pastel Nhân Gà", price: 40000 },
              ],
            },
            "Đồ uống": {
              sort: 4,
              items: [
                { name: "Americano", price: 35000 },
                { name: "Latte", price: 45000 },
                { name: "Cappuccino", price: 45000 },
                { name: "Chocolate Nóng", price: 40000 },
                { name: "Matcha Latte", price: 45000 },
              ],
            },
          };

  const catIds: number[] = [];
  for (const [catName, catDef] of Object.entries(menuData)) {
    const cat = await prisma.category.create({
      data: { storeId, name: catName, sortOrder: catDef.sort },
    });
    catIds.push(cat.id);
    await prisma.menuItem.createMany({
      data: catDef.items.map((item) => ({ categoryId: cat.id, ...item })),
    });
  }

  const areaNames =
    menuType === "bakery"
      ? ["Trong nhà", "Ngoài sân", "Quầy bánh", "Khu VIP"]
      : ["Tầng 1", "Tầng 2", "Sân vườn", "Quầy Bar"];

  const areaIdMap = new Map<string, number>();
  for (let i = 0; i < areaNames.length; i++) {
    const area = await prisma.area.create({
      data: { storeId, name: areaNames[i], sortOrder: i + 1 },
    });
    areaIdMap.set(areaNames[i], area.id);
  }

  const tableLabels =
    menuType === "bakery"
      ? {
          "Trong nhà": ["Bàn TN1", "Bàn TN2", "Bàn TN3", "Bàn TN4", "Bàn TN5"],
          "Ngoài sân": ["Bàn NS1", "Bàn NS2", "Bàn NS3"],
          "Quầy bánh": ["Ghế Q1", "Ghế Q2", "Ghế Q3", "Ghế Q4"],
          "Khu VIP": ["Bàn VIP1", "Bàn VIP2"],
        }
      : {
          "Tầng 1": [
            "Bàn 101",
            "Bàn 102",
            "Bàn 103",
            "Bàn 104",
            "Bàn 105",
            "Bàn 106",
          ],
          "Tầng 2": [
            "Bàn 201",
            "Bàn 202",
            "Bàn 203",
            "Bàn 204",
            "Bàn 205",
            "Bàn 206",
            "Bàn 207",
            "Bàn 208",
          ],
          "Sân vườn": ["Bàn SV1", "Bàn SV2", "Bàn SV3", "Bàn SV4", "Bàn SV5"],
          "Quầy Bar": ["Ghế Bar 1", "Ghế Bar 2", "Ghế Bar 3", "Ghế Bar 4"],
        };

  const tableIdsByArea = new Map<number, number[]>();
  for (const [areaName, tables] of Object.entries(tableLabels)) {
    const areaId = areaIdMap.get(areaName)!;
    const ids: number[] = [];
    for (let i = 0; i < tables.length; i++) {
      const table = await prisma.table.create({
        data: { areaId, name: tables[i], sortOrder: i + 1 },
      });
      ids.push(table.id);
    }
    tableIdsByArea.set(areaId, ids);
  }

  const allTableIds = [...tableIdsByArea.values()].flat();
  const menuItems = await prisma.menuItem.findMany({
    where: { category: { storeId } },
  });
  const orderStatuses = await prisma.status.findMany({
    where: { storeId },
    orderBy: { sortOrder: "asc" },
  });

  const endStatus = orderStatuses.find((s) => s.type === StatusType.end);
  const pipelineStatuses = orderStatuses.filter((s) => s.type !== StatusType.end);
  if (!endStatus || menuItems.length === 0) {
    console.log(
      `   ✔ ${Object.keys(menuData).length} DM, ${menuItems.length} món, ${areaNames.length} KV, ${allTableIds.length} bàn, 0 đơn`,
    );
    return { tableIds: allTableIds, menuItems, orderStatuses };
  }

  const tableRows = await prisma.table.findMany({
    where: { id: { in: allTableIds } },
    select: { id: true, name: true },
  });
  const tableNameById = new Map(tableRows.map((t) => [t.id, t.name]));

  const orderEntries: {
    storeId: number;
    tableId: number | null;
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

  const SEED_DAYS = 56;
  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  const pushOrder = (
    status: { id: number; name: string },
    daysAgo: number,
    atTable: boolean,
  ) => {
    const orderIdx = orderEntries.length;
    const orderDate = new Date(todayUtc);
    orderDate.setUTCDate(orderDate.getUTCDate() - daysAgo);
    orderDate.setUTCHours(
      pick(PEAK_ORDER_HOURS),
      randomInt(0, 59),
      randomInt(0, 59),
      0,
    );

    const useTable = atTable && allTableIds.length > 0 && Math.random() < 0.72;
    const tableId = useTable ? pick(allTableIds) : null;
    const tableSnapshot =
      tableId != null ? (tableNameById.get(tableId) ?? null) : null;

    orderEntries.push({
      storeId,
      tableId,
      tableSnapshot,
      statusId: status.id,
      statusSnapshot: status.name,
      createdAt: orderDate,
    });

    const itemCount = randomInt(2, 4);
    const usedIndices = new Set<number>();
    for (let j = 0; j < itemCount; j++) {
      let idx: number;
      do {
        idx = randomInt(0, menuItems.length - 1);
      } while (usedIndices.has(idx));
      usedIndices.add(idx);
      const mi = menuItems[idx];
      orderItemEntries.push({
        orderIdx,
        statusId: status.id,
        statusSnapshot: status.name,
        nameSnapshot: mi.name,
        priceSnapshot: Number(mi.price),
        qty: randomInt(1, 2),
      });
    }
  };

  for (let daysAgo = 0; daysAgo < SEED_DAYS; daysAgo++) {
    const day = new Date(todayUtc);
    day.setUTCDate(day.getUTCDate() - daysAgo);
    const weekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
    const completedPerDay = weekend ? randomInt(14, 24) : randomInt(9, 17);

    for (let i = 0; i < completedPerDay; i++) {
      pushOrder(endStatus, daysAgo, true);
    }

    if (daysAgo <= 2) {
      const openPerDay = randomInt(1, 3);
      for (let i = 0; i < openPerDay; i++) {
        pushOrder(pick(pipelineStatuses), daysAgo, Math.random() < 0.85);
      }
    }
  }

  const totalOrders = orderEntries.length;
  let completedRevenue = 0;
  for (const item of orderItemEntries) {
    if (orderEntries[item.orderIdx].statusId === endStatus.id) {
      completedRevenue += item.priceSnapshot * item.qty;
    }
  }

  await prisma.$transaction(async (tx) => {
    const createdOrders = await Promise.all(
      orderEntries.map((o) => tx.order.create({ data: o })),
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

    for (let i = 0; i < createdOrders.length; i++) {
      const entry = orderEntries[i];
      const created = createdOrders[i];
      if (
        entry.statusId !== endStatus.id &&
        entry.tableId != null &&
        Math.random() < 0.9
      ) {
        await tx.table.update({
          where: { id: entry.tableId },
          data: { orderId: created.id },
        });
      }
    }
  });

  const profitHint =
    completedRevenue > 0
      ? `, DT đóng ~${(completedRevenue / 1_000_000).toFixed(1)}M`
      : "";
  console.log(
    `   ✔ ${Object.keys(menuData).length} DM, ${menuItems.length} món, ${areaNames.length} KV, ${allTableIds.length} bàn, ${totalOrders} đơn${profitHint}`,
  );

  return { tableIds: allTableIds, menuItems, orderStatuses };
}

async function seedExpenses(storeId: number) {
  const endStatus = await prisma.status.findFirst({
    where: { storeId, type: StatusType.end },
    select: { id: true },
  });
  if (!endStatus) return 0;

  const now = new Date();
  const todayUtc = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  const rangeStart = new Date(todayUtc);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 55);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        storeId,
        statusId: endStatus.id,
        createdAt: {
          gte: rangeStart,
          lt: new Date(todayUtc.getTime() + 86400000),
        },
      },
    },
    select: { priceSnapshot: true, qty: true },
  });

  let revenue = 0;
  for (const row of orderItems) {
    revenue += row.priceSnapshot * row.qty;
  }
  if (revenue < 1_000_000) {
    revenue = 25_000_000;
  }

  const expenseRatio = 0.34 + Math.random() * 0.08;
  const totalExpense = Math.round(revenue * expenseRatio);
  const lineCount = randomInt(72, 98);
  const weights = Array.from({ length: lineCount }, () => randomInt(40, 100));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  const rows: Prisma.ExpenseCreateManyInput[] = [];
  let allocated = 0;

  for (let i = 0; i < lineCount; i++) {
    const isLast = i === lineCount - 1;
    const amount = isLast
      ? totalExpense - allocated
      : Math.round((weights[i]! / weightSum) * totalExpense);
    allocated += amount;

    const daysAgo = randomInt(0, 55);
    const rawDate = new Date(todayUtc);
    rawDate.setUTCDate(rawDate.getUTCDate() - daysAgo);
    const createdAt = new Date(rawDate);
    createdAt.setUTCHours(randomInt(8, 19), randomInt(0, 59), 0, 0);

    const isImport = Math.random() < 0.68;
    const title = isImport
      ? pick(EXPENSE_IMPORT_TITLES)
      : pick(EXPENSE_OPERATING_TITLES);

    rows.push({
      storeId,
      title,
      amount: Math.max(50_000, amount),
      rawDate,
      createdAt,
    });
  }

  await prisma.expense.createMany({ data: rows });

  const actualExpense = rows.reduce((s, r) => s + r.amount, 0);
  const profit = revenue - actualExpense;
  console.log(
    `   💰 Chi: ${rows.length} phiếu, tổng ${(actualExpense / 1_000_000).toFixed(1)}M / DT ${(revenue / 1_000_000).toFixed(1)}M → LN ~${(profit / 1_000_000).toFixed(1)}M`,
  );

  return rows.length;
}

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu mẫu...\n");

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
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
    );
  } catch {
    console.log("   ⚠️ TRUNCATE lỗi, dùng deleteMany...");
    // Xóa theo thứ tự: bảng con trước, bảng cha sau (tránh lỗi khóa ngoại)
    for (const model of [
      // Bảng liên kết many-to-many và log
      "userRole",
      "rolePermission",
      "storeUserRole",
      "storeRolePermission",
      "attendanceEditLog",
      // Bảng dữ liệu chính
      "orderItem",
      "order",
      "expense",
      "attendance",
      "payrollSnapshot",
      "leaveRequest",
      "scheduleOverride",
      "table",
      "menuItem",
      "category",
      "area",
      "status",
      "storeUser",
      "storeRole",
      "store",
      "user",
      "role",
      "permission",
    ] as const) {
      await (prisma as any)[model].deleteMany();
    }
  }
  console.log("   ✔ Đã xóa dữ liệu cũ");

  await bootstrapRbac();
  console.log("🔐 Đã đồng bộ RBAC\n");

  const passwordHash = await bcrypt.hash("password123", 12);

  // ── Admin ──────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: { name: "Trần Trọng Nam", phone: "0901234567", passwordHash },
  });
  const adminRole = await prisma.role.findUnique({
    where: { code: ROLE_DEFS.ADMIN.code },
  });
  if (adminRole) {
    await prisma.userRole.create({
      data: { userId: admin.id, roleId: adminRole.id },
    });
  }
  console.log(`👤 Admin: ${admin.name} (0901234567)`);

  // ── CỬA HÀNG 1: Orderly Coffee & Tea ───────────────────────
  const store1 = await prisma.store.create({
    data: {
      userId: admin.id,
      name: "Orderly Coffee & Tea",
      address: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
      defaultWorkDays: [1, 2, 3, 4, 5, 6],
    },
  });
  await prisma.storeUser.create({
    data: {
      userId: admin.id,
      storeId: store1.id,
      role: StoreUserRoleType.owner,
    },
  });

  const staff1 = await seedOrderlyCoffee(store1.id, passwordHash);
  await seedScheduleOverrides(store1.id);
  await seedStoreData(store1.id, "coffee");
  const expCount1 = await seedExpenses(store1.id);

  // Lấy ngày hiện tại theo timezone VN
  const todayStr = todayVnDateString();
  const [curY, curM] = todayStr.split('-').map(Number);
  const { y: prevY, m: prevM } = prevMonthYear(curY, curM);

  const attCur1 = await seedAttendance(store1.id, staff1, curY, curM);
  const attPrev1 = await seedAttendance(store1.id, staff1, prevY, prevM);
  const leaveCount1 = await seedLeaveRequests(store1.id, staff1, admin.id);

  try {
    await lockPayroll(store1.id, { month: prevM, year: prevY });
    console.log(`   ✔ Đã khóa lương ${prevM}/${prevY}`);
  } catch {
    /* ok */
  }

  console.log(
    `   📊 ${attCur1 + attPrev1} chấm công, ${leaveCount1} đơn nghỉ, ${expCount1} phiếu chi`,
  );

  // ── CỬA HÀNG 2: Trà Sữa Bon Bon ───────────────────────────
  const owner2 = await prisma.user.create({
    data: { name: "Võ Hồng Phúc", phone: "0903456789", passwordHash },
  });
  const storeOwnerRole = await prisma.role.findUnique({
    where: { code: ROLE_DEFS.STORE_OWNER.code },
  });
  if (storeOwnerRole) {
    await prisma.userRole.create({
      data: { userId: owner2.id, roleId: storeOwnerRole.id },
    });
  }

  const store2 = await prisma.store.create({
    data: {
      userId: owner2.id,
      name: "Trà Sữa Bon Bon",
      address: "415 Lê Văn Sỹ, Phường 12, Quận 3, TP.HCM",
      defaultWorkDays: [1, 2, 3, 4, 5, 6],
    },
  });
  await prisma.storeUser.create({
    data: {
      userId: owner2.id,
      storeId: store2.id,
      role: StoreUserRoleType.owner,
    },
  });

  const staff2 = await seedBonBon(store2.id, passwordHash);
  await seedStoreData(store2.id, "tea");
  const expCount2 = await seedExpenses(store2.id);
  const att2 = await seedAttendance(store2.id, staff2, curY, curM);
  await seedLeaveRequests(store2.id, staff2, owner2.id);
  console.log(`   📊 ${att2} chấm công, ${expCount2} phiếu chi`);

  // ── CỬA HÀNG 3: Bánh Mì & Croissant ───────────────────────
  const owner3 = await prisma.user.create({
    data: { name: "Lê Thị Minh Tâm", phone: "0905678901", passwordHash },
  });
  if (storeOwnerRole) {
    await prisma.userRole.create({
      data: { userId: owner3.id, roleId: storeOwnerRole.id },
    });
  }

  const store3 = await prisma.store.create({
    data: {
      userId: owner3.id,
      name: "Bánh Mì & Croissant — Nguyễn Huệ",
      address: "50 Nguyễn Huệ, Quận 1, TP.HCM",
      defaultWorkDays: [1, 2, 3, 4, 5, 6, 7],
    },
  });
  await prisma.storeUser.create({
    data: {
      userId: owner3.id,
      storeId: store3.id,
      role: StoreUserRoleType.owner,
    },
  });

  const staff3 = await seedBakery(store3.id, passwordHash);
  await seedStoreData(store3.id, "bakery");
  const expCount3 = await seedExpenses(store3.id);
  const att3 = await seedAttendance(store3.id, staff3, curY, curM);
  await seedLeaveRequests(store3.id, staff3, owner3.id);
  console.log(`   📊 ${att3} chấm công, ${expCount3} phiếu chi`);

  // ── Tổng kết ───────────────────────────────────────────────
  const allUsers = await prisma.user.count();
  const allStores = await prisma.store.count();
  const allEmployees = await prisma.storeUser.count();
  const allAttendances = await prisma.attendance.count();
  const allLeaves = await prisma.leaveRequest.count();
  const allOrders = await prisma.order.count();
  const allExpenses = await prisma.expense.count();
  const allMenuItems = await prisma.menuItem.count();
  const allTables = await prisma.table.count();

  console.log(`\n${"=".repeat(56)}`);
  console.log("✅ SEED HOÀN TẤT");
  console.log(`${"=".repeat(56)}`);
  console.log(`   👤 Users:          ${allUsers}`);
  console.log(`   🏪 Cửa hàng:       ${allStores}`);
  console.log(`   👥 Nhân viên:      ${allEmployees}`);
  console.log(`   📋 Chấm công:      ${allAttendances}`);
  console.log(`   📝 Đơn nghỉ:       ${allLeaves}`);
  console.log(`   🧾 Đơn hàng:       ${allOrders}`);
  console.log(`   💰 Phiếu chi:      ${allExpenses}`);
  console.log(`   🍽️  Món:           ${allMenuItems}`);
  console.log(`   🪑 Bàn:            ${allTables}`);

  console.log(`\n${"─".repeat(56)}`);
  console.log("📞 THÔNG TIN ĐĂNG NHẬP");
  console.log(`${"─".repeat(56)}`);
  console.log(`   Admin / CH1:       0901234567 — password123`);
  console.log(`   Chủ CH2:          0903456789 — password123`);
  console.log(`   Chủ CH3:          0905678901 — password123`);
  console.log(
    `   Nhân viên CH1:    ${VIETNAMESE_PHONES.slice(0, 6).join(", ")} — password123`,
  );
  console.log(
    `   Nhân viên CH2:    ${VIETNAMESE_PHONES.slice(6, 9).join(", ")} — password123`,
  );
  console.log(
    `   Nhân viên CH3:    ${VIETNAMESE_PHONES.slice(9, 13).join(", ")} — password123`,
  );
  console.log(`${"=".repeat(56)}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
