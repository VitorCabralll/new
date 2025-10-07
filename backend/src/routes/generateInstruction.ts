import { Router } from 'express';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { extractTextFromPDF } from '../services/textExtractor.js';
import { validateInstructionQuality } from '../services/qualityValidator.js';
import fs from 'fs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Configure the Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

router.post('/generate-instruction', upload.array('files'), async (req, res) => {
  const { agentName } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }

  if (!agentName) {
    return res.status(400).json({ message: 'Nome do agente é obrigatório.' });
  }

  try {
    // Extract text from all example files
    const exampleTexts: string[] = [];

    for (const file of files) {
      const extractionResult = await extractTextFromPDF(file.path);
      exampleTexts.push(extractionResult.text);

      // Clean up the uploaded file
      fs.unlinkSync(file.path);
    }

    // Combine all examples
    const examplesString = exampleTexts.map((text, i) => `--- EXEMPLO ${i + 1} ---\n${text}\n\n`).join('');

    // Generate enhanced system instruction using Gemini
    const prompt = `
        Você é um especialista em engenharia de prompts jurídicos. Sua tarefa é criar uma "Instrução de Sistema" EXTREMAMENTE DETALHADA para um agente de IA jurídico especializado em ${agentName}.

        ANALISE MINUCIOSAMENTE os exemplos fornecidos:
        ${examplesString}

        Crie uma instrução de sistema COMPLETA e ESPECÍFICA seguindo esta estrutura OBRIGATÓRIA:

        "Você é um assistente jurídico especialista em ${agentName}. [Descreva o papel específico]

        **FORMATAÇÃO E ESTRUTURA OBRIGATÓRIA:**

        1. **CABEÇALHO COMPLETO:** [Detalhe EXATO do cabeçalho]
           - Sede das Promotorias de Justiça da Capital
           - Endereço completo com CEP
           - Telefone e website
           - Número da Promotoria e área de atuação
           - Identificação da Vara
           - Número único do processo
           - Partes (Requerente/Requerido)

        2. **ESTRUTURA DO DOCUMENTO:** [Ordem EXATA das seções]
           - Como iniciar (Meritíssimo Juiz:)
           - Seção de relatório
           - Seção de fundamentação
           - Seção de manifestação
           - Requerimentos específicos
           - Fechamento formal

        3. **LINGUAGEM JURÍDICA ESPECÍFICA:**
           - Expressões técnicas obrigatórias
           - Citações de artigos e leis
           - Fórmulas de cortesia
           - Terminologia especializada

        4. **DETALHAMENTO PROCESSUAL:**
           - Como mencionar manifestações anteriores
           - Como referenciar documentos (IDs)
           - Como citar pareceres do AJ
           - Cronologia processual

        5. **FORMATAÇÃO VISUAL:**
           - Uso de MAIÚSCULAS e **negrito**
           - Espaçamento entre seções
           - Numeração e organização
           - Assinatura eletrônica padrão

        6. **CONTEÚDO JURÍDICO ESPECÍFICO:**
           - Artigos da Lei 11.101/2005 mais relevantes
           - Requisitos processuais específicos
           - Classificações de crédito
           - Procedimentos de atualização

        7. **REQUERIMENTOS PADRÃO:**
           - Intimações específicas
           - Próximos passos processuais
           - Manifestações condicionais

        8. **QUALIDADE E PRECISÃO:**
           - Como garantir precisão factual
           - Verificações obrigatórias
           - Padrões de qualidade

        IMPORTANTE: Baseie-se RIGOROSAMENTE nos padrões observados nos exemplos. Seja ULTRA-ESPECÍFICO em cada detalhe."

        Gere APENAS a instrução final, sem comentários ou explicações adicionais.
    `;

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const instruction = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Validate instruction quality
    const qualityResult = validateInstructionQuality(instruction);

    res.json({
      instruction,
      quality: qualityResult,
      trainingExamples: files.length
    });

  } catch (error) {
    console.error('Failed to generate system instruction:', error);

    // Clean up any remaining files in case of error
    if (files) {
      files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', file.path, unlinkError);
        }
      });
    }

    res.status(500).json({ message: 'Falha ao gerar a instrução de sistema.' });
  }
});

export default router;