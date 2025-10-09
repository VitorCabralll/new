# 2. Agentes Treináveis (Estilo do Usuário)

A funcionalidade "Agentes de IA Treináveis" é um dos pilares do projeto. É crucial entender que, na arquitetura **atual**, estes agentes são focados exclusivamente em capturar o **estilo de escrita** de um usuário, não o conhecimento jurídico técnico.

## 2.1. Conceito: Agentes de Estilo

O sistema atual permite que um usuário (um advogado, um escritório, etc.) crie um agente personalizado que aprende e replica suas preferências de escrita.

*   **O que é:** Um "Agente Treinável" é um perfil de IA que armazena uma `systemInstruction` (instrução de sistema) gerada a partir de exemplos de trabalho do próprio usuário.
*   **Responsabilidade:** Capturar o estilo, e não o mérito. Suas principais funções são:
    *   **Formatação Específica:** Estrutura de seções, uso de cabeçalhos, etc.
    *   **Tom de Voz:** Formal, informal, direto, etc.
    *   **Padrões de Escrita:** Como citações são formatadas, parágrafos curtos ou longos, jargões específicos.
*   **Personalização:** Cada agente é único e pertence a quem o treinou.

**Exemplo de uma `systemInstruction` gerada para um agente de estilo:**

```
[Gerado automaticamente a partir de 3 exemplos enviados pelo usuário]

ESTILO IDENTIFICADO:
- Tom formal e objetivo
- Seções: IDENTIFICAÇÃO → ANÁLISE → FUNDAMENTAÇÃO → PARECER
- Usa negrito em termos-chave (**MINISTÉRIO PÚBLICO**, **LEI**)
- Citações sempre com número completo: "Lei nº 11.101, de 9/2/2005"
- Parágrafos curtos (3-4 linhas)
- Inicia sempre: "Cuida-se de manifestação nos autos..."
```

## 2.2. Como Funciona o Treinamento

O processo é gerenciado pelo backend e funciona da seguinte forma:

1.  **Upload de Exemplos:** O usuário faz o upload de 3 a 5 documentos (em formato PDF) que são representativos de seu estilo de escrita.
2.  **Análise pela IA:** O backend usa a API do Google Gemini para analisar os exemplos em conjunto. A IA recebe a instrução de identificar e extrair os padrões de estilo, tom e formatação.
3.  **Geração da Instrução:** O resultado dessa análise é uma `systemInstruction` detalhada, como a do exemplo acima.
4.  **Persistência:** A instrução gerada é salva no banco de dados (SQLite) e associada ao agente recém-criado.

O endpoint responsável por este fluxo é `backend/src/routes/generateInstruction.ts`.

## 2.3. Distinção Importante: Estilo vs. Conhecimento

É fundamental não confundir os **Agentes Treináveis (de Estilo)**, que já estão implementados, com a proposta futura de **Agentes Especializados (de Conhecimento)**.

*   **Agentes de Estilo (Atual):** Focam na **forma** do documento. Eles garantem que a manifestação gerada "pareça" ter sido escrita pelo usuário.
*   **Agentes de Conhecimento (Futuro):** Focam no **conteúdo** técnico-jurídico. A ideia é que eles garantam a correção de leis, artigos e procedimentos (veja a documentação em `4-future-vision/`).

Na arquitetura atual, todo o conhecimento jurídico é injetado no prompt no momento da geração, mas não existe um "agente" pré-definido para isso. A combinação dos dois tipos de agentes é a visão de longo prazo do projeto.