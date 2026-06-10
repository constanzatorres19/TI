import { Link } from "react-router";
import { ArrowRight, CheckCircle2, Calendar, Search, Star } from "lucide-react";
import { motion } from "motion/react";

export function Home() {
  return (
    <div className="flex flex-col gap-16 pb-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1676018366904-c083ed678e60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhdXRvJTIwbWVjaGFuaWMlMjBzaG9wfGVufDF8fHx8MTc3OTkyMTA1OHww&ixlib=rb-4.1.0&q=80&w=1080" 
            alt="Taller moderno" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        
        <div className="relative z-10 px-8 py-24 sm:px-16 sm:py-32 lg:px-24 max-w-3xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
          >
            Tu auto en las <span className="text-blue-400">mejores manos</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-lg sm:text-xl text-slate-300 max-w-xl leading-relaxed"
          >
            Agenda tu hora online y sigue el estado de la reparación en tiempo real mediante nuestro exclusivo Gemelo Digital.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Link 
              to="/agendar" 
              className="inline-flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/30"
            >
              <Calendar className="w-5 h-5" />
              Agendar Hora
            </Link>
            <Link 
              to="/estado" 
              className="inline-flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
            >
              <Search className="w-5 h-5" />
              Ver Estado
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6">Transparencia Total</h2>
          <div className="space-y-6">
            {[
              { title: "Agenda Virtual 24/7", desc: "Reserva tu atención en segundos desde cualquier dispositivo, eligiendo el servicio que necesitas." },
              { title: "Gemelo Digital", desc: "Visualiza exactamente qué parte de tu auto está siendo intervenida a través de una representación 3D de tu vehículo." },
              { title: "Mecánica Especializada", desc: "Expertos en mantenimiento preventivo, motor, frenos y diagnóstico electrónico." }
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0 mt-1 bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
          <img 
            src="https://images.unsplash.com/photo-1625047509248-ec889cbff17f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBlbmdpbmUlMjByZXBhaXIlMjBjbGVhbnxlbnwxfHx8fDE3Nzk5MjEwNjF8MA&ixlib=rb-4.1.0&q=80&w=1080" 
            alt="Mecánico trabajando"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-16 px-8 rounded-3xl border border-slate-100 dark:border-slate-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Experiencias de nuestros clientes</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Lo que opinan quienes ya han probado nuestro servicio de Post-Venta.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Juan Pérez", comment: "Excelente atención, mis frenos quedaron perfectos sin problemas. El gemelo digital es una maravilla." },
            { name: "María González", comment: "Muy profesionales. Me cambiaron el aceite y me fueron mandando fotos del antes y el después." },
            { name: "Roberto Muñoz", comment: "Gran experiencia. Tuve un detalle después de los 15 días y me agendaron una revisión prioritaria al instante." }
          ].map((review, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 italic mb-6">"{review.comment}"</p>
              <p className="font-semibold text-slate-900 dark:text-white">— {review.name}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
