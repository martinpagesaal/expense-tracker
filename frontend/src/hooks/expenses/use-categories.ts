import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCategory,
  createSubcategory,
  fetchCategories,
  fetchSubcategories,
  updateCategory,
  updateSubcategory,
} from '@/lib/supabase-queries';

export const useCategories = (tenantId?: string) => {
  return useQuery({
    queryKey: ['categories', tenantId],
    queryFn: async () => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }

      const [categories, subcategories] = await Promise.all([
        fetchCategories(tenantId),
        fetchSubcategories(tenantId),
      ]);

      return { categories, subcategories };
    },
    enabled: !!tenantId,
  });
};

export const useCreateCategory = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return createCategory(tenantId, name);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
      }
    },
  });
};

export const useCreateSubcategory = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string; name: string }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return createSubcategory(tenantId, categoryId, name);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
      }
    },
  });
};

export const useUpdateCategory = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ categoryId, name }: { categoryId: string; name: string }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return updateCategory(tenantId, categoryId, name);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
      }
    },
  });
};

export const useUpdateSubcategory = (tenantId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subcategoryId, name }: { subcategoryId: string; name: string }) => {
      if (!tenantId) {
        throw new Error('Tenant no disponible.');
      }
      return updateSubcategory(tenantId, subcategoryId, name);
    },
    onSuccess: () => {
      if (tenantId) {
        queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
      }
    },
  });
};
