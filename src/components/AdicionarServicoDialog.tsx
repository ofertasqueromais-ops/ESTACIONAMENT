import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatarMoeda } from '@/lib/parking';
import { toast } from 'sonner';

interface Servico {
  nome: string;
  valor: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  veiculoId: string;
  placa: string;
  servicosIniciais?: Servico[];
  onSuccess: () => void;
}

const SUGESTOES = [
  { nome: 'Lavagem Simples', valor: 30 },
  { nome: 'Lavagem Completa', valor: 60 },
  { nome: 'Cera', valor: 20 },
  { nome: 'Ducha', valor: 15 },
  { nome: 'Venda - Água', valor: 5 },
  { nome: 'Venda - Refrigerante', valor: 8 },
];

export function AdicionarServicoDialog({ open, onOpenChange, veiculoId, placa, servicosIniciais = [], onSuccess }: Props) {
  const [servicos, setServicos] = useState<Servico[]>(servicosIniciais);
  const [nome, setNome] = useState('');
  const [valorStr, setValorStr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setServicos(servicosIniciais || []);
      setNome('');
      setValorStr('');
    }
  }, [open, servicosIniciais]);

  const handleAddServico = () => {
    if (!nome.trim()) {
      toast.error('Informe o nome do serviço');
      return;
    }
    const valor = parseFloat(valorStr.replace(',', '.'));
    if (isNaN(valor) || valor < 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setServicos([...servicos, { nome: nome.trim(), valor }]);
    setNome('');
    setValorStr('');
  };

  const handleRemoveServico = (index: number) => {
    const novos = [...servicos];
    novos.splice(index, 1);
    setServicos(novos);
  };

  const handleAddSugestao = (sugestao: typeof SUGESTOES[0]) => {
    setServicos([...servicos, { nome: sugestao.nome, valor: sugestao.valor }]);
  };

  const salvarServicos = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('veiculos')
        .update({ servicos })
        .eq('id', veiculoId);

      if (error) throw error;

      toast.success('Serviços atualizados com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar serviços');
    } finally {
      setLoading(false);
    }
  };

  const total = servicos.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Serviços - {placa}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-7">
              <Label>Serviço / Produto</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Lavagem"
              />
            </div>
            <div className="col-span-3">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={valorStr}
                onChange={(e) => setValorStr(e.target.value)}
                placeholder="0.00"
                onKeyDown={(e) => e.key === 'Enter' && handleAddServico()}
              />
            </div>
            <div className="col-span-2">
              <Button type="button" onClick={handleAddServico} className="w-full">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sugestões rápidas:</Label>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s.nome}
                  type="button"
                  onClick={() => handleAddSugestao(s)}
                  className="text-xs bg-secondary hover:bg-secondary/80 px-2 py-1 rounded-md border"
                >
                  {s.nome} (+{formatarMoeda(s.valor)})
                </button>
              ))}
            </div>
          </div>

          <div className="border rounded-xl p-3 bg-slate-50 min-h-[150px] max-h-[250px] overflow-y-auto space-y-2">
            {servicos.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">Nenhum serviço adicionado.</p>
            ) : (
              servicos.map((s, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white border p-2 rounded-lg text-sm shadow-sm">
                  <span className="font-medium">{s.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{formatarMoeda(s.valor)}</span>
                    <button onClick={() => handleRemoveServico(idx)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center bg-primary/5 p-3 rounded-xl border border-primary/20">
            <span className="font-bold">Total em Serviços:</span>
            <span className="font-bold text-lg text-primary">{formatarMoeda(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarServicos} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Serviços'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
