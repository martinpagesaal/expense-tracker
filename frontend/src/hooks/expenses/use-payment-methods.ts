import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createPaymentMethod,
  fetchPaymentMethods,
  updatePaymentMethod,
} from '@/lib/supabase-queries';

export const usePaymentMethods = (tenantId?: string) => {
  return useQuery({
    queryKey: ['payment-methods', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return fetchPaymentMethods(tenantId);
    },
    enabled: !!tenantId,
  });
};

export const useCreatePaymentMethod = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return createPaymentMethod(tenantId, name);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['payment-methods', tenantId] });
      }
    },
  });
};

export const useUpdatePaymentMethod = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentMethodId, name }: { paymentMethodId: string; name: string }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return updatePaymentMethod(tenantId, paymentMethodId, name);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['payment-methods', tenantId] });
      }
    },
  });
};
