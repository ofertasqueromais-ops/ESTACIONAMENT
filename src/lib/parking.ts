// Pricing config
const PRECO_HORA_CARRO = 10;
const PRECO_HORA_MOTO = 5;

export function calcularValor(tipo: string, entrada: Date, saida: Date): number {
  const diffMs = saida.getTime() - entrada.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Mínimo 1 hora
  const horasCobradas = Math.max(1, Math.ceil(diffHours * 2) / 2); // arredonda para cima em 30min
  
  const precoHora = tipo === 'moto' ? PRECO_HORA_MOTO : PRECO_HORA_CARRO;
  return Number((horasCobradas * precoHora).toFixed(2));
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
    '🅿️ COMPROVANTE DE ESTACIONAMENTO',
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
