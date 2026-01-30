import {
  Button,
  Card,
  Chip,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import * as React from 'react';

import { useTenant } from '@/hooks/app/use-tenant';
import {
  useCategories,
  useCreateCategory,
  useCreateSubcategory,
} from '@/hooks/expenses/use-categories';
import { useCreateExpense } from '@/hooks/expenses/use-create-expense';
import { useCreatePaymentMethod, usePaymentMethods } from '@/hooks/expenses/use-payment-methods';

const currencyOptions = [
  { value: 'USD', label: 'USD · Dólar' },
  { value: 'ARS', label: 'ARS · Peso argentino' },
  { value: 'BRL', label: 'BRL · Real brasileño' },
];

const DEFAULT_CURRENCY = 'ARS';
const LOCAL_STORAGE_CURRENCY_KEY = 'expense.lastCurrency';
const LOCAL_STORAGE_PAYMENT_METHOD_KEY = 'expense.lastPaymentMethod';

export const NewExpensePage = () => {
  const { data: tenantUser } = useTenant();
  const { data, isLoading } = useCategories(tenantUser?.tenant_id);
  const { mutateAsync: createExpense, isPending: isCreatingExpense } = useCreateExpense(
    tenantUser?.tenant_id
  );
  const { mutateAsync: createCategory } = useCreateCategory(tenantUser?.tenant_id);
  const { mutateAsync: createSubcategory } = useCreateSubcategory(tenantUser?.tenant_id);
  const { data: paymentMethods = [] } = usePaymentMethods(tenantUser?.tenant_id);
  const { mutateAsync: createPaymentMethod, isPending: isCreatingPaymentMethod } =
    useCreatePaymentMethod(tenantUser?.tenant_id);

  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = React.useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = React.useState<string | null>(null);
  const [expenseDate, setExpenseDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = React.useState<number | ''>('');
  const [currencyCode, setCurrencyCode] = React.useState<string | null>(DEFAULT_CURRENCY);
  const [note, setNote] = React.useState('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = React.useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newSubcategoryName, setNewSubcategoryName] = React.useState('');
  const [newPaymentMethodName, setNewPaymentMethodName] = React.useState('');

  const categories = data?.categories ?? [];
  const subcategories = data?.subcategories ?? [];
  const subcategoriesForCategory = subcategories.filter(
    (subcategory) => subcategory.category_id === categoryId
  );

  React.useEffect(() => {
    const storedCurrency = window.localStorage.getItem(LOCAL_STORAGE_CURRENCY_KEY);
    if (storedCurrency) {
      setCurrencyCode(storedCurrency);
    }
    const storedPaymentMethod = window.localStorage.getItem(LOCAL_STORAGE_PAYMENT_METHOD_KEY);
    if (storedPaymentMethod) {
      setPaymentMethodId(storedPaymentMethod);
    }
  }, []);

  React.useEffect(() => {
    if (currencyCode) {
      window.localStorage.setItem(LOCAL_STORAGE_CURRENCY_KEY, currencyCode);
    }
  }, [currencyCode]);

  React.useEffect(() => {
    if (paymentMethodId) {
      window.localStorage.setItem(LOCAL_STORAGE_PAYMENT_METHOD_KEY, paymentMethodId);
    }
  }, [paymentMethodId]);

  const handleSaveExpense = async () => {
    if (!categoryId || !currencyCode || amount === '' || amount <= 0) {
      notifications.show({
        message: 'Completa categoría, monto y moneda.',
        color: 'red',
      });
      return;
    }

    await createExpense({
      categoryId,
      subcategoryId,
      paymentMethodId,
      expenseDate,
      amount: Number(amount),
      currencyCode,
      note: note.trim() || undefined,
    });

    setAmount('');
    setNote('');
    setSubcategoryId(null);
    notifications.show({ message: 'Gasto guardado', color: 'green' });
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    const category = await createCategory(newCategoryName.trim());
    setCategoryId(category.id);
    setNewCategoryName('');
    setIsCategoryModalOpen(false);
    notifications.show({ message: 'Categoría agregada', color: 'green' });
  };

  const handleCreateSubcategory = async () => {
    if (!categoryId || !newSubcategoryName.trim()) {
      return;
    }
    const subcategory = await createSubcategory({
      categoryId,
      name: newSubcategoryName.trim(),
    });
    setSubcategoryId(subcategory.id);
    setNewSubcategoryName('');
    setIsSubcategoryModalOpen(false);
    notifications.show({ message: 'Subcategoría agregada', color: 'green' });
  };

  const handleCreatePaymentMethod = async () => {
    if (!newPaymentMethodName.trim()) {
      return;
    }
    const method = await createPaymentMethod(newPaymentMethodName.trim());
    setPaymentMethodId(method.id);
    setNewPaymentMethodName('');
    setIsPaymentMethodModalOpen(false);
    notifications.show({ message: 'Método de pago agregado', color: 'green' });
  };

  return (
    <Stack gap="md">
      <Title order={3}>Nuevo gasto</Title>

      <Card withBorder radius="md" padding="md">
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>Categoría</Text>
            <Button size="xs" variant="light" onClick={() => setIsCategoryModalOpen(true)}>
              Agregar
            </Button>
          </Group>
          {isLoading ? (
            <Text size="sm" c="dimmed">
              Cargando categorías...
            </Text>
          ) : null}
          {!isLoading && categories.length === 0 ? (
            <Text size="sm" c="dimmed">
              No hay categorías todavía.
            </Text>
          ) : null}
          {!isLoading && categories.length > 0 ? (
            <Chip.Group
              value={categoryId}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setCategoryId(value);
                } else {
                  setCategoryId(null);
                }
                setSubcategoryId(null);
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
            <Button
              size="xs"
              variant="light"
              onClick={() => setIsSubcategoryModalOpen(true)}
              disabled={!categoryId}
            >
              Agregar
            </Button>
          </Group>
          {!categoryId ? (
            <Text size="sm" c="dimmed">
              Selecciona una categoría para ver subcategorías.
            </Text>
          ) : null}
          {categoryId && subcategoriesForCategory.length === 0 ? (
            <Text size="sm" c="dimmed">
              No hay subcategorías para esta categoría.
            </Text>
          ) : null}
          {categoryId && subcategoriesForCategory.length > 0 ? (
            <Chip.Group
              value={subcategoryId}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setSubcategoryId(value);
                } else {
                  setSubcategoryId(null);
                }
              }}
            >
              <Group gap="xs" wrap="wrap">
                {subcategoriesForCategory.map((subcategory) => (
                  <Chip key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          ) : null}
        </Stack>
      </Card>

      <Card withBorder radius="md" padding="md">
        <Stack gap="sm">
          <TextInput
            type="date"
            label="Fecha"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.currentTarget.value)}
          />
          <NumberInput
            label="Monto"
            placeholder="0.00"
            min={0}
            decimalScale={2}
            value={amount}
            onChange={(value) => {
              if (typeof value === 'number') {
                setAmount(value);
                return;
              }
              if (value === '') {
                setAmount('');
                return;
              }
              const parsed = Number(value);
              setAmount(Number.isNaN(parsed) ? '' : parsed);
            }}
          />
          <Stack gap={6}>
            <Text fw={500} size="sm">
              Moneda
            </Text>
            <Chip.Group
              value={currencyCode}
              onChange={(value) => {
                if (typeof value === 'string') {
                  setCurrencyCode(value);
                }
              }}
            >
              <Group gap="xs" wrap="wrap">
                {currencyOptions.map((currency) => (
                  <Chip key={currency.value} value={currency.value}>
                    {currency.label}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </Stack>
          <Stack gap={6}>
            <Group justify="space-between">
              <Text fw={500} size="sm">
                Método de pago
              </Text>
              <Button size="xs" variant="light" onClick={() => setIsPaymentMethodModalOpen(true)}>
                Agregar
              </Button>
            </Group>
            {paymentMethods.length === 0 ? (
              <Text size="sm" c="dimmed">
                No hay métodos de pago aún.
              </Text>
            ) : null}
            {paymentMethods.length > 0 ? (
              <Chip.Group
                value={paymentMethodId}
                onChange={(value) => {
                  if (typeof value === 'string') {
                    setPaymentMethodId(value);
                  } else {
                    setPaymentMethodId(null);
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
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
          />
        </Stack>
      </Card>

      <Button onClick={handleSaveExpense} loading={isCreatingExpense}>
        Guardar gasto
      </Button>

      <Modal
        opened={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nueva categoría"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre"
            placeholder="Ej. Transporte"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.currentTarget.value)}
          />
          <Button onClick={handleCreateCategory}>Guardar</Button>
        </Stack>
      </Modal>

      <Modal
        opened={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title="Nueva subcategoría"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre"
            placeholder="Ej. Taxi"
            value={newSubcategoryName}
            onChange={(event) => setNewSubcategoryName(event.currentTarget.value)}
          />
          <Button onClick={handleCreateSubcategory} disabled={!categoryId}>
            Guardar
          </Button>
        </Stack>
      </Modal>
      <Modal
        opened={isPaymentMethodModalOpen}
        onClose={() => setIsPaymentMethodModalOpen(false)}
        title="Nuevo método de pago"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre"
            placeholder="Ej. Tarjeta VISA Macro"
            value={newPaymentMethodName}
            onChange={(event) => setNewPaymentMethodName(event.currentTarget.value)}
          />
          <Button onClick={handleCreatePaymentMethod} loading={isCreatingPaymentMethod}>
            Guardar
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
};
