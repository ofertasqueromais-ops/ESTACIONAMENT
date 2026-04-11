import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NavLink } from '@/components/NavLink';
import { LogOut, LayoutDashboard, Users, Wallet, FileText } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <img src="/logo-pereira.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-heading font-bold text-lg">Pereira</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary transition-colors">
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
          <NavLink to="/" className="flex flex-col items-center gap-0.5 p-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
