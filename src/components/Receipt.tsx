import React from 'react';
import { formatarMoeda } from '@/lib/parking';

interface ReceiptProps {
  estacionamento: {
    nome: string;
    cnpj?: string | null;
    endereco?: string | null;
    telefone?: string | null;
    horario_funcionamento?: string | null;
  };
  veiculo: {
    id: string;
    placa: string;
    marca?: string | null;
    modelo?: string | null;
    entrada: string;
    saida?: string | null;
    tempo: string;
    valor: number;
    formaPagamento?: string;
    mensalista?: boolean;
  };
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ estacionamento, veiculo }, ref) => {
  const ticketId = veiculo.id.split('-')[0].toUpperCase();
  const dataEntrada = new Date(veiculo.entrada).toLocaleString('pt-BR');
  const dataSaida = veiculo.saida ? new Date(veiculo.saida).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
  
  return (
    <div ref={ref} className="receipt-container p-6 bg-white text-[#4A4A6A] font-mono text-sm max-w-[350px] mx-auto shadow-lg relative print:shadow-none print:p-0">
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-xl font-bold uppercase leading-tight">{estacionamento.nome}</h2>
        {estacionamento.cnpj && <p className="text-xs">{estacionamento.cnpj}</p>}
        {estacionamento.endereco && <p className="text-xs uppercase">{estacionamento.endereco}</p>}
        {estacionamento.telefone && <p className="text-xs">{estacionamento.telefone}</p>}
        {estacionamento.horario_funcionamento && <p className="text-xs">{estacionamento.horario_funcionamento}</p>}
      </div>

      <div className="text-center border-y-2 border-dashed border-gray-300 py-2 mb-4">
        <h3 className="text-lg font-bold tracking-[0.2em] uppercase">RECIBO</h3>
      </div>

      <div className="space-y-1 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-bold">Ticket</span>
          <span>{ticketId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold">Placa</span>
          <span className="font-bold tracking-wider">{veiculo.placa}</span>
        </div>
        {veiculo.marca && (
          <div className="flex justify-between items-center">
            <span className="font-bold">Marca</span>
            <span>{veiculo.marca}</span>
          </div>
        )}
        {veiculo.modelo && (
          <div className="flex justify-between items-center">
            <span className="font-bold">Modelo</span>
            <span>{veiculo.modelo}</span>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs uppercase">Entrada</span>
            <span className="text-xs">{dataEntrada}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs uppercase">Saída</span>
            <span className="text-xs">{dataSaida}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs uppercase">Permanência</span>
            <span>{veiculo.tempo}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs uppercase">Tabela de preço</span>
            <span className="text-xs">Periodo Integral</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-xs uppercase">Forma de pagamento</span>
            <span className="capitalize">{veiculo.formaPagamento || 'Dinheiro'}</span>
          </div>
          <div className="flex justify-between items-center text-lg mt-2 pt-2 border-t-2 border-dashed border-gray-200">
            <span className="font-bold">Total</span>
            <span className="font-bold">{veiculo.mensalista ? 'GRÁTIS' : formatarMoeda(veiculo.valor)}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-[10px] text-gray-500 mt-8 mb-4 italic">
        Agradecemos a preferência!
      </div>

      {/* Serrated edge simulation */}
      <div className="absolute left-0 right-0 bottom-0 h-4 overflow-hidden pointer-events-none print:hidden">
        <div 
          className="w-full h-8 flex" 
          style={{ 
            backgroundImage: `linear-gradient(135deg, white 25%, transparent 25%), linear-gradient(225deg, white 25%, transparent 25%)`,
            backgroundSize: '16px 16px',
            backgroundPosition: '0 bottom',
            backgroundRepeat: 'repeat-x',
            filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.1))'
          }} 
        />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm; /* Common thermal printer width */
            padding: 0;
            box-shadow: none;
          }
        }
      `}} />
    </div>
  );
});

Receipt.displayName = 'Receipt';
