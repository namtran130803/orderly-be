import type { OpenAPIObject } from "openapi3-ts/oas31";

import { commonSchemas } from "@/docs/schemas/common";
import { authSchemas } from "@/docs/schemas/auth.schemas";
import { storeSchemas } from "@/docs/schemas/stores.schemas";
import { categorySchemas } from "@/docs/schemas/categories.schemas";
import { menuItemSchemas } from "@/docs/schemas/menu-items.schemas";
import { areaSchemas } from "@/docs/schemas/areas.schemas";
import { tableSchemas } from "@/docs/schemas/tables.schemas";
import { statusSchemas } from "@/docs/schemas/statuses.schemas";
import { orderSchemas } from "@/docs/schemas/orders.schemas";
import { expenseSchemas } from "@/docs/schemas/expenses.schemas";
import { dashboardSchemas } from "@/docs/schemas/dashboard.schemas";
import { rolesSchemas } from "@/docs/schemas/roles.schemas";
import { userRolesSchemas } from "@/docs/schemas/user-roles.schemas";
import { employeeSchemas } from "@/docs/schemas/employees.schemas";
import { storeRoleSchemas } from "@/docs/schemas/store-roles.schemas";
import { scheduleSchemas } from "@/docs/schemas/schedule.schemas";
import { attendanceSchemas } from "@/docs/schemas/attendance.schemas";
import { leaveSchemas } from "@/docs/schemas/leave.schemas";
import { payrollSchemas } from "@/docs/schemas/payroll.schemas";

import { authPaths } from "@/docs/paths/auth.paths";
import { storePaths } from "@/docs/paths/stores.paths";
import { categoryPaths } from "@/docs/paths/categories.paths";
import { menuItemPaths } from "@/docs/paths/menu-items.paths";
import { areaPaths } from "@/docs/paths/areas.paths";
import { tablePaths } from "@/docs/paths/tables.paths";
import { statusPaths } from "@/docs/paths/statuses.paths";
import { orderPaths } from "@/docs/paths/orders.paths";
import { expensePaths } from "@/docs/paths/expenses.paths";
import { dashboardPaths } from "@/docs/paths/dashboard.paths";
import { systemPaths } from "@/docs/paths/system.paths";
import { rolesPaths } from "@/docs/paths/roles.paths";
import { usersPaths } from "@/docs/paths/users.paths";
import { employeePaths } from "@/docs/paths/employees.paths";
import { storeRolePaths } from "@/docs/paths/store-roles.paths";
import { schedulePaths } from "@/docs/paths/schedule.paths";
import { attendancePaths } from "@/docs/paths/attendance.paths";
import { leavePaths } from "@/docs/paths/leave.paths";
import { payrollPaths } from "@/docs/paths/payroll.paths";

const TAGS: Record<string, string> = {
  Auth: "Xác thực",
  Users: "Người dùng",
  Stores: "Cửa hàng",
  Categories: "Danh mục",
  "Menu Items": "Món",
  Areas: "Khu vực",
  Tables: "Bàn",
  Statuses: "Quy trình",
  Orders: "Đơn hàng",
  Expenses: "Chi phí",
  Dashboard: "Thống kê",
  "Roles & Permissions": "Vai trò hệ thống",
  System: "Hệ thống",
  Employees: "Nhân viên",
  "Store Roles": "Vai trò cửa hàng",
  Schedule: "Lịch làm việc",
  Attendance: "Chấm công",
  Leave: "Đơn nghỉ",
  Payroll: "Bảng lương",
};

const rawPaths = {
  ...authPaths,
  ...usersPaths,
  ...storePaths,
  ...categoryPaths,
  ...menuItemPaths,
  ...areaPaths,
  ...tablePaths,
  ...statusPaths,
  ...orderPaths,
  ...expensePaths,
  ...dashboardPaths,
  ...systemPaths,
  ...rolesPaths,
  ...employeePaths,
  ...storeRolePaths,
  ...schedulePaths,
  ...attendancePaths,
  ...leavePaths,
  ...payrollPaths,
};

for (const pathObj of Object.values(rawPaths)) {
  for (const methodObj of Object.values(pathObj as Record<string, any>)) {
    if (methodObj?.tags && Array.isArray(methodObj.tags)) {
      methodObj.tags = methodObj.tags.map((t: string) => TAGS[t] || t);
    }
  }
}

export const openApiSpec: OpenAPIObject = {
  openapi: "3.1.0",
  info: {
    title: "Orderly API",
    version: "1.0.0",
    description: `
## Giới thiệu
REST API cho ứng dụng POS quán cà phê **Orderly**.

## Xác thực
Hầu hết endpoint yêu cầu JWT Bearer token.
1. Gọi \`POST /api/auth/login\` để lấy token
2. Nhấn **Authorize** ở góc phải → nhập token

## Response format
- **Thành công**: \`{ success: true, data: ..., message: "..." }\`
- **Lỗi**: \`{ success: false, error: { code: "...", message: "...", details?: [...] } }\`
    `.trim(),
    contact: { name: "Orderly Team" },
  },
  servers: [
    { url: "http://localhost:3000", description: "Local" },
    { url: "http://api:3000", description: "Docker" },
  ],
  tags: [
    { name: TAGS["Auth"], description: "Đăng ký, đăng nhập, thông tin user" },
    { name: TAGS["Users"], description: "Quản lý người dùng hệ thống" },
    { name: TAGS["Stores"], description: "Quản lý cửa hàng" },
    { name: TAGS["Categories"], description: "Danh mục món" },
    { name: TAGS["Menu Items"], description: "Món ăn / đồ uống" },
    { name: TAGS["Areas"], description: "Khu vực bàn" },
    { name: TAGS["Tables"], description: "Bàn trong khu vực" },
    { name: TAGS["Statuses"], description: "Quy trình xử lý đơn" },
    { name: TAGS["Orders"], description: "Quản lý đơn hàng" },
    { name: TAGS["Expenses"], description: "Chi phí" },
    { name: TAGS["Dashboard"], description: "Thống kê" },
    { name: TAGS["Roles & Permissions"], description: "Vai trò & quyền hạn" },
    { name: TAGS["System"], description: "Mô-đun hệ thống" },
    { name: TAGS["Employees"], description: "Nhân viên cửa hàng" },
    { name: TAGS["Store Roles"], description: "Vai trò cấp cửa hàng" },
    {
      name: TAGS["Schedule"],
      description: "Ngày làm mặc định & ngày đặc biệt",
    },
    { name: TAGS["Attendance"], description: "QR chấm công & lưới tháng" },
    { name: TAGS["Leave"], description: "Đơn nghỉ có lương / không lương" },
    { name: TAGS["Payroll"], description: "Xem, khóa & mở khóa kỳ lương" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token từ POST /api/auth/login",
      },
    },
    schemas: {
      ...commonSchemas,
      ...authSchemas,
      ...storeSchemas,
      ...categorySchemas,
      ...menuItemSchemas,
      ...areaSchemas,
      ...tableSchemas,
      ...statusSchemas,
      ...orderSchemas,
      ...expenseSchemas,
      ...dashboardSchemas,
      ...rolesSchemas,
      ...userRolesSchemas,
      ...employeeSchemas,
      ...storeRoleSchemas,
      ...scheduleSchemas,
      ...attendanceSchemas,
      ...leaveSchemas,
      ...payrollSchemas,
    } as Record<string, any>,
  },
  security: [{ BearerAuth: [] }],
  paths: rawPaths,
};
