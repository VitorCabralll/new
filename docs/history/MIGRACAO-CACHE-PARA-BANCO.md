# Migração: Cache Volátil → Pipeline no Banco de Dados

## ✅ O que foi implementado

### **Mudança Arquitetural:**

**ANTES:**
```
Cache (RAM - volátil)
├─ Extração OCR (7 dias)
├─ Análise documento (24h)
├─ Chunks (24h)
└─ Respostas Gemini (24h)
```

**AGORA:**
```
Banco de Dados (persistente)
└─ LegalSession
   ├─ extractedText (permanente)
   ├─ documentAnalysis (permanente)
   ├─ chunks (permanente)
   ├─ contextSummary (permanente)
   └─ iterations[] (permanente)
```

---

## 📋 Arquivos Modificados

### **1. Schema Prisma**
✅ `backend/prisma/schema.prisma`
- Adicionado campos ao `LegalSession`:
  - `extractedText`: Texto OCR completo (interno)
  - `documentAnalysis`: JSON com análise estruturada
  - `chunks`: JSON com chunks (nullable)
  - `contextSummary`: Resumo contextual

### **2. SessionService**
✅ `backend/src/services/sessionService.ts`
- ✅ `CreateSessionParams` atualizado com novos campos
- ✅ `createSession()` salva pipeline completo no banco
- ✅ Removido import de `cacheService`
- ✅ Removidas chamadas de cache
- ✅ Novo método: `getSessionPipeline()` - busca dados do banco

### **3. Generate Routes**
✅ `backend/src/routes/generate.ts`
- ✅ Removido import de `cacheService`
- ✅ Removidas todas as verificações de cache
- ✅ Pipeline salvo diretamente no banco ao criar sessão
- ✅ Chamadas de `cacheService` removidas:
  - `getCachedAgent()`
  - `cacheAgent()`
  - `getCachedTextExtraction()`
  - `cacheTextExtraction()`
  - `getCachedDocumentAnalysis()`
  - `cacheDocumentAnalysis()`
  - `getCachedChunks()`
  - `cacheChunks()`
  - `getCachedGeminiResponse()`
  - `cacheGeminiResponse()`

### **4. Sessions Routes**
✅ `backend/src/routes/sessions.ts`
- ✅ Refinamento usa `getSessionPipeline()` do banco
- ✅ Prompt de refinamento enriquecido com dados do pipeline

### **5. Server**
✅ `backend/src/server.ts`
- ✅ Removido import de `cacheRoutes`
- ✅ Removida rota `/api/cache`

### **6. Arquivos Deletados**
✅ `backend/src/services/memoryCache.ts` - DELETADO
✅ `backend/src/routes/cache.ts` - DELETADO

---

## 🚀 Como Aplicar as Mudanças

### **1. Gerar migração do banco de dados:**

```bash
cd backend

# Gerar migração
npx prisma migrate dev --name add-pipeline-to-session

# Resposta esperada:
# ✔ Generated Prisma Client...
# ✔ The migration has been applied successfully
```

### **2. Verificar migração gerada:**

```bash
# Arquivo criado automaticamente:
# backend/prisma/migrations/XXXXXXXX_add_pipeline_to_session/migration.sql
```

### **3. Reiniciar servidor:**

```bash
npm run dev
```

---

## 📊 Diferenças de Comportamento

| Aspecto | ANTES (Cache) | AGORA (Banco) |
|---------|---------------|---------------|
| **Persistência** | Até 7 dias (volátil) | ∞ (permanente) |
| **Restart servidor** | Dados perdidos | Dados preservados |
| **Refinamento** | Funciona até cache expirar | Funciona sempre |
| **Performance 1ª geração** | ~120s | ~120s (igual) |
| **Performance 2ª geração** | ~5s (cache hit) | ~120s (sem cache) |
| **Tamanho do banco** | 0 KB | +60-250 KB por sessão |
| **Dados internos** | Inacessíveis após expiração | Sempre acessíveis |

---

## 🎯 Benefícios

### **1. Dados Permanentes**
✅ Texto extraído nunca expira
✅ Refinamento funciona sempre
✅ Histórico completo preservado

### **2. Sem Dependências Externas**
✅ Não precisa de Redis
✅ Não precisa de memcached
✅ Banco SQLite já existente

### **3. Auditável**
✅ Ver exatamente o que foi processado
✅ Comparar versões
✅ Reproduzir gerações

### **4. Escalável**
✅ Funciona com múltiplos servidores
✅ Sem problemas de sincronização
✅ Backup incluído no banco

---

## ⚠️ Considerações

### **1. Tamanho do Banco**

