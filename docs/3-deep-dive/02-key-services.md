# 4. Deep Dive: Serviços Principais do Backend

Além do pipeline principal, vários serviços de suporte no backend desempenham papéis cruciais para garantir a qualidade, robustez e performance do sistema.

## 4.1. `documentChunker.ts` - Chunking Inteligente

Este serviço é responsável por dividir documentos grandes em pedaços menores e mais gerenciáveis ("chunks") para a IA.

*   **Estratégias Adaptativas:** O serviço não usa uma abordagem de "tamanho único". Ele aplica diferentes estratégias de chunking com base no tipo de documento (identificado na fase de análise inicial). Por exemplo, uma "Habilitação de Crédito" pode ter chunks menores para focar em detalhes, enquanto um "Processo Falimentar" pode ter chunks maiores.
*   **Priorização de Relevância:** Após a divisão, cada chunk recebe uma pontuação de relevância. Chunks que contêm informações críticas são marcados como de alta prioridade e processados primeiro, garantindo que os aspectos mais importantes do documento sejam considerados pela IA.
*   **Geração de Resumo Contextual:** Este serviço também cria um `contextSummary` (resumo contextual). Atualmente, isso é feito através da concatenação de metadados e entidades extraídas, fornecendo um contexto global para a IA sem a necessidade de uma chamada de API adicional para resumir.

## 4.2. `qualityValidator.ts` - Validação e Refinamento

Este serviço atua como um controle de qualidade para a manifestação gerada.

*   **Validação por Pontuação:** O texto gerado pela IA é analisado para verificar a presença de elementos essenciais, estrutura lógica e clareza. O resultado é uma pontuação de qualidade de 0 a 10.
*   **Refinamento de Passe Único:** Se a pontuação for muito baixa (atualmente, inferior a 5), o serviço aciona um mecanismo de auto-correção. Ele constrói um novo prompt que inclui os problemas específicos encontrados e instrui a IA a reescrever o texto, abordando essas falhas.
*   **Limitação Atual:** Este processo de refinamento ocorre no máximo **uma vez** por geração. Não é um loop iterativo que continua até que uma pontuação mínima seja atingida.

## 4.3. `auditLogger.ts` - Auditoria Completa

Para garantir a rastreabilidade e a conformidade, este serviço registra cada etapa do processo de geração.

*   **Registro Detalhado:** Ele registra o início e o fim de cada estágio do pipeline (extração, análise, chunking, geração, validação).
*   **Metadados Salvos:** Para cada estágio, são salvos metadados importantes, como o tempo de execução, os tokens de IA utilizados e os resultados intermediários.
*   **Benefício:** Ter um log de auditoria completo é fundamental para a depuração de problemas, otimização de performance e para fornecer uma trilha de auditoria clara de como um determinado documento foi gerado.

## 4.4. `sessionService.ts` - Persistência de Sessões

Este serviço gerencia a persistência de todo o ciclo de vida de uma geração no banco de dados.

*   **Armazenamento Completo:** Em vez de apenas salvar o resultado final, o serviço salva a sessão inteira, incluindo o texto extraído, a análise do documento, os chunks, o contexto e os resultados da geração.
*   **Substituição de Cache:** Este sistema é mais robusto do que um simples cache, pois os dados são persistidos de forma permanente no banco de dados.
*   **Funcionalidade Futura:** A principal vantagem é permitir o **refinamento iterativo futuro**. Um usuário pode, teoricamente, retornar a uma sessão salva e solicitar novas modificações, pois todo o contexto já está armazenado.