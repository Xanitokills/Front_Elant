// src/pages/Dashboard.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaBell,
  FaExclamationCircle,
  FaInfoCircle,
  FaCopy,
  FaFileDownload,
  FaEye,
  FaCalendarAlt,
  FaBuilding,
  FaFileAlt,
  FaArrowUp,
  FaBox,
  FaMoneyBillWave,
  FaTools,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { Link, Element } from "react-scroll";
import io from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL;
const LOGO_PATH = "/LogoSoftHome/Logo_SoftHome_1.png";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

const COLOR_DARK_GRAY = "#4a5568";
const COLOR_LIGHT_BLUE = "#93c5fd";
const COLOR_VIBRANT_BLUE = "#60a5fa";
const COLOR_VERDE = "#6caeb6";

interface DashboardData {
  pendingPayments: number;
  totalDebt: number;
  hasDebt: boolean;
  accountInfo: {
    bank: string;
    accountNumber: string;
    cci: string;
    holder: string;
  } | null;
  news: { title: string; description: string; date: string }[];
  events: {
    date: string;
    title: string;
    type: string;
    startTime: string | null;
    endTime: string | null;
    location: string | null;
    description: string;
  }[];
  maintenanceEvents: {
    title: string;
    date: string;
    providerName: string;
    providerType: string;
    cost: number;
  }[];
  documents: { name: string; type: string; url: string; uploadDate: string }[];
  encargos: { ID_ENCARGO: number; descripcion: string; fechaRecepcion: string }[];
  permissions: {
    [key: string]: {
      visible: boolean;
      order: number;
      icon: string | null;
    };
  };
}

