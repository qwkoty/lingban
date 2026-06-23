-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "persona" TEXT NOT NULL DEFAULT '',
    "theme" TEXT NOT NULL DEFAULT 'aurora',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "persona" TEXT NOT NULL DEFAULT '',
    "greeting" TEXT NOT NULL DEFAULT '',
    "model_provider" TEXT NOT NULL DEFAULT 'deepseek',
    "model_name" TEXT NOT NULL DEFAULT 'deepseek-chat',
    "api_endpoint" TEXT NOT NULL DEFAULT '',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "max_tokens" INTEGER NOT NULL DEFAULT 4096,
    "api_key" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_token_key" ON "users"("token");

-- CreateIndex
CREATE INDEX "chat_messages_agent_id_created_at_idx" ON "chat_messages"("agent_id", "created_at");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
