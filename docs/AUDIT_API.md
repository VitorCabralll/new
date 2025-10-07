# API de Auditoria - Assistente Jurídico IA

## Visão Geral

O sistema de auditoria fornece rastreamento completo de todas as operações do pipeline de processamento de documentos. Cada requisição é identificada por um `sessionId` único e todos os stages são registrados com timestamps, durações e metadados.

## Endpoints Disponíveis

### 1. Estatísticas Gerais do Sistema
```
GET /api/audit/stats?days=7
```

**Resposta:**
```json
{
  "totalRequests": 150,
  "successRate": 94.7,
  "averageTokens": 1250,
  "averageDuration": 8500,
  "cacheHitRate": 12.3,
  "topAgents": [
    { "name": "Habilitação de Crédito", "usage": 45 },
    { "name": "Manifestação Geral", "usage": 32 }
  ]
}
```

### 2. Listar Requisições Auditadas
```
GET /api/audit/requests?page=1&limit=20&success=true&agentId=agent123
```

**Parâmetros de filtro:**
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 20)
- `success`: true/false para filtrar por sucesso
- `agentId`: Filtrar por agente específico
- `startDate`: Data inicial (ISO 8601)
- `endDate`: Data final (ISO 8601)

**Resposta:**
```json
{
  "requests": [
    {
      "id": "req123",
      "sessionId": "session-uuid",
      "fileName": "processo_123.pdf",
      "fileSize": 2048576,
      "extractionMethod": "pdf-parse",
      "documentType": "Habilitação de Crédito",
      "totalTokens": 1450,
      "totalDuration": 7200,
      "qualityScore": 8.5,
      "success": true,
      "createdAt": "2025-01-20T10:30:00Z",
      "agent": {
        "name": "Manifestação Especializada",
        "category": "crédito"
      },
      "stages": {
        "upload": { "status": "completed", "duration": 100 },
        "extraction": { "status": "completed", "duration": 2500 },
        "analysis": { "status": "completed", "duration": 300 },
        "generation": { "status": "completed", "duration": 4000, "tokensUsed": 1450 },
        "validation": { "status": "completed", "duration": 300 }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### 3. Detalhes de uma Sessão Específica
```
GET /api/audit/requests/:sessionId
```

**Resposta:**
```json
{
  "id": "req123",
  "sessionId": "session-uuid",
  "fileName": "processo_123.pdf",
  "agent": {
    "name": "Manifestação Especializada",
    "systemInstruction": "Você é um assistente...",
    "category": "crédito"
  },
  "timeline": [
    {
      "stage": "upload",
      "status": "completed",
      "startTime": "2025-01-20T10:30:00Z",
      "endTime": "2025-01-20T10:30:00.1Z",
      "duration": 100,
      "metadata": {
        "fileType": "application/pdf",
        "size": 2048576,
        "md5": "abc123..."
      }
    },
    {
      "stage": "extraction",
      "status": "completed",
      "startTime": "2025-01-20T10:30:00.1Z",
      "endTime": "2025-01-20T10:30:02.6Z",
      "duration": 2500,
      "metadata": {
        "method": "pdf-parse",
        "textLength": 15000,
        "qualityChecked": true
      }
    }
  ]
}
```

### 4. Performance dos Agentes
```
GET /api/audit/agents/performance?days=30
```

**Resposta:**
```json
[
  {
    "agent": {
      "id": "agent123",
      "name": "Habilitação de Crédito",
      "category": "crédito"
    },
    "usage": 45,
    "averageQuality": 8.2,
    "averageDuration": 7500,
    "averageTokens": 1200,
    "totalTokens": 54000
  }
]
```

### 5. Timeline Visual de uma Sessão
```
GET /api/audit/timeline/:sessionId
```

**Resposta:**
```json
{
  "sessionId": "session-uuid",
  "timeline": [
    {
      "step": 1,
      "stage": "upload",
      "status": "completed",
      "startTime": "2025-01-20T10:30:00Z",
      "endTime": "2025-01-20T10:30:00.1Z",
      "duration": 100,
      "details": {
        "fileType": "application/pdf",
        "size": 2048576
      }
    }
  ],
  "summary": {
    "totalDuration": 7200,
    "totalTokens": 1450,
    "stagesTotal": 5,
    "successful": 5,
    "failed": 0,
    "cached": 0
  }
}
```

### 6. Limpeza de Logs Antigos
```
DELETE /api/audit/cleanup
Content-Type: application/json

{
  "days": 90
}
```

**Resposta:**
```json
{
  "message": "Limpeza concluída com sucesso.",
  "deletedLogs": 1250,
  "deletedRequests": 45
}
```

## Stages Rastreados

1. **upload**: Upload e validação do arquivo
2. **extraction**: Extração de texto (pdf-parse ou OCR)
3. **analysis**: Análise do documento (tipo, entidades)
4. **generation**: Geração da manifestação via IA
5. **validation**: Validação de qualidade
6. **improvement**: Melhoria automática (se necessário)

## Metadados por Stage

### Upload
```json
{
  "fileType": "application/pdf",
  "originalName": "processo.pdf",
  "size": 2048576,
  "md5": "abc123def456..."
}
```

### Extraction
```json
{
  "method": "pdf-parse",
  "textLength": 15000,
  "confidence": 0.95,
  "qualityChecked": true
}
```

### Analysis
```json
{
  "documentType": "Habilitação de Crédito",
  "partiesFound": 3,
  "valuesFound": 2,
  "datesFound": 5
}
```

### Generation
```json
{
  "model": "gemini-2.0-flash",
  "promptTokens": 800,
  "responseTokens": 650
}
```

### Validation
```json
{
  "score": 8.5,
  "issues": [],
  "isAcceptable": true
}
```

### Improvement
```json
{
  "originalScore": 4.2,
  "improvedScore": 7.8,
  "attempts": 1
}
```

## Status dos Stages

- **started**: Stage iniciado
- **completed**: Stage concluído com sucesso
- **failed**: Stage falhou
- **cached**: Resultado obtido do cache

## Integração no Código

```typescript
import { AuditLogger } from '../services/auditLogger.js';

// Inicializar
const auditLogger = new AuditLogger();

// Iniciar sessão
await auditLogger.startRequest({
  agentId: 'agent123',
  fileName: 'documento.pdf',
  fileSize: 1024,
  fileMD5: 'hash...'
});

// Registrar stage
await auditLogger.logStageStart('extraction');
await auditLogger.logStageComplete('extraction', {
  method: 'pdf-parse',
  textLength: 5000,
  qualityChecked: true
});

// Finalizar com sucesso
await auditLogger.completeRequest();

// Ou falhar
await auditLogger.failRequest(new Error('Erro específico'));
```

## Benefícios da Auditoria

1. **Rastreabilidade Completa**: Cada operação é registrada
2. **Análise de Performance**: Identificar gargalos
3. **Monitoramento de Qualidade**: Acompanhar scores
4. **Debugging Facilitado**: Timeline detalhada de erros
5. **Análise de Custos**: Tracking de tokens e uso de API
6. **Compliance**: Trilha de auditoria para requisitos legais