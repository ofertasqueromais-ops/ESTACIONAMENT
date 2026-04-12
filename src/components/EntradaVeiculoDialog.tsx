import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { formatarPlaca } from '@/lib/parking';
import { toast } from 'sonner';
import { Car, Bike } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EntradaVeiculoDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const { estacionamentoId } = useUserRole();
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipo, setTipo] = useState<'carro' | 'moto'>('carro');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const placaFormatada = formatarPlaca(placa);
    if (placaFormatada.length < 6) {
      toast.error('Placa inválida');
      return;
    }

    setLoading(true);
    try {
      // Check if mensalista
      const { data: mensalista } = await supabase
        .from('mensalistas')
        .select('*')
        .eq('placa', placaFormatada)
        .eq('user_id', user.id)
        .maybeSingle();

      const isMensalista = !!mensalista;
      
      if (mensalista && mensalista.status === 'vencido') {
        toast.warning('⚠️ Mensalista com plano VENCIDO! Será cobrado como avulso.');
      } else if (isMensalista) {
        toast.success('✅ Mensalista identificado: ' + mensalista.nome);
      }

      // Check if already in lot
      const { data: existing } = await supabase
        .from('veiculos')
        .select('id')
        .eq('placa', placaFormatada)
        .eq('status', 'ativo')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        toast.error('Veículo já está no pátio!');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('veiculos').insert({
        user_id: user.id,
        estacionamento_id: estacionamentoId,
        placa: placaFormatada,
        tipo,
        marca,
        modelo,
        mensalista: isMensalista && mensalista?.status === 'ativo',
      });

      if (error) throw error;

      toast.success(`${tipo === 'carro' ? '🚗' : '🏍️'} Entrada registrada: ${placaFormatada}`);
      setPlaca('');
      setMarca('');
      setModelo('');
      setTipo('carro');
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Entrada de Veículo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="placa">Placa</Label>
            <Input
              id="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              className="plate-input mt-1"
              maxLength={7}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Ex: Ford"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                placeholder="Ex: Fiesta"
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setTipo('carro')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  tipo === 'carro' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Car className="w-5 h-5" /> Carro
              </button>
              <button
                type="button"
                onClick={() => setTipo('moto')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  tipo === 'moto' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-muted-foreground'
                }`}
              >
                <Bike className="w-5 h-5" /> Moto
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Entrada'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
