ALTER TABLE "subscription_plans"
ADD COLUMN "note" TEXT NOT NULL DEFAULT '';

UPDATE "subscription_plans"
SET "note" = CASE "code"
  WHEN 'D30' THEN 'linh hoạt cho cửa hàng mới'
  WHEN 'D90' THEN 'gọn cho một quý vận hành'
  WHEN 'D180' THEN 'tiết kiệm cho đội đang tăng tốc'
  WHEN 'D360' THEN 'chi phí thấp nhất theo năm'
  ELSE "note"
END;
