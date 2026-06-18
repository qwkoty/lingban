-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "persona" TEXT NOT NULL DEFAULT '',
    "modelProvider" TEXT NOT NULL DEFAULT 'openai',
    "apiBaseUrl" TEXT NOT NULL DEFAULT 'https://api.openai.com/v1',
    "modelName" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "apiKey" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("apiKey", "avatar", "createdAt", "id", "maxTokens", "modelName", "modelProvider", "name", "persona", "temperature", "updatedAt", "userId") SELECT "apiKey", "avatar", "createdAt", "id", "maxTokens", "modelName", "modelProvider", "name", "persona", "temperature", "updatedAt", "userId" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE INDEX "Agent_userId_idx" ON "Agent"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