**Estimativa por sessão:**
- extractedText: ~50-200 KB
- documentAnalysis: ~1-5 KB
- chunks: ~10-50 KB
- **Total: ~60-250 KB por sessão**

**Solução futura (se necessário):**
- Comprimir campos grandes com gzip
- Arquivar sessões antigas (status=archived)
- Purgar sessões após X meses

### **2. Performance**

**Impacto:** Processar o mesmo PDF múltiplas vezes é mais lento (sem cache).

**Mitigação:**
- SessionManager permite refinamento (não reprocessa)
- Usuário pode criar múltiplas iterações sem re-upload
- Trade-off aceito: Performance vs Persistência

### **3. Campos Internos**

**extractedText, documentAnalysis, chunks** = Dados INTERNOS

❌ Não expor na API por padrão
❌ Não mostrar na interface
✅ Usar apenas para refinamentos

---

## 🧪 Testes Recomendados

### **Teste 1: Geração Inicial**
```bash
POST /api/generate
Body: { file: PDF, instructions: "...", agentId: "..." }

# Verificar:
✅ Sessão criada
✅ extractedText salvo no banco
✅ documentAnalysis salvo
✅ chunks salvo
```

### **Teste 2: Refinamento**
```bash
POST /api/sessions/{id}/refine
Body: { userPrompt: "Melhore fundamentação" }

# Verificar:
✅ Busca dados do banco
✅ Não falha por cache expirado
✅ Nova iteração criada
```

### **Teste 3: Restart do Servidor**
```bash
# 1. Gerar manifestação
# 2. Reiniciar servidor (npm run dev)
# 3. Tentar refinar sessão anterior

# Verificar:
✅ Refinamento funciona (dados no banco)
```

### **Teste 4: Listagem de Sessões**
```bash
GET /api/sessions

# Verificar:
✅ Sessões retornadas
❌ extractedText NÃO exposto na resposta
```

---

## 📝 Variáveis de Ambiente

**Remover (não usado mais):**
```env
CACHE_ENABLED=true  # ❌ Não usado
```

---

## 🔄 Rollback (Se Necessário)

Caso precise reverter:

```bash
# 1. Restaurar arquivos deletados do git
git checkout HEAD -- backend/src/services/memoryCache.ts
git checkout HEAD -- backend/src/routes/cache.ts

# 2. Reverter mudanças
git checkout HEAD -- backend/src/server.ts
git checkout HEAD -- backend/src/routes/generate.ts
git checkout HEAD -- backend/src/services/sessionService.ts
git checkout HEAD -- backend/src/routes/sessions.ts

# 3. Reverter migração
npx prisma migrate resolve --rolled-back XXXXXXXX_add_pipeline_to_session
```

---

## ✅ Checklist Pós-Migração

- [ ] Migração do Prisma aplicada (`npx prisma migrate dev`)
- [ ] Servidor reiniciado sem erros
- [ ] Teste de geração inicial funciona
- [ ] Teste de refinamento funciona
- [ ] Sessões antigas (se existirem) migradas ou arquivadas
- [ ] Frontend não chama mais `/api/cache/*`
- [ ] Documentação atualizada
- [ ] Remover `CACHE_ENABLED` do `.env` (opcional)

---

## 📚 Próximos Passos Opcionais

### **1. Compressão de Dados (Futuro)**

Se o banco ficar grande, comprimir campos:

```typescript
// Ao salvar
extractedText: zlib.gzipSync(text).toString('base64')

// Ao recuperar
zlib.gunzipSync(Buffer.from(session.extractedText, 'base64')).toString()
```

**Economia:** ~70% de espaço

### **2. Arquivamento Automático**

Arquivar sessões antigas automaticamente:

```typescript
// Cron job diário
async function archiveOldSessions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  await prisma.legalSession.updateMany({
    where: {
      lastAccessedAt: { lt: thirtyDaysAgo },
      status: 'active'
    },
    data: { status: 'archived' }
  });
}
```

### **3. Purga de Sessões Antigas**

Deletar sessões arquivadas após X meses:

```typescript
async function purgeArchivedSessions() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  await prisma.legalSession.deleteMany({
    where: {
      status: 'archived',
      createdAt: { lt: sixMonthsAgo }
    }
  });
}
```

---

## 🎉 Conclusão

✅ **Sistema de cache volátil removido completamente**
✅ **Pipeline salvo permanentemente no banco**
✅ **Refinamento funciona sempre (sem expiração)**
✅ **Código mais simples (menos lógica de cache)**
✅ **Dados auditáveis e reproduzíveis**

**Trade-off aceito:** Performance de gerações repetidas vs Persistência e simplicidade.

---

**Data da Migração:** 2025-10-01
**Versão:** 2.0.0
