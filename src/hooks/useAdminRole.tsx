import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AdminRoleState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export const useAdminRole = (): AdminRoleState => {
  const { user } = useAuth();
  const [state, setState] = useState<AdminRoleState>({
    isAdmin: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setState({ isAdmin: false, loading: false, error: null });
        return;
      }

      try {
        // Use the has_role database function to check admin status server-side
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setState({ isAdmin: false, loading: false, error: error.message });
          return;
        }

        setState({ isAdmin: data === true, loading: false, error: null });
      } catch (err) {
        console.error('Error checking admin role:', err);
        setState({
          isAdmin: false,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };

    checkAdminRole();
  }, [user]);

  return state;
};
