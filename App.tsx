
import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_SLOTS, generateScheduleFromConfig, DEFAULT_SLOT_CONFIG, DEFAULT_PROFESSIONAL, TIME_LIST } from './constants';
import { TimeSlot, Professional, SlotConfig } from './types';
import SlotItem from './components/SlotItem';
import { LayoutGrid, List, Sparkles, Flower2, CalendarDays, Users, UserCircle, ChevronDown, Settings, CloudOff, Cloud, Printer, Trash2 } from 'lucide-react';
import BookingModal from './components/BookingModal';
import BenesseLogo from './components/BenesseLogo';
import StaffModal from './components/StaffModal';
import { getScheduleSummary } from './services/geminiService';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';

export default function App() {
  // --- CONFIGURATION STATE ---
  const [slotConfig, setSlotConfig] = useState<SlotConfig>(DEFAULT_SLOT_CONFIG);
  const [availableDates, setAvailableDates] = useState<string[]>(['2026-01-01']);
  const [timeList, setTimeList] = useState<string[]>(TIME_LIST);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [clientName, setClientName] = useState<string>('Cescon Barrieu');
  const [adminPassword, setAdminPassword] = useState<string>('admin123');

  // --- APP STATE ---
  const [currentDate, setCurrentDate] = useState<string>('2026-01-01');
  const [professionals, setProfessionals] = useState<Professional[]>([DEFAULT_PROFESSIONAL]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>(DEFAULT_PROFESSIONAL.id);
  
  const [schedules, setSchedules] = useState<Record<string, TimeSlot[]>>({
    [`2026-01-01::${DEFAULT_PROFESSIONAL.id}`]: INITIAL_SLOTS
  });

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const isInitialLoad = useRef(true);

  // --- PERSISTENCE LOGIC ---

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsSyncing(true);
        // 1. Fetch settings from Firestore
        const settingsDoc = await getDoc(doc(db, 'settings', 'default'));
        const settings = settingsDoc.exists() ? settingsDoc.data() : {};

        // 2. Fetch professionals
        const professionalsSnapshot = await getDocs(collection(db, 'professionals'));
        const professionalsData = professionalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Professional[];

        // 3. Fetch schedules
        const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
        const schedulesMap: Record<string, TimeSlot[]> = {};
        schedulesSnapshot.docs.forEach(doc => {
          schedulesMap[doc.id] = doc.data()?.slots;
        });

        if (Object.keys(schedulesMap).length > 0 || professionalsData.length > 0) {
          setSchedules(schedulesMap);
          setSlotConfig(settings?.slotConfig || DEFAULT_SLOT_CONFIG);
          setProfessionals(professionalsData.length > 0 ? professionalsData : [DEFAULT_PROFESSIONAL]);
          setAvailableDates(settings?.availableDates?.length > 0 ? settings.availableDates : ['2026-01-01']);
          setTimeList(settings?.timeList || TIME_LIST);
          setLogoUrl(settings?.logoUrl || '');
          setClientName(settings?.clientName || 'Cescon Barrieu');
          setAdminPassword(settings?.adminPassword || 'admin123');
          setIsOnline(true);
          
          // Sync to local storage as backup
          localStorage.setItem('benesse_data', JSON.stringify({
            schedules: schedulesMap,
            slotConfig: settings?.slotConfig,
            professionals: professionalsData,
            availableDates: settings?.availableDates,
            timeList: settings?.timeList,
            logoUrl: settings?.logoUrl,
            clientName: settings?.clientName,
            adminPassword: settings?.adminPassword
          }));
        }
      } catch (error) {
        console.warn('Could not load from Firebase, trying localStorage...', error);
        setIsOnline(false);
        
        // 2. Fallback to LocalStorage
        const localData = localStorage.getItem('benesse_data');
        if (localData) {
          const data = JSON.parse(localData);
          if (data.schedules && Object.keys(data.schedules).length > 0) {
            setSchedules(data.schedules);
            setSlotConfig(data.slotConfig || DEFAULT_SLOT_CONFIG);
            setProfessionals(data.professionals?.length > 0 ? data.professionals : [DEFAULT_PROFESSIONAL]);
            setAvailableDates(data.availableDates?.length > 0 ? data.availableDates : ['2026-01-01']);
            setTimeList(data.timeList || TIME_LIST);
            setLogoUrl(data.logoUrl || '');
            setClientName(data.clientName || 'Cescon Barrieu');
            setAdminPassword(data.adminPassword || 'admin123');
          }
        }
      } finally {
        isInitialLoad.current = false;
        setIsSyncing(false);
      }
    };

    loadData();
  }, []);

  // Save data on change
  useEffect(() => {
    if (isInitialLoad.current) return;

    const saveData = async () => {
      const dataToSave = {
        schedules,
        slotConfig,
        professionals,
        availableDates,
        timeList,
        logoUrl,
        clientName,
        adminPassword
      };

      // Always save to localStorage first (offline safety)
      localStorage.setItem('benesse_data', JSON.stringify(dataToSave));

      // Try to sync with Firebase
      try {
        setIsSyncing(true);
        const batch = writeBatch(db);

        // 1. Update Settings
        const settingsRef = doc(db, 'settings', 'default');
        batch.set(settingsRef, {
          logoUrl: logoUrl || '',
          clientName: clientName || 'Cescon Barrieu',
          availableDates: availableDates || [],
          timeList: timeList || [],
          slotConfig: slotConfig || {},
          adminPassword: adminPassword || 'admin123',
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // 2. Update Professionals
        if (professionals && Array.isArray(professionals)) {
          for (const pro of professionals) {
            const proRef = doc(db, 'professionals', pro.id);
            batch.set(proRef, {
              name: pro.name,
              slotConfig: pro.slotConfig || {},
              timeList: pro.timeList || null
            }, { merge: true });
          }
        }

        // 3. Update Schedules
        if (schedules) {
          for (const [key, slots] of Object.entries(schedules)) {
            const scheduleRef = doc(db, 'schedules', key);
            batch.set(scheduleRef, {
              slots,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }

        await batch.commit();
        setIsOnline(true);
      } catch (error) {
        console.error('Firebase save error:', error);
        setIsOnline(false);
      } finally {
        setIsSyncing(false);
      }
    };

    // Debounce saving
    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [schedules, slotConfig, professionals, availableDates, timeList, logoUrl, clientName]);

  // --- HELPERS ---

  // Helper to generate key
  const getScheduleKey = (date: string, proId: string) => `${date}::${proId}`;

  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId) || professionals[0];
  const activeTimeList = selectedProfessional?.timeList || timeList;
  
  // Merge global config with professional config for the current view
  const proSlotConfig = {
    ...slotConfig,
    ...(selectedProfessional?.slotConfig || {})
  };

  // Get current slots. If not found in state, we'll build it from config
  const currentScheduleKey = getScheduleKey(currentDate, selectedProfessionalId);
  const savedSlots = (schedules || {})[currentScheduleKey] || [];

  // Always build the schedule based on the current timeList to ensure updates reflect immediately
  const currentSlots = activeTimeList.map((time, index) => {
    // Try to find a saved slot for this time
    const savedSlot = savedSlots.find(s => s.time === time);
    
    // If it's booked, we keep the booking
    if (savedSlot && savedSlot.type === 'booked') {
      return savedSlot;
    }

    // Otherwise, use the current config (global + pro override)
    const configType = proSlotConfig[time] || slotConfig[time] || 'available';
    return {
      id: savedSlot?.id || `slot-${index}-${time}`,
      time,
      type: configType,
      attendeeName: configType === 'lunch' ? 'Almoço' : configType === 'break' ? 'Intervalo' : undefined
    };
  });

  // Split slots for UI
  const midPoint = Math.ceil(currentSlots.length / 2);
  const leftColumnSlots = currentSlots.slice(0, midPoint);
  const rightColumnSlots = currentSlots.slice(midPoint);

  // --- HANDLERS ---

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.type === 'break' || slot.type === 'lunch') return;
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setIsStaffModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
      setLoginInput('');
      setLoginError('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput === adminPassword) {
      setIsAdminAuthenticated(true);
      setIsLoginModalOpen(false);
      setIsStaffModalOpen(true);
    } else {
      setLoginError('Senha incorreta');
    }
  };

  const handleBooking = (name: string) => {
    if (!selectedSlot) return;

    const newSlots = currentSlots.map(s => 
      s.id === selectedSlot.id ? { ...s, type: 'booked' as const, attendeeName: name } : s
    );

    setSchedules(prev => ({
      ...prev,
      [currentScheduleKey]: newSlots
    }));
    
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleDirectCancel = (slot: TimeSlot) => {
    if (!window.confirm(`Deseja cancelar o agendamento de ${slot.attendeeName}?`)) return;

    const newSlots = currentSlots.map(s => 
      s.id === slot.id ? { ...s, type: 'available' as const, attendeeName: undefined } : s
    );

    setSchedules(prev => ({
      ...prev,
      [currentScheduleKey]: newSlots
    }));
  };

  const handleAddProfessional = (name: string) => {
    const newPro = { id: `pro-${Date.now()}`, name };
    setProfessionals(prev => [...prev, newPro]);
  };

  const handleRemoveProfessional = async (id: string) => {
    if (professionals.length <= 1) return;
    
    // 1. Update local state immediately
    setProfessionals(prev => prev.filter(p => p.id !== id));
    if (selectedProfessionalId === id) {
      setSelectedProfessionalId(professionals.find(p => p.id !== id)?.id || '');
    }

    // 2. Persist deletion to Firestore
    try {
      await deleteDoc(doc(db, 'professionals', id));
      
      // Cleanup: delete all schedules associated with this professional
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      const batch = writeBatch(db);
      let deletedCount = 0;
      schedulesSnapshot.docs.forEach(doc => {
        if (doc.id.endsWith(`::${id}`)) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        await batch.commit();
        console.log(`App: Deleted professional ${id} and ${deletedCount} associated schedules.`);
      } else {
        console.log(`App: Deleted professional ${id}. No associated schedules found.`);
      }
    } catch (error) {
      console.error('App: Error removing professional from Firestore:', error);
    }
  };

  const handleUpdateSlotConfig = (time: string, type: 'available' | 'break' | 'lunch') => {
    setSlotConfig(prev => ({
      ...prev,
      [time]: type
    }));
  };

  const handleUpdateProfessionalSlotConfig = (proId: string, time: string, type: 'available' | 'break' | 'lunch') => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === proId) {
        return {
          ...p,
          slotConfig: {
            ...(p.slotConfig || {}),
            [time]: type
          }
        };
      }
      return p;
    }));
  };

  const handleAddTime = (time: string, proId?: string) => {
    if (proId && proId !== 'global') {
      setProfessionals(prev => prev.map(p => {
        if (p.id === proId) {
          const currentList = p.timeList || [...timeList];
          if (!currentList.includes(time)) {
            return { ...p, timeList: [...currentList, time].sort() };
          }
        }
        return p;
      }));
    } else {
      if (!timeList.includes(time)) {
        setTimeList(prev => [...prev, time].sort());
      }
    }
  };

  const handleRemoveTime = (time: string, proId?: string) => {
    console.log('App: handleRemoveTime called for:', time, 'pro:', proId);
    
    let updatedProfessionals = [...professionals];

    // 1. Update Configuration
    if (proId && proId !== 'global') {
      updatedProfessionals = professionals.map(p => {
        if (p.id === proId) {
          const currentList = p.timeList || [...timeList];
          const newList = currentList.filter(t => t !== time);
          console.log(`App: Updating pro ${p.name} timeList. Old size: ${currentList.length}, New size: ${newList.length}`);
          return { ...p, timeList: newList.length > 0 ? newList : undefined };
        }
        return p;
      });
      setProfessionals(updatedProfessionals);
    } else {
      console.log('App: Global time removal');
      setTimeList(prev => {
        const newList = prev.filter(t => t !== time);
        console.log(`App: Global timeList updated. Old size: ${prev.length}, New size: ${newList.length}`);
        return newList.length > 0 ? newList : prev; // Don't fallback to default, just keep current if it would be empty
      });
      setSlotConfig(prev => {
        const newConfig = { ...prev };
        delete newConfig[time];
        return newConfig;
      });
    }

    // 2. Update existing schedules to reflect the removal immediately
    setSchedules(prev => {
      const newSchedules = { ...prev };
      let removedCount = 0;
      Object.keys(newSchedules).forEach(key => {
        const parts = key.split('::');
        if (parts.length !== 2) return;
        const keyProId = parts[1];
        
        if (proId && proId !== 'global') {
          if (keyProId === proId) {
            const originalLength = newSchedules[key].length;
            newSchedules[key] = newSchedules[key].filter(s => s.time !== time);
            removedCount += (originalLength - newSchedules[key].length);
          }
        } else {
          const pro = updatedProfessionals.find(p => p.id === keyProId);
          if (!pro?.timeList) {
            const originalLength = newSchedules[key].length;
            newSchedules[key] = newSchedules[key].filter(s => s.time !== time);
            removedCount += (originalLength - newSchedules[key].length);
          }
        }
      });
      if (removedCount > 0) {
        console.log(`App: Removed ${removedCount} slots from existing schedules.`);
      }
      return newSchedules;
    });
  };

  const handleResetToGlobal = (proId: string, type: 'timeList' | 'slotConfig') => {
    setProfessionals(prev => prev.map(p => {
      if (p.id === proId) {
        const newPro = { ...p };
        if (type === 'timeList') delete newPro.timeList;
        if (type === 'slotConfig') delete newPro.slotConfig;
        return newPro;
      }
      return p;
    }));
  };

  const handleClearSchedules = async () => {
    console.log('Starting handleClearSchedules...');

    try {
      setIsSyncing(true);
      
      // 1. Clear in Firestore
      console.log('Fetching all schedules from Firestore...');
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      console.log(`Found ${schedulesSnapshot.size} schedule documents to delete.`);
      
      const batch = writeBatch(db);
      schedulesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log('Firestore batch delete committed.');
      
      // 2. Clear in State
      setSchedules({});
      
      // 3. Clear in LocalStorage
      const localData = localStorage.getItem('benesse_data');
      if (localData) {
        const data = JSON.parse(localData);
        data.schedules = {};
        localStorage.setItem('benesse_data', JSON.stringify(data));
      }

      alert('Todos os agendamentos foram apagados com sucesso!');
    } catch (error) {
      console.error('Error clearing schedules:', error);
      alert('Erro ao apagar agendamentos. Verifique sua conexão e tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddDate = (date: string) => {
    if (!availableDates.includes(date)) {
      setAvailableDates(prev => [...prev, date].sort());
    }
  };

  const handleRemoveDate = async (date: string) => {
    if (availableDates.length <= 1) return;
    
    // 1. Update local state
    setAvailableDates(prev => prev.filter(d => d !== date));
    if (currentDate === date) {
      setCurrentDate(availableDates.find(d => d !== date) || '');
    }

    // 2. Persist cleanup to Firestore
    try {
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      const batch = writeBatch(db);
      let deletedCount = 0;
      schedulesSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith(`${date}::`)) {
          batch.delete(doc.ref);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        await batch.commit();
        console.log(`App: Deleted date ${date} and ${deletedCount} associated schedules.`);
      }
    } catch (error) {
      console.error('App: Error cleaning up schedules for removed date:', error);
    }
  };

  const handleGetSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summaryText = await getScheduleSummary(currentSlots, selectedProfessional.name, currentDate);
      setSummary(summaryText);
    } catch (error) {
      setSummary("Não foi possível gerar o resumo no momento.");
    } finally {
      setIsLoadingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-8 font-sans">
      
      {/* Sync Status Indicator */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {isSyncing && (
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-blue-100 animate-pulse">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Sincronizando...</span>
          </div>
        )}
        {!isOnline && (
          <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full shadow-sm border border-red-100">
            <CloudOff size={14} className="text-red-500" />
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Modo Offline</span>
          </div>
        )}
      </div>

      {/* Header Section */}
      <header className="w-full max-w-5xl flex flex-col items-center mb-10">
        <div className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
            ) : (
              <BenesseLogo />
            )}
            <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
            <h1 className="text-xl font-bold text-corporate-blue hidden sm:block tracking-tight">
              {clientName}
            </h1>
          </div>
          
          <button 
            onClick={handleAdminClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Settings size={18} />
            <span className="text-sm font-semibold">Configurações</span>
          </button>
        </div>

        <div className="w-full bg-white rounded-3xl p-6 shadow-xl shadow-blue-900/5 border border-blue-50/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-[0.2em] mb-1">Agendamento Online</span>
              <h2 className="text-3xl font-black text-corporate-blue tracking-tighter">Massoterapia Quick</h2>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <CalendarDays size={18} className="text-blue-500" />
                <select 
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 cursor-pointer"
                >
                  {availableDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Selection Tabs */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide flex-1">
            {professionals.map(pro => (
              <button
                key={pro.id}
                onClick={() => setSelectedProfessionalId(pro.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all font-medium text-sm border
                  ${selectedProfessionalId === pro.id 
                    ? 'bg-corporate-blue text-white border-corporate-blue shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-corporate-blue hover:text-corporate-blue'}
                `}
              >
                <UserCircle size={16} className={selectedProfessionalId === pro.id ? 'text-blue-200' : 'text-gray-400'} />
                {pro.name}
              </button>
            ))}
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
            <button 
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'dashboard' ? 'bg-white text-corporate-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Visão Geral"
            >
              <LayoutGrid size={14} />
              <span className="hidden lg:inline">Dashboard</span>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-corporate-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Lista Individual"
            >
              <List size={14} />
              <span className="hidden lg:inline">Lista</span>
            </button>
          </div>
        </div>

        {/* Subheader */}
        <div className="w-full mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Profissional Selecionado</p>
              <h3 className="text-lg font-bold text-slate-800 leading-none">{selectedProfessional.name}</h3>
            </div>
          </div>

          <button 
            onClick={handleGetSummary}
            disabled={isLoadingSummary}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100 disabled:opacity-50"
          >
            <Sparkles size={14} className={isLoadingSummary ? 'animate-spin' : ''} />
            {isLoadingSummary ? 'Analisando...' : 'Resumo da Agenda (IA)'}
          </button>
        </div>

        {/* AI Summary Box */}
        {summary && (
          <div className="w-full mt-4 p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg shrink-0">
                <Sparkles size={16} className="text-emerald-600" />
              </div>
              <div className="text-sm text-slate-600 leading-relaxed italic">
                {summary}
              </div>
              <button onClick={() => setSummary("")} className="text-slate-300 hover:text-slate-500">
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Schedule Grid */}
      <main className="w-full max-w-5xl">
        {viewMode === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-3">
              {leftColumnSlots.map(slot => (
                <SlotItem 
                  key={`${currentDate}-${selectedProfessionalId}-${slot.id}`} 
                  slot={slot} 
                  onSelect={handleSlotClick}
                  onCancel={() => handleDirectCancel(slot)}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {rightColumnSlots.map(slot => (
                <SlotItem 
                  key={`${currentDate}-${selectedProfessionalId}-${slot.id}`} 
                  slot={slot} 
                  onSelect={handleSlotClick}
                  onCancel={() => handleDirectCancel(slot)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <List size={18} className="text-corporate-blue" />
                Lista de Atendimentos - {selectedProfessional.name}
              </h3>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Printer size={14} /> Imprimir
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {currentSlots.map(slot => (
                <div 
                  key={slot.id}
                  className={`flex items-center p-4 transition-colors ${slot.type === 'booked' ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="w-20 font-mono font-bold text-lg text-corporate-blue shrink-0">
                    {slot.time}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      {slot.type === 'booked' ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{slot.attendeeName}</span>
                          <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">Confirmado</span>
                        </div>
                      ) : slot.type === 'break' ? (
                        <span className="text-amber-500 font-medium italic">Intervalo</span>
                      ) : slot.type === 'lunch' ? (
                        <span className="text-orange-500 font-medium italic">Almoço</span>
                      ) : (
                        <span className="text-gray-400 italic">Disponível</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {slot.type === 'booked' ? (
                        <button 
                          onClick={() => handleDirectCancel(slot)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Cancelar Agendamento"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (slot.type === 'available') && (
                        <button 
                          onClick={() => handleSlotClick(slot)}
                          className="px-4 py-1.5 bg-corporate-blue text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-colors"
                        >
                          Agendar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm pb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Flower2 size={16} className="text-blue-300" />
          <span className="font-bold tracking-widest uppercase text-[10px]">Benesse Quick Massage</span>
        </div>
        <p className="mb-2">© 2026 Sistema de Agendamento Corporativo</p>
        <a 
          href="https://www.benessegestaoesportiva.com.br" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-600 transition-colors font-medium"
        >
          www.benessegestaoesportiva.com.br
        </a>
      </footer>

      {/* MODALS */}
      <BookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        slot={selectedSlot} 
        onBook={handleBooking}
      />

      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        professionals={professionals}
        onAddProfessional={handleAddProfessional}
        onRemoveProfessional={handleRemoveProfessional}
        slotConfig={slotConfig}
        onUpdateSlotConfig={handleUpdateSlotConfig}
        onUpdateProfessionalSlotConfig={handleUpdateProfessionalSlotConfig}
        availableDates={availableDates}
        onAddDate={handleAddDate}
        onRemoveDate={handleRemoveDate}
        timeList={timeList}
        onAddTime={handleAddTime}
        onRemoveTime={handleRemoveTime}
        onResetToGlobal={handleResetToGlobal}
        onClearSchedules={handleClearSchedules}
        logoUrl={logoUrl}
        onUpdateLogo={setLogoUrl}
        clientName={clientName}
        onUpdateClientName={setClientName}
        adminPassword={adminPassword}
        onUpdateAdminPassword={setAdminPassword}
        schedules={schedules}
      />

      {/* LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden p-8 border border-white/20">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Settings size={32} className="text-corporate-blue" />
              </div>
              <h3 className="text-2xl font-black text-corporate-blue tracking-tight">Acesso Restrito</h3>
              <p className="text-slate-500 text-sm mt-2">Digite a senha de administrador para continuar</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-corporate-blue outline-none transition-all text-center text-lg font-bold tracking-widest"
                />
                {loginError && <p className="text-red-500 text-xs font-bold mt-2 text-center">{loginError}</p>}
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 bg-corporate-blue text-white rounded-2xl font-bold hover:bg-blue-800 shadow-lg shadow-blue-900/20 transition-all"
                >
                  Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
