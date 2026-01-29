import { useQuery } from '@tanstack/react-query';

import { useAuthContext } from '@/hooks/contexts/use-auth-context';
import { getOrCreateTenantMembership } from '@/lib/supabase-queries';

export const useTenant = () => {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ['tenant', user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado.');
      }
      return getOrCreateTenantMembership(user.id);
    },
    enabled: !!user?.id,
  });
};
