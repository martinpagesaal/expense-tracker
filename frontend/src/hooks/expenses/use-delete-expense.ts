import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteExpense } from '@/lib/supabase-queries';

export const useDeleteExpense = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: { expenseId: string }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return deleteExpense({ expenseId, tenantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tenantId] });
    },
  });
};
