export interface ApiDef {
  code: string;
  name: string;
}

export interface ModuleDef {
  code: string;
  name: string;
  apis: ApiDef[];
}

export const PERMS = {
  users: {
    list: "users.list",
    role_list: "users.role_list",
    role_assign: "users.role_assign",
    role_remove: "users.role_remove",
  },
  roles: {
    list: "roles.list",
    create: "roles.create",
    update: "roles.update",
    delete: "roles.delete",
  },
  stores: {
    update: "stores.update",
    delete: "stores.delete",
    bypass_owner: "stores.bypass_owner",
    role_modules: "stores.role_modules",
  },
  store_roles: {
    list: "store_roles.list",
    create: "store_roles.create",
    update: "store_roles.update",
    delete: "store_roles.delete",
  },
  employees: {
    list: "employees.list",
    create: "employees.create",
    update: "employees.update",
    delete: "employees.delete",
    assign_role: "employees.assign_role",
    remove_role: "employees.remove_role",
  },
  system: {
    modules: "system.modules",
    overview: "system.overview",
  },
  categories: {
    list: "categories.list",
    create: "categories.create",
    update: "categories.update",
    delete: "categories.delete",
    reorder: "categories.reorder",
  },
  menu_items: {
    list: "menu_items.list",
    create: "menu_items.create",
    update: "menu_items.update",
    delete: "menu_items.delete",
  },
  areas: {
    list: "areas.list",
    create: "areas.create",
    update: "areas.update",
    delete: "areas.delete",
    reorder: "areas.reorder",
  },
  tables: {
    list: "tables.list",
    update: "tables.update",
    delete: "tables.delete",
  },
  statuses: {
    list: "statuses.list",
    create: "statuses.create",
    update: "statuses.update",
    delete: "statuses.delete",
    reorder: "statuses.reorder",
  },
  orders: {
    list: "orders.list",
    create: "orders.create",
    detail: "orders.detail",
    update: "orders.update",
    delete: "orders.delete",
    advance: "orders.advance",
    revert: "orders.revert",
  },
  expenses: {
    list: "expenses.list",
    create: "expenses.create",
    update: "expenses.update",
    delete: "expenses.delete",
  },
  dashboard: {
    stats: "dashboard.stats",
  },
  attendance: {
    list: "attendance.list",
    detail: "attendance.detail",
    create: "attendance.create",
    edit: "attendance.edit",
    qr: "attendance.qr",
    scan: "attendance.scan",
  },
  schedule: {
    view: "schedule.view",
    manage: "schedule.manage",
  },
  leave: {
    list: "leave.list",
    create: "leave.create",
    approve: "leave.approve",
    reject: "leave.reject",
  },
  payroll: {
    preview: "payroll.preview",
    detail: "payroll.detail",
    lock: "payroll.lock",
    unlock: "payroll.unlock",
  },
  subscriptions: {
    current: "subscriptions.current",
    periods: "subscriptions.periods",
    checkout: "subscriptions.checkout",
    admin_periods: "subscriptions.admin_periods",
    admin_renew: "subscriptions.admin_renew",
    admin_plan_create: "subscriptions.admin_plan_create",
    admin_plan_update: "subscriptions.admin_plan_update",
    admin_plan_delete: "subscriptions.admin_plan_delete",
  },
  payments: {
    list: "payments.list",
  },
  ai: {
    menu_analyze: 'ai.menu_analyze',
    menu_generate: 'ai.menu_generate',
    expense_analyze: 'ai.expense_analyze',
    expense_generate: 'ai.expense_generate',
  },
} as const;

