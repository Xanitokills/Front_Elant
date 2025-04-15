import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: number | null;
  role: string | null;
  userPermissions: string[]; // Nuevo campo
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // Nuevo estado
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");
  
      if (!token) {
        setIsAuthenticated(false);
        setUserId(null);
        setUserPermissions([]);
        setIsLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`${API_URL}/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.ok) {
          const data = await response.json();
          console.log("Datos de /validate:", data); // Depurar
          setIsAuthenticated(true);
          const savedName = localStorage.getItem("userName");
          const savedRole = localStorage.getItem("role");
          setUserName(data.userName || savedName || null);
          setRole(data.role || savedRole || null);
          setUserId(data.user?.id);
          setUserPermissions(data.permissions || localStorage.getItem("permissions")?.split(",") || []);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Error validating session:", error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
  
    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales incorrectas o error en el servidor");
      }

      const data = await response.json();

      // Guardar en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.userName);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("permissions", data.permissions?.join(",") || ""); // Guardar permisos

      // Actualizar el estado
      setIsAuthenticated(true);
      setUserName(data.userName);
      setRole(data.role);
      setUserId(data.user.id);
      setUserPermissions(data.permissions || []);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRole(null);
    setUserPermissions([]);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName,
        userId,
        role,
        userPermissions, // Nuevo
        isLoading,
        login,
        logout,
      }}
    >
      {children}
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
