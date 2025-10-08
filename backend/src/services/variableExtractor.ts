/**
 * Variable Extractor - Extrai variáveis do caso atual
 *
 * Mapeia informações da análise técnica para variáveis de templates
 */

import { UniversalAnalise } from '../agents/system/UniversalAnalista.js';
import { UniversalPlano } from '../agents/system/UniversalPlanejador.js';

export interface ContextVariables {
  // Partes
  habilitante?: string;
  habilitante_cpf?: string;
  devedor?: string;
  processo?: string;
  autor?: string;
  reu?: string;

  // Valores
  valor_principal?: string;
  valor_juros?: string;
  valor_correcao?: string;
  valor_total?: string;
  taxa_juros?: string;
  periodo_juros?: string;
  indice_correcao?: string;

  // Classificação
  tipo_credito?: string;
  tipo_recurso?: string;
  natureza_acao?: string;
  artigo_classificacao?: string;

  // Posicionamento
  posicionamento?: string;
  posicionamento_fundamentacao?: string;

  // Datas
  data_manifestacao?: string;
  data_fato?: string;
  local?: string;

  // Cálculos
  calculos_divergentes?: boolean;
  valor_divergencia?: string;
  valor_correto?: string;

  // Leis
  leis_aplicaveis?: string[];
  questoes_juridicas?: string[];

  // Pontos críticos
  pontos_criticos?: string[];
  problemas_identificados?: string[];

  [key: string]: any; // Permitir campos dinâmicos
}

export class VariableExtractor {

  /**
   * Extrair variáveis contextuais da análise e plano
   */
  static extrairVariaveis(
    analise: UniversalAnalise,
    plano?: UniversalPlano
  ): ContextVariables {
    const vars: ContextVariables = {};

    // ===== PARTES =====
    const partes = analise.partes || [];

    // Habilitante/Autor (primeiro da lista ou tipo específico)
    const habilitante = partes.find(p =>
      p.tipo?.toLowerCase().includes('habilitante') ||
      p.tipo?.toLowerCase().includes('autor') ||
      p.tipo?.toLowerCase().includes('credor')
    ) || partes[0];

    if (habilitante) {
      vars.habilitante = habilitante.nome;
      vars.habilitante_cpf = habilitante.cpfCnpj;
      vars.autor = habilitante.nome; // Alias
    }

    // Devedor/Réu
    const devedor = partes.find(p =>
      p.tipo?.toLowerCase().includes('devedor') ||
      p.tipo?.toLowerCase().includes('réu') ||
      p.tipo?.toLowerCase().includes('requerido')
    );

    if (devedor) {
      vars.devedor = devedor.nome;
      vars.reu = devedor.nome; // Alias
    }

    // Processo
    if (analise.datas?.processuais?.[0]) {
      // Tentar extrair número de processo da análise
      const processoMatch = JSON.stringify(analise).match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
      if (processoMatch) {
        vars.processo = processoMatch[0];
      }
    }

    // ===== VALORES =====
    if (analise.valores) {
      if (analise.valores.principal) {
        vars.valor_principal = this.formatarMoeda(analise.valores.principal);
      }

      if (analise.valores.juros) {
        vars.valor_juros = this.formatarMoeda(analise.valores.juros.valor);
        vars.taxa_juros = analise.valores.juros.taxa;
        vars.periodo_juros = analise.valores.juros.periodo;
      }

      if (analise.valores.correcao) {
        vars.valor_correcao = this.formatarMoeda(analise.valores.correcao.valor);
        vars.indice_correcao = analise.valores.correcao.indice;
      }

      if (analise.valores.total) {
        const total = analise.valores.total;
        vars.valor_total = this.formatarMoeda(total.calculado || total.apresentado);

        // Divergência
        if (total.correto === false && total.apresentado && total.calculado) {
          vars.calculos_divergentes = true;
          vars.valor_divergencia = this.formatarMoeda(Math.abs(total.apresentado - total.calculado));
          vars.valor_correto = this.formatarMoeda(total.calculado);
        } else {
          vars.calculos_divergentes = false;
        }
      }
    }

    // ===== CLASSIFICAÇÕES =====
    if (analise.classificacoes) {
      vars.tipo_credito = analise.classificacoes.tipoCredito;
      vars.tipo_recurso = analise.classificacoes.tipoRecurso;
      vars.natureza_acao = analise.classificacoes.naturezaAcao;
    }

    // Artigo de classificação
    const artigoMatch = JSON.stringify(analise).match(/art\.\s*\d+,\s*\w+/i);
    if (artigoMatch) {
      vars.artigo_classificacao = artigoMatch[0];
    }

    // ===== POSICIONAMENTO (do plano) =====
    if (plano?.posicionamento) {
      vars.posicionamento = plano.posicionamento.tipo;
      vars.posicionamento_fundamentacao = plano.posicionamento.fundamentacao;
    }

    // ===== DATAS =====
    vars.data_manifestacao = this.formatarData(new Date());
    vars.local = 'Cuiabá-MT'; // Default - pode ser configurável

    if (analise.datas?.fatos?.[0]) {
      vars.data_fato = analise.datas.fatos[0];
    }

    // ===== LEIS E QUESTÕES =====
    vars.leis_aplicaveis = analise.fundamentosLegais || [];
    vars.questoes_juridicas = analise.questoesJuridicas || [];

    // ===== PONTOS DE ATENÇÃO =====
    vars.pontos_criticos = (analise.pontosAtencao || []).filter(p =>
      p.toUpperCase().includes('CRÍTICO')
    );
    vars.problemas_identificados = analise.pontosAtencao || [];

    return vars;
  }

  /**
   * Formatar valor monetário
   */
  private static formatarMoeda(valor?: number): string {
    if (valor === undefined || valor === null) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Formatar data
   */
  private static formatarData(data: Date): string {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Substituir variáveis em um template
   */
  static substituirVariaveis(template: string, variaveis: ContextVariables): string {
    let resultado = template;

    // Substituir cada variável {{nome}} pelo valor
    Object.keys(variaveis).forEach(key => {
      const valor = variaveis[key];

      if (valor !== undefined && valor !== null) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');

        if (typeof valor === 'string') {
          resultado = resultado.replace(regex, valor);
        } else if (Array.isArray(valor)) {
          resultado = resultado.replace(regex, valor.join(', '));
        } else if (typeof valor === 'boolean') {
          resultado = resultado.replace(regex, valor ? 'sim' : 'não');
        } else {
          resultado = resultado.replace(regex, String(valor));
        }
      }
    });

    // Remover variáveis não substituídas (deixar vazias ou placeholder)
    resultado = resultado.replace(/\{\{[^}]+\}\}/g, '[VARIÁVEL NÃO DISPONÍVEL]');

    return resultado;
  }

  /**
   * Validar se template tem todas as variáveis disponíveis
   */
  static validarTemplate(template: string, variaveis: ContextVariables): {
    valid: boolean;
    missingVars: string[];
    availableVars: string[];
  } {
    const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
    const requiredVars = matches.map(m => m.replace(/\{\{|\}\}/g, ''));
    const availableVars = Object.keys(variaveis).filter(k => variaveis[k] !== undefined);
    const missingVars = requiredVars.filter(v => !availableVars.includes(v));

    return {
      valid: missingVars.length === 0,
      missingVars,
      availableVars
    };
  }
}
