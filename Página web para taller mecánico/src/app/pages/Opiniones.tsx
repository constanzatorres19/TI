import { useState } from "react";
import { Star, Send, User } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { mockOpinions } from "../store";
import { useAuth } from "../context/AuthContext";

export function Opiniones() {
  const { isAuthenticated, userEmail } = useAuth();
  
  // Estado para obligar a recargar la lista cuando agregamos uno nuevo
  const [opinionsList, setOpinionsList] = useState(mockOpinions);
  
  // Estados para el formulario
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación en estrellas.");
      return;
    }

    const newOpinion = {
      id: `OP-${Date.now()}`,
      authorName: isAuthenticated && userEmail ? userEmail.split('@')[0] : (authorName || "Cliente Anónimo"),
      rating: rating,
      comment: comment,
      date: new Date().toLocaleDateString("es-CL"), // Formato DD/MM/YYYY
    };

    // Guardar en la "base de datos"
    mockOpinions.unshift(newOpinion); // unshift para ponerlo al principio
    setOpinionsList([...mockOpinions]);

    // Limpiar formulario
    setRating(0);
    setComment("");
    setAuthorName("");
    toast.success("¡Gracias por compartir tu experiencia!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Opiniones de Clientes</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Conoce la experiencia de otros conductores o déjanos la tuya.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario para nueva opinión */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm sticky top-24">
            <h3 className="font-bold text-lg mb-4">Evalúa nuestro servicio</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Estrellas interactivas */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300 dark:text-slate-700"
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              {!isAuthenticated && (
                <div>
                  <label className="text-xs font-medium text-slate-500 block mb-1">Tu nombre</label>
                  <input 
                    type="text" 
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Ej. Carlos M." 
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Comentario</label>
                <textarea 
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="¿Cómo te fue con tu reparación?" 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                Publicar Opinión
              </button>
            </form>
          </div>
        </div>

        {/* Columna Derecha: Lista de opiniones */}
        <div className="lg:col-span-2 space-y-4">
          {opinionsList.map((op, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={op.id} 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{op.authorName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{op.date}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-4 h-4 ${star <= op.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-800"}`} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                "{op.comment}"
              </p>
            </motion.div>
          ))}
          
          {opinionsList.length === 0 && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Star className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500">Aún no hay opiniones. ¡Sé el primero en calificar!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}