import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SLOTS, DEFAULT_SLOT_CONFIG, DEFAULT_PROFESSIONAL, TIME_LIST } from './constants';
import { TimeSlot, Professional, SlotConfig } from './types';
import SlotItem from './components/SlotItem';
import { LayoutGrid, List, Sparkles, Flower2, CalendarDays, Users, UserCircle, ChevronDown, Settings, CloudOff, Printer, Trash2 } from 'lucide-react';
import BookingModal from './components/BookingModal';
import BenesseLogo from './components/BenesseLogo';
import StaffModal from './components/StaffModal';
import { getScheduleSummary } from './services/geminiService';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';

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
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const isInitialLoad = useRef(true);

  // --- CARREGAR DADOS DO GOOGLE FIREBASE ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsSyncing(true);
        const settingsDoc = await getDoc(doc(db, 'settings', 'default'));
        const settings = settingsDoc.exists() ? settingsDoc.data() : {};

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

        if (Object.keys(schedulesMap).length > 0 || professionalsData.length > 0) {
          setSchedules(schedulesMap);
          setSlotConfig(settings?.slotConfig || DEFAULT_SLOT_CONFIG);
          setProfessionals(professionalsData.length > 0 ? professionalsData : [DEFAULT_PROFESSIONAL]);
          setAvailableDates(settings?.availableDates || ['2026-03-07']);
          setClientName(settings?.clientName || 'Cescon Barrieu');
          setIsOnline(true);
        }
      } catch (error) {
        console.error('Erro ao carregar do Firebase:', error);
        setIsOnline(false);
      } finally {
        isInitialLoad.current = false;
        setIsSyncing(false);
      }
    };
    loadData();
  }, []);

  // --- SALVAR DADOS NO GOOGLE FIREBASE (A MÁGICA DO F5) ---
  useEffect(() => {
    if (isInitialLoad.current) return;

    const saveData = async () => {
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);

        // Salva Configurações
        batch.set(doc(db, 'settings', 'default'), {
          logoUrl, clientName, availableDates, timeList, slotConfig,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Salva Profissionais
        professionals.forEach(pro => {
          batch.set(doc(db, 'professionals', pro.id), pro, { merge: true });
        });

        // Salva Agendamentos
        Object.entries(schedules).forEach(([key, slots]) => {
          batch.set(doc(db, 'schedules', key), { slots }, { merge: true });
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

    const timeout = setTimeout(saveData, 1500); // Espera 1.5s após digitar para salvar
    return () => clearTimeout(timeout);
  }, [schedules, slotConfig, professionals, availableDates, timeList, logoUrl, clientName]);

  // --- LÓGICA DE INTERFACE ---
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

  const handleBooking = (name: string) => {
    if (!selectedSlot) return;
    const newSlots = currentSlots.map(s => 
      s.id === selectedSlot.id ? { ...s, type: 'booked' as const, attendeeName: name } : s
    );
    setSchedules(prev => ({ ...prev, [currentScheduleKey]: newSlots }));
    setIsModalOpen(false);
  };

  const handleDirectCancel = (slot: TimeSlot) => {
    if (!confirm(`Cancelar agendamento de ${slot.attendeeName}?`)) return;
    const newSlots = currentSlots.map(s => 
      s.id === slot.id ? { ...s, type: 'available' as const, attendeeName: undefined } : s
    );
    setSchedules(prev => ({ ...prev, [currentScheduleKey]: newSlots }));
  };

  const midPoint = Math.ceil(currentSlots.length / 2);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      {/* Indicador de Nuvem */}
      <div className="fixed top-4 right-4 z-50">
        {isSyncing ? (
          <div className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full animate-pulse font-bold">SALVANDO NO GOOGLE...</div>
        ) : !isOnline ? (
          <div className="bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-bold">OFFLINE</div>
        ) : (
          <div className="bg-emerald-500 text-white text-[10px] px-3 py-1 rounded-full font-bold">NUVEM ATIVA</div>
        )}
      </div>

      <header className="max-w-5xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-8">
           <BenesseLogo />
           <button onClick={() => setIsStaffModalOpen(true)} className="p-2 bg-white rounded-full border shadow-sm"><Settings size={20}/></button>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-blue-50">
          <h2 className="text-3xl font-black text-slate-800">Massoterapia Quick</h2>
          <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-1">{clientName}</p>
          
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {professionals.map(pro => (
              <button 
                key={pro.id}
                onClick={() => setSelectedProfessionalId(pro.id)}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${selectedProfessionalId === pro.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}
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
            onCancel={() => handleDirectCancel(slot)}
          />
        ))}
      </main>

      <footer className="mt-20 text-center opacity-50 text-xs font-bold tracking-widest">
        BENESSE GESTÃO ESPORTIVA © 2026
      </footer>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} slot={selectedSlot} onBook={handleBooking} />
      <StaffModal 
         isOpen={isStaffModalOpen} 
         onClose={() => setIsStaffModalOpen(false)} 
         professionals={professionals} 
         onAddProfessional={(name) => setProfessionals([...professionals, {id: Date.now().toString(), name}])}
         onRemoveProfessional={(id) => setProfessionals(professionals.filter(p => p.id !== id))}
         availableDates={availableDates}
         onAddDate={(d) => setAvailableDates([...availableDates, d])}
         onRemoveDate={(d) => setAvailableDates(availableDates.filter(date => date !== d))}
         slotConfig={slotConfig}
         onUpdateSlotConfig={(time, type) => setSlotConfig({...slotConfig, [time]: type})}
         timeList={timeList}
         onAddTime={(t) => setTimeList([...timeList, t].sort())}
         onRemoveTime={(t) => setTimeList(timeList.filter(time => time !== t))}
         clientName={clientName}
         onUpdateClientName={setClientName}
         logoUrl={logoUrl}
         onUpdateLogo={setLogoUrl}
         schedules={schedules}
      />
    </div>
  );
}