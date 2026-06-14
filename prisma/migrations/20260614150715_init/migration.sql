-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('parent', 'child', 'related');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "explanation" TEXT,
    "summary" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "source_node_id" UUID,
    "target_node_id" UUID,
    "link_type" "LinkType" NOT NULL,
    "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "node_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    "context_node_id" UUID,
    "title" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_nodes_user" ON "knowledge_nodes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_nodes_title_user" ON "knowledge_nodes"("title", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "node_links_source_node_id_target_node_id_link_type_key" ON "node_links"("source_node_id", "target_node_id", "link_type");

-- CreateIndex
CREATE INDEX "idx_conversations_user" ON "conversations"("user_id");

-- CreateIndex
CREATE INDEX "idx_conversations_node" ON "conversations"("context_node_id");

-- CreateIndex
CREATE INDEX "idx_messages_conversation" ON "messages"("conversation_id");

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_links" ADD CONSTRAINT "node_links_source_node_id_fkey" FOREIGN KEY ("source_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_links" ADD CONSTRAINT "node_links_target_node_id_fkey" FOREIGN KEY ("target_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_links" ADD CONSTRAINT "node_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_context_node_id_fkey" FOREIGN KEY ("context_node_id") REFERENCES "knowledge_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