export const MODULE_DEFS: ModuleDef[] = [
  {
    code: "users",
    name: "Người dùng",
    apis: [
      { code: PERMS.users.list, name: "Xem danh sách" },
      { code: PERMS.users.role_list, name: "Xem vai trò" },
      { code: PERMS.users.role_assign, name: "Gán vai trò" },
      { code: PERMS.users.role_remove, name: "Gỡ vai trò" },
    ],
  },
  {
    code: "roles",
    name: "Vai trò",
    apis: [
      { code: PERMS.roles.list, name: "Xem danh sách" },
      { code: PERMS.roles.create, name: "Tạo" },
      { code: PERMS.roles.update, name: "Cập nhật" },
      { code: PERMS.roles.delete, name: "Xóa" },
    ],
  },
  {
    code: "stores",
    name: "Cửa hàng",
    apis: [
      { code: PERMS.stores.update, name: "Cập nhật" },
      { code: PERMS.stores.delete, name: "Xóa" },
      { code: PERMS.stores.bypass_owner, name: "Bỏ qua kiểm tra sở hữu" },
      { code: PERMS.stores.role_modules, name: "Xem mô-đun" },
    ],
  },
  {
    code: "store_roles",
    name: "Vai trò",
    apis: [
      { code: PERMS.store_roles.list, name: "Xem danh sách" },
      { code: PERMS.store_roles.create, name: "Tạo" },
      { code: PERMS.store_roles.update, name: "Cập nhật" },
      { code: PERMS.store_roles.delete, name: "Xóa" },
    ],
  },
  {
    code: "employees",
    name: "Nhân viên",
    apis: [
      { code: PERMS.employees.list, name: "Xem danh sách" },
      { code: PERMS.employees.create, name: "Tạo" },
      { code: PERMS.employees.update, name: "Cập nhật" },
      { code: PERMS.employees.delete, name: "Xóa" },
      { code: PERMS.employees.assign_role, name: "Gán vai trò" },
      { code: PERMS.employees.remove_role, name: "Gỡ vai trò" },
    ],
  },
  {
    code: "system",
    name: "Hệ thống",
    apis: [
      { code: PERMS.system.modules, name: "Xem mô-đun" },
      { code: PERMS.system.overview, name: "Xem tổng quan hệ thống" },
    ],
  },
  {
    code: "categories",
    name: "Danh mục",
    apis: [
      { code: PERMS.categories.list, name: "Xem danh sách" },
      { code: PERMS.categories.create, name: "Tạo" },
      { code: PERMS.categories.update, name: "Cập nhật" },
      { code: PERMS.categories.delete, name: "Xóa" },
      { code: PERMS.categories.reorder, name: "Sắp xếp" },
    ],
  },
  {
    code: "menu_items",
    name: "Món",
    apis: [
      { code: PERMS.menu_items.list, name: "Xem danh sách" },
      { code: PERMS.menu_items.create, name: "Tạo" },
      { code: PERMS.menu_items.update, name: "Cập nhật" },
      { code: PERMS.menu_items.delete, name: "Xóa" },
    ],
  },
  {
    code: "areas",
    name: "Khu vực",
    apis: [
      { code: PERMS.areas.list, name: "Xem danh sách" },
      { code: PERMS.areas.create, name: "Tạo" },
      { code: PERMS.areas.update, name: "Cập nhật" },
      { code: PERMS.areas.delete, name: "Xóa" },
      { code: PERMS.areas.reorder, name: "Sắp xếp" },
    ],
  },
  {
    code: "tables",
    name: "Bàn",
    apis: [
      { code: PERMS.tables.list, name: "Xem danh sách" },
      { code: PERMS.tables.update, name: "Cập nhật" },
      { code: PERMS.tables.delete, name: "Xóa" },
    ],
  },
  {
    code: "statuses",
    name: "Quy trình",
    apis: [
      { code: PERMS.statuses.list, name: "Xem danh sách" },
      { code: PERMS.statuses.create, name: "Tạo" },
      { code: PERMS.statuses.update, name: "Cập nhật" },
      { code: PERMS.statuses.delete, name: "Xóa" },
      { code: PERMS.statuses.reorder, name: "Sắp xếp" },
    ],
  },
  {
    code: "orders",
    name: "Đơn hàng",
    apis: [
      { code: PERMS.orders.list, name: "Xem danh sách" },
      { code: PERMS.orders.create, name: "Tạo" },
      { code: PERMS.orders.detail, name: "Xem chi tiết" },
      { code: PERMS.orders.update, name: "Cập nhật" },
      { code: PERMS.orders.delete, name: "Xóa" },
      { code: PERMS.orders.advance, name: "Chuyển trạng thái" },
      { code: PERMS.orders.revert, name: "Lùi trạng thái" },
    ],
  },
  {
    code: "expenses",
    name: "Chi phí",
    apis: [
      { code: PERMS.expenses.list, name: "Xem danh sách" },
      { code: PERMS.expenses.create, name: "Tạo" },
      { code: PERMS.expenses.update, name: "Cập nhật" },
      { code: PERMS.expenses.delete, name: "Xóa" },
    ],
  },
  {
    code: "dashboard",
    name: "Thống kê",
    apis: [{ code: PERMS.dashboard.stats, name: "Xem thống kê" }],
  },
  {
    code: "attendance",
    name: "Chấm công",
    apis: [
      { code: PERMS.attendance.list, name: "Xem tất cả" },
      { code: PERMS.attendance.detail, name: "Xem chi tiết nhân viên" },
      { code: PERMS.attendance.create, name: "Thêm" },
      { code: PERMS.attendance.edit, name: "Sửa" },
      { code: PERMS.attendance.qr, name: "Tạo QR" },
      { code: PERMS.attendance.scan, name: "Quét QR" },
    ],
  },
  {
    code: "schedule",
    name: "Lịch làm việc",
    apis: [
      { code: PERMS.schedule.view, name: "Xem" },
      { code: PERMS.schedule.manage, name: "Quản lý" },
    ],
  },
  {
    code: "leave",
    name: "Nghỉ phép",
    apis: [
      { code: PERMS.leave.list, name: "Xem tất cả" },
      { code: PERMS.leave.create, name: "Tạo đơn" },
      { code: PERMS.leave.approve, name: "Duyệt" },
      { code: PERMS.leave.reject, name: "Từ chối" },
    ],
  },
  {
    code: "payroll",
    name: "Bảng lương",
    apis: [
      { code: PERMS.payroll.preview, name: "Xem tất cả" },
      { code: PERMS.payroll.detail, name: "Xem chi tiết nhân viên" },

      { code: PERMS.payroll.lock, name: "Khóa" },
      { code: PERMS.payroll.unlock, name: "Mở khóa" },
    ],
  },
  {
    code: "subscriptions",
    name: "Gia hạn",
    apis: [
      { code: PERMS.subscriptions.current, name: "Xem trạng thái gia hạn" },
      { code: PERMS.subscriptions.periods, name: "Xem lịch sử gia hạn" },
      { code: PERMS.subscriptions.checkout, name: "Tạo thanh toán gia hạn" },
      { code: PERMS.subscriptions.admin_periods, name: "Xem gia hạn toàn hệ thống" },
      { code: PERMS.subscriptions.admin_renew, name: "Gia hạn thủ công" },
      { code: PERMS.subscriptions.admin_plan_create, name: "Thêm gói gia hạn" },
      { code: PERMS.subscriptions.admin_plan_update, name: "Sửa gói gia hạn" },
      { code: PERMS.subscriptions.admin_plan_delete, name: "Xóa gói gia hạn" },
    ],
  },
  {
    code: "payments",
    name: "Thanh toán",
    apis: [
      { code: PERMS.payments.list, name: "Xem danh sách" },
    ],
  },
  {
    code: "ai",
    name: "AI",
    apis: [
      { code: PERMS.ai.menu_analyze, name: "Phân tích ảnh menu" },
      { code: PERMS.ai.menu_generate, name: "Tạo menu từ AI" },
      { code: PERMS.ai.expense_analyze, name: "Phân tích ảnh chi tiêu" },
      { code: PERMS.ai.expense_generate, name: "Tạo chi tiêu từ AI" },
    ],
  },
];

