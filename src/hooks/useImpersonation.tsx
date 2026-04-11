import { createContext, useContext, useState, ReactNode } from 'react';

interface ImpersonationContextType {
  impersonatedEstacionamentoId: string | null;
  impersonatedEstacionamentoNome: string | null;
  startImpersonation: (id: string, nome: string) => void;
  stopImpersonation: () => void;
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  impersonatedEstacionamentoId: null,
  impersonatedEstacionamentoNome: null,
  startImpersonation: () => {},
  stopImpersonation: () => {},
  isImpersonating: false,
});

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [estId, setEstId] = useState<string | null>(null);
  const [estNome, setEstNome] = useState<string | null>(null);

  return (
    <ImpersonationContext.Provider
      value={{
        impersonatedEstacionamentoId: estId,
        impersonatedEstacionamentoNome: estNome,
        startImpersonation: (id, nome) => { setEstId(id); setEstNome(nome); },
        stopImpersonation: () => { setEstId(null); setEstNome(null); },
        isImpersonating: !!estId,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
