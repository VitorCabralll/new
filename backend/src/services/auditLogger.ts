import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

// (Os tipos de metadata permanecem os mesmos)
interface StageMetadata {
  upload: { fileType: string; originalName: string; size: number; md5: string; };
  extraction: { method: 'pdf-parse' | 'ocr'; textLength: number; confidence?: number; qualityChecked: boolean; };
  analysis: { documentType: string; partiesFound: number; valuesFound: number; datesFound: number; };
  chunking: { strategy: string; totalChunks: number; prioritizedChunks: number; totalTokens: number; avgRelevanceScore: number; };
  generation: { model: string; promptTokens: number; responseTokens: number; temperature?: number; chunksProcessed?: number; };
  validation: { score: number; issues: string[]; isAcceptable: boolean; };
  improvement: { originalScore: number; improvedScore: number; attempts: number; };
  multi_agent_processing: { scoreFinal?: number; iteracoesRefinamento?: number; tempoProcessamento?: number; tokensUsados?: number; error?: string; fallback?: boolean; };
  planning: { secoesCount?: number; posicionamento?: string; };
  [key: string]: any;
}

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

  async startRequest(data: {
    userAgentId: string; // CORRIGIDO: de agentId para userAgentId
    fileName: string;
    fileSize: number;
    fileMD5: string;
    userId?: string;
  }): Promise<void> {
    this.requestData = data;

    // CORRIGIDO: Usar a sintaxe de relação `connect` para vincular ao UserAgent
    await prisma.requestAudit.create({
      data: {
        sessionId: this.sessionId,
        userAgent: {
          connect: { id: data.userAgentId },
        },
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileMD5: data.fileMD5,
        userId: data.userId,
        extractionMethod: '',
        success: false,
      },
    });
  }

  async logStageStart(stage: string): Promise<void> {
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

  async logStageComplete(
    stage: string,
    metadata: any,
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

    if (stage === 'extraction') {
      await this.updateRequestAudit({ extractionMethod: (metadata as StageMetadata['extraction']).method });
    }
    if (stage === 'analysis') {
      await this.updateRequestAudit({ documentType: (metadata as StageMetadata['analysis']).documentType });
    }
    if (stage === 'generation' || stage === 'improvement') {
      await this.updateRequestAudit({ totalTokens: { increment: tokensUsed || 0 } });
    }
    if (stage === 'validation') {
      await this.updateRequestAudit({ qualityScore: (metadata as StageMetadata['validation']).score });
    }
    if (stage === 'improvement') {
      await this.updateRequestAudit({ improved: true });
    }
  }

  async logStageError(stage: string, error: Error): Promise<void> {
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

  async logCacheHit(stage: string): Promise<void> {
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
      await this.updateRequestAudit({ cacheHit: true });
    }
  }

  async completeRequest(): Promise<void> {
    const totalDuration = this.calculateTotalDuration();
    await this.updateRequestAudit({
      success: true,
      totalDuration,
    });
  }

  async failRequest(error: Error): Promise<void> {
    // Verificar se o registro de auditoria existe antes de tentar atualizá-lo
    const auditExists = await prisma.requestAudit.findUnique({ where: { sessionId: this.sessionId } });
    if (auditExists) {
      const totalDuration = this.calculateTotalDuration();
      await this.updateRequestAudit({
        success: false,
        errorMessage: error.message,
        totalDuration,
      });
    } else {
      console.error(`[AuditLogger] Falha ao registrar falha: Sessão de auditoria ${this.sessionId} não encontrada.`);
    }
  }

  private async updateRequestAudit(data: any): Promise<void> {
    await prisma.requestAudit.update({
      where: { sessionId: this.sessionId },
      data,
    });
  }

  private calculateTotalDuration(): number {
    const times = Array.from(this.startTimes.values());
    if (times.length === 0) return 0;
    const firstStart = Math.min(...times);
    return Date.now() - firstStart;
  }
}

export function calculateFileMD5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

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
    where: { createdAt: { gte: since } },
    include: { userAgent: true }, // CORRIGIDO: de agent para userAgent
  });

  const totalRequests = requests.length;
  const successful = requests.filter(r => r.success).length;
  const withCache = requests.filter(r => r.cacheHit).length;
  const totalTokens = requests.reduce((sum, r) => sum + r.totalTokens, 0);
  const totalDuration = requests.reduce((sum, r) => sum + r.totalDuration, 0);

  const agentUsage = requests.reduce((acc, r) => {
    const name = r.userAgent?.name || 'unknown'; // CORRIGIDO: de agent para userAgent
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAgents = Object.entries(agentUsage)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, usage]) => ({ name, usage }));

  return {
    totalRequests,
    successRate: totalRequests > 0 ? successful / totalRequests * 100 : 0,
    averageTokens: totalRequests > 0 ? totalTokens / totalRequests : 0,
    averageDuration: totalRequests > 0 ? totalDuration / totalRequests : 0,
    cacheHitRate: totalRequests > 0 ? withCache / totalRequests * 100 : 0,
    topAgents,
  };
}