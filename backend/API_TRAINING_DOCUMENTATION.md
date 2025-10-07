# 📚 API DE TREINAMENTO DE AGENTES - DOCUMENTAÇÃO COMPLETA

## 🚀 **BASE URL**
```
http://localhost:3001/api
```

---

## 📋 **ENDPOINTS DISPONÍVEIS**

### **1. TREINAR NOVO AGENTE**
Cria e treina um novo agente jurídico a partir de modelos exemplares.

**Endpoint:**
```
POST /training/train
```

**Content-Type:** `multipart/form-data`

**Campos do Formulário:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ Sim | Nome do agente (ex: "Manifestações Cíveis MT") |
| `documentType` | string | ✅ Sim | Tipo de documento (ex: "Manifestação do MP") |
| `legalArea` | string | ❌ Não | Área jurídica (ex: "Cível", "Criminal") |
| `jurisdiction` | string | ❌ Não | Jurisdição (ex: "Mato Grosso", "Federal") |
| `customInstructions` | string | ✅ Sim | Instruções customizadas para o agente |
| `tone` | string | ❌ Não | Tom do documento (ex: "formal", "técnico", "objetivo") |
| `emphasis` | string (JSON) | ❌ Não | Ênfases (ex: ["fundamentação legal", "síntese"]) |
| `modelFiles` | File[] | ✅ Sim | 1-5 arquivos PDF modelos (até 10MB cada) |
| `testDocument` | File | ❌ Não | PDF opcional para testar o agente após treinamento |

**Exemplo de Requisição (usando curl):**
```bash
curl -X POST http://localhost:3001/api/training/train \
  -F "name=Manifestações Cíveis MT" \
  -F "documentType=Manifestação do MP" \
  -F "legalArea=Cível" \
  -F "jurisdiction=Mato Grosso" \
  -F "customInstructions=Gere manifestações formais e completas" \
  -F "tone=formal" \
  -F "emphasis=[\"fundamentação legal\",\"síntese\"]" \
  -F "modelFiles=@modelo1.pdf" \
  -F "modelFiles=@modelo2.pdf" \
  -F "modelFiles=@modelo3.pdf" \
  -F "testDocument=@teste.pdf"
```

