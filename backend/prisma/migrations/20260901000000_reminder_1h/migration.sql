-- Recordatorio de "2 horas antes" pasa a ser de "1 hora antes"
ALTER TABLE "appointments" RENAME COLUMN "reminder2hSent" TO "reminder1hSent";
