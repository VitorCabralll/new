import { validateManifestationQuality } from './dist/services/qualityValidator.js';

// Teste de texto de alta qualidade
const textoAltaQualidade = `
Sede das Promotorias de Justiça da Capital
Av. Desembargador Milton Figueiredo Ferreira Mendes, s/nº
Setor D - Centro Político e Administrativo - Cuiabá/MT
CEP: 78049-928

MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO
20ª Promotoria de Justiça Cível de Cuiabá/MT

VARA: PRIMEIRA VARA CÍVEL ESPECIALIZADA EM RECUPERAÇÃO JUDICIAL E
FALÊNCIA DE CUIABÁ/MT
NÚMERO ÚNICO: 1016035-72.2024.8.11.0041 – PJE

Meritíssimo Juiz:

Trata-se de Habilitação de Crédito proposta em face da empresa recuperanda.

O MINISTÉRIO PÚBLICO DO ESTADO DE MATO GROSSO manifesta-se pela procedência do pedido.

Cuiabá/MT, 07 de outubro de 2025.

(assinado eletronicamente)
PROMOTOR DE JUSTIÇA
`;

// Teste de texto de baixa qualidade
const textoBaixaQualidade = `
Este é um texto simples sem formatação adequada.
Não contém seções obrigatórias.
Todo mundo deveria fazer isso.
Não há assinatura adequada.
`;

console.log('🔍 TESTE DO SISTEMA DE VALIDAÇÃO DE QUALIDADE\\n');

// Teste 1: Texto de alta qualidade
console.log('📊 TESTE 1: Texto de alta qualidade');
const resultado1 = validateManifestationQuality(textoAltaQualidade);
console.log(`Score: ${resultado1.score}/10`);
console.log(`Aceitável: ${resultado1.isAcceptable}`);
console.log(`Issues: ${resultado1.issues.length}`);
if (resultado1.issues.length > 0) {
  resultado1.issues.forEach(issue => console.log(`  - ${issue}`));
}
console.log('\\n' + '='.repeat(50) + '\\n');

// Teste 2: Texto de baixa qualidade
console.log('📊 TESTE 2: Texto de baixa qualidade');
const resultado2 = validateManifestationQuality(textoBaixaQualidade);
console.log(`Score: ${resultado2.score}/10`);
console.log(`Aceitável: ${resultado2.isAcceptable}`);
console.log(`Issues: ${resultado2.issues.length}`);
if (resultado2.issues.length > 0) {
  resultado2.issues.forEach(issue => console.log(`  - ${issue}`));
}
console.log('\\n' + '='.repeat(50) + '\\n');

// Comparação dos resultados
console.log('📈 COMPARAÇÃO DOS RESULTADOS');
console.log(`Diferença de score: ${resultado1.score - resultado2.score} pontos`);
console.log(`Melhoria de ${((resultado1.score / resultado2.score - 1) * 100).toFixed(1)}%`);

console.log('\\n✅ Teste concluído!');