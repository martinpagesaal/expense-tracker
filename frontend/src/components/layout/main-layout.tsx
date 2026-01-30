import { AppShell, Avatar, Button, Group, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconCategory, IconChartPie, IconHome, IconPlus, IconReceipt } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import { useSignOut } from '@/hooks/auth/use-sign-out';
import { useAuthContext } from '@/hooks/contexts/use-auth-context';

type MainLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { label: 'Inicio', to: '/', icon: IconHome },
  { label: 'Gastos', to: '/gastos', icon: IconReceipt },
  { label: 'Nuevo', to: '/nuevo', icon: IconPlus },
  { label: 'Resumen', to: '/resumen', icon: IconChartPie },
  { label: 'Categorías', to: '/categorias', icon: IconCategory },
];

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user } = useAuthContext();
  const { mutate: signOut, isPending } = useSignOut();
  const location = useLocation();
  const isCompact = useMediaQuery('(max-width: 480px)');

  return (
    <AppShell header={{ height: 64 }} footer={{ height: 72 }} padding="md">
      <AppShell.Header>
        <Group justify="space-between" px="md" h="100%">
          <Group gap="sm">
            <Avatar src={user?.user_metadata?.avatar_url ?? undefined} radius="xl" size={36} />
            <Stack gap={2}>
              <Text size="sm" fw={600}>
                {user?.user_metadata?.full_name || user?.email}
              </Text>
              <Text size="xs" c="dimmed">
                Control de gastos
              </Text>
            </Stack>
          </Group>
          <Button size="xs" variant="light" onClick={() => signOut()} loading={isPending}>
            Salir
          </Button>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Stack gap="md" w="100%" maw={520} mx="auto">
          {children}
        </Stack>
      </AppShell.Main>

      <AppShell.Footer>
        <Group justify="space-around" h="100%" px="md">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Button
                key={item.to}
                component={NavLink}
                to={item.to}
                variant={isActive ? 'filled' : 'subtle'}
                size="sm"
                leftSection={<Icon size={18} />}
                aria-label={item.label}
                px={isCompact ? 'xs' : 'sm'}
              >
                {isCompact ? null : item.label}
              </Button>
            );
          })}
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
};
