import { useState } from "react";
import { Star, X } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

interface ServiceSurveyModalProps {
  onClose: () => void;
  onSubmit: (stars: number, comment: string) => void;
  repairService: string;
}

export function ServiceSurveyModal({ onClose, onSubmit, repairService }: ServiceSurveyModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }
    onSubmit(rating, comment);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">¡Tu vehículo está listo!</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Tu reparación "<span className="font-semibold text-slate-800 dark:text-slate-200">{repairService}</span>" ha sido completada.
              <br/>¿Cómo evaluarías nuestro servicio?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      (hoverRating || rating) >= star 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700'
                    }`} 
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                Cuéntanos tu experiencia (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="El servicio fue excelente..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
            >
              Enviar Evaluación
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
