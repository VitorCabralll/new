import { Router } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prisma.js';
import { extractTextFromPDF } from '../services/textExtractor.js';
import { validateManifestationQuality } from '../services/qualityValidator.js';
import { AuditLogger, calculateFileMD5 } from '../services/auditLogger.js';
import { processDocumentWithChunking, DocumentChunk } from '../services/documentChunker.js';
import { sessionService } from '../services/sessionService.js';
import { withGeminiRetry } from '../lib/retry.js';
import { MultiAgentSystem } from '../agents/orchestrator/multiAgentSystem.js';
import { TIPOS_SUPORTADOS, TipoDocumento } from '../agents/types.js';
import { validateUpload } from '../middleware/uploadValidation.js';
import { documentCache } from '../services/cacheService.js';
import fs from 'fs';

// ===== SISTEMA DE DETECÇÃO HIERÁRQUICO =====
// Padrões por tipo de documento (do mais específico ao mais genérico)
interface DocumentPattern {
  primary: RegExp[];        // Padrões obrigatórios (TODOS devem existir)
  secondary: RegExp[];      // Padrões de suporte (pelo menos 1 deve existir)
  exclusions: RegExp[];     // Se encontrar, NÃO é este tipo
  minMatch: {
    primary: number;        // Mínimo de padrões primary que devem ser encontrados
    secondary: number;      // Mínimo de padrões secondary que devem ser encontrados
  };
}

const DOCUMENT_PATTERNS: Record<string, DocumentPattern> = {
  'Habilitação de Crédito': {
    primary: [
      /habilitaç(ã|a)o/i,
      /cr(é|e)dito/i
    ],
    secondary: [
      /manifesta(ç|c)(ã|a)o/i,
      /minist(é|e)rio\s+(p(ú|u)blico|p(ú|u)blico)/i,
      /promotor/i,
      /credor(es)?/i,
      /requer/i
    ],
    exclusions: [
      /recupera(ç|c)(ã|a)o\s+judicial/i
    ],
    minMatch: { primary: 2, secondary: 1 }
  },
  'Recuperação Judicial': {
    primary: [
      /recupera(ç|c)(ã|a)o\s+judicial/i
    ],
    secondary: [
      /lei\s+n?\.?\s*11\.?101/i,
      /plano\s+de\s+recupera(ç|c)(ã|a)o/i,
      /credores/i,
      /assembleia/i,
      /devedor/i
    ],
    exclusions: [],
    minMatch: { primary: 1, secondary: 1 }
  },
  'Processo Falimentar': {
    primary: [
      /fal(ê|e)ncia/i
    ],
    secondary: [
      /liquida(ç|c)(ã|a)o/i,
      /massa\s+falida/i,
      /administrador\s+judicial/i,
      /senten(ç|c)a\s+de\s+fal(ê|e)ncia/i,
      /decreto\s+de\s+fal(ê|e)ncia/i
    ],
    exclusions: [
      /habilitaç(ã|a)o/i,
      /recupera(ç|c)(ã|a)o\s+judicial/i
    ],
    minMatch: { primary: 1, secondary: 1 }
  }
};

/**
 * Calcula confiança real baseado em matches
 */
function calculateConfidence(primaryMatches: number, secondaryMatches: number, minPrimary: number, minSecondary: number): number {
  const baseConfidence = 0.7; // 70% se atende mínimo

  // Bonus por matches extras
  const primaryBonus = Math.max(0, (primaryMatches - minPrimary) * 0.1); // +10% por primary extra
  const secondaryBonus = Math.max(0, (secondaryMatches - minSecondary) * 0.05); // +5% por secondary extra

  const finalConfidence = Math.min(1.0, baseConfidence + primaryBonus + secondaryBonus);
  return Math.round(finalConfidence * 100); // Retorna em %
}

/**
 * Detecta tipo de documento usando sistema hierárquico
 */
