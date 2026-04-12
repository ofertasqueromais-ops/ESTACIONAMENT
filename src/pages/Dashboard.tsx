import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EntradaVeiculoDialog } from '@/components/EntradaVeiculoDialog';
import { SaidaVeiculoDialog } from '@/components/SaidaVeiculoDialog';
import { formatarTempo } from '@/lib/parking';
import { LogIn, LogOut, Car, Bike, Search, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Veiculo {
  id: string;
  placa: string;
  tipo: string;
  entrada: string;
  mensalista: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isImpersonating, impersonatedEstacionamentoId } = useImpersonation();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [entradaOpen, setEntradaOpen] = useState(false);
  const [saidaOpen, setSaidaOpen] = useState(false);
  const [placaSaida, setPlacaSaida] = useState('');
  const [loading, setLoading] = useState(true);

  const carregarVeiculos = useCallback(async () => {
    if (!user) return;
    
    let query = supabase
      .from('veiculos')
      .select('id, placa, tipo, entrada, mensalista')
      .eq('status', 'ativo')
      .order('entrada', { ascending: false });

    if (isImpersonating && impersonatedEstacionamentoId) {
      query = query.eq('estacionamento_id', impersonatedEstacionamentoId);
    } else {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    setVeiculos(data || []);
    setLoading(false);
  }, [user, isImpersonating, impersonatedEstacionamentoId]);

  useEffect(() => { carregarVeiculos(); }, [carregarVeiculos]);

  const veiculosFiltrados = veiculos.filter(v =>
    v.placa.includes(filtro.toUpperCase())
  );

  const abrirSaida = (placa: string) => {
    setPlacaSaida(placa);
    setSaidaOpen(true);
  };

  const totalCarros = veiculos.filter(v => v.tipo === 'carro').length;
  const totalMotos = veiculos.filter(v => v.tipo === 'moto').length;
  const totalMensalistas = veiculos.filter(v => v.mensalista).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Pátio</h1>
        <p className="text-muted-foreground text-sm">{veiculos.length} veículo(s) no pátio</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setEntradaOpen(true)} className="btn-action bg-primary text-primary-foreground">
          <LogIn className="w-8 h-8" />
          <span>Entrada</span>
        </button>
        <button onClick={() => { setPlacaSaida(''); setSaidaOpen(true); }} className="btn-action bg-accent text-accent-foreground">
          <LogOut className="w-8 h-8" />
          <span>Saída</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card text-center">
          <Car className="w-5 h-5 mx-auto text-primary" />
          <p className="text-xl font-bold">{totalCarros}</p>
          <p className="text-xs text-muted-foreground">Carros</p>
        </div>
        <div className="stat-card text-center">
          <Bike className="w-5 h-5 mx-auto text-primary" />
          <p className="text-xl font-bold">{totalMotos}</p>
          <p className="text-xs text-muted-foreground">Motos</p>
        </div>
        <div className="stat-card text-center">
          <Users className="w-5 h-5 mx-auto text-primary" />
          <p className="text-xl font-bold">{totalMensalistas}</p>
          <p className="text-xs text-muted-foreground">Mensalistas</p>
        </div>
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por placa..."
          className="pl-9"
        />
      </div>

      {/* Vehicle list */}
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : veiculosFiltrados.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum veículo no pátio</p>
        ) : (
          veiculosFiltrados.map(v => (
            <button
              key={v.id}
              onClick={() => abrirSaida(v.placa)}
              className="w-full flex items-center justify-between p-3 rounded-xl border bg-card hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  {v.tipo === 'carro' ? <Car className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold font-heading tracking-wider">{v.placa}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatarTempo(new Date(v.entrada), new Date())}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {v.mensalista && (
                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                    Mensalista
                  </Badge>
                )}
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </div>
            </button>
          ))
        )}
      </div>

      <EntradaVeiculoDialog open={entradaOpen} onOpenChange={setEntradaOpen} onSuccess={carregarVeiculos} />
      <SaidaVeiculoDialog open={saidaOpen} onOpenChange={setSaidaOpen} onSuccess={carregarVeiculos} placaInicial={placaSaida} />
    </div>
  );
}
