import { Button, Card, Group, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import * as React from 'react';

import { useTenant } from '@/hooks/app/use-tenant';
import { useCategories } from '@/hooks/expenses/use-categories';
import { useExpenses } from '@/hooks/expenses/use-expenses';
import { useProfiles } from '@/hooks/expenses/use-profiles';
import type { ExpenseFilters } from '@/lib/supabase-queries';

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

export const SummaryPage = () => {
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

  const summary = React.useMemo(() => {
    const categoryMap = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        totalUsd: number;
        totalArs: number;
        subcategories: Map<string, { name: string; totalUsd: number; totalArs: number }>;
      }
    >();

    expenses.forEach((expense) => {
      const categoryId = expense.category_id;
      const categoryName =
        expense.category?.name ||
        categories.find((category) => category.id === categoryId)?.name ||
        'Sin categoría';
      const categoryEntry =
        categoryMap.get(categoryId) ||
        {
          categoryId,
          categoryName,
          totalUsd: 0,
          totalArs: 0,
          subcategories: new Map(),
        };

      categoryEntry.totalUsd += expense.amount_usd;
      categoryEntry.totalArs += expense.amount_ars;

      const subcategoryId = expense.subcategory_id || 'none';
      const subcategoryName =
        expense.subcategory?.name ||
        subcategories.find((subcategory) => subcategory.id === expense.subcategory_id)?.name ||
        'Sin subcategoría';
      const subcategoryEntry = categoryEntry.subcategories.get(subcategoryId) || {
        name: subcategoryName,
        totalUsd: 0,
        totalArs: 0,
      };

      subcategoryEntry.totalUsd += expense.amount_usd;
      subcategoryEntry.totalArs += expense.amount_ars;
      categoryEntry.subcategories.set(subcategoryId, subcategoryEntry);
      categoryMap.set(categoryId, categoryEntry);
    });

    return Array.from(categoryMap.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [expenses, categories, subcategories]);

  const totalUsd = expenses.reduce((total, expense) => total + expense.amount_usd, 0);
  const totalArs = expenses.reduce((total, expense) => total + expense.amount_ars, 0);

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', categoryId: '', userId: '', currencyCode: '' });
  };

  return (
    <Stack gap="md">
      <Title order={3}>Resumen</Title>

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
          <Group justify="space-between">
            <Text size="sm" fw={600}>
              Total filtrado: {totalUsd.toFixed(2)} USD · {totalArs.toFixed(2)} ARS
            </Text>
            <Button variant="light" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          </Group>
        </Stack>
      </Card>

      {isLoading ? (
        <Text size="sm" c="dimmed">
          Cargando resumen...
        </Text>
      ) : null}

      {!isLoading && summary.length === 0 ? (
        <Text size="sm" c="dimmed">
          No hay gastos que coincidan con los filtros.
        </Text>
      ) : null}

      <Stack gap="sm">
        {summary.map((category) => {
          const subcategoriesList = Array.from(category.subcategories.values()).sort((a, b) =>
            a.name.localeCompare(b.name)
          );

          return (
            <Card key={category.categoryId} withBorder radius="md" padding="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600}>{category.categoryName}</Text>
                  <Text size="sm" fw={600}>
                    {category.totalUsd.toFixed(2)} USD · {category.totalArs.toFixed(2)} ARS
                  </Text>
                </Group>
                <Table withTableBorder>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Subcategoría</Table.Th>
                      <Table.Th>USD</Table.Th>
                      <Table.Th>ARS</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {subcategoriesList.map((subcategory) => (
                      <Table.Tr key={`${category.categoryId}-${subcategory.name}`}>
                        <Table.Td>{subcategory.name}</Table.Td>
                        <Table.Td>{subcategory.totalUsd.toFixed(2)}</Table.Td>
                        <Table.Td>{subcategory.totalArs.toFixed(2)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Stack>
  );
};
