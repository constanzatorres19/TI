import { useState, useEffect } from "react";
import { Search, History as HistoryIcon, ShieldAlert, ShieldCheck, ArrowLeft, Send, CheckCircle2, AlertCircle, CalendarClock, Lock } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Link } from "react-router";
import { differenceInDays, parseISO, format, addDays } from "date-fns";

import { RepairHistory } from "../types";
import { mockHistory, mockWarrantyClaims, mockAppointments } from "../store";
import { CarTwin } from "../components/CarTwin";
import { useAuth } from "../context/AuthContext";
import { ServiceSurveyModal } from "../components/ServiceSurveyModal";

export function History() {
  const { isAuthenticated } = useAuth();
  
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyData, setHistoryData] = useState<RepairHistory[] | null>(null);
  
  const [selectedRepair, setSelectedRepair] = useState<RepairHistory | null>(null);
  const [isFilingClaim, setIsFilingClaim] = useState(false);
  const [claimType, setClaimType] = useState<'ruido' | 'fuga' | 'duda' | 'otro'>('duda');
  const [claimComment, setClaimComment] = useState("");
  
  const [showPriorityAgenda, setShowPriorityAgenda] = useState(false);
  const [priorityDate, setPriorityDate] = useState("");

  const [surveyRepair, setSurveyRepair] = useState<RepairHistory | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      setQuery("ABCD-12");
      if (mockHistory["ABCD-12"] && mockHistory["ABCD-12"].length > 0) {
        const data = [...mockHistory["ABCD-12"]];
        setHistoryData(data);
        
        // Auto-show survey for the most recent repair if ready and pending survey
        const latestRepair = data.sort((a,b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())[0];
        if (latestRepair && latestRepair.activePart === 'ready' && latestRepair.surveyStatus === 'pending') {
          setSurveyRepair(latestRepair);
        }
      }
    } else {
      setHistoryData(null);
      setQuery("");
      setSurveyRepair(null);
    }
  }, [isAuthenticated]);

  const handleSelectRepair = (repair: RepairHistory) => {
    setSelectedRepair(repair);
    setIsFilingClaim(false);
    setShowPriorityAgenda(false);
    setClaimType('duda');
    setClaimComment("");
  };

  const handleSubmitClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair || !claimComment.trim() || !query) return;

    const newClaim = {
      id: `W-${Date.now()}`,
      repairId: selectedRepair.id,
      plate: query.toUpperCase(),
      priority: 'Garantía Prioritaria' as const,
      type: claimType,
      comment: claimComment,
      date: new Date().toISOString(),
      status: 'pending' as const
    };

    mockWarrantyClaims.push(newClaim);
    
    toast.success("Tu solicitud de garantía ha sido enviada con éxito. Un ticket prioritario ha sido generado.");
    setIsFilingClaim(false);
    setClaimComment("");
    
    // Simulate updating local history view
    if (historyData) {
      const updated = historyData.map(r => r.id === selectedRepair.id ? { ...r, isClosed: true } : r);
      setHistoryData(updated);
      setSelectedRepair(updated.find(r => r.id === selectedRepair.id) || null);
    }
  };

  const handleSurveySubmit = (result: 'perfect' | 'problem') => {
    if (!selectedRepair) return;
    
    // Mutate store directly for simulation
    const repairInStore = mockHistory[query.toUpperCase()]?.find(r => r.id === selectedRepair.id);
    if (repairInStore) {
      repairInStore.surveyStatus = result;
      if (result === 'perfect') {
        repairInStore.isClosed = true;
      }
    }
    
    // Update local state
    if (historyData) {
      const updated = historyData.map(r => r.id === selectedRepair.id ? { ...r, surveyStatus: result, isClosed: result === 'perfect' } : r);
      setHistoryData(updated);
      setSelectedRepair(updated.find(r => r.id === selectedRepair.id) || null);
    }

    if (result === 'perfect') {
      toast.success("¡Excelente! Agradecemos tu confirmación. Historial cerrado.");
    } else {
      setShowPriorityAgenda(true);
    }
  };

  const handlePriorityAgendaSubmit = () => {
    if (!selectedRepair || !priorityDate || !query) return;
    
    // Split "DD/MM/YYYY HH:mm"
    const [datePart, timePart] = priorityDate.split(" ");
    const formattedDate = datePart.split("/").reverse().join("-"); // yyyy-MM-dd

    const newAppt = {
      id: `A-PV-${Date.now()}`,
      customerName: "Cliente (Post-Venta)",
      phone: "+56 9 0000 0000",
      plate: query.toUpperCase(),
      brand: selectedRepair.brand,
      model: selectedRepair.model,
      service: "Revisión Post-Venta (Problema Detectado)",
      date: formattedDate,
      time: timePart,
      status: "pending" as const
    };

    mockAppointments.push(newAppt);

    const newClaim = {
      id: `W-${Date.now()}`,
      repairId: selectedRepair.id,
      plate: query.toUpperCase(),
      priority: 'Revisión Post-Venta' as const,
      type: 'survey_problem' as const,
      comment: "Evaluación de calidad al mes indicó problemas. Cita agendada para: " + priorityDate,
      date: new Date().toISOString(),
      status: 'pending' as const
    };

    mockWarrantyClaims.push(newClaim);
    
    const repairInStore = mockHistory[query.toUpperCase()]?.find(r => r.id === selectedRepair.id);
    if (repairInStore) repairInStore.isClosed = true;

    if (historyData) {
      const updated = historyData.map(r => r.id === selectedRepair.id ? { ...r, isClosed: true } : r);
      setHistoryData(updated);
      setSelectedRepair(updated.find(r => r.id === selectedRepair.id) || null);
    }

    setShowPriorityAgenda(false);
    toast.success("¡Hora prioritaria confirmada! Te esperamos.");
  };

  const renderRepairDetails = () => {
    if (!selectedRepair) return null;

    const daysElapsed = differenceInDays(new Date(), parseISO(selectedRepair.deliveryDate));
    
    const isClosed = selectedRepair.isClosed;
    const isWithinWarranty = daysElapsed < 30 && !isClosed;
    const isTimeForSurvey = daysElapsed === 30 && selectedRepair.surveyStatus === 'pending' && !isClosed;
    const isOverdue = daysElapsed > 30 && !isClosed;

    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col"
      >
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold">{selectedRepair.service}</h2>
            <p className="text-slate-500">Fecha de entrega: {selectedRepair.deliveryDate}</p>
          </div>
          <div className="text-right">
            <span className="text-sm text-slate-500 block">Días transcurridos</span>
            <span className={`text-xl font-bold ${isWithinWarranty ? 'text-green-600' : isTimeForSurvey ? 'text-blue-600' : 'text-slate-600'}`}>
              {daysElapsed} días
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="font-semibold mb-2 text-sm text-slate-700 dark:text-slate-300">Notas del mecánico:</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm italic">"{selectedRepair.notes}"</p>
              <p className="text-xs text-slate-500 mt-2 text-right">- {selectedRepair.mechanic}</p>
            </div>

            {/* CASO 1: Garantía Temprana (0 a 29 días) */}
            {isWithinWarranty && !isFilingClaim && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">Garantía Activa</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Esta reparación cuenta con cobertura de garantía (30 días).
                </p>
                <button 
                  onClick={() => setIsFilingClaim(true)}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm"
                >
                  Solicitar Asistencia de Garantía
                </button>
              </div>
            )}

            {/* CASO 1: Formulario de Garantía */}
            {isWithinWarranty && isFilingClaim && (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmitClaim}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5" />
                    Asistencia de Garantía
                  </h3>
                  <button type="button" onClick={() => setIsFilingClaim(false)} className="text-sm text-slate-500 hover:text-slate-700">Cancelar</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Tipo de problema</label>
                    <select 
                      value={claimType}
                      onChange={(e) => setClaimType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ruido">Ruido extraño</option>
                      <option value="fuga">Fuga de líquidos</option>
                      <option value="duda">Duda sobre el funcionamiento</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Comentarios adicionales</label>
                    <textarea 
                      required
                      value={claimComment}
                      onChange={(e) => setClaimComment(e.target.value)}
                      placeholder="Describe el problema que estás experimentando..."
                      className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Enviar Reporte
                  </button>
                </div>
              </motion.form>
            )}

            {/* CASO 2: Chequeo de Salud Vehicular Automático (Día 30) */}
            {isTimeForSurvey && !showPriorityAgenda && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-600 rounded-2xl p-6 text-center shadow-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
                  Evaluación Mensual
                </div>
                <h3 className="text-xl font-bold mb-2 text-blue-900 dark:text-blue-100 mt-2">¿Cómo está funcionando tu vehículo?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-6">
                  Se ha cumplido un mes desde la reparación. Tu opinión nos ayuda a garantizar la calidad del servicio.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handleSurveySubmit('perfect')}
                    className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-medium py-4 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Todo funciona perfecto
                  </button>
                  <button 
                    onClick={() => handleSurveySubmit('problem')}
                    className="w-full bg-white dark:bg-slate-900 hover:bg-slate-50 border border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100 font-medium py-4 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    He notado un problema
                  </button>
                </div>
              </motion.div>
            )}

            {/* CASO 2: Agenda Prioritaria para Revisión Post-Venta */}
            {isTimeForSurvey && showPriorityAgenda && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 shadow-sm"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5" />
                    Agendar Revisión Post-Venta
                  </h3>
                </div>
                <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                  Lamentamos que hayas notado un problema. Para solucionarlo, hemos habilitado horarios prioritarios para ti.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">Horario Sugerido</label>
                    <select 
                      value={priorityDate}
                      onChange={(e) => setPriorityDate(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Seleccionar horario...</option>
                      <option value={`${format(addDays(new Date(), 1), 'dd/MM/yyyy')} 09:00`}>Mañana a las 09:00</option>
                      <option value={`${format(addDays(new Date(), 1), 'dd/MM/yyyy')} 14:00`}>Mañana a las 14:00</option>
                      <option value={`${format(addDays(new Date(), 2), 'dd/MM/yyyy')} 10:00`}>Pasado mañana a las 10:00</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowPriorityAgenda(false)}
                      className="flex-1 bg-white hover:bg-slate-50 text-amber-900 font-medium py-3 rounded-xl transition-colors border border-amber-200 shadow-sm"
                    >
                      Atrás
                    </button>
                    <button 
                      onClick={handlePriorityAgendaSubmit}
                      disabled={!priorityDate}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CASO: Ticket en Proceso (Is Closed via ticket generation) OR Warranty Over */}
            {(isClosed || isOverdue) && !isTimeForSurvey && (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center shadow-sm">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-700 dark:text-slate-300">
                  {selectedRepair.surveyStatus === 'perfect' ? "Historial Cerrado" : "Garantía Finalizada"}
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  {selectedRepair.surveyStatus === 'perfect' 
                    ? "Evaluación completada satisfactoriamente." 
                    : isClosed 
                      ? "Hay un reclamo activo o resuelto asociado a esta reparación."
                      : "El plazo de garantía de 30 días para esta reparación ha expirado."}
                </p>
                <button 
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed"
                >
                  Proceso Completado
                </button>
              </div>
            )}
          </div>

          {/* Gemelo Digital Miniatura */}
          <div className="bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-inner flex flex-col items-center justify-center relative min-h-[300px]">
            <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Pieza intervenida</span>
            <div className="w-full h-full flex items-center justify-center scale-75 origin-center">
              <CarTwin activePart={selectedRepair.activePart} />
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[70vh]">
      {!isAuthenticated ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mt-20"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Acceso Protegido</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm leading-relaxed">
              Por seguridad, inicia sesión para verificar tus vehículos e historial.
            </p>
          </div>
        </motion.div>
      ) : !historyData ? (
        <div className="flex justify-center items-center h-64">
           <p className="text-slate-500">Cargando tu historial...</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          <div className="lg:col-span-12 flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <HistoryIcon className="w-8 h-8 text-blue-600" />
                Mis Reparaciones
              </h1>
              <p className="text-slate-500 mt-1">Selecciona una reparación para ver detalles o gestionar post-venta.</p>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-fit">
            <h2 className="text-lg font-semibold mb-4">Reparaciones Anteriores</h2>
            <div className="space-y-3">
              {historyData.sort((a,b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime()).map(repair => {
                const daysElapsed = differenceInDays(new Date(), parseISO(repair.deliveryDate));
                
                const isClosed = repair.isClosed;
                const isWithinWarranty = daysElapsed < 30 && !isClosed;
                const isTimeForSurvey = daysElapsed === 30 && repair.surveyStatus === 'pending' && !isClosed;
                
                return (
                  <button
                    key={repair.id}
                    onClick={() => handleSelectRepair(repair)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                      selectedRepair?.id === repair.id 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm" 
                        : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-950"
                    }`}
                  >
                    {isTimeForSurvey && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-md">
                        EVALUAR
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm line-clamp-1 pr-2">{repair.service}</span>
                      {isTimeForSurvey ? (
                        <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-2" />
                      ) : isWithinWarranty ? (
                        <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-xs text-slate-500">{repair.deliveryDate}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isTimeForSurvey ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : isWithinWarranty ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                        Hace {daysElapsed} días
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {selectedRepair ? (
            renderRepairDetails()
          ) : (
            <div className="lg:col-span-8 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 min-h-[400px]">
              <HistoryIcon className="w-12 h-12 mb-4 opacity-20" />
              <p>Selecciona una reparación del listado para ver sus detalles</p>
            </div>
          )}

        </motion.div>
      )}

      {surveyRepair && (
        <ServiceSurveyModal
          repairService={surveyRepair.service}
          onClose={() => setSurveyRepair(null)}
          onSubmit={(stars, comment) => {
            handleSurveySubmit('perfect');
            setSurveyRepair(null);
            toast.success(`Evaluación de ${stars} estrellas enviada. ¡Gracias!`);
          }}
        />
      )}
    </div>
  );
}
