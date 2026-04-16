import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useImpersonation } from '@/hooks/useImpersonation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';
import { LogOut, LayoutDashboard, Users, Wallet, FileText, Shield, X, AlertTriangle } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const { isMaster } = useUserRole();
  const { isImpersonating, impersonatedEstacionamentoNome, impersonatedEstacionamentoId, stopImpersonation } = useImpersonation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [estNome, setEstNome] = useState<string>('Pereira');

  useEffect(() => {
    const fetchLogo = async () => {
      const targetEmail = user?.email;
      
      // Se estiver personificando, busca os dados daquela unidade
      if (isImpersonating && impersonatedEstacionamentoId) {
        const { data } = await supabase
          .from('estacionamentos')
          .select('nome, logo_url')
          .eq('id', impersonatedEstacionamentoId)
          .maybeSingle();
        if (data) {
          setLogoUrl(data.logo_url);
          setEstNome(data.nome);
        }
        return;
      }

      // Caso contrário, busca os dados do usuário logado
      if (targetEmail) {
        const { data } = await supabase
          .from('estacionamentos')
          .select('nome, logo_url')
          .eq('email', targetEmail)
          .maybeSingle();
        if (data) {
          setLogoUrl(data.logo_url);
          setEstNome(data.nome);
        } else {
          setLogoUrl(null);
          setEstNome('Pereira');
        }
      }
    };

    fetchLogo();
  }, [user, isImpersonating, impersonatedEstacionamentoId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Impersonation banner */}
      {isImpersonating && (
        <div className="bg-warning text-warning-foreground text-center text-xs py-2 px-4 flex items-center justify-center gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">MODO SUPORTE ATIVO:</span>
            <span className="bg-warning-foreground/10 px-2 py-0.5 rounded-md font-bold">{impersonatedEstacionamentoNome}</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent border-warning-foreground/20 hover:bg-warning-foreground/10 text-warning-foreground gap-1.5" onClick={stopImpersonation}>
            <X className="w-3 h-3" /> Encerrar Acesso
          </Button>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary border shadow-sm flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt={estNome} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-5 h-5 text-primary/50" />
              )}
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">{estNome}</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {isMaster && !isImpersonating && (
              <NavLink to="/admin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                <Shield className="w-4 h-4" /> Admin
              </NavLink>
            )}
            {(isMaster && isImpersonating) || !isMaster ? (
              <>
                <NavLink to={isMaster ? "/patio" : "/"} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                  <LayoutDashboard className="w-4 h-4" /> Pátio
                </NavLink>
                <NavLink to="/caixa" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                  <Wallet className="w-4 h-4" /> Caixa
                </NavLink>
                <NavLink to="/recibos" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                  <FileText className="w-4 h-4" /> Recibos
                </NavLink>
                <NavLink to="/mensalistas" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
                  <Users className="w-4 h-4" /> Mensalistas
                </NavLink>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md">
        <div className="flex justify-around py-2">
          {isMaster && !isImpersonating ? (
            <NavLink to="/admin" className="flex flex-col items-center gap-0.5 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Shield className="w-5 h-5" />
              Admin
            </NavLink>
          ) : (
            <>
              <NavLink to={isMaster ? "/patio" : "/"} className="flex flex-col items-center gap-0.5 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <LayoutDashboard className="w-5 h-5" />
                Pátio
              </NavLink>
              <NavLink to="/caixa" className="flex flex-col items-center gap-0.5 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Wallet className="w-5 h-5" />
                Caixa
              </NavLink>
              <NavLink to="/recibos" className="flex flex-col items-center gap-0.5 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <FileText className="w-5 h-5" />
                Recibos
              </NavLink>
              <NavLink to="/mensalistas" className="flex flex-col items-center gap-0.5 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Users className="w-5 h-5" />
                Mensalistas
              </NavLink>
            </>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
