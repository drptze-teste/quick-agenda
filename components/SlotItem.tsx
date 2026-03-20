import React from 'react';
import { TimeSlot, PresenceType } from '../types';
import { Clock, User, UserCheck, Coffee, Utensils, Trash2, CheckCircle2, XCircle, HelpCircle, Info } from 'lucide-react';

interface SlotItemProps {
  slot: TimeSlot;
  onSelect: (slot: TimeSlot) => void;
  onCancel: () => void;
  onPresenceToggle?: (slot: TimeSlot, presence: PresenceType) => void;
}

const SlotItem: React.FC<SlotItemProps> = ({ slot, onSelect, onCancel, onPresenceToggle }) => {
  const isBooked = slot.type === 'booked';
  const isBreak = slot.type === 'break';
  const isLunch = slot.type === 'lunch';
  const isAvailable = slot.type === 'available';

  const getStatusStyles = () => {
    if (isBooked) {
      if (slot.presence === 'present') return 'bg-emerald-50/30 border-emerald-200 shadow-sm ring-1 ring-emerald-50';
      if (slot.presence === 'absent') return 'bg-rose-50/30 border-rose-200 shadow-sm ring-1 ring-rose-50';
      return 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-50';
    }
    if (isBreak) return 'bg-amber-50/50 border-amber-100 opacity-80';
    if (isLunch) return 'bg-orange-50/50 border-orange-100 opacity-80';
    return 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5';
  };

  const getIcon = () => {
    if (isBooked) {
      if (slot.presence === 'present') return <CheckCircle2 className="text-emerald-600" size={18} />;
      if (slot.presence === 'absent') return <XCircle className="text-rose-600" size={18} />;
      return <UserCheck className="text-blue-600" size={18} />;
    }
    if (isBreak) return <Coffee className="text-amber-500" size={18} />;
    if (isLunch) return <Utensils className="text-orange-500" size={18} />;
    return <Clock className="text-slate-400" size={18} />;
  };

  return (
    <div 
      onClick={() => isAvailable && onSelect(slot)}
      className={`
        relative group flex items-center p-4 rounded-2xl border transition-all duration-200
        ${getStatusStyles()}
        ${isAvailable ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0
        ${isBooked ? (slot.presence === 'present' ? 'bg-emerald-50' : slot.presence === 'absent' ? 'bg-rose-50' : 'bg-blue-50') : isBreak ? 'bg-amber-50' : isLunch ? 'bg-orange-50' : 'bg-slate-50'}
      `}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg font-black text-corporate-blue tracking-tight">{slot.time}</span>
          {isBooked && (
            <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
              slot.presence === 'present' ? 'bg-emerald-100 text-emerald-700' : 
              slot.presence === 'absent' ? 'bg-rose-100 text-rose-700' : 
              'bg-blue-100 text-blue-700'
            }`}>
              {slot.presence === 'present' ? 'Presente' : slot.presence === 'absent' ? 'Faltou' : 'Confirmado'}
            </span>
          )}
        </div>
        
        <div className="flex items-center text-sm">
          {isBooked ? (
            <span className="font-bold text-slate-700 truncate">{slot.attendeeName}</span>
          ) : isBreak ? (
            <span className="text-amber-600 font-medium italic">Intervalo</span>
          ) : isLunch ? (
            <span className="text-orange-600 font-medium italic">Almoço</span>
          ) : (
            <span className="text-slate-400 font-medium">Horário Disponível</span>
          )}
        </div>
      </div>

      {isBooked && (
        <div className="flex items-center gap-1 ml-2">
          {onPresenceToggle && (
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPresenceToggle(slot, slot.presence === 'present' ? 'pending' : 'present');
                }}
                className={`p-1.5 rounded-lg transition-all ${slot.presence === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                title="Marcar Presença"
              >
                <CheckCircle2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPresenceToggle(slot, slot.presence === 'absent' ? 'pending' : 'absent');
                }}
                className={`p-1.5 rounded-lg transition-all ${slot.presence === 'absent' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                title="Marcar Falta"
              >
                <XCircle size={16} />
              </button>
            </div>
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Cancelar Agendamento"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {isAvailable && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
          <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-blue-200">
            AGENDAR
          </div>
        </div>
      )}
      
      {/* Informational Icon for functions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="relative group/info">
          <Info size={14} className="text-slate-300 cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl pointer-events-none opacity-0 group-hover/info:opacity-100 transition-opacity z-10">
            {isBooked ? "Confirme a presença ou falta do cliente para gerar relatórios de utilização." : 
             isAvailable ? "Clique para realizar um novo agendamento neste horário." : 
             "Horário reservado para pausa do profissional."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlotItem;
