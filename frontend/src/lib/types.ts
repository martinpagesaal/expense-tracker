export type Tenant = {
  id: string;
  name: string;
  is_default: boolean;
};

export type TenantUser = {
  tenant_id: string;
  user_id: string;
};

export type Category = {
  id: string;
  name: string;
};

export type Subcategory = {
  id: string;
  name: string;
  category_id: string;
};

export type Expense = {
  id: string;
  tenant_id: string;
  category_id: string;
  subcategory_id: string | null;
  payment_method_id: string | null;
  expense_date: string;
  amount_original: number;
  currency_code: string;
  fx_rate_to_usd: number;
  amount_usd: number;
  amount_ars: number;
  note: string | null;
  created_by: string;
  created_at: string;
  category?: Category;
  subcategory?: Subcategory | null;
  payment_method?: PaymentMethod | null;
};

export type PaymentMethod = {
  id: string;
  name: string;
  is_active: boolean;
};

export type FxRate = {
  quote_currency: string;
  rate_to_usd: number;
  rate_to_ars: number;
  fetched_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
};
