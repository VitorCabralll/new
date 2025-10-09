# Roadmap de Desenvolvimento

Este documento descreve o plano de desenvolvimento para o projeto **Assistente Jurídico IA**, dividido em marcos que representam fases de entrega de funcionalidades.

---

## ✅ Milestone 1: Produto Mínimo Viável (MVP)

*Status: **Concluído***

Esta fase focou em entregar o fluxo de valor principal da aplicação, permitindo que o usuário treine um agente e gere uma manifestação.

### Funcionalidades Entregues:

-   **[FEAT] Treinamento de Agentes:**
    -   Interface para upload de 3 arquivos PDF de exemplo.
    -   Criação de nome para o agente.
    -   Integração com a API Gemini para gerar a `systemInstruction` a partir dos exemplos.
-   **[FEAT] Persistência de Agentes:**
    -   Salvamento dos agentes criados no `localStorage`.
    -   Carregamento dos agentes ao iniciar a aplicação.
    -   Interface (Sidebar) para listar e selecionar o agente ativo.
-   **[FEAT] Geração de Manifestação:**
    -   Interface para upload do PDF do processo.
    -   Campo de texto para instruções do usuário.
    -   Pipeline de geração com status visuais para o usuário.
-   **[FEAT] OCR no Cliente:**
    -   Implementação do `ocrService` utilizando PDF.js e Tesseract.js para extrair texto dos PDFs localmente.
    -   Fluxo de geração modificado para enviar apenas o texto extraído para a API, otimizando custos.
-   **[FEAT] Visualização e Download:**
    -   Área de texto para exibir o resultado gerado.
    -   Funcionalidade para baixar o resultado como um arquivo `.txt`.

---

## ✅ Milestone 2: UX e Robustez

*Status: **Em Andamento***

Esta fase de desenvolvimento visa aprimorar a experiência do usuário, fornecer mais controle sobre os agentes e tornar a aplicação mais resiliente a erros.

### Itens de Trabalho:

-   **[UX] Feedback de Progresso do OCR:**
    -   **Descrição:** Modificar o `ocrService` para que ele possa reportar o progresso (ex: "Processando página 5 de 30...").
    -   **Tarefa:** Implementar um callback de progresso na função `extractTextFromPdf` e exibi-lo no componente `Loader`.
-   **[FEAT] Gerenciamento Completo de Agentes:**
    -   **Descrição:** Permitir que os usuários editem o nome de um agente existente e excluam agentes que não são mais necessários.
    -   **Status:** Concluído. A exclusão de agentes com confirmação foi implementada. A edição de nomes fica para o próximo ciclo.
-   **[OPS] Tratamento de Erros Aprimorado:**
    -   **Descrição:** Exibir mensagens de erro mais claras e úteis para o usuário.
    -   **Tarefa:** Refinar os blocos `try/catch` para capturar diferentes tipos de erro (falha de rede, erro de API, falha no OCR) e mostrar mensagens específicas na UI.

---

##  backlog Milestone 3: Funcionalidades Avançadas

*Status: **Em Andamento***

Esta fase inclui ideias para futuras versões do produto, focadas em expandir as capacidades de edição e colaboração.

### Ideias para o Futuro:

-   **[FEAT] Editor de Texto Rico (Rich Text Editor):**
    -   **Descrição:** Substituir a `<textarea>` de resultado por um editor que permita formatação básica (negrito, itálico, listas) antes do download.
    -   **Status:** Parcialmente concluído. Um editor de texto simples foi implementado.
-   **[FEAT] Múltiplos Formatos de Download:**
    -   **Descrição:** Adicionar a opção de baixar a manifestação em outros formatos, como `.docx` ou `.pdf`.
    -   **Status:** Concluído. Exportação para DOCX e PDF já está disponível.
-   **[FEAT] Histórico de Gerações:**
    -   **Descrição:** Salvar um histórico das manifestações geradas, permitindo que o usuário visualize e reutilize resultados anteriores.
-   **[FEAT] Modo de Edição Colaborativa:**
    -   **Descrição:** Permitir que o usuário edite o texto gerado pela IA e envie a versão corrigida de volta, refinando o resultado em um diálogo com o agente.
