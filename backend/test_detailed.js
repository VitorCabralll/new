import { extractTextFromPDF } from './dist/services/textExtractor.js';
import { processDocumentWithChunking } from './dist/services/documentChunker.js';
import { validateManifestationQuality } from './dist/services/qualityValidator.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Arquivos de teste
const testFiles = [
  {
    name: '1016035-72.2024.8.11.0041 - CBA - Hab. Crédito Trab - intimação.pdf',
    type: 'manifestacao_intimacao',
    expectedType: 'Habilitação de Crédito'
  },
  {
    name: '1028881-24.2024.8.11.0041 - CBA - Hab. Crédito - fav. ao pedido.pdf',
    type: 'manifestacao_favoravel',
    expectedType: 'Habilitação de Crédito'
  },
  {
    name: '1028910-74.2024.8.11.0041 - CBA - Hab. Crédito Trab - Favorável + Honorarios.pdf',
    type: 'manifestacao_honorarios',
    expectedType: 'Habilitação de Crédito'
  },
  {
    name: '1040464-06.2024.8.11.0041-1734122764279-4062496-processo.pdf',
    type: 'processo_completo',
    expectedType: 'documento'
  }
];

// Função para análise de documento (copiada do generate.ts)
function analyzeDocument(text) {
  const lowerText = text.toLowerCase();

  // Detect document type
  let type = 'documento';
  if (lowerText.includes('habilitação') && lowerText.includes('crédito')) {
    type = 'Habilitação de Crédito';
  } else if (lowerText.includes('falência')) {
    type = 'Processo Falimentar';
  } else if (lowerText.includes('recuperação judicial')) {
    type = 'Recuperação Judicial';
  }

  // Extract parties
  const partyRegex = /requerente[s]?:?\s*([^\n]+)/gi;
  const defendantRegex = /requerido[s]?:?\s*([^\n]+)/gi;
  const parties = [];

  let match;
  while ((match = partyRegex.exec(text)) !== null) {
    parties.push(`Requerente: ${match[1].trim()}`);
  }
  while ((match = defendantRegex.exec(text)) !== null) {
    parties.push(`Requerido: ${match[1].trim()}`);
  }

  // Extract monetary values
  const valueRegex = /R\$\s*([\d.,]+)/g;
  const values = [];
  while ((match = valueRegex.exec(text)) !== null) {
    values.push(`R$ ${match[1]}`);
  }

  // Extract dates
  const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/g;
  const dates = [];
  while ((match = dateRegex.exec(text)) !== null) {
    dates.push(match[0]);
  }

  return {
    type,
    parties: parties.slice(0, 5).join(', ') || 'Não identificadas',
    values: values.slice(0, 3).join(', ') || 'Não identificados',
    dates: dates.slice(0, 3).join(', ') || 'Não identificadas'
  };
}

console.log('🔬 INICIANDO ANÁLISE DETALHADA DO PIPELINE\\n');

