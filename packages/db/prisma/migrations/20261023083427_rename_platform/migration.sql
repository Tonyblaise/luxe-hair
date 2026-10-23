-- The product is called Luxe Hair now; keep any name an admin already set.
ALTER TABLE "platform_settings" ALTER COLUMN "platform_name" SET DEFAULT 'Luxe Hair';
UPDATE "platform_settings" SET "platform_name" = 'Luxe Hair' WHERE "platform_name" = 'Salon Manager';
