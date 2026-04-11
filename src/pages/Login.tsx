import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Car } from 'lucide-react';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success('Conta criada! Verifique seu e-mail.');
      } else {
        await signIn(email, password);
        toast.success('Login realizado com sucesso!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-heading">ParkFlow</CardTitle>
          <p className="text-muted-foreground text-sm">Sistema de Gerenciamento de Estacionamento</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-center mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? 'Já tem conta? Faça login' : 'Não tem conta? Cadastre-se'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
