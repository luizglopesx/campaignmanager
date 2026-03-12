import { useState, useEffect } from 'react';
import { statusApi } from '../services/api';
import toast from 'react-hot-toast';
import {
  Upload,
  X,
  Image as ImageIcon,
  Film,
  Send,
  Loader2,
  CheckCircle2,
  Clock,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye,
} from 'lucide-react';

// ============================================
// Types
// ============================================
interface UploadResult {
  url: string;
  path: string;
  mediaType: 'image' | 'video';
  videoDuration?: number;
  wasProcessed?: boolean;
  originalSize?: string;
  finalSize?: string;
}

interface StatusHistoryItem {
  id: string;
  action: string;
  details: {
    mediaUrl?: string;
    caption?: string;
    mediaType?: string;
    messageId?: string;
  };
  createdAt: string;
  user: { name: string };
}

// ============================================
// Style Helpers
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
  padding: '12px 28px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: disabled ? '#BFDBFE' : '#3B82F6',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'background-color 0.15s',
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid #E5E7EB',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#374151',
  backgroundColor: '#fff',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#3B82F6';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.10)';
  },
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#E5E7EB';
    e.currentTarget.style.boxShadow = 'none';
  },
};

// ============================================
// Main Component
// ============================================
export default function StatusPage() {
  // Upload state
  const [mediaPreview, setMediaPreview] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [caption, setCaption] = useState('');

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // History
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  // ============================================
  // Upload
  // ============================================
  const handleMediaUpload = async (file: File) => {
    const isVideo = file.type.startsWith('video/');

    setUploading(true);
    setUploadProgress(isVideo ? 'Processando vídeo (cortando para 30s, convertendo para MP4)...' : 'Enviando imagem...');
    setPublished(false);

    try {
      const res = await statusApi.upload(file);
      const data: UploadResult = res.data;

      setUploadResult(data);
      setMediaPreview(URL.createObjectURL(file));

      if (data.wasProcessed) {
        toast.success(`Vídeo processado: ${data.videoDuration}s (${data.originalSize} → ${data.finalSize})`);
      } else {
        toast.success('Mídia carregada com sucesso');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro no upload');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const removeMedia = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview('');
    setUploadResult(null);
    setCaption('');
    setPublished(false);
  };

  // ============================================
  // Publish
  // ============================================
  const handlePublish = async () => {
    if (!uploadResult) return;

    if (!window.confirm('Publicar este conteúdo no Status do WhatsApp?\nSerá visível para todos os seus contatos.')) return;

    setPublishing(true);
    try {
      await statusApi.publish({
        mediaUrl: uploadResult.url,
        caption: caption || undefined,
        mediaType: uploadResult.mediaType,
      });
      toast.success('Status publicado com sucesso!');
      setPublished(true);
      loadHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao publicar status');
    } finally {
      setPublishing(false);
    }
  };

  // ============================================
  // History
  // ============================================
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await statusApi.history();
      setHistory(res.data || []);
    } catch {
      // Silently ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  // ============================================
  // Render
  // ============================================
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone size={20} style={{ color: '#059669' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Status do WhatsApp</h1>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                Publique imagens e vídeos no seu Status (visível para todos os contatos)
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div
          style={{
            ...cardStyle,
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <AlertTriangle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', margin: '0 0 4px' }}>
              Sobre vídeos para Status
            </p>
            <p style={{ fontSize: '13px', color: '#92400E', margin: 0, lineHeight: 1.5 }}>
              Vídeos serão automaticamente cortados para <strong>30 segundos</strong> e convertidos para <strong>MP4 (H.264)</strong>.
              A resolução máxima é 720p para garantir compatibilidade.
            </p>
          </div>
        </div>

        {/* Main Card - Upload + Compose */}
        <div style={{ ...cardStyle, padding: '28px 32px', marginBottom: '20px' }}>

          {/* Media Upload Zone */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
              Mídia do Status
            </label>

            {!uploadResult ? (
              <div
                style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: '12px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  backgroundColor: '#FAFAFA',
                  transition: 'all 0.2s',
                  position: 'relative',
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
                  if (file && !uploading) handleMediaUpload(file);
                }}
                onClick={() => {
                  if (!uploading) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime';
                    input.onchange = (ev) => {
                      const file = (ev.target as HTMLInputElement).files?.[0];
                      if (file) handleMediaUpload(file);
                    };
                    input.click();
                  }
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={40} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>
                      {uploadProgress || 'Processando...'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
                      Aguarde, isso pode levar alguns segundos
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <Upload size={28} style={{ color: '#3B82F6' }} />
                    </div>
                    <p style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>
                      Arraste uma imagem ou vídeo aqui
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px' }}>
                      ou clique para selecionar
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
                        <ImageIcon size={14} /> JPEG, PNG, WebP, GIF
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9CA3AF' }}>
                        <Film size={14} /> MP4, WebM, MOV (max 50MB)
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div>
                {/* Preview */}
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#000',
                  }}
                >
                  {uploadResult.mediaType === 'video' ? (
                    <video
                      src={mediaPreview}
                      controls
                      style={{ width: '100%', maxHeight: '360px', display: 'block' }}
                    />
                  ) : (
                    <img
                      src={mediaPreview}
                      alt="Preview do Status"
                      style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block' }}
                    />
                  )}
                  <button
                    onClick={removeMedia}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.8)')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Media Info Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '10px 14px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '0 0 12px 12px',
                    border: '1px solid #E5E7EB',
                    borderTop: 'none',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {uploadResult.mediaType === 'video' ? (
                      <Film size={14} style={{ color: '#6B7280' }} />
                    ) : (
                      <ImageIcon size={14} style={{ color: '#6B7280' }} />
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>
                      {uploadResult.mediaType === 'video' ? 'Vídeo' : 'Imagem'}
                    </span>
                  </div>

                  {uploadResult.videoDuration !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} style={{ color: '#6B7280' }} />
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {uploadResult.videoDuration}s
                      </span>
                    </div>
                  )}

                  {uploadResult.finalSize && (
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {uploadResult.finalSize}
                    </span>
                  )}

                  {uploadResult.wasProcessed && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Processado
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Caption */}
          {uploadResult && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Legenda (opcional)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma legenda ao seu status..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                {...focusHandlers}
              />
            </div>
          )}

          {/* Publish Button */}
          {uploadResult && !published && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={btnPrimary(publishing)}
              onMouseOver={(e) => {
                if (!publishing) e.currentTarget.style.backgroundColor = '#2563EB';
              }}
              onMouseOut={(e) => {
                if (!publishing) e.currentTarget.style.backgroundColor = '#3B82F6';
              }}
            >
              {publishing ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Publicando...
                </>
              ) : (
                <>
                  <Send size={16} /> Publicar no Status
                </>
              )}
            </button>
          )}

          {/* Success Message */}
          {published && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={32} style={{ color: '#059669', margin: '0 auto 8px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#065F46', margin: '0 0 4px' }}>
                Status publicado com sucesso!
              </p>
              <p style={{ fontSize: '13px', color: '#047857', margin: '0 0 16px' }}>
                Seu conteúdo está visível para todos os seus contatos do WhatsApp.
              </p>
              <button
                onClick={removeMedia}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: '1px solid #A7F3D0',
                  backgroundColor: '#fff',
                  color: '#059669',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF4')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
              >
                <RefreshCw size={14} /> Publicar outro
              </button>
            </div>
          )}
        </div>

        {/* History Section */}
        <div style={{ ...cardStyle, overflow: 'visible' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              width: '100%',
              padding: '16px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={18} style={{ color: '#6B7280' }} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Histórico de Status ({history.length})
              </span>
            </div>
            <span
              style={{
                fontSize: '18px',
                color: '#9CA3AF',
                transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}
            >
              ▾
            </span>
          </button>

          {showHistory && (
            <div style={{ borderTop: '1px solid #E5E7EB' }}>
              {loadingHistory ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <Loader2 size={20} style={{ color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : history.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Nenhum status publicado ainda</p>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 24px',
                        borderBottom: '1px solid #F3F4F6',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#ECFDF5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.details?.mediaType === 'video' ? (
                          <Film size={16} style={{ color: '#059669' }} />
                        ) : (
                          <ImageIcon size={16} style={{ color: '#059669' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', margin: 0 }}>
                          {item.details?.caption || 'Sem legenda'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '2px 0 0' }}>
                          {item.user?.name} — {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      {item.details?.mediaUrl && (
                        <a
                          href={item.details.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#fff',
                            color: '#6B7280',
                            fontSize: '12px',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            flexShrink: 0,
                          }}
                        >
                          <Eye size={12} /> Ver
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
