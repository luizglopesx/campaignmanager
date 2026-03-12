import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  History,
  Download,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  MessageSquare,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabType = 'messages' | 'audit';
type MsgType = 'all' | 'followup' | 'campaign';

const statusMap: Record<string, { label: string; icon: any; textColor: string; bgColor: string }> = {
  SENT:      { label: 'Enviado',   icon: CheckCircle2, textColor: '#047857', bgColor: '#ECFDF5' },
  PENDING:   { label: 'Pendente',  icon: Clock,        textColor: '#B45309', bgColor: '#FFFBEB' },
  FAILED:    { label: 'Falhou',    icon: AlertCircle,  textColor: '#DC2626', bgColor: '#FEF2F2' },
  DELIVERED: { label: 'Entregue', icon: CheckCircle2, textColor: '#2563EB', bgColor: '#EFF6FF' },
  READ:      { label: 'Lido',      icon: CheckCircle2, textColor: '#7C3AED', bgColor: '#F5F3FF' },
  CANCELLED: { label: 'Cancelado', icon: XCircle,      textColor: '#374151', bgColor: '#F3F4F6' },
};

function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] || { label: status, icon: Clock, textColor: '#374151', bgColor: '#F3F4F6' };
  const Icon = s.icon;
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: s.textColor, background: s.bgColor }}
    >
      <Icon size={12} />
      {s.label}
    </span>
  );
}

