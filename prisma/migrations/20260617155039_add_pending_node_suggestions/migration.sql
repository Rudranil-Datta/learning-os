-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'confirmed', 'rejected');

-- CreateTable
CREATE TABLE "pending_node_suggestions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    "conversation_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_node_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_pending_suggestions_user_status" ON "pending_node_suggestions"("user_id", "status");

-- CreateIndex
CREATE INDEX "idx_pending_suggestions_conversation" ON "pending_node_suggestions"("conversation_id");

-- AddForeignKey
ALTER TABLE "pending_node_suggestions" ADD CONSTRAINT "pending_node_suggestions_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pending_node_suggestions" ADD CONSTRAINT "pending_node_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
