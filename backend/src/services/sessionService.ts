import { prisma } from '../lib/prisma.js';

export interface CreateSessionParams {
  userId?: string;
  fileMD5: string;
  agentId: string;
  documentType: string;
  originalInstructions: string;
  fileName: string;
  fileSize: number;

  // Pipeline completo (substitui cache)
  extractedText: string;
  documentAnalysis: any;
  chunks: any;
  contextSummary: string;

  // Dados do multi-agente (opcional - só quando usa multi-agente)
  multiAgentResult?: {
    analise: any;
    plano: any;
    avaliacoes: any[];
    iteracoesRefinamento: number;
  };

  initialResult: string;
  tokensUsed: number;
}

export interface RefineSessionParams {
  sessionId: string;
  userPrompt: string;
  result: string;
  tokensUsed: number;
  parentIterationId?: string;
}

export class SessionService {
  /**
   * Cria uma nova sessão com o resultado inicial
   */
  async createSession(params: CreateSessionParams) {
    const session = await prisma.legalSession.create({
      data: {
        userId: params.userId,
        fileMD5: params.fileMD5,
        agentId: params.agentId,
        documentType: params.documentType,
        originalInstructions: params.originalInstructions,
        fileName: params.fileName,
        fileSize: params.fileSize,

        // Salvar pipeline completo no banco (substitui cache)
        extractedText: params.extractedText,
        documentAnalysis: JSON.stringify(params.documentAnalysis),
        chunks: params.chunks ? JSON.stringify(params.chunks) : null,
        contextSummary: params.contextSummary,

        // Salvar dados do multi-agente se disponível
        multiAgentData: params.multiAgentResult
          ? JSON.stringify(params.multiAgentResult)
          : null,

        status: 'active',
        iterations: {
          create: {
            userPrompt: params.originalInstructions,
            result: params.initialResult,
            tokensUsed: params.tokensUsed
          }
        }
      },
      include: {
        iterations: true
      }
    });

    console.log(`✅ Sessão criada: ${session.id.substring(0, 8)}... (pipeline salvo no banco)`);
    return session;
  }

  /**
   * Adiciona uma nova iteração (refinamento) à sessão
   */
  async refineSession(params: RefineSessionParams) {
    // Atualizar lastAccessedAt da sessão
    const session = await prisma.legalSession.update({
      where: { id: params.sessionId },
      data: {
        lastAccessedAt: new Date(),
        iterations: {
          create: {
            userPrompt: params.userPrompt,
            result: params.result,
            tokensUsed: params.tokensUsed,
            parentIterationId: params.parentIterationId
          }
        }
      },
      include: {
        iterations: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    console.log(`✅ Sessão refinada: ${params.sessionId.substring(0, 8)}... (${session.iterations.length} iterações)`);
    return session;
  }

  /**
   * Lista sessões do usuário (com paginação)
   */
  async listSessions(userId?: string, limit: number = 20, offset: number = 0) {
    const where = userId ? { userId, status: 'active' } : { status: 'active' };

    const sessions = await prisma.legalSession.findMany({
      where,
      include: {
        iterations: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Apenas a iteração mais recente
        }
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: limit,
      skip: offset
    });

    return sessions;
  }

  /**
   * Busca uma sessão específica com todo o histórico
   */
  async getSession(sessionId: string) {
    const session = await prisma.legalSession.findUnique({
      where: { id: sessionId },
      include: {
        iterations: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (session) {
      // Atualizar lastAccessedAt
      await prisma.legalSession.update({
        where: { id: sessionId },
        data: { lastAccessedAt: new Date() }
      });
    }

    return session;
  }

  /**
   * Busca dados do pipeline da sessão (do banco)
   */
  async getSessionPipeline(sessionId: string) {
    const session = await prisma.legalSession.findUnique({
      where: { id: sessionId },
      select: {
        extractedText: true,
        documentAnalysis: true,
        chunks: true,
        contextSummary: true
      }
    });

    if (!session) return null;

    return {
      extractedText: session.extractedText,
      documentAnalysis: JSON.parse(session.documentAnalysis),
      chunks: session.chunks ? JSON.parse(session.chunks) : null,
      contextSummary: session.contextSummary
    };
  }

  /**
   * Arquiva uma sessão (não deleta, apenas marca como arquivada)
   */
  async archiveSession(sessionId: string) {
    const session = await prisma.legalSession.update({
      where: { id: sessionId },
      data: { status: 'archived' }
    });

    console.log(`📦 Sessão arquivada: ${sessionId.substring(0, 8)}...`);
    return session;
  }

  /**
   * Deleta uma sessão permanentemente
   */
  async deleteSession(sessionId: string) {
    await prisma.legalSession.delete({
      where: { id: sessionId }
    });

    console.log(`🗑️  Sessão deletada: ${sessionId.substring(0, 8)}...`);
  }

  /**
   * Busca sessões por arquivo (mesmo PDF processado várias vezes)
   */
  async getSessionsByFile(fileMD5: string) {
    const sessions = await prisma.legalSession.findMany({
      where: { fileMD5, status: 'active' },
      include: {
        iterations: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    return sessions;
  }

  /**
   * Estatísticas de sessões
   */
  async getStatistics(userId?: string) {
    const where = userId ? { userId } : {};

    const [total, active, totalIterations] = await Promise.all([
      prisma.legalSession.count({ where }),
      prisma.legalSession.count({ where: { ...where, status: 'active' } }),
      prisma.sessionIteration.count()
    ]);

    return {
      totalSessions: total,
      activeSessions: active,
      archivedSessions: total - active,
      totalIterations,
      avgIterationsPerSession: total > 0 ? (totalIterations / total).toFixed(1) : 0
    };
  }
}

export const sessionService = new SessionService();
