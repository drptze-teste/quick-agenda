import React, { useState } from 'react';
import { TimeSlot } from '../types';
import { X, Check, User, Calendar } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimeSlot | null;
  onBook: (name: string) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, slot, onBook }) => {
  const [name, setName] = useState('');

  if (!isOpen || !slot) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onBook(name.trim());
      setName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="bg-corporate-blue p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Calendar size={20} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Novo Agendamento</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight">Reservar Horário</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
            <div className="text-3xl font-black text-corporate-blue">{slot.time}</div>
            <div className="h-8 w-[1px] bg-blue-200"></div>
            <div className="text-sm font-bold text-blue-700 uppercase tracking-wider">Horário Selecionado</div>
          </div>

          <div className="mb-8">
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
              Nome do Colaborador
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={18} />
              </div>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-corporate-blue focus:bg-white outline-none transition-all font-bold text-slate-700"
                required
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-corporate-blue text-white font-bold rounded-2xl hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} />
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
