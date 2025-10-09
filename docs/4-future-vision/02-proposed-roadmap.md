# 2. Roadmap de Implementação Proposto

> ⚠️ **Aviso:** Este roadmap é uma proposta e está sujeito a alterações. Ele descreve os passos para implementar a arquitetura de Agentes Híbridos.

A implementação da arquitetura de Agentes Híbridos foi planejada em várias fases para garantir um desenvolvimento incremental, com entregas de valor contínuas.

---

## Fase 1: MVP - Fundação da Arquitetura (Estimativa: 1 semana)

O objetivo desta fase é construir a estrutura central do sistema de Agentes Híbridos com um único Agente Especializado funcional.

*   **Dia 1: Estrutura dos Agentes Especializados**
    *   [ ] Criar a estrutura de diretórios `backend/src/agents/specialized/`.
    *   [ ] Implementar o primeiro Agente Especializado (ex: `habilitacaoCredito.ts`).
    *   [ ] Criar o `SpecializedAgentRegistry` (`index.ts`) para carregar e fornecer os agentes.
    *   [ ] Escrever testes unitários para o registro.

*   **Dia 2: Serviço de Análise Técnica**
    *   [ ] Criar o serviço `technicalAnalyzer.ts`.
    *   [ ] Integrá-lo com a API do Google Gemini para executar a análise com o prompt do Agente Especializado.
    *   [ ] Implementar um parser de JSON robusto (com fallback) para os resultados da IA.

*   **Dia 3: Construtor de Prompt Híbrido**
    *   [ ] Criar o `HybridPromptBuilder`.
    *   [ ] Implementar a lógica para combinar a instrução do Agente Especializado com a instrução do Agente de Usuário.
    *   [ ] Escrever testes para garantir que os prompts híbridos sejam gerados corretamente.

*   **Dia 4: Integração no Pipeline**
    *   [ ] Modificar a rota `generate.ts` para invocar o `TechnicalAnalyzer` e o `HybridPromptBuilder`.
    *   [ ] Adicionar a nova etapa de análise técnica ao `AuditLogger`.
    *   [ ] Realizar testes end-to-end com um documento real para validar o fluxo completo.

*   **Dia 5: Deploy e Validação**
    *   [ ] Fazer o deploy do MVP em um ambiente de `staging`.
    *   [ ] Validar o fluxo com um grupo de usuários beta.

---

## Fase 2: Expansão e Aprimoramento (Estimativa: 1-2 semanas)

Com a fundação no lugar, esta fase foca em expandir o conhecimento do sistema e aprimorar sua inteligência.

*   **[ ] Adicionar Mais Agentes Especializados:**
    *   Implementar agentes para outras áreas do direito (ex: `Processo Falimentar`, `Recuperação Judicial`).
    *   Testar cada novo agente com documentos específicos de sua área.

*   **[ ] Aprimorar a Validação (Validação Semântica):**
    *   Melhorar o `qualityValidator.ts` para usar o Agente Especializado como um validador.
    *   A IA pode verificar se a manifestação final abordou todos os pontos do checklist técnico, se os cálculos estão corretos e se a argumentação jurídica é coerente.

*   **[ ] Implementar Loop de Refinamento Iterativo:**
    *   Modificar o atual refinamento de passe único para um loop.
    *   O sistema deve refinar o texto iterativamente até que a pontuação de qualidade atinja um limiar mínimo (ex: 7/10) ou um número máximo de tentativas (ex: 3) seja atingido.

---

## Fase 3: Otimização e Produção (Estimativa: 1 semana)

A fase final concentra-se em otimizar a performance, monitorar os resultados e preparar para o lançamento em produção.

*   **[ ] Monitoramento e Métricas:**
    *   Criar um dashboard para comparar a qualidade das gerações com e sem os Agentes Especializados.
    *   Monitorar métricas de custo (tokens por geração) vs. qualidade (pontuação média, taxa de erro técnico).

*   **[ ] Otimização de Performance e Custo:**
    *   Refinar os prompts para reduzir o uso de tokens sem sacrificar a qualidade.
    *   Implementar caching para análises técnicas de documentos idênticos (usando checksum MD5, por exemplo).

*   **[ ] Documentação e Deploy Final:**
    *   Atualizar toda a documentação para refletir a nova arquitetura.
    *   Realizar o deploy para produção, possivelmente de forma gradual (feature flag) para monitorar o impacto.