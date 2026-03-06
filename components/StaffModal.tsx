
import React, { useState } from 'react';
import { Professional, SlotConfig, TimeSlot } from '../types';
import { TIME_LIST } from '../constants';
import { X, Plus, Users, Trash2, Clock, Calendar, Settings, BarChart2, Flower2 } from 'lucide-react';

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
  onUpdateProfessionalSlotConfig: (proId: string, time: string, type: 'available' | 'break' | 'lunch') => void;
  // Date Props
  availableDates: string[];
  onAddDate: (date: string) => void;
  onRemoveDate: (date: string) => void;
  // Time List Props
  timeList: string[];
  onAddTime: (time: string) => void;
  onRemoveTime: (time: string) => void;
  // Client Props
  logoUrl: string;
  onUpdateLogo: (url: string) => void;
  clientName: string;
  onUpdateClientName: (name: string) => void;
  // Reports Props
  schedules: Record<string, TimeSlot[]>;
}

type TabType = 'staff' | 'schedule' | 'dates' | 'branding' | 'reports';

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
  logoUrl,
  onUpdateLogo,
  clientName,
  onUpdateClientName,
  schedules
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('staff');
  const [newProName, setNewProName] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [selectedProForConfig, setSelectedProForConfig] = useState<string>('global');

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
      onAddTime(newTime);
      setNewTime('');
    }
  };

  // Calculate stats for reports
  const totalBookings = Object.values(schedules).reduce((acc, slots) => {
    return acc + slots.filter(s => s.type === 'booked').length;
  }, 0);

  const proStats = professionals.map(pro => {
    const bookings = Object.entries(schedules)
      .filter(([key]) => key.includes(`::${pro.id}`))
      .reduce((acc, [_, slots]) => acc + slots.filter(s => s.type === 'booked').length, 0);
    return { name: pro.name, bookings };
  });

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
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            
            {/* STAFF TAB */}
            {activeTab === 'staff' && (
              <div className="animate-fade-in">
                <h4 className="text-lg font-black text-corporate-blue mb-6">Gerenciar Equipe</h4>
                
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
                    Defina o modelo padrão da agenda. Você pode configurar um modelo global ou específico para cada profissional.
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-gray-500 uppercase">Configurar para:</label>
                    <select 
                      value={selectedProForConfig}
                      onChange={(e) => setSelectedProForConfig(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-corporate-blue outline-none focus:ring-2 focus:ring-corporate-blue"
                    >
                      <option value="global">Modelo Global (Todos)</option>
                      {professionals.map(pro => (
                        <option key={pro.id} value={pro.id}>{pro.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add New Time Form */}
                <form onSubmit={handleAddTime} className="mb-6 flex gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-corporate-blue outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={!newTime || timeList.includes(newTime)}
                    className="bg-corporate-blue text-white px-4 py-2 rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={20} /> <span className="text-sm">Novo Horário</span>
                  </button>
                </form>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {timeList.map((time) => {
                    const pro = professionals.find(p => p.id === selectedProForConfig);
                    const currentType = selectedProForConfig === 'global' 
                      ? (slotConfig[time] || 'available')
                      : (pro?.slotConfig?.[time] || slotConfig[time] || 'available');

                    return (
                      <div key={time} className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50 group">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              if(confirm(`Remover o horário ${time}?`)) {
                                onRemoveTime(time);
                              }
                            }}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span className="font-mono font-bold text-gray-700">{time}</span>
                        </div>
                        <select
                          value={currentType}
                          onChange={(e) => {
                            const newType = e.target.value as any;
                            if (selectedProForConfig === 'global') {
                              onUpdateSlotConfig(time, newType);
                            } else {
                              onUpdateProfessionalSlotConfig(selectedProForConfig, time, newType);
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
              </div>
            )}

            {/* DATES TAB */}
            {activeTab === 'dates' && (
              <div className="animate-fade-in">
                <h4 className="text-lg font-black text-corporate-blue mb-6">Datas de Atendimento</h4>
                
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
                  <h4 className="text-lg font-black text-corporate-blue mb-4">Identidade Visual</h4>
                  <div className="space-y-4">
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
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">URL do Logo</label>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => onUpdateLogo(e.target.value)}
                        placeholder="https://exemplo.com/logo.png"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-corporate-blue outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="animate-fade-in">
                <h4 className="text-lg font-black text-corporate-blue mb-6">Resumo de Atendimentos</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Total Geral</p>
                    <h5 className="text-4xl font-black text-corporate-blue">{totalBookings}</h5>
                    <p className="text-xs text-blue-400 mt-2">Agendamentos realizados</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h6 className="text-xs font-black text-slate-400 uppercase tracking-widest">Por Profissional</h6>
                  {proStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">{stat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-corporate-blue">{stat.bookings}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sessões</span>
                      </div>
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
