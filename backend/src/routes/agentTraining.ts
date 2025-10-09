import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../lib/prisma.js';
import { AgentTrainingService } from '../services/agentTrainingService.js';
import { ValidationService } from '../services/validationService.js';

const router = Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'training');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por arquivo
    files: 6 // Máximo de 6 arquivos (5 modelos + 1 teste)
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  }
});

// Instanciar serviços
const trainingService = new AgentTrainingService();
const validationService = new ValidationService();

// ============================================================================
// POST /api/training/train - TREINAR NOVO AGENTE
// ============================================================================
router.post(
  '/training/train',
  upload.fields([
    { name: 'modelFiles', maxCount: 5 },
    { name: 'testDocument', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const {
        name,
        documentType,
        legalArea,
        jurisdiction,
        customInstructions,
        tone,
        emphasis
      } = req.body;

      // Validar campos obrigatórios
      if (!name || !documentType || !customInstructions) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios faltando: name, documentType, customInstructions'
        });
      }

      // Obter arquivos enviados
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const modelFiles = files['modelFiles'] || [];
      const testDocument = files['testDocument']?.[0];

      // Validar número de modelos
      if (modelFiles.length < 1 || modelFiles.length > 5) {
        return res.status(400).json({
          success: false,
          error: 'Forneça entre 1 e 5 modelos exemplares'
        });
      }

      console.log(`🎯 Iniciando treinamento de agente: ${name}`);
      console.log(`📁 Modelos recebidos: ${modelFiles.length}`);

      // Configuração do treinamento
      const config = {
        userId: 'default-user', // TODO: Usar autenticação real
        name,
        documentType,
        legalArea: legalArea || 'Geral',
        jurisdiction: jurisdiction || 'Federal',
        customInstructions,
        tone: tone || 'formal',
        emphasis: emphasis ? JSON.parse(emphasis) : [],
        modelFiles: modelFiles.map(f => ({
          path: f.path,
          originalName: f.originalname,
          size: f.size
        })),
        testDocument: testDocument ? {
          path: testDocument.path,
          originalName: testDocument.originalname
        } : undefined
      };

      // Treinar o agente
      const result = await trainingService.trainAgentFromModels(config);

      console.log(`✅ Agente treinado com sucesso! ID: ${result.agentId}`);

      res.status(201).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Erro ao treinar agente:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao treinar agente'
      });
    }
  }
);

// ============================================================================
// POST /api/training/user-agents/:userAgentId/models - ADICIONAR MODELO A USER AGENT EXISTENTE
// ============================================================================
router.post(
  '/training/user-agents/:userAgentId/models',
  upload.single('modelFile'),
  async (req, res) => {
    try {
      const { userAgentId } = req.params;
      const { description } = req.body;
      const modelFile = req.file;

      if (!modelFile) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo do modelo não fornecido'
        });
      }

      // Verificar se o User Agent existe
      const userAgent = await prisma.userAgent.findUnique({
        where: { id: userAgentId }
      });

      if (!userAgent) {
        return res.status(404).json({
          success: false,
          error: 'User Agent não encontrado'
        });
      }

      console.log(`📁 Adicionando modelo ao User Agent ${userAgentId}: ${modelFile.originalname}`);

      // TODO: Implementar análise do novo modelo e atualização do User Agent
      // Por enquanto, retornamos sucesso básico

      res.status(200).json({
        success: true,
        message: 'Modelo adicionado com sucesso',
        data: {
          modelId: `model-${Date.now()}`,
          fileName: modelFile.originalname,
          description: description || null
        }
      });

    } catch (error) {
      console.error('❌ Erro ao adicionar modelo:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao adicionar modelo'
      });
    }
  }
);

