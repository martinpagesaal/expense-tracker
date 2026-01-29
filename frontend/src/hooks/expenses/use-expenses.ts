import { useQuery } from '@tanstack/react-query';

import type { ExpenseFilters } from '@/lib/supabase-queries';
import { fetchExpenses } from '@/lib/supabase-queries';

export const useExpenses = (tenantId?: string, filters: ExpenseFilters = {}) => {
  return useQuery({
    queryKey: ['expenses', tenantId, filters],
    queryFn: () => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return fetchExpenses(tenantId, filters);
    },
    enabled: !!tenantId,
  });
};
