import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useImpersonation } from '@/hooks/useImpersonation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Plus, Pencil, Power, Shield, Globe, Mail, Phone, User, Trash2, Camera, Loader2, Info } from 'lucide-react';

interface Estacionamento {
  id: string;
  nome: string;
  logo_url: string | null;
  responsavel: string;
  email: string;
  telefone: string | null;
  cnpj: string | null;
  endereco: string | null;
  horario_funcionamento: string | null;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [estacionamentos, setEstacionamentos] = useState<Estacionamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Estacionamento | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ 
    nome: '', 
    responsavel: '', 
    email: '', 
    telefone: '', 
    logo_url: '',
    cnpj: '',
    endereco: '',
    horario_funcionamento: ''
  });
  const { startImpersonation } = useImpersonation();
  const navigate = useNavigate();

  const loadEstacionamentos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('estacionamentos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Erro ao carregar dados');
    } else {
      setEstacionamentos((data as Estacionamento[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadEstacionamentos(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setForm(f => ({ ...f, logo_url: publicUrl }));
      toast.success('Imagem enviada!');
    } catch (err: any) {
      toast.error('Erro ao enviar imagem: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nome || !form.responsavel || !form.email) {
      toast.error('Preencha os campos obrigatórios (*)');
      return;
    }

    try {
      if (editing) {
        const { error } = await supabase
          .from('estacionamentos')
          .update({ 
            nome: form.nome, 
            responsavel: form.responsavel, 
            email: form.email, 
            telefone: form.telefone,
            cnpj: form.cnpj,
            endereco: form.endereco,
            horario_funcionamento: form.horario_funcionamento,
            logo_url: form.logo_url || null
          } as any)
          .eq('id', editing.id);

        if (error) throw error;
        toast.success('Estacionamento atualizado!');
      } else {
        const { error } = await supabase
          .from('estacionamentos')
          .insert({ 
            nome: form.nome, 
            responsavel: form.responsavel, 
            email: form.email, 
            telefone: form.telefone,
            cnpj: form.cnpj,
            endereco: form.endereco,
            horario_funcionamento: form.horario_funcionamento,
            logo_url: form.logo_url || null,
            status: 'ativo'
          } as any);

        if (error) throw error;
        toast.success('Estacionamento cadastrado com sucesso!');
        toast.info('Lembre-se de criar o usuário no Auth se ainda não o fez.', { duration: 6000 });
      }

      setDialogOpen(false);
      loadEstacionamentos();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar');
    }
  };

  const toggleStatus = async (est: Estacionamento) => {
    const newStatus = est.status === 'ativo' ? 'inativo' : 'ativo';
    const { error } = await supabase
      .from('estacionamentos')
      .update({ status: newStatus })
      .eq('id', est.id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Estacionamento ${newStatus === 'ativo' ? 'ativado' : 'bloqueado'}!`);
      loadEstacionamentos();
    }
  };

  const handleDelete = async (est: Estacionamento) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o estacionamento "${est.nome}"?`)) return;

    const { error } = await supabase
      .from('estacionamentos')
      .delete()
      .eq('id', est.id);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Estacionamento removido');
      loadEstacionamentos();
    }
  };

  const handleImpersonate = (est: Estacionamento) => {
    startImpersonation(est.id, est.nome);
    navigate('/');
    toast.info(`Modo suporte: ${est.nome}`, { icon: <Shield className="w-4 h-4" /> });
  };

  const openEdit = (est: Estacionamento) => {
    setEditing(est);
    setForm({ 
      nome: est.nome, 
      responsavel: est.responsavel, 
      email: est.email, 
      telefone: est.telefone || '',
      logo_url: est.logo_url || '',
      cnpj: est.cnpj || '',
      endereco: est.endereco || '',
      horario_funcionamento: est.horario_funcionamento || ''
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ 
      nome: '', 
      responsavel: '', 
      email: '', 
      telefone: '', 
      logo_url: '',
      cnpj: '',
      endereco: '',
      horario_funcionamento: ''
    });
    setDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            Painel Mestre
          </h1>
          <p className="text-muted-foreground mt-1">Gestão de unidades e permissões</p>
        </div>
        <Button onClick={openCreate} className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-5 h-5 mr-1" /> Novo Estacionamento
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-muted rounded-t-xl" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : estacionamentos.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border-2 border-dashed flex flex-col items-center justify-center space-y-4">
          <Building2 className="w-12 h-12 text-muted-foreground/50" />
          <div>
            <p className="text-xl font-semibold">Nenhum estacionamento</p>
            <p className="text-muted-foreground">Comece cadastrando a primeira unidade</p>
          </div>
          <Button variant="outline" onClick={openCreate}>Cadastrar Unidade</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estacionamentos.map(est => (
            <Card key={est.id} className={`group overflow-hidden transition-all hover:shadow-xl border-t-4 ${est.status === 'ativo' ? 'border-t-success' : 'border-t-warning'}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex items-center justify-center border shadow-inner">
                    {est.logo_url ? (
                      <img src={est.logo_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <Badge variant={est.status === 'ativo' ? 'default' : 'secondary'} className={est.status === 'ativo' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'}>
                    {est.status === 'ativo' ? 'Ativo' : 'Bloqueado'}
                  </Badge>
                </div>
                <CardTitle className="text-xl mt-4 font-heading">{est.nome}</CardTitle>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {est.responsavel}</span>
                  <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {est.email}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 border-t bg-muted/30">
                <div className="grid grid-cols-4 gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-full" onClick={() => openEdit(est)} title="Editar">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-10 w-full ${est.status === 'ativo' ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/10'}`} 
                    onClick={() => toggleStatus(est)} 
                    title={est.status === 'ativo' ? 'Bloquear Acesso' : 'Ativar Acesso'}
                  >
                    <Power className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-full text-primary hover:bg-primary/10" onClick={() => handleImpersonate(est)} title="Acessar como Unidade">
                    <Globe className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-full text-destructive hover:bg-destructive/10" onClick={() => handleDelete(est)} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">{editing ? 'Configurar Unidade' : 'Novo Estacionamento'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-primary">Instruções de Acesso:</p>
                <p className="text-muted-foreground">
                  Após cadastrar os dados abaixo, você deve criar o usuário manualmente na aba <strong>Authentication</strong> do Supabase usando o mesmo e-mail.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5"><Building2 className="w-4 h-4 text-primary" /> Nome do Local *</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Unidade Centro" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5"><User className="w-4 h-4 text-primary" /> Responsável *</label>
                <Input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome do gestor" className="rounded-xl h-11" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5"><Mail className="w-4 h-4 text-primary" /> E-mail de Login *</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@estacionamento.com" className="rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary" /> Telefone</label>
                <Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(00) 00000-0000" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">CNPJ</label>
                <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" className="rounded-xl h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">Endereço</label>
              <Input value={form.endereco} onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))} placeholder="Rua, Número, Bairro, Cidade" className="rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">Horário de Funcionamento</label>
                <Input value={form.horario_funcionamento} onChange={e => setForm(f => ({ ...f, horario_funcionamento: e.target.value }))} placeholder="Ex: 08:00 às 18:00" className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5"><Camera className="w-4 h-4 text-primary" /> Logo do Local</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full h-11 rounded-xl gap-2 overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : form.logo_url ? (
                    "Trocar Logo"
                  ) : (
                    "Selecionar Imagem"
                  )}
                </Button>
              </div>
            </div>

            {form.logo_url && (
              <div className="flex items-center gap-2 p-2 border rounded-xl bg-muted/30">
                <img src={form.logo_url} className="w-10 h-10 rounded-lg object-cover" alt="Preview" />
                <span className="text-[10px] text-muted-foreground truncate">Logo selecionada com sucesso</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => setForm(f => ({ ...f, logo_url: '' }))}>
                  <Trash2 className="w-3 h-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl h-11">Cancelar</Button>
            <Button onClick={handleSave} className="rounded-xl h-11 px-8 shadow-lg shadow-primary/20">
              {editing ? 'Salvar Configurações' : 'Criar Estacionamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
