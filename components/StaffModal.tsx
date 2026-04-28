
import React, { useState } from 'react';
import { Professional, SlotConfig, TimeSlot, Company } from '../types';
import { TIME_LIST } from '../constants';
import { X, Plus, Users, Trash2, Clock, Calendar, Settings, BarChart2, Flower2, Upload, Download, Building2, Info, HelpCircle } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Staff Props
  professionals: Professional[];
  onAddProfessional: (name: string) => void;
  onRemoveProfessional: (id: string) => void;
  // Schedule Config Props
  slotConfig: SlotConfig;
  onUpdateSlotConfig: (time: string, type: 'available' | 'break' | 'lunch') => void;
  onUpdateProfessionalSlotConfig: (proId: string, time: string, type: 'available' | 'break' | 'lunch', date?: string) => void;
  // Date Props
  availableDates: string[];
  onAddDate: (date: string) => void;
  onRemoveDate: (date: string) => void;
  // Time List Props
  timeList: string[];
  onAddTime: (time: string, proId?: string, date?: string) => void;
  onRemoveTime: (time: string, proId?: string, date?: string) => void;
  onResetToGlobal: (proId: string, type: 'timeList' | 'slotConfig', date?: string) => void;
  onClearSchedules: () => void;
  // Client Props
  logoUrl: string;
  onUpdateLogo: (url: string) => void;
  clientName: string;
  onUpdateClientName: (name: string) => void;
  // Security Props
  adminPassword?: string;
  onUpdateAdminPassword?: (pass: string) => void;
  // Reports Props
  schedules: Record<string, TimeSlot[]>;
  // Companies Props (Multi-tenant management)
  allCompanies: Company[];
  onAddCompany: (slug: string, name: string) => void;
  isSuperAdmin: boolean;
}

type TabType = 'staff' | 'schedule' | 'dates' | 'branding' | 'reports' | 'companies';

