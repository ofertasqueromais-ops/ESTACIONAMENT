// Default pricing config
const PRECO_HORA_DEFAULT = 4;
const VALOR_MAXIMO_DEFAULT = 20;
const TOLERANCIA_MINUTOS_DEFAULT = 5;

export interface PricingConfig {
  intervalo_cobranca?: string; // '15min' | '30min' | '1hora'
  tolerancia_minutos?: number;
  valor_hora?: number;
  valor_maximo?: number;
  valor_intervalo?: number;
  tipo_cobranca?: string;
  valor_15_min?: number;
  valor_30_min?: number;
  valor_60_min?: number;
  valor_hora_adicional?: number;
}

export function calcularValor(tipo: string, entrada: Date, saida: Date, config?: PricingConfig): number {
  const valorIntervalo = config?.valor_intervalo ?? config?.valor_hora ?? PRECO_HORA_DEFAULT;
  const valorMaximo = config?.valor_maximo ?? VALOR_MAXIMO_DEFAULT;
  const tolerancia = config?.tolerancia_minutos ?? TOLERANCIA_MINUTOS_DEFAULT;
  const intervalo = config?.intervalo_cobranca ?? '1hora';

  const diffMs = saida.getTime() - entrada.getTime();
  const diffMinutos = diffMs / (1000 * 60);

  // Tolerância configurável
  if (diffMinutos <= tolerancia) return 0;

  // Lógica Progressiva Tabela de Preços
  if (config?.tipo_cobranca === 'progressivo') {
    if (diffMinutos <= 15) return Number(Math.min(config.valor_15_min || 0, valorMaximo).toFixed(2));
    if (diffMinutos <= 30) return Number(Math.min(config.valor_30_min || 0, valorMaximo).toFixed(2));
    if (diffMinutos <= 60) return Number(Math.min(config.valor_60_min || 0, valorMaximo).toFixed(2));

    // Mais de 1h
    const horasExtras = Math.ceil((diffMinutos - 60) / 60);
    const valorAdicional = horasExtras * (config.valor_hora_adicional || 0);
    const valorTotal = (config.valor_60_min || 0) + valorAdicional;

    return Number(Math.min(valorTotal, valorMaximo).toFixed(2));
  }

  // Lógica Clássica Intervalo (Fixo)
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Conta quantos intervalos foram usados
  let intervalos: number;
  if (intervalo === '15min') {
    intervalos = Math.max(1, Math.ceil(diffMinutos / 15));
  } else if (intervalo === '30min') {
    intervalos = Math.max(1, Math.ceil(diffMinutos / 30));
  } else {
    intervalos = Math.max(1, Math.ceil(diffHours));
  }
  
  const valorCalculado = intervalos * valorIntervalo;
  
  // Máximo configurável
  return Number(Math.min(valorCalculado, valorMaximo).toFixed(2));
}

export function formatarTempo(entrada: Date, saida: Date): string {
  const diffMs = saida.getTime() - entrada.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
}

export function formatarPlaca(placa: string): string {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}

export function gerarComprovante(dados: {
  placa: string;
  tipo: string;
  entrada: string;
  saida: string;
  tempo: string;
  valor: string;
  formaPagamento: string;
  mensalista: boolean;
}): string {
  const linhas = [
    '🅿️ PEREIRA ESTACIONAMENTO',
    '📞 (37) 99806-1725',
    '================================',
    `Placa: ${dados.placa}`,
    `Tipo: ${dados.tipo === 'carro' ? '🚗 Carro' : '🏍️ Moto'}`,
    `Entrada: ${dados.entrada}`,
    `Saída: ${dados.saida}`,
    `Tempo: ${dados.tempo}`,
    dados.mensalista ? '✅ Mensalista - Sem cobrança' : `Valor: ${dados.valor}`,
    !dados.mensalista ? `Pagamento: ${dados.formaPagamento}` : '',
    '================================',
    `Data: ${new Date().toLocaleString('pt-BR')}`,
  ].filter(Boolean);
  
  return linhas.join('\n');
}
