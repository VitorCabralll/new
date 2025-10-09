# Assistente Jurídico IA

## 1. Visão Geral

O **Assistente Jurídico IA** é uma Single Page Application (SPA) moderna com uma arquitetura cliente-servidor, projetada para otimizar o fluxo de trabalho de profissionais do direito. A ferramenta automatiza a geração de manifestações jurídicas, utilizando o poder da IA generativa do Google Gemini, e introduz um sistema inovador de "Agentes de IA" treináveis, que aprendem e replicam o estilo de escrita de um advogado ou escritório específico.

O projeto foi construído com foco em **privacidade** e **performance**. O processamento de documentos sensíveis, como o OCR (Reconhecimento Óptico de Caracteres), ocorre inteiramente no navegador do cliente, enquanto o gerenciamento dos Agentes de IA é centralizado em um backend dedicado para garantir consistência e escalabilidade.

---

## 2. Funcionalidades Principais

*   **Gerador de Manifestações:** O usuário pode fazer o upload de um processo em PDF, fornecer instruções específicas e receber uma petição completa, redigida pela IA.
*   **Agentes de IA Treináveis:** Crie agentes personalizados fornecendo exemplos de seu trabalho anterior. A IA analisa os documentos e gera uma "Instrução de Sistema" que captura sua estrutura, tom de voz e linha argumentativa.
*   **Gerenciamento de Agentes:** Salve e selecione facilmente entre diferentes agentes treinados. Os dados dos agentes são gerenciados de forma centralizada através de uma API dedicada, garantindo consistência.
*   **OCR no Cliente (Client-Side OCR):** A extração de texto de documentos PDF ocorre inteiramente no navegador do usuário, garantindo que o conteúdo sensível do processo nunca saia do seu computador antes de ser enviado para a API do Google.
*   **Download Simples:** Baixe a manifestação gerada em múltiplos formatos (`.txt`, `.docx`, `.pdf`).

---

## 3. Stack Tecnológica

### Frontend
*   **Framework:** [React](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
*   **Estilização:** [TailwindCSS](https://tailwindcss.com/)
*   **Processamento de Documentos:**
    *   [PDF.js](https://mozilla.github.io/pdf.js/) (Leitura de PDF)
    *   [Tesseract.js](https://tesseract.projectnaptha.com/) (OCR)
*   **Inteligência Artificial:**
    *   **API:** [Google Gemini API](https://ai.google.dev/) via SDK `@google/genai`

### Backend
*   **Framework:** [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/)
*   **ORM:** [Prisma](https://www.prisma.io/)
*   **Banco de Dados:** [SQLite](https://www.sqlite.org/index.html)

---

## 4. Como Rodar o Projeto

Siga as instruções abaixo para configurar e executar o ambiente de desenvolvimento completo (frontend e backend).

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   [npm](https://www.npmjs.com/) (geralmente instalado com o Node.js)
*   Uma chave de API para o **Google Gemini**.

### 1. Configuração do Backend

O servidor backend é responsável por gerenciar os Agentes de IA.

1.  **Navegue até o diretório do backend:**
    ```bash
    cd backend
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo chamado `.env` dentro do diretório `backend` e adicione a seguinte linha, que aponta para o banco de dados SQLite:
    ```
    DATABASE_URL="file:./dev.db"
    ```

4.  **Sincronize o banco de dados:**
    Este comando cria o arquivo de banco de dados SQLite e as tabelas com base no schema do Prisma.
    ```bash
    npx prisma db push
    ```

5.  **Inicie o servidor backend:**
    ```bash
    npm run dev
    ```
    O servidor estará em execução em `http://localhost:3001`.

### 2. Configuração do Frontend

O frontend é a interface com o usuário, construída em React.

1.  **Abra um novo terminal** e navegue até o diretório raiz do projeto.

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione sua chave da API do Google Gemini:
    ```
    VITE_API_KEY=SUA_CHAVE_DE_API_AQUI
    ```
    > **Importante:** O prefixo `VITE_` é necessário para que a variável seja exposta ao frontend.

4.  **Inicie o servidor de desenvolvimento do frontend:**
    ```bash
    npm run dev
    ```
    A aplicação estará acessível em `http://localhost:5173` (ou outra porta indicada pelo Vite).

### 3. (Opcional) Execução Simplificada

Existe um script na raiz do projeto para iniciar ambos os servidores (backend e frontend) com um único comando.

```bash
npm run dev:all
```
Este comando executará os scripts `dev` de ambos os diretórios simultaneamente.

---

## 5. Estrutura do Projeto

O projeto é um monorepo que contém o frontend (React) e o backend (Node.js/Express) em diretórios separados.

```
.
├── backend/               # Aplicação Backend (Node.js, Express, Prisma)
├── components/            # Componentes React reutilizáveis
├── hooks/                 # Hooks customizados (ex: useUserAgents, useManifestationPipeline)
├── pages/                 # Componentes de página principais (MainApp)
├── services/              # Lógica de serviços (OCR, exportação, chamadas à API)
├── README.md              # Este arquivo
└── index.html             # Ponto de entrada do frontend
```
