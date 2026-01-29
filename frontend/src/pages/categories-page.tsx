import { Button, Card, Group, Modal, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import * as React from 'react';

import { useTenant } from '@/hooks/app/use-tenant';
import {
  useCategories,
  useCreateCategory,
  useCreateSubcategory,
} from '@/hooks/expenses/use-categories';

export const CategoriesPage = () => {
  const { data: tenantUser } = useTenant();
  const { data, isLoading } = useCategories(tenantUser?.tenant_id);
  const { mutateAsync: createCategory, isPending: isCreatingCategory } = useCreateCategory(
    tenantUser?.tenant_id
  );
  const { mutateAsync: createSubcategory, isPending: isCreatingSubcategory } = useCreateSubcategory(
    tenantUser?.tenant_id
  );

  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = React.useState(false);
  const [categoryName, setCategoryName] = React.useState('');
  const [subcategoryName, setSubcategoryName] = React.useState('');
  const [subcategoryCategoryId, setSubcategoryCategoryId] = React.useState<string | null>(null);

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

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={3}>Categorías</Title>
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
              <Text fw={600}>{category.name}</Text>
              <Stack gap={4}>
                {(subcategoriesByCategory[category.id] ?? []).map((subcategory) => (
                  <Text key={subcategory.id} size="sm" c="dimmed">
                    {subcategory.name}
                  </Text>
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
    </Stack>
  );
};
