import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import { jwtDecode } from "jwt-decode";
import log from "loglevel";
import { io, Socket } from "socket.io-client";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

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
  isLoggingOut: boolean;
  socket: Socket | null;
  login: (dni: string, password: string) => Promise<void>;
  logout: (showSpinner?: boolean) => Promise<void>;
  refreshSidebar: () => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [lastAlertTime, setLastAlertTime] = useState<number>(0);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateSidebarData = async (userId: number, token: string) => {
    try {
      console.log(`AuthContext - Actualizando sidebar para userId: ${userId}`);
      const response = await fetch(`${API_URL}/sidebar/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`AuthContext - Respuesta de sidebar: Status=${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log("AuthContext - Sidebar data recibido:", JSON.stringify(data));
        localStorage.setItem("sidebarData", JSON.stringify(data));
        setSidebarData(data);
        setUserPermissions(data);
        return data;
      } else {
        console.error(
          `AuthContext - Error al obtener sidebar: Status=${response.status}, ${response.statusText}`
        );
        setSidebarData([]);
        setUserPermissions([]);
        localStorage.removeItem("sidebarData");
        return [];
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(`AuthContext - Error al obtener sidebar: ${errorMessage}`);
      setSidebarData([]);
      setUserPermissions([]);
      localStorage.removeItem("sidebarData");
      return [];
    }
  };

  const refreshSidebar = async () => {
    const token = localStorage.getItem("token");
    if (userId && token) {
      console.log("AuthContext - Refrescando sidebar");
      await updateSidebarData(userId, token);
    } else {
      console.warn(
        `AuthContext - No se puede refrescar sidebar: userId=${userId}, token=${
          token ? "presente" : "ausente"
        }`
      );
    }
  };

  const validateSession = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("AuthContext - No hay token, cerrando sesión silenciosamente");
      await logout(false);
      return false;
    }

    try {
      console.log("AuthContext - Validando sesión con el backend");
      const response = await fetch(`${API_URL}/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(
        `AuthContext - Respuesta de validateSession: Status=${response.status}, ${response.statusText}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true);
        const savedName = localStorage.getItem("userName");
        const savedRoles = JSON.parse(localStorage.getItem("roles") || "[]");

        setUserName(data.userName || savedName || "");
        setRoles(data.roles || savedRoles);
        setUserId(data.id);

        const savedSidebarData = localStorage.getItem("sidebarData");
        let permissionsLoaded = false;
        if (savedSidebarData) {
          try {
            const parsedData = JSON.parse(savedSidebarData);
            if (Array.isArray(parsedData)) {
              setSidebarData(parsedData);
              setUserPermissions(parsedData);
              permissionsLoaded = parsedData.length > 0;
            }
          } catch (error) {
            console.error("AuthContext - Error al parsear sidebarData de localStorage:", error);
          }
        }

        if (!permissionsLoaded && data.id) {
          const sidebarData = await updateSidebarData(data.id, token);
          permissionsLoaded = sidebarData.length > 0;
        }

        if (!permissionsLoaded) {
          console.warn(
            "AuthContext - No se cargaron permisos, pero se mantiene la sesión activa"
          );
        }
        console.log("AuthContext - Sesión validada correctamente");
        return true;
      }
      console.error(
        `AuthContext - Falló la validación de sesión: ${response.status}, ${response.statusText}`
      );
      if (!isRefreshing) {
        console.log("AuthContext - Sesión inválida, cerrando sesión silenciosamente");
        await logout(false);
      }
      return false;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(`AuthContext - Error al validar sesión: ${errorMessage}`);
      if (!isRefreshing) {
        console.log("AuthContext - Error de sesión, cerrando sesión silenciosamente");
        await logout(false);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (showError: boolean = false) => {
    if (isRefreshing) {
      console.log("AuthContext - Renovación en curso, omitiendo");
      return false;
    }

    setIsRefreshing(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("AuthContext - No hay token para renovar, cerrando sesión silenciosamente");
      await logout(false);
      setIsRefreshing(false);
      return false;
    }

    try {
      console.log("AuthContext - Intentando renovar token");
      const response = await fetch(`${API_URL}/refresh-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        `AuthContext - Respuesta de refresh-token: Status=${response.status}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "AuthContext - Token renovado correctamente:",
          JSON.stringify(data)
        );

        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.userName);
        localStorage.setItem("roles", JSON.stringify(data.roles || []));
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("personaId", String(data.user.personaId || ""));

        setIsAuthenticated(true);
        setUserName(data.userName);
        setRoles(data.roles || []);
        setUserId(data.user.id);

        if (socketRef.current) {
          socketRef.current.disconnect();
          console.log("AuthContext - Socket desconectado antes de la reconexión");
          await new Promise((resolve) => setTimeout(resolve, 500));
          socketRef.current.auth = { token: `Bearer ${data.token}` };
          socketRef.current.connect();
          console.log("AuthContext - Socket re-autenticado con nuevo token");
        }

        const sidebarData = await updateSidebarData(data.user.id, data.token);
        if (sidebarData.length === 0) {
          console.warn(
            "AuthContext - No se cargaron permisos tras renovar, pero se mantiene la sesión activa"
          );
        }

        console.log("AuthContext - Renovación de token completada");
        return true;
      }
      const errorData = await response.json();
      if (
        response.status === 401 &&
        errorData.message ===
          "Sesión inválida. Por favor, inicia sesión nuevamente."
      ) {
        console.log(
          "AuthContext - Sesión invalidada por mismatch en contador, cerrando..."
        );
        await logout(false);
        return false;
      }
      console.error(
        `AuthContext - Error al renovar token: Status=${response.status}, ${response.statusText}`
      );
      console.log("AuthContext - Falló la renovación, cerrando sesión...");
      await logout(false);
      return false;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(`AuthContext - Error al renovar token: ${errorMessage}`);
      console.log("AuthContext - Error al renovar, cerrando sesión...");
      await logout(false);
      return false;
    } finally {
      setIsRefreshing(false);
      setIsAlertShown(false);
      setLastAlertTime(Date.now());
    }
  };

  const logout = async (showSpinner: boolean = true) => {
    console.log("AuthContext - Cerrando sesión");
    setIsAlertShown(false);
    setLastAlertTime(0);
    setIsRefreshing(false);

    Swal.close();

    if (showSpinner) {
      setIsLoggingOut(true);
    }

    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded: { exp: number } = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        if (decoded.exp > currentTime) {
          console.log("AuthContext - Enviando solicitud de logout al backend");
          const response = await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            console.log("AuthContext - Sesión cerrada en el backend");
          } else {
            console.error(
              `AuthContext - Error al cerrar sesión en el backend: Status=${response.status}, ${response.statusText}`
            );
          }
        } else {
          console.log("AuthContext - Token expirado, ignorando solicitud de logout");
        }
      } catch (error: any) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        console.error(
          `AuthContext - Error al cerrar sesión en el backend: ${errorMessage}`
        );
      }
    } else {
      console.log("AuthContext - Sin token, ignorando solicitud");
    }

    if (socketRef.current) {
      console.log("AuthContext - Desconectando socket");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    localStorage.clear();
    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRoles([]);
    setUserPermissions([]);
    setSidebarData([]);
    setIsLoading(false);
    setIsLoggingOut(false);

    // CAMBIO: Agregar un pequeño retraso para asegurar que la UI se actualice antes de redirigir
    console.log("AuthContext - Redirigiendo a /login");
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 100);
  };

  const initializeSocket = () => {
    const token = localStorage.getItem("token");
    const personaId = localStorage.getItem("personaId");
    if (!userId || !token || !personaId) {
      console.log(
        `AuthContext - No se puede inicializar Socket.IO: userId=${userId}, token=${
          token ? "presente" : "ausente"
        }, personaId=${personaId}`
      );
      return;
    }

    if (socketRef.current) {
      console.log("AuthContext - Socket ya existe, desconectando socket anterior");
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    console.log(
      `AuthContext - Inicializando Socket.IO para userId: ${userId}, personaId: ${personaId}`
    );
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
      // CAMBIO: Corregir sintaxis del template literal
      auth: { token: `Bearer ${token}` },
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    socketRef.current.on("connect", () => {
      console.log(
        `AuthContext - Conectado a Socket.IO, ID: ${socketRef.current?.id}`
      );
      const room = `user_${personaId}`;
      console.log(`AuthContext - Solicitando unirse a la sala: ${room}`);
      socketRef.current?.emit("joinRoom", room);
    });

    socketRef.current.on("joinedRoom", ({ room }) => {
      console.log(`AuthContext - Unido a la sala: ${room}`);
      socketRef.current?.emit("getRooms", (rooms: string[]) => {
        // CAMBIO: Corregir log para usar la variable rooms recibida
        console.log(
          `AuthContext - Salas actuales del cliente: ${rooms.join(", ")}`
        );
      });
    });

    socketRef.current.on("connect_error", async (error: Error) => {
      console.error(
        `AuthContext - Error de conexión Socket.IO: ${error.message}`
      );
      if (error.message.includes("jwt") || error.message.includes("auth")) {
        console.log("AuthContext - Token inválido, cerrando sesión silenciosamente");
        Swal.close();
        await logout(false);
      }
    });

    // CAMBIO: Nuevo manejador para sessionInvalidated sin reintentos
    socketRef.current.on("sessionInvalidated", async (data) => {
      console.log(
        `AuthContext - Sesión invalidada recibida: ${JSON.stringify(data)}`
      );
      // Cerrar cualquier modal activo
      Swal.close();

      // Mostrar mensaje al usuario con la razón del cierre de sesión
      await Swal.fire({
        title: "Sesión cerrada",
        text: data.message || "Tu sesión ha sido cerrada. Por favor, inicia sesión nuevamente.",
        icon: "warning",
        confirmButtonText: "Aceptar",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      // Ejecutar logout inmediatamente sin reintentos
      console.log("AuthContext - Cerrando sesión tras invalidación");
      await logout(true); // Usar showSpinner: true para mostrar el spinner de carga
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log(
        `AuthContext - Desconectado de Socket.IO, motivo: ${reason}`
      );
      console.log(
        `AuthContext - Estado del socket: ${
          socketRef.current?.connected ? "conectado" : "desconectado"
        }`
      );
    });
  };

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let sessionCheckInterval: NodeJS.Timeout | null = null;

    if (userId && isAuthenticated) {
      initializeSocket();

      heartbeatInterval = setInterval(() => {
        if (socketRef.current?.connected) {
          console.log("AuthContext - Enviando heartbeat");
          socketRef.current.emit(
            "heartbeat",
            (response: { valid: boolean; message?: string }) => {
              console.log(
                `AuthContext - Respuesta de heartbeat: ${JSON.stringify(response)}`
              );
              if (!response.valid) {
                console.log("AuthContext - Heartbeat inválido, cerrando sesión silenciosamente");
                if (socketRef.current) {
                  socketRef.current.disconnect();
                  socketRef.current = null;
                }
                logout(false);
              }
            }
          );
        } else {
          console.log("AuthContext - Socket no conectado, intentando reconectar");
          initializeSocket();
        }
      }, 10000);

      sessionCheckInterval = setInterval(async () => {
        if (!socketRef.current?.connected && isAuthenticated) {
          console.log("AuthContext - Socket no conectado, validando sesión");
          const isValid = await validateSession();
          if (!isValid) {
            console.log("AuthContext - Sesión inválida, cerrando sesión silenciosamente");
            await logout(false);
          }
        }
      }, 10000);
    }

    return () => {
      console.log("AuthContext - Limpiando Socket.IO");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (sessionCheckInterval) clearInterval(sessionCheckInterval);
    };
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (location.pathname === "/login" || !isAuthenticated) {
      console.log(
        "AuthContext - En página de login o no autenticado, omitiendo verificación de token"
      );
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const checkTokenExpiration = async () => {
      const token = localStorage.getItem("token");
      if (!token || !isAuthenticated) {
        console.log("AuthContext - No hay token o no autenticado, cerrando sesión");
        await logout(false);
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
            `AuthContext - Tiempos de token inválidos: exp=${decoded.exp}, iat=${decoded.iat}, currentTime=${currentTime}`
          );
          await logout(false);
          return;
        }

        console.log(
          `AuthContext - Estado del token: Start time=${new Date(
            tokenStartTime * 1000
          ).toISOString()} (${formatTime(
            tokenDuration
          )}), Expiration=${new Date(
            decoded.exp * 1000
          ).toISOString()}, Current time=${new Date(
            currentTime * 1000
          ).toISOString()}, Time left=${formatTime(timeLeft)}`
        );

        if (decoded.exp < currentTime) {
          console.log("AuthContext - Token expirado, cerrando sesión");
          await logout(true);
          return;
        }

        if (isAlertShown) {
          console.log("AuthContext - Modal de expiración activo, omitiendo verificación");
          return;
        }

        if (timeLeft <= 60 && timeLeft > 0 && !isRefreshing) {
          console.log("AuthContext - Mostrando alerta de expiración de token");
          setIsAlertShown(true);
          setLastAlertTime(Date.now());

          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = null;

          // Reiniciar SweetAlert2 para evitar residuos
          Swal.close();
          await new Promise((resolve) => setTimeout(resolve, 100)); // Pequeña espera para asegurar limpieza

          Swal.fire({
            title: "Sesión a punto de expirar",
            text: `Tu sesión expirará en ${formatTime(timeLeft)}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Renovar",
            cancelButtonText: "Cerrar sesión",
            timer: timeLeft * 1000,
            timerProgressBar: false,
            allowOutsideClick: false,
            didOpen: () => {
              const updateTimer = () => {
                const currentTime = Date.now() / 1000;
                const remainingTime = decoded.exp - currentTime;
                if (remainingTime > 0 && Swal.isVisible()) {
                  const timerText = document.querySelector(".swal2-html-container");
                  if (timerText) {
                    timerText.textContent = `Tu sesión expirará en ${formatTime(remainingTime)}.`;
                  }
                } else {
                  clearInterval(timerInterval);
                }
              };
              const timerInterval = setInterval(updateTimer, 1000);
              Swal.getPopup()?.addEventListener("close", () => {
                clearInterval(timerInterval);
                Swal.close(); // Asegurar que el modal se cierre completamente
              });
            },
            willClose: () => {
              // Limpiar explícitamente el estado del modal
              setIsAlertShown(false);
              setLastAlertTime(Date.now());
            },
          }).then(async (result) => {
            setIsAlertShown(false);
            setLastAlertTime(Date.now());

            if (result.isConfirmed) {
              console.log("AuthContext - Usuario eligió renovar el token");
              const success = await refreshToken(false);
              if (!success) {
                console.log(
                  "AuthContext - Falló la renovación automática, cerrando sesión"
                );
                await logout(true);
              }
            } else {
              console.log("AuthContext - Usuario eligió cerrar sesión o la alerta fue cerrada");
              await logout(true);
            }

            // Reiniciar el intervalo de verificación
            if (isAuthenticated && !intervalRef.current) {
              intervalRef.current = setInterval(checkTokenExpiration, 5000);
            }
          });

          return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
          console.log("AuthContext - Timeout de token, cerrando sesión");
          await logout(true);
        }, timeLeft * 1000);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        console.error(
          `AuthContext - Error al decodificar token: ${errorMessage}`
        );
        await logout(false);
      }
    };

    checkTokenExpiration();
    intervalRef.current = setInterval(checkTokenExpiration, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      Swal.close();
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated && !isLoading && location.pathname !== "/login") {
      console.log(
        "AuthContext - isAuthenticated es false, redirigiendo a login"
      );
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  useEffect(() => {
    let isMounted = true;

    const checkSessionAndRedirect = async () => {
      if (!isMounted) return;

      console.log("AuthContext - Verificando sesión para ruta:", location.pathname);

      if (location.pathname === "/login" && !localStorage.getItem("token")) {
        console.log("AuthContext - En /login sin token, omitiendo validación");
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (token && location.pathname === "/login") {
        try {
          const decoded: { exp: number } = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          if (decoded.exp > currentTime) {
            console.log(
              "AuthContext - Token local válido detectado en /login, redirigiendo a dashboard"
            );
            navigate("/dashboard", { replace: true });
            return;
          }
        } catch (error) {
          console.error("AuthContext - Error al decodificar token localmente:", error);
        }
      }

      const isValid = await validateSession();
      if (isValid && location.pathname === "/login") {
        console.log(
          "AuthContext - Sesión activa detectada en /login, redirigiendo a dashboard"
        );
        navigate("/dashboard", { replace: true });
      } else if (!isValid && location.pathname !== "/login") {
        console.log(
          "AuthContext - No hay sesión activa y no está en /login, redirigiendo a login"
        );
        navigate("/login", { replace: true });
      }
    };

    checkSessionAndRedirect();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, navigate]);

  const login = async (dni: string, password: string) => {
    try {
      console.log(`AuthContext - Intentando login con DNI: ${dni}`);
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(
          `AuthContext - Error al iniciar sesión: Status=${response.status}, Mensaje=${data.message}`
        );
        const error: CustomError = new Error(
          data.message || "Error al iniciar sesión"
        );
        error.status = response.status;
        error.code = data.code || "UNKNOWN_ERROR";
        error.data = data;
        throw error;
      }

      setIsLoading(true);
      setIsRefreshing(false);
      setIsAlertShown(false);
      setLastAlertTime(0);

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.userName);
      localStorage.setItem("roles", JSON.stringify(data.roles || []));
      localStorage.setItem("userId", String(data.user.id));
      localStorage.setItem("personaId", String(data.user.personaId || ""));
      localStorage.setItem("sexo", data.user?.sexo || "");
      localStorage.setItem("foto", data.user?.foto || "");

      setIsAuthenticated(true);
      setUserName(data.userName);
      setRoles(data.roles || []);
      setUserId(data.user.id);

      console.log(
        `AuthContext - Login exitoso: userId=${data.user.id}, userName=${data.userName}`
      );

      initializeSocket();

      try {
        const sidebarData = await updateSidebarData(data.user.id, data.token);
        setSidebarData(sidebarData);
        setUserPermissions(sidebarData);
        if (sidebarData.length === 0) {
          console.warn("AuthContext - No se cargaron permisos tras login, pero se mantiene la sesión");
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        log.error(`AuthContext - Error al cargar sidebar: ${errorMessage}`);
        setSidebarData([]);
        setUserPermissions([]);
        localStorage.setItem("sidebarData", JSON.stringify([]));
      }
    } catch (error: unknown) {
      let customError: CustomError;
      if (error instanceof Error) {
        customError = error as CustomError;
      } else {
        customError = new Error("Error desconocido al iniciar sesión");
        customError.status = undefined;
        customError.code = "UNKNOWN_ERROR";
        customError.data = undefined;
      }
      log.error(
        `AuthContext - Error al iniciar sesión: Mensaje=${
          customError.message
        }, Código=${customError.code || "N/A"}, Status=${
          customError.status || "N/A"
        }`
      );
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
        isLoggingOut,
        socket: socketRef.current,
        login,
        logout,
        refreshSidebar,
        validateSession,
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