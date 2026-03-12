import { useEffect, useState } from 'react';
import { templatesApi } from '../services/api';
import { Plus, FileText, Copy, Trash2, Eye, Edit3, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

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
  justifyContent: 'center',
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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

export default function TemplatesPage() {
  const [view, setView] = useState<'manage' | 'form'>('manage');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', content: '', type: 'FOLLOW_UP', order: 0 });

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try { const res = await templatesApi.list(); setTemplates(res.data.templates); }
    catch { toast.error('Erro ao carregar templates'); }
    finally { setLoading(false); }
  };

  const saveTemplate = async () => {
    try {
      if (editing) { await templatesApi.update(editing.id, form); toast.success('Template atualizado!'); }
      else { await templatesApi.create(form); toast.success('Template criado!'); }
      setView('manage');
      setEditing(null);
      setForm({ name: '', content: '', type: 'FOLLOW_UP', order: 0 });
      loadTemplates();
    } catch { toast.error('Erro ao salvar template'); }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Remover este template?')) return;
    try { await templatesApi.delete(id); toast.success('Template removido'); loadTemplates(); }
    catch { toast.error('Erro ao remover'); }
  };

  const duplicateTemplate = async (id: string) => {
    try { await templatesApi.duplicate(id); toast.success('Template duplicado!'); loadTemplates(); }
    catch { toast.error('Erro ao duplicar'); }
  };

  const showPreview = async (id: string) => {
    try { const res = await templatesApi.preview(id); setPreview(res.data.preview); }
    catch { toast.error('Erro ao gerar preview'); }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', content: '', type: 'FOLLOW_UP', order: 0 });
    setView('form');
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, content: t.content, type: t.type, order: t.order || 0 });
    setView('form');
  };

  const variables = ['nome', 'produto', 'vendedor', 'empresa'];

  if (view === 'form') {
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
              <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
                {editing ? 'Editar Template' : 'Novo Template'}
              </h1>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', margin: '2px 0 0' }}>
                Preencha as informações abaixo para configurar a mensagem
              </p>
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '24px 32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Nome</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do template"
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontSize: '14px', color: '#1F2937', transition: 'all 0.15s', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontSize: '14px', color: '#1F2937', backgroundColor: '#fff', appearance: 'none', boxSizing: 'border-box' }}
                >
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CAMPAIGN">Campanha</option>
                </select>
              </div>

              {form.type === 'FOLLOW_UP' && (
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Ordem na sequência</label>
                  <input
                    type="number"
                    min={0}
                    value={form.order}
                    onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    placeholder="0 = primeira mensagem"
                    style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontSize: '14px', color: '#1F2937', transition: 'all 0.15s', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px', margin: '4px 0 0' }}>
                    Define a posição deste template na sequência de follow-up (0 = primeiro)
                  </p>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Conteúdo</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Olá {{nome}}, tudo bem? ..."
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px 14px', outline: 'none', fontSize: '14px', color: '#1F2937', minHeight: '150px', resize: 'vertical', fontFamily: 'monospace', transition: 'all 0.15s', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {variables.map(v => (
                    <button
                      key={v}
                      onClick={() => setForm({ ...form, content: form.content + `{{${v}}}` })}
                      style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, color: '#2563EB', backgroundColor: '#EFF6FF', border: '1px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                    >
                      + {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={() => setView('manage')}
                style={btnOutline}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}
              >
                Cancelar
              </button>
              <button
                onClick={saveTemplate}
                disabled={!form.name || !form.content}
                style={btnPrimary(!form.name || !form.content)}
                onMouseOver={e => { if (form.name && form.content) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                onMouseOut={e => { if (form.name && form.content) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', paddingBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Templates</h1>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '2px', margin: '2px 0 0' }}>Modelos de mensagens para follow-up e campanhas</p>
        </div>
        <button
          onClick={openNew}
          style={btnPrimary()}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          <Plus size={16} strokeWidth={2.5} />
          Novo Template
        </button>
      </div>

      {/* Templates list */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ ...cardStyle, height: '144px', backgroundColor: '#F9FAFB', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '60px 20px' }}>
          <FileText size={48} style={{ color: '#D1D5DB', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>Nenhum template</h3>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Crie templates de mensagem para usar no follow-up ou campanhas</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
          {templates.map(t => (
            <div
              key={t.id}
              style={{ ...cardStyle, padding: '20px', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s', borderColor: '#E5E7EB' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#BFDBFE'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#E5E7EB'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 }}>{t.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: '6px',
                        ...(t.type === 'FOLLOW_UP' ? { backgroundColor: '#EFF6FF', color: '#2563EB' } : { backgroundColor: '#F0FDFA', color: '#14B8A6' })
                      }}
                    >
                      {t.type === 'FOLLOW_UP' ? 'Follow-up' : 'Campanha'}
                    </span>
                    {t.type === 'FOLLOW_UP' && t.order !== undefined && (
                      <span
                        style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', backgroundColor: '#F3E8FF', color: '#7C3AED' }}
                      >
                        #{t.order + 1}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => showPreview(t.id)}
                    style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#4B5563'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#4B5563'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => duplicateTemplate(t.id)}
                    style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#4B5563'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    title="Duplicar"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#9CA3AF', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseOver={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                    onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, paddingRight: '8px', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', whiteSpace: 'pre-wrap' }}>
                {t.content}
              </p>
              {(t.variables as string[])?.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '16px', flexWrap: 'wrap', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                  {(t.variables as string[]).map((v: string) => (
                    <span
                      key={v}
                      style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F3F4F6', color: '#4B5563', fontFamily: 'monospace', fontWeight: 500 }}
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal - Mantemos pois é apenas leitura */}
      {preview !== null && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '448px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Preview</h2>
              <button
                onClick={() => setPreview(null)}
                style={{ padding: '6px', borderRadius: '8px', border: 'none', backgroundColor: '#F3F4F6', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#374151', padding: '16px', borderRadius: '12px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              {preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
