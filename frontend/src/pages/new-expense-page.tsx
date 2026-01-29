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

const currencyOptions = [
  { value: 'USD', label: 'USD · Dólar' },
  { value: 'ARS', label: 'ARS · Peso argentino' },
  { value: 'BRL', label: 'BRL · Real brasileño' },
];

export const NewExpensePage = () => {
  const { data: tenantUser } = useTenant();
  const { data, isLoading } = useCategories(tenantUser?.tenant_id);
  const { mutateAsync: createExpense, isPending: isCreatingExpense } = useCreateExpense(
    tenantUser?.tenant_id
  );
  const { mutateAsync: createCategory } = useCreateCategory(tenantUser?.tenant_id);
  const { mutateAsync: createSubcategory } = useCreateSubcategory(tenantUser?.tenant_id);

  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState<number | ''>('');
  const [currencyCode, setCurrencyCode] = React.useState<string | null>('USD');
  const [note, setNote] = React.useState('');

  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newSubcategoryName, setNewSubcategoryName] = React.useState('');

  const categories = data?.categories ?? [];
  const subcategories = data?.subcategories ?? [];
  const subcategoriesForCategory = subcategories.filter(
    (subcategory) => subcategory.category_id === categoryId
  );

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
    </Stack>
  );
};
