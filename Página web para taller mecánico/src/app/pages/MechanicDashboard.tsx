import { useState, useRef, useEffect } from "react";
import { 
  Wrench, Calendar, Settings, Activity, Droplets, CarFront, 
  CheckCircle2, Battery, Fuel, MoveDown, Save, Lock, User, 
  MessageSquare, Send, XCircle, CalendarClock, ShieldAlert, Clock 
} from "lucide-react";
import { toast } from "sonner";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { CarPart, Appointment } from "../types";
import { mockVehicles, mockAppointments, mockWarrantyClaims, mockMechanics, mockHistory } from "../store";
import { CarTwin } from "../components/CarTwin";
import referenceImg from "../../imports/image.png";

const STAGES: { id: CarPart; label: string; icon: React.ElementType; color: string }[] = [
  { id: "body", label: "Chasis / Apoyo", icon: CarFront, color: "bg-orange-500" },
  { id: "engine", label: "Motor", icon: Settings, color: "bg-red-500" },
  { id: "electrical", label: "Sistema Eléctrico", icon: Battery, color: "bg-blue-500" },
  { id: "cooling", label: "Refrigeración", icon: Droplets, color: "bg-sky-400" },
  { id: "fuel", label: "Combustible", icon: Fuel, color: "bg-green-300" },
  { id: "brakes", label: "Frenos", icon: CheckCircle2, color: "bg-green-700" },
  { id: "suspension", label: "Suspensión", icon: Wrench, color: "bg-amber-600" },
  { id: "exhaust", label: "Escape", icon: Activity, color: "bg-yellow-400" },
  { id: "transmission", label: "Potencia / Transmisión", icon: MoveDown, color: "bg-purple-500" },
  { id: "ready", label: "Listo para Retiro", icon: CheckCircle2, color: "bg-green-500" },
];

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

const calculateTimeStatus = (entryDate: string, estimatedTimeStr?: string): 'on_time' | 'warning' | 'delayed' => {
  if (!estimatedTimeStr) return 'on_time';
  const today = new Date('2026-06-10');
  let parsedEntryDate = new Date(entryDate);
  if (isNaN(parsedEntryDate.getTime())) parsedEntryDate = new Date('2026-06-10'); 
  let daysToAdd = 0;
  if (estimatedTimeStr.includes("1 hora") || estimatedTimeStr.includes("2 horas") || estimatedTimeStr.includes("4 horas")) daysToAdd = 0; 
  else if (estimatedTimeStr.includes("1 día")) daysToAdd = 1;
  else if (estimatedTimeStr.includes("2 días")) daysToAdd = 2;
  else if (estimatedTimeStr.includes("3 días")) daysToAdd = 3;
  else daysToAdd = 4;

  const targetDate = new Date(parsedEntryDate);
  targetDate.setDate(targetDate.getDate() + daysToAdd);
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'delayed';
  else if (diffDays === 0) return 'warning';
  else return 'on_time';
};

