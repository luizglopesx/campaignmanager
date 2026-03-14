import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campaignsApi } from '../services/api';
import { Plus, Megaphone, Play, Pause, Edit, Trash2, Users, Image, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    try {
      const res = await campaignsApi.list();
      setCampaigns(res.data.campaigns);
    } catch { toast.error('Erro ao carregar campanhas'); }
    finally { setLoading(false); }
  };

  const navigate = useNavigate();

  const createCampaign = async () => {
    try {
      const resp = await campaignsApi.create(form);
      toast.success('Campanha criada!');
      setShowCreate(false);
      setForm({ name: '', description: '' });
      navigate(`/campaigns/${resp.data.id}`);
    } catch { toast.error('Erro ao criar campanha'); }
  };

  const deleteCampaign = async (id: string) => {
    if (!window.confirm('Excluir campanha?')) return;
    try { await campaignsApi.delete(id); toast.success('Campanha excluída!'); loadCampaigns(); }
    catch { toast.error('Erro ao excluir'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await campaignsApi.updateStatus(id, status); toast.success('Status atualizado'); loadCampaigns(); }
    catch { toast.error('Erro ao atualizar'); }
  };

  const statusBadgeStyle = (s: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      DRAFT:      { backgroundColor: '#F3F4F6', color: '#374151' },
      SCHEDULED:  { backgroundColor: '#EFF6FF', color: '#2563EB' },
      RUNNING:    { backgroundColor: '#ECFDF5', color: '#047857' },
      PAUSED:     { backgroundColor: '#FFFBEB', color: '#B45309' },
      COMPLETED:  { backgroundColor: '#F5F3FF', color: '#6D28D9' },
    };
    return map[s] || { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Campanhas</h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>Crie e gerencie campanhas de disparo</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#3B82F6',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.backgroundColor = '#2563EB')}
            onMouseOut={e => (e.currentTarget.style.backgroundColor = '#3B82F6')}
          >
            <Plus size={18} strokeWidth={1.75} /> Nova Campanha
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.40)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={() => setShowCreate(false)}
          >
            <div
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                width: '100%',
                maxWidth: '448px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: 0 }}>Nova Campanha</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    padding: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#6B7280',
                    cursor: 'pointer',
                    borderRadius: '6px',
                  }}
                  className="hover:bg-gray-100 transition-colors"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Nome
                  </label>
                  <input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Nome da campanha"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
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
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                    Descrição
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Descrição da campanha..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
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
                </div>
                <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
                  <button
                    onClick={() => setShowCreate(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
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
                    Cancelar
                  </button>
                  <button
                    onClick={createCampaign}
                    disabled={!form.name}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: form.name ? '#3B82F6' : '#BFDBFE',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#fff',
                      cursor: form.name ? 'pointer' : 'not-allowed',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={e => { if (form.name) e.currentTarget.style.backgroundColor = '#2563EB'; }}
                    onMouseOut={e => { if (form.name) e.currentTarget.style.backgroundColor = '#3B82F6'; }}
                  >
                    Criar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="animate-pulse"
                style={{ height: '220px', backgroundColor: '#E5E7EB', borderRadius: '12px' }}
              />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 20px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
            }}
          >
            <Megaphone size={48} strokeWidth={1.25} style={{ color: '#D1D5DB', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px' }}>Nenhuma campanha</h3>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Clique em "Nova Campanha" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map(camp => {
              const badge = statusBadgeStyle(camp.status);
              return (
                <div
                  key={camp.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                  onMouseOver={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={e => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  }}
                >
                  {/* Image Preview */}
                  <div
                    style={{
                      height: '112px',
                      backgroundColor: '#F3F4F6',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {camp.images?.length > 0 && camp.images[0].imageUrl ? (
                      <img src={camp.images[0].imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <Image size={32} strokeWidth={1.25} style={{ color: '#9CA3AF' }} />
                        {camp.images?.length > 0 && (
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{camp.images.length} cards</span>
                        )}
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        fontSize: '12px',
                        fontWeight: 500,
                        padding: '2px 10px',
                        borderRadius: '6px',
                        ...badge,
                      }}
                    >
                      {camp.status}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {camp.name}
                    </h3>
                    {camp.description && (
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {camp.description}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6B7280' }}>
                        <Image size={13} strokeWidth={1.75} /> {camp.images?.length || 0} cards
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6B7280' }}>
                        <Users size={13} strokeWidth={1.75} /> {camp._count?.recipients || 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/campaigns/${camp.id}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          padding: '7px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          textDecoration: 'none',
                          transition: 'background-color 0.15s',
                        }}
                        onMouseOver={e => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
                        onMouseOut={e => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
                      >
                        <Edit size={13} strokeWidth={1.75} /> Editar
                      </Link>
                      {camp.status === 'RUNNING' && (
                        <button
                          onClick={() => updateStatus(camp.id, 'PAUSED')}
                          title="Pausar"
                          style={{
                            padding: '7px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#B45309',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}
                          className="hover:bg-yellow-50"
                        >
                          <Pause size={14} strokeWidth={1.75} />
                        </button>
                      )}
                      {camp.status === 'PAUSED' && (
                        <button
                          onClick={() => updateStatus(camp.id, 'RUNNING')}
                          title="Retomar"
                          style={{
                            padding: '7px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#047857',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}
                          className="hover:bg-green-50"
                        >
                          <Play size={14} strokeWidth={1.75} />
                        </button>
                      )}
                      {camp.status !== 'RUNNING' && (
                        <button
                          onClick={() => deleteCampaign(camp.id)}
                          title="Excluir"
                          style={{
                            padding: '7px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'rgba(239,68,68,0.10)',
                            color: '#EF4444',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s',
                          }}
                          className="hover:bg-red-100"
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
