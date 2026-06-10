import { Outlet, NavLink } from "react-router";
import { Wrench, Calendar, Car, PenTool, LogIn, LogOut, Star } from "lucide-react";
import { Toaster } from "sonner";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <NavLink to="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xl tracking-tight">
              <Wrench className="w-6 h-6 bg-[#46040400]" />
              <span className="hidden lg:inline">Ceballos Car Service</span>
              <span className="lg:hidden">CCS</span>
            </NavLink>
            <nav className="flex gap-4 sm:gap-6 items-center">
              <NavLink 
                to="/agendar" 
                className={({ isActive }) => 
                  `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
                }
              >
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Agendar Hora</span>
              </NavLink>
              <NavLink 
                to="/estado" 
                className={({ isActive }) => 
                  `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
                }
              >
                <Car className="w-4 h-4" />
                <span className="hidden sm:inline">Mis Vehículos</span>
              </NavLink>

                            <NavLink 
                to="/opiniones" 
                className={({ isActive }) => 
                  `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`
                }
              >
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Opiniones</span>
              </NavLink>
              
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2"></div>
              
              <NavLink 
                to="/mecanico" 
                className={({ isActive }) => 
                  `flex items-center gap-2 text-sm font-medium transition-colors ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400'}`
                }
              >
                <PenTool className="w-4 h-4" />
                <span className="hidden md:inline">Mecánico</span>
              </NavLink>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2"></div>
              
              {isAuthenticated ? (
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              ) : (
                <button 
                  onClick={login}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-slate-950 text-slate-400 py-8 text-center border-t border-slate-800 mt-auto">
        <p className="text-sm">© {new Date().getFullYear()} Ceballos Car Service. Todos los derechos reservados.</p>
      </footer>

      <Toaster position="top-right" richColors />
    </div>
  );
}
