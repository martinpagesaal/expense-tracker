import { Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

import { useTenant } from '@/hooks/app/use-tenant';
import { useAuthContext } from '@/hooks/contexts/use-auth-context';
import { useExpenses } from '@/hooks/expenses/use-expenses';
import { useProfiles } from '@/hooks/expenses/use-profiles';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const DashboardPage = () => {
  const { user } = useAuthContext();
  const { data: tenantUser, isLoading: isTenantLoading } = useTenant();
  const { data: profiles = [] } = useProfiles();
  const { data: expenses = [], isLoading: isExpensesLoading } = useExpenses(tenantUser?.tenant_id, {
    limit: 5,
  });

  const displayName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Usuario';

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile.display_name || profile.id])
  );

  return (
    <Stack gap="md">
      <Stack gap={4}>
        <Title order={3}>Hola, {displayName}</Title>
        <Text c="dimmed" size="sm">
          Registra tus gastos diarios en segundos.
        </Text>
      </Stack>

      <Card withBorder radius="md" padding="md">
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Text fw={600}>Nuevo gasto</Text>
            <Text size="sm" c="dimmed">
              Crea un registro rápido desde el móvil.
            </Text>
          </Stack>
          <Button component={Link} to="/nuevo">
            Agregar
          </Button>
        </Group>
      </Card>

      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600}>Últimos gastos</Text>
          <Button component={Link} to="/gastos" variant="subtle" size="xs">
            Ver todo
          </Button>
        </Group>

        <Stack gap="sm">
          {isTenantLoading || isExpensesLoading ? (
            <Text size="sm" c="dimmed">
              Cargando gastos...
            </Text>
          ) : null}

          {!isExpensesLoading && expenses.length === 0 ? (
            <Text size="sm" c="dimmed">
              Aún no hay gastos registrados.
            </Text>
          ) : null}

          {expenses.map((expense) => {
            const createdByLabel =
              expense.created_by === user?.id
                ? 'Tú'
                : profileMap.get(expense.created_by) || 'Usuario';

            return (
              <Card key={expense.id} withBorder radius="md" padding="sm">
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text fw={600}>
                      {expense.category?.name}
                      {expense.subcategory?.name ? ` / ${expense.subcategory.name}` : ''}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {createdByLabel} · {formatDate(expense.created_at)}
                    </Text>
                  </Stack>
                  <Stack gap={2} align="flex-end">
                    <Text fw={600}>
                      {expense.amount_original.toFixed(2)} {expense.currency_code}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {expense.amount_usd.toFixed(2)} USD
                    </Text>
                  </Stack>
                </Group>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
};
