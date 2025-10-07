# Plano de Remoção Segura do Sistema de Cache

## ✅ Análise de Dependências

### Arquivos que usam cache:

1. **`routes/generate.ts`** - 10 chamadas
   - `cacheService.connect()`
   - `cacheService.getCachedAgent()`
   - `cacheService.cacheAgent()`
   - `cacheService.getCachedTextExtraction()`
   - `cacheService.cacheTextExtraction()`
   - `cacheService.getCachedDocumentAnalysis()`
   - `cacheService.cacheDocumentAnalysis()`
   - `cacheService.getCachedChunks()`
   - `cacheService.cacheChunks()`
   - `cacheService.getCachedGeminiResponse()`
   - `cacheService.cacheGeminiResponse()`

2. **`services/sessionService.ts`** - 6 chamadas
   - `cacheService.cacheSession()` (3x)
   - `cacheService.getCachedSession()`
   - `cacheService.getCachedTextExtraction()`
   - `cacheService.invalidateSession()` (2x)

3. **`routes/cache.ts`** - 5 chamadas (rota inteira dedicada)
   - `cacheService.connect()` (3x)
   - `cacheService.getCacheStats()` (2x)
   - `cacheService.clearCache()`

4. **`services/memoryCache.ts`** - Arquivo inteiro (485 linhas)

5. **`server.ts`** - Importação e rota
   - `import cacheRoutes`
   - `app.use('/api/cache', cacheRoutes)`

---

## 📋 Estratégia de Remoção (SEM QUEBRAR)

### Fase 1: Remover lógica de cache (manter funções vazias)

**Objetivo:** Código continua funcionando, mas cache não faz nada

```typescript
// generate.ts - ANTES
let agent = await cacheService.getCachedAgent(agentId);
if (!agent) {
  agent = await prisma.agent.findUnique({ where: { id: agentId } });
  await cacheService.cacheAgent(agentId, agent);
}

// generate.ts - DEPOIS (simplificado)
const agent = await prisma.agent.findUnique({ where: { id: agentId } });
// Cache removido - sempre busca do banco
```

### Fase 2: Remover imports e rotas

```typescript
// server.ts - REMOVER
import cacheRoutes from './routes/cache.js'; // ❌
app.use('/api/cache', cacheRoutes); // ❌
```

### Fase 3: Deletar arquivos

```bash
rm backend/src/services/memoryCache.ts
rm backend/src/routes/cache.ts
```

---

## 🔧 Mudanças Detalhadas por Arquivo

### **1. `routes/generate.ts`**

#### Remover (linhas 9, 83-86):
```typescript
import { cacheService } from '../services/memoryCache.js'; // ❌

// Conectar ao cache se habilitado
if (process.env.CACHE_ENABLED === 'true') {
  await cacheService.connect();
}
```

#### Simplificar busca de agente (linhas 108-123):
```typescript
// ANTES
let agent = await cacheService.getCachedAgent(agentId);
if (!agent) {
  agent = await prisma.agent.findUnique({...});
  await cacheService.cacheAgent(agentId, agent);
}

// DEPOIS
const agent = await prisma.agent.findUnique({ where: { id: agentId } });
if (!agent) {
  return res.status(404).json({ message: 'Agente não encontrado.' });
}
```

#### Simplificar extração (linhas 127-139):
```typescript
// ANTES
let extractionResult = await cacheService.getCachedTextExtraction(fileMD5);
if (!extractionResult) {
  extractionResult = await extractTextFromPDF(file.path);
  await cacheService.cacheTextExtraction(fileMD5, extractionResult);
} else {
  await auditLogger.logCacheHit('extraction');
}

// DEPOIS
const extractionResult = await extractTextFromPDF(file.path);
```

#### Simplificar análise (linhas 156-165):
```typescript
// ANTES
let documentAnalysis = await cacheService.getCachedDocumentAnalysis(extractedText);
if (!documentAnalysis) {
  documentAnalysis = analyzeDocument(extractedText);
  await cacheService.cacheDocumentAnalysis(extractedText, documentAnalysis);
}

// DEPOIS
const documentAnalysis = analyzeDocument(extractedText);
```

