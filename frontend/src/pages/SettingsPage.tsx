import { useEffect, useState } from 'react';
import { settingsApi } from '../services/api';
import { Settings, Wifi, Clock, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

const btnOutlineSmall: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#fff',
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('integrations');
  const [chatwootTest, setChatwootTest] = useState<null | boolean>(null);
  const [wuzapiTest, setWuzapiTest] = useState<null | boolean>(null);

  const [form, setForm] = useState({
    chatwootUrl: '', chatwootApiToken: '', chatwootBotToken: '', chatwootAccountId: '',
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
          chatwootUrl: s.chatwootUrl || '', chatwootApiToken: s.chatwootApiToken || '', chatwootBotToken: s.chatwootBotToken || '', chatwootAccountId: s.chatwootAccountId || '',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '768px' }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: '64px', borderRadius: '12px', backgroundColor: '#F3F4F6', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '768px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Configurações</h1>
        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Configure integrações e parâmetros do sistema</p>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', overflowX: 'auto', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: 500,
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseOver={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#374151'; }}
              onMouseOut={(e) => { if (activeTab !== tab.id) e.currentTarget.style.color = '#6B7280'; }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Integrações */}
      {activeTab === 'integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chatwoot */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Chatwoot / Kanban API</h3>
              {chatwootTest !== null && (
                chatwootTest
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', background: '#ECFDF5', color: '#047857' }}><CheckCircle size={13} /> Conectado</span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}><XCircle size={13} /> Falhou</span>
              )}
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputField label="URL da API" value={form.chatwootUrl} onChange={v => setForm({...form, chatwootUrl: v})} placeholder="https://chatwoot.senhorcolchao.com" />
              <InputField label="API Token (Admin)" value={form.chatwootApiToken} onChange={v => setForm({...form, chatwootApiToken: v})} placeholder="Token de administrador (Sincronização)" type="password" />
              <InputField label="Token do Robô/Agente (Opcional)" value={form.chatwootBotToken} onChange={v => setForm({...form, chatwootBotToken: v})} placeholder="Para seguir via robô em Broad./Follow" type="password" />
              <InputField label="Account ID" value={form.chatwootAccountId} onChange={v => setForm({...form, chatwootAccountId: v})} placeholder="1" />
              
              <div style={{ paddingTop: '8px' }}>
                <button
                  onClick={testChatwoot}
                  style={btnOutlineSmall}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  Testar Conexão
                </button>
              </div>
            </div>
          </div>

          {/* WuzAPI */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 }}>WuzAPI (WhatsApp)</h3>
              {wuzapiTest !== null && (
                wuzapiTest
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', background: '#ECFDF5', color: '#047857' }}><CheckCircle size={13} /> Conectado</span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626' }}><XCircle size={13} /> Falhou</span>
              )}
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <InputField label="Endpoint" value={form.wuzapiEndpoint} onChange={v => setForm({...form, wuzapiEndpoint: v})} placeholder="https://wuzapi.senhorcolchao.com" />
              <InputField label="Token" value={form.wuzapiToken} onChange={v => setForm({...form, wuzapiToken: v})} placeholder="Token WuzAPI" type="password" />
              <InputField label="Instance ID" value={form.wuzapiInstanceId} onChange={v => setForm({...form, wuzapiInstanceId: v})} placeholder="default" />
              
              <div style={{ paddingTop: '8px' }}>
                <button
                  onClick={testWuzapi}
                  style={btnOutlineSmall}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  Testar Conexão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agendamento */}
      {activeTab === 'schedule' && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Horário de Funcionamento</h3>
          </div>
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
              <InputField label="Início" value={form.workingHoursStart} onChange={v => setForm({...form, workingHoursStart: v})} type="time" />
              <InputField label="Fim" value={form.workingHoursEnd} onChange={v => setForm({...form, workingHoursEnd: v})} type="time" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Dias de funcionamento</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {days.map(d => {
                  const isSelected = form.workingDays.includes(d.v);
                  return (
                    <button
                      key={d.v}
                      onClick={() => toggleDay(d.v)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        backgroundColor: isSelected ? '#3B82F6' : '#F3F4F6',
                        color: isSelected ? '#fff' : '#6B7280',
                      }}
                      onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#E5E7EB'; }}
                      onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
                    >
                      {d.l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-up */}
      {activeTab === 'followup' && (
        <div style={cardStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Parâmetros de Follow-up</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Intervalo entre tentativas (dias)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.defaultFollowUpIntervalDays}
                  onChange={e => setForm({...form, defaultFollowUpIntervalDays: parseInt(e.target.value) || 1})}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontSize: '14px', color: '#374151', boxSizing: 'border-box', transition: 'all 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>Máximo de tentativas</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={form.maxFollowUpAttempts}
                  onChange={e => setForm({...form, maxFollowUpAttempts: parseInt(e.target.value) || 5})}
                  style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontSize: '14px', color: '#374151', boxSizing: 'border-box', transition: 'all 0.15s' }}
                  onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save */}
      <div>
        <button
          onClick={saveSettings}
          disabled={saving}
          style={btnPrimary(saving)}
          onMouseOver={(e) => { if (!saving) e.currentTarget.style.backgroundColor = '#2563EB'; }}
          onMouseOut={(e) => { if (!saving) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
        >
          {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div style={{ width: '100%' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '10px 14px', outline: 'none', fontSize: '14px', color: '#374151', boxSizing: 'border-box', transition: 'all 0.15s' }}
        onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}
