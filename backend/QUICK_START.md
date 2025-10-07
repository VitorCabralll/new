# 🚀 QUICK START - API DE TREINAMENTO DE AGENTES

## ⚡ COMEÇANDO EM 5 MINUTOS

### **1️⃣ Iniciar o Servidor**

```bash
cd backend
npm run dev
```

✅ Servidor rodando em: `http://localhost:3001`

---

### **2️⃣ Testar API (Listagem)**

Abra o navegador ou use cURL:

```bash
curl http://localhost:3001/api/training/agents
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "agents": [],
    "total": 0
  }
}
```

---

### **3️⃣ Treinar Seu Primeiro Agente**

#### **Opção A: Via cURL**

```bash
curl -X POST http://localhost:3001/api/training/train \
  -F "name=Meu Primeiro Agente" \
  -F "documentType=Manifestação do MP" \
  -F "customInstructions=Gere manifestações jurídicas formais e bem fundamentadas" \
  -F "modelFiles=@/caminho/para/modelo1.pdf" \
  -F "modelFiles=@/caminho/para/modelo2.pdf"
```

#### **Opção B: Via JavaScript (Console do Navegador)**

```javascript
// Crie um formulário HTML simples primeiro
const formData = new FormData();
formData.append('name', 'Meu Primeiro Agente');
formData.append('documentType', 'Manifestação do MP');
formData.append('customInstructions', 'Gere manifestações jurídicas formais');
// Adicione seus arquivos PDF aqui
// formData.append('modelFiles', file1);
// formData.append('modelFiles', file2);

fetch('http://localhost:3001/api/training/train', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(data => console.log('Agente criado:', data));
```

#### **Opção C: Via Postman/Thunder Client**

1. **Método:** POST
2. **URL:** `http://localhost:3001/api/training/train`
3. **Body:** Form-data
4. **Campos:**
   - `name` → "Meu Primeiro Agente"
   - `documentType` → "Manifestação do MP"
   - `customInstructions` → "Gere manifestações jurídicas..."
   - `modelFiles` → [Selecionar PDFs]

---

### **4️⃣ Verificar Agente Criado**

```bash
curl http://localhost:3001/api/training/agents
```

Você verá seu agente na lista! 🎉

---

## 📝 **EXEMPLO COMPLETO - HTML**

Crie um arquivo `test.html` e abra no navegador:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Testar API - Treinamento de Agentes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    input, textarea, button {
      width: 100%;
      margin: 10px 0;
      padding: 10px;
      font-size: 14px;
    }
    button {
      background: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
    }
    button:hover {
      background: #45a049;
    }
    #result {
      background: #f4f4f4;
      padding: 15px;
      margin-top: 20px;
      border-radius: 5px;
      max-height: 400px;
      overflow: auto;
    }
  </style>
</head>
<body>
  <h1>🤖 Treinar Agente Jurídico</h1>
  
  <form id="trainForm">
    <input 
      type="text" 
      name="name" 
      placeholder="Nome do agente (ex: Manifestações Cíveis MT)"
      required
    />
    
    <input 
      type="text" 
      name="documentType" 
      placeholder="Tipo de documento (ex: Manifestação do MP)"
      required
    />
    
    <textarea 
      name="customInstructions" 
      placeholder="Instruções personalizadas..."
      rows="4"
      required
    ></textarea>
    
    <input 
      type="file" 
      name="modelFiles" 
      accept=".pdf"
      multiple
      required
    />
    <small>Selecione 1-5 PDFs exemplares</small>
    
    <button type="submit">🚀 Treinar Agente</button>
  </form>
  
  <div id="result"></div>
  
  <script>
    const form = document.getElementById('trainForm');
    const resultDiv = document.getElementById('result');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      resultDiv.innerHTML = '⏳ Treinando agente... Aguarde (pode levar 1-2 minutos)';
      
      const formData = new FormData();
      formData.append('name', form.name.value);
      formData.append('documentType', form.documentType.value);
      formData.append('customInstructions', form.customInstructions.value);
      
      const files = form.modelFiles.files;
      for (let i = 0; i < files.length; i++) {
        formData.append('modelFiles', files[i]);
      }
      
      try {
        const response = await fetch('http://localhost:3001/api/training/train', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
          resultDiv.innerHTML = `
            <h3>✅ Agente treinado com sucesso!</h3>
            <p><strong>ID:</strong> ${result.data.agentId}</p>
            <p><strong>Nome:</strong> ${result.data.name}</p>
            <p><strong>Qualidade:</strong> ${result.data.quality.toFixed(1)}/10</p>
            <p><strong>Modelos:</strong> ${result.data.trainingExamples}</p>
            <details>
              <summary>Ver System Instruction</summary>
              <pre>${result.data.systemInstruction}</pre>
            </details>
          `;
        } else {
          resultDiv.innerHTML = `
            <h3>❌ Erro ao treinar agente</h3>
            <p>${result.error}</p>
          `;
        }
      } catch (error) {
        resultDiv.innerHTML = `
          <h3>❌ Erro de conexão</h3>
          <p>${error.message}</p>
          <p>Certifique-se de que o servidor está rodando em http://localhost:3001</p>
        `;
      }
    });
  </script>
