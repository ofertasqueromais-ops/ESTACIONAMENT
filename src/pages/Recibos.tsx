import { useState, useEffect } from 'react';
import { Copy, Check, Search, FileText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt } from '@/components/Receipt';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/hooks/useImpersonation';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { formatarMoeda, formatarTempo, gerarComprovante } from '@/lib/parking';
import { bluetoothPrinter } from '@/lib/bluetoothPrinter';
import { imprimirReciboHtml } from '@/lib/printReceipt';
import { useRef } from 'react';

interface VeiculoFinalizado {
  id: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  tipo: string;
  entrada: string;
  saida: string;
  valor: number;
  mensalista: boolean;
  estacionamento_id: string | null;
}

interface Estacionamento {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  horario_funcionamento?: string | null;
}

export default function Recibos() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedEstacionamentoId } = useImpersonation();
  const [veiculos, setVeiculos] = useState<VeiculoFinalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [selectedVeiculo, setSelectedVeiculo] = useState<VeiculoFinalizado | null>(null);
  const [estacionamento, setEstacionamento] = useState<Estacionamento | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(bluetoothPrinter.isConnected());
  const [isConnectingBluetooth, setIsConnectingBluetooth] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T23:59:59');

    let query = supabase
      .from('veiculos')
      .select('id, placa, tipo, entrada, saida, valor, mensalista, marca, modelo, estacionamento_id')
      .eq('status', 'finalizado')
      .gte('saida', inicio.toISOString())
      .lte('saida', fim.toISOString())
      .order('saida', { ascending: false });

    if (isImpersonating && impersonatedEstacionamentoId) {
      query = query.eq('estacionamento_id', impersonatedEstacionamentoId);
    } else {
      query = query.eq('user_id', user.id);
    }

    query.then(({ data }) => {
      setVeiculos((data as VeiculoFinalizado[]) || []);
      setLoading(false);
    });
  }, [user, dataInicio, dataFim, isImpersonating, impersonatedEstacionamentoId]);

  const veiculosFiltrados = veiculos.filter(v =>
    v.placa.includes(filtro.toUpperCase())
  );

  const imprimirRecibo = async (v: VeiculoFinalizado) => {
    setSelectedVeiculo(v);
    
    // Fetch estacionamento details
    if (v.estacionamento_id) {
      const { data: est } = await supabase
        .from('estacionamentos')
        .select('nome, cnpj, endereco, telefone, horario_funcionamento')
        .eq('id', v.estacionamento_id)
        .maybeSingle();
      
      if (est) setEstacionamento(est);
    }
    
    setIsPrintModalOpen(true);
  };

  const handleConnectBluetooth = async () => {
    try {
      setIsConnectingBluetooth(true);
      await bluetoothPrinter.connect();
      setIsBluetoothConnected(true);
      toast.success("Impressora conectada com sucesso!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao conectar impressora");
    } finally {
      setIsConnectingBluetooth(false);
    }
  };

  const handleDisconnectBluetooth = () => {
    bluetoothPrinter.disconnect();
    setIsBluetoothConnected(false);
    toast.info("Impressora desconectada");
  };

  const handleBluetoothPrint = async () => {
    if (!selectedVeiculo) return;
    
    try {
      const veiculoDados = {
        ...selectedVeiculo,
        entrada: new Date(selectedVeiculo.entrada).toLocaleString('pt-BR'),
        saida: new Date(selectedVeiculo.saida).toLocaleString('pt-BR'),
        tempo: formatarTempo(new Date(selectedVeiculo.entrada), new Date(selectedVeiculo.saida)),
        formaPagamento: selectedVeiculo.valor > 0 ? 'Confirmado' : '',
        valor: formatarMoeda(selectedVeiculo.valor || 0)
      };

      await bluetoothPrinter.printReceipt({
        estacionamento: estacionamento || { nome: 'Estacionamento' },
        veiculo: veiculoDados
      });
      
      toast.success("Recibo enviado para impressora!");
      setIsPrintModalOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao imprimir");
    }
  };

  const handleImprimirNavegador = () => {
    if (!receiptRef.current) {
      window.print();
      return;
    }
    imprimirReciboHtml(receiptRef.current.innerHTML);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Recibos</h1>
          <p className="text-muted-foreground text-sm">Consulte e reenvie comprovantes</p>
        </div>
        <div>
          {isBluetoothConnected ? (
            <Button variant="outline" className="border-success text-success hover:bg-success/10 hover:text-success" onClick={handleDisconnectBluetooth}>
              <Printer className="w-4 h-4 mr-2" /> Impressora Conectada
            </Button>
          ) : (
            <Button variant="outline" onClick={handleConnectBluetooth} disabled={isConnectingBluetooth}>
              <Printer className="w-4 h-4 mr-2" /> {isConnectingBluetooth ? 'Conectando...' : 'Conectar Impressora Bluetooth'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Até</label>
          <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          placeholder="Filtrar por placa..."
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        <h2 className="font-heading font-semibold">Resultados ({veiculosFiltrados.length})</h2>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : veiculosFiltrados.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum recibo encontrado</p>
        ) : (
          veiculosFiltrados.map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold font-heading tracking-wider">{v.placa}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(v.saida).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {v.mensalista ? 'Mensalista' : formatarMoeda(v.valor || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => imprimirRecibo(v)}>
                  <Printer className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => {
                   const texto = gerarComprovante({
                    placa: v.placa,
                    tipo: v.tipo,
                    entrada: new Date(v.entrada).toLocaleString('pt-BR'),
                    saida: new Date(v.saida).toLocaleString('pt-BR'),
                    tempo: formatarTempo(new Date(v.entrada), new Date(v.saida)),
                    valor: formatarMoeda(v.valor || 0),
                    formaPagamento: v.valor > 0 ? 'Avulso' : '',
                    mensalista: v.mensalista,
                  });
                  navigator.clipboard.writeText(texto);
                  setCopiadoId(v.id);
                  toast.success('Recibo copiado!');
                  setTimeout(() => setCopiadoId(null), 2000);
                }}>
                  {copiadoId === v.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imprimir Recibo</DialogTitle>
          </DialogHeader>
          {selectedVeiculo && (
            <div className="space-y-4">
              <div className="border rounded-xl bg-slate-50 overflow-hidden">
                <Receipt 
                  ref={receiptRef}
                  estacionamento={estacionamento || { nome: 'Estacionamento' }}
                  veiculo={{
                    ...selectedVeiculo,
                    tempo: formatarTempo(new Date(selectedVeiculo.entrada), new Date(selectedVeiculo.saida)),
                    formaPagamento: selectedVeiculo.valor > 0 ? 'Confirmado' : ''
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={handleImprimirNavegador} variant="outline" className="w-full gap-2 h-12">
                  <Printer className="w-5 h-5" /> Imprimir (Navegador)
                </Button>
                {isBluetoothConnected ? (
                  <Button onClick={handleBluetoothPrint} className="w-full gap-2 h-12 shadow-lg shadow-primary/20 bg-primary">
                    <Printer className="w-5 h-5" /> Imprimir (Bluetooth)
                  </Button>
                ) : (
                  <Button onClick={handleConnectBluetooth} className="w-full gap-2 h-12 shadow-lg shadow-primary/20 bg-primary">
                    <Printer className="w-5 h-5" /> Conectar Bluetooth
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
