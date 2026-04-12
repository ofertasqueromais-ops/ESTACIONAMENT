import { Search, Clock, DollarSign, AlertTriangle, Copy, Check, Printer } from 'lucide-react';
import { Receipt } from './Receipt';
import { useRef } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  placaInicial?: string;
}

interface VeiculoAtivo {
  id: string;
  placa: string;
  marca?: string | null;
  modelo?: string | null;
  tipo: string;
  entrada: string;
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

export function SaidaVeiculoDialog({ open, onOpenChange, onSuccess, placaInicial }: Props) {
  const { user } = useAuth();
  const [placa, setPlaca] = useState(placaInicial || '');
  const [veiculo, setVeiculo] = useState<VeiculoAtivo | null>(null);
  const [estacionamento, setEstacionamento] = useState<Estacionamento | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<string>('dinheiro');
  const [loading, setLoading] = useState(false);
  const [mensalistaVencido, setMensalistaVencido] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const agora = new Date();
  const valor = veiculo ? calcularValor(veiculo.tipo, new Date(veiculo.entrada), agora) : 0;
  const tempo = veiculo ? formatarTempo(new Date(veiculo.entrada), agora) : '';

  const buscarVeiculo = async () => {
    if (!user) return;
    const placaFormatada = formatarPlaca(placa);
    
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('placa', placaFormatada)
      .eq('status', 'ativo')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      toast.error('Veículo não encontrado no pátio');
      setVeiculo(null);
      return;
    }

    setVeiculo(data);

    // Fetch estacionamento details
    if (data.estacionamento_id) {
      const { data: est } = await supabase
        .from('estacionamentos')
        .select('nome, cnpj, endereco, telefone, horario_funcionamento')
        .eq('id', data.estacionamento_id)
        .maybeSingle();
      
      if (est) setEstacionamento(est);
    }
  };

  const finalizar = async () => {
    if (!user || !veiculo) return;
    setLoading(true);
    try {
      const saida = new Date();
      const valorFinal = veiculo.mensalista && !mensalistaVencido ? 0 : calcularValor(veiculo.tipo, new Date(veiculo.entrada), saida);

      const { error: updateErr } = await supabase
        .from('veiculos')
        .update({ saida: saida.toISOString(), valor: valorFinal, status: 'finalizado' })
        .eq('id', veiculo.id);

      if (updateErr) throw updateErr;

      if (valorFinal > 0) {
        const { error: pagErr } = await supabase.from('pagamentos').insert({
          user_id: user.id,
          estacionamento_id: veiculo.estacionamento_id, // Usar o mesmo do veículo
          veiculo_id: veiculo.id,
          valor: valorFinal,
          forma_pagamento: formaPagamento,
        });
        if (pagErr) throw pagErr;
      }

      setFinalizado(true);
      toast.success(`Saída registrada: ${veiculo.placa}`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar saída');
    } finally {
      setLoading(false);
    }
  };

  const imprimirRecibo = () => {
    window.print();
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setPlaca('');
      setVeiculo(null);
      setFinalizado(false);
      setMensalistaVencido(false);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Saída de Veículo</DialogTitle>
        </DialogHeader>

        {!veiculo ? (
          <div className="space-y-4">
            <div>
              <Label>Buscar pela Placa</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  placeholder="ABC1D23"
                  className="plate-input flex-1"
                  maxLength={7}
                  onKeyDown={(e) => e.key === 'Enter' && buscarVeiculo()}
                />
                <Button onClick={buscarVeiculo} size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : finalizado ? (
          <div className="space-y-4 py-2">
            <div className="bg-success/5 border border-success/20 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success">Saída finalizada!</p>
                <p className="text-xs text-muted-foreground">O veículo já pode deixar o pátio.</p>
              </div>
            </div>

            <div className="border rounded-xl bg-slate-50 overflow-hidden">
              <Receipt 
                ref={receiptRef}
                estacionamento={estacionamento || { nome: 'Estacionamento' }}
                veiculo={{
                  ...veiculo,
                  id: veiculo.id,
                  placa: veiculo.placa,
                  entrada: veiculo.entrada,
                  saida: new Date().toISOString(),
                  tempo,
                  valor,
                  formaPagamento,
                  mensalista: veiculo.mensalista && !mensalistaVencido
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => window.print()} variant="outline" className="gap-2 h-11 border-2">
                <Printer className="w-4 h-4" /> Imprimir
              </Button>
              <Button onClick={() => handleClose(false)} className="h-11 shadow-lg shadow-primary/20">
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mensalistaVencido && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning-foreground">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                <span className="text-sm font-medium">Mensalista com plano VENCIDO! Cobrança normal aplicada.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Tempo</p>
                <p className="text-lg font-bold">{tempo}</p>
              </div>
              <div className="stat-card">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor</p>
                <p className="text-lg font-bold">
                  {veiculo.mensalista && !mensalistaVencido ? (
                    <span className="text-success">Grátis</span>
                  ) : (
                    formatarMoeda(valor)
                  )}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-secondary text-sm">
              <p><strong>Placa:</strong> {veiculo.placa}</p>
              <p><strong>Tipo:</strong> {veiculo.tipo === 'carro' ? '🚗 Carro' : '🏍️ Moto'}</p>
              <p><strong>Entrada:</strong> {new Date(veiculo.entrada).toLocaleString('pt-BR')}</p>
              {veiculo.mensalista && !mensalistaVencido && <p className="text-success font-medium mt-1">✅ Mensalista Ativo</p>}
            </div>

            {(!veiculo.mensalista || mensalistaVencido) && (
              <div>
                <Label>Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['dinheiro', 'pix', 'cartao'] as const).map((fp) => (
                    <button
                      key={fp}
                      type="button"
                      onClick={() => setFormaPagamento(fp)}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formaPagamento === fp ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      {fp === 'dinheiro' ? '💵 Dinheiro' : fp === 'pix' ? '📱 PIX' : '💳 Cartão'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={finalizar} className="w-full" disabled={loading}>
              {loading ? 'Finalizando...' : 'Finalizar e Cobrar'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
