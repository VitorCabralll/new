import { Router } from 'express';
import { sessionService } from '../services/sessionService.js';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '../lib/prisma.js';

const router = Router();
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

/**
 * GET /sessions - Lista sessões do usuário
 */
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 20, offset = 0 } = req.query;

    const sessions = await sessionService.listSessions(
      userId as string | undefined,
      Number(limit),
      Number(offset)
    );

    res.json({
      sessions,
      count: sessions.length
    });
  } catch (error: any) {
    console.error('Erro ao listar sessões:', error);
    res.status(500).json({ message: 'Erro ao listar sessões', error: error.message });
  }
});

/**
 * GET /sessions/:id - Busca uma sessão específica com histórico completo
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionService.getSession(id);

    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Erro ao buscar sessão:', error);
    res.status(500).json({ message: 'Erro ao buscar sessão', error: error.message });
  }
});

/**
 * POST /sessions/:id/refine - Refina/ajusta o resultado de uma sessão
 */
router.post('/:id/refine', async (req, res) => {
  try {
    const { id } = req.params;
    const { userPrompt, parentIterationId } = req.body;

    if (!userPrompt) {
      return res.status(400).json({ message: 'userPrompt é obrigatório' });
    }

    // Buscar sessão
    const session = await sessionService.getSession(id);
    if (!session) {
      return res.status(404).json({ message: 'Sessão não encontrada' });
    }

    // Buscar agente
    const agent = await prisma.agent.findUnique({
      where: { id: session.agentId }
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agente não encontrado' });
    }

    // Buscar pipeline completo do banco (substitui cache)
    const pipeline = await sessionService.getSessionPipeline(id);

    if (!pipeline) {
      return res.status(410).json({
        message: 'Dados do pipeline não encontrados.',
        expired: true
      });
    }

    // Buscar última iteração
    const lastIteration = session.iterations[session.iterations.length - 1];

    // Criar prompt de refinamento usando dados do banco
    const refinementPrompt = `
**SISTEMA:** ${agent.systemInstruction}

**CONTEXTO:** Você está refinando uma manifestação jurídica já gerada.

**CONTEXTO DO CASO:**
- Tipo de documento: ${pipeline.documentAnalysis.type}
- Partes identificadas: ${pipeline.documentAnalysis.parties}
- Valores mencionados: ${pipeline.documentAnalysis.values}
- Data de referência: ${pipeline.documentAnalysis.dates}

**CONTEXTO GLOBAL:** ${pipeline.contextSummary || 'N/A'}

**DOCUMENTO ORIGINAL:**
${pipeline.extractedText.substring(0, 5000)} ${pipeline.extractedText.length > 5000 ? '... (truncado)' : ''}

**RESULTADO ANTERIOR:**
${lastIteration.result}

**INSTRUÇÃO DE REFINAMENTO:**
${userPrompt}

**TAREFA:**
Gere uma NOVA versão completa da manifestação, aplicando o refinamento solicitado.
Mantenha a estrutura formal e inclua TODOS os elementos obrigatórios.
`;

    // Gerar refinamento via Gemini
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: refinementPrompt }] }]
    });

    const refinedText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const tokensUsed = Math.ceil((refinementPrompt.length + refinedText.length) / 4);

    // Salvar iteração
    const updatedSession = await sessionService.refineSession({
      sessionId: id,
      userPrompt,
      result: refinedText,
      tokensUsed,
      parentIterationId
    });

    res.json({
      session: updatedSession,
      result: refinedText,
      tokensUsed
    });
  } catch (error: any) {
    console.error('Erro ao refinar sessão:', error);
    res.status(500).json({ message: 'Erro ao refinar sessão', error: error.message });
  }
});

/**
 * PUT /sessions/:id/archive - Arquiva uma sessão
 */
router.put('/:id/archive', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionService.archiveSession(id);

    res.json({
      message: 'Sessão arquivada com sucesso',
      session
    });
  } catch (error: any) {
    console.error('Erro ao arquivar sessão:', error);
    res.status(500).json({ message: 'Erro ao arquivar sessão', error: error.message });
  }
});

/**
 * DELETE /sessions/:id - Deleta uma sessão permanentemente
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await sessionService.deleteSession(id);

    res.json({
      message: 'Sessão deletada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar sessão:', error);
    res.status(500).json({ message: 'Erro ao deletar sessão', error: error.message });
  }
});

/**
 * GET /sessions/file/:fileMD5 - Lista sessões de um arquivo específico
 */
router.get('/file/:fileMD5', async (req, res) => {
  try {
    const { fileMD5 } = req.params;

    const sessions = await sessionService.getSessionsByFile(fileMD5);

    res.json({
      sessions,
      count: sessions.length
    });
  } catch (error: any) {
    console.error('Erro ao buscar sessões por arquivo:', error);
    res.status(500).json({ message: 'Erro ao buscar sessões', error: error.message });
  }
});

/**
 * GET /sessions/stats - Estatísticas de sessões
 */
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    const stats = await sessionService.getStatistics(userId as string | undefined);

    res.json(stats);
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

export default router;
