import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ImpersonationProvider } from "@/hooks/useImpersonation";
import { useUserRole } from "@/hooks/useUserRole";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Caixa from "./pages/Caixa";
import Recibos from "./pages/Recibos";
import MensalistasPage from "./pages/Mensalistas";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import { ShieldAlert, LogOut } from "lucide-react";
import { Button } from "./components/ui/button";

const queryClient = new QueryClient();

function BlockedScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-6 animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldAlert className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-heading font-bold">Acesso Bloqueado</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Sua unidade está temporariamente suspensa. Entre em contato com a administração para regularizar seu acesso.
        </p>
      </div>
      <Button onClick={signOut} variant="outline" className="gap-2 rounded-xl">
        <LogOut className="w-4 h-4" /> Sair da Conta
      </Button>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isBlocked, loading: roleLoading } = useUserRole();
  
  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isBlocked) return <BlockedScreen />;
  
  return <AppLayout>{children}</AppLayout>;
}

function MasterRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isMaster, loading: roleLoading, isBlocked } = useUserRole();
  
  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isBlocked) return <BlockedScreen />;
  if (!isMaster) return <Navigate to="/" replace />;
  
  return <AppLayout>{children}</AppLayout>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

import { useImpersonation } from "@/hooks/useImpersonation";

function SmartRedirect() {
  const { user, loading } = useAuth();
  const { isMaster, isBlocked, loading: roleLoading } = useUserRole();
  const { isImpersonating } = useImpersonation();
  
  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (isBlocked) return <BlockedScreen />;
  
  // Se for mestre e NÃO estiver personificando, vai para o admin
  // Se estiver personificando, deixa ver o dashboard do pátio
  if (isMaster && !isImpersonating) return <Navigate to="/admin" replace />;
  if (isMaster && isImpersonating) return <AppLayout><Dashboard /></AppLayout>;
  
  return <AppLayout><Dashboard /></AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ImpersonationProvider>
            <Routes>
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/" element={<SmartRedirect />} />
              <Route path="/admin" element={<MasterRoute><AdminDashboard /></MasterRoute>} />
              <Route path="/patio" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/caixa" element={<ProtectedRoute><Caixa /></ProtectedRoute>} />
              <Route path="/recibos" element={<ProtectedRoute><Recibos /></ProtectedRoute>} />
              <Route path="/mensalistas" element={<ProtectedRoute><MensalistasPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ImpersonationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