const ITEMS_PER_PAGE = 10; // Número de elementos por página

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingPayments: 0,
    totalDebt: 0,
    hasDebt: false,
    accountInfo: null,
    news: [],
    events: [],
    maintenanceEvents: [],
    documents: [],
    encargos: [],
    permissions: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportData, setReportData] = useState({ description: "", image: null as File | null });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Usuario";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userRoleIds, setUserRoleIds] = useState<number[]>([]);
  const [pagination, setPagination] = useState({
    news: { currentPage: 1, itemsPerPage: ITEMS_PER_PAGE },
    events: { currentPage: 1, itemsPerPage: ITEMS_PER_PAGE },
    documents: { currentPage: 1, itemsPerPage: ITEMS_PER_PAGE },
    encargos: { currentPage: 1, itemsPerPage: ITEMS_PER_PAGE },
    maintenanceEvents: { currentPage: 1, itemsPerPage: ITEMS_PER_PAGE },
  });

  // Mapa de iconos para las secciones
  const iconMap: { [key: string]: React.ComponentType } = {
    FaExclamationCircle,
    FaInfoCircle,
    FaBell,
    FaCalendarAlt,
    FaFileDownload,
    FaBox,
    FaMoneyBillWave,
    FaBuilding,
    FaFileAlt,
    FaTools,
  };

  // Obtener roles del usuario al cargar
  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const response = await fetch(`${API_URL}/user-roles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const roles = await response.json();
          setUserRoleIds(roles.map((role: any) => role.ID_TIPO_USUARIO));
        } else {
          console.error("Error al obtener roles:", response.statusText);
        }
      } catch (error) {
        console.error("Error al obtener roles:", error);
      }
    };
    if (token) fetchUserRoles();
  }, [token]);

  // Inicializar WebSocket
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
    });

    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
    });

    socket.on("dashboardUpdate", (updateData) => {
      console.log("Actualización recibida:", updateData);
      setDashboardData((prev) => {
        const newData = { ...prev };
        if (updateData.news) {
          newData.news = updateData.news
            .filter(
              (item: any) =>
                !item.ID_TIPO_USUARIO || userRoleIds.includes(item.ID_TIPO_USUARIO)
            )
            .map(({ ID_TIPO_USUARIO, ...rest }: any) => rest);
        }
        if (updateData.events) {
          newData.events = updateData.events
            .filter(
              (item: any) =>
                !item.ID_TIPO_USUARIO || userRoleIds.includes(item.ID_TIPO_USUARIO)
            )
            .map(({ ID_TIPO_USUARIO, ...rest }: any) => rest);
        }
        if (updateData.documents) {
          newData.documents = updateData.documents
            .filter(
              (item: any) =>
                !item.ID_TIPO_USUARIO || userRoleIds.includes(item.ID_TIPO_USUARIO)
            )
            .map(({ ID_TIPO_USUARIO, ...rest }: any) => rest);
        }
        if (updateData.maintenanceEvents) {
          newData.maintenanceEvents = updateData.maintenanceEvents
            .filter(
              (item: any) =>
                !item.ID_TIPO_USUARIO || userRoleIds.includes(item.ID_TIPO_USUARIO)
            )
            .map(({ ID_TIPO_USUARIO, ...rest }: any) => rest);
        }
        return newData;
      });
      setPagination((prev) => ({
        ...prev,
        news: { ...prev.news, currentPage: 1 },
        events: { ...prev.events, currentPage: 1 },
        documents: { ...prev.documents, currentPage: 1 },
        maintenanceEvents: { ...prev.maintenanceEvents, currentPage: 1 },
      }));
      Swal.fire({
        icon: "info",
        title: "¡Nuevos datos disponibles!",
        text: "El dashboard se ha actualizado con nueva información.",
        timer: 1500,
        showConfirmButton: false,
      });
    });

    socket.on("disconnect", () => {
      console.log("Desconectado del servidor WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, [token, userRoleIds]);

  // Fetch de datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) {
        console.error("No se encontró token en localStorage");
        navigate("/login");
        return;
      }

      try {
        console.log("Iniciando fetch a /dashboard con token:", token.slice(0, 10) + "...");
        const response = await fetch(`${API_URL}/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Respuesta de la API:", response.status, response.statusText);
        if (response.status === 401) {
          console.log("No autorizado, redirigiendo a login...");
          localStorage.removeItem("token");
          localStorage.removeItem("userName");
          localStorage.removeItem("role");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(`Error al obtener datos del dashboard: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos recibidos:", JSON.stringify(data, null, 2));

        // Validar datos recibidos
        setDashboardData({
          pendingPayments: data.pendingPayments ?? 0,
          totalDebt: data.totalDebt ?? 0,
          hasDebt: data.hasDebt ?? false,
          accountInfo: data.accountInfo ?? null,
          news: Array.isArray(data.news) ? data.news : [],
          events: Array.isArray(data.events) ? data.events : [],
          maintenanceEvents: Array.isArray(data.maintenanceEvents) ? data.maintenanceEvents : [],
          documents: Array.isArray(data.documents) ? data.documents : [],
          encargos: Array.isArray(data.encargos) ? data.encargos : [],
          permissions: data.permissions && typeof data.permissions === 'object' ? data.permissions : {},
        });

        if (!data.permissions || Object.keys(data.permissions).length === 0) {
          console.warn("No se recibieron permisos en la respuesta de la API");
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
/*         await Swal.fire({
          icon: "error",
          title: "Error al cargar el dashboard",
          text: `No se pudieron cargar los datos. Error: ${error.message}. Por favor, contacta al administrador.`,
          confirmButtonText: "Entendido",
        }); */
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      console.log("Usuario no autenticado, redirigiendo a login...");
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  // Controlar visibilidad del botón de subir
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Copiar al portapapeles
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await Swal.fire({
        icon: "success",
        title: `${label} copiado`,
        text: `${text} ha sido copiado al portapapeles.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo copiar el texto.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // Mostrar detalles de deudas
  const showDebtors = async () => {
    if (dashboardData.hasDebt) {
      await Swal.fire({
        icon: "warning",
        title: "Pagos Pendientes",
        text: `Tienes ${dashboardData.pendingPayments} pagos pendientes por un total de S/ ${dashboardData.totalDebt.toFixed(2)}. Contacta al administrador para más detalles.`,
        confirmButtonText: "Entendido",
      });
    } else {
      await Swal.fire({
        icon: "success",
        title: "Sin deudass",
        text: "¡Estás al día en tus pagos!",
        confirmButtonText: "Entendido",
      });
    }
  };

  // Mostrar detalles de encargos
  const showEncargos = async () => {
    if (dashboardData.encargos.length === 0) {
      await Swal.fire({
        icon: "info",
        title: "Sin encargos",
        text: "No tienes encargos pendientes en recepción.",
        confirmButtonText: "Entendido",
      });
      return;
    }

    const encargosList = dashboardData.encargos
      .slice(
        (pagination.encargos.currentPage - 1) * pagination.encargos.itemsPerPage,
        pagination.encargos.currentPage * pagination.encargos.itemsPerPage
      )
      .map((encargo) => `<li><strong>${encargo.fechaRecepcion}</strong>: ${encargo.descripcion}</li>`)
      .join("");
    await Swal.fire({
      icon: "info",
      title: "Encargos Pendientes",
      html: `<ul class="text-left">${encargosList}</ul>`,
      confirmButtonText: "Entendido",
    });
  };

  // Manejar cambios en el modal de reporte
  const handleReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setReportData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar carga de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportData((prev) => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar reporte
  const submitReport = async () => {
    if (!reportData.description) {
      await Swal.fire({
        icon: "error",
        title: "Descripción requerida",
        text: "Por favor, describe el problema.",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("description", reportData.description);
      if (reportData.image) {
        formData.append("image", reportData.image);
      }

      const response = await fetch(`${API_URL}/report-issue`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Error al enviar el reporte");

      await Swal.fire({
        icon: "success",
        title: "Reporte enviado",
        text: "El problema ha sido reportado correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowModal(false);
      setReportData({ description: "", image: null });
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo enviar el reporte.",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // Previsualizar documento
  const previewDocument = (url: string) => {
    setPreviewUrl(url);
    setShowPreviewModal(true);
  };

  // Manejar cambio de página
  const handlePageChange = (section: keyof typeof pagination, page: number) => {
    setPagination((prev) => ({
      ...prev,
      [section]: { ...prev[section], currentPage: page },
    }));
  };

  // Obtener datos paginados
  const getPaginatedData = (data: any[], section: keyof typeof pagination) => {
    const startIndex = (pagination[section].currentPage - 1) * pagination[section].itemsPerPage;
    const endIndex = startIndex + pagination[section].itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  // Renderizar controles de paginación
  const renderPagination = (section: keyof typeof pagination, totalItems: number) => {
    const totalPages = Math.ceil(totalItems / pagination[section].itemsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center gap-2 mt-4">
        <button
          onClick={() => handlePageChange(section, pagination[section].currentPage - 1)}
          disabled={pagination[section].currentPage === 1}
          className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-lg">
          Página {pagination[section].currentPage} de {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(section, pagination[section].currentPage + 1)}
          disabled={pagination[section].currentPage === totalPages}
          className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    );
  };

  // Renderizar ícono dinámicamente
  const renderIcon = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return null;
    const IconComponent = iconMap[iconName];
    return <IconComponent className="mr-2 text-xl sm:text-2xl" />;
  };

  // Normalizar NOMBRE_ELEMENTO para IDs de navegación
  const normalizeId = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Obtener clases de estilo para cada sección
  const getSectionStyles = (key: string) => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes("deudas") || keyLower.includes("pagos")) {
      return {
        textColor: dashboardData.hasDebt ? "text-red-600" : "text-gray-800",
        borderColor: dashboardData.hasDebt ? "border-red-600" : "border-green-600",
      };
    }
    if (keyLower.includes("cuenta") || keyLower.includes("mancomunada")) {
      return { textColor: "text-gray-800", borderColor: "border-blue-700" };
    }
    if (keyLower.includes("noticias")) {
      return { textColor: "text-gray-800", borderColor: "border-indigo-600" };
    }
    if (keyLower.includes("eventos")) {
      return { textColor: "text-gray-800", borderColor: "border-teal-600" };
    }
    if (keyLower.includes("mantenimientos") || keyLower.includes("mantenimiento")) {
      return { textColor: "text-gray-800", borderColor: "border-purple-600" };
    }
    if (keyLower.includes("documentos")) {
      return { textColor: "text-gray-800", borderColor: "border-gray-700" };
    }
    if (keyLower.includes("encargos")) {
      return {
        textColor: dashboardData.encargos.length > 0 ? "text-yellow-600" : "text-gray-800",
        borderColor: "border-yellow-600",
      };
    }
    return { textColor: "text-gray-800", borderColor: "border-gray-700" };
  };

  // Obtener conteo de notificaciones para cada sección
  const getNotificationCount = (key: string): number => {
    const keyLower = key.toLowerCase();
    if (keyLower.includes("deudas") || keyLower.includes("pagos")) {
      return dashboardData.hasDebt ? dashboardData.pendingPayments : 0;
    }
    if (keyLower.includes("encargos")) {
      return dashboardData.encargos.length;
    }
    if (keyLower.includes("noticias")) {
      return dashboardData.news.length;
    }
    if (keyLower.includes("eventos")) {
      return dashboardData.events.length;
    }
    if (keyLower.includes("mantenimientos") || keyLower.includes("mantenimiento")) {
      return dashboardData.maintenanceEvents.length;
    }
    if (keyLower.includes("documentos")) {
      return dashboardData.documents.length;
    }
    return 0;
  };

  // Deducir qué datos renderizar según NOMBRE_ELEMENTO
  const renderSectionContent = (key: string) => {
    if (isLoading) {
      return (
        <div className="flex justify-center">
          <span className="inline-block w-6 h-6 border-4 border-t-gray-600 border-gray-200 rounded-full animate-spin"></span>
        </div>
      );
    }

    const { textColor } = getSectionStyles(key);
    const keyLower = key.toLowerCase();

    // deudas
    if (keyLower.includes("deudas") || keyLower.includes("pagos")) {
      const contentColor = dashboardData.hasDebt ? "text-red-600" : "text-gray-600";
      return (
        <div
          className={`flex items-center ${contentColor} cursor-pointer`}
          onClick={showDebtors}
        >
          <FaMoneyBillWave className="mr-3 text-2xl sm:text-3xl" />
          <p
            className={`font-semibold text-base sm:text-lg ${
              dashboardData.hasDebt ? "text-red-600" : "text-gray-800"
            }`}
          >
            {dashboardData.hasDebt
              ? `¡Atención! Tienes ${dashboardData.pendingPayments} pagos pendientes por un total de S/ ${dashboardData.totalDebt.toFixed(
                  2
                )}.`
              : "¡Estás al día en tus pagos!"}
          </p>
        </div>
      );
    }

    // Cuenta Mancomunada
    if (keyLower.includes("cuenta") || keyLower.includes("mancomunada")) {
      return dashboardData.accountInfo ? (
        <div className="space-y-3">
          <p className={`text-base sm:text-lg ${textColor}`}>
            <strong>Banco:</strong> {dashboardData.accountInfo.bank}
          </p>
          <p className={`text-base sm:text-lg ${textColor} flex items-center flex-wrap`}>
            <strong>Número de Cuenta:</strong> {dashboardData.accountInfo.accountNumber}
            <button
              onClick={() =>
                copyToClipboard(dashboardData.accountInfo.accountNumber, "Número de Cuenta")
              }
              className="ml-3 text-gray-600 hover:text-gray-500 transition-colors"
            >
              <FaCopy className="text-lg" />
            </button>
          </p>
          <p className={`text-base sm:text-lg ${textColor} flex items-center flex-wrap`}>
            <strong>CCI:</strong> {dashboardData.accountInfo.cci}
            <button
              onClick={() => copyToClipboard(dashboardData.accountInfo.cci, "CCI")}
              className="ml-3 text-gray-600 hover:text-gray-500 transition-colors"
            >
              <FaCopy className="text-lg" />
            </button>
          </p>
          <p className={`text-base sm:text-lg ${textColor}`}>
            <strong>Titular:</strong> {dashboardData.accountInfo.holder}
          </p>
          <p className="text-sm text-gray-600 mt-3">
            Usa esta cuenta para tus pagos de expensas. Contacta al administrador para dudas.
          </p>
        </div>
      ) : (
        <p className={`text-base sm:text-lg ${textColor}`}>
          No hay cuenta mancomunada disponible.
        </p>
      );
    }

    // Encargos
    if (keyLower.includes("encargos")) {
      const contentColor = dashboardData.encargos.length > 0 ? "text-yellow-600" : "text-gray-600";
      const paginatedEncargos = getPaginatedData(dashboardData.encargos, "encargos");
      return dashboardData.encargos.length > 0 ? (
        <div>
          <div
            onClick={showEncargos}
            className={`${contentColor} flex items-center cursor-pointer mb-4`}
          >
            <FaExclamationCircle className="mr-3 text-2xl sm:text-3xl" />
            <p className={`font-semibold text-base sm:text-lg ${textColor}`}>
              ¡Atención! Tienes {dashboardData.encargos.length} encargos pendientes en recepción.
            </p>
          </div>
          {paginatedEncargos.map((encargo, index) => (
            <div
              key={index}
              className="flex items-start mb-4 border-b border-gray-200 pb-4 last:border-b-0"
            >
              <span className="text-gray-600 mr-3 text-xl">•</span>
              <div className="w-full">
                <p className={`font-semibold text-base sm:text-lg ${textColor}`}>
                  {encargo.descripcion}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">{encargo.fechaRecepcion}</p>
              </div>
            </div>
          ))}
          {renderPagination("encargos", dashboardData.encargos.length)}
        </div>
      ) : (
        <p className={`text-base sm:text-lg ${textColor}`}>No tienes encargos pendientes.</p>
      );
    }

    // Noticias
    if (keyLower.includes("noticias")) {
      const paginatedNews = getPaginatedData(dashboardData.news, "news");
      return dashboardData.news.length > 0 ? (
        <div>
          {paginatedNews.map((item, index) => (
            <div
              key={index}
              className="flex items-start mb-4 border-b border-gray-200 pb-4 last:border-b-0"
            >
              <span className="text-gray-600 mr-3 text-xl">•</span>
              <div className="w-full">
                <p className={`font-semibold text-base sm:text-lg ${textColor}`}>{item.title}</p>
                <p className="text-gray-600 text-sm sm:text-base overflow-wrap break-word">
                  {item.description}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">{item.date}</p>
              </div>
            </div>
          ))}
          {renderPagination("news", dashboardData.news.length)}
        </div>
      ) : (
        <p className={`text-base sm:text-lg ${textColor}`}>No hay noticias disponibles.</p>
      );
    }

    // Eventos
    if (keyLower.includes("eventos")) {
      const paginatedEvents = getPaginatedData(dashboardData.events, "events");
      return dashboardData.events.length > 0 ? (
        <div>
          {paginatedEvents.map((event, index) => (
            <div
              key={index}
              className="flex items-start mb-4 border-b border-gray-200 pb-4 last:border-b-0"
            >
              <span className="text-gray-600 mr-3 text-xl">•</span>
              <div className="w-full">
                <p className={`font-semibold text-base sm:text-lg ${textColor}`}>
                  {event.date} ({event.type}): {event.title}
                </p>
                <p className="text-gray-600 text-sm sm:text-base overflow-wrap break-word">
                  {event.description}
                </p>
                {event.startTime && event.endTime && (
                  <p className="text-gray-600 text-xs sm:text-sm">
                    Horario: {event.startTime} - {event.endTime}
                  </p>
                )}
                {event.location && (
                  <p className="text-gray-600 text-xs sm:text-sm">Ubicación: {event.location}</p>
                )}
              </div>
            </div>
          ))}
          {renderPagination("events", dashboardData.events.length)}
        </div>
      ) : (
        <p className={`text-base sm:text-lg ${textColor}`}>No hay eventos próximos.</p>
      );
    }

    // Mantenimientos Programados
    if (keyLower.includes("mantenimientos") || keyLower.includes("mantenimiento")) {
      const paginatedMaintenance = getPaginatedData(dashboardData.maintenanceEvents, "maintenanceEvents");
      return dashboardData.maintenanceEvents.length > 0 ? (
        <div>
          {paginatedMaintenance.map((event, index) => (
            <div
              key={index}
              className="flex items-start mb-4 border-b border-gray-200 pb-4 last:border-b-0"
            >
              <span className="text-gray-600 mr-3 text-xl">•</span>
              <div className="w-full">
                <p className={`font-semibold text-base sm:text-lg ${textColor}`}>
                  {event.date}: {event.title}
                </p>
                <p className="text-gray-600 text-sm sm:text-base">
                  Proveedor: {event.providerName} ({event.providerType})
                </p>
                <p className="text-gray-600 text-xs sm:text-sm">
                  Costo: S/ {event.cost.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          {renderPagination("maintenanceEvents", dashboardData.maintenanceEvents.length)}
        </div>
      ) : (
        <p className={`text-base sm:text-lg ${textColor}`}>No hay mantenimientos programados.</p>
      );
    }

    // Documentos
    if (keyLower.includes("documentos")) {
      const paginatedDocuments = getPaginatedData(dashboardData.documents, "documents");
      return dashboardData.documents.length > 0 ? (
        <div>
          {paginatedDocuments.map((doc, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-3 border-b border-gray-200 pb-3 last:border-b-0"
            >
              <div className="mb-2 sm:mb-0">
                <span className={`text-base sm:text-lg ${textColor}`}>
                  {doc.name} ({doc.type})
                </span>
                <p className="text-gray-600 text-xs sm:text-sm">Subido el: {doc.uploadDate}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => previewDocument(doc.url)}
                  className="text-gray-600 hover:text-gray-500 flex items-center text-base sm:text-lg hover:underline"
                >
                  Ver
                  <FaEye className="ml-2" />
                </button>
                <a
                  href={doc.url}
                  download
                  className="text-gray-600 hover:text-gray-500 flex items-center text-base sm:text-lg hover:underline"
                >
                  Descargar
                  <FaFileDownload className="ml-2" />
                </a>
              </div>
            </div>
          ))}
          {renderPagination("documents", dashboardData.documents.length)}
        </div>
      ) : (
        <p className={`text-base sm:text-lg ${textColor}`}>No hay documentos disponibles.</p>
      );
    }

    // Secciones desconocidas o sin datos
    return (
      <p className={`text-base sm:text-lg ${textColor}`}>
        No hay datos disponibles para esta sección.
      </p>
    );
  };

  // Log de permisos para depuración
  console.log("Permisos en dashboardData:", dashboardData.permissions);
  console.log(
    "Permisos filtrados para botones:",
    Object.entries(dashboardData.permissions).filter(
      ([key, perm]) => perm.visible && key !== "Reportar Problema"
    )
  );

  return (
    <div>
      <Element name="top" />
      <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado con Título y Logo */}
          <div
            className="bg-gradient-to-r from-[#4a5568] via-[#60a5fa] to-[#93c5fd] text-white py-4 px-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between mb-8 animate-slide-in-down"
            style={{
              background: `linear-gradient(to right, ${COLOR_DARK_GRAY}, ${COLOR_VIBRANT_BLUE}, ${COLOR_LIGHT_BLUE})`,
            }}
          >
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-0">Panel Principal</h1>
            <div className="relative">
              <div className="bg-white rounded-full h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                <img
                  src={LOGO_PATH}
                  alt="Softhome Logo"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-contain"
                />
              </div>
            </div>
          </div>

          {/* Card de Bienvenida */}
          <div
            className={`bg-white border border-${COLOR_VERDE} p-4 sm:p-6 rounded-2xl shadow-xl mb-8 animate-bounce shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}
          >
            <div className="flex items-center">
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 448 512"
                className="text-gray-600 text-2xl sm:text-3xl mr-4"
                height="1em"
                width="1em"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
              </svg>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  ¡Bienvenido, {userName}!
                </h2>
                <p className="text-sm text-gray-600">Accede a la información de tu edificio.</p>
              </div>
            </div>
          </div>

          {/* Mensaje si no hay permisos */}
          {isLoading ? (
            <div
              className={`bg-white border border-${COLOR_VERDE} p-4 sm:p-6 rounded-2xl shadow-xl mb-8 text-center`}
            >
              <span className="inline-block w-6 h-6 border-4 border-t-gray-600 border-gray-200 rounded-full animate-spin"></span>
              <p className="text-gray-600 text-base sm:text-lg mt-2">Cargando datos...</p>
            </div>
          ) : Object.keys(dashboardData.permissions).length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 p-4 sm:p-6 rounded-2xl shadow-xl mb-8 text-center">
              <FaExclamationCircle className="text-yellow-600 text-2xl sm:text-3xl mx-auto mb-2" />
              <p className="text-gray-600 text-base sm:text-lg">
                No tienes permisos asignados para ver el contenido del dashboard. Contacta al
                administrador.
              </p>
            </div>
          ) : null}

          {/* Botones de Navegación */}
          {Object.keys(dashboardData.permissions).length > 0 && (
            <div className="flex flex-wrap gap-3 sm:gap-4 mb-8 justify-center">
              {Object.entries(dashboardData.permissions)
                .filter(([key, perm]) => perm.visible)
                .sort((a, b) => a[1].order - b[1].order)
                .map(([key, perm]) => {
                  const notificationCount = key !== "Reportar Problema" ? getNotificationCount(key) : 0;
                  return key === "Reportar Problema" ? (
                    <button
                      key={key}
                      onClick={() => setShowModal(true)}
                      className="relative flex items-center bg-[#5995DB] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                      aria-label={key}
                    >
                      {renderIcon(perm.icon)}
                      {key}
                    </button>
                  ) : (
                    <Link key={key} to={normalizeId(key)} smooth={true} duration={500}>
                      <button
                        className="relative flex items-center bg-[#5995DB] text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-sm sm:text-base"
                        aria-label={`${key}${
                          notificationCount > 0 ? `, ${notificationCount} elementos pendientes` : ""
                        }`}
                      >
                        {renderIcon(perm.icon)}
                        {key}
                        {notificationCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                            {notificationCount}
                          </span>
                        )}
                      </button>
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Secciones Dinámicas */}
          {Object.entries(dashboardData.permissions)
            .filter(([key, perm]) => perm.visible && key !== "Reportar Problema")
            .sort((a, b) => a[1].order - b[1].order)
            .map(([key, perm]) => {
              const { borderColor } = getSectionStyles(key);
              return (
                <Element key={key} name={normalizeId(key)}>
                  <div
                    className={`bg-white border-l-4 ${borderColor} p-4 sm:p-6 rounded-2xl shadow-xl mb-8 transition-all hover:shadow-2xl hover:-translate-y-1 w-full`}
                    aria-live={key.toLowerCase().includes("noticias") ? "polite" : undefined}
                  >
                    <div className="flex items-center mb-4">
                      {renderIcon(perm.icon)}
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{key}</h3>
                    </div>
                    {renderSectionContent(key)}
                  </div>
                </Element>
              );
            })}

          {/* Modal para Reportar Problema */}
          {dashboardData.permissions["Reportar Problema"]?.visible && showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-4 sm:p-6 rounded-2xl w-[90vw] max-w-lg shadow-2xl animate-fade-in">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  Reportar Problema
                </h3>
                <textarea
                  name="description"
                  value={reportData.description}
                  onChange={handleReportChange}
                  placeholder="Describe el problema..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-4 resize-y focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all text-sm sm:text-base"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                  className="mb-4 w-full text-gray-600 text-sm sm:text-base"
                />
                {imagePreview && (
                  <div className="mb-4">
                    <img
                      src={imagePreview}
                      alt="Previsualización"
                      className="w-full h-32 sm:h-40 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setReportData({ description: "", image: null });
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="px-3 py-2 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitReport}
                    className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm sm:text-base"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para Previsualizar Documentos */}
          {showPreviewModal && previewUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-4 sm:p-6 rounded-2xl w-[90vw] max-w-4xl shadow-2xl animate-fade-in">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                  Previsualización de Documento
                </h3>
                <iframe
                  src={previewUrl}
                  className="w-full h-[50vh] sm:h-[60vh] rounded-lg"
                  title="Document Preview"
                />
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-600 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botón de Subir */}
          {showScrollTop && (
            <Link to="top" smooth={true} duration={500}>
              <button className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-500 transition-all animate-bounce">
                <FaArrowUp className="text-lg sm:text-xl" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;