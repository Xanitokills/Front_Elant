import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

interface Submenu {
  id: number;
  nombre: string;
  url: string;
  icono: string;
  orden: number;
  estado: number;
}

interface Menu {
  id: number;
  nombre: string;
  url: string | null;
  icono: string;
  orden: number;
  estado: number;
  submenus: Submenu[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: number | null;
  roles: string[];
  userPermissions: Menu[];
  sidebarData: Menu[];
  isLoading: boolean;
  login: (dni: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSidebar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<Menu[]>([]);
  const [sidebarData, setSidebarData] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const updateSidebarData = async (userId: number, token: string) => {
    try {
      const response = await fetch(`${API_URL}/sidebar/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("sidebarData", JSON.stringify(data));
        setSidebarData(data);
        setUserPermissions(data);
        console.log("AuthContext - Updated User Permissions:", data);
        return data;
      } else {
        console.error(
          "AuthContext - Error fetching sidebar data:",
          response.status
        );
        setSidebarData([]);
        setUserPermissions([]);
        localStorage.removeItem("sidebarData");
        return [];
      }
    } catch (error) {
      console.error("AuthContext - Error al obtener el menú:", error);
      setSidebarData([]);
      setUserPermissions([]);
      localStorage.removeItem("sidebarData");
      return [];
    }
  };

  const refreshSidebar = async () => {
    const token = localStorage.getItem("token");
    if (userId && token) {
      await updateSidebarData(userId, token);
    }
  };

  const validateSession = async () => {
    const token = localStorage.getItem("token");
    console.log("AuthContext - Validating session, token:", token ? "Present" : "Not present");
    if (!token) {
      console.log("AuthContext - No token, logging out");
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
        setIsAuthenticated(true);
        const savedName = localStorage.getItem("userName");
        const savedRoles = JSON.parse(localStorage.getItem("roles") || "[]");

        setUserName(data.userName || savedName || null);
        setRoles(data.roles || savedRoles || []);
        setUserId(data.user?.id);

        const savedSidebarData = localStorage.getItem("sidebarData");
        let permissionsLoaded = false;
        if (savedSidebarData) {
          const parsedData = JSON.parse(savedSidebarData);
          setSidebarData(parsedData);
          setUserPermissions(parsedData);
          console.log(
            "AuthContext - Loaded User Permissions from localStorage:",
            parsedData
          );
          permissionsLoaded = parsedData.length > 0;
        }

        if (!permissionsLoaded && data.user?.id) {
          const sidebarData = await updateSidebarData(data.user.id, token);
          permissionsLoaded = sidebarData.length > 0;
        }

        if (!permissionsLoaded) {
          console.warn("AuthContext - No permissions loaded, logging out");
          logout();
        }
      } else {
        console.error(
          "AuthContext - Session validation failed:",
          response.status
        );
        logout();
      }
    } catch (error) {
      console.error("AuthContext - Error validating session:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      console.log("AuthContext - Checking token expiration, token:", token ? "Present" : "Not present");
      if (token) {
        try {
          const decoded: { exp: number } = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          console.log("AuthContext - Token decoded, exp:", decoded.exp, "currentTime:", currentTime);
          if (decoded.exp < currentTime + 10) {
            console.log("AuthContext - Token expired or too close to expiry, logging out");
            logout();
            return;
          }
          const timeLeft = decoded.exp - currentTime;
          console.log("AuthContext - Time left for token (seconds):", timeLeft);
          if (timeLeft <= 120 && timeLeft > 0) {
            console.log("AuthContext - Showing token expiration warning");
            Swal.fire({
              icon: "warning",
              title: "Sesión a punto de expirar",
              text: "Tu sesión expirará en menos de 2 minutos. ¿Quieres renovarla?",
              showCancelButton: true,
              confirmButtonText: "Renovar",
              cancelButtonText: "Cerrar sesión",
              timer: 120000,
              timerProgressBar: true,
              didOpen: () => {
                const button = Swal.getConfirmButton();
                if (button) button.focus();
              },
            }).then(async (result) => {
              if (result.isConfirmed) {
                console.log("AuthContext - User clicked 'Renovar', sending request to /refresh-token");
                try {
                  setIsLoading(true);
                  const response = await fetch(`${API_URL}/refresh-token`, {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${token}`,
                      "Content-Type": "application/json",
                    },
                  });
                  console.log("AuthContext - /refresh-token response status:", response.status);
                  const responseText = await response.text();
                  console.log("AuthContext - /refresh-token response body:", responseText);

                  if (response.ok) {
                    const data = JSON.parse(responseText);
                    console.log("AuthContext - New token received:", data.token);
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userName", data.userName);
                    localStorage.setItem("roles", JSON.stringify(data.roles || []));
                    localStorage.setItem("userId", String(data.user.id));
                    localStorage.setItem("personaId", String(data.user.personaId || ""));
                    localStorage.setItem("sexo", data.user.sexo || "Masculino");
                    localStorage.setItem("sidebarData", JSON.stringify(data.permissions || []));

                    setIsAuthenticated(true);
                    setUserName(data.userName);
                    setRoles(data.roles || []);
                    setUserId(data.user.id);
                    setUserPermissions(data.permissions || []);
                    setSidebarData(data.permissions || []);

                    console.log("AuthContext - Token renewed successfully, state updated");
                    // Forzar validación de la sesión con el nuevo token
                    await validateSession();
                  } else {
                    console.error("AuthContext - Failed to renew token, status:", response.status, "body:", responseText);
                    Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: "No se pudo renovar la sesión. Por favor, inicia sesión nuevamente.",
                    });
                    logout();
                  }
                } catch (error) {
                  console.error("AuthContext - Error during token refresh:", error);
                  Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "No se pudo renovar la sesión. Por favor, inicia sesión nuevamente.",
                  });
                  logout();
                } finally {
                  setIsLoading(false);
                }
              } else {
                console.log("AuthContext - User clicked 'Cerrar sesión' or dismissed");
                logout();
              }
            });
          }
        } catch (error) {
          console.error("AuthContext - Error decoding token:", error);
          logout();
        }
      }
    };

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 60000);
    return () => clearInterval(interval);
  }, []); // Cambiado de [userId] a []

  useEffect(() => {
    validateSession();
  }, []);

  const login = async (dni: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = "Error al iniciar sesión";
        if (response.status === 401) {
          errorMessage = errorData.message || "DNI o contraseña incorrectos";
        } else if (response.status === 500) {
          errorMessage = "Error del servidor, por favor intenta de nuevo";
        }
        throw new Error(errorMessage);
      }

      setIsLoading(true);

      const data = await response.json();

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.userName);
      localStorage.setItem("roles", JSON.stringify(data.roles || []));
      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("personaId", String(data.user.personaId || ""));
      localStorage.setItem("sexo", data.user.sexo || "Masculino");
      localStorage.setItem("foto", data.user.foto || "");

      setIsAuthenticated(true);
      setUserName(data.userName);
      setRoles(data.roles || []);
      setUserId(data.user.id);

      const sidebarData = await updateSidebarData(data.user.id, data.token);
      if (sidebarData.length === 0) {
        console.warn(
          "AuthContext - No permissions loaded after login, logging out"
        );
        logout();
        throw new Error("No se pudieron cargar los permisos del usuario");
      }
    } catch (error) {
      console.error("AuthContext - Error al iniciar sesión:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log("AuthContext - Logging out, clearing localStorage, isAuthenticated:", isAuthenticated);
    localStorage.clear();
    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRoles([]);
    setUserPermissions([]);
    setSidebarData([]);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userName,
        userId,
        roles,
        userPermissions,
        sidebarData,
        isLoading,
        login,
        logout,
        refreshSidebar,
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