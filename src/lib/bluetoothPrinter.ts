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
    // Remove diacritics and special characters to ensure compatibility with generic thermal printers
    const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (let i = 0; i < normalized.length; i++) {
      const charCode = normalized.charCodeAt(i);
      // Map basic emoji or unknown to standard ascii if needed, but for now we just filter out non-ascii
      if (charCode >= 32 && charCode <= 126) {
        this.buffer.push(charCode);
      } else if (charCode === 10) { // newline
        this.buffer.push(10);
      } else {
        // Fallback for emojis or other chars: could be a question mark or ignored.
        // Let's use a dash or space
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
          '0000fee7-0000-1000-8000-00805f9b34fb'
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
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              foundCharacteristic = char;
              break;
            }
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
      if (this.characteristic.properties.writeWithoutResponse) {
         try {
           await this.characteristic.writeValueWithoutResponse(chunk);
         } catch (e) {
           await this.characteristic.writeValue(chunk); // Fallback
         }
      } else {
         await this.characteristic.writeValue(chunk);
      }
      // Small delay between chunks to avoid overwhelming the printer buffer
      await new Promise(resolve => setTimeout(resolve, 50));
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
    encoder.alignCenter().bold(true).size(1, 1).line(estacionamento.nome.toUpperCase());
    encoder.bold(false).size(1, 1);
    
    if (estacionamento.cnpj) encoder.line(`CNPJ: ${estacionamento.cnpj}`);
    if (estacionamento.endereco) encoder.line(estacionamento.endereco);
    if (estacionamento.telefone) encoder.line(`Tel: ${estacionamento.telefone}`);
    
    encoder.newline();
    encoder.alignCenter().line('================================');
    encoder.bold(true).line('RECIBO DE ESTACIONAMENTO');
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
    encoder.line(`SAIDA:   ${veiculo.saida}`);
    encoder.line(`TEMPO:   ${veiculo.tempo}`);
    
    encoder.newline();
    encoder.alignCenter().line('--------------------------------');
    encoder.alignLeft();

    if (veiculo.mensalista) {
      encoder.bold(true).line('MENSALISTA - SEM COBRANCA').bold(false);
    } else {
      encoder.bold(true).size(2, 2).line(`TOTAL: ${veiculo.valor}`).size(1, 1).bold(false);
      if (veiculo.formaPagamento) {
        encoder.line(`PAGAMENTO: ${veiculo.formaPagamento.toUpperCase()}`);
      }
    }

    encoder.newline();
    encoder.alignCenter().line('================================');
    encoder.line('OBRIGADO PELA PREFERENCIA!');
    
    // Feed and finish
    encoder.feed(4);

    const buffer = encoder.encode();
    await this.writeInChunks(buffer);
  }
}

// Export a singleton instance for global use across components
export const bluetoothPrinter = new BluetoothPrinter();
