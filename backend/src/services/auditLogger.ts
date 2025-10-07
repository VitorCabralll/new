import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

// Tipos de metadata para cada stage
interface StageMetadata {
  upload: {
    fileType: string;
    originalName: string;
    size: number;
    md5: string;
  };
  extraction: {
    method: 'pdf-parse' | 'ocr';
    textLength: number;
    confidence?: number;
    qualityChecked: boolean;
  };
  analysis: {
    documentType: string;
    partiesFound: number;
    valuesFound: number;
    datesFound: number;
  };
  chunking: {
    strategy: string;
    totalChunks: number;
    prioritizedChunks: number;
    totalTokens: number;
    avgRelevanceScore: number;
  };
  generation: {
    model: string;
    promptTokens: number;
    responseTokens: number;
    temperature?: number;
    chunksProcessed?: number;
  };
  validation: {
    score: number;
    issues: string[];
    isAcceptable: boolean;
  };
  improvement: {
    originalScore: number;
    improvedScore: number;
    attempts: number;
  };
  multi_agent_processing: {
    scoreFinal?: number;
    iteracoesRefinamento?: number;
    tempoProcessamento?: number;
    tokensUsados?: number;
    error?: string;
    fallback?: boolean;
  };
}

type StageNames = keyof StageMetadata;

export class AuditLogger {
  private sessionId: string;
  private startTimes: Map<string, number> = new Map();
  private requestData: any = {};

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Inicia uma nova sessão de auditoria
   */
  async startRequest(data: {
    agentId: string;
    fileName: string;
    fileSize: number;
    fileMD5: string;
    userId?: string;
  }): Promise<void> {
    this.requestData = data;

    await prisma.requestAudit.create({
      data: {
        sessionId: this.sessionId,
        agentId: data.agentId,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileMD5: data.fileMD5,
        userId: data.userId,
        extractionMethod: '',
        success: false,
      },
    });
  }

  /**
   * Registra o início de um stage
   */
  async logStageStart(stage: StageNames): Promise<void> {
    const startTime = Date.now();
    this.startTimes.set(stage, startTime);

    await prisma.processLog.create({
      data: {
        sessionId: this.sessionId,
        stage,
        status: 'started',
        startTime: new Date(startTime),
      },
    });
  }

  /**
   * Registra a conclusão bem-sucedida de um stage
   */
  async logStageComplete<T extends StageNames>(
    stage: T,
    metadata: StageMetadata[T],
    tokensUsed?: number
  ): Promise<void> {
    const startTime = this.startTimes.get(stage);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : null;

    await prisma.processLog.create({
      data: {
        sessionId: this.sessionId,
        stage,
        status: 'completed',
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: new Date(endTime),
        duration,
        tokensUsed,
        metadata: JSON.stringify(metadata),
      },
    });

    // Atualizar dados específicos no RequestAudit
    if (stage === 'extraction') {
      const extractionMeta = metadata as StageMetadata['extraction'];
      await this.updateRequestAudit({
        extractionMethod: extractionMeta.method,
      });
    }

    if (stage === 'analysis') {
      const analysisMeta = metadata as StageMetadata['analysis'];
      await this.updateRequestAudit({
        documentType: analysisMeta.documentType,
      });
    }

    if (stage === 'generation' || stage === 'improvement') {
      const genMeta = metadata as StageMetadata['generation'];
      await this.updateRequestAudit({
        totalTokens: { increment: tokensUsed || 0 },
      });
    }

    if (stage === 'validation') {
      const validationMeta = metadata as StageMetadata['validation'];
      await this.updateRequestAudit({
        qualityScore: validationMeta.score,
      });
    }

    if (stage === 'improvement') {
      await this.updateRequestAudit({
        improved: true,
      });
    }
  }