#### Simplificar chunking (linhas 182-194):
```typescript
// ANTES
let chunkingResult = await cacheService.getCachedChunks(extractedText, documentAnalysis.type);
if (!chunkingResult) {
  chunkingResult = await processDocumentWithChunking(extractedText, documentAnalysis.type);
  await cacheService.cacheChunks(extractedText, documentAnalysis.type, chunkingResult);
}

// DEPOIS
const chunkingResult = await processDocumentWithChunking(
  extractedText,
  documentAnalysis.type
);
```

#### Simplificar geração Gemini (linhas 213-246):
```typescript
// ANTES
let cachedResponse = await cacheService.getCachedGeminiResponse(...);
if (cachedResponse) {
  generationResult = cachedResponse;
  await auditLogger.logCacheHit('generation');
} else {
  const result = await genAI.models.generateContent({...});
  generationResult = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
  await cacheService.cacheGeminiResponse(...);
}

// DEPOIS
const result = await genAI.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: [{ role: 'user', parts: [{ text: prompt }] }]
});
generationResult = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
```

---

### **2. `services/sessionService.ts`**

#### Remover import (linha 2):
```typescript
import { cacheService } from './memoryCache.js'; // ❌
```

#### Remover chamadas de cache:

**`createSession()` (linha 53):**
```typescript
// ANTES
await cacheService.cacheSession(session.id, session);

// DEPOIS
// Removido - sessão já está no banco
```

**`refineSession()` (linha 85):**
```typescript
// ANTES
await cacheService.cacheSession(session.id, session);

// DEPOIS
// Removido
```

**`getSession()` (linhas 118-134):**
```typescript
// ANTES
let session = await cacheService.getCachedSession(sessionId);
if (!session) {
  session = await prisma.legalSession.findUnique({...});
  if (session) {
    await cacheService.cacheSession(sessionId, session);
  }
}

// DEPOIS
const session = await prisma.legalSession.findUnique({
  where: { id: sessionId },
  include: {
    iterations: {
      orderBy: { createdAt: 'asc' }
    }
  }
});
```

**`getExtractedText()` (linha 156):**
```typescript
// ANTES
const cachedExtraction = await cacheService.getCachedTextExtraction(session.fileMD5);
if (cachedExtraction) {
  return cachedExtraction.text;
}
return null;

// DEPOIS
// Texto extraído não está mais em cache
// Retornar null sempre (usuário precisa fazer novo upload)
return null;
```

**`archiveSession()` e `deleteSession()` (linhas 177, 192):**
```typescript
// ANTES
await cacheService.invalidateSession(sessionId);

// DEPOIS
// Removido - cache não existe mais
```

---

### **3. `server.ts`**

#### Remover (linhas 7, 22):
```typescript
import cacheRoutes from './routes/cache.js'; // ❌
app.use('/api/cache', cacheRoutes); // ❌
```

---

### **4. Deletar arquivos**

```bash
rm backend/src/services/memoryCache.ts
rm backend/src/routes/cache.ts
```

---

## 🎯 Impacto da Remoção

### Performance:

| Operação | COM Cache | SEM Cache | Diferença |
|----------|-----------|-----------|-----------|
| **1ª geração (PDF novo)** | 120s | 120s | 0s (igual) |
| **2ª geração (mesmo PDF)** | 5s | 120s | +115s (mais lento) |
| **Buscar agente** | <1ms | ~10ms | +9ms |
| **Buscar sessão** | <1ms | ~50ms | +49ms |

### Funcionalidade:

