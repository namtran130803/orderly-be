-- Cho phép nhiều ca chấm công cùng một ngày (linh hoạt)
DROP INDEX IF EXISTS "attendances_employee_id_date_key";
CREATE INDEX IF NOT EXISTS "attendances_employee_id_date_idx" ON "attendances"("employee_id", "date");
