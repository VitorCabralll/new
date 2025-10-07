import { GoogleGenAI } from '@google/genai';
import { extractTextFromPDF } from './dist/services/textExtractor.js';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔗 TESTE DAS INTEGRAÇÕES EXTERNAS\\n');

// Teste 1: Google AI (Gemini)
console.log('🤖 TESTE 1: Integração Google AI (Gemini)');
try {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  
  const prompt = "Teste simples de conexão. Responda apenas: 'Conexão funcionando'";
  
  const result = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50
    }
  });
  
  const response = result.response.text();
  console.log(`✅ Resposta: ${response.trim()}`);
  console.log(`📊 Status: Integração funcionando`);
} catch (error) {
  console.log(`❌ Erro na integração: ${error.message}`);
}

console.log('\\n' + '='.repeat(50) + '\\n');

// Teste 2: Extração de texto (PDF-parse + OCR)
console.log('📄 TESTE 2: Extração de texto (PDF-parse)');
try {
  // Usar um PDF existente para teste
  const testPdf = 'test/data/1016035-72.2024.8.11.0041 - CBA - Hab. Crédito Trab - intimação.pdf';
  
  if (fs.existsSync(testPdf)) {
    const result = await extractTextFromPDF(testPdf);
    console.log(`✅ Método usado: ${result.method}`);
    console.log(`📊 Caracteres extraídos: ${result.text.length}`);
    console.log(`📊 Confiança: ${result.confidence}`);
    console.log(`📊 Status: Extração funcionando`);
  } else {
    console.log('❌ Arquivo de teste não encontrado');
  }
} catch (error) {
  console.log(`❌ Erro na extração: ${error.message}`);
}

console.log('\\n' + '='.repeat(50) + '\\n');

// Teste 3: Base de dados (Prisma)
console.log('🗄️  TESTE 3: Base de dados (Prisma)');
try {
  const { prisma } = await import('./dist/lib/prisma.js');
  
  const agentCount = await prisma.agent.count();
  console.log(`✅ Agentes na base: ${agentCount}`);
  
  const sessionCount = await prisma.session.count();
  console.log(`✅ Sessões na base: ${sessionCount}`);
  
  console.log(`📊 Status: Base de dados funcionando`);
  
  await prisma.$disconnect();
} catch (error) {
  console.log(`❌ Erro na base de dados: ${error.message}`);
}

console.log('\\n✅ Teste de integrações concluído!');