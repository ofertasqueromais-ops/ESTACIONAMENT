import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type AppRole = 'mestre' | 'admin' | 'staff';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [estacionamentoId, setEstacionamentoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRoleAndStatus() {
      if (!user) {
        setRole(null);
        setStatus(null);
        setEstacionamentoId(null);
        setLoading(false);
        return;
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const currentRole = roleData?.role as AppRole;
      setRole(currentRole ?? null);

      // Fetch parking lot data based on email
      const { data: estData } = await supabase
        .from('estacionamentos')
        .select('id, status')
        .eq('email', user.email)
        .maybeSingle();
      
      if (estData) {
        setEstacionamentoId(estData.id);
        setStatus(estData.status);
      } else {
        setStatus('ativo'); // Default for mestre or items without entry
      }

      setLoading(false);
    }

    getRoleAndStatus();
  }, [user]);

  const isBlocked = status === 'inativo';

  return { 
    role, 
    loading, 
    estacionamentoId,
    isMaster: role === 'mestre', 
    isAdmin: role === 'admin', 
    isStaff: role === 'staff',
    isBlocked 
  };
}
