import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { formatarPlaca } from '@/lib/parking';
import { imprimirReciboHtml } from '@/lib/printReceipt';
import { Receipt } from './Receipt';
import { toast } from 'sonner';
import { Car, Bike, Printer, Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface EntradaResultado {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  tipo: string;
  entrada: string;
  mensalista: boolean;
}

interface EstacionamentoInfo {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  horario_funcionamento?: string | null;
}

export function EntradaVeiculoDialog({ open, onOpenChange, onSuccess }: Props) {
  const { user } = useAuth();
  const { estacionamentoId } = useUserRole();
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipo, setTipo] = useState<'carro' | 'moto'>('carro');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<EntradaResultado | null>(null);
  const [estacionamento, setEstacionamento] = useState<EstacionamentoInfo | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setPlaca('');
    setMarca('');
    setModelo('');
    setTipo('carro');
    setResultado(null);
    setEstacionamento(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  const imprimir = () => {
    if (!receiptRef.current) return;
    imprimirReciboHtml(receiptRef.current.innerHTML);
  };

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

      const { data: inserted, error } = await supabase.from('veiculos').insert({
        user_id: user.id,
        estacionamento_id: estacionamentoId,
        placa: placaFormatada,
        tipo,
        marca,
        modelo,
        mensalista: isMensalista && mensalista?.status === 'ativo',
      } as any).select('id, placa, tipo, marca, modelo, entrada, mensalista, estacionamento_id').single();

      if (error) throw error;

      // Buscar dados do estacionamento para o recibo
      if (inserted?.estacionamento_id) {
        const { data: est } = await supabase
          .from('estacionamentos')
          .select('nome, cnpj, endereco, telefone, horario_funcionamento')
          .eq('id', inserted.estacionamento_id)
          .maybeSingle();
        if (est) setEstacionamento(est);
      }

      setResultado(inserted as EntradaResultado);
      toast.success(`${tipo === 'carro' ? '🚗' : '🏍️'} Entrada registrada: ${placaFormatada}`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {resultado ? 'Comprovante de Entrada' : 'Entrada de Veículo'}
          </DialogTitle>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4 py-2">
            <div className="bg-success/5 border border-success/20 p-4 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success">Entrada registrada!</p>
                <p className="text-xs text-muted-foreground">Imprima e entregue ao cliente.</p>
              </div>
            </div>

            <div className="border rounded-xl bg-slate-50 overflow-hidden">
              <Receipt
                ref={receiptRef}
                tipo="entrada"
                estacionamento={estacionamento || { nome: 'Estacionamento' }}
                veiculo={{
                  id: resultado.id,
                  placa: resultado.placa,
                  marca: resultado.marca,
                  modelo: resultado.modelo,
                  tipo: resultado.tipo,
                  entrada: resultado.entrada,
                  mensalista: resultado.mensalista,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={imprimir} variant="outline" className="gap-2 h-11 border-2">
                <Printer className="w-4 h-4" /> Imprimir
              </Button>
              <Button onClick={() => handleClose(false)} className="h-11 shadow-lg shadow-primary/20">
                Fechar
              </Button>
            </div>
          </div>
        ) : (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
