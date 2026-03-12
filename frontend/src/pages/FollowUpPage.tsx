import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsApi, broadcastApi, templatesApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Tag,
  Users,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Eye,
  FileText,
  Zap,
  Play,
  Pause,
  CheckCircle,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Search,
  ChevronLeft,
} from 'lucide-react';

// ============================================
// Types
// ============================================
interface Label {
  id: number;
  title: string;
  description?: string;
  color?: string;
}

interface Contact {
  contactId: number;
  conversationId: number;
  name: string;
  phone: string;
  thumbnail: string;
}

interface Template {
  id: string;
  name: string;
  content: string;
  type: string;
  order: number;
  variables: string[];
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  currentStage?: string;
  labelFilter?: string;
  followUpStatus: string;
  followUpAttempts: number;
  lastMessageSentAt?: string;
  updatedAt: string;
}

// ============================================
// Style Helpers (mesmo padrão do Broadcast)
// ============================================
const cardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  overflow: 'hidden',
};

const btnPrimary = (disabled?: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 24px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: disabled ? '#BFDBFE' : '#3B82F6',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.15s',
});

const btnOutline: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

const btnSuccess = (disabled?: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 24px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: disabled ? '#BBF7D0' : '#16A34A',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.15s',
});

// ============================================
// Steps
// ============================================
const STEPS = [
  { num: 1, title: 'Etiqueta' },
  { num: 2, title: 'Templates' },
  { num: 3, title: 'Confirmar' },
];

