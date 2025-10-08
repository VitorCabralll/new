-- CreateTable
CREATE TABLE "SystemAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemInstruction" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "model" TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
    "temperature" REAL NOT NULL DEFAULT 0.3,
    "maxTokens" INTEGER NOT NULL DEFAULT 8192,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "basePrompt" TEXT NOT NULL,
    "systemInstruction" TEXT NOT NULL,
    "isTrained" BOOLEAN NOT NULL DEFAULT false,
    "trainingExamples" INTEGER NOT NULL DEFAULT 0,
    "lastTrainedAt" DATETIME,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "qualityScore" REAL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME,
    "successRate" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAgentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT,
    "fileMD5" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fullText" TEXT NOT NULL,
    "extractedData" TEXT NOT NULL,
    "embedding" TEXT,
    "metadata" TEXT,
    "qualityScore" REAL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "qualityCheck" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingDocument_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "UserAgent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAgentId" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "variables" TEXT NOT NULL,
    "exampleText" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" REAL,
    "applicableWhen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentTemplate_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "UserAgent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "systemInstruction" TEXT NOT NULL,
    "category" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "quality" REAL,
    "trainingExamples" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" DATETIME,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RequestAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "agentId" TEXT NOT NULL,
    "userAgentId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileMD5" TEXT NOT NULL,
    "extractionMethod" TEXT NOT NULL,
    "documentType" TEXT,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "cacheHit" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" REAL,
    "improved" BOOLEAN NOT NULL DEFAULT false,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "templatesUsed" INTEGER,
    "similarityScore" REAL,
    "adaptationScore" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestAudit_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RequestAudit_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "UserAgent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "duration" INTEGER,
    "tokensUsed" INTEGER,
    "metadata" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RequestAudit" ("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LegalSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "fileMD5" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "extractedText" TEXT NOT NULL,
    "documentAnalysis" TEXT NOT NULL,
    "chunks" TEXT,
    "contextSummary" TEXT,
    "multiAgentData" TEXT,
    "agentId" TEXT,
    "userAgentId" TEXT,
    "documentType" TEXT NOT NULL,
    "originalInstructions" TEXT NOT NULL,
    "similarExamples" TEXT,
    "appliedTemplates" TEXT,
    "contextVariables" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LegalSession_userAgentId_fkey" FOREIGN KEY ("userAgentId") REFERENCES "UserAgent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionIteration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "parentIterationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionIteration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LegalSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemAgent_role_key" ON "SystemAgent"("role");

-- CreateIndex
CREATE INDEX "SystemAgent_role_idx" ON "SystemAgent"("role");

-- CreateIndex
CREATE INDEX "SystemAgent_isActive_idx" ON "SystemAgent"("isActive");

-- CreateIndex
CREATE INDEX "UserAgent_userId_idx" ON "UserAgent"("userId");

-- CreateIndex
CREATE INDEX "UserAgent_category_idx" ON "UserAgent"("category");

-- CreateIndex
CREATE INDEX "UserAgent_isTrained_idx" ON "UserAgent"("isTrained");

-- CreateIndex
CREATE INDEX "UserAgent_isActive_idx" ON "UserAgent"("isActive");

-- CreateIndex
CREATE INDEX "UserAgent_lastUsed_idx" ON "UserAgent"("lastUsed");

-- CreateIndex
CREATE INDEX "TrainingDocument_userAgentId_idx" ON "TrainingDocument"("userAgentId");

-- CreateIndex
CREATE INDEX "TrainingDocument_fileType_idx" ON "TrainingDocument"("fileType");

-- CreateIndex
CREATE INDEX "TrainingDocument_processed_idx" ON "TrainingDocument"("processed");

-- CreateIndex
CREATE INDEX "TrainingDocument_fileMD5_idx" ON "TrainingDocument"("fileMD5");

-- CreateIndex
CREATE INDEX "AgentTemplate_userAgentId_idx" ON "AgentTemplate"("userAgentId");

-- CreateIndex
CREATE INDEX "AgentTemplate_templateType_idx" ON "AgentTemplate"("templateType");

-- CreateIndex
CREATE INDEX "AgentTemplate_confidence_idx" ON "AgentTemplate"("confidence");

-- CreateIndex
CREATE INDEX "Agent_category_idx" ON "Agent"("category");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");

-- CreateIndex
CREATE INDEX "Agent_lastUsed_idx" ON "Agent"("lastUsed");

-- CreateIndex
CREATE UNIQUE INDEX "RequestAudit_sessionId_key" ON "RequestAudit"("sessionId");

-- CreateIndex
CREATE INDEX "RequestAudit_createdAt_idx" ON "RequestAudit"("createdAt");

-- CreateIndex
CREATE INDEX "RequestAudit_agentId_idx" ON "RequestAudit"("agentId");

-- CreateIndex
CREATE INDEX "RequestAudit_userAgentId_idx" ON "RequestAudit"("userAgentId");

-- CreateIndex
CREATE INDEX "RequestAudit_success_idx" ON "RequestAudit"("success");

-- CreateIndex
CREATE INDEX "RequestAudit_sessionId_idx" ON "RequestAudit"("sessionId");

-- CreateIndex
CREATE INDEX "ProcessLog_sessionId_idx" ON "ProcessLog"("sessionId");

-- CreateIndex
CREATE INDEX "ProcessLog_stage_idx" ON "ProcessLog"("stage");

-- CreateIndex
CREATE INDEX "ProcessLog_status_idx" ON "ProcessLog"("status");

-- CreateIndex
CREATE INDEX "ProcessLog_createdAt_idx" ON "ProcessLog"("createdAt");

-- CreateIndex
CREATE INDEX "LegalSession_userId_idx" ON "LegalSession"("userId");

-- CreateIndex
CREATE INDEX "LegalSession_fileMD5_idx" ON "LegalSession"("fileMD5");

-- CreateIndex
CREATE INDEX "LegalSession_agentId_idx" ON "LegalSession"("agentId");

-- CreateIndex
CREATE INDEX "LegalSession_userAgentId_idx" ON "LegalSession"("userAgentId");

-- CreateIndex
CREATE INDEX "LegalSession_status_idx" ON "LegalSession"("status");

-- CreateIndex
CREATE INDEX "LegalSession_createdAt_idx" ON "LegalSession"("createdAt");

-- CreateIndex
CREATE INDEX "LegalSession_lastAccessedAt_idx" ON "LegalSession"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "SessionIteration_sessionId_idx" ON "SessionIteration"("sessionId");

-- CreateIndex
CREATE INDEX "SessionIteration_createdAt_idx" ON "SessionIteration"("createdAt");

-- CreateIndex
CREATE INDEX "SessionIteration_parentIterationId_idx" ON "SessionIteration"("parentIterationId");
