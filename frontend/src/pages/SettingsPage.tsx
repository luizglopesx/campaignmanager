import { useEffect, useState } from 'react';
import { settingsApi } from '../services/api';
import { Settings, Wifi, Clock, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('integrations');
  const [chatwootTest, setChatwootTest] = useState<null | boolean>(null);
  const [wuzapiTest, setWuzapiTest] = useState<null | boolean>(null);

  const [form, setForm] = useState({
    chatwootUrl: '', chatwootApiToken: '', chatwootAccountId: '',
    wuzapiEndpoint: '', wuzapiToken: '', wuzapiInstanceId: '',
    workingHoursStart: '08:00', workingHoursEnd: '18:00', workingDays: [1,2,3,4,5],
    defaultFollowUpIntervalDays: 1, maxFollowUpAttempts: 5,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsApi.get();
      if (res.data.settings) {
        const s = res.data.settings;
        setForm({
          chatwootUrl: s.chatwootUrl || '', chatwootApiToken: s.chatwootApiToken || '', chatwootAccountId: s.chatwootAccountId || '',
          wuzapiEndpoint: s.wuzapiEndpoint || '', wuzapiToken: s.wuzapiToken || '', wuzapiInstanceId: s.wuzapiInstanceId || '',
          workingHoursStart: s.workingHoursStart || '08:00', workingHoursEnd: s.workingHoursEnd || '18:00',
          workingDays: (s.workingDays as number[]) || [1,2,3,4,5],
          defaultFollowUpIntervalDays: s.defaultFollowUpIntervalDays || 1, maxFollowUpAttempts: s.maxFollowUpAttempts || 5,
        });
      }
    } catch { toast.error('Erro ao carregar configurações'); } finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try { setSaving(true); await settingsApi.update(form); toast.success('Configurações salvas!'); }
    catch { toast.error('Erro ao salvar'); } finally { setSaving(false); }
  };

  const testChatwoot = async () => {
    try { setChatwootTest(null); const res = await settingsApi.testChatwoot(); setChatwootTest(res.data.success); toast.success(res.data.message); }
    catch (e: any) { setChatwootTest(false); toast.error(e.response?.data?.error || 'Falha no teste'); }
  };

  const testWuzapi = async () => {
    try { setWuzapiTest(null); const res = await settingsApi.testWuzapi(); setWuzapiTest(res.data.success); toast.success(res.data.message); }
    catch (e: any) { setWuzapiTest(false); toast.error(e.response?.data?.error || 'Falha no teste'); }
  };

  const days = [{v:0,l:'Dom'},{v:1,l:'Seg'},{v:2,l:'Ter'},{v:3,l:'Qua'},{v:4,l:'Qui'},{v:5,l:'Sex'},{v:6,l:'Sáb'}];
  const toggleDay = (d: number) => setForm(f => ({ ...f, workingDays: f.workingDays.includes(d) ? f.workingDays.filter(x=>x!==d) : [...f.workingDays, d].sort() }));

  const tabs = [
    { id: 'integrations', label: 'Integrações', icon: Wifi },
    { id: 'schedule', label: 'Agendamento', icon: Clock },
    { id: 'followup', label: 'Follow-up', icon: Settings },
  ];

  if (loading) return (
    <div className="space-y-4 max-w-3xl">
      {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937' }}>Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure integrações e parâmetros do sistema</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-500 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{ padding: '12px 16px', fontSize: '14px' }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Integrações */}
      {activeTab === 'integrations' && (
        <div className="space-y-5">
          {/* Chatwoot */}
          <div
            className="bg-white rounded-xl border border-gray-200"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>Chatwoot / Kanban API</h3>
              {chatwootTest !== null && (
                chatwootTest
                  ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: '#ECFDF5', color: '#047857' }}><CheckCircle size={13} /> Conectado</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: '#FEF2F2', color: '#DC2626' }}><XCircle size={13} /> Falhou</span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <InputField label="URL da API" value={form.chatwootUrl} onChange={v => setForm({...form, chatwootUrl: v})} placeholder="https://chatwoot.senhorcolchao.com" />
              <InputField label="API Token" value={form.chatwootApiToken} onChange={v => setForm({...form, chatwootApiToken: v})} placeholder="Token de acesso" type="password" />
              <InputField label="Account ID" value={form.chatwootAccountId} onChange={v => setForm({...form, chatwootAccountId: v})} placeholder="1" />
              <button
                onClick={testChatwoot}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Testar Conexão
              </button>
            </div>
          </div>

          {/* WuzAPI */}
          <div
            className="bg-white rounded-xl border border-gray-200"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>WuzAPI (WhatsApp)</h3>
              {wuzapiTest !== null && (
                wuzapiTest
                  ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: '#ECFDF5', color: '#047857' }}><CheckCircle size={13} /> Conectado</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md" style={{ background: '#FEF2F2', color: '#DC2626' }}><XCircle size={13} /> Falhou</span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <InputField label="Endpoint" value={form.wuzapiEndpoint} onChange={v => setForm({...form, wuzapiEndpoint: v})} placeholder="https://wuzapi.senhorcolchao.com" />
              <InputField label="Token" value={form.wuzapiToken} onChange={v => setForm({...form, wuzapiToken: v})} placeholder="Token WuzAPI" type="password" />
              <InputField label="Instance ID" value={form.wuzapiInstanceId} onChange={v => setForm({...form, wuzapiInstanceId: v})} placeholder="default" />
              <button
                onClick={testWuzapi}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Testar Conexão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agendamento */}
      {activeTab === 'schedule' && (
        <div
          className="bg-white rounded-xl border border-gray-200"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>Horário de Funcionamento</h3>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Início" value={form.workingHoursStart} onChange={v => setForm({...form, workingHoursStart: v})} type="time" />
              <InputField label="Fim" value={form.workingHoursEnd} onChange={v => setForm({...form, workingHoursEnd: v})} type="time" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2.5" style={{ color: '#374151' }}>Dias de funcionamento</label>
              <div className="flex gap-2 flex-wrap">
                {days.map(d => (
                  <button
                    key={d.v}
                    onClick={() => toggleDay(d.v)}
                    className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all ${
                      form.workingDays.includes(d.v)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up */}
      {activeTab === 'followup' && (
        <div
          className="bg-white rounded-xl border border-gray-200"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937' }}>Parâmetros de Follow-up</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Intervalo entre tentativas (dias)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.defaultFollowUpIntervalDays}
                  onChange={e => setForm({...form, defaultFollowUpIntervalDays: parseInt(e.target.value) || 1})}
                  className="w-full text-sm text-gray-700 transition-all"
                  style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>Máximo de tentativas</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.maxFollowUpAttempts}
                  onChange={e => setForm({...form, maxFollowUpAttempts: parseInt(e.target.value) || 5})}
                  className="w-full text-sm text-gray-700 transition-all"
                  style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <button
        onClick={saveSettings}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Salvar Configurações
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: '#374151' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm text-gray-700 transition-all"
        style={{ border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none' }}
        onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}
