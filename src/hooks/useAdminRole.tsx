import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { withRetry } from '@/lib/retry';

interface AdminRoleState {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  isRetrying: boolean;
}

export const useAdminRole = (): AdminRoleState => {
  const { user } = useAuth();
  const [state, setState] = useState<AdminRoleState>({
    isAdmin: false,
    loading: true,
    error: null,
    isRetrying: false,
  });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setState({ isAdmin: false, loading: false, error: null, isRetrying: false });
        return;
      }

      try {
        const data = await withRetry(
          async () => {
            const { data, error } = await supabase.rpc('has_role', {
              _user_id: user.id,
              _role: 'admin',
            });

            if (error) throw error;
            return data;
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
            onRetry: (error, attempt) => {
              if (mountedRef.current) {
                setState(prev => ({ ...prev, isRetrying: true }));
                console.log(`Retry attempt ${attempt} for admin role check`);
              }
            },
          }
        );

        if (mountedRef.current) {
          setState({ isAdmin: data === true, loading: false, error: null, isRetrying: false });
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        if (mountedRef.current) {
          setState({
            isAdmin: false,
            loading: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            isRetrying: false,
          });
        }
      }
    };

    checkAdminRole();
  }, [user]);

  return state;
};