export function MechanicDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"taller" | "agenda" | "garantias" | "configuracion">("taller");
  const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
  
  const [appointments, setAppointments] = useState([...mockAppointments]);
  const [vehicles, setVehicles] = useState({ ...mockVehicles });
  const [warrantyTickets, setWarrantyTickets] = useState([...mockWarrantyClaims]);

  const [mechanicsList, setMechanicsList] = useState([...(mockMechanics || [])]);
  const [mechanicFilter, setMechanicFilter] = useState<string>("");
  const [selectedMechanicForConfirm, setSelectedMechanicForConfirm] = useState<string>("");
  const [newMechanicName, setNewMechanicName] = useState("");
  const [budgetItemDesc, setBudgetItemDesc] = useState("");
  const [budgetItemPrice, setBudgetItemPrice] = useState("");
  const [tempBudgetItems, setTempBudgetItems] = useState<{description: string, price: number}[]>([]);
  const [selectedPartsForBudget, setSelectedPartsForBudget] = useState<CarPart[]>([]);

  const [agendaDate, setAgendaDate] = useState<Date>(new Date());
  const [reschedulingAppt, setReschedulingAppt] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState<string>("");
  const [appointmentToConfirm, setAppointmentToConfirm] = useState<Appointment | null>(null);
  const [estimatedTimeForConfirm, setEstimatedTimeForConfirm] = useState("1 hora");

  const selectedVehicle = selectedPlate ? vehicles[selectedPlate] : null;

  const [editPart, setEditPart] = useState<CarPart>("engine");
  const [editProgress, setEditProgress] = useState(0);
  const [editStatusText, setEditStatusText] = useState("");

  const [replyMessage, setReplyMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [finishingPart, setFinishingPart] = useState<CarPart | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      toast.success("Bienvenido al Portal Mecánico");
    } else toast.error("Contraseña incorrecta. (Pista: admin123)");
  };

  const handleSelectVehicle = (plate: string) => {
    setSelectedPlate(plate);
    const v = vehicles[plate];
    setEditPart(v.activePart);
    setEditProgress(v.progress);
    setEditStatusText(v.statusText);
    setSelectedPartsForBudget([]); 
  };

  const handleSystemClick = (stageId: CarPart) => {
    if (!selectedPlate) return;
    setEditPart(stageId);
    mockVehicles[selectedPlate].activePart = stageId;
    setVehicles({ ...mockVehicles });
    toast.success(`Sistema ahora en revisión.`);
  };

  const handleFinishSystem = (stageId: CarPart) => {
    setFinishingPart(stageId);
  };

  const submitFinishSystem = () => {
    if (!selectedPlate || !finishingPart) return;
    const v = mockVehicles[selectedPlate];
    if (!v.completedParts) v.completedParts = [];
    
    if (finishingPart !== 'ready' && !v.completedParts.includes(finishingPart)) {
      v.completedParts.push(finishingPart);
    }
    
    let newProgress = v.progress;
    if (finishingPart === 'ready') newProgress = 100;
    else if (v.budget?.selectedParts?.length) {
      newProgress = Math.round((v.completedParts.length / v.budget.selectedParts.length) * 100);
    }
    if (newProgress > 100) newProgress = 100;

    v.progress = newProgress;
    v.activePart = finishingPart;
    v.statusText = "Revisión/Reparación de la pieza finalizada y evidencia subida correctamente.";
    if (!v.photos) v.photos = {};
    v.photos.after = "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=300&auto=format&fit=crop";
    
    setEditPart(finishingPart);
    setEditProgress(newProgress);
    setEditStatusText(v.statusText);
    
    setVehicles({ ...mockVehicles });
    setFinishingPart(null);
    toast.success(`Pieza finalizada. Progreso actualizado a ${newProgress}%`);
  };

  const handleSave = () => {
    if (!selectedPlate) return;
    mockVehicles[selectedPlate].activePart = editPart;
    mockVehicles[selectedPlate].progress = editPart === "ready" ? 100 : editProgress;
    mockVehicles[selectedPlate].statusText = editStatusText;
    setVehicles({ ...mockVehicles });
    toast.success("Estado del vehículo actualizado");
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !selectedPlate) return;
    mockVehicles[selectedPlate].messages.push({
      id: `m-${Date.now()}`,
      sender: "mechanic",
      text: replyMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setVehicles({ ...mockVehicles });
    setReplyMessage("");
  };

  const handleConfirmAppointment = (id: string) => {
    const appt = mockAppointments.find(a => a.id === id);
    if (appt) { setAppointmentToConfirm(appt); setSelectedMechanicForConfirm(""); }
  };

  const submitConfirmation = () => {
    if (!appointmentToConfirm) return;
    if (!selectedMechanicForConfirm) { toast.error("Debes asignar un mecánico"); return; }
    
    const appt = appointmentToConfirm;
    appt.status = "confirmed";
    appt.estimatedTime = estimatedTimeForConfirm;
    setAppointments([...mockAppointments]);
    
    if (!mockVehicles[appt.plate]) {
      mockVehicles[appt.plate] = {
        plate: appt.plate, brand: appt.brand, model: appt.model, entryDate: appt.date,
        progress: 0, activePart: "body", statusText: "Vehículo recién ingresado al taller.",
        mechanic: selectedMechanicForConfirm, service: appt.service,
        estimatedTime: estimatedTimeForConfirm, timeStatus: "on_time",
        messages: [], completedParts: []
      };
    } else {
      mockVehicles[appt.plate].estimatedTime = estimatedTimeForConfirm;
      mockVehicles[appt.plate].mechanic = selectedMechanicForConfirm;
    }
    setVehicles({ ...mockVehicles });
    setAppointmentToConfirm(null);
    setEstimatedTimeForConfirm("1 hora");
    setSelectedMechanicForConfirm("");
    toast.success(`Orden asignada a ${selectedMechanicForConfirm}.`);
  };

  const handleRejectAppointment = (id: string) => {
    const appt = mockAppointments.find(a => a.id === id);
    if (appt) {
      appt.status = "rejected";
      setAppointments([...mockAppointments]);
      toast.error(`Cita rechazada.`);
    }
  };

  const submitReschedule = () => {
    if (!rescheduleDate || !rescheduleTime || !reschedulingAppt) return;
    const appt = mockAppointments.find(a => a.id === reschedulingAppt);
    if (appt) {
      appt.status = "reschedule_proposed";
      appt.proposedDate = format(rescheduleDate, "yyyy-MM-dd");
      appt.proposedTime = rescheduleTime;
      setAppointments([...mockAppointments]);
      setReschedulingAppt(null);
      toast.success("Propuesta enviada al cliente.");
    }
  };

  const getConfirmedSlotsForDate = (date: Date) => {
    const dStr = format(date, "yyyy-MM-dd");
    return appointments.filter(a => a.date === dStr && a.status === "confirmed").map(a => a.time);
  };

  const handleSendBudget = () => {
    if (!selectedPlate || tempBudgetItems.length === 0) { toast.error("Añade costos."); return; }
    if (selectedPartsForBudget.length === 0) { toast.error("Marca al menos una parte."); return; }

    const total = tempBudgetItems.reduce((acc, item) => acc + item.price, 0);
    mockVehicles[selectedPlate].budget = {
      items: [...tempBudgetItems], total, status: 'pending', selectedParts: [...selectedPartsForBudget]
    };
    mockVehicles[selectedPlate].completedParts = [];
    mockVehicles[selectedPlate].progress = 0; 
    setVehicles({ ...mockVehicles });
    setTempBudgetItems([]); setSelectedPartsForBudget([]);
    toast.success("Presupuesto enviado.");
  };

  const handleNotifyReady = () => {
    if (!selectedPlate) return;
    const v = mockVehicles[selectedPlate];
    v.activePart = 'ready';
    v.progress = 100;
    v.statusText = "El vehículo ha sido reparado con éxito y está listo para retiro.";
    v.messages.push({
      id: `m-${Date.now()}`,
      sender: "mechanic",
      text: "🚗 ¡Hola! Te informamos que tu vehículo ya está reparado y listo para ser retirado en nuestro taller.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setVehicles({ ...mockVehicles });
    toast.success("Alerta enviada. Cliente notificado.");
  };

  const handleDeliverVehicle = () => {
    if (!selectedPlate) return;
    const v = mockVehicles[selectedPlate];
    
    if (!mockHistory[v.plate]) mockHistory[v.plate] = [];
    mockHistory[v.plate].push({
      id: `R-${Date.now()}`,
      plate: v.plate,
      service: v.service,
      deliveryDate: format(new Date(), "yyyy-MM-dd"),
      brand: v.brand,
      model: v.model,
      mechanic: v.mechanic,
      notes: "Servicio completado. " + v.statusText,
      surveyStatus: 'pending', 
      deliverySurveyCompleted: false, // Inicia en false para lanzar la encuesta al cliente
      isClosed: false,
      activePart: 'ready'
    });
    
    delete mockVehicles[v.plate];
    setVehicles({ ...mockVehicles });
    setSelectedPlate(null);
    toast.success("¡Vehículo entregado! El registro se movió al historial.");
  };

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [selectedVehicle?.messages, selectedPlate]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><Lock className="w-8 h-8 text-blue-600" /></div>
        <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
        <form onSubmit={handleLogin} className="space-y-4 mt-6 text-left">
          <label className="text-sm font-medium">Contraseña de acceso</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl shadow-md">Ingresar al Portal</button>
        </form>
      </div>
    );
  }

  const allowedStages = STAGES.filter(stage => {
    if (stage.id === 'ready') return false; 
    if (selectedVehicle?.budget?.selectedParts) return selectedVehicle.budget.selectedParts.includes(stage.id);
    return true; 
  });

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-full gap-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Portal Mecánico</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona las reparaciones y actualiza el Gemelo Digital.</p>
        </div>
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl flex-wrap gap-1">
          <button onClick={() => setActiveTab("taller")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "taller" ? "bg-white dark:bg-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>Vehículos en Taller</button>
          <button onClick={() => setActiveTab("agenda")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "agenda" ? "bg-white dark:bg-slate-900 shadow-sm relative" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
            Agenda Virtual
            {appointments.some(a => a.status === 'pending') && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
          </button>
          <button onClick={() => setActiveTab("garantias")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "garantias" ? "bg-white dark:bg-slate-900 shadow-sm relative" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>
            Post-Venta
            {warrantyTickets.some(t => t.status === 'pending') && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
          </button>
          <button onClick={() => setActiveTab("configuracion")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "configuracion" ? "bg-white dark:bg-slate-900 shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>Configuración</button>
        </div>
      </div>

      {activeTab === "agenda" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" />Calendario de Ocupación</h2>
              <div className="flex justify-center custom-calendar border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <DayPicker mode="single" selected={agendaDate} onSelect={(d) => d && setAgendaDate(d)} locale={es} className="mx-auto scale-90" />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-3">Horas para {format(agendaDate, "dd/MM/yyyy")}</h3>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(time => {
                    const isBooked = getConfirmedSlotsForDate(agendaDate).includes(time);
                    return (
                      <div key={time} className={`text-center py-1.5 rounded-lg text-xs font-medium border ${isBooked ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>{time}</div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Listado de Solicitudes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="pb-3 font-medium">Fecha / Hora</th><th className="pb-3 font-medium">Cliente</th><th className="pb-3 font-medium">Vehículo / Motivo</th><th className="pb-3 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {appointments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(app => (
                    <tr key={app.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-medium">{app.date} <span className="text-slate-500 block">{app.time}</span></td>
                      <td className="py-4">{app.customerName}<span className="text-slate-500 block text-xs">{app.phone}</span></td>
                      <td className="py-4"><span className="font-mono text-xs block">{app.plate}</span><span className="capitalize bg-slate-100 px-2 py-0.5 rounded text-xs mt-1 inline-block">{app.service}</span></td>
                      <td className="py-4 text-right">
                        {app.status === 'pending' ? (
                          <div className="flex flex-col gap-2 items-end">
                            <button onClick={() => handleConfirmAppointment(app.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium w-24">Confirmar</button>
                            <div className="flex gap-2">
                              <button onClick={() => setReschedulingAppt(app.id)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-medium">Reagendar</button>
                              <button onClick={() => handleRejectAppointment(app.id)} className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1.5 rounded-lg text-xs font-medium">Rechazar</button>
                            </div>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${app.status === 'confirmed' ? 'bg-green-100 text-green-800 border-green-200' : app.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                            {app.status === 'confirmed' ? 'Confirmada' : app.status === 'rejected' ? 'Rechazada' : 'Reagendando...'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === "garantias" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="col-span-12">
             <div className="bg-amber-50 p-8 rounded-3xl border border-amber-200 text-center">
               <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-50" />
               <h3 className="text-xl font-bold text-amber-900 mb-2">Módulo Post-Venta</h3>
               <p className="text-amber-800">Selecciona la pestaña Vehículos en Taller o Configuración para ver las nuevas funcionalidades.</p>
             </div>
           </div>
        </div>
      ) : activeTab === "configuracion" ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm max-w-3xl mx-auto w-full">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2"><Settings className="w-5 h-5" /> Gestión de Equipo Mecánico</h2>
          <div className="flex gap-4 mb-6">
            <input type="text" value={newMechanicName} onChange={(e) => setNewMechanicName(e.target.value)} placeholder="Nombre del nuevo mecánico" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" />
            <button onClick={() => { if(!newMechanicName.trim()) return; setMechanicsList([...mechanicsList, { id: `M-${Date.now()}`, name: newMechanicName.trim() }]); setNewMechanicName(""); toast.success("Mecánico añadido."); }} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium">Añadir</button>
          </div>
          <div className="space-y-3">
            {mechanicsList.map(mech => (
              <div key={mech.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-sm flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />{mech.name}</span>
                <button onClick={() => { setMechanicsList(mechanicsList.filter(m => m.id !== mech.id)); toast.success("Mecánico eliminado."); }} className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1 bg-red-50 rounded-lg">Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5" />Taller</h2>
            <select value={mechanicFilter} onChange={(e) => setMechanicFilter(e.target.value)} className="w-full mb-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700">
              <option value="">Todos los mecánicos</option>
              {mechanicsList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {Object.values(vehicles).filter(v => mechanicFilter === "" || v.mechanic === mechanicFilter).map(v => {
                const dynamicTimeStatus = calculateTimeStatus(v.entryDate, v.estimatedTime);
                return (
                <button key={v.plate} onClick={() => handleSelectVehicle(v.plate)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedPlate === v.plate ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-blue-300 bg-slate-50"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{v.plate}</span>
                      {v.messages && v.messages.some(m => m.sender === 'client') && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{v.progress}%</span>
                  </div>
                  <div className="text-sm font-medium">{v.brand} {v.model}</div>
                  <div className="text-xs text-slate-500 mt-2 font-medium">👤 Mecánico: <span className="text-blue-600">{v.mechanic}</span></div>
                  {v.estimatedTime && (
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-500"><CalendarClock className="w-3.5 h-3.5" /><span>Estimado: {v.estimatedTime}</span></div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${dynamicTimeStatus === 'on_time' ? 'bg-green-100 text-green-700' : dynamicTimeStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {dynamicTimeStatus === 'on_time' ? 'A tiempo' : dynamicTimeStatus === 'warning' ? 'Al límite' : 'Retrasado'}
                      </span>
                    </div>
                  )}
                </button>
              )})}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col">
            {!selectedVehicle ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 min-h-[400px]">
                <Settings className="w-12 h-12 mb-4 opacity-20" />
                <p>Selecciona un vehículo para actualizar su estado</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                  <div><h2 className="text-2xl font-bold">{selectedVehicle.brand} {selectedVehicle.model}</h2><p className="text-slate-500 font-mono">{selectedVehicle.plate}</p></div>
                  <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-xl flex items-center gap-2"><Save className="w-4 h-4" />Guardar Cambios</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {!selectedVehicle.budget || selectedVehicle.budget.status === 'rejected' ? (
                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                        <h3 className="text-sm font-bold text-amber-900 mb-3">{!selectedVehicle.budget ? "Generar Presupuesto" : "Generar Nuevo Presupuesto"}</h3>
                        <div className="mb-4 bg-white/50 p-3 rounded-xl border border-amber-200/50">
                          <label className="block text-xs font-bold text-amber-900 mb-2">Selecciona las partes a intervenir:</label>
                          <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                            {STAGES.filter(s => s.id !== 'ready').map(stage => (
                              <label key={stage.id} className="flex items-center gap-2 text-xs text-amber-800 cursor-pointer">
                                <input type="checkbox" checked={selectedPartsForBudget.includes(stage.id)} onChange={(e) => { if (e.target.checked) setSelectedPartsForBudget([...selectedPartsForBudget, stage.id]); else setSelectedPartsForBudget(selectedPartsForBudget.filter(id => id !== stage.id)); }} className="rounded border-amber-400 text-amber-600" />
                                {stage.label}
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          <input type="text" placeholder="Repuesto/Servicio" value={budgetItemDesc} onChange={(e)=>setBudgetItemDesc(e.target.value)} className="flex-1 px-3 py-2 text-sm rounded-lg border border-amber-200" />
                          <input type="number" placeholder="$ Precio" value={budgetItemPrice} onChange={(e)=>setBudgetItemPrice(e.target.value)} className="w-24 px-3 py-2 text-sm rounded-lg border border-amber-200" />
                          <button onClick={() => { if(!budgetItemDesc || !budgetItemPrice) return; setTempBudgetItems([...tempBudgetItems, {description: budgetItemDesc, price: Number(budgetItemPrice)}]); setBudgetItemDesc(""); setBudgetItemPrice("");}} className="bg-amber-200 text-amber-800 px-3 rounded-lg text-sm font-bold">+</button>
                        </div>
                        {tempBudgetItems.length > 0 && (
                          <ul className="text-xs text-amber-800 mb-4 space-y-1 bg-white/50 p-2 rounded-lg">
                            {tempBudgetItems.map((item, i) => (<li key={i} className="flex justify-between border-b border-amber-200/50 pb-1"><span>{item.description}</span><span className="font-bold">${item.price}</span></li>))}
                          </ul>
                        )}
                        <button onClick={handleSendBudget} disabled={tempBudgetItems.length === 0} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium py-2 rounded-xl text-sm">Enviar Presupuesto</button>
                      </div>
                    ) : selectedVehicle.budget.status === 'pending' ? (
                      <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-500 animate-pulse" /><span className="text-sm font-medium text-slate-700">Esperando aprobación...</span>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-200 flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" /><span className="text-sm font-medium text-green-800">Presupuesto Aceptado</span>
                      </div>
                    )}

                    <div className={`space-y-6 transition-opacity duration-300 ${(!selectedVehicle.budget || selectedVehicle.budget.status !== 'accepted') ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                      <div className="space-y-3">
                        <label className="block text-sm font-medium">Sistemas en Revisión</label>
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                          {allowedStages.map(stage => {
                            const isSelected = editPart === stage.id;
                            const isFinished = selectedVehicle.completedParts?.includes(stage.id) && stage.id !== 'ready';
                            return (
                              <div key={stage.id} className={`flex items-center justify-between p-3 rounded-xl border ${isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 bg-slate-50"} ${isFinished ? 'opacity-60 grayscale' : ''}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${stage.color} ${isSelected ? 'animate-pulse' : ''}`} />
                                  <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : ''}`}>{stage.label}</span>
                                </div>
                                {isFinished ? (
                                  <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Finalizado</span>
                                ) : (
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSystemClick(stage.id)} className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg">Iniciar</button>
                                    <button onClick={() => handleFinishSystem(stage.id)} className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg">Finalizar</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
                        <h3 className="text-sm font-medium mb-4">Acciones de Finalización y Entrega</h3>
                        {selectedVehicle.activePart !== 'ready' ? (
                          <button
                            onClick={handleNotifyReady}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                          >
                            <CheckCircle2 className="w-5 h-5" /> Notificar Vehículo Listo para Retiro
                          </button>
                        ) : (
                          <button
                            onClick={handleDeliverVehicle}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm animate-pulse"
                          >
                            <CarFront className="w-5 h-5" /> Marcar como Entregado y Archivar
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Comentario para el cliente</label>
                        <textarea value={editStatusText} onChange={(e) => setEditStatusText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm min-h-[80px]" placeholder="Escribe detalles del progreso..." />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col h-full max-h-[600px]">
                    <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden">
                      <div className="bg-slate-100 p-3 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-sm font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Consultas del Cliente</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm custom-scrollbar">
                        {selectedVehicle.messages && selectedVehicle.messages.length === 0 ? (
                          <p className="text-slate-400 text-center mt-4 text-xs">Sin mensajes.</p>
                        ) : (
                          selectedVehicle.messages?.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender === 'mechanic' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[90%] p-2.5 rounded-2xl ${msg.sender === 'mechanic' ? 'bg-blue-100 text-blue-900 rounded-br-none' : 'bg-white border border-slate-200 rounded-bl-none'}`}>
                                <p>{msg.text}</p><span className="text-[10px] opacity-60 block mt-1">{msg.timestamp}</span>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input type="text" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendReply()} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Responder cliente..." />
                        <button onClick={handleSendReply} disabled={!replyMessage.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="bg-slate-100 rounded-2xl border border-slate-200 p-2 flex items-center gap-4 h-32">
                      <div className="w-1/3 h-full relative overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center">
                        <div className="scale-50 origin-center absolute w-full h-full flex items-center justify-center"><CarTwin activePart={editPart} /></div>
                      </div>
                      <div className="w-2/3 h-full rounded-xl overflow-hidden relative">
                         <img src={referenceImg} alt="Guía" className="w-full h-full object-cover object-center opacity-80 mix-blend-multiply" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modales */}
      {finishingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">Finalizar Reparación</h2><button onClick={() => setFinishingPart(null)}><XCircle className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="p-6">
              <div className="mb-6"><label className="block text-sm font-medium mb-2">Adjuntar foto (simulada) *</label><input type="file" required className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700" /></div>
              <div className="flex gap-3">
                <button onClick={() => setFinishingPart(null)} className="flex-1 py-3 bg-slate-100 font-medium rounded-xl">Cancelar</button>
                <button onClick={submitFinishSystem} className="flex-1 py-3 bg-green-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {appointmentToConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold">Confirmar Orden de Trabajo</h2><button onClick={() => setAppointmentToConfirm(null)}><XCircle className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <p className="text-sm font-medium mb-1">Vehículo: <span className="font-mono font-bold text-blue-600">{appointmentToConfirm.plate}</span></p><p className="text-sm text-slate-600">Servicio: {appointmentToConfirm.service}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Asignar Mecánico *</label>
                <select value={selectedMechanicForConfirm} onChange={(e) => setSelectedMechanicForConfirm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" required>
                  <option value="">Seleccionar mecánico...</option>
                  {mechanicsList.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Tiempo Estimado *</label>
                <select value={estimatedTimeForConfirm} onChange={(e) => setEstimatedTimeForConfirm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm" required>
                  <option value="1 hora">1 hora</option><option value="2 horas">2 horas</option><option value="1 día hábil">1 día hábil</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setAppointmentToConfirm(null)} className="flex-1 py-3 bg-slate-100 font-medium rounded-xl">Cancelar</button>
                <button onClick={submitConfirmation} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}