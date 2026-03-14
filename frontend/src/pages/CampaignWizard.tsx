import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsApi, broadcastApi, contactsApi } from '../services/api';
import CarouselEditor from '../components/CarouselEditor';
import type { CarouselCard } from '../components/CarouselEditor';
import toast from 'react-hot-toast';
import { ChevronRight, ArrowLeft, CheckCircle2, Users, Send, Megaphone, Play, Tag, Search, UserPlus, UsersRound } from 'lucide-react';

export default function CampaignWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [campaign, setCampaign] = useState<any>(null);

  // Step 1 - Detalhes
  const [details, setDetails] = useState({ name: '', description: '', carouselHeader: '', carouselFooter: '' });
  // Step 2 - Carrossel (cards)
  const [cards, setCards] = useState<CarouselCard[]>([]);
  // Step 3 - Destinatários
  const [recipientsText, setRecipientsText] = useState('');
  const [recipientMode, setRecipientMode] = useState<'label' | 'all' | 'manual'>('label');
  const [labels, setLabels] = useState<any[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [labelContacts, setLabelContacts] = useState<any[]>([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [labelSearch, setLabelSearch] = useState('');
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loadingAllContacts, setLoadingAllContacts] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const res = await campaignsApi.get(id!);
      const data = res.data;
      setCampaign(data);
      setDetails({
        name: data.name,
        description: data.description || '',
        carouselHeader: data.carouselHeader || '',
        carouselFooter: data.carouselFooter || '',
      });
      setCards(
        (data.images || []).map((card: any) => ({
          id: card.id,
          header: card.header || '',
          caption: card.caption || '',
          buttons: Array.isArray(card.buttons) ? card.buttons : [],
          order: card.order,
          imageUrl: card.imageUrl || null,
        }))
      );

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

  const loadLabels = async () => {
    if (labels.length > 0) return;
    setLoadingLabels(true);
    try {
      const res = await broadcastApi.labels();
      const list = res.data?.labels || res.data?.payload || [];
      setLabels(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Erro ao carregar etiquetas do Chatwoot');
    } finally {
      setLoadingLabels(false);
    }
  };

  const selectLabel = async (labelTitle: string) => {
    setSelectedLabel(labelTitle);
    setLoadingContacts(true);
    try {
      const res = await broadcastApi.contactsByLabel(labelTitle);
      const contacts = res.data?.contacts || [];
      setLabelContacts(Array.isArray(contacts) ? contacts : []);
    } catch {
      toast.error('Erro ao carregar contatos da etiqueta');
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadAllContacts = async () => {
    if (allContacts.length > 0) return;
    setLoadingAllContacts(true);
    try {
      const res = await contactsApi.all();
      const list = res.data?.contacts || [];
      setAllContacts(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Erro ao carregar todos os contatos');
    } finally {
      setLoadingAllContacts(false);
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

  const saveCards = async () => {
    setIsSaving(true);
    try {
      await campaignsApi.addImages(id!, {
        images: cards.map(card => ({
          header: card.header || '',
          caption: card.caption || '',
          buttons: card.buttons || [],
          order: card.order,
        })),
      });
      toast.success('Cards salvos');
      setStep(3);
      loadLabels();
    } catch {
      toast.error('Erro ao salvar cards');
    } finally {
      setIsSaving(false);
    }
  };

  const saveRecipients = async () => {
    let validRecipients: { phone: string; name: string }[] = [];

    if (recipientMode === 'label') {
      if (!selectedLabel || labelContacts.length === 0) {
        toast.error('Selecione uma etiqueta com contatos.');
        return;
      }
      validRecipients = labelContacts
        .filter((c: any) => c.phone)
        .map((c: any) => ({
          phone: c.phone.replace(/\D/g, ''),
          name: c.name || '',
        }))
        .filter(r => r.phone.length >= 10);

      if (validRecipients.length === 0) {
        toast.error('Nenhum contato com telefone válido encontrado nesta etiqueta.');
        return;
      }
    } else if (recipientMode === 'all') {
      if (allContacts.length === 0) {
        toast.error('Nenhum contato encontrado na base.');
        return;
      }
      validRecipients = allContacts
        .filter((c: any) => c.phone)
        .map((c: any) => ({
          phone: c.phone.replace(/\D/g, ''),
          name: c.name || '',
        }))
        .filter(r => r.phone.length >= 10);

      if (validRecipients.length === 0) {
        toast.error('Nenhum contato com telefone válido na base.');
        return;
      }
    } else {
      if (!recipientsText.trim()) {
        setStep(4);
        return;
      }
      const lines = recipientsText.split('\n').filter(l => l.trim().length > 0);
      validRecipients = lines.map(line => {
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
    }

    setIsSaving(true);
    try {
      await campaignsApi.addRecipients(id!, validRecipients);
      toast.success(`${validRecipients.length} destinatários adicionados!`);
      setRecipientsText('');
      await loadCampaign();
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
    { num: 2, title: 'Cards' },
    { num: 3, title: 'Destinatários' },
    { num: 4, title: 'Confirmação' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100%' }}>
        <div style={{ height: '256px', backgroundColor: '#E5E7EB', borderRadius: '12px' }} />
      </div>
    );
  }
  if (!campaign) return null;

  const isDraft = campaign.status === 'DRAFT';

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

  const filteredLabels = labels.filter((l: any) => {
    const title = l.title || l.name || l;
    return typeof title === 'string' && title.toLowerCase().includes(labelSearch.toLowerCase());
  });

  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '64px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
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
            marginBottom: '24px',
          }}
        >
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
            <div style={{ padding: '24px 32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 20px' }}>Detalhes da Campanha</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Nome da Campanha
                </label>
                <input
                  value={details.name}
                  onChange={e => setDetails({ ...details, name: e.target.value })}
                  disabled={!isDraft}
                  placeholder="Ex: Promoção de Março - Colchões"
                  style={inputStyle(!isDraft)}
                  {...(!isDraft ? {} : focusHandlers)}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                  Texto principal do carrossel (body)
                </label>
                <textarea
                  value={details.description}
                  onChange={e => setDetails({ ...details, description: e.target.value })}
                  disabled={!isDraft}
                  placeholder="Texto principal que aparece acima dos cards..."
                  rows={3}
                  style={{ ...inputStyle(!isDraft), resize: 'vertical' }}
                  {...(!isDraft ? {} : focusHandlers)}
                />
                <p style={{ fontSize: '11px', color: '#9CA3AF', margin: '4px 0 0' }}>
                  Use {'{{nome}}'} para personalizar com o nome do destinatario
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Header do carrossel (opcional)
                  </label>
                  <input
                    value={details.carouselHeader}
                    onChange={e => setDetails({ ...details, carouselHeader: e.target.value })}
                    disabled={!isDraft}
                    placeholder="Ex: Confira nossas ofertas"
                    style={inputStyle(!isDraft)}
                    {...(!isDraft ? {} : focusHandlers)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Footer do carrossel (opcional)
                  </label>
                  <input
                    value={details.carouselFooter}
                    onChange={e => setDetails({ ...details, carouselFooter: e.target.value })}
                    disabled={!isDraft}
                    placeholder="Ex: Deslize para ver mais"
                    style={inputStyle(!isDraft)}
                    {...(!isDraft ? {} : focusHandlers)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button
                  onClick={saveDetails}
                  disabled={isSaving || !isDraft || !details.name.trim()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: (isSaving || !isDraft || !details.name.trim()) ? '#BFDBFE' : '#3B82F6',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: (isSaving || !isDraft || !details.name.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseOver={e => { if (!isSaving && isDraft && details.name.trim()) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                  onMouseOut={e => { if (!isSaving && isDraft && details.name.trim()) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                >
                  {isSaving ? 'Salvando...' : 'Próximo'} <ChevronRight size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Cards do Carrossel */}
          {step === 2 && (
            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 8px' }}>Cards do Carrossel</h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Monte os cards do carrossel com titulo, texto e botoes interativos.
                </p>
                <CarouselEditor cards={cards} onChange={setCards} disabled={!isDraft} />
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
                  onClick={saveCards}
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
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 16px' }}>Destinatários</h2>

                {/* Info Box */}
                <div
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '8px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px',
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
                  <p style={{ fontSize: '14px', color: '#1D4ED8', margin: 0, lineHeight: 1.5 }}>
                    Sua campanha possui{' '}
                    <strong>{campaign._count?.recipients || 0} destinatários</strong> carregados.
                    Novos contatos serão somados à base existente.
                  </p>
                </div>

                {/* Mode Tabs */}
                {isDraft && (
                  <>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                      <button
                        onClick={() => setRecipientMode('label')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: `2px solid ${recipientMode === 'label' ? '#3B82F6' : '#E5E7EB'}`,
                          backgroundColor: recipientMode === 'label' ? '#EFF6FF' : '#fff',
                          color: recipientMode === 'label' ? '#2563EB' : '#6B7280',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <Tag size={16} /> Por Etiqueta (Chatwoot)
                      </button>
                      <button
                        onClick={() => { setRecipientMode('all'); loadAllContacts(); }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: `2px solid ${recipientMode === 'all' ? '#3B82F6' : '#E5E7EB'}`,
                          backgroundColor: recipientMode === 'all' ? '#EFF6FF' : '#fff',
                          color: recipientMode === 'all' ? '#2563EB' : '#6B7280',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <UsersRound size={16} /> Todos os Contatos
                      </button>
                      <button
                        onClick={() => setRecipientMode('manual')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 18px',
                          borderRadius: '8px',
                          border: `2px solid ${recipientMode === 'manual' ? '#3B82F6' : '#E5E7EB'}`,
                          backgroundColor: recipientMode === 'manual' ? '#EFF6FF' : '#fff',
                          color: recipientMode === 'manual' ? '#2563EB' : '#6B7280',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <UserPlus size={16} /> Importação Manual (CSV)
                      </button>
                    </div>

                    {/* Label Mode */}
                    {recipientMode === 'label' && (
                      <div>
                        {/* Search */}
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                          <input
                            value={labelSearch}
                            onChange={e => setLabelSearch(e.target.value)}
                            placeholder="Buscar etiqueta..."
                            style={{ ...inputStyle(false), paddingLeft: '36px' }}
                            {...focusHandlers}
                          />
                        </div>

                        {loadingLabels ? (
                          <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', padding: '24px' }}>
                            Carregando etiquetas...
                          </p>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '8px',
                              maxHeight: '180px',
                              overflowY: 'auto',
                              padding: '4px 0',
                            }}
                          >
                            {filteredLabels.map((label: any, idx: number) => {
                              const title = label.title || label.name || label;
                              const color = label.color || '#6B7280';
                              const isSelected = selectedLabel === title;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => selectLabel(title)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: `2px solid ${isSelected ? '#3B82F6' : '#E5E7EB'}`,
                                    backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                                    color: isSelected ? '#2563EB' : '#374151',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                  }}
                                >
                                  <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    display: 'inline-block',
                                  }} />
                                  {title}
                                </button>
                              );
                            })}
                            {filteredLabels.length === 0 && !loadingLabels && (
                              <p style={{ fontSize: '13px', color: '#9CA3AF', padding: '8px' }}>
                                Nenhuma etiqueta encontrada.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Selected label info */}
                        {selectedLabel && (
                          <div
                            style={{
                              marginTop: '16px',
                              padding: '14px 16px',
                              backgroundColor: '#F0FDF4',
                              border: '1px solid #BBF7D0',
                              borderRadius: '8px',
                            }}
                          >
                            {loadingContacts ? (
                              <p style={{ fontSize: '14px', color: '#15803D', margin: 0 }}>
                                Carregando contatos da etiqueta "{selectedLabel}"...
                              </p>
                            ) : (
                              <>
                                <p style={{ fontSize: '14px', color: '#15803D', margin: 0, fontWeight: 600 }}>
                                  Etiqueta "{selectedLabel}" — {labelContacts.length} contato(s) encontrado(s)
                                </p>
                                {labelContacts.length > 0 && (
                                  <div style={{ marginTop: '10px', maxHeight: '140px', overflowY: 'auto' }}>
                                    {labelContacts.slice(0, 50).map((c: any, i: number) => (
                                      <div
                                        key={i}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          padding: '4px 0',
                                          fontSize: '13px',
                                          color: '#374151',
                                          borderBottom: i < Math.min(labelContacts.length, 50) - 1 ? '1px solid #E5E7EB' : 'none',
                                        }}
                                      >
                                        <span>{c.name || 'Sem nome'}</span>
                                        <span style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '12px' }}>{c.phone || 'Sem telefone'}</span>
                                      </div>
                                    ))}
                                    {labelContacts.length > 50 && (
                                      <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                                        ...e mais {labelContacts.length - 50} contatos
                                      </p>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* All Contacts Mode */}
                    {recipientMode === 'all' && (
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: '8px',
                        }}
                      >
                        {loadingAllContacts ? (
                          <p style={{ fontSize: '14px', color: '#15803D', margin: 0 }}>
                            Carregando todos os contatos da base...
                          </p>
                        ) : (
                          <>
                            <p style={{ fontSize: '14px', color: '#15803D', margin: 0, fontWeight: 600 }}>
                              {allContacts.length} contato(s) com telefone encontrado(s) na base
                            </p>
                            {allContacts.length > 0 && (
                              <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                {allContacts.slice(0, 50).map((c: any, i: number) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      padding: '4px 0',
                                      fontSize: '13px',
                                      color: '#374151',
                                      borderBottom: i < Math.min(allContacts.length, 50) - 1 ? '1px solid #E5E7EB' : 'none',
                                    }}
                                  >
                                    <span>{c.name || 'Sem nome'}</span>
                                    <span style={{ color: '#6B7280', fontFamily: 'monospace', fontSize: '12px' }}>{c.phone || 'Sem telefone'}</span>
                                  </div>
                                ))}
                                {allContacts.length > 50 && (
                                  <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                                    ...e mais {allContacts.length - 50} contatos
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Manual Mode */}
                    {recipientMode === 'manual' && (
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                          Importação Rápida via CSV / Texto Colado
                        </label>
                        <textarea
                          value={recipientsText}
                          onChange={e => setRecipientsText(e.target.value)}
                          placeholder="Nome, Telefone (um por linha)&#10;Ex: João, 5511999999999&#10;Ou apenas: 5511999999999"
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
                          Números duplicados da base serão ignorados.
                        </p>
                      </div>
                    )}
                  </>
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
                Sua campanha possui <strong style={{ color: '#374151' }}>{cards.length} cards</strong> e{' '}
                <strong style={{ color: '#374151' }}>{campaign._count?.recipients || 0} destinatários</strong> na fila.
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
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B7280' }}>Destinatários:</span>
                    <span style={{ fontWeight: 700, color: '#1F2937' }}>{campaign._count?.recipients || 0}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B7280' }}>Cards no Carrossel:</span>
                    <span style={{ fontWeight: 700, color: '#1F2937' }}>{images.length}</span>
                  </li>
                  <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '12px' }}>
                    <span style={{ color: '#6B7280' }}>Status:</span>
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
