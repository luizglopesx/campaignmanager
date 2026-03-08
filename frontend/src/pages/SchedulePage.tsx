import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Calendar, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, Plus, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isPast, isToday, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Schedule {
  id: string;
  recipientName?: string;
  recipientPhone: string;
  messageContent: string;
  scheduledFor: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  campaign?: { name: string };
  user?: { name: string };
}

const statusMap = {
  PENDING: { label: 'Pendente', icon: Clock, color: 'text-yellow-600' },
  SENT: { label: 'Enviado', icon: CheckCircle2, color: 'text-emerald-600' },
  FAILED: { label: 'Falhou', icon: AlertCircle, color: 'text-red-600' },
  CANCELLED: { label: 'Cancelado', icon: XCircle, color: 'text-gray-500' },
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const monthStr = format(currentMonth, 'yyyy-MM');

  const { data, isLoading } = useQuery({
    queryKey: ['scheduleCalendar', monthStr],
    queryFn: async () => {
      const res = await api.get('/schedule/calendar', { params: { month: monthStr } });
      return res.data;
    },
  });

  const byDay: Record<string, any[]> = data?.byDay || {};

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  const startOffset = getDay(start);
  const totalCells = startOffset + days.length;
  const totalWeeks = Math.ceil(totalCells / 7);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
      {/* Month navigation */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-semibold text-gray-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
        {DAY_NAMES.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {Array.from({ length: totalWeeks * 7 }).map((_, i) => {
            const dayIndex = i - startOffset;
            const day = dayIndex >= 0 && dayIndex < days.length ? days[dayIndex] : null;
            const dateKey = day ? format(day, 'yyyy-MM-dd') : '';
            const events = dateKey ? byDay[dateKey] || [] : [];
            const isCurrentDay = day ? isToday(day) : false;
            const isPastDay = day ? isPast(endOfMonth(day)) || (isPast(day) && !isCurrentDay) : false;

            return (
              <div
                key={i}
                className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 ${
                  !day ? 'bg-gray-50' : isPastDay ? 'opacity-50' : 'bg-white'
                } ${i % 7 === 6 ? 'border-r-0' : ''}`}
              >
                {day && (
                  <>
                    <div className={`w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full mb-1 ${
                      isCurrentDay
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {events.slice(0, 3).map((e: any) => (
                        <div
                          key={e.id}
                          title={`${e.recipientName || e.recipientPhone} — ${format(new Date(e.scheduledFor), 'HH:mm')}`}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate leading-tight font-medium ${
                            e.status === 'SENT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : e.status === 'FAILED'
                              ? 'bg-red-50 text-red-700'
                              : e.status === 'CANCELLED'
                              ? 'bg-gray-100 text-gray-500 line-through'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {format(new Date(e.scheduledFor), 'HH:mm')} {e.recipientName || e.recipientPhone}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-[10px] text-gray-400 px-1">+{events.length - 3} mais</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex flex-wrap gap-3">
        {[
          { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pendente' },
          { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Enviado' },
          { bg: 'bg-red-50', text: 'text-red-700', label: 'Falhou' },
          { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Cancelado' },
        ].map((l) => (
          <span key={l.label} className={`text-[11px] px-2 py-0.5 rounded font-medium ${l.bg} ${l.text}`}>
            {l.label}
          </span>
        ))}
        {data?.total !== undefined && (
          <span className="text-[11px] text-gray-400 ml-auto">{data.total} agendamentos no mês</span>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'LIST' | 'GRID' | 'CALENDAR'>('LIST');

  const { data, isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const res = await api.get('/schedule');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['scheduleStats'],
    queryFn: async () => {
      const res = await api.get('/schedule/stats');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schedule/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['scheduleStats'] });
    },
  });

  const handleCancel = (id: string) => {
    if (window.confirm('Deseja realmente cancelar este agendamento? Ele não poderá ser desfeito.')) {
      deleteMutation.mutate(id);
    }
  };

  const getDayInfo = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Hoje, ' + format(date, "HH:mm");
    if (isPast(date)) return 'Atrasado';
    return format(date, "dd MMM, HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-6 animate-fade-in" style={{ background: '#F9FAFB', minHeight: '100%' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1F2937' }}>Agendamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie mensagens programadas</p>
        </div>
        <div className="flex gap-2">
          {/* View mode toggle group */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <button
              onClick={() => setViewMode('LIST')}
              className={`p-2.5 transition-colors flex items-center gap-1.5 text-sm font-medium px-3 ${
                viewMode === 'LIST'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title="Lista"
            >
              <List size={16} />
              <span className="hidden sm:inline">Lista</span>
            </button>
            <div className="w-px h-8 bg-gray-200" />
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2.5 transition-colors flex items-center gap-1.5 text-sm font-medium px-3 ${
                viewMode === 'GRID'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title="Grid"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <div className="w-px h-8 bg-gray-200" />
            <button
              onClick={() => setViewMode('CALENDAR')}
              className={`p-2.5 transition-colors flex items-center gap-1.5 text-sm font-medium px-3 ${
                viewMode === 'CALENDAR'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              title="Calendário"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">Calendário</span>
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm">
            <Plus size={16} />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <p className="text-sm text-gray-500">Pendentes</p>
            <p className="text-2xl font-bold mt-1" style={{ color: '#B45309' }}>{stats.stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <p className="text-sm text-gray-500">Enviados</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{stats.stats.sent}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <p className="text-sm text-gray-500">Cancelados</p>
            <p className="text-2xl font-bold mt-1 text-gray-400">{stats.stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
            <p className="text-sm text-gray-500">Total Geral</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{stats.stats.total}</p>
          </div>
        </div>
      )}

      {viewMode === 'CALENDAR' ? (
        <CalendarView />
      ) : isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : data?.schedules?.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-xl border border-gray-200" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Sem agendamentos</h3>
          <p className="text-gray-500">Você não possui mensagens programadas no momento.</p>
        </div>
      ) : viewMode === 'LIST' ? (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destinatário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensagem</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.schedules.map((schedule: Schedule) => {
                  const StatusIcon = statusMap[schedule.status].icon;
                  return (
                    <tr key={schedule.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${statusMap[schedule.status].color}`} />
                          <span className={`text-sm font-medium ${statusMap[schedule.status].color}`}>
                            {statusMap[schedule.status].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className={`text-sm ${isPast(new Date(schedule.scheduledFor)) && schedule.status === 'PENDING' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                            {getDayInfo(schedule.scheduledFor)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-800 font-medium">{schedule.recipientName || 'Avulso'}</span>
                          <span className="text-xs text-gray-400">{schedule.recipientPhone}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col max-w-xs">
                          {schedule.campaign && (
                            <span className="text-xs px-2 py-0.5 rounded-md inline-flex w-fit mb-1 font-medium" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                              Campanha
                            </span>
                          )}
                          <span className="text-sm text-gray-500 truncate" title={schedule.messageContent}>
                            {schedule.messageContent || '(Sem conteúdo em texto)'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {schedule.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(schedule.id)}
                            className="p-2 rounded-lg transition-colors hover:bg-red-50 text-red-500 hover:text-red-600"
                            title="Cancelar Agendamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.schedules.map((schedule: Schedule) => {
            const StatusIcon = statusMap[schedule.status].icon;
            const isLate = isPast(new Date(schedule.scheduledFor)) && schedule.status === 'PENDING';

            return (
              <div key={schedule.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:border-blue-200 transition-colors" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)' }}>
                <div className="flex justify-between items-start mb-3">
                  {schedule.campaign ? (
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: '#EFF6FF', color: '#2563EB' }}>
                      Campanha
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: '#F0FDFA', color: '#0F766E' }}>
                      Mensagem
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${statusMap[schedule.status].color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusMap[schedule.status].label}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-2 rounded-lg ${isLate ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${isLate ? 'text-red-600' : 'text-gray-800'}`}>
                      {getDayInfo(schedule.scheduledFor)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(schedule.scheduledFor), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-800">{schedule.recipientName || 'Contato Avulso'}</h4>
                  <p className="text-xs text-gray-400">{schedule.recipientPhone}</p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 line-clamp-2 italic">
                    "{schedule.messageContent || 'Conteúdo de mídia...'}"
                  </p>
                </div>

                {schedule.status === 'PENDING' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleCancel(schedule.id)}
                      className="text-xs flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#FEF2F2', color: '#DC2626' }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancelar Envio
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
