import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: number | null;
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(localStorage.getItem("userName"));
  const [userId, setUserId] = useState<number | null>(
    localStorage.getItem("userId") ? Number(localStorage.getItem("userId")) : null
  );
  const [role, setRole] = useState<string | null>(localStorage.getItem("role"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setUserId(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setUserName(localStorage.getItem("userName"));
          setRole(localStorage.getItem("role"));
          setUserId(data.user.id);
          localStorage.setItem("userId", String(data.user.id));
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
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.userName);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userId", String(data.userId));

      setIsAuthenticated(true);
      setUserName(data.userName);
      setUserId(data.userId);
      setRole(data.role);
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");

    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userName, userId, role, isLoading, login, logout }}>
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
