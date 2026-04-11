import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatarMoeda } from '@/lib/parking';
import { Input } from '@/components/ui/input';
import { DollarSign, CreditCard, Smartphone, Banknote, Search } from 'lucide-react';

interface Pagamento {
  id: string;
  valor: number;
  forma_pagamento: string;
  data: string;
  veiculo_id: string;
}

export default function Caixa() {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (!user) return;
    const inicio = new Date(dataSelecionada + 'T00:00:00');
    const fim = new Date(dataSelecionada + 'T23:59:59');

    supabase
      .from('pagamentos')
      .select('*')
      .eq('user_id', user.id)
      .gte('data', inicio.toISOString())
      .lte('data', fim.toISOString())
      .order('data', { ascending: false })
      .then(({ data }) => {
        setPagamentos(data || []);
        setLoading(false);
      });
  }, [user, dataSelecionada]);

  const total = pagamentos.reduce((acc, p) => acc + Number(p.valor), 0);
  const totalDinheiro = pagamentos.filter(p => p.forma_pagamento === 'dinheiro').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalPix = pagamentos.filter(p => p.forma_pagamento === 'pix').reduce((acc, p) => acc + Number(p.valor), 0);
  const totalCartao = pagamentos.filter(p => p.forma_pagamento === 'cartao').reduce((acc, p) => acc + Number(p.valor), 0);

  const iconForma = (f: string) => {
    if (f === 'dinheiro') return <Banknote className="w-4 h-4" />;
    if (f === 'pix') return <Smartphone className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  const labelForma = (f: string) => {
    if (f === 'dinheiro') return 'Dinheiro';
    if (f === 'pix') return 'PIX';
    return 'Cartão';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Caixa</h1>
        <p className="text-muted-foreground text-sm">Movimentação financeira</p>
      </div>

      <Input
        type="date"
        value={dataSelecionada}
        onChange={(e) => setDataSelecionada(e.target.value)}
      />

      {/* Total */}
      <div className="stat-card bg-primary text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Total do Dia</p>
            <p className="text-3xl font-bold font-heading">{formatarMoeda(total)}</p>
          </div>
          <DollarSign className="w-10 h-10 opacity-30" />
        </div>
      </div>

      {/* By payment type */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Banknote className="w-5 h-5 mx-auto text-success" />
          <p className="text-lg font-bold">{formatarMoeda(totalDinheiro)}</p>
          <p className="text-xs text-muted-foreground">Dinheiro</p>
        </div>
        <div className="stat-card text-center">
          <Smartphone className="w-5 h-5 mx-auto text-primary" />
          <p className="text-lg font-bold">{formatarMoeda(totalPix)}</p>
          <p className="text-xs text-muted-foreground">PIX</p>
        </div>
        <div className="stat-card text-center">
          <CreditCard className="w-5 h-5 mx-auto text-warning" />
          <p className="text-lg font-bold">{formatarMoeda(totalCartao)}</p>
          <p className="text-xs text-muted-foreground">Cartão</p>
        </div>
      </div>

      {/* Payment list */}
      <div className="space-y-2">
        <h2 className="font-heading font-semibold">Pagamentos ({pagamentos.length})</h2>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : pagamentos.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum pagamento nesta data</p>
        ) : (
          pagamentos.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  {iconForma(p.forma_pagamento)}
                </div>
                <div>
                  <p className="font-semibold">{formatarMoeda(Number(p.valor))}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{labelForma(p.forma_pagamento)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
