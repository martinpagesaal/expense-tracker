import {
  ActionIcon,
  Button,
  Card,
  Chip,
  Group,
  Modal,
  NumberInput,
  Popover,
  ScrollArea,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import * as React from 'react';

import { useTenant } from '@/hooks/app/use-tenant';
import { useAuthContext } from '@/hooks/contexts/use-auth-context';
import { useCategories } from '@/hooks/expenses/use-categories';
import { useDeleteExpense } from '@/hooks/expenses/use-delete-expense';
import { useExpenses } from '@/hooks/expenses/use-expenses';
import { usePaymentMethods } from '@/hooks/expenses/use-payment-methods';
import { useProfiles } from '@/hooks/expenses/use-profiles';
import { useUpdateExpense } from '@/hooks/expenses/use-update-expense';
import type { ExpenseFilters } from '@/lib/supabase-queries';
import type { Expense } from '@/lib/types';

const formatExpenseDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
  }).format(new Date(`${value}T00:00:00`));

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

const currencyOptions = [
  { value: 'USD', label: 'USD · Dólar' },
  { value: 'ARS', label: 'ARS · Peso argentino' },
  { value: 'BRL', label: 'BRL · Real brasileño' },
];

export const ExpensesPage = () => {
  const { user } = useAuthContext();
  const { data: tenantUser } = useTenant();
  const { data: categoriesData } = useCategories(tenantUser?.tenant_id);
  const { data: profiles = [] } = useProfiles();
  const { data: paymentMethods = [] } = usePaymentMethods(tenantUser?.tenant_id);
  const { mutateAsync: updateExpense, isPending: isUpdatingExpense } = useUpdateExpense(
    tenantUser?.tenant_id
  );
  const { mutateAsync: deleteExpense, isPending: isDeletingExpense } = useDeleteExpense(
    tenantUser?.tenant_id
  );
  const isMobile = useMediaQuery('(max-width: 768px)');

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
  const paymentMethodMap = new Map(paymentMethods.map((method) => [method.id, method.name]));

  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [editCategoryId, setEditCategoryId] = React.useState<string | null>(null);
  const [editSubcategoryId, setEditSubcategoryId] = React.useState<string | null>(null);
  const [editPaymentMethodId, setEditPaymentMethodId] = React.useState<string | null>(null);
  const [editExpenseDate, setEditExpenseDate] = React.useState('');
  const [editAmount, setEditAmount] = React.useState<number | ''>('');
  const [editCurrencyCode, setEditCurrencyCode] = React.useState<string | null>(null);
  const [editNote, setEditNote] = React.useState('');
  const [openedDeleteId, setOpenedDeleteId] = React.useState<string | null>(null);

  const editSubcategories = subcategories.filter(
    (subcategory) => subcategory.category_id === editCategoryId
  );

  const editCurrencyOptions = React.useMemo(() => {
    if (
      editingExpense &&
      !currencyOptions.some((option) => option.value === editingExpense.currency_code)
    ) {
      return [
        ...currencyOptions,
        { value: editingExpense.currency_code, label: editingExpense.currency_code },
      ];
    }
    return currencyOptions;
  }, [editingExpense]);

  const resetFilters = () => {
    setFilters({ startDate: '', endDate: '', categoryId: '', userId: '', currencyCode: '' });
  };

  React.useEffect(() => {
    if (!editingExpense) {
      return;
    }
    setEditCategoryId(editingExpense.category_id);
    setEditSubcategoryId(editingExpense.subcategory_id ?? null);
    setEditPaymentMethodId(editingExpense.payment_method_id ?? null);
    setEditExpenseDate(editingExpense.expense_date);
    setEditAmount(editingExpense.amount_original);
    setEditCurrencyCode(editingExpense.currency_code);
    setEditNote(editingExpense.note ?? '');
  }, [editingExpense]);

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const handleCloseEdit = () => {
    setEditingExpense(null);
    setEditCategoryId(null);
    setEditSubcategoryId(null);
    setEditPaymentMethodId(null);
    setEditExpenseDate('');
    setEditAmount('');
    setEditCurrencyCode(null);
    setEditNote('');
  };

  const handleSaveEdit = async () => {
    if (
      !editingExpense ||
      !editCategoryId ||
      !editCurrencyCode ||
      !editExpenseDate ||
      editAmount === '' ||
      editAmount <= 0
    ) {
      notifications.show({
        message: 'Completa categoría, fecha, monto y moneda.',
        color: 'red',
      });
      return;
    }

    await updateExpense({
      expenseId: editingExpense.id,
      categoryId: editCategoryId,
      subcategoryId: editSubcategoryId,
      paymentMethodId: editPaymentMethodId,
      expenseDate: editExpenseDate,
      amount: Number(editAmount),
      currencyCode: editCurrencyCode,
      note: editNote.trim() || undefined,
    });

    notifications.show({ message: 'Gasto actualizado', color: 'green' });
    handleCloseEdit();
  };

  const handleDeleteExpense = async (expense: Expense) => {
    try {
      await deleteExpense({ expenseId: expense.id });
      notifications.show({ message: 'Gasto eliminado', color: 'green' });
      setOpenedDeleteId(null);
    } catch {
      notifications.show({ message: 'No se pudo eliminar el gasto.', color: 'red' });
    }
  };

  const totalUsd = expenses.reduce((total, expense) => total + expense.amount_usd, 0);
  const totalArs = expenses.reduce((total, expense) => total + expense.amount_ars, 0);
  const tableContent = (
    <Table striped highlightOnHover withTableBorder withColumnBorders stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Fecha</Table.Th>
          <Table.Th>Categoría</Table.Th>
          <Table.Th>Monto</Table.Th>
          {!isMobile ? <Table.Th>USD</Table.Th> : null}
          {!isMobile ? <Table.Th>ARS</Table.Th> : null}
          {!isMobile ? <Table.Th>Método de pago</Table.Th> : null}
          {!isMobile ? <Table.Th>Usuario</Table.Th> : null}
          {!isMobile ? <Table.Th>Notas</Table.Th> : null}
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {expenses.map((expense) => {
          const createdByLabel = profileMap.get(expense.created_by) || 'Usuario';
          const categoryName =
            expense.category?.name ||
            categories.find((category) => category.id === expense.category_id)?.name ||
            'Sin categoría';
          const subcategoryName =
            expense.subcategory?.name ||
            subcategories.find((subcategory) => subcategory.id === expense.subcategory_id)?.name ||
            '';
          const paymentMethodName =
            expense.payment_method?.name ||
            (expense.payment_method_id
              ? paymentMethodMap.get(expense.payment_method_id) || 'Sin método'
              : 'Sin método');

          return (
            <Table.Tr key={expense.id}>
              <Table.Td>{formatExpenseDate(expense.expense_date)}</Table.Td>
              <Table.Td>
                <Text size="sm" fw={600}>
                  {categoryName}
                  {subcategoryName ? ` / ${subcategoryName}` : ''}
                </Text>
              </Table.Td>
              <Table.Td>
                {expense.amount_original.toFixed(2)} {expense.currency_code}
              </Table.Td>
              {!isMobile ? <Table.Td>{expense.amount_usd.toFixed(2)} USD</Table.Td> : null}
              {!isMobile ? <Table.Td>{expense.amount_ars.toFixed(2)} ARS</Table.Td> : null}
              {!isMobile ? <Table.Td>{paymentMethodName}</Table.Td> : null}
              {!isMobile ? <Table.Td>{createdByLabel}</Table.Td> : null}
              {!isMobile ? <Table.Td>{expense.note || '-'}</Table.Td> : null}
              <Table.Td>
                <Group gap="xs" wrap="nowrap">
                  {expense.created_by === user?.id ? (
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleOpenEdit(expense)}
                      aria-label="Editar gasto"
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                  ) : null}
                  <Popover
                    opened={openedDeleteId === expense.id}
                    onChange={(opened) => setOpenedDeleteId(opened ? expense.id : null)}
                    position="bottom-end"
                    shadow="md"
                    withArrow
                  >
                    <Popover.Target>
                      <ActionIcon
                        variant="light"
                        color="red"
                        aria-label="Eliminar gasto"
                        onClick={() =>
                          setOpenedDeleteId((current) =>
                            current === expense.id ? null : expense.id
                          )
                        }
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text size="sm">Eliminar este gasto?</Text>
                        <Group gap="xs" justify="flex-end">
                          <Button
                            size="xs"
                            variant="default"
                            onClick={() => setOpenedDeleteId(null)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="xs"
                            color="red"
                            onClick={() => handleDeleteExpense(expense)}
                            loading={isDeletingExpense && openedDeleteId === expense.id}
                          >
                            Eliminar
                          </Button>
                        </Group>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
      <Table.Tfoot>
        <Table.Tr>
          <Table.Th colSpan={isMobile ? 2 : 3}>Totales</Table.Th>
          {isMobile ? (
            <>
              <Table.Th>
                {totalUsd.toFixed(2)} USD / {totalArs.toFixed(2)} ARS
              </Table.Th>
              <Table.Th />
            </>
          ) : (
            <>
              <Table.Th>{totalUsd.toFixed(2)} USD</Table.Th>
              <Table.Th>{totalArs.toFixed(2)} ARS</Table.Th>
              <Table.Th colSpan={4} />
            </>
          )}
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );

  return (
    <Stack gap="md" h="100%" className="tw:flex-1 tw:min-h-0 tw:overflow-hidden">
      <Title order={3}>Gastos</Title>

      <Card withBorder radius="md" padding="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 6 }} spacing="sm" verticalSpacing="sm">
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
          <Button variant="light" onClick={resetFilters} className="tw:self-end">
            Limpiar filtros
          </Button>
        </SimpleGrid>
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

      {!isLoading && expenses.length > 0 ? (
        <Card
          withBorder
          radius="md"
          padding="md"
          className="tw:flex tw:flex-col tw:flex-1 tw:min-h-0"
        >
          <ScrollArea className="tw:flex-1">{tableContent}</ScrollArea>
        </Card>
      ) : null}

      <Modal
        opened={!!editingExpense}
        onClose={handleCloseEdit}
        title="Editar gasto"
        centered
        size="lg"
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>Categoría</Text>
          </Group>
          {categories.length === 0 ? (
            <Text size="sm" c="dimmed">
              No hay categorías todavía.
            </Text>
          ) : null}
          {categories.length > 0 ? (
            <Chip.Group
              value={editCategoryId}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setEditCategoryId(value);
                } else {
                  setEditCategoryId(null);
                }
                setEditSubcategoryId(null);
              }}
            >
              <Group gap="xs" wrap="wrap">
                {categories.map((category) => (
                  <Chip key={category.id} value={category.id}>
                    {category.name}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          ) : null}

          <Group justify="space-between" mt="sm">
            <Text fw={600}>Subcategoría</Text>
          </Group>
          {!editCategoryId ? (
            <Text size="sm" c="dimmed">
              Selecciona una categoría para ver subcategorías.
            </Text>
          ) : null}
          {editCategoryId && editSubcategories.length === 0 ? (
            <Text size="sm" c="dimmed">
              No hay subcategorías para esta categoría.
            </Text>
          ) : null}
          {editCategoryId && editSubcategories.length > 0 ? (
            <Chip.Group
              value={editSubcategoryId}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setEditSubcategoryId(value);
                } else {
                  setEditSubcategoryId(null);
                }
              }}
            >
              <Group gap="xs" wrap="wrap">
                {editSubcategories.map((subcategory) => (
                  <Chip key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          ) : null}

          <TextInput
            type="date"
            label="Fecha"
            value={editExpenseDate}
            onChange={(event) => setEditExpenseDate(event.currentTarget.value)}
          />
          <NumberInput
            label="Monto"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            value={editAmount}
            onChange={(value) => {
              if (typeof value === 'number') {
                setEditAmount(value);
                return;
              }
              if (value === '') {
                setEditAmount('');
                return;
              }
              const parsed = Number(value);
              setEditAmount(Number.isNaN(parsed) ? '' : parsed);
            }}
          />
          <Stack gap={6}>
            <Text fw={500} size="sm">
              Moneda
            </Text>
            <Chip.Group
              value={editCurrencyCode}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setEditCurrencyCode(value);
                }
              }}
            >
              <Group gap="xs" wrap="wrap">
                {editCurrencyOptions.map((currency) => (
                  <Chip key={currency.value} value={currency.value}>
                    {currency.label}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Stack>
          <Stack gap={6}>
            <Text fw={500} size="sm">
              Método de pago
            </Text>
            {paymentMethods.length === 0 ? (
              <Text size="sm" c="dimmed">
                No hay métodos de pago aún.
              </Text>
            ) : null}
            {paymentMethods.length > 0 ? (
              <Chip.Group
                value={editPaymentMethodId}
                onChange={(value) => {
                  if (typeof value === 'string') {
                    setEditPaymentMethodId(value);
                  } else {
                    setEditPaymentMethodId(null);
                  }
                }}
              >
                <Group gap="xs" wrap="wrap">
                  {paymentMethods.map((method) => (
                    <Chip key={method.id} value={method.id}>
                      {method.name}
                    </Chip>
                  ))}
                </Group>
              </Chip.Group>
            ) : null}
          </Stack>
          <Textarea
            label="Notas"
            placeholder="Opcional"
            minRows={2}
            value={editNote}
            onChange={(event) => setEditNote(event.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={handleCloseEdit}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} loading={isUpdatingExpense}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};