  /**
   * Registra um erro em um stage
   */
  async logStageError(stage: StageNames, error: Error): Promise<void> {
    const startTime = this.startTimes.get(stage);
    const endTime = Date.now();
    const duration = startTime ? endTime - startTime : null;

    await prisma.processLog.create({
      data: {
        sessionId: this.sessionId,
        stage,
        status: 'failed',
        startTime: startTime ? new Date(startTime) : new Date(),
        endTime: new Date(endTime),
        duration,
        errorMessage: error.message,
      },
    });
  }

  /**
   * Registra cache hit
   */
  async logCacheHit(stage: StageNames): Promise<void> {
    await prisma.processLog.create({
      data: {
        sessionId: this.sessionId,
        stage,
        status: 'cached',
        startTime: new Date(),
        endTime: new Date(),
        duration: 0,
      },
    });

    if (stage === 'generation') {
      await this.updateRequestAudit({
        cacheHit: true,
      });
    }
  }

  /**
   * Finaliza a sessão com sucesso
   */
  async completeRequest(): Promise<void> {
    const totalDuration = this.calculateTotalDuration();

    await this.updateRequestAudit({
      success: true,
      totalDuration,
    });
  }

  /**
   * Finaliza a sessão com erro
   */
  async failRequest(error: Error): Promise<void> {
    const totalDuration = this.calculateTotalDuration();

    await this.updateRequestAudit({
      success: false,
      errorMessage: error.message,
      totalDuration,
    });
  }

  /**
   * Atualiza dados da requisição principal
   */
  private async updateRequestAudit(data: any): Promise<void> {
    await prisma.requestAudit.update({
      where: { sessionId: this.sessionId },
      data,
    });
  }

  /**
   * Calcula duração total da requisição
   */
  private calculateTotalDuration(): number {
    const times = Array.from(this.startTimes.values());
    if (times.length === 0) return 0;

    const firstStart = Math.min(...times);
    return Date.now() - firstStart;
  }

  /**
   * Obtém estatísticas da sessão atual
   */
  async getSessionStats(): Promise<{
    totalDuration: number;
    stagesCompleted: number;
    totalTokens: number;
    cacheHits: number;
  }> {
    const logs = await prisma.processLog.findMany({
      where: { sessionId: this.sessionId },
    });

    const audit = await prisma.requestAudit.findUnique({
      where: { sessionId: this.sessionId },
    });

    return {
      totalDuration: this.calculateTotalDuration(),
      stagesCompleted: logs.filter(l => l.status === 'completed').length,
      totalTokens: audit?.totalTokens || 0,
      cacheHits: logs.filter(l => l.status === 'cached').length,
    };
  }
}

/**
 * Utilitário para criar hash MD5 de arquivo
 */
export function calculateFileMD5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

/**
 * Utilitário para obter estatísticas gerais do sistema
 */
export async function getSystemStats(days: number = 7): Promise<{
  totalRequests: number;
  successRate: number;
  averageTokens: number;
  averageDuration: number;
  cacheHitRate: number;
  topAgents: Array<{ name: string; usage: number }>;
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const requests = await prisma.requestAudit.findMany({
    where: {
      createdAt: { gte: since },
    },
    include: {
      agent: true,
    },
  });

  const totalRequests = requests.length;
  const successful = requests.filter(r => r.success).length;
  const withCache = requests.filter(r => r.cacheHit).length;

  const totalTokens = requests.reduce((sum, r) => sum + r.totalTokens, 0);
  const totalDuration = requests.reduce((sum, r) => sum + r.totalDuration, 0);

  const agentUsage = requests.reduce((acc, r) => {
    const name = r.agent.name;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAgents = Object.entries(agentUsage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, usage]) => ({ name, usage }));

  return {
    totalRequests,
    successRate: totalRequests > 0 ? (successful / totalRequests) * 100 : 0,
    averageTokens: totalRequests > 0 ? totalTokens / totalRequests : 0,
    averageDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
    cacheHitRate: totalRequests > 0 ? (withCache / totalRequests) * 100 : 0,
    topAgents,
  };
}