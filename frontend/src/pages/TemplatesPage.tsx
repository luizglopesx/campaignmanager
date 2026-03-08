import { useEffect, useState } from 'react';
import { templatesApi } from '../services/api';
import { Plus, FileText, Copy, Trash2, Eye, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', content: '', type: 'FOLLOW_UP' });

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
      setShowModal(false); setEditing(null); setForm({ name: '', content: '', type: 'FOLLOW_UP' }); loadTemplates();
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

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, content: t.content, type: t.type });
    setShowModal(true);
  };

  const variables = ['nome', 'produto', 'vendedor', 'empresa'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937' }}>Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Modelos de mensagens para follow-up e campanhas</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', content: '', type: 'FOLLOW_UP' }); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Novo Template
        </button>
      </div>

      {/* Templates list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
          <FileText size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-800 mb-1">Nenhum template</h3>
          <p className="text-sm text-gray-500">Crie templates de mensagem para usar no follow-up</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div
              key={t.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 transition-colors"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{t.name}</h3>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-md mt-1.5 inline-block"
                    style={
                      t.type === 'FOLLOW_UP'
                        ? { background: '#EFF6FF', color: '#2563EB' }
                        : { background: '#F0FDFA', color: '#0F766E' }
                    }
                  >
                    {t.type === 'FOLLOW_UP' ? 'Follow-up' : 'Campanha'}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => showPreview(t.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Editar"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => duplicateTemplate(t.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Duplicar"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 whitespace-pre-wrap line-clamp-4 leading-5">{t.content}</p>
              {(t.variables as string[])?.length > 0 && (
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {(t.variables as string[]).map((v: string) => (
                    <span
                      key={v}
                      className="text-[10px] px-2 py-0.5 rounded font-mono font-medium"
                      style={{ background: '#EFF6FF', color: '#2563EB' }}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg animate-fade-in"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)', borderRadius: '12px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
                {editing ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Nome</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full text-sm text-gray-700 transition-all"
                  placeholder="Nome do template"
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Tipo</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full text-sm text-gray-700 bg-white"
                  style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
                >
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="CAMPAIGN">Campanha</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Conteúdo</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="w-full text-sm text-gray-700 font-mono resize-none transition-all"
                  placeholder="Olá {{nome}}, tudo bem? ..."
                  style={{
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    outline: 'none',
                    minHeight: '150px',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
                {/* Variable insertion pills */}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {variables.map(v => (
                    <button
                      key={v}
                      onClick={() => setForm({ ...form, content: form.content + `{{${v}}}` })}
                      className="text-xs px-2.5 py-1 rounded font-mono font-medium transition-colors hover:opacity-80"
                      style={{ background: '#EFF6FF', color: '#2563EB' }}
                    >
                      {`+ {{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTemplate}
                  disabled={!form.name || !form.content}
                  className="flex-1 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {preview !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md animate-fade-in"
            style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.15)', borderRadius: '12px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>Preview</h2>
              <button
                onClick={() => setPreview(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="text-sm whitespace-pre-wrap leading-6 text-gray-700 rounded-lg p-4"
              style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}
            >
              {preview}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