const StaffModal: React.FC<StaffModalProps> = ({ 
  isOpen, 
  onClose, 
  professionals, 
  onAddProfessional,
  onRemoveProfessional,
  slotConfig,
  onUpdateSlotConfig,
  onUpdateProfessionalSlotConfig,
  availableDates,
  onAddDate,
  onRemoveDate,
  timeList,
  onAddTime,
  onRemoveTime,
  onResetToGlobal,
  onClearSchedules,
  logoUrl,
  onUpdateLogo,
  clientName,
  onUpdateClientName,
  adminPassword,
  onUpdateAdminPassword,
  schedules,
  allCompanies,
  onAddCompany,
  isSuperAdmin
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [newProName, setNewProName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCompanySlug, setNewCompanySlug] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedProForConfig, setSelectedProForConfig] = useState<string>('global');
  const [selectedDateForProConfig, setSelectedDateForProConfig] = useState<string>('default');
  const [confirmDeleteTime, setConfirmDeleteTime] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const handleAddPro = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProName.trim()) {
      onAddProfessional(newProName.trim());
      setNewProName('');
    }
  };

  const handleAddDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDate) {
      onAddDate(newDate);
      setNewDate('');
    }
  };

  const handleAddTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTime) {
      onAddTime(newTime, selectedProForConfig, selectedDateForProConfig === 'default' ? undefined : selectedDateForProConfig);
      setNewTime('');
    }
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanySlug.trim() && newCompanyName.trim()) {
      // Basic slug validation: lowercase, no spaces
      const slug = newCompanySlug.trim().toLowerCase().replace(/\s+/g, '-');
      onAddCompany(slug, newCompanyName.trim());
      setNewCompanySlug('');
      setNewCompanyName('');
    }
  };

  // Calculate stats for reports
  const totalBookings = Object.values(schedules).reduce((acc, slots) => {
    return acc + slots.filter(s => s.type === 'booked').length;
  }, 0);

  const proStats = professionals.map(pro => {
    const proSchedules = Object.entries(schedules)
      .filter(([key]) => key.includes(`::${pro.id}`));
    
    const bookings = proSchedules.reduce((acc, [_, slots]) => acc + slots.filter(s => s.type === 'booked').length, 0);
    const present = proSchedules.reduce((acc, [_, slots]) => acc + slots.filter(s => s.type === 'booked' && s.presence === 'present').length, 0);
    const absent = proSchedules.reduce((acc, [_, slots]) => acc + slots.filter(s => s.type === 'booked' && s.presence === 'absent').length, 0);
    const pending = proSchedules.reduce((acc, [_, slots]) => acc + slots.filter(s => s.type === 'booked' && (!s.presence || s.presence === 'pending')).length, 0);

    return { 
      name: pro.name, 
      bookings,
      present,
      absent,
      pending,
      utilization: bookings > 0 ? Math.round((present / bookings) * 100) : 0
    };
  });

  const handleDownloadReport = () => {
    const headers = ['Data', 'Profissional', 'Horário', 'Cliente', 'Status', 'Presença'];
    const rows: string[][] = [];

    Object.entries(schedules).forEach(([key, slots]) => {
      const [date, proId] = key.split('::');
      const professional = professionals.find(p => p.id === proId);
      
      slots.filter(s => s.type === 'booked').forEach(slot => {
        rows.push([
          date,
          professional?.name || 'N/A',
          slot.time,
          slot.attendeeName || '',
          'Confirmado',
          slot.presence === 'present' ? 'Presente' : slot.presence === 'absent' ? 'Faltou' : 'Pendente'
        ]);
      });
    });

    // Sort by date and time
    rows.sort((a, b) => {
      if (a[0] !== b[0]) return a[0].localeCompare(b[0]);
      return a[2].localeCompare(b[2]);
    });

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_utilizacao_${clientName.replace(/\s+/g, '_').toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20">
        
        {/* Header */}
        <div className="bg-corporate-blue p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Settings size={20} />
            </div>
            <h3 className="text-xl font-black tracking-tight">Painel de Controle</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-20 sm:w-64 bg-slate-50 border-r border-slate-100 p-4 flex flex-col gap-2 shrink-0">
            <button 
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'staff' ? 'bg-corporate-blue text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Users size={20} />
              <span className="hidden sm:inline font-bold text-sm">Profissionais</span>
            </button>
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'schedule' ? 'bg-corporate-blue text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Clock size={20} />
              <span className="hidden sm:inline font-bold text-sm">Horários & Pausas</span>
            </button>
            <button 
              onClick={() => setActiveTab('dates')}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'dates' ? 'bg-corporate-blue text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Calendar size={20} />
              <span className="hidden sm:inline font-bold text-sm">Datas Disponíveis</span>
            </button>
            <button 
              onClick={() => setActiveTab('branding')}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'branding' ? 'bg-corporate-blue text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <Flower2 size={20} />
              <span className="hidden sm:inline font-bold text-sm">Branding</span>
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'reports' ? 'bg-corporate-blue text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <BarChart2 size={20} />
              <span className="hidden sm:inline font-bold text-sm">Relatórios</span>
            </button>
            {isSuperAdmin && (
              <button 
                onClick={() => setActiveTab('companies')}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${activeTab === 'companies' ? 'bg-corporate-blue text-white shadow-lg shadow-blue-900/20' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Building2 size={20} />
                <span className="hidden sm:inline font-bold text-sm">Empresas</span>
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            
            {/* STAFF TAB */}
            {activeTab === 'staff' && (
              <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-lg font-black text-corporate-blue">Gerenciar Equipe</h4>
                  <div className="group relative">
                    <Info size={16} className="text-slate-300 cursor-help" />
                    <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      Adicione ou remova os profissionais que realizam os atendimentos. Cada profissional pode ter sua própria configuração de horários.
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleAddPro} className="mb-8 flex gap-2">
                  <input
                    type="text"
                    value={newProName}
                    onChange={(e) => setNewProName(e.target.value)}
                    placeholder="Nome do novo profissional"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-corporate-blue text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex items-center gap-2"
                  >
                    <Plus size={20} /> <span className="text-sm">Adicionar</span>
                  </button>
                </form>

                <div className="space-y-3">
                  {professionals.map((pro) => (
                    <div key={pro.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                          {pro.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-700">{pro.name}</span>
                      </div>
                      <button 
                        onClick={() => onRemoveProfessional(pro.id)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCHEDULE CONFIG TAB */}
            {activeTab === 'schedule' && (
              <div className="animate-fade-in">
                <div className="mb-6 flex flex-col gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-gray-600">
                    Defina o modelo padrão da agenda. Você pode configurar um modelo global ou específico para cada profissional e até para dias específicos.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Configurar para:</label>
                      <select 
                        value={selectedProForConfig}
                        onChange={(e) => {
                          setSelectedProForConfig(e.target.value);
                          if (e.target.value === 'global') setSelectedDateForProConfig('default');
                        }}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-corporate-blue outline-none focus:ring-2 focus:ring-corporate-blue"
                      >
                        <option value="global">Modelo Global (Todos)</option>
                        {professionals.map(pro => (
                          <option key={pro.id} value={pro.id}>{pro.name}</option>
                        ))}
                      </select>
                    </div>

                    {selectedProForConfig !== 'global' && (
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Dia específico:</label>
                        <select 
                          value={selectedDateForProConfig}
                          onChange={(e) => setSelectedDateForProConfig(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-corporate-blue outline-none focus:ring-2 focus:ring-corporate-blue"
                        >
                          <option value="default">Padrão do Profissional</option>
                          {availableDates.map(date => (
                            <option key={date} value={date}>
                              {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="flex items-end pb-1">
                      <div className="group relative">
                        <HelpCircle size={18} className="text-blue-400 cursor-help" />
                        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          O "Modelo Global" define os horários para todos. O "Padrão do Profissional" sobrescreve o global. Um "Dia Específico" sobrescreve ambos para aquela data.
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedProForConfig !== 'global' && (
                    <div className="flex gap-4 mt-2 px-1">
                      <button 
                        onClick={() => onResetToGlobal(
                          selectedProForConfig, 
                          'timeList', 
                          selectedDateForProConfig === 'default' ? undefined : selectedDateForProConfig
                        )}
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-800 transition-colors"
                      >
                        {selectedDateForProConfig === 'default' ? 'Resetar para Global' : 'Resetar Dia para Padrão'}
                      </button>
                      <div className="w-[1px] h-3 bg-blue-200"></div>
                      <button 
                        onClick={() => onResetToGlobal(
                          selectedProForConfig, 
                          'slotConfig', 
                          selectedDateForProConfig === 'default' ? undefined : selectedDateForProConfig
                        )}
                        className="text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:text-blue-800 transition-colors"
                      >
                        {selectedDateForProConfig === 'default' ? 'Resetar Pausas para Global' : 'Resetar Pausas para Padrão'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Add New Time Form */}
                {(() => {
                  const pro = professionals.find(p => p.id === selectedProForConfig);
                  const isDayConfig = selectedDateForProConfig !== 'default' && selectedProForConfig !== 'global';
                  const dayConfig = isDayConfig ? pro?.dailyConfigs?.[selectedDateForProConfig] : undefined;
                  
                  const activeList = selectedProForConfig === 'global' 
                    ? timeList 
                    : (dayConfig?.timeList || pro?.timeList || timeList);
                  
                  return (
                    <>
                      <form onSubmit={handleAddTime} className="mb-6 flex gap-2">
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none"
                        />
                        <button 
                          type="submit"
                          disabled={!newTime || activeList.includes(newTime)}
                          className="bg-corporate-blue text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Plus size={20} /> <span className="text-sm">Novo Horário</span>
                        </button>
                      </form>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeList.map((time) => {
                          const currentType = selectedProForConfig === 'global' 
                            ? (slotConfig[time] || 'available')
                            : (dayConfig?.slotConfig?.[time] || pro?.slotConfig?.[time] || slotConfig[time] || 'available');

                          return (
                            <div key={time} className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50 group">
                              <div className="flex items-center gap-2">
                                {confirmDeleteTime === time ? (
                                  <div className="flex items-center gap-1 animate-fade-in bg-red-50 p-1 rounded-lg border border-red-100">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        onRemoveTime(
                                          time, 
                                          selectedProForConfig, 
                                          selectedDateForProConfig === 'default' ? undefined : selectedDateForProConfig
                                        );
                                        setConfirmDeleteTime(null);
                                      }}
                                      className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-bold hover:bg-red-700 transition-colors"
                                    >
                                      SIM
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setConfirmDeleteTime(null)}
                                      className="text-[10px] bg-gray-400 text-white px-2 py-1 rounded font-bold hover:bg-gray-500 transition-colors"
                                    >
                                      NÃO
                                    </button>
                                  </div>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      console.log('StaffModal: Trash clicked for', time);
                                      setConfirmDeleteTime(time);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-100 rounded-lg transition-all flex items-center justify-center border border-transparent hover:border-red-200"
                                    title="Remover horário"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                )}
                                <span className="font-mono font-bold text-gray-700">{time}</span>
                              </div>
                              <select
                                value={currentType}
                                onChange={(e) => {
                                  const newType = e.target.value as any;
                                  if (selectedProForConfig === 'global') {
                                    onUpdateSlotConfig(time, newType);
                                  } else {
                                    onUpdateProfessionalSlotConfig(
                                      selectedProForConfig, 
                                      time, 
                                      newType, 
                                      selectedDateForProConfig === 'default' ? undefined : selectedDateForProConfig
                                    );
                                  }
                                }}
                                className={`text-sm rounded px-2 py-1 border outline-none cursor-pointer font-medium
                                  ${currentType === 'available' ? 'bg-white border-gray-300 text-gray-700' : ''}
                                  ${currentType === 'break' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : ''}
                                  ${currentType === 'lunch' ? 'bg-orange-100 border-orange-300 text-orange-800' : ''}
                                `}
                              >
                                <option value="available">Atendimento</option>
                                <option value="break">Intervalo</option>
                                <option value="lunch">Almoço</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* DATES TAB */}
            {activeTab === 'dates' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-lg font-black text-corporate-blue">Datas de Atendimento</h4>
                  <div className="group relative">
                    <Info size={16} className="text-slate-300 cursor-help" />
                    <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                      Selecione os dias em que haverá atendimento. A agenda só ficará disponível para os clientes nestas datas específicas.
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleAddDate} className="mb-8 flex gap-2">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none"
                  />
                  <button 
                    type="submit"
                    className="bg-corporate-blue text-white px-4 py-2 rounded-lg hover:bg-blue-800 flex items-center gap-2"
                  >
                    <Plus size={20} /> <span className="text-sm">Adicionar Data</span>
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableDates.map((date) => (
                    <div key={date} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">
                        {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <button 
                        onClick={() => onRemoveDate(date)}
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BRANDING TAB */}
            {activeTab === 'branding' && (
              <div className="animate-fade-in space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h4 className="text-lg font-black text-corporate-blue">Identidade Visual</h4>
                    <div className="group relative">
                      <Info size={16} className="text-slate-300 cursor-help" />
                      <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        Personalize o nome e o logotipo que aparecem no topo da página de agendamento para seus clientes.
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome do Cliente</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => onUpdateClientName(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-corporate-blue outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Logotipo do Cliente</label>
                      <div className="flex flex-col gap-4">
                        {logoUrl && (
                          <div className="w-32 h-32 bg-slate-50 rounded-2xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                            <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  onUpdateLogo(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label 
                            htmlFor="logo-upload"
                            className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:border-corporate-blue hover:bg-blue-50 transition-all cursor-pointer group"
                          >
                            <Upload className="text-slate-300 group-hover:text-corporate-blue mb-2" size={24} />
                            <span className="text-sm font-bold text-slate-500 group-hover:text-corporate-blue">Clique para selecionar o logo</span>
                            <span className="text-[10px] text-slate-400 mt-1 italic">baixe em jpeg e suba aqui</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ou cole a URL do Logo</label>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => onUpdateLogo(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-corporate-blue outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-black text-corporate-blue mb-4">Segurança</h4>
                  <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-4">
                    <p className="text-xs text-red-600 font-medium">
                      Atenção: Esta senha é necessária para acessar este painel de configurações. Não a esqueça.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Senha do Administrador</label>
                    <input
                      type="text"
                      value={adminPassword || ''}
                      onChange={(e) => onUpdateAdminPassword?.(e.target.value)}
                      placeholder="admin123"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-corporate-blue outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-8 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-lg font-black text-corporate-blue">Relatório de Utilização</h4>
                      <p className="text-xs text-slate-500">Visão geral de agendamentos e presenças</p>
                    </div>
                    <div className="group relative">
                      <HelpCircle size={20} className="text-blue-400 cursor-help" />
                      <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                        Acompanhe o desempenho de cada profissional. Os dados de "Utilização" são baseados nas presenças confirmadas vs total de agendamentos.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-6 py-3 bg-corporate-blue text-white rounded-2xl hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                  >
                    <Download size={18} />
                    <span className="text-sm font-bold">Baixar CSV</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Geral</p>
                    <p className="text-4xl font-black text-corporate-blue">{totalBookings}</p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Presentes</p>
                    <p className="text-4xl font-black text-emerald-700">
                      {proStats.reduce((acc, p) => acc + p.present, 0)}
                    </p>
                  </div>
                  <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Faltas</p>
                    <p className="text-4xl font-black text-rose-700">
                      {proStats.reduce((acc, p) => acc + p.absent, 0)}
                    </p>
                  </div>
                  <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pendentes</p>
                    <p className="text-4xl font-black text-amber-700">
                      {proStats.reduce((acc, p) => acc + p.pending, 0)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Agendamentos</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Presenças</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Faltas</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Utilização</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {proStats.map((pro) => (
                          <tr key={pro.name} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{pro.name}</td>
                            <td className="px-6 py-4 text-center text-slate-600 font-medium">{pro.bookings}</td>
                            <td className="px-6 py-4 text-center text-emerald-600 font-bold">{pro.present}</td>
                            <td className="px-6 py-4 text-center text-rose-600 font-bold">{pro.absent}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-3">
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-corporate-blue" 
                                    style={{ width: `${pro.utilization}%` }}
                                  />
                                </div>
                                <span className="text-xs font-black text-slate-700">{pro.utilization}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  {confirmClearAll ? (
                    <div className="flex flex-col items-center gap-2 animate-fade-in bg-red-50 p-4 rounded-2xl border border-red-100">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Apagar TUDO permanentemente?</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            onClearSchedules();
                            setConfirmClearAll(false);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-bold hover:bg-red-700 transition-all"
                        >
                          SIM, APAGAR TUDO
                        </button>
                        <button 
                          onClick={() => setConfirmClearAll(false)}
                          className="px-4 py-2 bg-slate-400 text-white rounded-xl text-[10px] font-bold hover:bg-slate-500 transition-all"
                        >
                          CANCELAR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmClearAll(true)}
                      className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-bold hover:bg-red-100 transition-all border border-red-100 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Limpar Todos os Agendamentos
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* COMPANIES TAB */}
            {activeTab === 'companies' && isSuperAdmin && (
              <div className="animate-fade-in">
                <h4 className="text-lg font-black text-corporate-blue mb-6">Gerenciar Empresas (Multi-Tenant)</h4>
                
                <form onSubmit={handleAddCompany} className="mb-8 space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Identificador (slug)</label>
                      <input
                        type="text"
                        value={newCompanySlug}
                        onChange={(e) => setNewCompanySlug(e.target.value)}
                        placeholder="ex: empresa-x"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome da Empresa</label>
                      <input
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Nome Visível"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-corporate-blue text-white px-4 py-3 rounded-xl hover:bg-blue-800 flex items-center justify-center gap-2 font-bold shadow-lg shadow-blue-900/20"
                  >
                    <Plus size={20} /> Cadastrar Nova Empresa
                  </button>
                </form>

                <div className="space-y-3">
                  <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Empresas Cadastradas</h6>
                  {allCompanies.map((comp) => (
                    <div key={comp.slug} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-corporate-blue">
                          <Building2 size={20} />
                        </div>
                        <div>
                          <span className="font-bold text-slate-700 block">{comp.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">/{comp.slug}</span>
                        </div>
                      </div>
                      <a 
                        href={`/${comp.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Acessar Agenda
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffModal;
