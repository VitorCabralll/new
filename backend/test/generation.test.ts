import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import app from '../src/server';
import path from 'path';
import { execSync } from 'child_process';

// Mock da API do Google GenAI para corresponder ao uso real em UniversalAnalista.ts
vi.mock('@google/genai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        tipoDocumento: 'Habilitação de Crédito',
        partes: [{ nome: 'Teste da Silva', tipo: 'credor' }],
        valores: { total: { apresentado: 1000, calculado: 1000, correto: true } },
        questoesJuridicas: ['Teste'],
        pedidos: ['Habilitação do crédito'],
        pontosAtencao: [],
        estrutura: ["I. RELATÓRIO", "II. FUNDAMENTAÇÃO", "III. CONCLUSÃO"],
        posicionamento: { tipo: 'FAVORÁVEL' },
        scoreGeral: 9.5,
      }),
    },
  });

  const GoogleGenAI = vi.fn().mockImplementation(() => {
    return {
      // Simular a propriedade `models` que contém o método `generateContent`
      models: {
        generateContent: mockGenerateContent,
      },
    };
  });

  return { GoogleGenAI };
});

const prisma = new PrismaClient();

describe('POST /api/generate (Unified Endpoint)', () => {
  let userAgentId: string;

  // 1. Popular o DB com SystemAgents e criar um UserAgent de teste
  beforeAll(async () => {
    // Executar o seeder como um processo para garantir que o DB esteja pronto
    console.log('Seeding system agents for test...');
    execSync('npx tsx prisma/seed-system-agents.ts', { stdio: 'inherit' });

    // Limpeza robusta para lidar com execuções de teste anteriores com falha
    const oldTestAgent = await prisma.userAgent.findFirst({ where: { name: 'Test Agent for Generation' } });
    if (oldTestAgent) {
      const audits = await prisma.requestAudit.findMany({ where: { userAgentId: oldTestAgent.id } });
      if (audits.length > 0) {
        const sessionIds = audits.map(a => a.sessionId);
        await prisma.processLog.deleteMany({ where: { sessionId: { in: sessionIds } } });
        await prisma.requestAudit.deleteMany({ where: { userAgentId: oldTestAgent.id } });
      }
      await prisma.userAgent.delete({ where: { id: oldTestAgent.id } });
    }

    const userAgent = await prisma.userAgent.create({
      data: {
        userId: 'test-user',
        name: 'Test Agent for Generation',
        category: 'Test',
        basePrompt: 'This is a test prompt.',
        systemInstruction: 'You are a testing agent.',
        isTrained: true, // Marcar como treinado para passar na validação do endpoint
      },
    });
    userAgentId = userAgent.id;
  }, 40000); // Timeout maior para o setup

  // 2. Limpar o DB depois de todos os testes
  afterAll(async () => {
    if (!userAgentId) return; // Se o setup falhou, não há nada a limpar

    // A ordem de limpeza correta para evitar erros de chave estrangeira
    const audits = await prisma.requestAudit.findMany({ where: { userAgentId: userAgentId } });
    if (audits.length > 0) {
      const sessionIds = audits.map(a => a.sessionId);
      // 1. Deletar ProcessLog
      await prisma.processLog.deleteMany({ where: { sessionId: { in: sessionIds } } });
      // 2. Deletar RequestAudit
      await prisma.requestAudit.deleteMany({ where: { userAgentId: userAgentId } });
    }
    // 3. Deletar UserAgent
    await prisma.userAgent.delete({ where: { id: userAgentId } });

    await prisma.$disconnect();
  });

  // 3. O teste principal
  it('should successfully generate a manifestation with a valid UserAgent and file', async () => {
    // Usar um arquivo PDF real para o teste
    const testFilePath = path.join(__dirname, 'data', '1016035-72.2024.8.11.0041 - CBA - Hab. Crédito Trab - intimação.pdf');

    const response = await request(app)
      .post('/api/generate')
      .field('userAgentId', userAgentId)
      .field('instructions', 'Test instructions')
      .attach('file', testFilePath); // Anexar o arquivo de teste real

    // Verificar a resposta
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('manifestacao');
    expect(response.body.manifestacao).toBeTypeOf('string');
    expect(response.body.metadata.userAgent.id).toBe(userAgentId);
    expect(response.body.cached).toBe(false);

  }, 30000); // Timeout de 30 segundos para acomodar a chamada de IA

  it('should return 400 if file is missing', async () => {
    const response = await request(app)
      .post('/api/generate')
      .field('userAgentId', userAgentId)
      .field('instructions', 'Test instructions');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Nenhum arquivo enviado.');
  });

  it('should return 400 if userAgentId is missing', async () => {
    // Usar um arquivo PDF real para o teste
    const testFilePath = path.join(__dirname, 'data', '1028881-24.2024.8.11.0041 - CBA - Hab. Crédito - fav. ao pedido.pdf');

    const response = await request(app)
      .post('/api/generate')
      .field('instructions', 'Test instructions')
      .attach('file', testFilePath);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('ID do UserAgent é obrigatório.');
  });
});