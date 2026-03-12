import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  Users,
  Search,
  RefreshCw,
  Upload,
  Download,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { contactsApi } from '../services/api';

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
  padding: '8px 16px',
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
  gap: '8px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  backgroundColor: '#fff',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'manage' | 'import'>('manage');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [file, setFile] = useState<File | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: () => contactsApi.list({ page, search, limit: 10 }).then((res) => res.data),
    staleTime: 10000,
  });

  const syncMutation = useMutation({
    mutationFn: () => contactsApi.syncChatwoot().then((res) => res.data),
    onSuccess: (res) => {
      toast.success(`Sincronizados com sucesso! (Criados: ${res.stats?.created}, Atualizados: ${res.stats?.updated})`);
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao sincronizar do Chatwoot');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => contactsApi.export(),
    onSuccess: (res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'contatos_exportados.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Exportação concluída');
    },
    onError: () => {
      toast.error('Erro ao exportar contatos');
    },
  });

  const importMutation = useMutation({
    mutationFn: (f: File) => contactsApi.import(f).then((res) => res.data),
    onSuccess: (res) => {
      toast.success(`Importação concluída! (Criados: ${res.stats?.created}, Atualizados: ${res.stats?.updated})`);
      setFile(null);
      setView('manage');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao importar arquivo');
    },
  });

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Selecione um arquivo .csv primeiro');
      return;
    }
    importMutation.mutate(file);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header View Manage vs Form */}
      {view === 'manage' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
              Base de Contatos
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px', marginBottom: 0 }}>
              Gerencie seus leads unificados, importe ou sincronize com o Chatwoot.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              style={{ ...btnOutline, opacity: syncMutation.isPending ? 0.7 : 1 }}
            >
              <RefreshCw size={16} className={syncMutation.isPending ? 'animate-spin' : ''} />
              {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Chatwoot'}
            </button>
            <button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              style={{ ...btnOutline, opacity: exportMutation.isPending ? 0.7 : 1 }}
            >
              <Download size={16} />
              Exportar
            </button>
            <button
              onClick={() => setView('import')}
              style={btnPrimary()}
            >
              <Upload size={16} />
              Importar CSV
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => {
              setView('manage');
              setFile(null);
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              color: '#374151',
              cursor: 'pointer',
              transition: 'background-color 0.15s, border-color 0.15s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937', margin: 0 }}>
              Importar Lista de Contatos
            </h1>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 0' }}>Faça upload de um arquivo CSV devidamente formatado.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === 'manage' ? (
        <div style={cardStyle}>
          {/* Search bar inside card */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px', maxWidth: '400px' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} size={16} />
              <input
                type="text"
                placeholder="Buscar por nome, telefone ou e-mail..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: '16px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box' as const,
                }}
              />
            </div>
            {data && (
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280' }}>
                Total: {data.pagination.total} contato(s)
              </span>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#FAFAFA', borderBottom: '1px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Nome & Contato
                  </th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status no Flow
                  </th>
                  <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Sincronizado CW
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: '60px 0', textAlign: 'center', color: '#9CA3AF' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#3B82F6', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '14px', margin: 0 }}>Carregando...</p>
                    </td>
                  </tr>
                ) : data?.contacts.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '60px 20px' }}>
                      <Users size={40} style={{ color: '#D1D5DB', margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Nenhum contato encontrado</h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Sincronize com o Chatwoot ou importe uma lista via CSV.</p>
                    </td>
                  </tr>
                ) : (
                  data?.contacts.map((contact: any, idx: number) => (
                    <tr key={contact.id} style={{ borderBottom: idx < data.contacts.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#1F2937', margin: 0 }}>{contact.name}</div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                          <span>{contact.phone}</span>
                          {contact.email && <span>• {contact.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor: contact.followUpStatus === 'ACTIVE' ? '#F0FDF4' : '#FEF2F2',
                            color: contact.followUpStatus === 'ACTIVE' ? '#16A34A' : '#DC2626',
                          }}
                        >
                          {contact.followUpStatus === 'ACTIVE' ? 'Ativo' : 'Pausado/Fila'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        {contact.chatwootContactId ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UserCheck size={16} style={{ color: '#16A34A' }} />
                          </div>
                        ) : (
                          <span style={{ fontSize: '14px', color: '#D1D5DB' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                Página {data.pagination.page} de {data.pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
                  style={{ color: '#374151', backgroundColor: '#ffffff' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
                  style={{ color: '#374151', backgroundColor: '#ffffff' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...cardStyle, maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleImportSubmit} className="space-y-6">
            <div>
               <p className="text-sm mb-4" style={{ color: '#4B5563', lineHeight: 1.6 }}>
                 Para importar novos contatos, certifique-se de usar um arquivo CSV (.csv) com colunas e cabeçalho identificáveis: 
                 <br/><br/>
                 Exemplo de formatação obrigatória na primeira linha:<br/>
                 <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>nome, telefone, email</code>
               </p>
              
               <div 
                 className="flex justify-center flex-col items-center p-8 border-2 border-dashed rounded-xl"
                 style={{ borderColor: file ? '#3B82F6' : '#E5E7EB', backgroundColor: file ? '#EFF6FF' : '#F9FAFB' }}
               >
                 <Upload size={32} style={{ color: file ? '#3B82F6' : '#9CA3AF', marginBottom: '12px' }} />
                 {file ? (
                   <p className="text-sm font-medium" style={{ color: '#111827' }}>
                     {file.name}
                   </p>
                 ) : (
                    <label className="cursor-pointer text-sm font-medium" style={{ color: '#3B82F6' }}>
                      Clique para selecionar o <span className="underline">arquivo CSV</span>
                      <input 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={(e) => setFile(e.target.files?.[0] || null)} 
                      />
                    </label>
                 )}
                 <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>Tamanho máximo: 5MB</p>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid #F3F4F6' }}>
               <button
                 type="button"
                 onClick={() => { setView('manage'); setFile(null); }}
                 style={{ ...btnOutline, backgroundColor: 'transparent', border: 'none' }}
                 onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F3F4F6')}
                 onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
               >
                 Cancelar
               </button>
               <button
                 type="submit"
                 disabled={importMutation.isPending || !file}
                 style={btnPrimary(importMutation.isPending || !file)}
               >
                 {importMutation.isPending ? 'Processando...' : 'Processar Arquivo'}
               </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
