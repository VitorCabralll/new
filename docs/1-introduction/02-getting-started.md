# 2. Guia de Instalação e Stack

Este guia fornece as instruções para configurar e executar o ambiente de desenvolvimento local, bem como uma visão geral das tecnologias utilizadas.

## 1. Stack Tecnológica

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

## 2. Como Rodar o Projeto

Siga as instruções abaixo para configurar e executar o ambiente de desenvolvimento completo (frontend e backend).

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (versão 18 ou superior)
*   [npm](https://www.npmjs.com/) (geralmente instalado com o Node.js)
*   Uma chave de API para o **Google Gemini**.

### 2.1. Configuração do Backend

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

### 2.2. Configuração do Frontend

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

### 2.3. (Opcional) Execução Simplificada

Existe um script na raiz do projeto para iniciar ambos os servidores (backend e frontend) com um único comando.

```bash
npm run dev:all
```
Este comando executará os scripts `dev` de ambos os diretórios simultaneamente.