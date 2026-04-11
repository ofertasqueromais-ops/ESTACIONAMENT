import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatarMoeda, formatarPlaca } from '@/lib/parking';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Users, AlertTriangle, CheckCircle, Pencil, Trash2 } from 'lucide-react';

interface Mensalista {
  id: string;
  nome: string;
  placa: string;
  telefone: string | null;
  valor_mensal: number;
  vencimento: string;
  status: string;
}

export default function MensalistasPage() {
  const { user } = useAuth();
  const [mensalistas, setMensalistas] = useState<Mensalista[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Mensalista | null>(null);

  const [nome, setNome] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefone, setTelefone] = useState('');
  const [valorMensal, setValorMensal] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [saving, setSaving] = useState(false);

  const carregar = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('mensalistas')
      .select('*')
      .eq('user_id', user.id)
      .order('nome');

    // Auto-update status based on vencimento
    const hoje = new Date().toISOString().split('T')[0];
    const atualizado = (data || []).map(m => ({
      ...m,
      status: m.vencimento < hoje ? 'vencido' : 'ativo',
    }));

    setMensalistas(atualizado);
    setLoading(false);

    // Update vencidos in DB
    for (const m of atualizado) {
      if (m.status === 'vencido') {
        await supabase.from('mensalistas').update({ status: 'vencido' }).eq('id', m.id);
      } else {
        await supabase.from('mensalistas').update({ status: 'ativo' }).eq('id', m.id);
      }
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const abrirNovo = () => {
    setEditando(null);
    setNome(''); setPlaca(''); setTelefone(''); setValorMensal(''); setVencimento('');
    setDialogOpen(true);
  };

  const abrirEditar = (m: Mensalista) => {
    setEditando(m);
    setNome(m.nome);
    setPlaca(m.placa);
    setTelefone(m.telefone || '');
    setValorMensal(String(m.valor_mensal));
    setVencimento(m.vencimento);
    setDialogOpen(true);
  };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const dados = {
      nome,
      placa: formatarPlaca(placa),
      telefone: telefone || null,
      valor_mensal: Number(valorMensal),
      vencimento,
      status: vencimento < new Date().toISOString().split('T')[0] ? 'vencido' : 'ativo',
      user_id: user.id,
    };

    try {
      if (editando) {
        const { error } = await supabase.from('mensalistas').update(dados).eq('id', editando.id);
        if (error) throw error;
        toast.success('Mensalista atualizado!');
      } else {
        const { error } = await supabase.from('mensalistas').insert(dados);
        if (error) throw error;
        toast.success('Mensalista cadastrado!');
      }
      setDialogOpen(false);
      carregar();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir mensalista?')) return;
    const { error } = await supabase.from('mensalistas').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Mensalista excluído');
      carregar();
    }
  };

  const ativos = mensalistas.filter(m => m.status === 'ativo').length;
  const vencidos = mensalistas.filter(m => m.status === 'vencido').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Mensalistas</h1>
          <p className="text-muted-foreground text-sm">{mensalistas.length} cadastrado(s)</p>
        </div>
        <Button onClick={abrirNovo} className="gap-2">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card text-center">
          <CheckCircle className="w-5 h-5 mx-auto text-success" />
          <p className="text-xl font-bold">{ativos}</p>
          <p className="text-xs text-muted-foreground">Ativos</p>
        </div>
        <div className="stat-card text-center">
          <AlertTriangle className="w-5 h-5 mx-auto text-warning" />
          <p className="text-xl font-bold">{vencidos}</p>
          <p className="text-xs text-muted-foreground">Vencidos</p>
        </div>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Carregando...</p>
        ) : mensalistas.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum mensalista cadastrado</p>
        ) : (
          mensalistas.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">{m.nome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{m.placa}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatarMoeda(m.valor_mensal)}/mês · Venc: {new Date(m.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.status === 'ativo' ? 'default' : 'destructive'} className={m.status === 'ativo' ? 'bg-success/10 text-success border-success/20' : ''}>
                  {m.status === 'ativo' ? 'Ativo' : 'Vencido'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => abrirEditar(m)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => excluir(m.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editando ? 'Editar' : 'Novo'} Mensalista</DialogTitle>
          </DialogHeader>
          <form onSubmit={salvar} className="space-y-3">
            <div><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
            <div><Label>Placa</Label><Input value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} className="plate-input" maxLength={7} required /></div>
            <div><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div><Label>Valor Mensal (R$)</Label><Input type="number" value={valorMensal} onChange={e => setValorMensal(e.target.value)} min="0" step="0.01" required /></div>
            <div><Label>Data de Vencimento</Label><Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
