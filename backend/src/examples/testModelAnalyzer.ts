/**
 * TESTE DO MODEL ANALYZER
 * 
 * Script para demonstrar o funcionamento do sistema de análise de modelos
 * usando os documentos exemplares existentes.
 */

import { ModelAnalyzer } from '../services/modelAnalyzer.js';
import fs from 'fs/promises';
import path from 'path';

async function testModelAnalyzer() {
  console.log('🚀 INICIANDO TESTE DO MODEL ANALYZER\n');
  console.log('=' .repeat(70));
  
  const analyzer = new ModelAnalyzer();
  
  // Caminhos dos modelos existentes
  const modelFiles = [
    'extracted_manifestacao_intimacao.txt',
    'extracted_manifestacao_favoravel.txt',
    'extracted_manifestacao_honorarios.txt'
  ];
  
  try {
    // Ler os arquivos
    console.log('\n📂 Carregando modelos...\n');
    const models: string[] = [];
    
    for (const fileName of modelFiles) {
      const filePath = path.join(process.cwd(), fileName);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        models.push(content);
        console.log(`✅ ${fileName} carregado (${content.length} caracteres)`);
      } catch (error) {
        console.log(`❌ Erro ao carregar ${fileName}:`, error);
      }
    }
    
    if (models.length === 0) {
      console.log('\n❌ Nenhum modelo encontrado!');
      return;
    }
    
    console.log(`\n✅ ${models.length} modelos carregados com sucesso!\n`);
    console.log('=' .repeat(70));
    
    // Analisar modelos
    console.log('\n🔬 ANALISANDO MODELOS...\n');
    const { analyses, patterns } = await analyzer.analyzeMultipleModels(models, modelFiles);
    
    // Exibir resultados
    console.log('\n' + '=' .repeat(70));
    console.log('📊 RESULTADOS DA ANÁLISE\n');
    
    // 1. Análises individuais
    console.log('1️⃣  ANÁLISE INDIVIDUAL DOS MODELOS:\n');
    for (const analysis of analyses) {
      console.log(`📄 ${analysis.fileName}`);
      console.log(`   Palavras: ${analysis.wordCount}`);
      console.log(`   Qualidade: ${analysis.qualityScore.toFixed(1)}/10`);
      console.log(`   Seções: ${analysis.structure.sections.length}`);
      console.log(`   Citações legais: ${analysis.legalCitations.length}`);
      console.log(`   Entidades: ${analysis.entities.total}`);
      console.log(`   Formalidade: ${analysis.style.formalityScore.toFixed(1)}/10`);
      console.log(`   Tecnicidade: ${analysis.style.technicalityScore.toFixed(1)}/10\n`);
    }
    
    // 2. Padrões comuns
    console.log('=' .repeat(70));
    console.log('\n2️⃣  PADRÕES COMUNS IDENTIFICADOS:\n');
    
    // Seções essenciais
    const essentialSections = patterns.sections.filter(s => s.isEssential);
    console.log(`🏗️  SEÇÕES ESSENCIAIS (aparecem em 100% dos modelos):`);
    if (essentialSections.length > 0) {
      essentialSections.forEach(section => {
        console.log(`   ✓ ${section.name}`);
        console.log(`     Posição média: ${(section.avgPosition * 100).toFixed(0)}% do documento`);
        console.log(`     Comprimento médio: ${Math.round(section.avgLength)} palavras\n`);
      });
    } else {
      console.log('   (Nenhuma seção aparece em 100% dos modelos)\n');
    }
    
    // Seções frequentes
    const frequentSections = patterns.sections.filter(s => !s.isEssential && s.frequency >= 0.6);
    console.log(`📋 SEÇÕES FREQUENTES (aparecem em 60%+ dos modelos):`);
    frequentSections.slice(0, 5).forEach(section => {
      console.log(`   ✓ ${section.name} (${(section.frequency * 100).toFixed(0)}%)`);
    });
    
    // Frases de abertura
    console.log(`\n💬 FRASES DE ABERTURA TÍPICAS:`);
    patterns.phrases.opening.slice(0, 3).forEach(p => {
      console.log(`   "${p.phrase.substring(0, 80)}..." (${p.frequency}x)`);
    });
    
    // Frases de fechamento
    console.log(`\n🏁 FRASES DE FECHAMENTO TÍPICAS:`);
    patterns.phrases.closing.slice(0, 3).forEach(p => {
      console.log(`   "${p.phrase.substring(0, 80)}..." (${p.frequency}x)`);
    });
    
    // Citações legais mais comuns
    console.log(`\n⚖️  CITAÇÕES LEGAIS MAIS COMUNS:`);
    patterns.citations.slice(0, 5).forEach(citation => {
      console.log(`   ${citation.text} (${citation.count}x)`);
    });
    
    // 3. Estilo médio
    console.log('\n' + '=' .repeat(70));
    console.log('\n3️⃣  ESTILO MÉDIO DOS MODELOS:\n');
    console.log(`   Formalidade: ${patterns.style.formality.toFixed(1)}/10`);
    console.log(`   Tecnicidade: ${patterns.style.technicalLevel.toFixed(1)}/10`);
    console.log(`   Densidade de informação: ${patterns.style.infoDensity.toFixed(4)}`);
    console.log(`   Comprimento médio: ${patterns.style.avgWordCount} palavras`);
    console.log(`   Sentença média: ${patterns.style.avgSentenceLength.toFixed(1)} palavras`);
    
    // 4. Vocabulário
    console.log('\n' + '=' .repeat(70));
    console.log('\n4️⃣  VOCABULÁRIO IDENTIFICADO:\n');
    
    console.log(`📝 PALAVRAS MAIS COMUNS (top 10):`);
    patterns.vocabulary.commonWords.slice(0, 10).forEach((w, i) => {
      console.log(`   ${i + 1}. ${w.word} (${w.count}x)`);
    });
    
    console.log(`\n🎓 TERMOS TÉCNICOS (top 10):`);
    patterns.vocabulary.technicalTerms.slice(0, 10).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.term} (${t.count}x)`);
    });
    
    console.log(`\n🔗 VERBOS JURÍDICOS TÍPICOS:`);
    patterns.vocabulary.legalVerbs.forEach(verb => {
      console.log(`   ✓ ${verb}`);
    });
    
    console.log(`\n🔄 CONECTIVOS TÍPICOS:`);
    patterns.vocabulary.connectives.forEach(conn => {
      console.log(`   ✓ "${conn}"`);
    });
    
    // 5. Resumo final
    console.log('\n' + '=' .repeat(70));
    console.log('\n✅ RESUMO FINAL:\n');
    console.log(`   Modelos analisados: ${analyses.length}`);
    console.log(`   Qualidade média: ${(analyses.reduce((s, a) => s + a.qualityScore, 0) / analyses.length).toFixed(1)}/10`);
    console.log(`   Seções comuns identificadas: ${patterns.sections.length}`);
    console.log(`   Frases-padrão encontradas: ${patterns.phrases.opening.length + patterns.phrases.closing.length + patterns.phrases.transition.length}`);
    console.log(`   Citações legais únicas: ${patterns.citations.length}`);
    console.log(`   Vocabulário técnico: ${patterns.vocabulary.technicalTerms.length} termos`);
    
    console.log('\n' + '=' .repeat(70));
    console.log('\n🎉 ANÁLISE CONCLUÍDA COM SUCESSO!\n');
    
    // Salvar resultados em JSON para inspeção
    const outputPath = path.join(process.cwd(), 'model_analysis_results.json');
    await fs.writeFile(outputPath, JSON.stringify({ analyses, patterns }, null, 2));
    console.log(`📁 Resultados salvos em: ${outputPath}\n`);
    
  } catch (error) {
    console.error('\n❌ Erro durante análise:', error);
  }
}

// Executar teste
testModelAnalyzer().catch(console.error);