</body>
</html>
```

---

## 📋 **CHECKLIST DE TESTE**

Use este checklist para garantir que tudo está funcionando:

### **Servidor:**
- [ ] Servidor inicia sem erros
- [ ] Porta 3001 acessível
- [ ] Endpoint raiz responde (`http://localhost:3001`)

### **API - Listagem:**
- [ ] `GET /api/training/agents` retorna lista vazia
- [ ] Response tem formato correto

### **API - Treinamento:**
- [ ] `POST /api/training/train` aceita upload
- [ ] Validação de campos obrigatórios funciona
- [ ] Arquivo PDF é aceito
- [ ] Arquivos não-PDF são rejeitados
- [ ] Limite de 5 modelos é respeitado
- [ ] Agente é criado no banco
- [ ] Response contém agentId e quality

### **API - Busca:**
- [ ] `GET /api/training/agents/:id` retorna agente
- [ ] 404 para ID inexistente

### **API - Métricas:**
- [ ] `GET /api/training/agents/:id/metrics` retorna dados

### **API - Exclusão:**
- [ ] `DELETE /api/training/agents/:id` remove agente
- [ ] Agente não aparece mais na listagem

---

## 🐛 **TROUBLESHOOTING RÁPIDO**

### **Erro: Cannot find module**
```bash
npm install
```

### **Erro: Port 3001 already in use**
```bash
# Encontrar processo na porta 3001
netstat -ano | findstr :3001

# Matar processo (Windows)
taskkill /PID [PID_NUMBER] /F

# OU mudar porta em .env
PORT=3002
```

### **Erro: CORS**
Certifique-se de que o CORS está habilitado em `server.ts`:
```typescript
app.use(cors());
```

### **Erro: Multer - File too large**
Arquivos devem ser < 10MB cada

### **Erro: Prisma - Database**
```bash
npx prisma generate
npx prisma db push
```

---

## 📊 **TESTES RÁPIDOS**

### **Teste 1: Health Check**
```bash
curl http://localhost:3001
# Deve retornar: "Assistente Jurídico IA Backend is running!"
```

### **Teste 2: Listar Agentes**
```bash
curl http://localhost:3001/api/training/agents
# Deve retornar JSON com lista de agentes
```

### **Teste 3: Buscar Agente Inexistente**
```bash
curl http://localhost:3001/api/training/agents/invalid-id
# Deve retornar 404
```

---

## 🎯 **PRÓXIMOS PASSOS**

Depois de testar a API:

1. ✅ **Leia a documentação completa:** `API_TRAINING_DOCUMENTATION.md`
2. ✅ **Entenda o sistema:** `MODEL_ANALYZER_README.md`
3. ✅ **Veja o roadmap:** `PROXIMAS_IMPLEMENTACOES_DETALHADAS.md`
4. ✅ **Implemente o frontend:** Use os exemplos React fornecidos
5. ✅ **Adicione autenticação:** Para segurança em produção
6. ✅ **Implemente Validation Service:** Para melhor qualidade
7. ✅ **Adicione Continuous Improvement:** Para evolução automática

---

## 💡 **DICAS**

### **PDFs para Teste:**
- Use 2-3 documentos jurídicos reais
- Documentos devem ser do mesmo tipo
- Qualidade importa: PDFs limpos geram melhores agentes
- Evite PDFs escaneados de baixa qualidade

### **Instruções Customizadas:**
Seja específico! Exemplos bons:
- ✅ "Gere manifestações formais com fundamentação robusta em leis federais"
- ✅ "Priorize jurisprudência do STJ e STF nas citações"
- ✅ "Mantenha tom objetivo e técnico, evite linguagem coloquial"

Exemplos ruins:
- ❌ "Gere documentos"
- ❌ "Faça bem"
- ❌ "Como os modelos"

### **Performance:**
- Primeiro treinamento: ~1-2 minutos
- Próximos treinamentos: ~30-60 segundos (cache)
- Depende do tamanho dos PDFs e número de modelos

---

## 🎉 **PRONTO!**

Agora você pode:
- ✅ Treinar agentes jurídicos personalizados
- ✅ Gerar documentos automaticamente
- ✅ Avaliar e melhorar seus agentes
- ✅ Integrar com seu frontend

**Precisa de ajuda?** 
- Leia a documentação completa
- Verifique os exemplos
- Teste com os HTMLs fornecidos

---

**Boa sorte! 🚀⚖️💪**