function detectDocumentType(text: string): { type: string; confidence: number; matched: string[] } {
  const lowerText = text.toLowerCase();

  for (const [type, patterns] of Object.entries(DOCUMENT_PATTERNS)) {
    // Verificar exclusões primeiro (early exit)
    const hasExclusion = patterns.exclusions.some(p => p.test(text));
    if (hasExclusion) {
      continue; // Pula para próximo tipo
    }

    // Contar matches primary
    const primaryMatches = patterns.primary.filter(p => p.test(text));
    const primaryCount = primaryMatches.length;

    // Contar matches secondary
    const secondaryMatches = patterns.secondary.filter(p => p.test(text));
    const secondaryCount = secondaryMatches.length;

    // Verificar se atende mínimo
    if (primaryCount >= patterns.minMatch.primary &&
        secondaryCount >= patterns.minMatch.secondary) {

      const confidence = calculateConfidence(
        primaryCount,
        secondaryCount,
        patterns.minMatch.primary,
        patterns.minMatch.secondary
      );

      // Log de matches encontrados
      const matched = [
        ...primaryMatches.map(p => `[PRIMARY] ${p.source}`),
        ...secondaryMatches.map(p => `[SECONDARY] ${p.source}`)
      ];

      return { type, confidence, matched };
    }
  }

  // Nenhum tipo detectado
  return { type: 'documento', confidence: 0, matched: [] };
}

// Document analysis function with hierarchical detection
function analyzeDocument(text: string) {
  // Detectar tipo do documento
  const detection = detectDocumentType(text);

  // Log de decisão (útil para debugging)
  console.log('=== DETECÇÃO HIERÁRQUICA DE DOCUMENTO ===');
  console.log(`Tipo: ${detection.type}`);
  console.log(`Confiança: ${detection.confidence}%`);
  if (detection.matched.length > 0) {
    console.log('Padrões encontrados:');
    detection.matched.forEach(m => console.log(`  - ${m}`));
  }
  console.log('=========================================');

  // Extract parties with improved regex to avoid capturing excessive text
  // Captures only proper names (starting with uppercase) until comma, period, or newline
  const partyRegex = /requerente[s]?:?\s*([A-ZÀ-Ú][A-Za-zÀ-ú\s]+?)(?=\s*[,.\n]|$)/gi;
  const defendantRegex = /requerido[s]?:?\s*([A-ZÀ-Ú][A-Za-zÀ-ú\s]+?)(?=\s*[,.\n]|$)/gi;
  const parties = [];

  let match;
  while ((match = partyRegex.exec(text)) !== null) {
    // Clean captured text: trim, remove trailing punctuation, limit length
    const cleaned = match[1].trim().replace(/[,.]$/, '').substring(0, 100);
    // Validate: must have at least 3 characters and not be only spaces
    if (cleaned.length >= 3 && cleaned.trim().length > 0) {
      parties.push(`Requerente: ${cleaned}`);
    }
  }
  while ((match = defendantRegex.exec(text)) !== null) {
    const cleaned = match[1].trim().replace(/[,.]$/, '').substring(0, 100);
    if (cleaned.length >= 3 && cleaned.trim().length > 0) {
      parties.push(`Requerido: ${cleaned}`);
    }
  }

  // Extract monetary values
  const valueRegex = /R\$\s*([\d.,]+)/g;
  const values = [];
  while ((match = valueRegex.exec(text)) !== null) {
    values.push(`R$ ${match[1]}`);
  }

  // Extract dates
  const dateRegex = /\d{1,2}[\/-]\d{1,2}[\/-]\d{4}/g;
  const dates = [];
  while ((match = dateRegex.exec(text)) !== null) {
    dates.push(match[0]);
  }

  return {
    type: detection.type,
    confidence: detection.confidence,
    parties: parties.slice(0, 5).join(', ') || 'Não identificadas',
    values: values.slice(0, 3).join(', ') || 'Não identificados',
    dates: dates.slice(0, 3).join(', ') || 'Não identificadas'
  };
}

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Configure the Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Initialize Multi-Agent System
const multiAgentSystem = new MultiAgentSystem(process.env.GEMINI_API_KEY || '');

