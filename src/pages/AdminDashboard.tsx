import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useImpersonation } from '@/hooks/useImpersonation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, XCircle, Shield, Users, DollarSign, CheckCircle } from 'lucide-react';

interface Estacionamento {
  id: string;
  nome: string;
  logo_url: string | null;
  responsavel: string;
  email: string;
  telefone: string | null;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [estacionamentos, setEstacionamentos] = useState<Estacionamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Estacionamento | null>(null);
  const [form, setForm] = useState({ nome: '', responsavel: '', email: '', telefone: '' });
  const { startImpersonation } = useImpersonation();
  const navigate = useNavigate();

  const loadEstacionamentos = async () => {
    const { data } = await supabase
      .from('estacionamentos')
      .select('*')
      .order('created_at', { ascending: false });
    setEstacionamentos(data || []);
    setLoading(false);
  };

  useEffect(() => { loadEstacionamentos(); }, []);

  const handleSave = async () => {
    if (!form.nome || !form.responsavel || !form.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from('estacionamentos')
        .update({ nome: form.nome, responsavel: form.responsavel, email: form.email, telefone: form.telefone })
        .eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Estacionamento atualizado!');
    } else {
      const { error } = await supabase
        .from('estacionamentos')
        .insert({ nome: form.nome, responsavel: form.responsavel, email: form.email, telefone: form.telefone });
      if (error) { toast.error(error.message); return; }
      toast.success('Estacionamento criado!');
    }

    setDialogOpen(false);
    setEditing(null);
    setForm({ nome: '', responsavel: '', email: '', telefone: '' });
    loadEstacionamentos();
  };

  const toggleStatus = async (est: Estacionamento) => {
    const newStatus = est.status === 'ativo' ? 'inativo' : 'ativo';
    const { error } = await supabase
      .from('estacionamentos')
      .update({ status: newStatus })
      .eq('id', est.id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Estacionamento ${newStatus === 'ativo' ? 'ativado' : 'desativado'}!`);
    loadEstacionamentos();
  };

  const handleImpersonate = (est: Estacionamento) => {
    startImpersonation(est.id, est.nome);
    navigate('/');
    toast.info(`Modo suporte: ${est.nome}`);
  };

  const openEdit = (est: Estacionamento) => {
    setEditing(est);
    setForm({ nome: est.nome, responsavel: est.responsavel, email: est.email, telefone: est.telefone || '' });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', responsavel: '', email: '', telefone: '' });
    setDialogOpen(true);
  };

  const ativos = estacionamentos.filter(e => e.status === 'ativo').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Admin Master
        </h1>
        <p className="text-muted-foreground text-sm">Gestão de estacionamentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estacionamentos.length}</p>
              <p className="text-xs text-muted-foreground">Estacionamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">R$ --</p>
              <p className="text-xs text-muted-foreground">Faturamento (futuro)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Estacionamentos</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Novo
        </Button>
      </div>

      {/* Estacionamentos table */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : estacionamentos.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhum estacionamento cadastrado</p>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Responsável</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estacionamentos.map(est => (
                  <TableRow key={est.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          {est.logo_url ? (
                            <img src={est.logo_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          ) : (
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{est.nome}</p>
                          <p className="text-xs text-muted-foreground">{est.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{est.responsavel}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{est.telefone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={est.status === 'ativo' ? 'default' : 'secondary'} className={est.status === 'ativo' ? 'bg-success/10 text-success border-success/20' : ''}>
                        {est.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(est)} title="Editar">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(est)} title={est.status === 'ativo' ? 'Desativar' : 'Ativar'}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleImpersonate(est)} title="Acessar como cliente">
                          <Shield className="w-4 h-4 text-primary" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Estacionamento' : 'Novo Estacionamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome do estacionamento *</label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Pereira Estacionamento" />
            </div>
            <div>
              <label className="text-sm font-medium">Responsável *</label>
              <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do responsável" />
            </div>
            <div>
              <label className="text-sm font-medium">Email (login) *</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
            </div>
            <Button onClick={handleSave} className="w-full">
              {editing ? 'Salvar alterações' : 'Criar estacionamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
