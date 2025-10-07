# Assistente Jurídico IA

## 1. Visão Geral

O **Assistente Jurídico IA** é uma Single Page Application (SPA) moderna e 100% client-side, projetada para otimizar o fluxo de trabalho de profissionais do direito. A ferramenta automatiza a geração de manifestações jurídicas, utilizando o poder da IA generativa do Google Gemini, e introduz um sistema inovador de "Agentes de IA" treináveis, que aprendem e replicam o estilo de escrita de um advogado ou escritório específico.

O projeto prioriza a **privacidade** e a **simplicidade**, realizando todo o processamento, incluindo o OCR (Reconhecimento Óptico de Caracteres) e a persistência de dados, diretamente no navegador do cliente.

---

## 2. Funcionalidades Principais

*   **Gerador de Manifestações:** O usuário pode fazer o upload de um processo em PDF, fornecer instruções específicas e receber uma petição completa, redigida pela IA.
*   **Agentes de IA Treináveis:** Crie agentes personalizados fornecendo exemplos de seu trabalho anterior. A IA analisa os documentos e gera uma "Instrução de Sistema" que captura sua estrutura, tom de voz e linha argumentativa.
*   **Gerenciamento de Agentes:** Salve, selecione e exclua facilmente entre diferentes agentes treinados, aplicando o estilo certo para cada caso. Os dados são salvos no `localStorage` do seu navegador.
*   **OCR no Cliente (Client-Side OCR):** A extração de texto de documentos PDF ocorre inteiramente no navegador do usuário, garantindo que o conteúdo sensível do processo nunca saia do seu computador antes de ser enviado para a API do Google.
*   **Download Simples:** Baixe a manifestação gerada em múltiplos formatos (`.txt`, `.docx`, `.pdf`).
*   **Arquitetura "Serverless":** A aplicação não depende de um backend, o que a torna fácil de hospedar e elimina custos de servidor.

---

## 3. Stack Tecnológica

*   **Framework:** [React](https://react.dev/) com [TypeScript](https://www.typescriptlang.org/)
*   **Estilização:** [TailwindCSS](https://tailwindcss.com/)
*   **Processamento de Documentos:**
    *   [PDF.js](https://mozilla.github.io/pdf.js/) (Leitura de PDF)
    *   [Tesseract.js](https://tesseract.projectnaptha.com/) (OCR)
*   **Persistência de Dados:** [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) do Navegador
*   **Inteligência Artificial:**
    *   **API:** [Google Gemini API](https://ai.google.dev/) via SDK `@google/genai`

---

## 4. Como Rodar o Projeto

Este projeto foi projetado para ser executado em ambientes de desenvolvimento web modernos que podem servir arquivos estáticos e fornecer as chaves de API necessárias como variáveis de ambiente.

### Pré-requisitos
*   Um ambiente de desenvolvimento web (como o Google Project IDX, VS Code com Live Server, etc.).
*   Uma chave de API para o **Google Gemini**, que deve ser disponibilizada para a aplicação como uma variável de ambiente `process.env.API_KEY`.

### Execução

1.  **Abra o projeto** no seu ambiente de desenvolvimento.
2.  **Inicie um servidor local** para servir o arquivo `index.html` e o restante dos arquivos estáticos. Se estiver usando uma extensão como o Live Server no VS Code, basta clicar em "Go Live".
3.  **Acesse a aplicação** no endereço fornecido pelo seu servidor (geralmente `http://localhost:5500` ou similar). A aplicação é autossuficiente e funcionará inteiramente no seu navegador.

---

## 5. Estrutura do Projeto

A estrutura de pastas foi simplificada para refletir a arquitetura 100% client-side.

```
.
├── components/            # Componentes React reutilizáveis
├── hooks/                 # Hooks customizados (ex: useAgents, useManifestationPipeline)
├── pages/                 # Componentes de página principais (MainApp)
├── services/              # Lógica de serviços (OCR, exportação, chamadas à API Gemini)
├── ARCHITECTURE.md        # Documentação da arquitetura client-side
├── README.md              # Este arquivo
└── index.html             # Ponto de entrada do frontend
```