router.post('/generate', upload.single('file'), validateUpload, async (req: any, res: any) => {
  const { instructions, agentId } = req.body;
  const file = req.file;

  // File validation is now handled by middleware, but keep this as safety check
  if (!file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }

  if (!instructions || !agentId) {
    // Cleanup do arquivo antes de retornar erro
    if (file && file.path) {
      try { fs.unlinkSync(file.path); } catch {}
    }
    return res.status(400).json({ message: 'Instruções e ID do agente são obrigatórios.' });
  }

  // Inicializar auditoria
  const auditLogger = new AuditLogger();

  try {
    // Calcular MD5 do arquivo com tratamento de erro
    let fileBuffer: Buffer;
    let fileMD5: string;

    try {
      fileBuffer = fs.readFileSync(file.path);
      fileMD5 = calculateFileMD5(fileBuffer);
    } catch (fileError) {
      console.error('Erro ao ler arquivo:', fileError);
      // Tentar limpar o arquivo
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        console.error('Erro ao limpar arquivo:', cleanupError);
      }
      return res.status(400).json({
        message: 'Arquivo corrompido ou ilegível.',
        code: 'FILE_READ_ERROR'
      });
    }

    // Verificar cache ANTES de processar
    const cacheKey = `doc:${fileMD5}:${agentId}`;
    const cachedResult = documentCache.get(cacheKey);

    if (cachedResult) {
      console.log(`[Cache] ✓ Resultado encontrado para MD5: ${fileMD5}`);
      console.log('[Cache] Stats:', documentCache.getStats());

      // Limpar arquivo (não precisamos mais dele)
      try {
        fs.unlinkSync(file.path);
      } catch (unlinkError) {
        console.error('Erro ao limpar arquivo:', unlinkError);
      }

      // Retornar resultado do cache com indicador
      return res.json({
        ...cachedResult,
        cached: true,
        cacheStats: documentCache.getStats()
      });
    }

    console.log(`[Cache] ✗ Resultado não encontrado, processando documento...`);

    // Iniciar auditoria da requisição
    await auditLogger.startRequest({
      agentId,
      fileName: file.originalname,
      fileSize: file.size,
      fileMD5,
    });

    // Log stage: upload
    await auditLogger.logStageStart('upload');
    await auditLogger.logStageComplete('upload', {
      fileType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
      md5: fileMD5,
    });
    // 1. Fetch agent from DB
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      // Cleanup do arquivo antes de retornar erro
      if (file && file.path) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      return res.status(404).json({ message: 'Agente não encontrado.' });
    }

    // 2. Extract text from PDF
    await auditLogger.logStageStart('extraction');
    const extractionResult = await extractTextFromPDF(file.path);
    const extractedText = extractionResult.text;

    await auditLogger.logStageComplete('extraction', {
      method: extractionResult.method,
      textLength: extractedText.length,
      confidence: extractionResult.confidence,
      qualityChecked: true,
    });

    console.log(`Text extracted using: ${extractionResult.method}`);

    // 3. Enhanced prompt with better context
    await auditLogger.logStageStart('analysis');
    const documentAnalysis = analyzeDocument(extractedText);

    // Contar entidades encontradas
    const partiesCount = (documentAnalysis.parties.match(/,/g) || []).length + 1;
    const valuesCount = (documentAnalysis.values.match(/,/g) || []).length + 1;
    const datesCount = (documentAnalysis.dates.match(/,/g) || []).length + 1;

    await auditLogger.logStageComplete('analysis', {
      documentType: documentAnalysis.type,
      confidence: documentAnalysis.confidence,
      partiesFound: partiesCount,
      valuesFound: valuesCount,
      datesFound: datesCount,
    } as any);

    // 4. Chunking inteligente do documento
    await auditLogger.logStageStart('chunking');
    const chunkingResult = await processDocumentWithChunking(
      extractedText,
      documentAnalysis.type
    );

    await auditLogger.logStageComplete('chunking', {
      strategy: chunkingResult.strategy,
      totalChunks: chunkingResult.chunks.length,
      prioritizedChunks: chunkingResult.prioritizedChunks.length,
      totalTokens: chunkingResult.totalTokens,
      avgRelevanceScore: chunkingResult.chunks.length > 0
        ? chunkingResult.chunks.reduce((sum: number, chunk: any) =>
            sum + chunk.metadata.relevanceScore, 0) / chunkingResult.chunks.length
        : 0
    });

    // ===== DECISÃO: Multi-Agente vs Pipeline Tradicional =====
    // Multi-agente é usado SEMPRE que o tipo de documento for suportado
    const tipoSuportado = TIPOS_SUPORTADOS.includes(documentAnalysis.type as TipoDocumento);

    if (tipoSuportado) {
      console.log(`[Pipeline] Usando SISTEMA MULTI-AGENTE para tipo: ${documentAnalysis.type}`);

      // ===== PIPELINE MULTI-AGENTE =====
      await auditLogger.logStageStart('multi_agent_processing');

      try {
        const resultadoMultiAgente = await multiAgentSystem.processar(
          extractedText,
          documentAnalysis.type as TipoDocumento,
          agent
        );

        await auditLogger.logStageComplete('multi_agent_processing', {
          scoreFinal: resultadoMultiAgente.scoresFinal,
          iteracoesRefinamento: resultadoMultiAgente.iteracoesRefinamento,
          tempoProcessamento: resultadoMultiAgente.tempoProcessamento,
          tokensUsados: resultadoMultiAgente.custotokens
        }, resultadoMultiAgente.custotokens);

        await auditLogger.completeRequest();

        // Preparar resposta
        const responseData: any = {
          result: resultadoMultiAgente.manifestacao,
          quality: {
            score: resultadoMultiAgente.scoresFinal,
            isAcceptable: resultadoMultiAgente.scoresFinal >= 9.0,
            issues: [],
            suggestions: []
          },
          multiAgent: {
            used: true,
            iterations: resultadoMultiAgente.iteracoesRefinamento,
            finalScore: resultadoMultiAgente.scoresFinal,
            processingTime: resultadoMultiAgente.tempoProcessamento
          },
          improved: resultadoMultiAgente.iteracoesRefinamento > 0,
          auditSessionId: auditLogger.getSessionId()
        };

        // Criar sessão salvando TODO o resultado multi-agente
        const session = await sessionService.createSession({
          userId: req.body.userId,
          fileMD5,
          agentId,
          documentType: documentAnalysis.type,
          originalInstructions: instructions,
          fileName: file.originalname,
          fileSize: file.size,

          // Pipeline completo
          extractedText,
          documentAnalysis,
          chunks: chunkingResult,
          contextSummary: chunkingResult.contextSummary,

          // Dados do multi-agente
          multiAgentResult: {
            analise: resultadoMultiAgente.analise,
            plano: resultadoMultiAgente.plano,
            avaliacoes: resultadoMultiAgente.avaliacoes,
            iteracoesRefinamento: resultadoMultiAgente.iteracoesRefinamento
          },

          initialResult: resultadoMultiAgente.manifestacao,
          tokensUsed: resultadoMultiAgente.custotokens
        });

        // Adicionar sessionId à resposta
        responseData.sessionId = session.id;

        // Salvar no cache (TTL de 1 hora)
        documentCache.set(cacheKey, responseData);
        console.log(`[Cache] ✓ Resultado salvo para MD5: ${fileMD5}`);
        console.log('[Cache] Stats:', documentCache.getStats());

        // Retornar resultado
        return res.json(responseData);
      } catch (multiAgentError) {
        console.error('=== ERRO NO SISTEMA MULTI-AGENTE ===');
        console.error('Tipo documento:', documentAnalysis.type);
        console.error('Erro:', (multiAgentError as Error).message);
        console.error('Stack:', (multiAgentError as Error).stack);
        console.error('Fallback para pipeline tradicional...');
        console.error('=====================================');

        await auditLogger.logStageComplete('multi_agent_processing', {
          error: (multiAgentError as Error).message,
          errorDetails: (multiAgentError as Error).stack,
          documentType: documentAnalysis.type,
          fallback: true,
          timestamp: new Date().toISOString()
        } as any);

        // Continua para pipeline tradicional (não retorna erro ao usuário)
      }
    }

    // ===== PIPELINE TRADICIONAL =====
    console.log(`[Pipeline] Usando PIPELINE TRADICIONAL para tipo: ${documentAnalysis.type}`);

    // 5. Geração usando chunks ou documento completo
    let generationResult = '';
    let totalTokensUsed = 0;
    let chunksProcessed = 0;

    if (chunkingResult.strategy === 'no-chunking') {
      // Documento pequeno - processar normalmente
      const prompt = createPrompt(agent, documentAnalysis, instructions, extractedText, chunkingResult.contextSummary);

      const result = await withGeminiRetry(
        () => genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        }),
        'Document generation (no-chunking)'
      );

      generationResult = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      totalTokensUsed = estimateTokens(prompt) + estimateTokens(generationResult);
      chunksProcessed = 1;
    } else {
      // Documento grande - processar chunks por prioridade
      const results = await processChunksProgressively(
        chunkingResult.prioritizedChunks,
        agent,
        documentAnalysis,
        instructions,
        chunkingResult.contextSummary,
        genAI
      );
      generationResult = results.text;
      totalTokensUsed = results.totalTokens;
      chunksProcessed = results.chunksProcessed;
    }


    // Update agent usage statistics
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        lastUsed: new Date(),
        usageCount: { increment: 1 }
      }
    });

    // Log completion of generation stage
    await auditLogger.logStageComplete('generation', {
      model: 'gemini-2.0-flash',
      promptTokens: Math.ceil(totalTokensUsed * 0.7), // Approximation
      responseTokens: Math.ceil(totalTokensUsed * 0.3), // Approximation
      chunksProcessed
    }, totalTokensUsed);

    const text = generationResult;

    // Validate quality of generated manifestation
    await auditLogger.logStageStart('validation');
    const qualityResult = validateManifestationQuality(text);

    await auditLogger.logStageComplete('validation', {
      score: qualityResult.score,
      issues: qualityResult.issues,
      isAcceptable: qualityResult.isAcceptable,
    });

    // If quality is poor, try to improve with additional prompt
    if (!qualityResult.isAcceptable && qualityResult.score < 5) {
      console.log('Quality too low, attempting improvement...');

      await auditLogger.logStageStart('improvement');

      const improvementPrompt = `
        O texto anterior não atendeu aos padrões de qualidade.
        Problemas identificados: ${qualityResult.issues.join(', ')}

        Por favor, reescreva melhorando especificamente:
        ${qualityResult.suggestions.join('\n')}

        Texto original:
        ${text}

        IMPORTANTE: Mantenha a estrutura jurídica formal e inclua TODOS os elementos obrigatórios.
      `;

      const improvedResult = await withGeminiRetry(
        () => genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: improvementPrompt }] }]
        }),
        'Quality improvement'
      );

      const improvedText = improvedResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const finalQuality = validateManifestationQuality(improvedText);

      // Estimar tokens para improvement
      const improvementTokens = Math.ceil((improvementPrompt.length + improvedText.length) / 4);

      await auditLogger.logStageComplete('improvement', {
        originalScore: qualityResult.score,
        improvedScore: finalQuality.score,
        attempts: 1,
      }, improvementTokens);

      await auditLogger.completeRequest();

      const improvedResponseData = {
        result: improvedText,
        quality: finalQuality,
        improved: true,
        originalQuality: qualityResult,
        sessionId: auditLogger.getSessionId()
      };

      // Salvar resultado melhorado no cache
      documentCache.set(cacheKey, improvedResponseData);
      console.log(`[Cache] ✓ Resultado melhorado salvo para MD5: ${fileMD5}`);

      res.json(improvedResponseData);
    } else {
      await auditLogger.completeRequest();

      // Criar sessão salvando TODO o pipeline no banco (substitui cache)
      const session = await sessionService.createSession({
        userId: req.body.userId, // Opcional
        fileMD5,
        agentId,
        documentType: documentAnalysis.type,
        originalInstructions: instructions,
        fileName: file.originalname,
        fileSize: file.size,

        // Pipeline completo salvo no banco
        extractedText,
        documentAnalysis,
        chunks: chunkingResult,
        contextSummary: chunkingResult.contextSummary,

        initialResult: text,
        tokensUsed: totalTokensUsed
      });

      const responseData = {
        result: text,
        quality: qualityResult,
        improved: false,
        sessionId: session.id, // ID da sessão (diferente do auditSessionId)
        auditSessionId: auditLogger.getSessionId()
      };

      // Salvar no cache
      documentCache.set(cacheKey, responseData);
      console.log(`[Cache] ✓ Resultado salvo para MD5: ${fileMD5} (pipeline tradicional)`);
      console.log('[Cache] Stats:', documentCache.getStats());

      res.json(responseData);
    }

  } catch (error) {
    console.error('Failed to generate manifestation:', error);

    // Registrar erro na auditoria
    await auditLogger.failRequest(error as Error);

    res.status(500).json({
      message: 'Falha ao gerar a manifestação.',
      sessionId: auditLogger.getSessionId()
    });
  } finally {
    // Clean up the uploaded file (safe cleanup)
    if (file && file.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log('[Cleanup] Arquivo removido:', file.path);
        }
      } catch (cleanupError) {
        console.error('[Cleanup] Erro ao remover arquivo:', cleanupError);
      }
    }
  }
});

