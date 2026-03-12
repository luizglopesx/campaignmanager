import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { broadcastApi, uploadApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Radio,
  Tag,
  Users,
  Send,
  Upload,
  X,
  Image as ImageIcon,
  Film,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
  Eye,
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

interface BroadcastProgress {
  status: string;
  total: number;
  sent: number;
  failed: number;
  pending: number;
  progress: number;
  lastProcessed?: {
    name: string;
    phone: string;
    status: string;
    sentAt: string;
  };
}

// ============================================
// Style Helpers (seguindo padrão do projeto)
// ============================================
const inputStyle = (disabled?: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#374151',
  backgroundColor: disabled ? '#F9FAFB' : '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
});

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#3B82F6';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)';
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#E5E7EB';
    e.currentTarget.style.boxShadow = 'none';
  },
};

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

const btnDanger = (disabled?: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 24px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: disabled ? '#FECACA' : '#EF4444',
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
  { num: 2, title: 'Mensagem' },
  { num: 3, title: 'Envio' },
];

// ============================================
// Main Component
// ============================================
export default function BroadcastPage() {
  const navigate = useNavigate();

  // Step state
  const [step, setStep] = useState(1);

  // Step 1: Label selection
  const [labels, setLabels] = useState<Label[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  // Step 2: Message compose
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<string>('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  // Step 3: Sending
  const [broadcastId, setBroadcastId] = useState<string>('');
  const [progress, setProgress] = useState<BroadcastProgress | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================
  // Step 1: Load labels
  // ============================================
  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    setLoadingLabels(true);
    try {
      const res = await broadcastApi.labels();
      setLabels(res.data.labels || []);
    } catch (err: any) {
      toast.error('Erro ao carregar etiquetas do Chatwoot');
    } finally {
      setLoadingLabels(false);
    }
  };

  const selectLabel = async (labelTitle: string) => {
    setSelectedLabel(labelTitle);
    setLoadingContacts(true);
    setContacts([]);
    try {
      const res = await broadcastApi.contactsByLabel(labelTitle);
      setContacts(res.data.contacts || []);
    } catch (err: any) {
      toast.error('Erro ao buscar contatos da etiqueta');
    } finally {
      setLoadingContacts(false);
    }
  };

  // ============================================
  // Step 2: Media upload
  // ============================================
  const handleMediaUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadApi.media(file);
      setMediaUrl(res.data.url);
      setMediaType(res.data.mediaType);
      setMediaPreview(URL.createObjectURL(file));
      toast.success('Mídia enviada com sucesso');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaUrl('');
    setMediaType('');
    setMediaPreview('');
  };

  // ============================================
  // Step 3: Broadcast control
  // ============================================
  const startBroadcast = async () => {
    setIsSending(true);
    try {
      const res = await broadcastApi.create({
        label: selectedLabel,
        message,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        name: `Broadcast - ${selectedLabel}`,
      });
      setBroadcastId(res.data.id);
      setStep(3);
      toast.success(`Broadcast iniciado com ${res.data.queued} destinatários`);
      startPolling(res.data.id);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao iniciar broadcast');
    } finally {
      setIsSending(false);
    }
  };

  const startPolling = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await broadcastApi.progress(id);
        setProgress(res.data);
        if (res.data.status === 'COMPLETED' || res.data.status === 'CANCELLED') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCancel = async () => {
    if (!window.confirm('Tem certeza que deseja CANCELAR este broadcast? Os envios pendentes serão interrompidos.')) return;
    setIsCancelling(true);
    try {
      await broadcastApi.cancel(broadcastId);
      toast.success('Broadcast cancelado');
      if (pollRef.current) clearInterval(pollRef.current);
      // Atualizar progresso uma última vez
      const res = await broadcastApi.progress(broadcastId);
      setProgress(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar');
    } finally {
      setIsCancelling(false);
    }
  };

  const resetWizard = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setStep(1);
    setSelectedLabel('');
    setContacts([]);
    setMessage('');
    removeMedia();
    setBroadcastId('');
    setProgress(null);
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/')}
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
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Broadcast</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
              Envie mensagens em massa para contatos por etiqueta do Chatwoot
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

          {/* ===== STEP 1: Selecionar Etiqueta ===== */}
          {step === 1 && (
            <div style={{ padding: '24px 32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>
                Selecione a Etiqueta
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                Escolha uma etiqueta do Chatwoot para selecionar os contatos que receberão a mensagem.
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
                            textAlign: 'left',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                          onMouseOver={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = '#BFDBFE';
                          }}
                          onMouseOut={(e) => {
                            if (!isSelected) e.currentTarget.style.borderColor = '#E5E7EB';
                          }}
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
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: 0, textTransform: 'capitalize' }}>
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
                            <div
                              style={{
                                maxHeight: '200px',
                                overflowY: 'auto',
                                borderTop: '1px solid #E5E7EB',
                                paddingTop: '12px',
                              }}
                            >
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
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  paddingTop: '24px',
                  marginTop: '24px',
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedLabel || contacts.length === 0 || loadingContacts}
                  style={btnPrimary(!selectedLabel || contacts.length === 0 || loadingContacts)}
                  onMouseOver={(e) => {
                    if (selectedLabel && contacts.length > 0) e.currentTarget.style.backgroundColor = '#2563EB';
                  }}
                  onMouseOut={(e) => {
                    if (selectedLabel && contacts.length > 0) e.currentTarget.style.backgroundColor = '#3B82F6';
                  }}
                >
                  Próximo <ChevronRight size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Compor Mensagem ===== */}
          {step === 2 && (
            <div style={{ padding: '24px 32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>
                Compor Mensagem
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                Escreva a mensagem e (opcionalmente) adicione uma imagem ou vídeo.
              </p>

              {/* Media Upload Zone */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Mídia (opcional)
                </label>

                {!mediaUrl ? (
                  <div
                    style={{
                      border: '2px dashed #D1D5DB',
                      borderRadius: '10px',
                      padding: '32px',
                      textAlign: 'center',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      backgroundColor: '#FAFAFA',
                      transition: 'border-color 0.15s',
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#3B82F6';
                      e.currentTarget.style.backgroundColor = '#EFF6FF';
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = '#D1D5DB';
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                      const file = e.dataTransfer.files[0];
                      if (file) handleMediaUpload(file);
                    }}
                    onClick={() => {
                      if (!uploading) {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleMediaUpload(file);
                        };
                        input.click();
                      }
                    }}
                  >
                    {uploading ? (
                      <Loader2 size={32} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                    ) : (
                      <Upload size={32} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
                    )}
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>
                      {uploading ? 'Enviando...' : 'Arraste uma imagem ou vídeo aqui'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      JPEG, PNG, WebP, GIF, MP4, WebM (max 30MB)
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#000',
                    }}
                  >
                    {mediaType === 'video' ? (
                      <video
                        src={mediaPreview}
                        controls
                        style={{ width: '100%', maxHeight: '280px', display: 'block' }}
                      />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Preview"
                        style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }}
                      />
                    )}
                    <button
                      onClick={removeMedia}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                      }}
                    >
                      <X size={16} />
                    </button>
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: '#F9FAFB',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {mediaType === 'video' ? (
                        <Film size={14} style={{ color: '#6B7280' }} />
                      ) : (
                        <ImageIcon size={14} style={{ color: '#6B7280' }} />
                      )}
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {mediaType === 'video' ? 'Vídeo' : 'Imagem'} carregada
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Text */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Mensagem
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua mensagem aqui..."
                  rows={6}
                  style={{ ...inputStyle(), resize: 'vertical' }}
                  {...focusHandlers}
                />
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>
                  A mensagem será enviada para todos os {contacts.length} contatos da etiqueta "{selectedLabel}".
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
                  onClick={() => setStep(1)}
                  style={btnOutline}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  Voltar
                </button>
                <button
                  onClick={startBroadcast}
                  disabled={(!message && !mediaUrl) || isSending}
                  style={btnPrimary((!message && !mediaUrl) || isSending)}
                  onMouseOver={(e) => {
                    if (message || mediaUrl) e.currentTarget.style.backgroundColor = '#2563EB';
                  }}
                  onMouseOut={(e) => {
                    if (message || mediaUrl) e.currentTarget.style.backgroundColor = '#3B82F6';
                  }}
                >
                  {isSending ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Iniciando...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Disparar para {contacts.length} contatos
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Progresso de Envio ===== */}
          {step === 3 && (
            <div style={{ padding: '32px' }}>
              {/* Status Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                {progress?.status === 'COMPLETED' ? (
                  <>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: '#ECFDF5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <CheckCircle2 size={36} style={{ color: '#10B981' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>
                      Broadcast Concluído!
                    </h2>
                  </>
                ) : progress?.status === 'CANCELLED' ? (
                  <>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: '#FEF2F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <StopCircle size={36} style={{ color: '#EF4444' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>
                      Broadcast Cancelado
                    </h2>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <Radio size={36} style={{ color: '#3B82F6', animation: 'pulse 2s ease-in-out infinite' }} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>
                      Enviando...
                    </h2>
                  </>
                )}
                <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                  Etiqueta: <strong>{selectedLabel}</strong>
                </p>
              </div>

              {/* Progress Bar */}
              {progress && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                        Enviando para {progress.sent + progress.failed}/{progress.total} clientes...
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6' }}>
                        {progress.progress}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '12px',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: '6px',
                          transition: 'width 0.5s ease',
                          width: `${progress.progress}%`,
                          background: progress.status === 'CANCELLED'
                            ? '#EF4444'
                            : progress.status === 'COMPLETED'
                            ? '#10B981'
                            : 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                      marginBottom: '24px',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: '#ECFDF5',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '24px', fontWeight: 700, color: '#059669', margin: '0 0 4px' }}>
                        {progress.sent}
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', margin: 0 }}>Enviados</p>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#FEF2F2',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '24px', fontWeight: 700, color: '#DC2626', margin: '0 0 4px' }}>
                        {progress.failed}
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', margin: 0 }}>Falharam</p>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#FFFBEB',
                        borderRadius: '10px',
                        padding: '16px',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ fontSize: '24px', fontWeight: 700, color: '#D97706', margin: '0 0 4px' }}>
                        {progress.pending}
                      </p>
                      <p style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280', margin: 0 }}>Pendentes</p>
                    </div>
                  </div>

                  {/* Last processed */}
                  {progress.lastProcessed && (
                    <div
                      style={{
                        backgroundColor: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '24px',
                      }}
                    >
                      {progress.lastProcessed.status === 'SENT' ? (
                        <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />
                      ) : (
                        <AlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        Último: <strong style={{ color: '#374151' }}>{progress.lastProcessed.name || progress.lastProcessed.phone}</strong>
                        {' — '}
                        {progress.lastProcessed.status === 'SENT' ? 'Enviado' : 'Falhou'}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                {progress?.status === 'RUNNING' && (
                  <button
                    onClick={handleCancel}
                    disabled={isCancelling}
                    style={btnDanger(isCancelling)}
                    onMouseOver={(e) => {
                      if (!isCancelling) e.currentTarget.style.backgroundColor = '#DC2626';
                    }}
                    onMouseOut={(e) => {
                      if (!isCancelling) e.currentTarget.style.backgroundColor = '#EF4444';
                    }}
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Cancelando...
                      </>
                    ) : (
                      <>
                        <StopCircle size={16} /> Parar Envio
                      </>
                    )}
                  </button>
                )}

                {(progress?.status === 'COMPLETED' || progress?.status === 'CANCELLED') && (
                  <>
                    <button
                      onClick={resetWizard}
                      style={{
                        ...btnPrimary(false),
                        gap: '8px',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
                    >
                      Novo Broadcast
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      style={btnOutline}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                    >
                      Ir para Dashboard
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS keyframes for spinner animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