// Permission codes dành cho chủ cửa hàng — chỉ trong phạm vi cửa hàng
// Không bao gồm: stores.bypass_owner, users.*, roles.*, system.*
export const STORE_OWNER_PERMS: string[] = [
  // stores (trừ bypass_owner)
  PERMS.stores.update,
  PERMS.stores.delete,
  PERMS.stores.role_modules,
  // store_roles
  PERMS.store_roles.list,
  PERMS.store_roles.create,
  PERMS.store_roles.update,
  PERMS.store_roles.delete,
  // employees
  PERMS.employees.list,
  PERMS.employees.create,
  PERMS.employees.update,
  PERMS.employees.delete,
  PERMS.employees.assign_role,
  PERMS.employees.remove_role,
  // categories
  PERMS.categories.list,
  PERMS.categories.create,
  PERMS.categories.update,
  PERMS.categories.delete,
  PERMS.categories.reorder,
  // menu_items
  PERMS.menu_items.list,
  PERMS.menu_items.create,
  PERMS.menu_items.update,
  PERMS.menu_items.delete,
  // areas
  PERMS.areas.list,
  PERMS.areas.create,
  PERMS.areas.update,
  PERMS.areas.delete,
  PERMS.areas.reorder,
  // tables
  PERMS.tables.list,
  PERMS.tables.update,
  PERMS.tables.delete,
  // statuses
  PERMS.statuses.list,
  PERMS.statuses.create,
  PERMS.statuses.update,
  PERMS.statuses.delete,
  PERMS.statuses.reorder,
  // orders
  PERMS.orders.list,
  PERMS.orders.create,
  PERMS.orders.detail,
  PERMS.orders.update,
  PERMS.orders.delete,
  PERMS.orders.advance,
  PERMS.orders.revert,
  // expenses
  PERMS.expenses.list,
  PERMS.expenses.create,
  PERMS.expenses.update,
  PERMS.expenses.delete,
  // dashboard
  PERMS.dashboard.stats,
  // attendance / schedule / leave / payroll
  PERMS.attendance.list,
  PERMS.attendance.detail,
  PERMS.attendance.create,
  PERMS.attendance.edit,
  PERMS.attendance.qr,
  PERMS.attendance.scan,
  PERMS.schedule.view,
  PERMS.schedule.manage,
  PERMS.leave.list,
  PERMS.leave.create,
  PERMS.leave.approve,
  PERMS.leave.reject,
  PERMS.payroll.preview,
  PERMS.payroll.detail,
  PERMS.payroll.lock,
  PERMS.payroll.unlock,
  // subscriptions
  PERMS.subscriptions.current,
  PERMS.subscriptions.periods,
  PERMS.subscriptions.checkout,
  // ai
  PERMS.ai.menu_analyze,
  PERMS.ai.menu_generate,
  PERMS.ai.expense_analyze,
  PERMS.ai.expense_generate,
];

export const ROLE_DEFS = {
  ADMIN: { code: "admin", name: "Quản trị viên" },
  STORE_OWNER: { code: "store_owner", name: "Chủ cửa hàng" },
} as const;
