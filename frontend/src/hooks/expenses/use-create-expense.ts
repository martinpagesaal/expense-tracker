import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createExpense } from '@/lib/supabase-queries';

export const useCreateExpense = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      subcategoryId,
      amount,
      currencyCode,
      note,
    }: {
      categoryId: string;
      subcategoryId: string | null;
      amount: number;
      currencyCode: string;
      note?: string;
    }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return createExpense({
        tenantId,
        categoryId,
        subcategoryId,
        amount,
        currencyCode,
        note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', tenantId] });
    },
  });
};
