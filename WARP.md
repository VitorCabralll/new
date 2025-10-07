# Assistente Jurídico IA - Warp Terminal Documentation

## 🔍 Visão Geral do Projeto

O **Assistente Jurídico IA** é uma aplicação full-stack que utiliza inteligência artificial para analisar documentos jurídicos e gerar manifestações automaticamente. O sistema combina tecnologias modernas de frontend (React + TypeScript) com um backend robusto (Node.js + Express) e integração com APIs de IA.

### 🏗️ Arquitetura do Sistema

```
├── Frontend (React + TypeScript + Vite)
│   ├── Interface de upload de documentos PDF
│   ├── Sistema de agentes IA configuráveis
│   ├── Pipeline de processamento em tempo real
│   └── Geração de documentos (PDF/DOCX)
├── Backend (Node.js + Express + TypeScript)
│   ├── API REST para processamento
│   ├── Integração com Google Gemini AI
│   ├── OCR com Tesseract.js
│   └── Sistema de auditoria completo
└── Banco de Dados (SQLite + Prisma ORM)
    ├── Gerenciamento de agentes IA
    ├── Auditoria de requisições
    └── Logs detalhados de processo
```

## 🚀 Comandos Essenciais do Warp

### Configuração Inicial

```bash
# Instalar dependências do projeto principal
npm install

# Configurar o backend
cd backend && npm install

# Gerar cliente Prisma e sincronizar banco
npx prisma generate
npx prisma db push

# Voltar ao diretório raiz
cd ..
```

### Comandos de Desenvolvimento

```bash
# Iniciar frontend e backend simultaneamente
npm run dev:all

# Iniciar apenas o frontend (porta 5173)
npm run dev

# Iniciar apenas o backend (porta 3001)
cd backend && npm run dev

# Build para produção
npm run build
```

### Comandos de Verificação e Testes

```bash
# Verificar tipos TypeScript (frontend)
npx tsc --noEmit

# Verificar tipos TypeScript (backend)
cd backend && npx tsc --noEmit

# Auditoria de segurança
npm audit

# Auditoria do backend
cd backend && npm audit
```

### Comandos do Banco de Dados

```bash
cd backend

# Gerar cliente Prisma após mudanças no schema
npx prisma generate

# Aplicar mudanças no banco sem migrations
npx prisma db push

# Visualizar dados no Prisma Studio
npx prisma studio

# Reset completo do banco
npx prisma migrate reset
```

## 🔧 Configuração de Ambiente

### Variáveis de Ambiente Necessárias

**Frontend (.env.local):**
```env
GEMINI_API_KEY=sua_chave_api_gemini_aqui
DATABASE_URL="file:./dev.db"
```

**Backend (.env):**
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### Obtenção da API Key do Google Gemini

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma nova API Key
3. Substitua o valor placeholder nos arquivos .env

## 🛠️ Comandos de Depuração

### Verificar Status dos Serviços

```bash
# Verificar se o backend está rodando
curl http://localhost:3001

# Testar endpoint de health check
curl http://localhost:3001/api/health

# Verificar logs do processo
# (Os logs aparecerão no terminal onde o comando foi executado)
```

### Problemas Comuns e Soluções

```bash
# Erro de porta ocupada - matar processo na porta 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Limpar cache do npm
npm cache clean --force
cd backend && npm cache clean --force

# Reinstalar dependências
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
cd backend && npm install

# Regenerar banco de dados
cd backend
rm dev.db
npx prisma db push
```

## 📊 Estrutura de Diretórios

```
assistente-juridico-ia/
├── backend/                 # Servidor Node.js
│   ├── src/
│   │   ├── routes/         # Rotas da API
│   │   ├── services/       # Lógica de negócio
│   │   └── server.ts       # Servidor principal
│   ├── prisma/
│   │   └── schema.prisma   # Esquema do banco
│   └── package.json
├── components/             # Componentes React
├── hooks/                  # Hooks customizados
├── pages/                  # Páginas da aplicação
├── services/              # Serviços do frontend
├── src/                   # Código fonte principal
│   └── main.tsx          # Ponto de entrada
├── types.ts              # Definições de tipos
├── package.json          # Dependências do frontend
├── vite.config.ts        # Configuração do Vite
└── tsconfig.json         # Configuração TypeScript
```

## 🔍 Comandos de Monitoramento

### Logs e Debug

```bash
# Verificar logs do sistema
# No Windows (PowerShell)
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Monitorar uso de recursos
Get-Counter "\Processor(_Total)\% Processor Time"

# Verificar espaço em disco
Get-WmiObject -Class Win32_LogicalDisk | Select-Object Size,FreeSpace,DeviceID
```

## 🚨 Comandos de Emergência

```bash
# Parar todos os processos Node.js
taskkill /im node.exe /f

# Limpar completamente e reinstalar
rm -rf node_modules backend/node_modules *.lock
npm install && cd backend && npm install

# Reset completo do projeto
git clean -fdx
npm install
cd backend
npm install
npx prisma generate
npx prisma db push
```

## 📈 Comandos de Produção

```bash
# Build para produção
npm run build

# Iniciar servidor de produção (backend)
cd backend
npm run build
npm start

# Servir frontend estático
npm run preview
```

## 🔐 Segurança e Manutenção

```bash
# Verificar vulnerabilidades
npm audit
npm audit fix

# Atualizar dependências
npm update
cd backend && npm update

# Backup do banco de dados
cp backend/dev.db backend/dev.db.backup.$(date +%Y%m%d_%H%M%S)
```

## 📚 Recursos Adicionais

### APIs Disponíveis

- **POST** `/api/generate` - Gerar manifestação jurídica
- **GET** `/api/agents` - Listar agentes IA
- **POST** `/api/agents` - Criar novo agente
- **PUT** `/api/agents/:id` - Atualizar agente
- **DELETE** `/api/agents/:id` - Deletar agente
- **GET** `/api/audit` - Relatórios de auditoria

### Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS
- **Backend:** Node.js, Express, TypeScript
- **Banco:** SQLite, Prisma ORM
- **IA:** Google Gemini API
- **OCR:** Tesseract.js
- **Documentos:** jsPDF, docx

### Portas do Sistema

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Prisma Studio:** http://localhost:5555

---

## 💡 Dicas para o Warp Terminal

1. Use `Ctrl+Shift+P` para acessar a paleta de comandos
2. Configure workflows personalizados para comandos frequentes
3. Use o histórico inteligente do Warp para repetir comandos complexos
4. Configure aliases para comandos longos:
   ```bash
   # Adicione ao seu profile
   alias dev-all="npm run dev:all"
   alias check-types="npx tsc --noEmit && cd backend && npx tsc --noEmit"
   alias reset-db="cd backend && rm dev.db && npx prisma db push"
   ```

## 🆘 Suporte

Para problemas específicos:
1. Verifique os logs no terminal
2. Execute `npm audit` para problemas de dependências
3. Use `npx tsc --noEmit` para verificar erros TypeScript
4. Consulte a documentação das tecnologias específicas

---

*Documentação atualizada para o projeto Assistente Jurídico IA - Versão 1.0*