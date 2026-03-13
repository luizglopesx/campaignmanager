import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Radio,
  Smartphone,
  CalendarClock,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  History,
  BarChart2,
  X,
} from 'lucide-react';

const navSections = [
  {
    label: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/followup', icon: MessageSquare, label: 'Follow-up' },
      { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
      { to: '/broadcast', icon: Radio, label: 'Disparo' },
      { to: '/status', icon: Smartphone, label: 'Status' },
      { to: '/schedule', icon: CalendarClock, label: 'Agendamentos' },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { to: '/templates', icon: FileText, label: 'Templates' },
      { to: '/contacts', icon: Users, label: 'Contatos' },
    ],
  },
  {
    label: 'Análise',
    items: [
      { to: '/history', icon: History, label: 'Histórico' },
      { to: '/metrics', icon: BarChart2, label: 'Métricas' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/settings', icon: Settings, label: 'Configurações' },
    ],
  },
];

// Flat list for collapsed sidebar (icon-only)
const allNavItems = navSections.flatMap((s) => s.items);

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(17, 24, 39, 0.4)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-50 h-full flex flex-col
          transition-all duration-300 ease-in-out shrink-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{
          width: sidebarOpen ? '260px' : '64px',
          background: '#ffffff',
          borderRight: '1px solid #E5E7EB',
        }}
      >
        {/* Logo area */}
        <div
          className="flex items-center shrink-0"
          style={{
            height: '64px',
            padding: sidebarOpen ? '0 20px' : '0',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {/* Icon mark */}
          <div
            className="shrink-0 flex items-center justify-center rounded-lg font-bold text-sm"
            style={{
              height: '36px',
              width: '36px',
              background: '#3B82F6',
              color: '#ffffff',
            }}
          >
            CM
          </div>

          {sidebarOpen && (
            <div className="ml-3 overflow-hidden animate-fade-in">
              <p
                className="font-semibold whitespace-nowrap truncate"
                style={{ fontSize: '15px', color: '#111827', letterSpacing: '-0.01em' }}
              >
                Campaign Manager
              </p>
              <p
                className="whitespace-nowrap truncate"
                style={{ fontSize: '12px', color: '#9CA3AF' }}
              >
                Senhor Colchão
              </p>
            </div>
          )}

          {/* Close button (mobile only) */}
          {sidebarOpen && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto md:hidden p-1 rounded-lg transition-colors"
              style={{ color: '#9CA3AF' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto" style={{ padding: '12px 8px' }}>
          {sidebarOpen
            ? navSections.map((section) => (
                <div key={section.label} className="mb-4">
                  <p
                    className="uppercase font-medium tracking-widest mb-1"
                    style={{
                      fontSize: '11px',
                      color: '#9CA3AF',
                      letterSpacing: '0.05em',
                      padding: '4px 10px',
                    }}
                  >
                    {section.label}
                  </p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <SidebarNavLink
                        key={item.to}
                        item={item}
                        expanded={true}
                        onNavigate={() => setMobileOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))
            : // Icon-only mode: render all items without section labels
              <div className="space-y-0.5">
                {allNavItems.map((item) => (
                  <SidebarNavLink
                    key={item.to}
                    item={item}
                    expanded={false}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
          }
        </nav>

        {/* Bottom: user + logout + collapse */}
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            padding: '12px 8px',
          }}
        >
          {/* User info */}
          {sidebarOpen && (
            <div
              className="flex items-center gap-3 rounded-lg animate-fade-in"
              style={{ padding: '8px 10px', marginBottom: '4px' }}
            >
              <div
                className="shrink-0 rounded-full flex items-center justify-center font-semibold text-xs"
                style={{
                  height: '32px',
                  width: '32px',
                  background: '#DBEAFE',
                  color: '#2563EB',
                }}
              >
                {userInitial}
              </div>
              <div className="overflow-hidden">
                <p
                  className="font-medium truncate"
                  style={{ fontSize: '13px', color: '#111827' }}
                >
                  {user?.name}
                </p>
                <p className="truncate" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {user?.role}
                </p>
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center rounded-lg transition-colors w-full"
            style={{
              gap: sidebarOpen ? '10px' : '0',
              padding: '8px 10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              color: '#EF4444',
              fontSize: '13px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <LogOut size={18} className="shrink-0" />
            {sidebarOpen && <span className="font-medium">Sair</span>}
          </button>

          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex items-center rounded-lg transition-colors w-full"
            style={{
              gap: sidebarOpen ? '10px' : '0',
              padding: '8px 10px',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              color: '#6B7280',
              fontSize: '13px',
              marginTop: '2px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <ChevronRight
              size={18}
              className="shrink-0 transition-transform"
              style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
            {sidebarOpen && <span className="font-medium">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex items-center px-6 gap-4 shrink-0"
          style={{
            height: '64px',
            background: '#ffffff',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#6B7280' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          {/* Online status indicator */}
          <div
            className="flex items-center gap-2 shrink-0 whitespace-nowrap"
            style={{ fontSize: '13px', color: '#6B7280' }}
          >
            <div
              className="rounded-full animate-pulse"
              style={{ height: '8px', width: '8px', background: '#10B981' }}
            />
            Online
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─── Sidebar nav link ─── */
interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

function SidebarNavLink({
  item,
  expanded,
  onNavigate,
}: {
  item: NavItem;
  expanded: boolean;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className="block"
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: expanded ? '10px' : '0',
        justifyContent: expanded ? 'flex-start' : 'center',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#2563EB' : '#374151',
        background: isActive ? '#EFF6FF' : 'transparent',
        borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        position: 'relative',
      })}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        if (!el.classList.contains('active-nav')) {
          el.style.background = '#F3F4F6';
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        // Restore active styles if active, else clear
        const isActive = el.getAttribute('aria-current') === 'page';
        el.style.background = isActive ? '#EFF6FF' : 'transparent';
      }}
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={20}
            className="shrink-0"
            style={{ color: isActive ? '#3B82F6' : '#9CA3AF' }}
          />
          {expanded && (
            <span className="whitespace-nowrap">{item.label}</span>
          )}
        </>
      )}
    </NavLink>
  );
}
