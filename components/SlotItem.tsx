import React from 'react';
import { TimeSlot } from '../types';
import { Clock, User, UserCheck, Coffee, Utensils, Trash2 } from 'lucide-react';

interface SlotItemProps {
  slot: TimeSlot;
  onSelect: (slot: TimeSlot) => void;
  onCancel: () => void;
}

const SlotItem: React.FC<SlotItemProps> = ({ slot, onSelect, onCancel }) => {
  const isBooked = slot.type === 'booked';
  const isBreak = slot.type === 'break';
  const isLunch = slot.type === 'lunch';
  const isAvailable = slot.type === 'available';

  const getStatusStyles = () => {
    if (isBooked) return 'bg-white border-blue-200 shadow-sm ring-1 ring-blue-50';
    if (isBreak) return 'bg-amber-50/50 border-amber-100 opacity-80';
    if (isLunch) return 'bg-orange-50/50 border-orange-100 opacity-80';
    return 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5';
  };

  const getIcon = () => {
    if (isBooked) return <UserCheck className="text-blue-600" size={18} />;
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
        ${isBooked ? 'bg-blue-50' : isBreak ? 'bg-amber-50' : isLunch ? 'bg-orange-50' : 'bg-slate-50'}
      `}>
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-lg font-black text-corporate-blue tracking-tight">{slot.time}</span>
          {isBooked && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-md">
              Confirmado
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
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={18} />
        </button>
      )}

      {isAvailable && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-blue-200">
            AGENDAR
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotItem;
