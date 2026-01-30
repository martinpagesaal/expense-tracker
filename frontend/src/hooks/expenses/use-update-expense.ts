import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateExpense } from '@/lib/supabase-queries';

export const useUpdateExpense = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      expenseId,
      categoryId,
      subcategoryId,
      paymentMethodId,
      expenseDate,
      amount,
      currencyCode,
      note,
    }: {
      expenseId: string;
      categoryId: string;
      subcategoryId: string | null;
      paymentMethodId: string | null;
      expenseDate: string;
      amount: number;
      currencyCode: string;
      note?: string;
    }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return updateExpense({
        expenseId,
        tenantId,
        categoryId,
        subcategoryId,
        paymentMethodId,
        expenseDate,
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
