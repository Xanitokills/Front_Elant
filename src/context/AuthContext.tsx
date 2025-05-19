import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import log from "loglevel";
import { io, Socket } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
const API_URL = import.meta.env.VITE_API_URL;

export interface CustomError extends Error {
  status?: number;
  data?: any;
  code?: string;
}
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

// Convierte segundos a formato minutos:segundos
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<Menu[]>([]);
  const [sidebarData, setSidebarData] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAlertShown, setIsAlertShown] = useState<boolean>(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const updateSidebarData = async (userId: number, token: string) => {
    try {
      console.log("AuthContext - Updating sidebar data for userId:", userId);
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
          response.status,
          response.statusText
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
    if (!token) {
      console.log("AuthContext - No token found, logging out");
      setIsAuthenticated(false);
      setUserId(null);
      setUserPermissions([]);
      setSidebarData([]);
      setIsLoading(false);
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("AuthContext - validateSession response:", {
        status: response.status,
        statusText: response.statusText,
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
          return false;
        }
        console.log("AuthContext - Session validated successfully");
        return true;
      } else {
        console.error(
          "AuthContext - Session validation failed:",
          response.status,
          response.statusText
        );
        if (!isRefreshing) {
          Swal.fire({
            icon: "error",
            title: "Sesión Invalidada",
            text: "Tu sesión ha sido invalidada. Por favor, inicia sesión nuevamente.",
            confirmButtonText: "Aceptar",
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            logout();
          });
        }
        return false;
      }
    } catch (error) {
      console.error("AuthContext - Error validating session:", error);
      if (!isRefreshing) {
        Swal.fire({
          icon: "error",
          title: "Error de Sesión",
          text: "Ocurrió un error al validar la sesión. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Aceptar",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          logout();
        });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (showError: boolean = true) => {
    if (isRefreshing) {
      console.log("AuthContext - Refresh already in progress, skipping");
      return false;
    }

    setIsRefreshing(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("AuthContext - No token found for refresh, logging out");
      logout();
      setIsRefreshing(false);
      return false;
    }

    try {
      console.log("AuthContext - Attempting to refresh token");
      const response = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        "AuthContext - /refresh-token response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log("AuthContext - Token refreshed successfully:", data);

        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.userName);
        localStorage.setItem("roles", JSON.stringify(data.roles || []));
        localStorage.setItem("userId", String(data.user.id));
        localStorage.setItem("personaId", String(data.user.personaId || ""));

        setIsAuthenticated(true);
        setUserName(data.userName);
        setRoles(data.roles || []);
        setUserId(data.user.id);

        const sidebarData = await updateSidebarData(data.user.id, data.token);
        if (sidebarData.length === 0) {
          console.warn(
            "AuthContext - No permissions loaded after refresh, logging out"
          );
          logout();
          setIsRefreshing(false);
          return false;
        }

        console.log("AuthContext - Token refresh completed successfully");
        return true;
      } else {
        const errorData = await response.json();
        if (
          response.status === 401 &&
          errorData.message ===
            "Sesión inválida. Por favor, inicia sesión nuevamente."
        ) {
          console.log(
            "AuthContext - Session invalidated due to counter mismatch"
          );
          if (showError) {
            Swal.fire({
              icon: "error",
              title: "Sesión Invalidada",
              text: "Tu sesión ha sido invalidada. Por favor, inicia sesión nuevamente.",
              confirmButtonText: "Aceptar",
              allowOutsideClick: false,
              allowEscapeKey: false,
            }).then(() => {
              logout();
            });
          } else {
            logout();
          }
          return false;
        }
        console.error(
          "AuthContext - Token refresh failed:",
          response.status,
          response.statusText
        );
        if (showError) {
          Swal.fire({
            icon: "error",
            title: "Error al renovar la sesión",
            text: "No se pudo renovar la sesión. Por favor, inicia sesión nuevamente.",
            confirmButtonText: "Aceptar",
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(() => {
            logout();
          });
        } else {
          console.log("AuthContext - Silent logout due to refresh failure");
          logout();
        }
        return false;
      }
    } catch (error) {
      console.error("AuthContext - Error refreshing token:", error);
      if (showError) {
        Swal.fire({
          icon: "error",
          title: "Error al renovar la sesión",
          text: "Ocurrió un error al intentar renovar la sesión. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Aceptar",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          logout();
        });
      } else {
        console.log("AuthContext - Silent logout due to refresh error");
        logout();
      }
      return false;
    } finally {
      setIsRefreshing(false);
      setIsAlertShown(false);
      setLastAlertTime(Date.now());
    }
  };

  const logout = () => {
    console.log("AuthContext - Logging out");
    setIsAlertShown(false);
    setLastAlertTime(0);
    localStorage.clear();
    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRoles([]);
    setUserPermissions([]);
    setSidebarData([]);
    setIsLoading(false);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    // Evitar mostrar notificación al cerrar sesión manualmente
    navigate("/login", { replace: true });
  };

  // Inicializar Socket.IO solo si hay un token válido y no estamos en /login
  useEffect(() => {
    if (location.pathname === "/login") {
      console.log("AuthContext - En página de login, omitiendo Socket.IO");
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.log("AuthContext - No token, skipping Socket.IO connection");
      return;
    }

    console.log("AuthContext - Initializing Socket.IO connection");
    const newSocket = io(API_URL, {
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("AuthContext - Conectado a Socket.IO, ID:", newSocket.id);
      // Emitir un evento para verificar la sala
      newSocket.emit("getRooms", (rooms: string[]) => {
        console.log("AuthContext - Salas del cliente:", rooms);
      });
    });

    newSocket.on("connect_error", (error) => {
      console.error(
        "AuthContext - Error de conexión Socket.IO:",
        error.message
      );
      if (error.message.includes("jwt") || error.message.includes("auth")) {
        console.log("AuthContext - Token inválido, cerrando sesión");
        logout();
      }
    });

    newSocket.on("sessionInvalidated", (data) => {
      console.log("AuthContext - Sesión invalidada recibida:", data);
      if (!isAlertShown) {
        setIsAlertShown(true);
        Swal.fire({
          icon: "warning",
          title: "Sesión Invalidada",
          text:
            data.message ||
            "Tu sesión ha sido invalidada. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Aceptar",
          allowOutsideClick: false,
          allowEscapeKey: false,
        }).then(() => {
          logout();
          setIsAlertShown(false);
        });
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("AuthContext - Desconectado de Socket.IO, motivo:", reason);
    });

    return () => {
      console.log("AuthContext - Limpiando Socket.IO");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [location.pathname]); // Dependencia en la ruta para reiniciar socket si cambiamos de página

  // Verificar token y manejar expiración
  useEffect(() => {
    if (location.pathname === "/login") {
      console.log(
        "AuthContext - En página de login, omitiendo verificación de token"
      );
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;

    const checkTokenExpiration = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("AuthContext - No token, logging out");
        logout();
        return;
      }

      try {
        const decoded: { exp: number; iat: number } = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        const tokenStartTime = decoded.iat;
        const tokenDuration = decoded.exp - decoded.iat;
        const timeLeft = decoded.exp - currentTime;

        if (decoded.exp < decoded.iat || timeLeft > 3600 || timeLeft < -3600) {
          console.error(
            "AuthContext - Invalid token times: exp=",
            decoded.exp,
            "iat=",
            decoded.iat,
            "currentTime=",
            currentTime
          );
          logout();
          return;
        }

        console.log(
          "AuthContext - Token status:",
          `Start time: ${new Date(
            tokenStartTime * 1000
          ).toISOString()} (${formatTime(tokenDuration)})`,
          `Expiration: ${new Date(decoded.exp * 1000).toISOString()}`,
          `Current time: ${new Date(currentTime * 1000).toISOString()}`,
          `Time left: ${formatTime(timeLeft)}`
        );

        if (decoded.exp < currentTime) {
          console.log("AuthContext - Token expired, logging out");
          logout();
          return;
        }

        const timeSinceLastAlert = (Date.now() - lastAlertTime) / 1000;
        if (
          timeLeft <= 60 &&
          timeLeft > 0 &&
          !isRefreshing &&
          !isAlertShown &&
          timeSinceLastAlert >= 60
        ) {
          console.log("AuthContext - Showing session expiration warning");
          setIsAlertShown(true);
          setLastAlertTime(Date.now());
          if (interval) clearInterval(interval);
          interval = null;

          const alertTimer = Math.max(timeLeft * 1000, 10000);
          if (timeout) clearTimeout(timeout);
          timeout = null;

          Swal.fire({
            icon: "warning",
            title: "Sesión a punto de expirar",
            text: `Tu sesión expira en menos de 1 minuto. ¿Deseas seguir conectado?`,
            showCancelButton: true,
            confirmButtonText: "Renovar",
            cancelButtonText: "Cerrar sesión",
            timer: alertTimer,
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
              const button = Swal.getConfirmButton();
              if (button) button.focus();
            },
          }).then(async (result) => {
            setIsAlertShown(false);
            if (!interval) {
              interval = setInterval(checkTokenExpiration, 5000);
            }

            if (result.isConfirmed) {
              console.log("AuthContext - User clicked 'Renovar'");
              const success = await refreshToken(true);
              if (!success) {
                console.log("AuthContext - Refresh failed, logging out");
                logout();
              }
            } else if (
              result.isDismissed &&
              result.dismiss === Swal.DismissReason.cancel
            ) {
              console.log("AuthContext - User clicked 'Cerrar sesión'");
              logout();
            } else if (
              result.isDismissed &&
              result.dismiss === Swal.DismissReason.timer
            ) {
              console.log("AuthContext - Session expiration warning timed out");
              const currentToken = localStorage.getItem("token");
              if (currentToken) {
                try {
                  const decoded: { exp: number } = jwtDecode(currentToken);
                  const currentTime = Date.now() / 1000;
                  if (decoded.exp <= currentTime) {
                    console.log(
                      "AuthContext - Token already expired, logging out silently"
                    );
                    logout();
                    return;
                  }
                } catch (error) {
                  console.error(
                    "AuthContext - Error decoding token during refresh check:",
                    error
                  );
                  logout();
                  return;
                }
              }
              const success = await refreshToken(false);
              if (!success) {
                console.log("AuthContext - Auto-refresh failed, logging out");
                logout();
              }
            }
          });

          return;
        }

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          console.log("AuthContext - Token timeout triggered, logging out");
          logout();
        }, timeLeft * 1000);
      } catch (error) {
        console.error("AuthContext - Error decoding token:", error);
        logout();
      }
    };

    checkTokenExpiration();
    interval = setInterval(checkTokenExpiration, 5000);

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isRefreshing, location.pathname]); // Añadir location.pathname para omitir en /login

  // Redirigir al login cuando isAuthenticated cambia a false, excepto en /login
  useEffect(() => {
    if (!isAuthenticated && !isLoading && location.pathname !== "/login") {
      console.log(
        "AuthContext - isAuthenticated is false, redirecting to login"
      );
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  // Validar sesión al montar el componente, excepto en /login
  useEffect(() => {
    if (location.pathname === "/login") {
      console.log(
        "AuthContext - En página de login, omitiendo validateSession"
      );
      setIsLoading(false);
      return;
    }
    validateSession();
  }, [location.pathname]);

  const login = async (dni: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const error: CustomError = new Error(
          data.message || "Error al iniciar sesión"
        );
        error.status = response.status;
        error.code = data.code || "UNKNOWN_ERROR";
        error.data = data;
        throw error;
      }

      setIsLoading(true);

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

      try {
        const sidebarData = await updateSidebarData(data.user.id, data.token);
        setSidebarData(sidebarData);
        setUserPermissions(sidebarData);
      } catch (err) {
        log.error("AuthContext - Error loading sidebar data:", err);
        setSidebarData([]);
        setUserPermissions([]);
        localStorage.setItem("sidebarData", JSON.stringify([]));
      }
    } catch (error: unknown) {
      const customError = error as CustomError;
      log.error("AuthContext - Error al iniciar sesión:", {
        message: customError.message,
        code: customError.code,
        status: customError.status,
      });
      throw customError;
    } finally {
      setIsLoading(false);
    }
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