export default function HistoryPage() {
  const [tab, setTab] = useState<TabType>('messages');
  const [msgType, setMsgType] = useState<MsgType>('all');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');

  const { data: messagesData, isLoading: msgLoading } = useQuery({
    queryKey: ['history', msgType, status, search, dateFrom, dateTo, page],
    queryFn: async () => {
      const params: any = { type: msgType, page, limit: 20 };
      if (status) params.status = status;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await api.get('/history', { params });
      return res.data;
    },
    enabled: tab === 'messages',
  });

  const { data: auditData, isLoading: auditLoading } = useQuery({
    queryKey: ['history-audit', auditSearch, auditPage],
    queryFn: async () => {
      const params: any = { page: auditPage, limit: 20 };
      if (auditSearch) params.search = auditSearch;
      const res = await api.get('/history/audit', { params });
      return res.data;
    },
    enabled: tab === 'audit',
  });

  const handleExportCSV = () => {
    const params = new URLSearchParams({ type: msgType });
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const token = localStorage.getItem('cm_token');
    const url = `/api/history/export?${params.toString()}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('data-token', token || '');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `historico-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  const msgPagination = messagesData?.pagination;
  const auditPagination = auditData?.pagination;

  const inputStyle = {
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '14px',
    color: '#374151',
    background: 'white',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Histórico & Logs</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px' }}>Registro de todas as mensagens enviadas e ações do sistema</p>
        </div>
        {tab === 'messages' && (
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <Download size={15} />
            Exportar CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex' }}>
          <button
            onClick={() => setTab('messages')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              borderBottom: tab === 'messages' ? '2px solid #3B82F6' : '2px solid transparent',
              color: tab === 'messages' ? '#3B82F6' : '#6B7280',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <History size={15} />
            Mensagens
          </button>
          <button
            onClick={() => setTab('audit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              borderBottom: tab === 'audit' ? '2px solid #3B82F6' : '2px solid transparent',
              color: tab === 'audit' ? '#3B82F6' : '#6B7280',
              backgroundColor: 'transparent',
              cursor: 'pointer',
            }}
          >
            <Shield size={15} />
            Auditoria
          </button>
        </div>
      </div>

      {/* Messages Tab */}
      {tab === 'messages' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filters bar */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '12px', marginBottom: '14px' }}>
              <Filter size={13} />
              <span style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px' }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou telefone..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ ...inputStyle, paddingLeft: '36px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Type */}
              <select
                value={msgType}
                onChange={(e) => { setMsgType(e.target.value as MsgType); setPage(1); }}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              >
                <option value="all">Todos os tipos</option>
                <option value="followup">Follow-up</option>
                <option value="campaign">Campanha</option>
              </select>

              {/* Status */}
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
              >
                <option value="">Todos os status</option>
                <option value="SENT">Enviado</option>
                <option value="PENDING">Pendente</option>
                <option value="FAILED">Falhou</option>
                <option value="DELIVERED">Entregue</option>
                <option value="READ">Lido</option>
              </select>

              {/* Date From */}
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                title="Data início"
              />
            </div>

            {dateFrom && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>até</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  style={inputStyle}
                />
                <button
                  onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                  style={{ fontSize: '12px', fontWeight: 500, color: '#DC2626', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  Limpar datas
                </button>
              </div>
            )}
          </div>

          {/* Type quick filters */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['all', 'followup', 'campaign'] as MsgType[]).map((t) => (
              <button
                key={t}
                onClick={() => { setMsgType(t); setPage(1); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: msgType === t ? 'none' : '1px solid #E5E7EB',
                  backgroundColor: msgType === t ? '#3B82F6' : '#fff',
                  color: msgType === t ? '#fff' : '#6B7280',
                  cursor: 'pointer',
                }}
              >
                {t === 'followup' && <MessageSquare size={12} />}
                {t === 'campaign' && <Megaphone size={12} />}
                {t === 'all' ? 'Todos' : t === 'followup' ? 'Follow-up' : 'Campanhas'}
                {msgPagination && t === msgType && (
                  <span style={{ marginLeft: '4px', opacity: 0.7 }}>{msgPagination.total}</span>
                )}
              </button>
            ))}
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            }}
          >
            {msgLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
              </div>
            ) : !messagesData?.items?.length ? (
              <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <History style={{ margin: '0 auto 12px', color: '#D1D5DB', width: '40px', height: '40px' }} />
                <p style={{ color: '#6B7280', fontSize: '14px' }}>Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                      {['Tipo', 'Destinatário', 'Status', 'Enviado em', 'Campanha / Template', 'Erro'].map((h) => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {messagesData.items.map((item: any) => {
                      const isFollowup = item._type === 'followup';
                      const name = isFollowup ? item.lead?.name : item.name;
                      const phone = isFollowup ? item.lead?.phone : item.phone;
                      const sentAt = item.sentAt;
                      const ref = isFollowup ? item.template?.name : item.campaign?.name;

                      const tdStyle = { padding: '12px 16px' };
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 500,
                                ...(isFollowup
                                  ? { background: '#EFF6FF', color: '#2563EB' }
                                  : { background: '#F5F3FF', color: '#7C3AED' }),
                              }}
                            >
                              {isFollowup ? <MessageSquare size={11} /> : <Megaphone size={11} />}
                              {isFollowup ? 'Follow-up' : 'Campanha'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div>
                              <p style={{ fontSize: '14px', color: '#1F2937', fontWeight: 500, margin: 0 }}>{name || 'Desconhecido'}</p>
                              <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>{phone}</p>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                            <StatusBadge status={item.status} />
                          </td>
                          <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: '14px', color: '#6B7280' }}>
                              {sentAt
                                ? format(new Date(sentAt), "dd/MM/yy HH:mm", { locale: ptBR })
                                : '—'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: '14px', color: '#6B7280' }}>
                              {ref || '—'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {item.errorMessage ? (
                              <span style={{ fontSize: '12px', color: '#EF4444' }} title={item.errorMessage}>
                                {item.errorMessage}
                              </span>
                            ) : (
                              <span style={{ color: '#D1D5DB', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {msgPagination && msgPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {((page - 1) * 20) + 1}–{Math.min(page * 20, msgPagination.total)} de {msgPagination.total} resultados
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, msgPagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg border transition-colors font-medium ${
                        page === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {msgPagination.totalPages > 5 && (
                  <span className="px-2 text-gray-400 text-sm">...</span>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(msgPagination.totalPages, p + 1))}
                  disabled={page === msgPagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Tab */}
      {tab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ação ou entidade..."
              value={auditSearch}
              onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
              style={{ ...inputStyle, paddingLeft: '36px', width: '100%' }}
            />
          </div>

          <div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}
          >
            {auditLoading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
              </div>
            ) : !auditData?.logs?.length ? (
              <div className="text-center py-16">
                <Shield className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Nenhum log de auditoria encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidade</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.logs.map((log: any) => (
                      <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: '#EFF6FF', color: '#2563EB' }}
                            >
                              <User size={13} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-800 font-medium">{log.user?.name || 'Sistema'}</p>
                              <p className="text-xs text-gray-400">{log.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700 font-mono">{log.action}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">{log.entityType}</span>
                            {log.entityId && (
                              <p className="text-xs text-gray-400 mt-1 truncate max-w-[120px]">{log.entityId}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400 font-mono">{log.ipAddress || '—'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {auditPagination && auditPagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {((auditPage - 1) * 20) + 1}–{Math.min(auditPage * 20, auditPagination.total)} de {auditPagination.total} registros
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  disabled={auditPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, auditPagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setAuditPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg border transition-colors font-medium ${
                        auditPage === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {auditPagination.totalPages > 5 && (
                  <span className="px-2 text-gray-400 text-sm">...</span>
                )}
                <button
                  onClick={() => setAuditPage((p) => Math.min(auditPagination.totalPages, p + 1))}
                  disabled={auditPage === auditPagination.totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
