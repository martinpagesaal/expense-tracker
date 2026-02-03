import {
  Button,
  Card,
  Chip,
  Group,
  Modal,
  NumberInput,
  SimpleGrid,
  Stack,
  Stepper,
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

  const [activeStep, setActiveStep] = React.useState(0);
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = React.useState<string | null>(null);
  const [paymentMethodId, setPaymentMethodId] = React.useState<string | null>(null);
  const [expenseDate, setExpenseDate] = React.useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [amountInput, setAmountInput] = React.useState('');
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

  const normalizedAmountInput = React.useCallback((rawValue: string) => {
    if (!rawValue) {
      return '';
    }
    const sanitized = rawValue.replace(',', '.').replace(/[^0-9.]/g, '');
    const [integerPart, ...decimalParts] = sanitized.split('.');
    const decimals = decimalParts.join('');
    const trimmedDecimals = decimals.slice(0, 2);
    if (trimmedDecimals.length > 0) {
      return `${integerPart || '0'}.${trimmedDecimals}`;
    }
    return integerPart;
  }, []);

  const handleNumpadPress = React.useCallback((key: string) => {
    setAmountInput((current) => {
      if (key === 'C') {
        return '';
      }
      if (key === 'Del') {
        return current.slice(0, -1);
      }
      if (key === '.') {
        if (current.includes('.')) {
          return current;
        }
        return current === '' ? '0.' : `${current}.`;
      }
      const nextValue = current === '0' ? key : `${current}${key}`;
      const [integerPart, decimalPart] = nextValue.split('.');
      if (decimalPart && decimalPart.length > 2) {
        return current;
      }
      return integerPart === '' ? '0' : nextValue;
    });
  }, []);

  const parsedAmount = Number(amountInput);
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const canProceedCategory = Boolean(categoryId);
  const canProceedAmount = isAmountValid && Boolean(currencyCode);
  const isLastStep = activeStep === 4;

  const handleNextStep = React.useCallback(() => {
    setActiveStep((current) => Math.min(current + 1, 4));
  }, []);

  const handlePreviousStep = React.useCallback(() => {
    setActiveStep((current) => Math.max(current - 1, 0));
  }, []);

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

  const handleSaveExpense = React.useCallback(async () => {
    if (!categoryId || !currencyCode || !isAmountValid) {
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
      amount: parsedAmount,
      currencyCode,
      note: note.trim() || undefined,
    });

    setAmountInput('');
    setNote('');
    setSubcategoryId(null);
    notifications.show({ message: 'Gasto guardado', color: 'green' });
  }, [
    categoryId,
    createExpense,
    currencyCode,
    expenseDate,
    isAmountValid,
    note,
    parsedAmount,
    paymentMethodId,
    subcategoryId,
  ]);

  const nextAction = React.useMemo(() => {
    if (isLastStep) {
      return {
        label: 'Guardar gasto',
        onClick: handleSaveExpense,
        disabled: false,
        loading: isCreatingExpense,
      };
    }

    if (activeStep === 0 || activeStep === 1) {
      return {
        label: 'Siguiente',
        onClick: handleNextStep,
        disabled: !canProceedCategory,
        loading: false,
      };
    }

    if (activeStep === 2) {
      return {
        label: 'Siguiente',
        onClick: handleNextStep,
        disabled: !canProceedAmount,
        loading: false,
      };
    }

    return {
      label: 'Siguiente',
      onClick: handleNextStep,
      disabled: false,
      loading: false,
    };
  }, [
    activeStep,
    canProceedAmount,
    canProceedCategory,
    handleNextStep,
    handleSaveExpense,
    isCreatingExpense,
    isLastStep,
  ]);

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
    <Stack gap="md" className="tw:h-full">
      <Title order={3}>Nuevo gasto</Title>

      <Stepper
        active={activeStep}
        allowNextStepsSelect={false}
        styles={{
          stepLabel: { display: 'none' },
          stepDescription: { display: 'none' },
        }}
        onStepClick={(step) => {
          if (step <= activeStep) {
            setActiveStep(step);
          }
        }}
      >
        <Stepper.Step label="Categoría" description="Elegí la categoría">
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
                      setActiveStep(1);
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
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Subcategoría" description="Opcional">
          <Card withBorder radius="md" padding="md">
            <Stack gap="sm">
              <Group justify="space-between">
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
                      setActiveStep(2);
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
        </Stepper.Step>

        <Stepper.Step label="Monto" description="Ingresá el monto">
          <Card withBorder radius="md" padding="md">
            <Stack gap="md">
              <NumberInput
                label="Monto"
                placeholder="0.00"
                min={0}
                decimalScale={2}
                value={amountInput}
                onChange={(value) => {
                  if (value === '' || value === null) {
                    setAmountInput('');
                    return;
                  }
                  if (typeof value === 'number') {
                    setAmountInput(normalizedAmountInput(value.toString()));
                    return;
                  }
                  setAmountInput(normalizedAmountInput(value));
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
              <Stack gap="xs">
                <Text fw={500} size="sm">
                  Numpad
                </Text>
                <SimpleGrid cols={3} spacing="xs">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'Del'].map((key) => (
                    <Button key={key} variant="default" onClick={() => handleNumpadPress(key)}>
                      {key}
                    </Button>
                  ))}
                </SimpleGrid>
                <Button variant="light" onClick={() => handleNumpadPress('C')}>
                  Limpiar
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Método de pago" description="Elegí cómo pagaste">
          <Card withBorder radius="md" padding="md">
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
                      setActiveStep(4);
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
          </Card>
        </Stepper.Step>

        <Stepper.Step label="Detalles" description="Fecha, nota y guardar">
          <Card withBorder radius="md" padding="md">
            <Stack gap="sm">
              <TextInput
                type="date"
                label="Fecha"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.currentTarget.value)}
              />
              <Textarea
                label="Notas"
                placeholder="Opcional"
                minRows={2}
                value={note}
                onChange={(event) => setNote(event.currentTarget.value)}
              />
            </Stack>
          </Card>
        </Stepper.Step>
      </Stepper>
      <div className="tw:grow" />
      <Card withBorder radius="md" padding="sm">
        <Group justify="space-between">
          <Button variant="default" onClick={handlePreviousStep} disabled={activeStep === 0}>
            Atrás
          </Button>
          <Button
            onClick={nextAction.onClick}
            disabled={nextAction.disabled}
            loading={nextAction.loading}
          >
            {nextAction.label}
          </Button>
        </Group>
      </Card>

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