**Exemplo de Requisição (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('name', 'Manifestações Cíveis MT');
formData.append('documentType', 'Manifestação do MP');
formData.append('legalArea', 'Cível');
formData.append('jurisdiction', 'Mato Grosso');
formData.append('customInstructions', 'Gere manifestações formais e completas');
formData.append('tone', 'formal');
formData.append('emphasis', JSON.stringify(['fundamentação legal', 'síntese']));

// Adicionar arquivos
formData.append('modelFiles', modelFile1);
formData.append('modelFiles', modelFile2);
formData.append('modelFiles', modelFile3);
formData.append('testDocument', testFile);

const response = await fetch('http://localhost:3001/api/training/train', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result);
```

**Resposta de Sucesso (201 Created):**
```json
{
  "success": true,
  "data": {
    "agentId": "clx123abc456def789",
    "name": "Manifestações Cíveis MT",
    "quality": 8.9,
    "trainingExamples": 3,
    "systemInstruction": "Você é um assistente jurídico especializado...",
    "validation": {
      "score": 8.9,
      "structureMatch": 92,
      "styleMatch": 95,
      "citationAccuracy": 87,
      "overallAlignment": 91
    },
    "createdAt": "2025-10-03T18:45:00Z"
  }
}
```

**Resposta de Erro (400 Bad Request):**
```json
{
  "success": false,
  "error": "Forneça entre 1 e 5 modelos exemplares"
}
```

---

### **2. GERAR DOCUMENTO COM AGENTE**
Gera um documento jurídico usando um agente treinado.

**Endpoint:**
```
POST /training/agents/:agentId/generate
```

**Content-Type:** `multipart/form-data`

**Parâmetros de URL:**
- `agentId` (string): ID do agente a ser usado

**Campos do Formulário:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `processDocument` | File | ✅ Sim | PDF do processo (até 10MB) |
| `additionalInstructions` | string | ❌ Não | Instruções extras para a geração |

**Exemplo de Requisição (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('processDocument', processFile);
formData.append('additionalInstructions', 'Enfatizar aspectos constitucionais');

const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456/generate', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data.generatedDocument);
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "data": {
    "generationId": "gen-1696354800123",
    "generatedDocument": "MANIFESTAÇÃO DO MINISTÉRIO PÚBLICO\n\n[Documento completo aqui...]",
    "metadata": {
      "processingTime": 15234,
      "tokensUsed": 4521,
      "validation": {
        "score": 9.2,
        "structureMatch": 94,
        "styleMatch": 96,
        "citationAccuracy": 91
      }
    }
  }
}
```

---

### **3. LISTAR AGENTES**
Lista todos os agentes de treinamento com filtros opcionais.

**Endpoint:**
```
GET /training/agents
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `category` | string | Filtrar por categoria |
| `jurisdiction` | string | Filtrar por jurisdição |
| `minQuality` | number | Qualidade mínima (0-10) |

**Exemplo de Requisição:**
```javascript
const response = await fetch('http://localhost:3001/api/training/agents?minQuality=8.5&category=Cível');
const result = await response.json();
console.log(result.data.agents);
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "clx123abc456",
        "name": "Manifestações Cíveis MT",
        "category": "Cível",
        "quality": 9.1,
        "trainingExamples": 3,
        "isActive": true,
        "createdAt": "2025-09-15T10:00:00Z",
        "updatedAt": "2025-10-01T10:00:00Z",
        "metadata": {
          "legalArea": "Cível",
          "jurisdiction": "Mato Grosso"
        }
      }
    ],
    "total": 1
  }
}
```

---

### **4. BUSCAR DETALHES DO AGENTE**
Retorna informações detalhadas de um agente específico.

**Endpoint:**
```
GET /training/agents/:agentId
```

**Exemplo de Requisição:**
```javascript
const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456');
const result = await response.json();
console.log(result.data);
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "clx123abc456",
    "name": "Manifestações Cíveis MT",
    "systemInstruction": "Você é um assistente jurídico...",
    "category": "Cível",
    "trainingExamples": 3,
    "quality": 9.1,
    "isActive": true,
    "createdAt": "2025-09-15T10:00:00Z",
    "updatedAt": "2025-10-01T10:00:00Z",
    "metadata": {
      "legalArea": "Cível",
      "jurisdiction": "Mato Grosso",
      "tone": "formal",
      "emphasis": ["fundamentação legal", "síntese"]
    }
  }
}
```

---

### **5. BUSCAR MÉTRICAS DO AGENTE**
Retorna métricas de uso e performance do agente.

**Endpoint:**
```
GET /training/agents/:agentId/metrics
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `period` | string | Período (7d, 30d, 90d, all) - padrão: 30d |

**Exemplo de Requisição:**
```javascript
const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456/metrics?period=30d');
const result = await response.json();
console.log(result.data);
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "data": {
    "agentId": "clx123abc456",
    "name": "Manifestações Cíveis MT",
    "usage": {
      "totalUsages": 47,
      "lastUsed": "2025-10-03T17:45:00Z",
      "avgProcessingTime": 12345
    },
    "quality": {
      "avgScore": 9.1,
      "avgUserRating": 8.7,
      "trend": "improving"
    },
    "alignment": {
      "structureMatch": 92,
      "styleMatch": 95,
      "citationAccuracy": 89,
      "overallAlignment": 92
    },
    "improvements": [
      {
        "version": "1.1",
        "date": "2025-10-01T10:00:00Z",
        "type": "AUTO_RETRAIN",
        "qualityBefore": 8.5,
        "qualityAfter": 9.1,
        "improvement": "+7%"
      }
    ]
  }
}
```