// ============================================================================
// POST /api/training/user-agents/:userAgentId/generate - GERAR DOCUMENTO USANDO USER AGENT
// ============================================================================
router.post(
  '/training/user-agents/:userAgentId/generate',
  upload.single('processDocument'),
  async (req, res) => {
    try {
      const { userAgentId } = req.params;
      const { additionalInstructions } = req.body;
      const processDocument = req.file;

      if (!processDocument) {
        return res.status(400).json({
          success: false,
          error: 'Documento do processo não fornecido'
        });
      }

      // Buscar User Agent no banco
      const userAgent = await prisma.userAgent.findUnique({
        where: { id: userAgentId }
      });

      if (!userAgent) {
        return res.status(404).json({
          success: false,
          error: 'User Agent não encontrado'
        });
      }

      console.log(`📝 Gerando documento usando User Agent: ${userAgent.name}`);
      console.log(`📄 Documento do processo: ${processDocument.originalname}`);

      const startTime = Date.now();

      // TODO: Implementar geração real usando o User Agent e o documento
      // Por enquanto, retornamos um exemplo

      const generatedDocument = `
MANIFESTAÇÃO DO MINISTÉRIO PÚBLICO

[Documento gerado pelo User Agent: ${userAgent.name}]
[Baseado em: ${processDocument.originalname}]

Este é um documento de exemplo gerado pelo sistema de treinamento de agentes.
A implementação completa virá na próxima etapa.

Instruções adicionais: ${additionalInstructions || 'Nenhuma'}
      `.trim();

      const processingTime = Date.now() - startTime;

      // VALIDAÇÃO AUTOMÁTICA
      let validation = null;
      try {
        // Buscar modelos do metadata do User Agent
        const metadata = userAgent.metadata ? JSON.parse(userAgent.metadata) : null;
        
        if (metadata?.modelAnalysesSummary) {
          // Converter resumos em ModelAnalysis format
          const modelAnalyses = metadata.modelAnalysesSummary.map((summary: any) => ({
            structure: { sections: Array(summary.sectionsCount).fill({ name: 'Seção' }) },
            legalCitations: Array(summary.citationsCount).fill({ text: 'Citação' }),
            style: { formalityScore: summary.formalityScore },
            wordCount: summary.wordCount
          }));
          
          validation = await validationService.validateDocument(
            generatedDocument,
            modelAnalyses
          );
          
          console.log(`✅ Validação: ${validation.overallScore}/10 (${validation.issues.length} problemas)`);
        }
      } catch (error) {
        console.error('⚠️ Erro na validação:', error);
        // Continua mesmo sem validação
      }

      res.status(200).json({
        success: true,
        data: {
          generationId: `gen-${Date.now()}`,
          generatedDocument,
          metadata: {
            processingTime,
            tokensUsed: 0, // TODO: calcular tokens reais
            validation: validation || {
              overallScore: 0,
              structureMatch: 0,
              styleMatch: 0,
              citationAccuracy: 0
            }
          }
        }
      });

    } catch (error) {
      console.error('❌ Erro ao gerar documento:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar documento'
      });
    }
  }
);

// ============================================================================
// GET /api/training/user-agents - LISTAR USER AGENTS DE TREINamento
// ============================================================================
router.get('/training/user-agents', async (req, res) => {
  try {
    const { category, jurisdiction, minQualityScore } = req.query;

    const where: any = {};
    
    if (category) {
      where.category = category as string;
    }
    
    if (jurisdiction) {
      // Filtrar por jurisdição no metadata
      // TODO: Implementar filtro de jurisdição no metadata JSON
    }
    
    if (minQualityScore) {
      where.qualityScore = {
        gte: parseFloat(minQualityScore as string)
      };
    }

    const userAgents = await prisma.userAgent.findMany({
      where,
      orderBy: [
        { qualityScore: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        category: true,
        qualityScore: true,
        trainingExamples: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      }
    });

    res.json({
      success: true,
      data: {
        userAgents: userAgents.map(userAgent => ({
          ...userAgent,
          metadata: userAgent.metadata ? JSON.parse(userAgent.metadata) : null
        })),
        total: userAgents.length
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar User Agents:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao listar User Agents'
    });
  }
});

// ============================================================================
// GET /api/training/user-agents/:userAgentId - BUSCAR DETALHES DO USER AGENT
// ============================================================================
router.get('/training/user-agents/:userAgentId', async (req, res) => {
  try {
    const { userAgentId } = req.params;

    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      return res.status(404).json({
        success: false,
        error: 'User Agent não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        ...userAgent,
        metadata: userAgent.metadata ? JSON.parse(userAgent.metadata) : null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar User Agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar User Agent'
    });
  }
});

// ============================================================================
// GET /api/training/user-agents/:userAgentId/metrics - BUSCAR MÉTRICAS DO USER AGENT
// ============================================================================
router.get('/training/user-agents/:userAgentId/metrics', async (req, res) => {
  try {
    const { userAgentId } = req.params;
    const { period = '30d' } = req.query;

    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      return res.status(404).json({
        success: false,
        error: 'User Agent não encontrado'
      });
    }

    // TODO: Implementar busca real de métricas de uso
    // Por enquanto, retornamos métricas de exemplo

    res.json({
      success: true,
      data: {
        agentId: userAgent.id,
        name: userAgent.name,
        
        usage: {
          totalUsages: 0,
          lastUsed: null,
          avgProcessingTime: 0
        },
        
        quality: {
          avgScore: userAgent.qualityScore,
          avgUserRating: 0,
          trend: 'stable'
        },
        
        alignment: {
          structureMatch: 0,
          styleMatch: 0,
          citationAccuracy: 0,
          overallAlignment: 0
        },
        
        improvements: []
      }
    });

  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao buscar métricas'
    });
  }
});

