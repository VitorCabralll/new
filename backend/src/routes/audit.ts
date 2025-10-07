import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getSystemStats } from '../services/auditLogger.js';

const router = Router();

// GET /api/audit - Informações sobre a API de Auditoria
router.get('/audit', async (req, res) => {
  try {
    res.json({
      message: 'Audit API - Sistema de Auditoria do Assistente Jurídico IA',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        stats: {
          path: 'GET /api/audit/stats',
          description: 'Estatísticas gerais do sistema',
          params: { days: 'number (opcional, padrão: 7)' }
        },
        requests: {
          path: 'GET /api/audit/requests',
          description: 'Listar todas as requisições auditadas',
          params: {
            page: 'number (opcional, padrão: 1)',
            limit: 'number (opcional, padrão: 20)',
            success: 'boolean (opcional)',
            agentId: 'string (opcional)',
            startDate: 'ISO date (opcional)',
            endDate: 'ISO date (opcional)'
          }
        },
        requestDetails: {
          path: 'GET /api/audit/requests/:sessionId',
          description: 'Detalhes de uma requisição específica',
          params: { sessionId: 'string (obrigatório)' }
        },
        performance: {
          path: 'GET /api/audit/agents/performance',
          description: 'Performance dos agentes',
          params: { days: 'number (opcional, padrão: 30)' }
        },
        timeline: {
          path: 'GET /api/audit/timeline/:sessionId',
          description: 'Timeline visual de uma sessão',
          params: { sessionId: 'string (obrigatório)' }
        },
        cleanup: {
          path: 'DELETE /api/audit/cleanup',
          description: 'Limpar logs antigos (utilitário)',
          params: { days: 'number (opcional, padrão: 90)' }
        }
      },
      documentation: 'https://docs.assistentejuridico.ia/audit-api'
    });
  } catch (error) {
    console.error('Failed to get audit API info:', error);
    res.status(500).json({ message: 'Falha ao obter informações da API de auditoria.' });
  }
});

// GET /api/audit/stats - Estatísticas gerais do sistema
router.get('/audit/stats', async (req, res) => {
  try {
    const { days = '7' } = req.query;
    const stats = await getSystemStats(parseInt(days as string));

    res.json(stats);
  } catch (error) {
    console.error('Failed to get system stats:', error);
    res.status(500).json({ message: 'Falha ao obter estatísticas do sistema.' });
  }
});

// GET /api/audit/requests - Listar todas as requisições auditadas
router.get('/audit/requests', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      success,
      agentId,
      startDate,
      endDate
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Filtros
    const where: any = {};
    if (success !== undefined) {
      where.success = success === 'true';
    }
    if (agentId) {
      where.agentId = agentId as string;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [requests, total] = await Promise.all([
      prisma.requestAudit.findMany({
        where,
        include: {
          agent: {
            select: { name: true, category: true }
          },
          processLogs: {
            select: {
              stage: true,
              status: true,
              duration: true,
              tokensUsed: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum,
      }),
      prisma.requestAudit.count({ where })
    ]);

    // Enriquecer dados
    const enrichedRequests = requests.map(request => ({
      ...request,
      stages: request.processLogs.reduce((acc, log) => {
        acc[log.stage] = {
          status: log.status,
          duration: log.duration,
          tokensUsed: log.tokensUsed
        };
        return acc;
      }, {} as Record<string, any>),
      processLogs: undefined // Remove para não duplicar dados
    }));

    res.json({
      requests: enrichedRequests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Failed to get audit requests:', error);
    res.status(500).json({ message: 'Falha ao obter requisições auditadas.' });
  }
});

// GET /api/audit/requests/:sessionId - Detalhes de uma requisição específica
router.get('/audit/requests/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const request = await prisma.requestAudit.findUnique({
      where: { sessionId },
      include: {
        agent: true,
        processLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Sessão não encontrada.' });
    }

    // Processar logs para timeline
    const timeline = request.processLogs.map(log => ({
      stage: log.stage,
      status: log.status,
      startTime: log.startTime,
      endTime: log.endTime,
      duration: log.duration,
      tokensUsed: log.tokensUsed,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      errorMessage: log.errorMessage
    }));

    res.json({
      ...request,
      timeline
    });
  } catch (error) {
    console.error('Failed to get audit request details:', error);
    res.status(500).json({ message: 'Falha ao obter detalhes da requisição.' });
  }
});

// GET /api/audit/agents/performance - Performance dos agentes
router.get('/audit/agents/performance', async (req, res) => {
  try {
    const { days = '30' } = req.query;
    const since = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const agentPerformance = await prisma.requestAudit.groupBy({
      by: ['agentId'],
      where: {
        createdAt: { gte: since }
      },
      _count: {
        id: true
      },
      _avg: {
        qualityScore: true,
        totalDuration: true,
        totalTokens: true
      },
      _sum: {
        totalTokens: true
      }
    });

    // Buscar dados dos agentes
    const agentIds = agentPerformance.map(p => p.agentId);
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true, category: true }
    });

    const agentMap = agents.reduce((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {} as Record<string, any>);

    // Combinar dados
    const performance = agentPerformance.map(p => ({
      agent: agentMap[p.agentId],
      usage: p._count.id,
      averageQuality: p._avg.qualityScore,
      averageDuration: p._avg.totalDuration,
      averageTokens: p._avg.totalTokens,
      totalTokens: p._sum.totalTokens
    })).sort((a, b) => b.usage - a.usage);

    res.json(performance);
  } catch (error) {
    console.error('Failed to get agent performance:', error);
    res.status(500).json({ message: 'Falha ao obter performance dos agentes.' });
  }
});

// GET /api/audit/timeline/:sessionId - Timeline visual de uma sessão
router.get('/audit/timeline/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const logs = await prisma.processLog.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    if (logs.length === 0) {
      return res.status(404).json({ message: 'Logs não encontrados para esta sessão.' });
    }

    // Criar timeline visual
    const timeline = logs.map((log, index) => {
      const metadata = log.metadata ? JSON.parse(log.metadata) : {};

      return {
        step: index + 1,
        stage: log.stage,
        status: log.status,
        startTime: log.startTime,
        endTime: log.endTime,
        duration: log.duration,
        tokensUsed: log.tokensUsed,
        details: metadata,
        error: log.errorMessage
      };
    });

    // Calcular métricas da sessão
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalTokens = logs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
    const successful = logs.filter(log => log.status === 'completed').length;
    const failed = logs.filter(log => log.status === 'failed').length;
    const cached = logs.filter(log => log.status === 'cached').length;

    res.json({
      sessionId,
      timeline,
      summary: {
        totalDuration,
        totalTokens,
        stagesTotal: logs.length,
        successful,
        failed,
        cached
      }
    });
  } catch (error) {
    console.error('Failed to get session timeline:', error);
    res.status(500).json({ message: 'Falha ao obter timeline da sessão.' });
  }
});

// DELETE /api/audit/cleanup - Limpar logs antigos (utilitário)
router.delete('/audit/cleanup', async (req, res) => {
  try {
    const { days = '90' } = req.body;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Deletar logs antigos
    const deletedLogs = await prisma.processLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    });

    // Deletar requisições antigas órfãs
    const deletedRequests = await prisma.requestAudit.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        processLogs: { none: {} }
      }
    });

    res.json({
      message: 'Limpeza concluída com sucesso.',
      deletedLogs: deletedLogs.count,
      deletedRequests: deletedRequests.count
    });
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    res.status(500).json({ message: 'Falha ao limpar logs de auditoria.' });
  }
});

export default router;