---

### **6. ENVIAR FEEDBACK**
Envia feedback sobre um documento gerado.

**Endpoint:**
```
POST /training/agents/:agentId/feedback
```

**Content-Type:** `application/json`

**Body:**
```json
{
  "generationId": "gen-1696354800123",
  "rating": 9,
  "feedback": "Excelente documento!",
  "corrections": "Ajustei apenas a conclusão..."
}
```

**Exemplo de Requisição:**
```javascript
const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456/feedback', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    generationId: 'gen-1696354800123',
    rating: 9,
    feedback: 'Excelente documento!',
    corrections: 'Ajustei apenas a conclusão...'
  })
});

const result = await response.json();
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "message": "Feedback registrado com sucesso"
}
```

---

### **7. RETREINAR AGENTE**
Retreina um agente incorporando correções recentes.

**Endpoint:**
```
POST /training/agents/:agentId/retrain
```

**Content-Type:** `application/json`

**Body:**
```json
{
  "useRecentCorrections": true,
  "additionalInstructions": "Incluir mais citações doutrinárias"
}
```

**Exemplo de Requisição:**
```javascript
const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456/retrain', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    useRecentCorrections: true,
    additionalInstructions: 'Incluir mais citações doutrinárias'
  })
});

const result = await response.json();
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "data": {
    "oldVersion": "1.0",
    "newVersion": "1.1",
    "qualityBefore": 8.5,
    "qualityAfter": 9.1,
    "improvements": [
      "Citações legais +15%",
      "Estrutura mais consistente"
    ]
  }
}
```

---

### **8. ADICIONAR MODELO A AGENTE EXISTENTE**
Adiciona um novo modelo exemplar a um agente já treinado.

**Endpoint:**
```
POST /training/agents/:agentId/models
```

**Content-Type:** `multipart/form-data`

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `modelFile` | File | ✅ Sim | PDF do novo modelo (até 10MB) |
| `description` | string | ❌ Não | Descrição do modelo |

**Exemplo de Requisição:**
```javascript
const formData = new FormData();
formData.append('modelFile', newModelFile);
formData.append('description', 'Modelo com fundamentação robusta');

const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456/models', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "message": "Modelo adicionado com sucesso",
  "data": {
    "modelId": "model-1696354800123",
    "fileName": "novo_modelo.pdf",
    "description": "Modelo com fundamentação robusta"
  }
}
```

---

### **9. DELETAR AGENTE**
Remove um agente do sistema.

**Endpoint:**
```
DELETE /training/agents/:agentId
```

**Exemplo de Requisição:**
```javascript
const response = await fetch('http://localhost:3001/api/training/agents/clx123abc456', {
  method: 'DELETE'
});

const result = await response.json();
```

**Resposta de Sucesso (200 OK):**
```json
{
  "success": true,
  "message": "Agente deletado com sucesso"
}
```

---

## 🔒 **CÓDIGOS DE STATUS HTTP**

| Código | Significado |
|--------|-------------|
| `200` | Sucesso - Requisição processada com sucesso |
| `201` | Criado - Agente criado com sucesso |
| `400` | Bad Request - Dados inválidos ou faltando |
| `404` | Not Found - Agente não encontrado |
| `500` | Internal Server Error - Erro no servidor |

---

## 📦 **EXEMPLO COMPLETO DE FLUXO**

### **1. Treinar um novo agente**
```javascript
// Preparar arquivos
const modelFile1 = document.getElementById('model1').files[0];
const modelFile2 = document.getElementById('model2').files[0];
const modelFile3 = document.getElementById('model3').files[0];

const formData = new FormData();
formData.append('name', 'Manifestações Cíveis MT');
formData.append('documentType', 'Manifestação do MP');
formData.append('legalArea', 'Cível');
formData.append('jurisdiction', 'Mato Grosso');
formData.append('customInstructions', 'Gere manifestações formais do MP');
formData.append('tone', 'formal');
formData.append('emphasis', JSON.stringify(['fundamentação legal']));
formData.append('modelFiles', modelFile1);
formData.append('modelFiles', modelFile2);
formData.append('modelFiles', modelFile3);

const trainResponse = await fetch('http://localhost:3001/api/training/train', {
  method: 'POST',
  body: formData
});

const trainResult = await trainResponse.json();
const agentId = trainResult.data.agentId;

console.log('✅ Agente treinado:', agentId);
```

