import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios"; // Importamos axios para la consulta del menú

const API_URL = import.meta.env.VITE_API_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: number | null;
  role: string | null;
  userPermissions: string[];
  sidebarData: any[]; // Datos del menú
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSidebar: () => Promise<void>; // Nueva función para refrescar el menú
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [sidebarData, setSidebarData] = useState<any[]>([]); // Estado para los datos del menú
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Función para obtener los datos del menú
  const fetchSidebarData = async (userId: number, token: string) => {
    try {
      const res = await axios.get(`${API_URL}/sidebar/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const menuObject = res.data[0];
      const menusData = menuObject[Object.keys(menuObject)[0]];
      const menus = typeof menusData === "string" ? JSON.parse(menusData) : menusData;
      // Guardar en localStorage
      localStorage.setItem("sidebarData", JSON.stringify(menus));
      setSidebarData(menus);
    } catch (error) {
      console.error("Error al obtener el menú:", error);
      setSidebarData([]);
      localStorage.removeItem("sidebarData");
    }
  };

  // Función para refrescar el menú (por ejemplo, cuando cambian los permisos)
  const refreshSidebar = async () => {
    const token = localStorage.getItem("token");
    if (userId && token) {
      await fetchSidebarData(userId, token);
    }
  };

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setUserId(null);
        setUserPermissions([]);
        setSidebarData([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/validate`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Datos de /validate:", data);
          setIsAuthenticated(true);
          const savedName = localStorage.getItem("userName");
          const savedRole = localStorage.getItem("role");
          setUserName(data.userName || savedName || null);
          setRole(data.role || savedRole || null);
          setUserId(data.user?.id);
          setUserPermissions(data.permissions || localStorage.getItem("permissions")?.split(",") || []);

          // Obtener los datos del menú si no están en localStorage
          const savedSidebarData = localStorage.getItem("sidebarData");
          if (savedSidebarData) {
            setSidebarData(JSON.parse(savedSidebarData));
          } else if (data.user?.id) {
            await fetchSidebarData(data.user.id, token);
          }
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
      localStorage.setItem("permissions", data.permissions?.join(",") || "");

      // Actualizar el estado
      setIsAuthenticated(true);
      setUserName(data.userName);
      setRole(data.role);
      setUserId(data.user.id);
      setUserPermissions(data.permissions || []);

      // Obtener los datos del menú después del login
      await fetchSidebarData(data.user.id, data.token);
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
    setSidebarData([]);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName,
        userId,
        role,
        userPermissions,
        sidebarData, // Añadimos los datos del menú
        isLoading,
        login,
        logout,
        refreshSidebar, // Añadimos la función para refrescar
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