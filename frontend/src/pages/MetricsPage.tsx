import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { BarChart2, TrendingUp, Users, MessageSquare, Megaphone, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const campaignStatusLabel: Record<string, { label: string; color: string; badgeBg: string; badgeText: string }> = {
  DRAFT:     { label: 'Rascunho',     color: 'bg-gray-400',   badgeBg: '#F3F4F6', badgeText: '#374151' },
  SCHEDULED: { label: 'Agendada',     color: 'bg-blue-500',   badgeBg: '#EFF6FF', badgeText: '#2563EB' },
  RUNNING:   { label: 'Em andamento', color: 'bg-yellow-500', badgeBg: '#FFFBEB', badgeText: '#B45309' },
  PAUSED:    { label: 'Pausada',      color: 'bg-orange-500', badgeBg: '#FFF7ED', badgeText: '#C2410C' },
  COMPLETED: { label: 'Concluída',    color: 'bg-emerald-500',badgeBg: '#ECFDF5', badgeText: '#047857' },
};

const msgStatusLabel: Record<string, { label: string; color: string }> = {
  SENT:      { label: 'Enviado',   color: 'bg-blue-500' },
  PENDING:   { label: 'Pendente',  color: 'bg-yellow-500' },
  FAILED:    { label: 'Falhou',    color: 'bg-red-500' },
  DELIVERED: { label: 'Entregue', color: 'bg-teal-500' },
  READ:      { label: 'Lido',      color: 'bg-purple-500' },
};

function BarChart({ data }: { data: { date: string; followup: number; campaign: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.followup + d.campaign), 1);

  return (
    <div className="flex items-end gap-0.5 h-32 w-full">
      {data.map((d, i) => {
        const totalHeight = ((d.followup + d.campaign) / maxVal) * 100;
        const followupPct = totalHeight > 0 ? (d.followup / (d.followup + d.campaign)) * totalHeight : 0;
        const campaignPct = totalHeight - followupPct;
        const showLabel = i % 5 === 0 || i === data.length - 1;

        return (
          <div
            key={d.date}
            className="flex-1 flex flex-col items-center gap-0.5 group relative"
            title={`${format(new Date(d.date), 'dd/MM', { locale: ptBR })}: ${d.followup + d.campaign} msg`}
          >
            {/* Tooltip */}
            <div
              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
              style={{ background: '#1F2937', border: '1px solid #374151' }}
            >
              <p className="font-medium">{format(new Date(d.date), 'dd/MM', { locale: ptBR })}</p>
              {d.followup > 0 && <p style={{ color: '#93C5FD' }}>Follow-up: {d.followup}</p>}
              {d.campaign > 0 && <p style={{ color: '#14B8A6' }}>Campanha: {d.campaign}</p>}
            </div>

            {/* Bar */}
            <div className="flex-1 w-full flex flex-col justify-end gap-px">
              {campaignPct > 0 && (
                <div
                  className="w-full rounded-t-sm"
                  style={{ height: `${campaignPct}%`, minHeight: campaignPct > 0 ? '2px' : '0', background: '#14B8A6', opacity: 0.8 }}
                />
              )}
              {followupPct > 0 && (
                <div
                  className="w-full"
                  style={{ height: `${followupPct}%`, minHeight: followupPct > 0 ? '2px' : '0', background: '#3B82F6', opacity: 0.85 }}
                />
              )}
              {totalHeight === 0 && (
                <div className="w-full rounded-sm bg-gray-100" style={{ height: '4px' }} />
              )}
            </div>

            {/* Date label */}
            {showLabel && (
              <span className="text-[9px] text-gray-400 mt-1">
                {format(new Date(d.date), 'dd/MM', { locale: ptBR })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HorizontalBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-gray-700 font-medium w-8 text-right">{value}</span>
    </div>
  );
}

export default function MetricsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: async () => {
      const res = await api.get('/metrics');
      return res.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  const totals = data?.totals || {};
  const funnel = data?.funnel || {};
  const timeline = data?.timeline || [];
  const topCampaigns = data?.topCampaigns || [];
  const followupByStatus = data?.followupByStatus || [];
  const campaignRecipientByStatus = data?.campaignRecipientByStatus || [];
  const campaignsByStatus = data?.campaignsByStatus || [];

  const maxFunnel = Math.max(funnel.active, funnel.responded, funnel.completed, funnel.paused, 1);
  const maxFollowupStatus = Math.max(...followupByStatus.map((s: any) => s.count), 1);
  const maxCampaignRecipient = Math.max(...campaignRecipientByStatus.map((s: any) => s.count), 1);
  const totalTimeline = timeline.reduce((acc: number, d: any) => acc + d.followup + d.campaign, 0);

  const cardStyle = {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937' }}>Métricas & Relatórios</h1>
        <p className="text-gray-500 text-sm mt-0.5">Visão geral de performance dos últimos 30 dias</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg" style={{ background: '#EFF6FF' }}>
              <MessageSquare size={16} style={{ color: '#3B82F6' }} />
            </div>
            <span className="text-xs text-gray-500">Follow-ups enviados</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#3B82F6' }}>{totals.followupSent || 0}</p>
          <p className="text-xs text-gray-400 mt-1">total histórico</p>
        </div>

        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg" style={{ background: '#F5F3FF' }}>
              <Megaphone size={16} style={{ color: '#8B5CF6' }} />
            </div>
            <span className="text-xs text-gray-500">Campanhas enviadas</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#8B5CF6' }}>{totals.campaignSent || 0}</p>
          <p className="text-xs text-gray-400 mt-1">destinatários</p>
        </div>

        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg" style={{ background: '#F0FDFA' }}>
              <CheckCircle2 size={16} style={{ color: '#14B8A6' }} />
            </div>
            <span className="text-xs text-gray-500">Taxa de resposta</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#14B8A6' }}>{totals.responseRate || '0%'}</p>
          <p className="text-xs text-gray-400 mt-1">leads respondidos</p>
        </div>

        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg" style={{ background: '#ECFDF5' }}>
              <Users size={16} style={{ color: '#10B981' }} />
            </div>
            <span className="text-xs text-gray-500">Total de leads</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: '#1F2937' }}>{totals.totalLeads || 0}</p>
          <p className="text-xs text-gray-400 mt-1">cadastrados</p>
        </div>
      </div>

      {/* Timeline Chart */}
      <div style={cardStyle}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} style={{ color: '#3B82F6' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>Mensagens por dia</h3>
            <span className="text-xs text-gray-400">(últimos 30 dias)</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#3B82F6' }} />
              <span className="text-gray-500">Follow-up</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#14B8A6' }} />
              <span className="text-gray-500">Campanha</span>
            </div>
            <span className="text-gray-400">Total: {totalTimeline}</span>
          </div>
        </div>
        {timeline.length > 0 ? (
          <BarChart data={timeline} />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            Sem dados de envio ainda
          </div>
        )}
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Follow-up Funnel */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} style={{ color: '#14B8A6' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Funil de Follow-up</h3>
          </div>
          <div className="space-y-3">
            <HorizontalBar label="Ativos"      value={funnel.active || 0}    max={maxFunnel} color="bg-yellow-400" />
            <HorizontalBar label="Responderam" value={funnel.responded || 0} max={maxFunnel} color="bg-blue-500" />
            <HorizontalBar label="Concluídos"  value={funnel.completed || 0} max={maxFunnel} color="bg-gray-400" />
            <HorizontalBar label="Pausados"    value={funnel.paused || 0}    max={maxFunnel} color="bg-orange-400" />
          </div>
        </div>

        {/* Follow-up Message Status */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={16} style={{ color: '#3B82F6' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Status Follow-up</h3>
          </div>
          {followupByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm">Sem dados</p>
          ) : (
            <div className="space-y-3">
              {followupByStatus.map((s: any) => {
                const info = msgStatusLabel[s.status] || { label: s.status, color: 'bg-gray-400' };
                return (
                  <HorizontalBar
                    key={s.status}
                    label={info.label}
                    value={s.count}
                    max={maxFollowupStatus}
                    color={info.color}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Campaign Recipients Status */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <Megaphone size={16} style={{ color: '#8B5CF6' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>Status Campanhas</h3>
          </div>

          {/* Campaigns by status badges */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {campaignsByStatus.map((s: any) => {
              const info = campaignStatusLabel[s.status] || { label: s.status, color: 'bg-gray-400', badgeBg: '#F3F4F6', badgeText: '#374151' };
              return (
                <span
                  key={s.status}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium"
                  style={{ background: info.badgeBg, color: info.badgeText }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${info.color}`} />
                  {info.label}: {s.count}
                </span>
              );
            })}
          </div>

          {campaignRecipientByStatus.length === 0 ? (
            <p className="text-gray-400 text-sm">Sem destinatários</p>
          ) : (
            <div className="space-y-3">
              {campaignRecipientByStatus.map((s: any) => {
                const info = msgStatusLabel[s.status] || { label: s.status, color: 'bg-gray-400' };
                return (
                  <HorizontalBar
                    key={s.status}
                    label={info.label}
                    value={s.count}
                    max={maxCampaignRecipient}
                    color={info.color}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Campaigns */}
      {topCampaigns.length > 0 && (
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={16} style={{ color: '#3B82F6' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>Campanhas Recentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campanha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Enviados</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Falhas</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Entrega</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider pl-4">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {topCampaigns.map((c: any) => {
                  const statusInfo = campaignStatusLabel[c.status] || { label: c.status, color: 'bg-gray-400', badgeBg: '#F3F4F6', badgeText: '#374151' };
                  const pct = c.total > 0 ? (c.sent / c.total) * 100 : 0;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-800 font-medium truncate max-w-[180px]">{c.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium"
                          style={{ background: statusInfo.badgeBg, color: statusInfo.badgeText }}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.color}`} />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">{c.total}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: '#2563EB' }}>{c.sent}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-500">{c.failed}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">{c.deliveryRate}</td>
                      <td className="px-4 py-3 pl-4">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-8">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && (
        <div className="text-center py-20">
          <BarChart2 className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum dado disponível ainda</p>
          <p className="text-gray-400 text-sm mt-1">Os dados aparecerão conforme mensagens forem enviadas</p>
        </div>
      )}
    </div>
  );
}
