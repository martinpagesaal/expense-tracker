import { supabase } from '@/lib/supabase';
import type {
  Category,
  Expense,
  PaymentMethod,
  Profile,
  Subcategory,
  TenantUser,
} from '@/lib/types';

const FX_CACHE_HOURS = 12;
const ARS_CODE = 'ARS';
const USD_CODE = 'USD';

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

export const updateCategory = async (tenantId: string, categoryId: string, name: string) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('tenant_id', tenantId)
    .eq('id', categoryId)
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

export const updateSubcategory = async (tenantId: string, subcategoryId: string, name: string) => {
  const { data, error } = await supabase
    .from('subcategories')
    .update({ name })
    .eq('tenant_id', tenantId)
    .eq('id', subcategoryId)
    .select('id,name,category_id')
    .single();

  if (error) {
    throw error;
  }

  return data as Subcategory;
};

export const fetchPaymentMethods = async (tenantId: string) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('id,name,is_active')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  if (error) {
    throw error;
  }

  return (data ?? []) as PaymentMethod[];
};

export const createPaymentMethod = async (tenantId: string, name: string) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert({ tenant_id: tenantId, name })
    .select('id,name,is_active')
    .single();

  if (error) {
    throw error;
  }

  return data as PaymentMethod;
};

export const updatePaymentMethod = async (
  tenantId: string,
  paymentMethodId: string,
  name: string
) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .update({ name })
    .eq('tenant_id', tenantId)
    .eq('id', paymentMethodId)
    .select('id,name,is_active')
    .single();

  if (error) {
    throw error;
  }

  return data as PaymentMethod;
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
      'id,tenant_id,category_id,subcategory_id,payment_method_id,expense_date,amount_original,currency_code,fx_rate_to_usd,amount_usd,amount_ars,note,created_by,created_at,category:categories(id,name),subcategory:subcategories(id,name),payment_method:payment_methods(id,name)'
    )
    .eq('tenant_id', tenantId)
    .order('expense_date', { ascending: false });

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
    query = query.gte('expense_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('expense_date', filters.endDate);
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

export const getFxRates = async (currencyCode: string) => {
  const normalizedCode = currencyCode.toUpperCase();
  const { data: cached, error: cachedError } = await supabase
    .from('fx_rates')
    .select('quote_currency,rate_to_usd,rate_to_ars,fetched_at')
    .eq('quote_currency', normalizedCode)
    .maybeSingle();

  if (cachedError) {
    throw cachedError;
  }

  if (cached?.rate_to_usd && cached?.rate_to_ars) {
    const fetchedAt = new Date(cached.fetched_at);
    const hoursDiff = (Date.now() - fetchedAt.getTime()) / (1000 * 60 * 60);
    if (hoursDiff <= FX_CACHE_HOURS) {
      return { rateToUsd: cached.rate_to_usd, rateToArs: cached.rate_to_ars };
    }
  }

  const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    throw new Error('Falta configurar la API key de tipo de cambio.');
  }

  const response = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${normalizedCode}`
  );
  if (!response.ok) {
    throw new Error('No se pudo obtener la tasa de cambio.');
  }

  const payload = (await response.json()) as {
    conversion_rates?: Record<string, number>;
    result?: string;
  };
  const rates = payload?.conversion_rates;
  if (!rates) {
    throw new Error('La moneda seleccionada no tiene tasa disponible.');
  }

  const rateToUsd = normalizedCode === USD_CODE ? 1 : rates[USD_CODE];
  const rateToArs = normalizedCode === ARS_CODE ? 1 : rates[ARS_CODE];

  if (!rateToUsd || !rateToArs) {
    throw new Error('No se pudo convertir a USD o ARS.');
  }

  const { error: upsertError } = await supabase.from('fx_rates').upsert(
    {
      quote_currency: normalizedCode,
      rate_to_usd: rateToUsd,
      rate_to_ars: rateToArs,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'quote_currency' }
  );

  if (upsertError) {
    throw upsertError;
  }

  return { rateToUsd, rateToArs };
};

export const createExpense = async ({
  tenantId,
  categoryId,
  subcategoryId,
  paymentMethodId,
  expenseDate,
  amount,
  currencyCode,
  note,
}: {
  tenantId: string;
  categoryId: string;
  subcategoryId: string | null;
  paymentMethodId: string | null;
  expenseDate: string;
  amount: number;
  currencyCode: string;
  note?: string;
}) => {
  const { rateToUsd, rateToArs } = await getFxRates(currencyCode);
  const amountUsd = Number((amount * rateToUsd).toFixed(2));
  const amountArs = Number((amount * rateToArs).toFixed(2));

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      tenant_id: tenantId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      payment_method_id: paymentMethodId,
      expense_date: expenseDate,
      amount_original: amount,
      currency_code: currencyCode,
      fx_rate_to_usd: rateToUsd,
      amount_usd: amountUsd,
      amount_ars: amountArs,
      note: note ?? null,
    })
    .select(
      'id,tenant_id,category_id,subcategory_id,payment_method_id,expense_date,amount_original,currency_code,fx_rate_to_usd,amount_usd,amount_ars,note,created_by,created_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Expense;
};

export const updateExpense = async ({
  expenseId,
  tenantId,
  categoryId,
  subcategoryId,
  paymentMethodId,
  expenseDate,
  amount,
  currencyCode,
  note,
}: {
  expenseId: string;
  tenantId: string;
  categoryId: string;
  subcategoryId: string | null;
  paymentMethodId: string | null;
  expenseDate: string;
  amount: number;
  currencyCode: string;
  note?: string;
}) => {
  const { rateToUsd, rateToArs } = await getFxRates(currencyCode);
  const amountUsd = Number((amount * rateToUsd).toFixed(2));
  const amountArs = Number((amount * rateToArs).toFixed(2));

  const { data, error } = await supabase
    .from('expenses')
    .update({
      tenant_id: tenantId,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      payment_method_id: paymentMethodId,
      expense_date: expenseDate,
      amount_original: amount,
      currency_code: currencyCode,
      fx_rate_to_usd: rateToUsd,
      amount_usd: amountUsd,
      amount_ars: amountArs,
      note: note ?? null,
    })
    .eq('id', expenseId)
    .select(
      'id,tenant_id,category_id,subcategory_id,payment_method_id,expense_date,amount_original,currency_code,fx_rate_to_usd,amount_usd,amount_ars,note,created_by,created_at'
    )
    .single();

  if (error) {
    throw error;
  }

  return data as Expense;
};
