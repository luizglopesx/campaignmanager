import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsApi } from '../services/api';
import CarouselEditor from '../components/CarouselEditor';
import toast from 'react-hot-toast';
import { ChevronRight, ArrowLeft, CheckCircle2, Users, Send, Megaphone, Play } from 'lucide-react';

export default function CampaignWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState<any>(null);

  // States of steps
  const [details, setDetails] = useState({ name: '', description: '' });
  const [images, setImages] = useState<any[]>([]);
  const [recipientsText, setRecipientsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const res = await campaignsApi.get(id!);
      const data = res.data;
      setCampaign(data);
      setDetails({ name: data.name, description: data.description || '' });
      setImages(data.images || []);

      // Se não for draft, pula pro fim ou mostra warning
      if (data.status !== 'DRAFT') {
        setStep(4);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar campanha');
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const saveDetails = async () => {
    setIsSaving(true);
    try {
      await campaignsApi.update(id!, details);
      toast.success('Detalhes salvos');
      setStep(2);
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const saveImages = async () => {
    setIsSaving(true);
    try {
      await campaignsApi.addImages(id!, { images });
      toast.success('Imagens salvas');
      setStep(3);
    } catch {
      toast.error('Erro ao salvar imagens');
    } finally {
      setIsSaving(false);
    }
  };

  const saveRecipients = async () => {
    if (!recipientsText.trim()) {
      setStep(4);
      return;
    }

    // Extrai telefones
    const lines = recipientsText.split('\n').filter(l => l.trim().length > 0);
    const validRecipients = lines.map(line => {
      // Exemplo básico: Nome, Telefone ou Múltiplos formatos de CSV.
      // Para simplificar: Pega a última palavra como sendo o telefone substituindo não numéricos
      const parts = line.split(/[;,]/);
      let phone = '';
      let name = '';
      if (parts.length > 1) {
        name = parts[0].trim();
        phone = parts[1].replace(/\D/g, '');
      } else {
        phone = line.replace(/\D/g, '');
      }
      return { phone, name };
    }).filter(r => r.phone.length >= 10);

    if (validRecipients.length === 0) {
      toast.error('Nenhum destinatário válido encontrado.');
      return;
    }

    setIsSaving(true);
    try {
      await campaignsApi.addRecipients(id!, validRecipients);
      toast.success(`${validRecipients.length} destinatários adicionados!`);
      setRecipientsText(''); // Limpa texto
      await loadCampaign(); // Recarrega count de destinatários
      setStep(4);
    } catch {
      toast.error('Erro ao adicionar destinatários');
    } finally {
      setIsSaving(false);
    }
  };

  const startCampaign = async () => {
    if (!window.confirm('Tem certeza que deseja INICIAR esta campanha? O disparo começará imediatamente.')) return;

    setIsSaving(true);
    try {
      await campaignsApi.start(id!);
      toast.success('Campanha Mapeada para Envio com Sucesso!');
      navigate('/campaigns');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Erro ao iniciar campanha');
      setIsSaving(false);
    }
  };

  const STEPS = [
    { num: 1, title: 'Detalhes' },
    { num: 2, title: 'Carrossel' },
    { num: 3, title: 'Destinatários' },
    { num: 4, title: 'Confirmação' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100%' }}>
        <div
          className="animate-pulse"
          style={{ height: '256px', backgroundColor: '#E5E7EB', borderRadius: '12px' }}
        />
      </div>
    );
  }
  if (!campaign) return null;

  const isDraft = campaign.status === 'DRAFT';

  // Input style helpers
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

  return (
    <div style={{ padding: '24px', backgroundColor: '#F9FAFB', minHeight: '100%' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }} className="space-y-6 pb-16">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/campaigns')}
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
            className="hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} strokeWidth={1.75} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Editar Campanha</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>{campaign.name}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            {!isDraft && (
              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  backgroundColor: '#FFFBEB',
                  color: '#B45309',
                }}
              >
                CAMPANHA ONLINE ({campaign.status})
              </span>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {/* Background track */}
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
            {/* Progress fill */}
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
                <div
                  key={s.num}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}
                >
                  <div
                    onClick={() => { if (isCompleted && isDraft) setStep(s.num); }}
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
                      cursor: (isCompleted && isDraft) ? 'pointer' : 'default',
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
                      color: (isActive || isCompleted) ? '#374151' : '#9CA3AF',
                    }}
                    className="hidden sm:block"
                  >
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            minHeight: '400px',
          }}
        >
          {/* STEP 1: Detalhes */}
          {step === 1 && (
            <div style={{ padding: '24px 32px' }} className="space-y-5">
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 16px' }}>Mensagem Base</h2>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Nome da Campanha
                </label>
                <input
                  value={details.name}
                  onChange={e => setDetails({ ...details, name: e.target.value })}
                  disabled={!isDraft}
                  style={inputStyle(!isDraft)}
                  {...(!isDraft ? {} : focusHandlers)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Corpo da Mensagem (Texto principal / Caption)
                </label>
                <textarea
                  value={details.description}
                  onChange={e => setDetails({ ...details, description: e.target.value })}
                  disabled={!isDraft}
                  placeholder="Exemplo: Olá {{nome}}, confira as novidades da Senhor Colchão!"
                  rows={6}
                  style={{ ...inputStyle(!isDraft), resize: 'vertical' }}
                  {...(!isDraft ? {} : focusHandlers)}
                />
                <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>
                  Use{' '}
                  <code
                    style={{
                      backgroundColor: '#F3F4F6',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      color: '#3B82F6',
                      fontFamily: 'monospace',
                    }}
                  >
                    {'{{nome}}'}
                  </code>{' '}
                  para substituir dinamicamente pelo nome do contato.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  onClick={saveDetails}
                  disabled={isSaving || !isDraft}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (isSaving || !isDraft) ? '#BFDBFE' : '#3B82F6',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: (isSaving || !isDraft) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseOver={e => { if (!isSaving && isDraft) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  onMouseOut={e => { if (!isSaving && isDraft) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                >
                  {isSaving ? 'Salvando...' : 'Próximo'} <ChevronRight size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Imagens */}
          {step === 2 && (
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>Imagens do Carrossel</h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Adicione imagens que acompanharão sua mensagem. Elas serão enviadas em formato de carrossel se mais de uma for fornecida.
                </p>
                <CarouselEditor images={images} onChange={setImages} disabled={!isDraft} />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '24px',
                  marginTop: '24px',
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  Voltar
                </button>
                <button
                  onClick={saveImages}
                  disabled={isSaving || !isDraft}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (isSaving || !isDraft) ? '#BFDBFE' : '#3B82F6',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: (isSaving || !isDraft) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseOver={e => { if (!isSaving && isDraft) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  onMouseOut={e => { if (!isSaving && isDraft) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                >
                  {isSaving ? 'Salvando...' : 'Próximo'} <ChevronRight size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Destinatários */}
          {step === 3 && (
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
              <div style={{ flex: 1 }} className="space-y-5">
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Destinatários</h2>

                {/* Info Box */}
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#DBEAFE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Users size={18} strokeWidth={1.75} style={{ color: '#2563EB' }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1D4ED8', margin: '0 0 4px' }}>Status Atual da Base</h4>
                    <p style={{ fontSize: '14px', color: '#1D4ED8', margin: 0, lineHeight: 1.5 }}>
                      Sua campanha atualmente possui{' '}
                      <strong>{campaign._count?.recipients || 0} destinatários</strong> pendentes de processamento. Novos destinatários colados abaixo serão somados a essa base e processados no momento do disparo.
                    </p>
                  </div>
                </div>

                {isDraft && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                      Adicionar mais contatos (Importação Rápida via CSV/Texto Colado)
                    </label>
                    <textarea
                      value={recipientsText}
                      onChange={e => setRecipientsText(e.target.value)}
                      placeholder="Nome, Telefone (Formato suportado: um por linha. Ex: João, 5511999999999 ou apenas 5511999999999)"
                      rows={7}
                      style={{
                        ...inputStyle(false),
                        resize: 'none',
                        fontFamily: 'monospace',
                        fontSize: '13px',
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
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '6px' }}>
                      Os números repetidos da base serão ignorados (não processam duplicatas).
                    </p>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '24px',
                  marginTop: '24px',
                  borderTop: '1px solid #F3F4F6',
                }}
              >
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
                >
                  Voltar
                </button>
                <button
                  onClick={saveRecipients}
                  disabled={isSaving || (!isDraft && step !== 3)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (isSaving || (!isDraft && step !== 3)) ? '#BFDBFE' : '#3B82F6',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: (isSaving || (!isDraft && step !== 3)) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseOver={e => { if (!isSaving) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  onMouseOut={e => { if (!isSaving) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                >
                  {isSaving ? 'Salvando...' : 'Revisar & Iniciar'} <CheckCircle2 size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmação */}
          {step === 4 && (
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}
              >
                {isDraft
                  ? <Send size={32} strokeWidth={1.75} style={{ color: '#10B981', marginLeft: '3px' }} />
                  : <Megaphone size={32} strokeWidth={1.75} style={{ color: '#10B981' }} />
                }
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>Tudo pronto!</h2>
              <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '420px', margin: '0 auto 32px', lineHeight: 1.6 }}>
                Sua campanha possui <strong style={{ color: '#374151' }}>{images.length} imagens</strong> atreladas e{' '}
                <strong style={{ color: '#374151' }}>{campaign._count?.recipients || 0} destinatários</strong> carregados na fila do banco de dados para disparo.
              </p>

              {/* Summary Card */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '32px',
                  textAlign: 'left',
                }}
              >
                <h4
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#9CA3AF',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    margin: '0 0 16px',
                  }}
                >
                  Resumo da Execução
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="space-y-3">
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>Destinatários Mapeados:</span>
                    <span style={{ fontWeight: 700, color: '#1F2937' }}>{campaign._count?.recipients || 0}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>Imagens no Carrossel:</span>
                    <span style={{ fontWeight: 700, color: '#1F2937' }}>{images.length}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <span style={{ color: '#6B7280' }}>Status Atual (Base):</span>
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: '12px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        padding: '2px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      {campaign.status}
                    </span>
                  </li>
                  {campaign.startDate && (
                    <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                      <span style={{ color: '#6B7280' }}>Iniciada em:</span>
                      <span style={{ fontWeight: 500, color: '#1F2937' }}>{new Date(campaign.startDate).toLocaleString('pt-BR')}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {isDraft && (
                  <button
                    onClick={() => setStep(3)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      backgroundColor: '#fff',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = '#fff')}
                  >
                    Voltar e Revisar
                  </button>
                )}
                {isDraft && (
                  <button
                    onClick={startCampaign}
                    disabled={isSaving || (campaign._count?.recipients || 0) === 0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 28px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: (isSaving || (campaign._count?.recipients || 0) === 0) ? '#BFDBFE' : '#3B82F6',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: (isSaving || (campaign._count?.recipients || 0) === 0) ? 'not-allowed' : 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={e => { if (!isSaving && (campaign._count?.recipients || 0) > 0) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                    onMouseOut={e => { if (!isSaving && (campaign._count?.recipients || 0) > 0) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                  >
                    {isSaving ? 'Iniciando Processo...' : 'Disparar Agora!'}
                    <Play fill="currentColor" size={14} />
                  </button>
                )}
                {!isDraft && (
                  <button
                    onClick={() => navigate('/campaigns')}
                    style={{
                      padding: '10px 28px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
                    onMouseOut={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                  >
                    Ir para o Dashboard
                  </button>
                )}
              </div>

              {isDraft && (campaign._count?.recipients || 0) === 0 && (
                <p
                  style={{
                    marginTop: '16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#EF4444',
                  }}
                  className="animate-pulse"
                >
                  Você precisa de PELO MENOS 1 destinatário para iniciar um disparo.
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