| Feature | Status | Observação |
|---------|--------|------------|
| ✅ Geração de manifestações | Funciona | Sem mudanças |
| ✅ SessionManager | Funciona | Busca sempre do banco |
| ✅ Refinamento de sessões | Funciona | Mas requer texto extraído salvo |
| ⚠️ Refinamento de sessões antigas | **QUEBRA** | Cache de extração não existe mais |
| ✅ Criar/listar/deletar sessões | Funciona | Sem mudanças |
| ❌ `/api/cache/*` endpoints | **QUEBRA** | Rota removida |

---

## ⚠️ Problemas Conhecidos Após Remoção

### 1. **Refinamento de sessões antigas**

**Problema:**
```typescript
// sessionService.ts - getExtractedText()
const cachedExtraction = await cacheService.getCachedTextExtraction(session.fileMD5);
// Sem cache, sempre retorna null
```

**Solução:**
- Salvar texto extraído **no banco de dados** (nova coluna ou tabela)
- OU: Exigir que usuário faça novo upload para refinar

### 2. **Performance degradada**

**Problema:** Processar mesmo PDF múltiplas vezes

**Solução:**
- Aceitar performance degradada (sem cache, sempre lento)
- OU: Manter cache apenas para sessões ativas (híbrido)

### 3. **Rota `/api/cache/*` quebrada**

**Problema:** Frontend pode estar usando

**Solução:**
- Verificar se frontend chama `/api/cache/stats` ou similar
- Remover chamadas do frontend também

---

## 📝 Checklist de Execução

- [ ] 1. Backup do código atual
- [ ] 2. Remover import de `memoryCache` em `generate.ts`
- [ ] 3. Simplificar lógica de `generate.ts` (remover blocos if/else de cache)
- [ ] 4. Remover import de `memoryCache` em `sessionService.ts`
- [ ] 5. Simplificar `sessionService.ts` (sempre buscar do banco)
- [ ] 6. **DECIDIR:** Como lidar com `getExtractedText()`?
   - Opção A: Retornar sempre null (quebra refinamento)
   - Opção B: Salvar texto no banco (requer migração)
- [ ] 7. Remover import de `cacheRoutes` em `server.ts`
- [ ] 8. Remover rota `/api/cache` em `server.ts`
- [ ] 9. Deletar `backend/src/services/memoryCache.ts`
- [ ] 10. Deletar `backend/src/routes/cache.ts`
- [ ] 11. Remover `CACHE_ENABLED` do `.env`
- [ ] 12. Testar geração de manifestação
- [ ] 13. Testar criação de sessão
- [ ] 14. Verificar se há erros no console do backend

---

## 🚨 Decisão Crítica Necessária

### **Como lidar com texto extraído para refinamentos?**

#### **Opção A: Aceitar quebra de refinamento**
```typescript
// sessionService.ts
async getExtractedText(sessionId: string): Promise<string | null> {
  return null; // Cache removido - sempre retorna null
}
```

**Prós:** Simples, sem mudanças no banco
**Contras:** Refinamento de sessões antigas não funciona

---

#### **Opção B: Salvar texto extraído no banco** ⭐ RECOMENDADO

```prisma
// schema.prisma
model LegalSession {
  // ... campos existentes
  extractedText String? // Novo campo
}
```

**Mudanças necessárias:**
1. Adicionar coluna `extractedText` em `LegalSession`
2. Salvar texto ao criar sessão
3. `getExtractedText()` busca do banco

**Prós:** Refinamento funciona sempre
**Contras:** Aumenta tamanho do banco (textos grandes)

---

## 🎯 Recomendação Final

### **Opção B + Compressão:**

```typescript
// Ao criar sessão
const session = await prisma.legalSession.create({
  data: {
    ...
    extractedText: zlib.gzipSync(extractedText).toString('base64')
  }
});

// Ao recuperar
const text = zlib.gunzipSync(
  Buffer.from(session.extractedText, 'base64')
).toString();
```

**Benefício:** Refinamento funciona + texto comprimido economiza espaço

---

**Qual opção você prefere?**
- A) Remover cache e aceitar quebra de refinamento
- B) Remover cache e salvar texto no banco
- C) Cancelar remoção do cache