// Funções auxiliares para chunking

/**
 * Criar prompt completo para geração
 */
function createPrompt(
  agent: any,
  documentAnalysis: any,
  instructions: string,
  content: string,
  contextSummary: string
): string {
  return `
    **SISTEMA:** ${agent.systemInstruction}

    **CONTEXTO GLOBAL:** ${contextSummary}

    **CONTEXTO DO CASO:**
    - Tipo de documento: ${documentAnalysis.type}
    - Partes identificadas: ${documentAnalysis.parties}
    - Valores mencionados: ${documentAnalysis.values}
    - Data de referência: ${documentAnalysis.dates}

    **INSTRUÇÕES ESPECÍFICAS:** ${instructions}

    **DOCUMENTO PARA ANÁLISE:**
    ${content}

    **FORMATO OBRIGATÓRIO:**
    - Use EXATAMENTE a estrutura definida na instrução do sistema
    - Inclua TODOS os cabeçalhos e formatações especificados
    - Mencione IDs de documentos quando relevante
    - Finalize com assinatura eletrônica padrão
  `.trim();
}

/**
 * Estimar tokens de um texto (aproximação: 1 token ≈ 4 caracteres)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Processar chunks progressivamente por prioridade (em paralelo)
 */
async function processChunksProgressively(
  prioritizedChunks: DocumentChunk[],
  agent: any,
  documentAnalysis: any,
  instructions: string,
  contextSummary: string,
  genAI: any
): Promise<{ text: string; totalTokens: number; chunksProcessed: number }> {
  let combinedResult = '';
  let totalTokens = 0;
  let chunksProcessed = 0;

  // Processar apenas chunks críticos e high primeiro
  const criticalChunks = prioritizedChunks.filter(
    chunk => chunk.priority === 'critical' || chunk.priority === 'high'
  );

  // Limitar a 3 chunks críticos para evitar custo excessivo
  const chunksToProcess = criticalChunks.slice(0, 3);

  // PARALELIZAÇÃO: Processar todos os chunks simultaneamente
  const chunkPromises = chunksToProcess.map(async (chunk) => {
    const chunkPrompt = createPrompt(
      agent,
      documentAnalysis,
      instructions,
      chunk.content,
      contextSummary
    );

    try {
      const result = await withGeminiRetry(
        () => genAI.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [{ role: 'user', parts: [{ text: chunkPrompt }] }]
        }),
        `Chunk ${chunk.id.substring(0, 8)}`
      );

      const chunkResult = (result as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
      const chunkTokens = estimateTokens(chunkPrompt) + estimateTokens(chunkResult);

      return {
        success: true,
        text: chunkResult,
        tokens: chunkTokens,
        chunkId: chunk.id,
        priority: chunk.priority
      };
    } catch (error) {
      console.error(`Erro ao processar chunk ${chunk.id}:`, error);
      return {
        success: false,
        text: '',
        tokens: 0,
        chunkId: chunk.id,
        priority: chunk.priority,
        error: error as Error
      };
    }
  });

  // Aguardar todos os chunks em paralelo
  const results = await Promise.all(chunkPromises);

  // Combinar resultados bem-sucedidos
  const successfulResults = results.filter(r => r.success);

  for (const result of successfulResults) {
    if (combinedResult) {
      combinedResult += '\n\n--- SEÇÃO ADICIONAL ---\n\n';
    }
    combinedResult += result.text;
    totalTokens += result.tokens;
    chunksProcessed++;
  }

  // Se não conseguiu resultado satisfatório, processar mais chunks em paralelo
  if (combinedResult.length < 1000 && chunksProcessed < 2) {
    const mediumChunks = prioritizedChunks.filter(
      chunk => chunk.priority === 'medium'
    ).slice(0, 2);

    // Processar medium chunks em paralelo também
    const mediumPromises = mediumChunks.map(async (chunk) => {
      const chunkPrompt = createPrompt(
        agent,
        documentAnalysis,
        instructions,
        chunk.content,
        contextSummary
      );

      try {
        const result = await withGeminiRetry(
          () => genAI.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: chunkPrompt }] }]
          }),
          `Medium chunk ${chunk.id.substring(0, 8)}`
        );

        const chunkResult = (result as any).candidates?.[0]?.content?.parts?.[0]?.text || '';
        const chunkTokens = estimateTokens(chunkPrompt) + estimateTokens(chunkResult);

        return {
          success: true,
          text: chunkResult,
          tokens: chunkTokens
        };
      } catch (error) {
        console.error(`Erro ao processar chunk medium ${chunk.id}:`, error);
        return { success: false, text: '', tokens: 0 };
      }
    });

    const mediumResults = await Promise.all(mediumPromises);

    for (const result of mediumResults) {
      if (result.success) {
        if (combinedResult) {
          combinedResult += '\n\n--- COMPLEMENTO ---\n\n';
        }
        combinedResult += result.text;
        totalTokens += result.tokens;
        chunksProcessed++;
      }
    }
  }

  return {
    text: combinedResult || 'Não foi possível gerar manifestação com os chunks disponíveis.',
    totalTokens,
    chunksProcessed
  };
}

export default router;