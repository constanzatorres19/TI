import React, { createContext, useContext, useState } from "react";

// 1. Reemplazas la interfaz por esta:
interface AuthContextType {
  isAuthenticated: boolean;
  userEmail: string | null; 
  login: (email: string) => void; 
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Reemplazas el Provider por este:
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const login = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email); 
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Este hook probablemente ya lo tenías, se queda igual:
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
