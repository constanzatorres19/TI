import { useState } from "react";
import { useForm } from "react-hook-form";
import { Calendar as CalendarIcon, Clock, Car as CarIcon, CheckCircle2, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "motion/react";
import { mockAppointments } from "../store";
import { Appointment } from "../types";
import { Link } from "react-router";

type BookingData = {
  name: string;
  phone: string;
  plate: string;
  brand: string;
  model: string;
  service: string;
};

const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

export function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState("");

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<BookingData | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<BookingData>();

  // Find slots that are already confirmed to disable them
  const formattedSelectedDate = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const confirmedSlots = mockAppointments
    .filter(a => a.date === formattedSelectedDate && a.status === "confirmed")
    .map(a => a.time);

  const onSubmit = (data: BookingData) => {
    if (!selectedDate || !selectedTime) {
      toast.error("Por favor selecciona una fecha y un horario disponible.");
      return;
    }

    if (!isAuthenticated) {
      setPendingBookingData(data);
      setShowAuthModal(true);
      return;
    }
    
    finishBooking(data);
  };

  const finishBooking = (data: BookingData) => {
    // Simulate API call and save to global mock store
    setTimeout(() => {
      const newId = `R-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const newAppointment: Appointment = {
        id: newId,
        customerName: data.name,
        phone: data.phone,
        plate: data.plate.toUpperCase(),
        brand: data.brand,
        model: data.model,
        service: data.service,
        date: formattedSelectedDate,
        time: selectedTime,
        status: "pending" // Needs mechanic confirmation!
      };
      
      mockAppointments.push(newAppointment);

      setBookingId(newId);
      setIsSuccess(true);
      toast.success("Hora agendada con éxito");
    }, 1000);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
    setShowAuthModal(false);
    toast.success(authTab === "login" ? "Sesión iniciada correctamente" : "Cuenta creada exitosamente");
    
    if (pendingBookingData) {
      finishBooking(pendingBookingData);
    }
  };

  const handlePhoneInput = (e: React.FormEvent<HTMLInputElement>) => {
    // Only allow numbers and format dynamically as 9 1234 5678
    let val = e.currentTarget.value.replace(/\D/g, "");
    if (val.length > 9) val = val.slice(0, 9);
    
    if (val.length > 0 && val[0] !== "9") {
      val = "9" + val;
    }
    
    let formatted = val;
    if (val.length > 1) {
       formatted = val.slice(0,1) + " " + val.slice(1,5);
    }
    if (val.length > 5) {
       formatted = val.slice(0,1) + " " + val.slice(1,5) + " " + val.slice(5);
    }
    e.currentTarget.value = formatted;
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xl"
      >
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Solicitud Recibida</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-2 text-lg">
          Has solicitado una cita para el {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} a las {selectedTime} hrs.
        </p>
        <p className="text-amber-600 dark:text-amber-400 mb-8 font-medium">
          Importante: Tu hora debe ser confirmada por el mecánico. Ingresa tu patente en el Gemelo Digital para revisar si fue aceptada.
        </p>
        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 mb-8 inline-block">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Código de seguimiento:</p>
          <p className="text-2xl font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400">{bookingId}</p>
          <p className="text-xs text-slate-500 mt-3">También puedes consultar el estado solo usando tu patente.</p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/"
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium py-3 px-8 rounded-xl transition-colors"
          >
            Volver al inicio
          </Link>
          <Link 
            to="/estado"
            className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium py-3 px-8 rounded-xl transition-colors"
          >
            Ir al Gemelo Digital
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Agenda tu visita</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Reserva un espacio en nuestro taller. Rápido, fácil y sin esperas.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Date and Time Column */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
              <CalendarIcon className="w-5 h-5 text-blue-500" />
              Selecciona el día
            </h3>
            <div className="flex justify-center custom-calendar">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(""); // Reset time when date changes
                }}
                locale={es}
                disabled={{ before: new Date() }}
                className="mx-auto"
                classNames={{
                  day_selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white",
                  day_today: "font-bold text-blue-600 dark:text-blue-400",
                }}
              />
            </div>
            {!selectedDate && (
              <p className="text-red-500 text-xs text-center mt-2">Debes seleccionar una fecha</p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold mb-6">
              <Clock className="w-5 h-5 text-blue-500" />
              Horario disponible
            </h3>
            {!selectedDate ? (
              <p className="text-center text-slate-500 text-sm py-4">
                Selecciona un día para ver los horarios
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {TIME_SLOTS.map((time) => {
                  const isConfirmed = confirmedSlots.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled={isConfirmed}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2 px-1 text-sm font-medium rounded-xl border transition-all ${
                        isConfirmed
                          ? "bg-slate-100 border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-600 cursor-not-allowed opacity-50"
                          : selectedTime === time 
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20" 
                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedDate && !selectedTime && (
              <p className="text-red-500 text-xs text-center mt-4">Debes seleccionar una hora</p>
            )}
          </div>
        </div>

        {/* Customer & Vehicle Details */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <CarIcon className="w-5 h-5 text-blue-500" />
            Datos del Vehículo y Contacto
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre completo</label>
              <input 
                {...register("name", { required: "El nombre es obligatorio" })}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} 
                placeholder="Juan Pérez"
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Teléfono</label>
              <input 
                {...register("phone", { 
                  required: "El teléfono es obligatorio",
                  pattern: {
                    value: /^9 \d{4} \d{4}$/,
                    message: "El formato debe ser 9 1234 5678"
                  }
                })}
                onInput={handlePhoneInput}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} 
                placeholder="9 1234 5678"
              />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Patente</label>
              <input 
                {...register("plate", { required: "La patente es obligatoria" })}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${errors.plate ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} 
                placeholder="ABCD-12"
              />
              {errors.plate && <p className="text-red-500 text-xs">{errors.plate.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Marca y Modelo</label>
              <input 
                {...register("brand", { required: "La marca/modelo es obligatoria" })}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.brand ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`} 
                placeholder="Toyota Yaris"
              />
              {errors.brand && <p className="text-red-500 text-xs">{errors.brand.message}</p>}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Motivo o Servicio Requerido</label>
              <select 
                {...register("service", { required: "Selecciona un servicio" })}
                className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${errors.service ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'}`}
              >
                <option value="">Selecciona un servicio...</option>
                <option value="Mantención por Kilometraje">Mantención por Kilometraje</option>
                <option value="Revisión de Frenos">Revisión de Frenos</option>
                <option value="Problemas de Motor">Problemas de Motor</option>
                <option value="Suspensión y Dirección">Suspensión y Dirección</option>
                <option value="Diagnóstico Eléctrico">Diagnóstico Eléctrico</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.service && <p className="text-red-500 text-xs">{errors.service.message}</p>}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Agendar Visita
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold">Autenticación Requerida</h2>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                Para confirmar tu hora de las {selectedTime} hrs, por favor inicia sesión o crea una cuenta rápida.
              </p>

              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 mb-6">
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${authTab === "login" ? "bg-white dark:bg-slate-950 shadow text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  onClick={() => setAuthTab("login")}
                >
                  Iniciar Sesión
                </button>
                <button 
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${authTab === "register" ? "bg-white dark:bg-slate-950 shadow text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  onClick={() => setAuthTab("register")}
                >
                  Crear Cuenta
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authTab === "register" && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Nombre completo</label>
                    <input required type="text" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Tu nombre" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Correo electrónico</label>
                  <input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="correo@ejemplo.com" />
                </div>
                {authTab === "register" && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Teléfono (Opcional)</label>
                    <input type="tel" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="+56 9 1234 5678" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Contraseña</label>
                  <input required type="password" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="••••••••" />
                </div>
                
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors mt-2">
                  {authTab === "login" ? "Ingresar y Confirmar Hora" : "Registrarse y Confirmar Hora"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Calendar overrides specifically to look nice on dark mode */}
      <style>{`
        .custom-calendar .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #2563eb;
          --rdp-background-color: rgba(37, 99, 235, 0.1);
        }
        .dark .custom-calendar .rdp {
          --rdp-accent-color: #3b82f6;
          --rdp-background-color: rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
