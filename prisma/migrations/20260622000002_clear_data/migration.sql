-- Clear all user data and reset sequences
TRUNCATE TABLE "users", "agents", "chat_messages", "memories" RESTART IDENTITY CASCADE;
