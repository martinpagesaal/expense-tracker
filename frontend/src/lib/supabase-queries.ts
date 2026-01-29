import { supabase } from '@/lib/supabase';
import type { Category, Expense, Profile, Subcategory, TenantUser } from '@/lib/types';

const FX_CACHE_HOURS = 12;

const toIsoStartOfDay = (date: string) => `${date}T00:00:00.000Z`;
const toIsoEndOfDay = (date: string) => `${date}T23:59:59.999Z`;

export const getOrCreateTenantMembership = async (userId: string) => {
  const { data: membership, error: membershipError } = await supabase
    .from('tenant_users')
    .select('tenant_id,user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (membership?.tenant_id) {
    return membership as TenantUser;
  }

  const { error: joinError } = await supabase.rpc('join_default_tenant');

  if (joinError) {
    throw joinError;
  }

  const { data: joined, error: joinedError } = await supabase
    .from('tenant_users')
    .select('tenant_id,user_id')
    .eq('user_id', userId)
    .single();

  if (joinedError) {
    throw joinedError;
  }

  return joined as TenantUser;
};

export const fetchCategories = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id,name')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as Category[];
};

export const fetchSubcategories = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('subcategories')
    .select('id,name,category_id')
    .eq('tenant_id', tenantId)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as Subcategory[];
};

export const createCategory = async (tenantId: string, name: string) => {
  const { data, error } = await supabase
    .from('categories')
    .insert({ tenant_id: tenantId, name })
    .select('id,name')
    .single();

  if (error) {
    throw error;
  }

  return data as Category;
};

export const createSubcategory = async (tenantId: string, categoryId: string, name: string) => {
  const { data, error } = await supabase
    .from('subcategories')
    .insert({ tenant_id: tenantId, category_id: categoryId, name })
    .select('id,name,category_id')
    .single();

  if (error) {
    throw error;
  }

  return data as Subcategory;
};

export const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name')
    .order('display_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Profile[];
};

export type ExpenseFilters = {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  userId?: string;
  currencyCode?: string;
  limit?: number;
};

export const fetchExpenses = async (tenantId: string, filters: ExpenseFilters = {}) => {
  let query = supabase
    .from('expenses')
    .select(
      'id,tenant_id,category_id,subcategory_id,amount_original,currency_code,fx_rate_to_usd,amount_usd,note,created_by,created_at,category:categories(id,name),subcategory:subcategories(id,name)'
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  if (filters.userId) {
    query = query.eq('created_by', filters.userId);
  }

  if (filters.currencyCode) {
    query = query.eq('currency_code', filters.currencyCode);
  }

  if (filters.startDate) {
    query = query.gte('created_at', toIsoStartOfDay(filters.startDate));
  }

  if (filters.endDate) {
    query = query.lte('created_at', toIsoEndOfDay(filters.endDate));
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as Expense[];
};

export const getFxRateToUsd = async (currencyCode: string) => {
  if (currencyCode === 'USD') {
    return 1;
  }

  const { data: cached, error: cachedError } = await supabase
    .from('fx_rates')
    .select('quote_currency,rate_to_usd,fetched_at')
    .eq('quote_currency', currencyCode)
    .maybeSingle();

  if (cachedError) {
    throw cachedError;
  }

  if (cached?.rate_to_usd) {
    const fetchedAt = new Date(cached.fetched_at);
    const hoursDiff = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
    if (hoursDiff <= FX_CACHE_HOURS) {
      return cached.rate_to_usd;
    }
  }

  const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    throw new Error('Falta configurar la API key de tipo de cambio.');
  }

  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/pair/USD/${currencyCode}`
  );
  if (!response.ok) {
    throw new Error('No se pudo obtener la tasa de cambio.');
  }

  const payload = (await response.json()) as { conversion_rate?: number; result?: string };
  const rateFromUsd = payload?.conversion_rate;
  if (!rateFromUsd) {
    throw new Error('La moneda seleccionada no tiene tasa disponible.');
  }

  const rateToUsd = 1 / rateFromUsd;

  const { error: upsertError } = await supabase.from('fx_rates').upsert({
    quote_currency: currencyCode,
    rate_to_usd: rateToUsd,
    fetched_at: new Date().toISOString(),
  });

  if (upsertError) {
    throw upsertError;
  }

  return rateToUsd;
};

export const createExpense = async ({
  tenantId,
  categoryId,
  subcategoryId,
  amount,
  currencyCode,
  note,
}: {
  tenantId: string;
  categoryId: string;
  subcategoryId: string | null;
  amount: number;
  currencyCode: string;
  note?: string;
}) => {
  const fxRate = await getFxRateToUsd(currencyCode);
  const amountUsd = Number((amount * fxRate).toFixed(2));

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      tenant_id: tenantId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      amount_original: amount,
      currency_code: currencyCode,
      fx_rate_to_usd: fxRate,
      amount_usd: amountUsd,
      note: note ?? null,
    })
    .select(
      'id,tenant_id,category_id,subcategory_id,amount_original,currency_code,fx_rate_to_usd,amount_usd,note,created_by,created_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Expense;
};
