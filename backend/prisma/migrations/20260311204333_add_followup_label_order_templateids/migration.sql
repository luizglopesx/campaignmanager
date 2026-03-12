-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "label_filter" TEXT,
ADD COLUMN     "template_ids" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "message_templates" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "follow_up_label" TEXT;
