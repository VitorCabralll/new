/**
 * Generate V2 - Sistema de Agentes Treináveis
 *
 * Usa UniversalAgents + RAG + Templates + Cache
 */

import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { extractTextFromPDF } from '../services/textExtractor.js';
import { validateUpload } from '../middleware/uploadValidation.js';
import { AuditLogger, calculateFileMD5 } from '../services/auditLogger.js';
import { documentCache } from '../services/cacheService.js';
import { UniversalAnalista } from '../agents/system/UniversalAnalista.js';
import { UniversalPlanejador } from '../agents/system/UniversalPlanejador.js';
import { UniversalRevisor } from '../agents/system/UniversalRevisor.js';
import { FewShotGenerator } from '../services/fewShotGenerator.js';
import { RefinadorUniversal } from '../agents/specialized/refinador/universal.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Inicializar agentes e serviços
const apiKey = process.env.GEMINI_API_KEY || '';
const analista = new UniversalAnalista(apiKey);
const planejador = new UniversalPlanejador(apiKey);
const revisor = new UniversalRevisor(apiKey);
const fewShotGenerator = new FewShotGenerator(apiKey);
const refinador = new RefinadorUniversal(apiKey);

// Configurações
const SCORE_MINIMO = 9.0;
const MAX_ITERACOES = 3;

/**
 * POST /api/generate-v2
 *
 * Geração com sistema de agentes treináveis
 */
