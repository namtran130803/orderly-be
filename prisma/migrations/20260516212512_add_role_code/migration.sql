-- First, add the column as nullable
ALTER TABLE "roles" ADD COLUMN "code" TEXT;

-- Generate simple codes from names for existing roles by using lowercase and replacing spaces
UPDATE "roles" 
SET "code" = LOWER(REGEXP_REPLACE("name", '\s+', '_', 'g'))
WHERE "code" IS NULL;

-- Make code NOT NULL and add unique constraint
ALTER TABLE "roles" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");
