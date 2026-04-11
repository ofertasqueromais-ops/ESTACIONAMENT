import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatarMoeda, formatarTempo, gerarComprovante } from '@/lib/parking';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface VeiculoFinalizado {
  id: string;
  placa: string;
  tipo: string;
  entrada: string;
  saida: string;
  valor: number;
  mensalista: boolean;
}

export default function Recibos() {
  const { user } = useAuth();
  const [veiculos, setVeiculos] = useState<VeiculoFinalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const inicio = new Date(dataInicio + 'T00:00:00');
    const fim = new Date(dataFim + 'T23:59:59');

    supabase
      .from('veiculos')
      .select('id, placa, tipo, entrada, saida, valor, mensalista')
      .eq('user_id', user.id)
      .eq('status', 'finalizado')
      .gte('saida', inicio.toISOString())
      .lte('saida', fim.toISOString())
      .order('saida', { ascending: false })
      .then(({ data }) => {
        setVeiculos((data as VeiculoFinalizado[]) || []);
        setLoading(false);
      });
  }, [user, dataInicio, dataFim]);

  const veiculosFiltrados = veiculos.filter(v =>
    v.placa.includes(filtro.toUpperCase())
  );

  const copiarRecibo = (v: VeiculoFinalizado) => {
    const pagamento = v.valor > 0 ? 'Avulso' : '';
    const texto = gerarComprovante({
      placa: v.placa,
      tipo: v.tipo,
      entrada: new Date(v.entrada).toLocaleString('pt-BR'),
      saida: new Date(v.saida).toLocaleString('pt-BR'),
      tempo: formatarTempo(new Date(v.entrada), new Date(v.saida)),
      valor: formatarMoeda(v.valor || 0),
      formaPagamento: pagamento,
      mensalista: v.mensalista,
    });
    navigator.clipboard.writeText(texto);
    setCopiadoId(v.id);
    toast.success('Recibo copiado!');
    setTimeout(() => setCopiadoId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Recibos</h1>
        <p className="text-muted-foreground text-sm">Consulte e reenvie comprovantes</p>
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
              <Button size="icon" variant="ghost" onClick={() => copiarRecibo(v)}>
                {copiadoId === v.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
