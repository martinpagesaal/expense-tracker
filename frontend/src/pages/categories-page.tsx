import {
  ActionIcon,
  Button,
  Card,
  Group,
  Modal,
  Tabs,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import * as React from 'react';
import { IconPencil } from '@tabler/icons-react';

import { useTenant } from '@/hooks/app/use-tenant';
import {
  useCategories,
  useCreateCategory,
  useCreateSubcategory,
  useUpdateCategory,
  useUpdateSubcategory,
} from '@/hooks/expenses/use-categories';
import {
  useCreatePaymentMethod,
  usePaymentMethods,
  useUpdatePaymentMethod,
} from '@/hooks/expenses/use-payment-methods';
import type { Category, PaymentMethod, Subcategory } from '@/lib/types';

export const CategoriesPage = () => {
  const { data: tenantUser } = useTenant();
  const { data, isLoading } = useCategories(tenantUser?.tenant_id);
  const { mutateAsync: createCategory, isPending: isCreatingCategory } = useCreateCategory(
    tenantUser?.tenant_id
  );
  const { mutateAsync: createSubcategory, isPending: isCreatingSubcategory } = useCreateSubcategory(
    tenantUser?.tenant_id
  );
  const { mutateAsync: updateCategory, isPending: isUpdatingCategory } = useUpdateCategory(
    tenantUser?.tenant_id
  );
  const { mutateAsync: updateSubcategory, isPending: isUpdatingSubcategory } = useUpdateSubcategory(
    tenantUser?.tenant_id
  );
  const { data: paymentMethods = [] } = usePaymentMethods(tenantUser?.tenant_id);
  const { mutateAsync: createPaymentMethod, isPending: isCreatingPaymentMethod } =
    useCreatePaymentMethod(tenantUser?.tenant_id);
  const { mutateAsync: updatePaymentMethod, isPending: isUpdatingPaymentMethod } =
    useUpdatePaymentMethod(tenantUser?.tenant_id);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = React.useState(false);
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = React.useState(false);
  const [categoryName, setCategoryName] = React.useState('');
  const [subcategoryName, setSubcategoryName] = React.useState('');
  const [paymentMethodName, setPaymentMethodName] = React.useState('');
  const [subcategoryCategoryId, setSubcategoryCategoryId] = React.useState<string | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = React.useState<Subcategory | null>(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = React.useState<PaymentMethod | null>(null);
  const [editCategoryName, setEditCategoryName] = React.useState('');
  const [editSubcategoryName, setEditSubcategoryName] = React.useState('');
  const [editPaymentMethodName, setEditPaymentMethodName] = React.useState('');

  const categories = data?.categories ?? [];
  const subcategories = data?.subcategories ?? [];

  const subcategoriesByCategory = subcategories.reduce<Record<string, typeof subcategories>>(
    (acc, subcategory) => {
      acc[subcategory.category_id] = acc[subcategory.category_id] || [];
      acc[subcategory.category_id].push(subcategory);
      return acc;
    },
    {}
  );

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) {
      return;
    }
    await createCategory(categoryName.trim());
    setCategoryName('');
    setIsCategoryModalOpen(false);
    notifications.show({ message: 'Categoría agregada', color: 'green' });
  };

  const handleCreateSubcategory = async () => {
    if (!subcategoryCategoryId || !subcategoryName.trim()) {
      return;
    }
    await createSubcategory({
      categoryId: subcategoryCategoryId,
      name: subcategoryName.trim(),
    });
    setSubcategoryName('');
    setIsSubcategoryModalOpen(false);
    notifications.show({ message: 'Subcategoría agregada', color: 'green' });
  };

  const handleCreatePaymentMethod = async () => {
    if (!paymentMethodName.trim()) {
      return;
    }
    await createPaymentMethod(paymentMethodName.trim());
    setPaymentMethodName('');
    setIsPaymentMethodModalOpen(false);
    notifications.show({ message: 'Método de pago agregado', color: 'green' });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      return;
    }
    await updateCategory({ categoryId: editingCategory.id, name: editCategoryName.trim() });
    setEditingCategory(null);
    setEditCategoryName('');
    notifications.show({ message: 'Categoría actualizada', color: 'green' });
  };

  const handleUpdateSubcategory = async () => {
    if (!editingSubcategory || !editSubcategoryName.trim()) {
      return;
    }
    await updateSubcategory({
      subcategoryId: editingSubcategory.id,
      name: editSubcategoryName.trim(),
    });
    setEditingSubcategory(null);
    setEditSubcategoryName('');
    notifications.show({ message: 'Subcategoría actualizada', color: 'green' });
  };

  const handleUpdatePaymentMethod = async () => {
    if (!editingPaymentMethod || !editPaymentMethodName.trim()) {
      return;
    }
    await updatePaymentMethod({
      paymentMethodId: editingPaymentMethod.id,
      name: editPaymentMethodName.trim(),
    });
    setEditingPaymentMethod(null);
    setEditPaymentMethodName('');
    notifications.show({ message: 'Método de pago actualizado', color: 'green' });
  };

  return (
    <Stack gap="md">
      <Title order={3}>Categorías</Title>

      <Tabs defaultValue="categories" keepMounted={false}>
        <Tabs.List grow>
          <Tabs.Tab value="categories">Categorías y subcategorías</Tabs.Tab>
          <Tabs.Tab value="payment-methods">Métodos de pago</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="categories" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Categorías</Text>
              <Group gap="xs">
                <Button variant="light" onClick={() => setIsCategoryModalOpen(true)}>
                  Agregar categoría
                </Button>
                <Button variant="light" onClick={() => setIsSubcategoryModalOpen(true)}>
                  Agregar subcategoría
                </Button>
              </Group>
            </Group>

            {isLoading ? (
              <Text size="sm" c="dimmed">
                Cargando categorías...
              </Text>
            ) : null}

            {!isLoading && categories.length === 0 ? (
              <Text size="sm" c="dimmed">
                No hay categorías disponibles.
              </Text>
            ) : null}

            <Stack gap="sm">
              {categories.map((category) => (
                <Card key={category.id} withBorder radius="md" padding="md">
                  <Stack gap={6}>
                    <Group justify="space-between" align="center">
                      <Text fw={600}>{category.name}</Text>
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        onClick={() => {
                          setEditingCategory(category);
                          setEditCategoryName(category.name);
                        }}
                        aria-label={`Editar categoría ${category.name}`}
                      >
                        <IconPencil size={16} />
                      </ActionIcon>
                    </Group>
                    <Stack gap={4}>
                      {(subcategoriesByCategory[category.id] ?? []).map((subcategory) => (
                        <Group key={subcategory.id} justify="space-between" gap="xs">
                          <Text size="sm" c="dimmed">
                            {subcategory.name}
                          </Text>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => {
                              setEditingSubcategory(subcategory);
                              setEditSubcategoryName(subcategory.name);
                            }}
                            aria-label={`Editar subcategoría ${subcategory.name}`}
                          >
                            <IconPencil size={14} />
                          </ActionIcon>
                        </Group>
                      ))}
                      {(subcategoriesByCategory[category.id] ?? []).length === 0 ? (
                        <Text size="sm" c="dimmed">
                          Sin subcategorías.
                        </Text>
                      ) : null}
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="payment-methods" pt="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600}>Métodos de pago</Text>
              <Button variant="light" onClick={() => setIsPaymentMethodModalOpen(true)}>
                Agregar método
              </Button>
            </Group>
            {paymentMethods.length === 0 ? (
              <Text size="sm" c="dimmed">
                No hay métodos de pago disponibles.
              </Text>
            ) : null}
            {paymentMethods.map((method) => (
              <Card key={method.id} withBorder radius="md" padding="md">
                <Group justify="space-between" align="center">
                  <Text fw={500}>{method.name}</Text>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={() => {
                      setEditingPaymentMethod(method);
                      setEditPaymentMethodName(method.name);
                    }}
                    aria-label={`Editar método de pago ${method.name}`}
                  >
                    <IconPencil size={16} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Nueva categoría"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre de la categoría"
            placeholder="Ej. Transporte"
            value={categoryName}
            onChange={(event) => setCategoryName(event.currentTarget.value)}
          />
          <Button onClick={handleCreateCategory} loading={isCreatingCategory}>
            Guardar
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title="Nueva subcategoría"
        centered
      >
        <Stack>
          <Select
            label="Categoría"
            placeholder="Selecciona una categoría"
            data={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            value={subcategoryCategoryId}
            onChange={setSubcategoryCategoryId}
          />
          <TextInput
            label="Nombre de la subcategoría"
            placeholder="Ej. Taxi"
            value={subcategoryName}
            onChange={(event) => setSubcategoryName(event.currentTarget.value)}
          />
          <Button onClick={handleCreateSubcategory} loading={isCreatingSubcategory}>
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
            label="Nombre del método de pago"
            placeholder="Ej. Tarjeta VISA"
            value={paymentMethodName}
            onChange={(event) => setPaymentMethodName(event.currentTarget.value)}
          />
          <Button onClick={handleCreatePaymentMethod} loading={isCreatingPaymentMethod}>
            Guardar
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!editingCategory}
        onClose={() => {
          setEditingCategory(null);
          setEditCategoryName('');
        }}
        title="Editar categoría"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre de la categoría"
            value={editCategoryName}
            onChange={(event) => setEditCategoryName(event.currentTarget.value)}
          />
          <Button onClick={handleUpdateCategory} loading={isUpdatingCategory}>
            Guardar cambios
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!editingSubcategory}
        onClose={() => {
          setEditingSubcategory(null);
          setEditSubcategoryName('');
        }}
        title="Editar subcategoría"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre de la subcategoría"
            value={editSubcategoryName}
            onChange={(event) => setEditSubcategoryName(event.currentTarget.value)}
          />
          <Button onClick={handleUpdateSubcategory} loading={isUpdatingSubcategory}>
            Guardar cambios
          </Button>
        </Stack>
      </Modal>

      <Modal
        opened={!!editingPaymentMethod}
        onClose={() => {
          setEditingPaymentMethod(null);
          setEditPaymentMethodName('');
        }}
        title="Editar método de pago"
        centered
      >
        <Stack>
          <TextInput
            label="Nombre del método de pago"
            value={editPaymentMethodName}
            onChange={(event) => setEditPaymentMethodName(event.currentTarget.value)}
          />
          <Button onClick={handleUpdatePaymentMethod} loading={isUpdatingPaymentMethod}>
            Guardar cambios
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
};
