import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/agents - Listar todos os agentes com filtros
router.get('/agents', async (req, res) => {
  try {
    const { category, active, sortBy = 'quality', order = 'desc' } = req.query;

    const where = {
      ...(category && { category: category as string }),
      ...(active !== undefined && { isActive: active === 'true' })
    };

    const orderBy = {
      [sortBy as string]: order as 'asc' | 'desc'
    };

    const agents = await prisma.agent.findMany({
      where,
      orderBy
    });

    // Add computed fields
    const enrichedAgents = agents.map(agent => ({
      ...agent,
      metadata: agent.metadata ? JSON.parse(agent.metadata) : null,
      status: agent.isActive ? 'active' : 'inactive',
      qualityBadge: agent.quality && agent.quality >= 8 ? 'high' :
                   agent.quality && agent.quality >= 6 ? 'medium' : 'low'
    }));

    res.json(enrichedAgents);
  } catch (error) {
    console.error('Failed to fetch agents:', error);
    res.status(500).json({ message: 'Falha ao buscar agentes no banco de dados.' });
  }
});

// POST /api/agents - Criar um novo agente
router.post('/agents', async (req, res) => {
  try {
    const { name, systemInstruction, category, trainingExamples, metadata } = req.body;

    if (!name || !systemInstruction) {
      return res.status(400).json({ message: 'Nome e instrução de sistema são obrigatórios.' });
    }

    // Calculate quality score based on instruction length and detail
    const instructionLength = systemInstruction.length;
    const hasDetailedStructure = systemInstruction.includes('ESTRUTURA') && systemInstruction.includes('FORMATAÇÃO');
    const qualityScore = Math.min(10, (instructionLength / 1000) * 5 + (hasDetailedStructure ? 3 : 0));

    const newAgent = await prisma.agent.create({
      data: {
        name,
        systemInstruction,
        category,
        trainingExamples: trainingExamples || 0,
        quality: qualityScore,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    res.status(201).json(newAgent);
  } catch (error) {
    console.error('Failed to create agent:', error);
    res.status(500).json({ message: 'Falha ao criar o agente no banco de dados.' });
  }
});

// DELETE /api/agents/:id - Excluir um agente
router.delete('/agents/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevenção para não deletar o agente padrão, caso o ID seja enviado do frontend
    if (id === 'default-generalist-1') {
        return res.status(403).json({ message: 'O agente padrão não pode ser excluído.' });
    }

    await prisma.agent.delete({
      where: { id },
    });
    res.status(200).json({ message: 'Agente excluído com sucesso.' });
  } catch (error) {
    console.error('Failed to delete agent:', error);
    // Prisma lança P2025 se o registro não for encontrado
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ message: 'Agente não encontrado.' });
    }
    res.status(500).json({ message: 'Falha ao excluir o agente do banco de dados.' });
  }
});

export default router;
