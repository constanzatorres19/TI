import { useState, useEffect, useRef } from "react";
import { 
  Info, Settings, Wrench, Battery, CarFront, CheckCircle2, Droplets, Fuel, Activity, 
  MoveDown, MessageSquare, ArrowLeft, Clock, Send, XCircle, CalendarClock, Lock, 
  History as HistoryIcon, ShieldAlert, ShieldCheck, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { differenceInDays, parseISO, format, addDays } from "date-fns";

import { CarTwin } from "../components/CarTwin";
import { ServiceSurveyModal } from "../components/ServiceSurveyModal";
import { VehicleStatus, CarPart, Appointment, RepairHistory } from "../types";
import { mockVehicles, mockAppointments, mockHistory, mockWarrantyClaims } from "../store";
import { useAuth } from "../context/AuthContext";

const STAGES: { id: CarPart; label: string; icon: React.ElementType }[] = [
  { id: "body", label: "Chasis / Carrocería", icon: CarFront },
  { id: "engine", label: "Motor", icon: Settings },
  { id: "electrical", label: "Sistema Eléctrico", icon: Battery },
  { id: "cooling", label: "Refrigeración", icon: Droplets },
  { id: "fuel", label: "Combustible", icon: Fuel },
  { id: "brakes", label: "Frenos", icon: CheckCircle2 },
  { id: "suspension", label: "Apoyo / Suspensión", icon: Wrench },
  { id: "exhaust", label: "Escape", icon: Activity },
  { id: "transmission", label: "Potencia / Transmisión", icon: MoveDown },
];

type TimelineItem = {
  id: string;
  type: 'past' | 'current' | 'appointment';
  date: Date;
  dateStr: string;
  title: string;
  data: RepairHistory | VehicleStatus | Appointment;
};

export function DigitalTwin() {
  const { isAuthenticated, login } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  const [plateSearched, setPlateSearched] = useState("ABCD-12");
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);

  const [isContacting, setIsContacting] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimType, setClaimType] = useState<'ruido' | 'fuga' | 'duda' | 'otro'>('duda');
  const [claimComment, setClaimComment] = useState("");
  const [showPriorityAgenda, setShowPriorityAgenda] = useState(false);
  const [priorityDate, setPriorityDate] = useState("");
  
  const [surveyRepair, setSurveyRepair] = useState<RepairHistory | null>(null);
  
  // Encuesta de entrega (cuando pasa al historial)
  const [deliverySurveyRepair, setDeliverySurveyRepair] = useState<RepairHistory | null>(null);

  const loadVehicleData = (plate: string) => {
    const p = plate.toUpperCase();
    const past = mockHistory[p] || [];
    const current = mockVehicles[p];
    const appt = mockAppointments.find(a => a.plate === p && a.status !== 'confirmed');

    let newTimeline: TimelineItem[] = [];
    
    past.forEach(item => newTimeline.push({ 
        id: item.id, type: 'past', date: parseISO(item.deliveryDate), 
        dateStr: item.deliveryDate, title: item.service, data: item 
    }));

    if (current) {
        newTimeline.push({ 
            id: current.plate + '-current', type: 'current', date: new Date(current.entryDate), 
            dateStr: current.entryDate, title: "Reparación en Curso", data: current 
        });
    } else if (appt) {
        newTimeline.push({ 
            id: appt.id, type: 'appointment', date: new Date(appt.date), 
            dateStr: appt.date, title: "Cita Agendada", data: appt 
        });
    }

    newTimeline.sort((a,b) => a.date.getTime() - b.date.getTime());
    setTimeline(newTimeline);

    if (newTimeline.length > 0) {
        setSelectedItem(prev => {
          if (prev) {
            const found = newTimeline.find(t => t.id === prev.id);
            if (found) return found;
          }
          return newTimeline[newTimeline.length - 1];
        });
    } else {
        setSelectedItem(null);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    setIsLoginModalOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated) loadVehicleData(plateSearched);
    else { setTimeline([]); setSelectedItem(null); setSurveyRepair(null); setDeliverySurveyRepair(null); }
  }, [isAuthenticated, plateSearched]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        loadVehicleData(plateSearched);
      }
    }, 1500); 
    return () => clearInterval(interval);
  }, [isAuthenticated, plateSearched]);

  useEffect(() => {
    if (isContacting && messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [isContacting, selectedItem?.data]);

  // Efecto que detecta si hay un vehículo recién entregado (en el historial) sin encuestar
  useEffect(() => {
    if (!isAuthenticated) return;
    const unratedDelivery = timeline
      .filter(t => t.type === 'past')
      .map(t => t.data as RepairHistory)
      .find(r => r.deliverySurveyCompleted === false); 

    if (unratedDelivery) {
      setDeliverySurveyRepair(unratedDelivery);
    }
  }, [timeline, isAuthenticated]);

  // --- ACTIONS ---

  const handleDeliverySurveySubmit = (stars: number, comment: string) => {
    if (deliverySurveyRepair) {
      const repairInStore = mockHistory[plateSearched]?.find(r => r.id === deliverySurveyRepair.id);
      if (repairInStore) {
        repairInStore.deliverySurveyCompleted = true; 
      }
      setDeliverySurveyRepair(null);
      loadVehicleData(plateSearched);
      toast.success(`Evaluación de ${stars} estrellas enviada. ¡Gracias por preferir nuestro taller!`);
    }
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim() || !selectedItem || selectedItem.type !== 'current') return;
    const currentData = selectedItem.data as VehicleStatus;
    
    mockVehicles[currentData.plate] = {
      ...mockVehicles[currentData.plate],
      messages: [
        ...mockVehicles[currentData.plate].messages,
        {
          id: `m-${Date.now()}`, sender: "client", text: contactMessage.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    setContactMessage("");
    loadVehicleData(plateSearched);
    toast.success("Mensaje enviado");
  };

  const handleBudgetResponse = (accepted: boolean) => {
    const currentData = selectedItem?.data as VehicleStatus;
    if (!currentData || !currentData.budget) return;
    
    mockVehicles[currentData.plate] = {
      ...mockVehicles[currentData.plate],
      budget: {
        ...mockVehicles[currentData.plate].budget!,
        status: accepted ? 'accepted' : 'rejected'
      }
    };

    loadVehicleData(plateSearched);

    if(accepted) toast.success("¡Presupuesto aceptado! El taller comenzará la reparación.");
    else toast.error("Presupuesto rechazado. El mecánico será notificado.");
  };

  const handleAcceptReschedule = () => {
    const apptData = selectedItem?.data as Appointment;
    if (!apptData) return;
    const appt = mockAppointments.find(a => a.id === apptData.id);
    if (appt && appt.proposedDate && appt.proposedTime) {
      appt.date = appt.proposedDate; appt.time = appt.proposedTime;
      appt.status = "confirmed"; appt.proposedDate = undefined; appt.proposedTime = undefined;
      loadVehicleData(plateSearched);
      toast.success("¡Excelente! Has confirmado el nuevo horario.");
    }
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const pastData = selectedItem?.data as RepairHistory;
    if (!pastData || !claimComment.trim()) return;
    mockWarrantyClaims.push({
      id: `W-${Date.now()}`, repairId: pastData.id, plate: plateSearched,
      priority: 'Garantía Prioritaria', type: claimType, comment: claimComment,
      date: new Date().toISOString(), status: 'pending'
    });
    const repairInStore = mockHistory[plateSearched]?.find(r => r.id === pastData.id);
    if (repairInStore) repairInStore.isClosed = true;
    toast.success("Tu solicitud de garantía ha sido enviada con éxito.");
    setIsFilingClaim(false); setClaimComment("");
    loadVehicleData(plateSearched);
  };

  const handleSurveySubmit = (result: 'perfect' | 'problem', repairId: string) => {
    const repairInStore = mockHistory[plateSearched]?.find(r => r.id === repairId);
    if (repairInStore) {
      repairInStore.surveyStatus = result;
      if (result === 'perfect') repairInStore.isClosed = true;
    }
    loadVehicleData(plateSearched);
    if (result === 'perfect') toast.success("¡Excelente! Agradecemos tu confirmación.");
    else setShowPriorityAgenda(true);
  };

  const handlePriorityAgendaSubmit = () => {
    const pastData = selectedItem?.data as RepairHistory;
    if (!pastData || !priorityDate) return;
    const [datePart, timePart] = priorityDate.split(" ");
    mockAppointments.push({
      id: `A-PV-${Date.now()}`, customerName: "Cliente", phone: "+56 9 0000 0000",
      plate: plateSearched, brand: pastData.brand, model: pastData.model,
      service: "Revisión Post-Venta", date: datePart.split("/").reverse().join("-"), time: timePart, status: "pending"
    });
    mockWarrantyClaims.push({
      id: `W-${Date.now()}`, repairId: pastData.id, plate: plateSearched, priority: 'Revisión Post-Venta',
      type: 'survey_problem', comment: "Problemas post-evaluación. Cita: " + priorityDate,
      date: new Date().toISOString(), status: 'pending'
    });
    const repairInStore = mockHistory[plateSearched]?.find(r => r.id === pastData.id);
    if (repairInStore) repairInStore.isClosed = true;
    setShowPriorityAgenda(false);
    toast.success("¡Hora prioritaria confirmada! Te esperamos.");
    loadVehicleData(plateSearched);
  };

  // --- RENDERS ---
  const renderAppointment = (appt: Appointment) => (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
      {appt.status === "pending" && (
        <><div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"><Clock className="w-8 h-8 text-amber-600" /></div><h2 className="text-2xl font-bold mb-4">Hora Pendiente</h2><p className="text-slate-600 mb-6">Tu solicitud está siendo revisada.</p></>
      )}
      {appt.status === "rejected" && (
        <><div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle className="w-8 h-8 text-red-600" /></div><h2 className="text-2xl font-bold mb-4 text-red-600">Hora Rechazada</h2><p className="text-slate-600 mb-6">Por favor, intenta reagendar en otro horario.</p></>
      )}
      {appt.status === "reschedule_proposed" && (
        <>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6"><CalendarClock className="w-8 h-8 text-blue-600" /></div>
          <h2 className="text-2xl font-bold mb-4 text-blue-600">Aviso de Reagendamiento</h2>
          <p className="text-slate-600 mb-2">El taller te propone el siguiente horario:</p>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 my-4 inline-block"><p className="text-lg font-bold text-blue-700">{appt.proposedDate} a las {appt.proposedTime} hrs</p></div>
          <div className="flex justify-center mb-6"><button onClick={handleAcceptReschedule} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-xl shadow-md">Aceptar Nuevo Horario</button></div>
        </>
      )}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left max-w-sm mx-auto">
        <ul className="text-sm text-slate-600 space-y-2"><li><strong>Fecha:</strong> {appt.date}</li><li><strong>Hora:</strong> {appt.time} hrs</li><li><strong>Servicio:</strong> {appt.service}</li></ul>
      </div>
    </div>
  );

  const renderPastRepair = (repair: RepairHistory) => {
    const daysElapsed = differenceInDays(new Date(), parseISO(repair.deliveryDate));
    const isClosed = repair.isClosed;
    const isWithinWarranty = daysElapsed < 30 && !isClosed;
    const isTimeForSurvey = daysElapsed === 30 && repair.surveyStatus === 'pending' && !isClosed;
    const isOverdue = daysElapsed > 30 && !isClosed;

    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
          <div><h2 className="text-2xl font-bold">{repair.service}</h2><p className="text-slate-500 text-sm">Fecha de entrega: {repair.deliveryDate}</p></div>
          <div className="text-right"><span className="text-xs text-slate-500 block">Días transcurridos</span><span className={`text-lg font-bold ${isWithinWarranty ? 'text-green-600' : isTimeForSurvey ? 'text-blue-600' : 'text-slate-600'}`}>{daysElapsed} días</span></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <h3 className="font-semibold mb-2 text-sm text-slate-700">Notas del mecánico:</h3><p className="text-slate-600 text-sm italic">"{repair.notes}"</p><p className="text-xs text-slate-500 mt-2 text-right">- {repair.mechanic}</p>
            </div>
            
            {isWithinWarranty && !isFilingClaim && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <ShieldCheck className="w-8 h-8 text-green-600 mx-auto mb-2" /><h3 className="text-md font-bold text-green-800 mb-2">Garantía Activa</h3>
                <button onClick={() => setIsFilingClaim(true)} className="w-full bg-green-600 text-white text-sm font-medium py-2 rounded-xl">Solicitar Asistencia</button>
              </div>
            )}
            {isWithinWarranty && isFilingClaim && (
              <form onSubmit={handleSubmitClaim} className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <h3 className="font-bold text-blue-900 text-sm mb-3">Asistencia de Garantía</h3>
                <select value={claimType} onChange={(e) => setClaimType(e.target.value as any)} className="w-full mb-3 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm">
                  <option value="ruido">Ruido extraño</option><option value="fuga">Fuga de líquidos</option><option value="duda">Duda</option>
                </select>
                <textarea required value={claimComment} onChange={(e) => setClaimComment(e.target.value)} placeholder="Detalles..." className="w-full mb-3 bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm min-h-[60px]" />
                <div className="flex gap-2">
                  <button type="button" onClick={()=>setIsFilingClaim(false)} className="flex-1 bg-white text-sm py-2 rounded-lg border">Cancelar</button><button type="submit" className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 rounded-lg">Enviar</button>
                </div>
              </form>
            )}

            {isTimeForSurvey && !showPriorityAgenda && (
              <div className="bg-blue-50 border border-blue-300 rounded-2xl p-6 text-center">
                <h3 className="text-md font-bold text-blue-900 mb-4">¿Cómo está funcionando tu vehículo a 1 mes?</h3>
                <div className="flex flex-col gap-2">
                  <button onClick={() => handleSurveySubmit('perfect', repair.id)} className="w-full bg-white text-blue-900 font-medium py-2 border border-blue-200 rounded-xl flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Todo perfecto</button>
                  <button onClick={() => handleSurveySubmit('problem', repair.id)} className="w-full bg-white text-blue-900 font-medium py-2 border border-blue-200 rounded-xl flex items-center justify-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Noté un problema</button>
                </div>
              </div>
            )}
            {isTimeForSurvey && showPriorityAgenda && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="font-bold text-amber-900 mb-3">Agendar Revisión</h3>
                <select value={priorityDate} onChange={(e) => setPriorityDate(e.target.value)} className="w-full mb-3 bg-white border border-amber-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar horario...</option><option value={`${format(addDays(new Date(), 1), 'dd/MM/yyyy')} 09:00`}>Mañana a las 09:00</option><option value={`${format(addDays(new Date(), 1), 'dd/MM/yyyy')} 14:00`}>Mañana a las 14:00</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={()=>setShowPriorityAgenda(false)} className="flex-1 bg-white text-sm py-2 rounded-lg border">Atrás</button><button onClick={handlePriorityAgendaSubmit} disabled={!priorityDate} className="flex-1 bg-amber-600 disabled:opacity-50 text-white text-sm py-2 rounded-lg">Confirmar</button>
                </div>
              </div>
            )}

            {(isClosed || isOverdue) && !isTimeForSurvey && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm font-medium">{repair.surveyStatus === 'perfect' ? "Historial Cerrado" : "Garantía Finalizada"}</p>
              </div>
            )}
          </div>
          <div className="bg-slate-100 rounded-3xl border border-slate-200 p-4 shadow-inner flex flex-col items-center justify-center relative min-h-[250px]">
             <span className="absolute top-4 left-4 text-xs font-semibold uppercase text-slate-500">Pieza intervenida</span>
             <div className="scale-75 origin-center"><CarTwin activePart={repair.activePart} /></div>
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentRepair = (current: VehicleStatus) => {
    const isBudgetAccepted = current.budget?.status === 'accepted';

    return (
      <div className="space-y-6">
        
        {!isBudgetAccepted ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-blue-500 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-4">A la espera de Presupuesto</h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              {current.budget?.status === 'pending'
                ? "El mecánico ha generado un presupuesto. Por favor, revísalo y acéptalo en la ventana emergente para que podamos comenzar a trabajar."
                : "Tu vehículo está siendo evaluado. Pronto el mecánico te enviará un presupuesto detallado que deberás aceptar para iniciar la reparación."}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 bg-slate-100 rounded-3xl border border-slate-200 p-4 shadow-inner flex flex-col items-center justify-center relative min-h-[300px]">
              <span className="absolute top-4 left-4 text-xs font-bold uppercase text-slate-500">Gemelo Digital</span>
              <CarTwin activePart={current.activePart} />
            </div>
            <div className="w-full md:w-1/2 space-y-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className={`relative inline-flex rounded-full h-3 w-3 ${current.activePart === "ready" ? "bg-green-500" : "bg-blue-500"}`}></span></span>
                <h3 className="text-xl font-semibold">Estado Actual</h3>
              </div>
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-md font-medium text-blue-900 mb-1">{current.activePart === "ready" ? "Reparación completada." : "Trabajando en: " + (STAGES.find(s => s.id === current.activePart)?.label || current.activePart)}</p>
                <p className="text-blue-800 text-sm">{current.statusText}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium"><span>Progreso General</span><span>{current.activePart === "ready" ? "100" : current.progress}%</span></div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: current.activePart === "ready" ? "100%" : `${current.progress}%` }} className={`h-full rounded-full ${current.activePart === "ready" ? "bg-green-500" : "bg-blue-600"}`} />
                </div>
              </div>
              {current.photos && current.photos.after && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold mb-2">Última Evidencia</p>
                  <img src={current.photos.after} alt="Evidencia" className="h-24 w-auto rounded-lg object-cover border border-slate-200" />
                </div>
              )}
            </div>
          </div>
        )}
        
        {!isContacting ? (
          <button onClick={() => setIsContacting(true)} className={`w-full md:w-1/2 bg-white border border-slate-200 hover:bg-slate-50 font-medium py-4 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 ${!isBudgetAccepted ? 'mx-auto' : ''}`}>
            <MessageSquare className="w-5 h-5 text-blue-500" /> Chat con Mecánico ({current.mechanic})
            {current.messages.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">{current.messages.length}</span>}
          </button>
        ) : (
          <div className={`bg-white border border-blue-200 rounded-3xl p-6 shadow-md flex flex-col h-[400px] ${!isBudgetAccepted ? 'max-w-2xl mx-auto' : ''}`}>
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
              <h3 className="font-bold flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-500" /> Chat con {current.mechanic}</h3>
              <button onClick={() => setIsContacting(false)} className="text-slate-400 hover:text-slate-600"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
              {current.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.sender === 'client' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                    <p>{msg.text}</p><span className={`text-[10px] block mt-1 ${msg.sender === 'client' ? 'text-blue-200' : 'text-slate-400'}`}>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2">
              <input type="text" value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" placeholder="Escribe tu mensaje..." />
              <button onClick={handleSendMessage} disabled={!contactMessage.trim()} className="px-4 bg-blue-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center"><Send className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto mt-20">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-blue-600" /></div>
          <h1 className="text-2xl font-bold mb-4">Acceso Protegido</h1>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">Inicia sesión para verificar tus vehículos y reparaciones anteriores.</p>
          <button onClick={() => setIsLoginModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl shadow-md">Iniciar Sesión</button>
        </div>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold">Iniciar Sesión</h2><button onClick={() => setIsLoginModalOpen(false)}><XCircle className="w-6 h-6 text-slate-400 hover:text-slate-600" /></button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Correo electrónico</label><input required type="email" defaultValue="cliente@ejemplo.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" /></div>
                  <div><label className="text-xs font-medium text-slate-500 block mb-1">Contraseña</label><input required type="password" defaultValue="cliente123" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" /></div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl mt-2">Ingresar a mi Cuenta</button>
                </form>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-[70vh]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portal del Cliente</h1>
        <p className="text-slate-600">Revisa la información de tu vehículo <span className="uppercase font-bold">{plateSearched}</span></p>
      </div>

      {timeline.length === 0 ? (
        <div className="flex justify-center items-center h-64"><p className="text-slate-500">No hay registros para este vehículo.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-fit">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><HistoryIcon className="w-5 h-5"/> Mis Reparaciones</h2>
            <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {timeline.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative z-10 ${selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-300'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                     <span className="font-bold text-sm text-slate-800 line-clamp-1 pr-2">{item.title}</span>
                     <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap ${item.type === 'current' ? 'bg-blue-100 text-blue-700' : item.type === 'appointment' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                       {item.type === 'past' ? 'Finalizado' : item.type === 'current' ? 'En Taller' : 'Agendado'}
                     </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block">{item.dateStr}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            {selectedItem && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={selectedItem.id}>
                {selectedItem.type === 'appointment' && renderAppointment(selectedItem.data as Appointment)}
                {selectedItem.type === 'past' && renderPastRepair(selectedItem.data as RepairHistory)}
                {selectedItem.type === 'current' && renderCurrentRepair(selectedItem.data as VehicleStatus)}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Ventana Emergente para el Presupuesto */}
      <AnimatePresence>
        {selectedItem?.type === 'current' && (selectedItem.data as VehicleStatus).budget?.status === 'pending' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Settings className="w-8 h-8 text-blue-600" /></div>
              <h2 className="text-2xl font-bold mb-2">Presupuesto de Reparación</h2>
              <p className="text-slate-600 text-sm mb-6">El mecánico <span className="font-semibold text-slate-800">{(selectedItem.data as VehicleStatus).mechanic}</span> ha generado el siguiente desglose. Revisa y autoriza para iniciar el trabajo.</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left mb-6">
                <ul className="space-y-3">
                  {(selectedItem.data as VehicleStatus).budget!.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-sm border-b border-slate-200 pb-2">
                      <span className="font-medium text-slate-700">{item.description}</span><span className="font-bold">${item.price.toLocaleString('es-CL')}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-4 pt-2 font-bold text-lg text-blue-600 border-t border-slate-200">
                  <span>Total a Pagar:</span><span>${(selectedItem.data as VehicleStatus).budget!.total.toLocaleString('es-CL')}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => handleBudgetResponse(false)} className="flex-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 font-medium py-3 rounded-xl transition-colors">Rechazar</button>
                <button onClick={() => handleBudgetResponse(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg">Aceptar Monto</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Encuesta al Entregar el Auto */}
      {deliverySurveyRepair && (
        <ServiceSurveyModal
          repairService={deliverySurveyRepair.service}
          onClose={() => setDeliverySurveyRepair(null)}
          onSubmit={handleDeliverySurveySubmit}
        />
      )}

      {/* Modal de Encuesta Pasada (Chequeo mensual a los 30 días) */}
      {surveyRepair && (
        <ServiceSurveyModal
          repairService={surveyRepair.service}
          onClose={() => setSurveyRepair(null)}
          onSubmit={(stars, comment) => {
            handleSurveySubmit('perfect', surveyRepair.id);
            setSurveyRepair(null);
            toast.success(`Evaluación de ${stars} estrellas enviada. ¡Gracias!`);
          }}
        />
      )}
    </div>
  );
}