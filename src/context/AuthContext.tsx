import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  userName: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasValidatedSession = useRef(false);
  const justLoggedIn = useRef(false);
  const navigate = useNavigate();

  // Validar la sesión al montar el componente (sin usar /api/validate-session)
  useEffect(() => {
    if (hasValidatedSession.current) return;
    hasValidatedSession.current = true;

    const validateSession = async () => {
      console.log("Iniciando validación de sesión...");
      setIsLoading(true);
      const token = localStorage.getItem("token");
      console.log("Token encontrado en localStorage:", token);
      if (!token) {
        console.log("No hay token, estableciendo isAuthenticated en false");
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Si hay un token, asumir que el usuario está autenticado
      const role = localStorage.getItem("role");
      const name = localStorage.getItem("userName");
      if (role && name) {
        console.log("Token presente, estableciendo isAuthenticated en true");
        setIsAuthenticated(true);
        setUserRole(role);
        setUserName(name);
      } else {
        console.log("Faltan role o userName, limpiando localStorage");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("userName");
        setIsAuthenticated(false);
        setUserRole(null);
        setUserName(null);
      }

      console.log("Finalizando validación de sesión, estableciendo isLoading en false");
      setIsLoading(false);
    };

    validateSession();
  }, []);

  // Redirigir a /dashboard solo después del login
  useEffect(() => {
    if (isAuthenticated && !isLoading && justLoggedIn.current) {
      console.log("isAuthenticated cambió a true después del login, redirigiendo a /dashboard...");
      justLoggedIn.current = false; // Resetear la bandera para evitar redirecciones futuras
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const login = async (email: string, password: string) => {
    console.log("Iniciando login con email:", email);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Respuesta de /api/login:", response.status, data);

      if (response.ok) {
        console.log("Login exitoso, guardando datos en localStorage...");
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userName", data.userName);
        setIsAuthenticated(true);
        setUserRole(data.role);
        setUserName(data.userName);
        justLoggedIn.current = true; // Establecer la bandera para redirigir
      } else {
        console.log("Error en el login:", data.message);
        throw new Error(data.message || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error en el login:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("Cerrando sesión...");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    setIsAuthenticated(false);
    setUserRole(null);
    setUserName(null);
    justLoggedIn.current = false;
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userName, login, logout, isLoading }}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-white text-xl">Cargando...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};