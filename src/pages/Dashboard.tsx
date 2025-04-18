import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaBell, FaExclamationCircle, FaInfoCircle, FaCopy, FaFileDownload, FaEye, FaCalendarAlt, FaBuilding, FaFileAlt, FaArrowUp } from "react-icons/fa";
import Swal from "sweetalert2";
import { Link, Element } from "react-scroll";

const API_URL = import.meta.env.VITE_API_URL; // Cargar la URL desde .env
const LOGO_PATH = "/LogoSoftHome/Logo_SoftHome_1.png"; // Ruta del logo

// Definición de colores como variables globales
const COLOR_DARK_GRAY = "#4a5568"; // Gris azulado oscuro
const COLOR_LIGHT_BLUE = "#93c5fd"; // Azul claro
const COLOR_VIBRANT_BLUE = "#60a5fa"; // Azul vibrante
const COLOR_VERDE = "#6caeb6"; // Verde azulado para bordes

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pendingPayments, setPendingPayments] = useState<number | null>(null);
  const [news, setNews] = useState<{ title: string; description: string; date: string }[]>([]);
  const [events, setEvents] = useState<{ date: string; title: string }[]>([]);
  const [documents, setDocuments] = useState<{ name: string; type: string; url: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [reportData, setReportData] = useState({ description: "", image: null as File | null });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userName = localStorage.getItem("userName") || "Usuario";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Permisos basados en roles
  const isSuperUser = role === "1";
  const isAdmin = role === "2" || role === "6";
  const isSecurity = role === "3";
  const isResident = role === "4" || role === "5";

  // Fetch de datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isSuperUser || isAdmin || isSecurity) {
          const paymentsResponse = await fetch(`${API_URL}/pending-payments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (paymentsResponse.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            localStorage.removeItem("role");
            navigate("/login");
            return;
          }
          if (!paymentsResponse.ok) throw new Error("Error al obtener pagos pendientes");
          const paymentsData = await paymentsResponse.json();
          setPendingPayments(paymentsData.length);
        }

        const newsResponse = await fetch(`${API_URL}/news`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!newsResponse.ok) throw new Error("Error al obtener noticias");
        const newsData = await newsResponse.json();
        setNews(newsData);

        const eventsResponse = await fetch(`${API_URL}/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!eventsResponse.ok) throw new Error("Error al obtener eventos");
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);

        const documentsResponse = await fetch(`${API_URL}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!documentsResponse.ok) throw new Error("Error al obtener documentos");
        const documentsData = await documentsResponse.json();
        setDocuments(documentsData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los datos del dashboard.",
          timer: 2000,
          showConfirmButton: false,
        });
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, token, navigate, isSuperUser, isAdmin, isSecurity]);

  // Controlar visibilidad del botón de subir
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Datos simulados para pruebas
  const simulatedPendingPayments = 5;
  const simulatedNews = [
    {
      title: "Reunión de Consorcio",
      description: "Se discutirá el presupuesto 2025 el 30/04.",
      date: "2025-04-20",
    },
    {
      title: "Mantenimiento Programado",
      description: "El ascensor estará fuera de servicio el 25/04 de 9:00 a 12:00.",
      date: "2025-04-22",
    },
    {
      title: "Evento Comunitario",
      description: "Fiesta de integración en el quincho el 28/04.",
      date: "2025-04-25",
    },
  ];
  const simulatedEvents = [
    { date: "2025-04-20", title: "Mantenimiento Ascensor" },
    { date: "2025-04-25", title: "Reserva Quincho - Juan Pérez" },
    { date: "2025-04-30", title: "Reunión de Consorcio" },
  ];
  const simulatedDocuments = [
    { name: "Reglamento Interno", type: "PDF", url: "#" },
    { name: "Normas de Convivencia", insider: "Word", url: "#" },
    { name: "Presupuesto 2025", type: "Excel", url: "#" },
  ];
  const accountInfo = {
    bank: "Banco Continental",
    accountNumber: "1234-5678-9012-3456",
    cci: "002-123-456789012345-67",
    holder: "Consorcio Residencial Elant",
  };

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

  // Mostrar detalles de deudores
  const showDebtors = async () => {
    await Swal.fire({
      icon: "warning",
      title: "Pagos Pendientes",
      text: `Hay ${pendingPayments || simulatedPendingPayments} departamentos con expensas pendientes. Contacta al administrador para más detalles.`,
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
        headers: { Authorization: `Bearer ${token}` },
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

  return (
    <>
      <Element name="top" />
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado con Título y Logo */}
          <div className={`bg-gradient-to-r from-[${COLOR_DARK_GRAY}] via-[${COLOR_VIBRANT_BLUE}] to-[${COLOR_LIGHT_BLUE}] text-white py-4 px-6 rounded-2xl shadow-xl flex items-center justify-between mb-8 animate-slide-in-down`}>
            <h1 className="text-2xl font-bold">Panel Principal</h1>
            <div className="relative">
              <div className="bg-white rounded-full h-24 w-24 flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300">
                <img src={LOGO_PATH} alt="Softhome Logo" className="h-20 w-20 rounded-full object-contain" />
              </div>
            </div>
          </div>

          {/* Card de Bienvenida con Movimiento */}
          <div className={`bg-white border border-[${COLOR_VERDE}] p-6 rounded-2xl shadow-xl mb-8 animate-bounce shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}>
            <div className="flex items-center">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className={`text-[${COLOR_VIBRANT_BLUE}] text-3xl mr-4`} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path>
              </svg>
              <div>
                <h2 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}]`}>¡Bienvenido, {userName}!</h2>
                <p className={`text-sm text-[${COLOR_DARK_GRAY}]`}>
                  {isSuperUser
                    ? "Gestiona todo el edificio desde aquí"
                    : isAdmin
                    ? "Administra las actividades del edificio"
                    : isSecurity
                    ? "Mantente al tanto de las alertas"
                    : "Accede a la información del edificio"}
                </p>
              </div>
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            {(isSuperUser || isAdmin || isSecurity) && (
              <Link to="debtors" smooth={true} duration={500}>
                <button className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <FaExclamationCircle className="mr-2" />
                  Deudores
                </button>
              </Link>
            )}
            <Link to="account" smooth={true} duration={500}>
              <button className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <FaInfoCircle className="mr-2" />
                Cuenta Mancomunada
              </button>
            </Link>
            <Link to="news" smooth={true} duration={500}>
              <button className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <FaBell className="mr-2" />
                Noticias
              </button>
            </Link>
            <Link to="events" smooth={true} duration={500}>
              <button className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <FaCalendarAlt className="mr-2" />
                Eventos
              </button>
            </Link>
            <Link to="documents" smooth={true} duration={500}>
              <button className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <FaFileDownload className="mr-2" />
                Documentos
              </button>
            </Link>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <FaExclamationCircle className="mr-2" />
              Reportar Problema
            </button>
            {(isSuperUser || isAdmin) && (
              <button
                onClick={() => navigate("/news")}
                className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <FaInfoCircle className="mr-2" />
                Gestionar Noticias
              </button>
            )}
          </div>

          {/* Alerta de Pagos Pendientes */}
          {(isSuperUser || isAdmin || isSecurity) && (
            <Element name="debtors">
              <div className={`bg-white border border-[${COLOR_VERDE}] p-6 rounded-2xl shadow-xl mb-8 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}>
                <div onClick={showDebtors} className="text-red-600 flex items-center cursor-pointer">
                  <FaExclamationCircle className="mr-3 text-3xl" />
                  <p className="font-semibold text-lg">
                    {isLoading ? (
                      <span className={`inline-block w-6 h-6 border-4 border-t-[${COLOR_VIBRANT_BLUE}] border-gray-200 rounded-full animate-spin`}></span>
                    ) : (
                      `¡Atención! Hay ${pendingPayments || simulatedPendingPayments} departamentos con expensas pendientes.`
                    )}
                  </p>
                </div>
              </div>
            </Element>
          )}

          {/* Card de Cuenta Mancomunada */}
          <Element name="account">
            <div className={`bg-white border border-[${COLOR_VERDE}] p-6 rounded-2xl shadow-xl mb-8 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}>
              <div className="flex items-center mb-4">
                <FaBuilding className={`text-[${COLOR_VIBRANT_BLUE}] text-3xl mr-3`} />
                <h3 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}]`}>Cuenta Mancomunada</h3>
              </div>
              <div className="space-y-3">
                <p className={`text-[${COLOR_DARK_GRAY}] text-lg`}>
                  <strong>Banco:</strong> {accountInfo.bank}
                </p>
                <p className={`text-[${COLOR_DARK_GRAY}] text-lg flex items-center`}>
                  <strong>Número de Cuenta:</strong> {accountInfo.accountNumber}
                  <button
                    onClick={() => copyToClipboard(accountInfo.accountNumber, "Número de Cuenta")}
                    className={`ml-3 text-[${COLOR_VIBRANT_BLUE}] hover:text-[${COLOR_LIGHT_BLUE}] transition-colors`}
                  >
                    <FaCopy />
                  </button>
                </p>
                <p className={`text-[${COLOR_DARK_GRAY}] text-lg flex items-center`}>
                  <strong>CCI:</strong> {accountInfo.cci}
                  <button
                    onClick={() => copyToClipboard(accountInfo.cci, "CCI")}
                    className={`ml-3 text-[${COLOR_VIBRANT_BLUE}] hover:text-[${COLOR_LIGHT_BLUE}] transition-colors`}
                  >
                    <FaCopy />
                  </button>
                </p>
                <p className={`text-[${COLOR_DARK_GRAY}] text-lg`}>
                  <strong>Titular:</strong> {accountInfo.holder}
                </p>
                <p className={`text-sm text-[${COLOR_DARK_GRAY}] mt-3`}>
                  Usa esta cuenta para tus pagos de expensas. Contacta al administrador para dudas.
                </p>
              </div>
            </div>
          </Element>

          {/* Card de Noticias */}
          <Element name="news">
            <div
              className={`bg-white border border-[${COLOR_VERDE}] p-6 rounded-2xl shadow-xl mb-8 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}
              aria-live="polite"
            >
              <div className="flex items-center mb-4">
                <FaBell className={`text-[${COLOR_VIBRANT_BLUE}] text-3xl mr-3`} />
                <h3 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}]`}>Noticias del Edificio</h3>
              </div>
              {isLoading ? (
                <span className={`inline-block w-6 h-6 border-4 border-t-[${COLOR_VIBRANT_BLUE}] border-gray-200 rounded-full animate-spin`}></span>
              ) : (news.length > 0 ? news : simulatedNews).slice(0, 3).map((item, index) => (
                <div key={index} className={`flex items-start mb-4 border-b border-[${COLOR_VERDE}] pb-4 last:border-b-0`}>
                  <span className={`text-[${COLOR_VIBRANT_BLUE}] mr-3 text-xl`}>•</span>
                  <div>
                    <p className={`font-semibold text-[${COLOR_DARK_GRAY}] text-lg`}>{item.title}</p>
                    <p className={`text-[${COLOR_DARK_GRAY}]`}>{item.description}</p>
                    <p className={`text-sm text-[${COLOR_DARK_GRAY}]`}>{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Element>

          {/* Card de Eventos */}
          <Element name="events">
            <div className={`bg-white border border-[${COLOR_VERDE}] p-6 rounded-2xl shadow-xl mb-8 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}>
              <div className="flex items-center mb-4">
                <FaCalendarAlt className={`text-[${COLOR_VIBRANT_BLUE}] text-3xl mr-3`} />
                <h3 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}]`}>Eventos Próximos</h3>
              </div>
              {isLoading ? (
                <span className={`inline-block w-6 h-6 border-4 border-t-[${COLOR_VIBRANT_BLUE}] border-gray-200 rounded-full animate-spin`}></span>
              ) : (events.length > 0 ? events : simulatedEvents).map((event, index) => (
                <div key={index} className={`text-[${COLOR_DARK_GRAY}] text-lg mb-3`}>
                  <span className="font-medium">{event.date}:</span> {event.title}
                </div>
              ))}
            </div>
          </Element>

          {/* Card de Documentos */}
          <Element name="documents">
            <div className={`bg-white border border-[${COLOR_VERDE}] p-6 rounded-2xl shadow-xl mb-8 transition-all hover:shadow-2xl hover:-translate-y-1 shadow-[0_4px_6px_rgba(108,174,182,0.2)]`}>
              <div className="flex items-center mb-4">
                <FaFileAlt className={`text-[${COLOR_VIBRANT_BLUE}] text-3xl mr-3`} />
                <h3 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}]`}>Documentos del Edificio</h3>
              </div>
              {isLoading ? (
                <span className={`inline-block w-6 h-6 border-4 border-t-[${COLOR_VIBRANT_BLUE}] border-gray-200 rounded-full animate-spin`}></span>
              ) : (documents.length > 0 ? documents : simulatedDocuments).map((doc, index) => (
                <div
                  key={index}
                  className={`flex justify-between items-center mb-3 border-b border-[${COLOR_VERDE}] pb-3 last:border-b-0`}
                >
                  <span className={`text-[${COLOR_DARK_GRAY}] text-lg`}>{doc.name} ({doc.type})</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => previewDocument(doc.url)}
                      className={`text-[${COLOR_VIBRANT_BLUE}] hover:text-[${COLOR_LIGHT_BLUE}] flex items-center text-lg hover:underline`}
                    >
                      Ver
                      <FaEye className="ml-2" />
                    </button>
                    <a
                      href={doc.url}
                      download
                      className={`text-[${COLOR_VIBRANT_BLUE}] hover:text-[${COLOR_LIGHT_BLUE}] flex items-center text-lg hover:underline`}
                    >
                      Descargar
                      <FaFileDownload className="ml-2" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Element>

          {/* Modal para Reportar Problema */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in">
                <h3 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}] mb-4`}>Reportar un Problema</h3>
                <textarea
                  name="description"
                  value={reportData.description}
                  onChange={handleReportChange}
                  placeholder="Describe el problema..."
                  rows={4}
                  className={`w-full p-3 border border-[${COLOR_VERDE}] rounded-lg mb-4 resize-y focus:outline-none focus:ring-2 focus:ring-[${COLOR_VIBRANT_BLUE}] transition-all`}
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className={`w-full mb-4 text-[${COLOR_DARK_GRAY}]`}
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Vista previa" className="max-w-full max-h-48 rounded-lg mb-4 shadow-sm" />
                )}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={submitReport}
                    className="flex items-center bg-[#5995DB] bg-opacity-100 text-white px-6 py-2 rounded-2xl shadow-md hover:bg-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setReportData({ description: "", image: null });
                      setImagePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded-2xl shadow-md hover:bg-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal para Previsualizar Documentos */}
          {showPreviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white p-6 rounded-2xl w-full max-w-4xl shadow-2xl animate-fade-in">
                <h3 className={`text-xl font-semibold text-[${COLOR_DARK_GRAY}] mb-4`}>Previsualizar Documento</h3>
                <div className="w-full h-[60vh] mb-4">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className={`w-full h-full rounded-lg border border-[${COLOR_VERDE}]`}
                      title="Vista previa del documento"
                    />
                  ) : (
                    <p className={`text-[${COLOR_DARK_GRAY}]`}>No se puede previsualizar el documento.</p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="bg-gray-600 text-white px-6 py-2 rounded-2xl shadow-md hover:bg-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botón para subir al inicio */}
          {showScrollTop && (
            <Link to="top" smooth={true} duration={500} offset={-100}>
              <button
                className="fixed bottom-6 right-6 bg-transparent border-2 border-[#60a5fa] text-[#60a5fa] p-3 rounded-full shadow-md hover:border-[#93c5fd] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 z-50"
                title="Subir al inicio"
              >
                <FaArrowUp className="text-xl" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;