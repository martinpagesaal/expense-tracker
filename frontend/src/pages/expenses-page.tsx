import { Button, Card, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import * as React from 'react';

import { useTenant } from '@/hooks/app/use-tenant';
import { useCategories } from '@/hooks/expenses/use-categories';
import { useExpenses } from '@/hooks/expenses/use-expenses';
import { useProfiles } from '@/hooks/expenses/use-profiles';
import type { ExpenseFilters } from '@/lib/supabase-queries';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const currencyFilterOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'MXN', label: 'MXN' },
  { value: 'COP', label: 'COP' },
  { value: 'ARS', label: 'ARS' },
  { value: 'CLP', label: 'CLP' },
  { value: 'PEN', label: 'PEN' },
  { value: 'BRL', label: 'BRL' },
  { value: 'EUR', label: 'EUR' },
];

export const ExpensesPage = () => {
  const { data: tenantUser } = useTenant();
  const { data: categoriesData } = useCategories(tenantUser?.tenant_id);
  const { data: profiles = [] } = useProfiles();

  const [filters, setFilters] = React.useState<ExpenseFilters>({
    startDate: '',
    endDate: '',
    categoryId: '',
    userId: '',
    currencyCode: '',
  });

  const { data: expenses = [], isLoading } = useExpenses(tenantUser?.tenant_id, {
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    categoryId: filters.categoryId || undefined,
    userId: filters.userId || undefined,
    currencyCode: filters.currencyCode || undefined,
  });

  const categories = categoriesData?.categories ?? [];
  const subcategories = categoriesData?.subcategories ?? [];
  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile.display_name || profile.id])
  );

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', categoryId: '', userId: '', currencyCode: '' });
  };

  return (
    <Stack gap="md">
      <Title order={3}>Gastos</Title>

      <Card withBorder radius="md" padding="md">
        <Stack gap="sm">
          <Group grow>
            <TextInput
              type="date"
              label="Desde"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, startDate: event.currentTarget.value }))
              }
            />
            <TextInput
              type="date"
              label="Hasta"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, endDate: event.currentTarget.value }))
              }
            />
          </Group>
          <Select
            label="Categoría"
            placeholder="Todas"
            data={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            value={filters.categoryId || null}
            onChange={(value) => setFilters((prev) => ({ ...prev, categoryId: value || '' }))}
            searchable
            clearable
          />
          <Select
            label="Usuario"
            placeholder="Todos"
            data={profiles.map((profile) => ({
              value: profile.id,
              label: profile.display_name || profile.id,
            }))}
            value={filters.userId || null}
            onChange={(value) => setFilters((prev) => ({ ...prev, userId: value || '' }))}
            searchable
            clearable
          />
          <Select
            label="Moneda"
            placeholder="Todas"
            data={currencyFilterOptions}
            value={filters.currencyCode || null}
            onChange={(value) => setFilters((prev) => ({ ...prev, currencyCode: value || '' }))}
            clearable
          />
          <Button variant="light" onClick={resetFilters}>
            Limpiar filtros
          </Button>
        </Stack>
      </Card>

      {isLoading ? (
        <Text size="sm" c="dimmed">
          Cargando gastos...
        </Text>
      ) : null}

      {!isLoading && expenses.length === 0 ? (
        <Text size="sm" c="dimmed">
          No hay gastos que coincidan con los filtros.
        </Text>
      ) : null}

      <Stack gap="sm">
        {expenses.map((expense) => {
          const createdByLabel = profileMap.get(expense.created_by) || 'Usuario';
          const subcategoryName =
            expense.subcategory?.name ||
            subcategories.find((subcategory) => subcategory.id === expense.subcategory_id)?.name;

          return (
            <Card key={expense.id} withBorder radius="md" padding="md">
              <Stack gap={6}>
                <Group justify="space-between">
                  <Text fw={600}>
                    {expense.category?.name}
                    {subcategoryName ? ` / ${subcategoryName}` : ''}
                  </Text>
                  <Text fw={600}>
                    {expense.amount_original.toFixed(2)} {expense.currency_code}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {createdByLabel} · {formatDate(expense.created_at)}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {expense.amount_usd.toFixed(2)} USD
                  </Text>
                </Group>
                {expense.note ? (
                  <Text size="sm" c="dimmed">
                    {expense.note}
                  </Text>
                ) : null}
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};
