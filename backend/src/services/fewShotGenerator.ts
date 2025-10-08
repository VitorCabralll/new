/**
 * Few-Shot Generator - Geração com aprendizado por exemplos
 *
 * Combina: Análise + Plano + Exemplos (cached) + Templates + Variáveis
 */

import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prisma.js';
import { UniversalAnalise } from '../agents/system/UniversalAnalista.js';
import { UniversalPlano } from '../agents/system/UniversalPlanejador.js';
import { RAGService, SimilarModel } from './ragService.js';
import { VariableExtractor, ContextVariables } from './variableExtractor.js';
import { ContextCache } from './contextCache.js';

export interface GenerationResult {
  manifestacao: string;
  metadata: {
    modelosUsados: string[];
    templatesUsados: number;
    variaveisSubstituidas: string[];
    usouCache: boolean;
    tokensEstimados: number;
  };
}

export class FewShotGenerator {
  private genAI: GoogleGenAI;
  private ragService: RAGService;
  private contextCache: ContextCache;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
    this.ragService = new RAGService();
    this.contextCache = new ContextCache(apiKey);
  }

  /**
   * Gerar manifestação com few-shot learning
   */
  async gerar(
    userAgentId: string,
    analise: UniversalAnalise,
    plano: UniversalPlano,
    documentoOriginal: string
  ): Promise<GenerationResult> {

    console.log(`\n[FewShotGenerator] Iniciando geração para agente ${userAgentId}`);

    // 1. Buscar agente do usuário
    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      throw new Error(`UserAgent ${userAgentId} não encontrado`);
    }

    // 2. Buscar modelos similares (RAG)
    console.log('[FewShotGenerator] Buscando modelos similares...');
    const modelosSimilares = await this.ragService.buscarModelosSimilares(
      userAgentId,
      analise,
      3 // Top 3 modelos
    );

    if (modelosSimilares.length === 0) {
      console.warn('[FewShotGenerator] Nenhum modelo similar encontrado - usando fallback');
      // Fallback: buscar modelos mais recentes
      const fallback = await this.ragService.buscarMaisRecentes(userAgentId, 2);
      modelosSimilares.push(...fallback);
    }

    // 3. Extrair variáveis do caso atual
    console.log('[FewShotGenerator] Extraindo variáveis contextuais...');
    const variaveis = VariableExtractor.extrairVariaveis(analise, plano);

    // 4. Buscar templates aplicáveis
    console.log('[FewShotGenerator] Buscando templates aplicáveis...');
    const templates = await this.buscarTemplatesAplicaveis(userAgentId, analise);

    // 5. Verificar/criar cache de exemplos
    let cacheName: string | undefined;
    let usouCache = false;

    const cacheAtivo = this.contextCache.getCacheAtivo(userAgentId);

    if (cacheAtivo) {
      cacheName = cacheAtivo.name;
      usouCache = true;
      console.log('[FewShotGenerator] Usando cache existente');
    } else if (modelosSimilares.length > 0) {
      // Criar novo cache
      console.log('[FewShotGenerator] Criando novo cache de exemplos...');
      try {
        cacheName = await this.contextCache.criarCacheExemplos(
          userAgentId,
          modelosSimilares.map(m => ({
            fileName: m.fileName,
            text: m.fullText
          })),
          1 // 1 hora de TTL
        );
        usouCache = true;
      } catch (error) {
        console.error('[FewShotGenerator] Erro ao criar cache:', error);
        // Continuar sem cache
      }
    }

    // 6. Construir prompt de geração
    console.log('[FewShotGenerator] Construindo prompt...');
    const prompt = this.construirPromptGeracao(
      userAgent,
      analise,
      plano,
      variaveis,
      templates,
      modelosSimilares,
      !usouCache // Se não usou cache, incluir exemplos inline
    );

    // 7. Gerar manifestação
    console.log('[FewShotGenerator] Gerando manifestação...');
    let manifestacao: string;

    if (usouCache && cacheName) {
      // Gerar usando cache (75% economia)
      manifestacao = await this.contextCache.gerarComCache(cacheName, prompt, {
        temperature: 0.3,
        maxOutputTokens: 8192
      });
    } else {
      // Gerar sem cache (exemplos inline)
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      });

      manifestacao = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // 8. Calcular tokens estimados
    const tokensEstimados = this.estimarTokens(prompt) + this.estimarTokens(manifestacao);

    console.log('[FewShotGenerator] Geração concluída!');
    console.log(`  - Modelos usados: ${modelosSimilares.length}`);
    console.log(`  - Templates usados: ${templates.length}`);
    console.log(`  - Variáveis substituídas: ${Object.keys(variaveis).filter(k => variaveis[k] !== undefined).length}`);
    console.log(`  - Usou cache: ${usouCache ? 'SIM (economia 75%)' : 'NÃO'}`);
    console.log(`  - Tokens estimados: ${tokensEstimados}`);

    return {
      manifestacao,
      metadata: {
        modelosUsados: modelosSimilares.map(m => m.fileName),
        templatesUsados: templates.length,
        variaveisSubstituidas: Object.keys(variaveis).filter(k => variaveis[k] !== undefined),
        usouCache,
        tokensEstimados
      }
    };
  }

  /**
   * Buscar templates aplicáveis ao caso atual
   */
  private async buscarTemplatesAplicaveis(
    userAgentId: string,
    analise: UniversalAnalise
  ): Promise<any[]> {

    const templates = await prisma.agentTemplate.findMany({
      where: {
        userAgentId,
        confidence: { gte: 0.6 } // Apenas templates com boa confiança
      },
      orderBy: {
        confidence: 'desc'
      },
      take: 5 // Top 5 templates
    });

    // Filtrar por contexto (se aplicável)
    const filtrados = templates.filter(t => {
      if (!t.applicableWhen) return true;

      try {
        const condicoes = JSON.parse(t.applicableWhen);

        // Verificar condições
        if (condicoes.has_divergencia && analise.valores?.total?.correto === false) {
          return true;
        }

        if (condicoes.tipo_credito && analise.classificacoes?.tipoCredito === condicoes.tipo_credito) {
          return true;
        }

        return false;
      } catch {
        return true; // Se erro no parse, incluir
      }
    });

    return filtrados.length > 0 ? filtrados : templates.slice(0, 3);
  }

  /**
   * Construir prompt de geração
   */
  private construirPromptGeracao(
    userAgent: any,
    analise: UniversalAnalise,
    plano: UniversalPlano,
    variaveis: ContextVariables,
    templates: any[],
    modelos: SimilarModel[],
    incluirExemplosInline: boolean
  ): string {

    let prompt = `# AGENTE GERADOR - ${userAgent.name}\n\n`;

    // 1. Identidade do agente (do treinamento)
    prompt += `## SUA IDENTIDADE\n\n${userAgent.systemInstruction}\n\n---\n\n`;

    // 2. Análise do caso atual
    prompt += `## ANÁLISE DO CASO ATUAL\n\n\`\`\`json\n${JSON.stringify(analise, null, 2)}\n\`\`\`\n\n---\n\n`;

    // 3. Plano estruturado
    prompt += `## PLANO ESTRUTURADO\n\n\`\`\`json\n${JSON.stringify(plano, null, 2)}\n\`\`\`\n\n---\n\n`;

    // 4. Variáveis do caso
    prompt += `## VARIÁVEIS DO CASO ATUAL\n\n\`\`\`json\n${JSON.stringify(variaveis, null, 2)}\n\`\`\`\n\n---\n\n`;

    // 5. Exemplos (inline ou referência ao cache)
    if (incluirExemplosInline && modelos.length > 0) {
      prompt += `## SEUS MODELOS DE REFERÊNCIA (ESTILO E ESTRUTURA)\n\n`;
      prompt += `Analise os exemplos abaixo. Eles são suas manifestações anteriores.\n`;
      prompt += `Mantenha a MESMA linguagem, tom, estrutura, formatação.\n\n`;

      modelos.slice(0, 2).forEach((modelo, i) => {
        prompt += `### EXEMPLO ${i + 1}: ${modelo.fileName}\n\n`;
        prompt += modelo.fullText.substring(0, 2000);
        if (modelo.fullText.length > 2000) {
          prompt += '\n\n[... documento continua ...]';
        }
        prompt += '\n\n---\n\n';
      });
    }

    // 6. Templates aprendidos
    if (templates.length > 0) {
      prompt += `## TEMPLATES APRENDIDOS (Usar como base)\n\n`;

      templates.forEach((t, i) => {
        prompt += `### Template ${i + 1}: ${t.templateType}\n\n`;
        prompt += `**Padrão:** ${t.pattern}\n\n`;
        prompt += `**Variáveis:** ${t.variables}\n\n`;

        if (t.exampleText) {
          prompt += `**Exemplo original:**\n${t.exampleText.substring(0, 300)}...\n\n`;
        }

        prompt += `---\n\n`;
      });
    }

    // 7. Instruções de geração
    prompt += `## INSTRUÇÕES DE GERAÇÃO\n\n`;
    prompt += `1. **SIGA O PLANO ESTRUTURADO**:\n`;
    prompt += `   - Use EXATAMENTE as seções definidas no plano\n`;
    prompt += `   - Aborde TODOS os pontos de cada seção\n\n`;

    prompt += `2. **MANTENHA SEU ESTILO**:\n`;
    prompt += `   - Analise os EXEMPLOS DE REFERÊNCIA acima\n`;
    prompt += `   - Eles são suas manifestações anteriores\n`;
    prompt += `   - Mantenha a MESMA linguagem, tom, estrutura\n`;
    prompt += `   - Use as MESMAS expressões, formatação, organização\n\n`;

    prompt += `3. **ADAPTE AO CASO ATUAL**:\n`;
    prompt += `   - Substitua as variáveis pelos valores do caso atual:\n`;

    Object.entries(variaveis).slice(0, 10).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        prompt += `     * ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
      }
    });

    prompt += `\n4. **USE OS TEMPLATES**:\n`;
    prompt += `   - Os templates acima foram extraídos dos seus modelos\n`;
    prompt += `   - Adapte-os ao caso atual substituindo as variáveis\n\n`;

    prompt += `5. **CHECKLIST OBRIGATÓRIO**:\n`;
    plano.checklistObrigatorio?.forEach(item => {
      prompt += `   - ${item}\n`;
    });

    prompt += `\n6. **IMPORTANTE**:\n`;
    prompt += `   - NÃO invente dados - use APENAS os fornecidos acima\n`;
    prompt += `   - MANTENHA seu estilo dos exemplos de referência\n`;
    prompt += `   - ADAPTE os templates às especificidades deste caso\n`;
    prompt += `   - Seja PRECISO com valores, nomes, datas, artigos de lei\n\n`;

    if (variaveis.calculos_divergentes) {
      prompt += `\n⚠️ **ATENÇÃO: CÁLCULOS DIVERGENTES!**\n`;
      prompt += `   - Valor apresentado está incorreto\n`;
      prompt += `   - Você DEVE apontar o erro e indicar o valor correto: ${variaveis.valor_correto}\n\n`;
    }

    prompt += `---\n\nGere a manifestação COMPLETA agora:\n`;

    return prompt;
  }

  /**
   * Estimar tokens de um texto
   */
  private estimarTokens(texto: string): number {
    return Math.ceil(texto.length / 4);
  }
}
