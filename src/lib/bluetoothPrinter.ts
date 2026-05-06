class EscPosEncoder {
  private buffer: number[] = [];
  private readonly MAX_CHARS = 32; // 58mm printer has 32 characters per line

  initialize() {
    // Retirado comando de inicialização complexo
    return this;
  }

  alignCenter() { return this; }
  alignLeft() { return this; }
  bold(on: boolean) { return this; }
  size(width: number, height: number) { return this; }

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

  centerLine(str: string) {
    const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (normalized.length >= this.MAX_CHARS) {
      return this.line(normalized.substring(0, this.MAX_CHARS));
    }
    const padding = Math.floor((this.MAX_CHARS - normalized.length) / 2);
    const paddedStr = " ".repeat(padding) + normalized;
    return this.line(paddedStr);
  }

  newline() {
    this.buffer.push(0x0A); // Apenas LF
    return this;
  }

  feed(lines = 3) {
    for(let i=0; i<lines; i++) {
      this.newline();
    }
    return this;
  }

  encode() {
    return new Uint8Array(this.buffer);
  }
}

type Listener = (connected: boolean) => void;

export class BluetoothPrinter {
  private device: any = null;
  private server: any = null;
  private characteristic: any = null;
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const status = this.isConnected();
    this.listeners.forEach(l => l(status));
  }

  async connect(): Promise<boolean> {
    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Seu navegador não suporta a Web Bluetooth API.");
      }

      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000fee7-0000-1000-8000-00805f9b34fb',
          '0000ff00-0000-1000-8000-00805f9b34fb',
          '0000af30-0000-1000-8000-00805f9b34fb'
        ]
      });

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      this.server = await this.device.gatt.connect();

      const services = await this.server.getPrimaryServices();
      
      let foundCharacteristic = null;
      
      for (const service of services) {
        // Ignora serviços genéricos do Bluetooth que podem ter características graváveis,
        // mas não são a impressora em si.
        const uuid = service.uuid.toLowerCase();
        if (
          uuid.startsWith('00001800') || // Generic Access
          uuid.startsWith('00001801') || // Generic Attribute
          uuid.startsWith('0000180a') || // Device Information
          uuid.startsWith('0000180f')    // Battery Service
        ) {
          continue;
        }

        try {
          const characteristics = await service.getCharacteristics();
          // Prioritize characteristic that supports 'write' (with response) for better flow control
          let fallbackChar = null;
          
          for (const char of characteristics) {
            if (char.properties.write) {
              foundCharacteristic = char;
              break;
            } else if (char.properties.writeWithoutResponse) {
              fallbackChar = char;
            }
          }
          if (!foundCharacteristic && fallbackChar) {
            foundCharacteristic = fallbackChar;
          }
        } catch (e) {
          console.warn("Não foi possível ler características do serviço", uuid, e);
        }
        
        if (foundCharacteristic) break;
      }

      if (foundCharacteristic) {
        this.characteristic = foundCharacteristic;
        this.notify();
        return true;
      }

      throw new Error("Nenhuma característica de escrita suportada encontrada no dispositivo.");
    } catch (err) {
      console.error("Bluetooth connection error:", err);
      this.disconnect();
      throw err;
    }
  }

  private onDisconnected() {
    console.log("Impressora desconectada");
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.notify();
  }

  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.onDisconnected();
  }

  isConnected(): boolean {
    return !!(this.device && this.device.gatt.connected && this.characteristic);
  }

  private async writeInChunks(data: Uint8Array) {
    // BLE typical MTU payload limit is 20 bytes for standard BLE 4.0
    const CHUNK_SIZE = 20; 
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (this.characteristic.properties.write) {
         await this.characteristic.writeValue(chunk);
      } else if (this.characteristic.properties.writeWithoutResponse) {
         await this.characteristic.writeValueWithoutResponse(chunk);
         // Fixed delay when flow control is absent to prevent buffer overruns
         await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  async printReceipt(dados: {
    estacionamento: { nome: string; cnpj?: string | null; endereco?: string | null; telefone?: string | null };
    veiculo: {
      placa: string;
      tipo: string;
      entrada: string;
      saida: string;
      tempo: string;
      valor: string;
      formaPagamento: string;
      mensalista: boolean;
      marca?: string | null;
      modelo?: string | null;
    };
  }) {
    if (!this.isConnected()) {
      throw new Error("Impressora não conectada.");
    }

    const { estacionamento, veiculo } = dados;

    const encoder = new EscPosEncoder();
    encoder.initialize();

    // Header
    encoder.centerLine(estacionamento.nome.toUpperCase());
    
    if (estacionamento.cnpj) encoder.centerLine(`CNPJ: ${estacionamento.cnpj}`);
    if (estacionamento.endereco) encoder.centerLine(estacionamento.endereco);
    if (estacionamento.telefone) encoder.centerLine(`Tel: ${estacionamento.telefone}`);
    
    encoder.newline();
    encoder.centerLine('================================');
    encoder.centerLine('RECIBO DE ESTACIONAMENTO');
    encoder.centerLine('================================');
    encoder.newline();

    // Body
    encoder.line(`PLACA: ${veiculo.placa.toUpperCase()}`);
    if (veiculo.marca || veiculo.modelo) {
      encoder.line(`VEICULO: ${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim());
    }
    encoder.line(`TIPO: ${veiculo.tipo === 'carro' ? 'CARRO' : 'MOTO'}`);
    
    encoder.newline();
    encoder.line(`ENTRADA: ${veiculo.entrada}`);
    encoder.line(`SAIDA:   ${veiculo.saida}`);
    encoder.line(`TEMPO:   ${veiculo.tempo}`);
    
    encoder.newline();
    encoder.centerLine('--------------------------------');

    if (veiculo.mensalista) {
      encoder.line('MENSALISTA - SEM COBRANCA');
    } else {
      encoder.line(`TOTAL: ${veiculo.valor}`);
      if (veiculo.formaPagamento) {
        encoder.line(`PAGAMENTO: ${veiculo.formaPagamento.toUpperCase()}`);
      }
    }

    encoder.newline();
    encoder.centerLine('================================');
    encoder.centerLine('OBRIGADO PELA PREFERENCIA!');
    
    // Feed and finish
    encoder.feed(4);

    const buffer = encoder.encode();
    await this.writeInChunks(buffer);
  }
}

// Export a singleton instance for global use across components
export const bluetoothPrinter = new BluetoothPrinter();
