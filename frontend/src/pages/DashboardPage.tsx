import { useEffect, useState } from 'react';
import { dashboardApi } from '../services/api';
import {
  Users,
  MessageSquare,
  Megaphone,
  CalendarClock,
  TrendingUp,
  Send,
  Activity,
} from 'lucide-react';

interface DashboardData {
  overview: {
    leads: { active: number; total: number; responseRate: string };
    messages: { today: number; week: number };
    campaigns: { active: number; total: number; deliveryRate: string };
    scheduled: number;
  };
  recent: { followups: any[]; campaigns: any[] };
}

const statCards = [
  {
    key: 'leads',
    label: 'Leads Ativos',
    icon: Users,
    iconColor: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.10)',
    getValue: (d: DashboardData) => d.overview.leads.active,
    getSub: (d: DashboardData) => `${d.overview.leads.total} total`,
  },
  {
    key: 'messages',
    label: 'Mensagens Hoje',
    icon: Send,
    iconColor: '#10B981',
    iconBg: 'rgba(16,185,129,0.10)',
    getValue: (d: DashboardData) => d.overview.messages.today,
    getSub: (d: DashboardData) => `${d.overview.messages.week} esta semana`,
  },
  {
    key: 'rate',
    label: 'Taxa de Resposta',
    icon: TrendingUp,
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.10)',
    getValue: (d: DashboardData) => d.overview.leads.responseRate,
    getSub: () => 'dos leads em follow-up',
  },
  {
    key: 'campaigns',
    label: 'Campanhas Ativas',
    icon: Megaphone,
    iconColor: '#F59E0B',
    iconBg: 'rgba(245,158,11,0.10)',
    getValue: (d: DashboardData) => d.overview.campaigns.active,
    getSub: (d: DashboardData) => `${d.overview.campaigns.total} total`,
  },
];

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ backgroundColor: '#E5E7EB' }}
    />
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await dashboardApi.get();
      setData(res.data);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100%' }}>
        <div>
          <SkeletonPulse className="h-7 w-44 mb-2" />
          <SkeletonPulse className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonPulse key={i} className="h-32" style={{ borderRadius: '12px' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SkeletonPulse className="h-64" style={{ borderRadius: '12px' }} />
          <SkeletonPulse className="h-64" style={{ borderRadius: '12px' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <SkeletonPulse className="h-28" style={{ borderRadius: '12px' }} />
          <SkeletonPulse className="h-28" style={{ borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  const followupStatusBadge = (status: string) => {
    if (status === 'SENT') return { bg: '#ECFDF5', color: '#047857' };
    if (status === 'FAILED') return { bg: '#FEF2F2', color: '#DC2626' };
    return { bg: '#FFFBEB', color: '#B45309' };
  };

  const campaignStatusBadge = (status: string) => {
    if (status === 'RUNNING') return { bg: '#ECFDF5', color: '#047857' };
    if (status === 'COMPLETED') return { bg: '#EFF6FF', color: '#2563EB' };
    if (status === 'PAUSED') return { bg: '#FFFBEB', color: '#B45309' };
    return { bg: '#F3F4F6', color: '#374151' };
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100%' }}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Visão geral do Campaign Manager</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <div
              key={card.key}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px',
                }}
              >
                <card.icon size={18} strokeWidth={1.75} style={{ color: card.iconColor }} />
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px 0' }}>{card.label}</p>
              <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                {data ? card.getValue(data) : '—'}
              </p>
              <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                {data ? card.getSub(data) : '—'}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Follow-ups */}
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} strokeWidth={1.75} style={{ color: '#3B82F6' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Últimos Follow-ups</span>
              </div>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                {data?.recent?.followups?.length || 0} recentes
              </span>
            </div>
            <div>
              {data?.recent?.followups && data.recent.followups.length > 0 ? (
                data.recent.followups.map((msg: any) => {
                  const badge = followupStatusBadge(msg.status);
                  return (
                    <div
                      key={msg.id}
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59,130,246,0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2563EB',
                          fontSize: '12px',
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {msg.lead?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.lead?.name || 'Desconhecido'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {msg.messageContent?.substring(0, 60)}...
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '2px 10px',
                          borderRadius: '6px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {msg.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Activity size={32} strokeWidth={1.75} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Nenhum follow-up ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Campaigns */}
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Megaphone size={16} strokeWidth={1.75} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Campanhas Recentes</span>
              </div>
            </div>
            <div>
              {data?.recent?.campaigns && data.recent.campaigns.length > 0 ? (
                data.recent.campaigns.map((camp: any) => {
                  const badge = campaignStatusBadge(camp.status);
                  return (
                    <div
                      key={camp.id}
                      style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: badge.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Megaphone size={14} strokeWidth={1.75} style={{ color: badge.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {camp.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                          {camp._count?.recipients || 0} destinatários
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          padding: '2px 10px',
                          borderRadius: '6px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {camp.status}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Megaphone size={32} strokeWidth={1.75} style={{ color: '#D1D5DB', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Nenhuma campanha criada</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scheduled & Delivery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(139,92,246,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarClock size={18} strokeWidth={1.75} style={{ color: '#8B5CF6' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Agendamentos Pendentes</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {data?.overview?.scheduled || 0}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>mensagens programadas</p>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16,185,129,0.10)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={18} strokeWidth={1.75} style={{ color: '#10B981' }} />
              </div>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Taxa de Entrega</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {data?.overview?.campaigns?.deliveryRate || '0%'}
            </p>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>de campanhas entregues</p>
          </div>
        </div>
      </div>
    </div>
  );
}
