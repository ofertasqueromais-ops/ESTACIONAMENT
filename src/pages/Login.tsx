import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [estNome, setEstNome] = useState<string | null>(null);

  // Dynamic logo fetching
  useEffect(() => {
    const fetchLogo = async () => {
      if (email.includes('@') && email.includes('.')) {
        const { data } = await supabase
          .from('estacionamentos')
          .select('nome, logo_url')
          .eq('email', email.toLowerCase())
          .maybeSingle();
        
        if (data) {
          setLogoUrl(data.logo_url);
          setEstNome(data.nome);
        } else {
          setLogoUrl(null);
          setEstNome(null);
        }
      } else {
        setLogoUrl(null);
        setEstNome(null);
      }
    };

    const timer = setTimeout(fetchLogo, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-500">
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary">
        <CardHeader className="text-center space-y-4">
          {logoUrl ? (
            <div className="mx-auto w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg animate-in zoom-in duration-300">
              <img src={logoUrl} alt={estNome || 'Logo'} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-4" /> // Spacer when no logo
          )}
          <div className="space-y-1">
            <CardTitle className="text-2xl font-heading font-bold">
              {estNome || 'Acesso ao Sistema'}
            </CardTitle>
            <p className="text-muted-foreground text-sm">Gerenciamento de Estacionamento</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium px-1">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium px-1">Senha</label>
              <Input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="rounded-xl h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 mt-2" disabled={loading}>
              {loading ? 'Autenticando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
