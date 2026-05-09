class EscPosEncoder {
  private buffer: number[] = [];

  initialize() {
    this.buffer.push(0x1B, 0x40); // ESC @
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00); // ESC a 0
    return this;
  }

  bold(on: boolean) {
    this.buffer.push(0x1B, 0x45, on ? 1 : 0); // ESC E n
    return this;
  }

  size(width: number, height: number) {
    const n = ((width - 1) << 4) | (height - 1);
    this.buffer.push(0x1D, 0x21, n); // GS ! n
    return this;
  }

  text(str: string) {
    const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      if (charCode >= 32 && charCode <= 126) {
        this.buffer.push(charCode);
      } else if (charCode === 10) { 
        this.buffer.push(10);
      } else {
        this.buffer.push(32); 
      }
    }
    return this;
  }

  line(str: string) {
    this.text(str);
    this.newline();
    return this;
  }

  newline() {
    this.buffer.push(0x0A);
    return this;
  }

  feed(lines = 3) {
    this.buffer.push(0x1B, 0x64, lines); // ESC d n
    return this;
  }

  encode() {
    return new Uint8Array(this.buffer);
  }
}

function bufferToBase64(buffer: Uint8Array) {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return window.btoa(binary);
}

type Listener = (connected: boolean) => void;

export class BluetoothPrinter {
  private isRawBTEnabled = localStorage.getItem('rawbt_enabled') === 'true';
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l(this.isConnected()));
  }

  async connect(): Promise<boolean> {
    // Para integração RawBT, apenas habilitamos a flag e salvamos no storage
    this.isRawBTEnabled = true;
    localStorage.setItem('rawbt_enabled', 'true');
    this.notify();
    return true;
  }

  disconnect() {
    this.isRawBTEnabled = false;
    localStorage.removeItem('rawbt_enabled');
    this.notify();
  }

  isConnected(): boolean {
    return this.isRawBTEnabled;
  }

  async printReceipt(dados: {
    tipoRecibo?: 'entrada' | 'saida';
    estacionamento: { nome: string; cnpj?: string | null; endereco?: string | null; telefone?: string | null };
    veiculo: {
      placa: string;
      tipo: string;
      entrada: string;
      saida?: string;
      tempo?: string;
      valor?: string;
      formaPagamento?: string;
      mensalista?: boolean;
      marca?: string | null;
      modelo?: string | null;
      servicos?: { nome: string; valor: number }[];
    };
  }) {
    if (!this.isConnected()) {
      throw new Error("Impressora não conectada.");
    }

    const { estacionamento, veiculo, tipoRecibo = 'saida' } = dados;
    const isEntrada = tipoRecibo === 'entrada';

    const encoder = new EscPosEncoder();
    encoder.initialize();

    // Header
    encoder.alignCenter().bold(true).size(1, 1).line(estacionamento.nome.toUpperCase());
    encoder.bold(false).size(1, 1);
    
    if (estacionamento.cnpj) encoder.line(`CNPJ: ${estacionamento.cnpj}`);
    if (estacionamento.endereco) encoder.line(estacionamento.endereco);
    if (estacionamento.telefone) encoder.line(`Tel: ${estacionamento.telefone}`);
    
    encoder.newline();
    encoder.alignCenter().line('================================');
    encoder.bold(true).line(isEntrada ? 'COMPROVANTE DE ENTRADA' : 'RECIBO DE SAIDA');
    encoder.bold(false).line('================================');
    encoder.newline();

    // Body
    encoder.alignLeft();
    encoder.line(`PLACA: ${veiculo.placa.toUpperCase()}`);
    if (veiculo.marca || veiculo.modelo) {
      encoder.line(`VEICULO: ${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim());
    }
    encoder.line(`TIPO: ${veiculo.tipo === 'carro' ? 'CARRO' : 'MOTO'}`);
    
    encoder.newline();
    encoder.line(`ENTRADA: ${veiculo.entrada}`);
    
    if (!isEntrada) {
      encoder.line(`SAIDA:   ${veiculo.saida}`);
      encoder.line(`TEMPO:   ${veiculo.tempo}`);
      
      encoder.newline();
      encoder.alignCenter().line('--------------------------------');
      encoder.alignLeft();

      if (veiculo.servicos && veiculo.servicos.length > 0) {
        encoder.alignCenter().line('SERVICOS').alignLeft();
        veiculo.servicos.forEach(s => {
          encoder.line(`${s.nome}: R$ ${s.valor.toFixed(2).replace('.', ',')}`);
        });
        encoder.alignCenter().line('--------------------------------');
        encoder.alignLeft();
      }

      if (veiculo.mensalista && (!veiculo.servicos || veiculo.servicos.length === 0)) {
        encoder.bold(true).line('MENSALISTA - SEM COBRANCA').bold(false);
      } else {
        encoder.bold(true).size(2, 2).line(`TOTAL: ${veiculo.valor}`).size(1, 1).bold(false);
        if (veiculo.formaPagamento) {
          encoder.line(`PAGAMENTO: ${veiculo.formaPagamento.toUpperCase()}`);
        }
      }
    } else {
      encoder.newline();
      encoder.alignCenter().line('--------------------------------');
      encoder.alignCenter();
      encoder.bold(true).line('GUARDE ESTE COMPROVANTE');
      encoder.bold(false).line('Apresente na saida do veiculo');
    }

    encoder.newline();
    encoder.alignCenter().line('================================');
    encoder.line('OBRIGADO PELA PREFERENCIA!');
    
    // Feed and finish
    encoder.feed(4);

    const buffer = encoder.encode();
    const base64Data = bufferToBase64(buffer);
    
    // Dispara a Intent do RawBT no Android
    const intentUrl = `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end`;
    window.location.href = intentUrl;
  }
}

// Export a singleton instance for global use across components
export const bluetoothPrinter = new BluetoothPrinter();
