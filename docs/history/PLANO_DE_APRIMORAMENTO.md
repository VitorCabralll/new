# Plano de Aprimoramento do Pipeline de Análise de Documentos

## 1. Objetivo

Este documento detalha um plano técnico e assertivo para avaliar, testar e aprimorar sistematicamente cada etapa do pipeline de processamento de documentos, com o objetivo de garantir a geração de resultados da mais alta qualidade para a elaboração de manifestações jurídicas.

---

## 2. Fases do Plano

### Fase 1: Validação da Qualidade da Extração de Texto (OCR)

**Objetivo:** Garantir que o texto extraído dos arquivos PDF seja uma representação fiel do conteúdo original, com o mínimo de erros de caracteres.

**Metodologia Técnica:**
1.  **Criação de "Ground Truth":**
    *   **Ação:** Para cada um dos 4 PDFs de teste, um humano irá manualmente copiar e colar 2-3 parágrafos-chave (incluindo tabelas e texto formatado) em arquivos de texto puro (`.txt`). Estes serão nosso "gabarito".
    *   **Local:** `backend/test/ground_truth/`.

2.  **Desenvolvimento de Teste de Fidelidade:**
    *   **Ação:** Criar um novo teste automatizado, `extraction.test.ts`.
    *   **Lógica:** O teste irá:
        a. Executar a função `extractTextFromPDF` nos PDFs de teste.
        b. Ler os arquivos de "ground truth" correspondentes.
        c. Utilizar uma biblioteca de comparação de strings (ex: `diff`) para comparar o texto extraído com o gabarito.
        d. Calcular o **Índice de Erro de Caractere (Character Error Rate - CER)**.

**Critério de Sucesso (Assertividade):**
*   **CER deve ser inferior a 1%**. Se o índice for superior, a implementação atual de extração (`pdf-parse`) é inadequada.
*   **Ação Corretiva:** Em caso de falha, o pipeline será modificado para usar a extração via `pdf-poppler` (já instalado), que renderiza o PDF como imagem e aplica OCR, potencialmente melhorando a fidelidade. Um novo teste será executado para validar a nova abordagem.

---

### Fase 2: Validação da Estratégia de Chunking

**Objetivo:** Assegurar que a divisão do texto em "chunks" seja logicamente sã, semanticamente coesa e não quebre sentenças ou ideias importantes ao meio.

**Metodologia Técnica:**
1.  **Teste de Integridade Sintática:**
    *   **Ação:** Expandir o teste `documentProcessing.test.ts`.
    *   **Lógica:** Adicionar uma asserção que itera sobre cada chunk gerado e verifica se ele termina com um caractere de pontuação final (`.`, `!`, `?`, `"` etc.) ou se o próximo chunk começa com uma letra maiúscula. Isso serve como uma heurística para identificar quebras de sentenças problemáticas.

2.  **Análise de Relevância Semântica (Pré-validação):**
    *   **Ação:** Revisão manual dos chunks gerados pelos testes atuais.
    *   **Lógica:** Um humano (você) avalia se os chunks correspondem a seções lógicas do documento (ex: um chunk para o preâmbulo, um para a decisão, etc.).

**Critério de Sucesso (Assertividade):**
*   **O teste de integridade sintática deve passar para >95% dos chunks gerados**.
*   A revisão manual deve confirmar que a estratégia de chunking `structural` está, de fato, seguindo a estrutura do documento. Se a revisão falhar, o algoritmo em `documentChunker.js` deve ser ajustado.

---

### Fase 3: Validação da Priorização de Chunks

**Objetivo:** Confirmar que os chunks marcados como `critical` ou `high` são, de fato, os mais relevantes para a criação das manifestações-alvo.

**Metodologia Técnica:**
1.  **Desenvolvimento do Script de Avaliação de Qualidade:**
    *   **Ação:** Criar um novo script executável: `backend/src/analysis/evaluate_quality.ts`.
    *   **Lógica (Conforme discutido):**
        a. O script processa o "processo completo" para gerar uma lista de chunks priorizados.
        b. Extrai o texto completo dos 3 "modelos de manifestação".
        c. Utiliza a API do Google Gemini (`@google/genai`) para gerar embeddings vetoriais para cada chunk do processo e para o texto completo de cada modelo.
        d. Calcula a **Similaridade de Cosseno** entre cada chunk e cada modelo.
        e. Gera um relatório em `backend/analysis_reports/` que ranqueia os chunks pela sua similaridade com cada um dos modelos.

**Critério de Sucesso (Assertividade):**
*   **Para cada modelo, os 5 chunks com maior similaridade de cosseno devem estar entre os chunks que o sistema classificou como `critical`**.
*   Se chunks de baixa prioridade (`low`, `medium`) aparecerem consistentemente com alta similaridade, a lógica de pontuação de relevância em `documentChunker.js` está falha e **deve ser refatorada**.

---

### Fase 4: Aprimoramento Iterativo e Documentação

**Objetivo:** Aplicar as descobertas das fases anteriores para refinar o pipeline e documentar os resultados.

**Metodologia Técnica:**
1.  **Análise de Relatórios:** Revisar os relatórios de falha dos testes (Fase 1 e 2) e os relatórios de similaridade (Fase 3).
2.  **Ajuste de Algoritmos:** Com base na análise, realizar modificações direcionadas nos arquivos `textExtractor.js` e `documentChunker.js`.
3.  **Ciclo de Testes:** Re-executar `npm test` e o script `evaluate_quality.ts` após cada modificação para medir o impacto.
4.  **Documentação:** Ao final do ciclo, gerar um relatório final em `analysis_reports/final_report.md` resumindo as melhorias implementadas, as métricas de qualidade alcançadas e as configurações finais do algoritmo.

