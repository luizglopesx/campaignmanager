import { useEffect, useState } from 'react';
import { leadsApi } from '../services/api';
import { Search, Pause, Play, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FollowUpPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadLeads(); }, [pagination.page, statusFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await leadsApi.list({ page: pagination.page, status: statusFilter || undefined, search: search || undefined });
      setLeads(res.data.leads);
      setPagination(res.data.pagination);
    } catch { toast.error('Erro ao carregar leads'); }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPagination(p => ({ ...p, page: 1 })); loadLeads(); };

  const updateStatus = async (id: string, status: string) => {
    try { await leadsApi.updateStatus(id, status); toast.success('Status atualizado'); loadLeads(); }
    catch { toast.error('Erro ao atualizar status'); }
  };

  const statusBadgeStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      ACTIVE: { backgroundColor: '#ECFDF5', color: '#047857' },
      PAUSED: { backgroundColor: '#FFFBEB', color: '#B45309' },
      COMPLETED: { backgroundColor: '#EFF6FF', color: '#2563EB' },
      RESPONDED: { backgroundColor: '#F5F3FF', color: '#6D28D9' },
    };
    return map[status] || { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  const filterLabels: Record<string, string> = {
    '': 'Todos',
    ACTIVE: 'Ativo',
    PAUSED: 'Pausado',
    RESPONDED: 'Respondeu',
    COMPLETED: 'Concluído',
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100%' }}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Follow-up</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Gerencie o follow-up dos seus leads</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} style={{ flex: 1, position: 'relative' }}>
            <Search
              size={16}
              strokeWidth={1.75}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9CA3AF',
              }}
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '16px',
                paddingTop: '10px',
                paddingBottom: '10px',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#374151',
                backgroundColor: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#3B82F6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = '#E5E7EB';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </form>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['', 'ACTIVE', 'PAUSED', 'RESPONDED', 'COMPLETED'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPagination(p => ({ ...p, page: 1 })); }}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: statusFilter === s ? 'none' : '1px solid #E5E7EB',
                  backgroundColor: statusFilter === s ? '#3B82F6' : '#fff',
                  color: statusFilter === s ? '#fff' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {filterLabels[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  {['Nome', 'Telefone', 'Estágio', 'Tentativas', 'Status', 'Ações'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 16px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontWeight: 400,
                        color: '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} style={{ padding: '12px 16px' }}>
                        <div
                          className="animate-pulse"
                          style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '6px' }}
                        />
                      </td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '40px 16px',
                        textAlign: 'center',
                        fontSize: '14px',
                        color: '#6B7280',
                      }}
                    >
                      Nenhum lead encontrado
                    </td>
                  </tr>
                ) : (
                  leads.map(lead => (
                    <tr
                      key={lead.id}
                      style={{ borderBottom: '1px solid #F3F4F6' }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {lead.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>{lead.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{lead.phone}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{lead.currentStage || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{lead.followUpAttempts}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '2px 10px',
                            borderRadius: '6px',
                            ...statusBadgeStyle(lead.followUpStatus),
                          }}
                        >
                          {lead.followUpStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {lead.followUpStatus === 'ACTIVE' && (
                            <button
                              onClick={() => updateStatus(lead.id, 'PAUSED')}
                              title="Pausar"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#F59E0B',
                                cursor: 'pointer',
                              }}
                              className="hover:bg-yellow-50 transition-colors"
                            >
                              <Pause size={15} strokeWidth={1.75} />
                            </button>
                          )}
                          {lead.followUpStatus === 'PAUSED' && (
                            <button
                              onClick={() => updateStatus(lead.id, 'ACTIVE')}
                              title="Retomar"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#10B981',
                                cursor: 'pointer',
                              }}
                              className="hover:bg-green-50 transition-colors"
                            >
                              <Play size={15} strokeWidth={1.75} />
                            </button>
                          )}
                          {lead.followUpStatus !== 'COMPLETED' && (
                            <button
                              onClick={() => updateStatus(lead.id, 'COMPLETED')}
                              title="Concluir"
                              style={{
                                padding: '6px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: '#3B82F6',
                                cursor: 'pointer',
                              }}
                              className="hover:bg-blue-50 transition-colors"
                            >
                              <CheckCircle size={15} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '13px', color: '#6B7280' }}>{pagination.total} leads</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                    opacity: pagination.page === 1 ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={16} strokeWidth={1.75} />
                </button>
                <span style={{ padding: '4px 12px', fontSize: '14px', color: '#374151' }}>
                  {pagination.page}/{pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    color: '#374151',
                    cursor: pagination.page === pagination.totalPages ? 'not-allowed' : 'pointer',
                    opacity: pagination.page === pagination.totalPages ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={16} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
