import './app.css';

import { Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from '@/components/layout/main-layout';
import { SignIn } from '@/containers/auth-flow/sign-in/sign-in';
import { useAuthContext } from '@/hooks/contexts/use-auth-context';
import { CategoriesPage } from '@/pages/categories-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { ExpensesPage } from '@/pages/expenses-page';
import { NewExpensePage } from '@/pages/new-expense-page';
import { SummaryPage } from '@/pages/summary-page';

function App() {
  const { isLoading, isAuthenticated } = useAuthContext();

  if (isLoading) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[50vh]">
        <div className="tw:text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/gastos" element={<ExpensesPage />} />
        <Route path="/resumen" element={<SummaryPage />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/nuevo" element={<NewExpensePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
