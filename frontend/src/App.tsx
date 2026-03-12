import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FollowUpPage from './pages/FollowUpPage';
import CampaignsPage from './pages/CampaignsPage';
import SchedulePage from './pages/SchedulePage';
import TemplatesPage from './pages/TemplatesPage';
import SettingsPage from './pages/SettingsPage';
import CampaignWizard from './pages/CampaignWizard';
import HistoryPage from './pages/HistoryPage';
import MetricsPage from './pages/MetricsPage';
import BroadcastPage from './pages/BroadcastPage';
import StatusPage from './pages/StatusPage';
import ContactsPage from './pages/ContactsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Rotas de Autenticação e Layout principal

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="skeleton h-8 w-32" /></div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="followup" element={<FollowUpPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="broadcast" element={<BroadcastPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="campaigns/:id" element={<CampaignWizard />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                background: '#1f2121',
                color: '#f5f5f5',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