### **2. Gerar documento com o agente**
```javascript
const processFile = document.getElementById('process').files[0];

const generateFormData = new FormData();
generateFormData.append('processDocument', processFile);
generateFormData.append('additionalInstructions', 'Enfatizar aspecto constitucional');

const generateResponse = await fetch(`http://localhost:3001/api/training/agents/${agentId}/generate`, {
  method: 'POST',
  body: generateFormData
});

const generateResult = await generateResponse.json();
const document = generateResult.data.generatedDocument;

console.log('📄 Documento gerado:', document);
```

### **3. Enviar feedback**
```javascript
const feedbackResponse = await fetch(`http://localhost:3001/api/training/agents/${agentId}/feedback`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    generationId: generateResult.data.generationId,
    rating: 9,
    feedback: 'Excelente!',
    corrections: 'Ajustei a conclusão'
  })
});

console.log('✅ Feedback enviado');
```

### **4. Buscar métricas**
```javascript
const metricsResponse = await fetch(`http://localhost:3001/api/training/agents/${agentId}/metrics`);
const metricsResult = await metricsResponse.json();

console.log('📊 Métricas:', metricsResult.data);
```

---

## 🎯 **NOTAS IMPORTANTES**

1. **Limite de Arquivos:** Máximo de 10MB por arquivo PDF
2. **Modelos:** Entre 1 e 5 modelos exemplares obrigatórios para treinar
3. **Formato:** Apenas arquivos PDF são aceitos
4. **Encoding:** Use `multipart/form-data` para uploads de arquivo
5. **JSON:** Use `application/json` para endpoints sem arquivos
6. **IDs:** Os IDs dos agentes são gerados automaticamente (formato: clx...)

---

## ⚡ **TESTANDO A API**

### **Via cURL:**
```bash
# Treinar agente
curl -X POST http://localhost:3001/api/training/train \
  -F "name=Teste" \
  -F "documentType=Manifestação" \
  -F "customInstructions=Instrução teste" \
  -F "modelFiles=@modelo.pdf"

# Listar agentes
curl http://localhost:3001/api/training/agents
```

### **Via Postman:**
1. Selecione `POST` e URL: `http://localhost:3001/api/training/train`
2. Vá em `Body` → `form-data`
3. Adicione os campos (name, documentType, etc.)
4. Para arquivos, selecione `File` no dropdown e faça upload
5. Clique em `Send`

### **Via JavaScript (Frontend React):**
```javascript
import { useState } from 'react';

function TrainAgentForm() {
  const [files, setFiles] = useState([]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', e.target.name.value);
    formData.append('documentType', e.target.documentType.value);
    formData.append('customInstructions', e.target.instructions.value);
    
    files.forEach(file => {
      formData.append('modelFiles', file);
    });
    
    try {
      const response = await fetch('http://localhost:3001/api/training/train', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Agente treinado com sucesso! ID: ${result.data.agentId}`);
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Nome do agente" required />
      <input name="documentType" placeholder="Tipo de documento" required />
      <textarea name="instructions" placeholder="Instruções" required />
      <input 
        type="file" 
        multiple 
        accept=".pdf"
        onChange={(e) => setFiles(Array.from(e.target.files))}
        required 
      />
      <button type="submit">Treinar Agente</button>
    </form>
  );
}

export default TrainAgentForm;
```

---

**API implementada com sucesso! 🚀⚖️**
