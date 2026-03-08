import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SLOTS, DEFAULT_SLOT_CONFIG, DEFAULT_PROFESSIONAL, TIME_LIST } from './constants';
import { TimeSlot, Professional, SlotConfig } from './types';
import SlotItem from './components/SlotItem';
import { LayoutGrid, List, Sparkles, Flower2, CalendarDays, Users, UserCircle, ChevronDown, Settings, CloudOff, Printer, Trash2 } from 'lucide-react';
import BookingModal from './components/BookingModal';
import BenesseLogo from './components/BenesseLogo';
import StaffModal from './components/StaffModal';
import { db } from './lib/firebase';
import { doc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

export default function App() {
  const [slotConfig, setSlotConfig] = useState<SlotConfig>(DEFAULT_SLOT_CONFIG);
  const [availableDates, setAvailableDates] = useState<string[]>(['2026-03-07']);
  const [timeList, setTimeList] = useState<string[]>(TIME_LIST);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [clientName, setClientName] = useState<string>('Cescon Barrieu');
  const [currentDate, setCurrentDate] = useState<string>('2026-03-07');
  const [professionals, setProfessionals] = useState<Professional[]>([DEFAULT_PROFESSIONAL]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(DEFAULT_PROFESSIONAL.id);
  const [schedules, setSchedules] = useState<Record<string, TimeSlot[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const isInitialLoad = useRef(true);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsSyncing(true);
        const settingsDoc = await getDoc(doc(db, 'settings', 'default'));
        
        const professionalsSnapshot = await getDocs(collection(db, 'professionals'));
        const professionalsData = professionalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Professional[];

        const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
        const schedulesMap: Record<string, TimeSlot[]> = {};
        schedulesSnapshot.docs.forEach(doc => {
          schedulesMap[doc.id] = doc.data()?.slots;
        });

        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          setSlotConfig(settings.slotConfig || DEFAULT_SLOT_CONFIG);
          setAvailableDates(settings.availableDates || ['2026-03-07']);
          setClientName(settings.clientName || 'Cescon Barrieu');
          setLogoUrl(settings.logoUrl || '');
          setTimeList(settings.timeList || TIME_LIST);
          if (settings.availableDates?.length > 0) {
            setCurrentDate(settings.availableDates[0]);
          }
        }

        if (professionalsData.length > 0) {
          setProfessionals(professionalsData);
          setSelectedProfessionalId(professionalsData[0].id);
        }

        setSchedules(schedulesMap);
        setIsOnline(true);
      } catch (error) {
        console.error('Erro ao carregar:', error);
        setIsOnline(false);
      } finally {
        isInitialLoad.current = false;
        setIsSyncing(false);
      }
    };
    loadData();
  }, []);

  // --- SALVAR DADOS (VERSÃO ROBUSTA PARA ADM) ---
  useEffect(() => {
    if (isInitialLoad.current) return;

    const saveData = async () => {
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);
        const clean = (obj: any) => JSON.parse(JSON.stringify(obj));

        // Salva Configurações Gerais
        batch.set(doc(db, 'settings', 'default'), clean({
          logoUrl, clientName, availableDates, timeList, slotConfig,
          updatedAt: new Date().toISOString()
        }), { merge: true });

        // Salva Profissionais
        professionals.forEach(pro => {
          batch.set(doc(db, 'professionals', pro.id), clean(pro), { merge: true });
        });

        // Salva Agendamentos
        Object.entries(schedules).forEach(([key, slots]) => {
          if (slots) batch.set(doc(db, 'schedules', key), { slots: clean(slots) }, { merge: true });
        });

        await batch.commit();
        setIsOnline(true);
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
        setIsOnline(false);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeout = setTimeout(saveData, 1200);
    return () => clearTimeout(timeout);
  }, [schedules, slotConfig, professionals, availableDates, timeList, logoUrl, clientName]);

  // --- FUNÇÕES DE ATUALIZAÇÃO (ADM) ---
  const handleUpdateClientName = (val: string) => setClientName(val);
  const handleUpdateLogo = (val: string) => setLogoUrl(val);
  const handleAddDate = (d: string) => setAvailableDates(prev => [...prev, d].sort());
  const handleRemoveDate = (d: string) => setAvailableDates(prev => prev.filter(date => date !== d));

  const getScheduleKey = (date: string, proId: string) => `${date}::${proId}`;
  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId) || professionals[0];
  const activeTimeList = selectedProfessional?.timeList || timeList;
  const currentScheduleKey = getScheduleKey(currentDate, selectedProfessionalId);
  const savedSlots = schedules[currentScheduleKey] || [];

  const currentSlots = activeTimeList.map((time, index) => {
    const savedSlot = savedSlots.find(s => s.time === time);
    if (savedSlot && savedSlot.type === 'booked') return savedSlot;
    const configType = (selectedProfessional.slotConfig?.[time]) || slotConfig[time] || 'available';
    return {
      id: `slot-${index}-${time}`,
      time,
      type: configType,
      attendeeName: configType === 'lunch' ? 'Almoço' : configType === 'break' ? 'Intervalo' : undefined
    };
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="fixed top-4 right-4 z-50">
        {isSyncing ? (
          <div className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full animate-pulse font-bold">SINCRONIZANDO...</div>
        ) : !isOnline ? (
          <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold">OFFLINE</div>
        ) : (
          <div className="bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-bold">NUVEM ATIVA</div>
        )}
      </div>

      <header className="max-w-5xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-8">
           {logoUrl ? <img src={logoUrl} alt="Logo" className="h-12 object-contain rounded-lg" /> : <BenesseLogo />}
           <button onClick={() => setIsStaffModalOpen(true)} className="p-2 bg-white rounded-full border shadow-sm hover:bg-slate-50 transition-colors">
             <Settings size={20} className="text-slate-600" />
           </button>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays size={18} className="text-blue-500" />
            <select 
              value={currentDate} 
              onChange={(e) => setCurrentDate(e.target.value)}
              className="text-sm font-bold text-slate-600 bg-transparent border-none focus:ring-0 cursor-pointer"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>{new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')}</option>
              ))}
            </select>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Massoterapia Quick</h2>
          <p className="text-blue-600 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">{clientName}</p>
          
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {professionals.map(pro => (
              <button 
                key={pro.id} 
                onClick={() => setSelectedProfessionalId(pro.id)} 
                className={`px-6 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${selectedProfessionalId === pro.id ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
              >
                {pro.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentSlots.map(slot => (
          <SlotItem 
            key={slot.id} 
            slot={slot} 
            onSelect={() => { setSelectedSlot(slot); setIsModalOpen(true); }} 
            onCancel={(s) => {
              if (confirm(`Cancelar agendamento de ${s.attendeeName}?`)) {
                const newSlots = currentSlots.map(item => item.id === s.id ? { ...item, type: 'available' as const, attendeeName: undefined } : item);
                setSchedules(prev => ({ ...prev, [currentScheduleKey]: newSlots }));
              }
            }} 
          />
        ))}
      </main>

      <footer className="mt-20 text-center opacity-40 text-[10px] font-black tracking-[0.3em] uppercase pb-10">
        BENESSE GESTÃO ESPORTIVA © 2026
      </footer>

      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        slot={selectedSlot} 
        onBook={(name) => {
          const newSlots = currentSlots.map(s => s.id === selectedSlot?.id ? { ...s, type: 'booked' as const, attendeeName: name } : s);
          setSchedules(prev => ({ ...prev, [currentScheduleKey]: newSlots }));
          setIsModalOpen(false);
        }} 
      />
      
      <StaffModal 
         isOpen={isStaffModalOpen} 
         onClose={() => setIsStaffModalOpen(false)} 
         professionals={professionals} 
         onAddProfessional={(name) => setProfessionals(prev => [...prev, {id: Date.now().toString(), name}])}
         onRemoveProfessional={(id) => setProfessionals(prev => prev.filter(p => p.id !== id))}
         availableDates={availableDates}
         onAddDate={handleAddDate}
         onRemoveDate={handleRemoveDate}
         slotConfig={slotConfig}
         onUpdateSlotConfig={(time, type) => setSlotConfig(prev => ({...prev, [time]: type}))}
         timeList={timeList}
         onAddTime={(t) => setTimeList(prev => [...prev, t].sort())}
         onRemoveTime={(t) => setTimeList(prev => prev.filter(time => time !== t))}
         clientName={clientName}
         onUpdateClientName={handleUpdateClientName}
         logoUrl={logoUrl}
         onUpdateLogo={handleUpdateLogo}
         schedules={schedules}
      />
    </div>
  );
}