// Processar cada arquivo
for (const fileInfo of testFiles) {
  console.log(`📄 ANALISANDO: ${fileInfo.name}`);
  console.log(`   Tipo: ${fileInfo.type}`);
  console.log(`   Esperado: ${fileInfo.expectedType}\\n`);

  const filePath = path.join(__dirname, 'test', 'data', fileInfo.name);
  
  try {
    // ETAPA 1: EXTRAÇÃO DE TEXTO
    console.log('🔍 ETAPA 1: Extração de Texto');
    const startExtraction = Date.now();
    
    const extractionResult = await extractTextFromPDF(filePath);
    
    const extractionTime = Date.now() - startExtraction;
    console.log(`   ✅ Método: ${extractionResult.method}`);
    console.log(`   ⏱️  Tempo: ${extractionTime}ms`);
    console.log(`   📊 Caracteres: ${extractionResult.text.length}`);
    console.log(`   📝 Palavras: ${extractionResult.text.split(/\s+/).length}`);
    
    // Salvar texto extraído para análise
    const textFileName = `extracted_${fileInfo.type}.txt`;
    fs.writeFileSync(textFileName, extractionResult.text, 'utf8');
    console.log(`   💾 Salvo em: ${textFileName}`);

    // ETAPA 2: ANÁLISE DE DOCUMENTO
    console.log('\\n📊 ETAPA 2: Análise de Documento');
    
    const documentAnalysis = analyzeDocument(extractionResult.text);
    
    console.log(`   📋 Tipo detectado: ${documentAnalysis.type}`);
    console.log(`   🏛️  Partes: ${documentAnalysis.parties}`);
    console.log(`   💰 Valores: ${documentAnalysis.values}`);
    console.log(`   📅 Datas: ${documentAnalysis.dates}`);
    
    // Verificar se detecção está correta
    const detectionCorrect = documentAnalysis.type === fileInfo.expectedType;
    console.log(`   ${detectionCorrect ? '✅' : '❌'} Detecção: ${detectionCorrect ? 'CORRETA' : 'INCORRETA'}`);

    // ETAPA 3: CHUNKING
    console.log('\\n✂️ ETAPA 3: Chunking Inteligente');
    const startChunking = Date.now();
    
    const chunkingResult = await processDocumentWithChunking(
      extractionResult.text, 
      documentAnalysis.type
    );
    
    const chunkingTime = Date.now() - startChunking;
    console.log(`   🎯 Estratégia: ${chunkingResult.strategy}`);
    console.log(`   📦 Total chunks: ${chunkingResult.chunks.length}`);
    console.log(`   🔥 Prioritizados: ${chunkingResult.prioritizedChunks.length}`);
    console.log(`   💸 Total tokens: ${chunkingResult.totalTokens}`);
    console.log(`   ⏱️  Tempo: ${chunkingTime}ms`);
    
    // Análise detalhada dos chunks
    if (chunkingResult.chunks.length > 0) {
      const priorities = chunkingResult.chunks.reduce((acc, chunk) => {
        acc[chunk.priority] = (acc[chunk.priority] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   📊 Por prioridade:`, priorities);
      
      const avgRelevance = chunkingResult.chunks.reduce((sum, chunk) => 
        sum + chunk.metadata.relevanceScore, 0) / chunkingResult.chunks.length;
      console.log(`   📈 Relevância média: ${avgRelevance.toFixed(3)}`);
    }

    // ETAPA 4: QUALIDADE (usando texto real)
    console.log('\\n✅ ETAPA 4: Validação de Qualidade (texto real)');
    
    const qualityResult = validateManifestationQuality(extractionResult.text);
    
    console.log(`   📊 Score: ${qualityResult.score}/10`);
    console.log(`   ${qualityResult.isAcceptable ? '✅' : '❌'} Aceitável: ${qualityResult.isAcceptable}`);
    console.log(`   ⚠️  Issues: ${qualityResult.issues.length}`);
    if (qualityResult.issues.length > 0) {
      qualityResult.issues.forEach(issue => console.log(`      - ${issue}`));
    }

    // Salvar relatório detalhado
    const report = {
      arquivo: fileInfo.name,
      tipo: fileInfo.type,
      extraction: {
        method: extractionResult.method,
        time: extractionTime,
        characters: extractionResult.text.length,
        words: extractionResult.text.split(/\s+/).length
      },
      analysis: documentAnalysis,
      detectionCorrect,
      chunking: {
        strategy: chunkingResult.strategy,
        totalChunks: chunkingResult.chunks.length,
        prioritizedChunks: chunkingResult.prioritizedChunks.length,
        totalTokens: chunkingResult.totalTokens,
        time: chunkingTime,
        priorities: chunkingResult.chunks.reduce((acc, chunk) => {
          acc[chunk.priority] = (acc[chunk.priority] || 0) + 1;
          return acc;
        }, {}),
        avgRelevance: chunkingResult.chunks.reduce((sum, chunk) => 
          sum + chunk.metadata.relevanceScore, 0) / chunkingResult.chunks.length
      },
      quality: qualityResult
    };

    fs.writeFileSync(`report_${fileInfo.type}.json`, JSON.stringify(report, null, 2));
    console.log(`   📄 Relatório salvo: report_${fileInfo.type}.json`);

  } catch (error) {
    console.log(`   ❌ ERRO: ${error.message}`);
  }

  console.log('\\n' + '='.repeat(80) + '\\n');
}

console.log('🎯 ANÁLISE DETALHADA CONCLUÍDA!');
console.log('📊 Relatórios salvos em: report_*.json');
console.log('📝 Textos extraídos em: extracted_*.txt');