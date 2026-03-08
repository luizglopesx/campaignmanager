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
import { Users } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// Placeholder pages
function PlaceholderPage({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <Icon size={48} className="text-surface-300 mb-4" />
      <h2 className="text-xl font-bold text-text-primary mb-1">{title}</h2>
      <p className="text-sm text-text-muted">Em breve disponível</p>
    </div>
  );
}

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
        <Route path="campaigns/:id" element={<CampaignWizard />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="metrics" element={<MetricsPage />} />
        <Route path="contacts" element={<PlaceholderPage title="Contatos" icon={Users} />} />
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
