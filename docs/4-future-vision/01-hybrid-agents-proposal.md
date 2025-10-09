# 1. Proposta de Arquitetura Futura: Agentes Híbridos

> ⚠️ **Aviso:** O conteúdo deste documento descreve uma arquitetura **proposta** para uma futura versão do sistema. Ela **não está implementada** na versão atual do código.

A visão de longo prazo para o projeto é evoluir para um sistema de **Agentes Híbridos**, que combina o poder dos Agentes Treináveis (focados em estilo) com uma nova classe de **Agentes Especializados** (focados em conhecimento jurídico).

## 1.1. O Conceito: Conhecimento + Estilo

A ideia central é separar as responsabilidades da geração de conteúdo em duas camadas:

1.  **Agente Especializado (Conhecimento):** Um agente pré-configurado e mantido pela plataforma, com profundo conhecimento sobre uma matéria jurídica específica (ex: "Habilitação de Crédito"). Sua responsabilidade é garantir a **correção técnica**, citando as leis corretas, seguindo os procedimentos adequados e realizando análises de mérito.

2.  **Agente do Usuário (Estilo):** O agente treinável já existente, que captura a **forma** da escrita do usuário — seu tom de voz, formatação preferida, estrutura de seções, etc.

A combinação dos dois resultaria em uma manifestação que é, ao mesmo tempo, tecnicamente robusta e perfeitamente alinhada com o estilo de escrita do usuário.

```
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│   Agente Especializado (Fixo)    │      │     Agente do Usuário (Treinável)  │
├──────────────────────────────────┤      ├──────────────────────────────────┤
│   - Conhecimento Jurídico        │      │   - Estilo de Escrita            │
│   - Leis e Procedimentos         │  +   │   - Tom de Voz                   │
│   - Análise Técnica              │      │   - Formatação                   │
└──────────────────────────────────┘      └──────────────────────────────────┘
                   |
                   ▼
┌──────────────────────────────────────────┐
│           Manifestação Híbrida           │
├──────────────────────────────────────────┤
│ ✅ Conteúdo Tecnicamente Correto         │
│ ✅ Formatado no Estilo do Usuário          │
└──────────────────────────────────────────┘
```

## 1.2. Arquitetura Proposta: Prompt Híbrido

A abordagem recomendada para implementar este sistema é o **Prompt Híbrido Estruturado**. Em vez de múltiplas chamadas de IA, um único prompt, mais sofisticado, seria construído e enviado para a API.

Este prompt conteria seções distintas:
1.  **Conhecimento Especializado:** A `systemInstruction` do agente especializado relevante.
2.  **Estilo do Usuário:** A `systemInstruction` do agente do usuário selecionado.
3.  **Contexto e Documento:** O texto do processo e as instruções do usuário.
4.  **Tarefa:** Instruções claras para a IA, orientando-a a usar o conhecimento técnico da primeira seção e aplicá-lo usando o estilo da segunda.

## 1.3. Novos Componentes Propostos

A implementação desta visão exigiria a criação de novos componentes no backend, como:

*   `SpecializedAgentRegistry`: Um registro para carregar e gerenciar os diferentes Agentes Especializados disponíveis.
*   `TechnicalAnalyzer`: Um novo serviço no pipeline que, antes da geração final, utilizaria o Agente Especializado para realizar uma análise técnica prévia do documento.
*   `HybridPromptBuilder`: Um construtor de prompts mais avançado, capaz de montar o prompt híbrido combinando as instruções dos dois tipos de agentes.

Esta arquitetura representa o próximo passo na evolução do Assistente Jurídico IA, visando um salto significativo na qualidade, precisão e confiabilidade das manifestações geradas.