router.post('/generate-v2', upload.single('file'), validateUpload, async (req: any, res: any) => {
  const { userAgentId } = req.body; // Agora usa UserAgent em vez de Agent
  const file = req.file;

  // Validações básicas
  if (!file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }

  if (!userAgentId) {
    if (file?.path) {
      try { fs.unlinkSync(file.path); } catch {}
    }
    return res.status(400).json({ message: 'ID do UserAgent é obrigatório.' });
  }

  const auditLogger = new AuditLogger();
  const startTime = Date.now();

  try {
    // 1. Calcular MD5 e verificar cache
    console.log('\n[GenerateV2] ===== INÍCIO DO PROCESSAMENTO =====');

    const fileBuffer = fs.readFileSync(file.path);
    const fileMD5 = calculateFileMD5(fileBuffer);

    const cacheKey = `doc-v2:${fileMD5}:${userAgentId}`;
    const cachedResult = documentCache.get(cacheKey);

    if (cachedResult) {
      console.log(`[GenerateV2] ✓ Cache hit! MD5: ${fileMD5}`);

      // Limpar arquivo
      try { fs.unlinkSync(file.path); } catch {}

      return res.json({
        ...cachedResult,
        cached: true,
        cacheStats: documentCache.getStats()
      });
    }

    console.log(`[GenerateV2] ✗ Cache miss, processando...`);

    // 2. Buscar UserAgent
    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      if (file?.path) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      return res.status(404).json({ message: 'UserAgent não encontrado.' });
    }

    if (!userAgent.isTrained) {
      if (file?.path) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      return res.status(400).json({
        message: 'UserAgent não foi treinado ainda. Faça upload de modelos primeiro.',
        code: 'AGENT_NOT_TRAINED'
      });
    }

    console.log(`[GenerateV2] UserAgent: ${userAgent.name} (${userAgent.category})`);

    // Iniciar auditoria
    await auditLogger.startRequest({
      agentId: userAgentId, // Compatibilidade com RequestAudit
      userAgentId,
      fileName: file.originalname,
      fileSize: file.size,
      fileMD5,
    } as any);

    // 3. EXTRAÇÃO DE TEXTO
    console.log('[GenerateV2] Fase 1: Extração de texto');
    await auditLogger.logStageStart('extraction');

    const extractionResult = await extractTextFromPDF(file.path);
    const textoCompleto = extractionResult.text;

    await auditLogger.logStageComplete('extraction', {
      method: extractionResult.method,
      textLength: textoCompleto.length,
    } as any);

    console.log(`[GenerateV2] ✓ Texto extraído: ${textoCompleto.length} caracteres`);

    // 4. ANÁLISE UNIVERSAL
    console.log('[GenerateV2] Fase 2: Análise Universal');
    await auditLogger.logStageStart('analysis');

    const analise = await analista.analisar(textoCompleto);

    await auditLogger.logStageComplete('analysis', {
      tipoDocumento: analise.tipoDocumento,
      partesCount: analise.partes.length,
      questoesCount: analise.questoesJuridicas.length,
    } as any);

    console.log(`[GenerateV2] ✓ Análise concluída: Tipo=${analise.tipoDocumento}`);

    // 5. PLANEJAMENTO UNIVERSAL
    console.log('[GenerateV2] Fase 3: Planejamento Universal');
    await auditLogger.logStageStart('planning');

    const plano = await planejador.planejar(analise);

    await auditLogger.logStageComplete('planning', {
      secoesCount: plano.estrutura.length,
      posicionamento: plano.posicionamento?.tipo,
    } as any);

    console.log(`[GenerateV2] ✓ Plano criado: ${plano.estrutura.length} seções`);

    // 6. GERAÇÃO COM FEW-SHOT LEARNING
    console.log('[GenerateV2] Fase 4: Geração Few-Shot');
    await auditLogger.logStageStart('generation');

    const generationResult = await fewShotGenerator.gerar(
      userAgentId,
      analise,
      plano,
      textoCompleto
    );

    let manifestacao = generationResult.manifestacao;

    await auditLogger.logStageComplete('generation', {
      modelosUsados: generationResult.metadata.modelosUsados.length,
      templatesUsados: generationResult.metadata.templatesUsados,
      usouCache: generationResult.metadata.usouCache,
      tokensEstimados: generationResult.metadata.tokensEstimados,
    } as any);

    console.log(`[GenerateV2] ✓ Geração concluída:`);
    console.log(`  - Modelos: ${generationResult.metadata.modelosUsados.length}`);
    console.log(`  - Templates: ${generationResult.metadata.templatesUsados}`);
    console.log(`  - Cache: ${generationResult.metadata.usouCache ? 'SIM' : 'NÃO'}`);
    console.log(`  - Tokens: ${generationResult.metadata.tokensEstimados}`);

    // 7. AVALIAÇÃO + REFINAMENTO
    let iteracao = 0;
    let scoreAtual = 0;
    const avaliacoes: any[] = [];

    while (iteracao < MAX_ITERACOES) {
      console.log(`[GenerateV2] Fase 5.${iteracao + 1}: Avaliação (Iteração ${iteracao + 1}/${MAX_ITERACOES})`);

      await auditLogger.logStageStart(`review-${iteracao + 1}`);

      const avaliacao = await revisor.avaliar(manifestacao, plano, analise);
      avaliacoes.push(avaliacao);
      scoreAtual = avaliacao.scoreGeral;

      await auditLogger.logStageComplete(`review-${iteracao + 1}`, {
        scoreGeral: scoreAtual,
        errosCount: avaliacao.erros.length,
        isAcceptable: avaliacao.isAcceptable,
      } as any);

      console.log(`[GenerateV2] ✓ Score: ${scoreAtual}/10`);

      // Verificar se atingiu qualidade
      if (scoreAtual >= SCORE_MINIMO) {
        console.log(`[GenerateV2] ✓ Qualidade atingida! (${scoreAtual} >= ${SCORE_MINIMO})`);
        break;
      }

      // Se última iteração, aceitar
      if (iteracao >= MAX_ITERACOES - 1) {
        console.log(`[GenerateV2] ⚠ Limite de iterações. Score final: ${scoreAtual}`);
        break;
      }

      // Refinar
      console.log(`[GenerateV2] Fase 6.${iteracao + 1}: Refinamento`);
      await auditLogger.logStageStart(`refinement-${iteracao + 1}`);

      // Converter UniversalAvaliacao para AvaliacaoQualidade
      const avaliacaoParaRefinamento = {
        score: avaliacao.scoreGeral,
        pontosAbordados: avaliacao.pontosFortes,
        pontosFaltantes: avaliacao.checklistPendente,
        erros: avaliacao.erros,
        sugestoesMelhoria: avaliacao.sugestoesMelhoria,
        qualidadeGeral: {
          estrutura: avaliacao.scores.estrutura,
          fundamentacao: avaliacao.scores.fundamentacao,
          completude: avaliacao.scores.completude,
          precisao: avaliacao.scores.precisao,
        }
      };

      manifestacao = await refinador.refinar(
        manifestacao,
        avaliacaoParaRefinamento,
        userAgent.systemInstruction
      );

      await auditLogger.logStageComplete(`refinement-${iteracao + 1}`, {} as any);

      console.log(`[GenerateV2] ✓ Refinamento concluído`);

      iteracao++;
    }

    const tempoTotal = Date.now() - startTime;

    // 8. FINALIZAR
    await auditLogger.completeRequest();

    // Preparar resposta
    const responseData = {
      message: 'Manifestação gerada com sucesso!',
      manifestacao,
      metadata: {
        userAgent: {
          id: userAgent.id,
          name: userAgent.name,
          category: userAgent.category,
        },
        analise: {
          tipoDocumento: analise.tipoDocumento,
          partes: analise.partes.length,
          questoesJuridicas: analise.questoesJuridicas.length,
        },
        generation: {
          modelosUsados: generationResult.metadata.modelosUsados,
          templatesUsados: generationResult.metadata.templatesUsados,
          variaveisSubstituidas: generationResult.metadata.variaveisSubstituidas,
          usouCache: generationResult.metadata.usouCache,
        },
        quality: {
          scoreInicial: avaliacoes[0]?.scoreGeral || 0,
          scoreFinal: scoreAtual,
          iteracoes: iteracao,
          avaliacoes: avaliacoes.map(a => ({
            score: a.scoreGeral,
            scores: a.scores,
            erros: a.erros,
            sugestoes: a.sugestoesMelhoria,
          })),
        },
        performance: {
          tokensUsados: generationResult.metadata.tokensEstimados,
          tempoProcessamento: tempoTotal,
        },
      },
      sessionId: auditLogger.getSessionId(),
    };

    // Cachear resultado
    documentCache.set(cacheKey, responseData);
    console.log(`[GenerateV2] ✓ Resultado cacheado`);

    // Limpar arquivo
    try {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.error('[GenerateV2] Erro ao limpar arquivo:', err);
    }

    console.log('[GenerateV2] ===== PROCESSAMENTO CONCLUÍDO =====\n');

    res.json({
      ...responseData,
      cached: false,
    });

  } catch (error: any) {
    console.error('[GenerateV2] ❌ Erro:', error);

    await auditLogger.failRequest(error);

    // Limpar arquivo
    try {
      if (file && file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch {}

    res.status(500).json({
      message: 'Erro ao gerar manifestação',
      error: error.message,
      sessionId: auditLogger.getSessionId(),
    });
  }
});

export default router;
