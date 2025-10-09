# 1. Visão Geral do Projeto

O **Assistente Jurídico IA** é uma Single Page Application (SPA) moderna com uma arquitetura cliente-servidor, projetada para otimizar o fluxo de trabalho de profissionais do direito. A ferramenta automatiza a geração de manifestações jurídicas, utilizando o poder da IA generativa do Google Gemini, e introduz um sistema inovador de "Agentes de IA" treináveis, que aprendem e replicam o estilo de escrita de um advogado ou escritório específico.

O projeto foi construído com foco em **privacidade** e **performance**. O processamento de documentos sensíveis, como o OCR (Reconhecimento Óptico de Caracteres), ocorre inteiramente no navegador do cliente, enquanto o gerenciamento dos Agentes de IA é centralizado em um backend dedicado para garantir consistência e escalabilidade.

---

## 2. Funcionalidades Principais

*   **Gerador de Manifestações:** O usuário pode fazer o upload de um processo em PDF, fornecer instruções específicas e receber uma petição completa, redigida pela IA.
*   **Agentes de IA Treináveis:** Crie agentes personalizados fornecendo exemplos de seu trabalho anterior. A IA analisa os documentos e gera uma "Instrução de Sistema" que captura sua estrutura, tom de voz e linha argumentativa.
*   **Gerenciamento de Agentes:** Salve e selecione facilmente entre diferentes agentes treinados. Os dados dos agentes são gerenciados de forma centralizada através de uma API dedicada, garantindo consistência.
*   **OCR no Cliente (Client-Side OCR):** A extração de texto de documentos PDF ocorre inteiramente no navegador do usuário, garantindo que o conteúdo sensível do processo nunca saia do seu computador antes de ser enviado para a API do Google.
*   **Download Simples:** Baixe a manifestação gerada em múltiplos formatos (`.txt`, `.docx`, `.pdf`).