// ============================================
// Main Component
// ============================================
export default function FollowUpPage() {
  const navigate = useNavigate();

  // View mode: 'wizard' or 'manage'
  const [view, setView] = useState<'manage' | 'wizard'>('manage');

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Label selection
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  // Step 2: Template selection
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // Step 3: Sending
  const [sending, setSending] = useState(false);

  // Manage view state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);
  const [bulkPausing, setBulkPausing] = useState(false);

  useEffect(() => { loadLeads(); loadStats(); }, [filter, page]);

  // ============================================
  // Data Loading
  // ============================================
  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      const params: any = { page, limit: 20 };
      if (filter) params.status = filter;
      if (searchTerm) params.search = searchTerm;
      const res = await leadsApi.list(params);
      setLeads(res.data.leads);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch { toast.error('Erro ao carregar leads'); }
    finally { setLoadingLeads(false); }
  };

  const loadStats = async () => {
    try {
      const res = await leadsApi.stats();
      setStats(res.data.stats);
    } catch { /* silent */ }
  };

  const loadLabels = async () => {
    setLoadingLabels(true);
    try {
      const res = await broadcastApi.labels();
      setLabels(res.data.labels || []);
    } catch { toast.error('Erro ao carregar etiquetas'); }
    finally { setLoadingLabels(false); }
  };

  const selectLabel = async (labelTitle: string) => {
    setSelectedLabel(labelTitle);
    setLoadingContacts(true);
    setContacts([]);
    try {
      const res = await broadcastApi.contactsByLabel(labelTitle);
      setContacts(res.data.contacts || []);
    } catch { toast.error('Erro ao buscar contatos da etiqueta'); }
    finally { setLoadingContacts(false); }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await templatesApi.list('FOLLOW_UP');
      setTemplates(res.data.templates || []);
    } catch { toast.error('Erro ao carregar templates'); }
    finally { setLoadingTemplates(false); }
  };

  // ============================================
  // Wizard actions
  // ============================================
  const openWizard = () => {
    setView('wizard');
    setStep(1);
    setSelectedLabel('');
    setContacts([]);
    setSelectedTemplateIds([]);
    loadLabels();
  };

  const goToStep2 = () => {
    setStep(2);
    loadTemplates();
  };

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const startFollowUp = async () => {
    if (!selectedLabel || selectedTemplateIds.length === 0) return;
    setSending(true);
    try {
      const res = await leadsApi.startByLabel({
        label: selectedLabel,
        templateIds: selectedTemplateIds,
      });
      toast.success(res.data.message);
      setView('manage');
      loadLeads();
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao iniciar follow-up');
    } finally { setSending(false); }
  };

  // ============================================
  // Bulk actions
  // ============================================
  const handleBulkPause = async (newStatus: 'PAUSED' | 'ACTIVE') => {
    setBulkPausing(true);
    try {
      const res = await leadsApi.bulkStatus(newStatus);
      toast.success(res.data.message);
      loadLeads();
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro na operação');
    } finally { setBulkPausing(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await leadsApi.updateStatus(id, status);
      toast.success(`Status atualizado`);
      loadLeads();
      loadStats();
    } catch { toast.error('Erro ao atualizar status'); }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      ACTIVE: { bg: '#DCFCE7', color: '#16A34A', label: 'Ativo' },
      PAUSED: { bg: '#FEF3C7', color: '#D97706', label: 'Pausado' },
      COMPLETED: { bg: '#E0E7FF', color: '#4F46E5', label: 'Concluído' },
      RESPONDED: { bg: '#DBEAFE', color: '#2563EB', label: 'Respondeu' },
    };
    const s = map[status] || { bg: '#F3F4F6', color: '#6B7280', label: status };
    return (
      <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  // ==================================================================
  //  WIZARD VIEW (Idêntico ao Broadcast)
  // ==================================================================
  if (view === 'wizard') {
    return (
      <div style={{ minHeight: '100%' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <button
              onClick={() => setView('manage')}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#374151',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
            >
              <ArrowLeft size={20} strokeWidth={1.75} />
            </button>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Follow-up</h1>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                Inicie follow-ups automáticos por etiqueta do Chatwoot
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div style={{ ...cardStyle, padding: '20px 24px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  right: '20px',
                  top: '18px',
                  height: '2px',
                  backgroundColor: '#E5E7EB',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '18px',
                  height: '2px',
                  backgroundColor: '#3B82F6',
                  zIndex: 0,
                  transition: 'width 0.4s ease',
                  width: `calc(${((step - 1) / (STEPS.length - 1)) * 100}% * (100% - 40px) / 100%)`,
                }}
              />
              {STEPS.map((s) => {
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                return (
                  <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        backgroundColor: isActive ? '#3B82F6' : isCompleted ? '#EFF6FF' : '#F3F4F6',
                        color: isActive ? '#fff' : isCompleted ? '#2563EB' : '#9CA3AF',
                        boxShadow: isActive ? '0 0 0 4px rgba(59,130,246,0.15)' : 'none',
                      }}
                    >
                      {isCompleted ? <CheckCircle2 size={18} strokeWidth={2} /> : s.num}
                    </div>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: isActive || isCompleted ? '#374151' : '#9CA3AF',
                      }}
                    >
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div style={{ ...cardStyle, minHeight: '400px' }}>

            {/* ===== STEP 1: Select Label ===== */}
            {step === 1 && (
              <div style={{ padding: '24px 32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>
                  Selecione a Etiqueta
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Escolha uma etiqueta do Chatwoot para selecionar os contatos que receberão follow-up.
                </p>

                {loadingLabels ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 size={24} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: '12px', color: '#6B7280', fontSize: '14px' }}>Carregando etiquetas...</span>
                  </div>
                ) : (
                  <>
                    {/* Labels Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                      {labels.map((label) => {
                        const isSelected = selectedLabel === label.title;
                        return (
                          <button
                            key={label.id}
                            onClick={() => selectLabel(label.title)}
                            style={{
                              padding: '16px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                              backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                              cursor: 'pointer',
                              textAlign: 'left' as const,
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                            onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#BFDBFE'; }}
                            onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#E5E7EB'; }}
                          >
                            <div
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: label.color || '#6B7280',
                                flexShrink: 0,
                              }}
                            />
                            <div style={{ overflow: 'hidden' }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0, textTransform: 'capitalize' as const }}>
                                {label.title}
                              </p>
                              {label.description && (
                                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {label.description}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {labels.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Tag size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
                        <p style={{ color: '#6B7280', fontSize: '14px' }}>Nenhuma etiqueta encontrada no Chatwoot</p>
                      </div>
                    )}

                    {/* Refresh labels */}
                    <button
                      onClick={loadLabels}
                      style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '6px 14px' }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                    >
                      <RefreshCw size={14} /> Atualizar
                    </button>

                    {/* Contacts preview */}
                    {selectedLabel && (
                      <div
                        style={{
                          marginTop: '24px',
                          backgroundColor: '#F9FAFB',
                          border: '1px solid #E5E7EB',
                          borderRadius: '10px',
                          padding: '20px',
                        }}
                      >
                        {loadingContacts ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Loader2 size={18} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
                            <span style={{ color: '#6B7280', fontSize: '14px' }}>Buscando contatos...</span>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    backgroundColor: '#DBEAFE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Users size={18} style={{ color: '#2563EB' }} />
                                </div>
                                <div>
                                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                                    {contacts.length} contatos encontrados
                                  </p>
                                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0' }}>
                                    Etiqueta: <strong>{selectedLabel}</strong>
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowContacts(!showContacts)}
                                style={{ ...btnOutline, padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                              >
                                <Eye size={14} /> {showContacts ? 'Ocultar' : 'Ver lista'}
                              </button>
                            </div>

                            {showContacts && contacts.length > 0 && (
                              <div style={{ maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                                {contacts.map((c, idx) => (
                                  <div
                                    key={c.contactId}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                      padding: '6px 0',
                                      borderBottom: idx < contacts.length - 1 ? '1px solid #F3F4F6' : 'none',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: '#E5E7EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#6B7280',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                      <p style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {c.name}
                                      </p>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#9CA3AF', flexShrink: 0 }}>{c.phone || 'sem telefone'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={goToStep2}
                    disabled={!selectedLabel || contacts.length === 0 || loadingContacts}
                    style={btnPrimary(!selectedLabel || contacts.length === 0 || loadingContacts)}
                    onMouseOver={(e) => { if (selectedLabel && contacts.length > 0) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                    onMouseOut={(e) => { if (selectedLabel && contacts.length > 0) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                  >
                    Próximo <ChevronRight size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 2: Select Templates ===== */}
            {step === 2 && (
              <div style={{ padding: '24px 32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>
                  Selecione os Templates
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Escolha os templates na ordem de envio. O 1º template será enviado na 1ª tentativa, o 2º na 2ª, e assim por diante.
                </p>

                {loadingTemplates ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                    <Loader2 size={24} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
                    <span style={{ marginLeft: '12px', color: '#6B7280', fontSize: '14px' }}>Carregando templates...</span>
                  </div>
                ) : templates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <FileText size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>Nenhum template de follow-up encontrado</p>
                    <p style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '4px' }}>Crie templates na aba Templates primeiro</p>
                  </div>
                ) : (
                  <>
                    {/* Template list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      {templates.map((template) => {
                        const isSelected = selectedTemplateIds.includes(template.id);
                        const orderIndex = selectedTemplateIds.indexOf(template.id);
                        return (
                          <button
                            key={template.id}
                            onClick={() => toggleTemplate(template.id)}
                            style={{
                              padding: '18px 20px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                              backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                              cursor: 'pointer',
                              textAlign: 'left' as const,
                              transition: 'all 0.15s',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '14px',
                            }}
                            onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.borderColor = '#BFDBFE'; }}
                            onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.borderColor = isSelected ? '#3B82F6' : '#E5E7EB'; }}
                          >
                            {isSelected ? (
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  backgroundColor: '#3B82F6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '14px',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {orderIndex + 1}
                              </div>
                            ) : (
                              <div
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  border: '2px solid #D1D5DB',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                                {template.name}
                              </p>
                              <p style={{ fontSize: '13px', color: '#6B7280', margin: '6px 0 0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {template.content.length > 150 ? template.content.slice(0, 150) + '...' : template.content}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Sequence summary */}
                    {selectedTemplateIds.length > 0 && (
                      <div
                        style={{
                          backgroundColor: '#F0F9FF',
                          border: '1px solid #BAE6FD',
                          borderRadius: '10px',
                          padding: '14px 18px',
                          marginBottom: '16px',
                        }}
                      >
                        <p style={{ fontSize: '13px', color: '#0369A1', fontWeight: 600, margin: '0 0 4px' }}>
                          Sequência definida:
                        </p>
                        <p style={{ fontSize: '13px', color: '#0284C7', margin: 0 }}>
                          {selectedTemplateIds.map((id, i) => {
                            const t = templates.find(t => t.id === id);
                            return `${i + 1}. ${t?.name || '—'}`;
                          }).join('  →  ')}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '24px',
                    marginTop: '8px',
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  <button
                    onClick={() => setStep(1)}
                    style={btnOutline}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={selectedTemplateIds.length === 0}
                    style={btnPrimary(selectedTemplateIds.length === 0)}
                    onMouseOver={(e) => { if (selectedTemplateIds.length > 0) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                    onMouseOut={(e) => { if (selectedTemplateIds.length > 0) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                  >
                    Próximo <ChevronRight size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            )}

            {/* ===== STEP 3: Confirm ===== */}
            {step === 3 && (
              <div style={{ padding: '24px 32px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>
                  Confirmar Follow-up
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Revise as informações abaixo antes de iniciar o follow-up automático.
                </p>

                {/* Summary cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Tag size={18} style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Etiqueta</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#2563EB' }}>{selectedLabel}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Users size={18} style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Contatos</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>{contacts.length}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={18} style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>Templates na sequência</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>{selectedTemplateIds.length}</span>
                  </div>
                </div>

                {/* Sequence detail */}
                <div style={{ backgroundColor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: '24px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 10px' }}>Sequência de envio:</p>
                  {selectedTemplateIds.map((id, i) => {
                    const t = templates.find(t => t.id === id);
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < selectedTemplateIds.length - 1 ? '1px solid #E5E7EB' : 'none' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#3B82F6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: '13px', color: '#374151' }}>{t?.name || '—'}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Warning */}
                <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#92400E', margin: 0 }}>
                    ⚠️ O follow-up será enviado automaticamente respeitando o horário de trabalho configurado nas Configurações.
                  </p>
                </div>

                {/* Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '24px',
                    marginTop: '8px',
                    borderTop: '1px solid #F3F4F6',
                  }}
                >
                  <button
                    onClick={() => setStep(2)}
                    style={btnOutline}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={startFollowUp}
                    disabled={sending}
                    style={btnSuccess(sending)}
                    onMouseOver={(e) => { if (!sending) e.currentTarget.style.backgroundColor = '#15803D'; }}
                    onMouseOut={(e) => { if (!sending) e.currentTarget.style.backgroundColor = '#16A34A'; }}
                  >
                    <Zap size={16} />
                    {sending ? 'Iniciando...' : 'Iniciar Follow-up'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  //  MANAGE VIEW (Tabela de leads)
  // ==================================================================
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Follow-up</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>Gerencie follow-ups automáticos por etiqueta</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(stats?.leads?.active || 0) > 0 && (
            <button
              onClick={() => handleBulkPause('PAUSED')}
              disabled={bulkPausing}
              style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#FCD34D', color: '#92400E', backgroundColor: '#FFFBEB' }}
            >
              <PauseCircle size={16} />
              {bulkPausing ? 'Processando...' : 'Pausar Todos'}
            </button>
          )}
          {(stats?.leads?.paused || 0) > 0 && (
            <button
              onClick={() => handleBulkPause('ACTIVE')}
              disabled={bulkPausing}
              style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#86EFAC', color: '#166534', backgroundColor: '#F0FDF4' }}
            >
              <PlayCircle size={16} />
              {bulkPausing ? 'Processando...' : 'Retomar Todos'}
            </button>
          )}
          <button onClick={openWizard} style={btnPrimary()}>
            <Zap size={16} />
            Iniciar Follow-up
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Ativos', value: stats.leads?.active || 0, color: '#16A34A', IconComp: Play },
            { label: 'Pausados', value: stats.leads?.paused || 0, color: '#D97706', IconComp: Pause },
            { label: 'Responderam', value: stats.leads?.responded || 0, color: '#2563EB', IconComp: MessageCircle },
            { label: 'Concluídos', value: stats.leads?.completed || 0, color: '#4F46E5', IconComp: CheckCircle },
            { label: 'Taxa Resposta', value: stats.responseRate || '0%', color: '#0F766E', IconComp: RefreshCw },
          ].map(s => (
            <div key={s.label} style={{ ...cardStyle, padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.IconComp size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            type="text"
            placeholder="Buscar lead..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadLeads()}
            style={{
              width: '100%',
              paddingLeft: '36px',
              paddingRight: '14px',
              paddingTop: '10px',
              paddingBottom: '10px',
              borderRadius: '8px',
              fontSize: '13px',
              border: '1px solid #E5E7EB',
              outline: 'none',
              boxSizing: 'border-box' as const,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: '', label: 'Todos' },
            { key: 'ACTIVE', label: 'Ativos' },
            { key: 'PAUSED', label: 'Pausados' },
            { key: 'RESPONDED', label: 'Responderam' },
            { key: 'COMPLETED', label: 'Concluídos' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: filter === f.key ? '#3B82F6' : '#F3F4F6',
                color: filter === f.key ? '#fff' : '#6B7280',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div style={cardStyle}>
        {loadingLeads ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6', margin: '0 auto 8px' }} />
            <p style={{ fontSize: '14px' }}>Carregando...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Users size={40} style={{ color: '#D1D5DB', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Nenhum lead encontrado</h3>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>Inicie um follow-up clicando no botão acima</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Lead</th>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Etiqueta</th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Tentativas</th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, idx) => (
                  <tr key={lead.id} style={{ borderBottom: idx < leads.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: 0 }}>{lead.name}</p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '3px 0 0' }}>{lead.phone}</p>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {lead.labelFilter ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#F0F9FF', color: '#0369A1' }}>
                          <Tag size={12} />
                          {lead.labelFilter}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#D1D5DB' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{lead.followUpAttempts}</span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'center' }}>{statusBadge(lead.followUpStatus)}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                        {lead.followUpStatus === 'ACTIVE' && (
                          <button
                            onClick={() => updateStatus(lead.id, 'PAUSED')}
                            title="Pausar"
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF', transition: 'color 0.15s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#D97706'; e.currentTarget.style.backgroundColor = '#FEF3C7'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Pause size={16} />
                          </button>
                        )}
                        {lead.followUpStatus === 'PAUSED' && (
                          <button
                            onClick={() => updateStatus(lead.id, 'ACTIVE')}
                            title="Retomar"
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF', transition: 'color 0.15s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#16A34A'; e.currentTarget.style.backgroundColor = '#DCFCE7'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {(lead.followUpStatus === 'ACTIVE' || lead.followUpStatus === 'PAUSED') && (
                          <button
                            onClick={() => updateStatus(lead.id, 'COMPLETED')}
                            title="Concluir"
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF', transition: 'color 0.15s' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#4F46E5'; e.currentTarget.style.backgroundColor = '#E0E7FF'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>Página {page} de {totalPages}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#fff', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