// ============================================================================
// POST /api/training/user-agents/:userAgentId/feedback - ENVIAR FEEDBACK
// ============================================================================
router.post('/training/user-agents/:userAgentId/feedback', async (req, res) => {
  try {
    const { userAgentId } = req.params;
    const { generationId, rating, feedback, corrections } = req.body;

    if (!rating || rating < 0 || rating > 10) {
      return res.status(400).json({
        success: false,
        error: 'Rating deve estar entre 0 e 10'
      });
    }

    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      return res.status(404).json({
        success: false,
        error: 'User Agent não encontrado'
      });
    }

    console.log(`📊 Feedback recebido para User Agent ${userAgent.name}: ${rating}/10`);

    // TODO: Salvar feedback no banco de dados
    // TODO: Implementar sistema de melhoria contínua

    res.json({
      success: true,
      message: 'Feedback registrado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao registrar feedback:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar feedback'
    });
  }
});

// ============================================================================
// POST /api/training/user-agents/:userAgentId/retrain - RETREINAR USER AGENT
// ============================================================================
router.post('/training/user-agents/:userAgentId/retrain', async (req, res) => {
  try {
    const { userAgentId } = req.params;
    const { useRecentCorrections, additionalInstructions } = req.body;

    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      return res.status(404).json({
        success: false,
        error: 'User Agent não encontrado'
      });
    }

    console.log(`🔄 Iniciando retreinamento do User Agent: ${userAgent.name}`);

    // TODO: Implementar lógica de retreinamento
    // - Buscar correções recentes se useRecentCorrections = true
    // - Analisar padrões nas correções
    // - Gerar nova instruction melhorada
    // - Validar com casos de teste
    // - Salvar nova versão

    res.json({
      success: true,
      data: {
        oldVersion: '1.0',
        newVersion: '1.1',
        qualityBefore: userAgent.qualityScore,
        qualityAfter: userAgent.qualityScore, // Por enquanto, mesma qualidade
        improvements: [
          'Retreinamento implementado - em breve!'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erro ao retreinar User Agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao retreinar User Agent'
    });
  }
});

// ============================================================================
// DELETE /api/training/user-agents/:userAgentId - DELETAR USER AGENT
// ============================================================================
router.delete('/training/user-agents/:userAgentId', async (req, res) => {
  try {
    const { userAgentId } = req.params;

    const userAgent = await prisma.userAgent.findUnique({
      where: { id: userAgentId }
    });

    if (!userAgent) {
      return res.status(404).json({
        success: false,
        error: 'User Agent não encontrado'
      });
    }

    await prisma.userAgent.delete({
      where: { id: userAgentId }
    });

    console.log(`🗑️ User Agent deletado: ${userAgent.name}`);

    res.json({
      success: true,
      message: 'User Agent deletado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao deletar User Agent:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar User Agent'
    });
  }
});

export default router;
