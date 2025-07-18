import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styled, { keyframes } from "styled-components";
import {
  FaBox,
  FaSave,
  FaFileExport,
  FaCheck,
  FaSearch,
  FaCamera,
  FaTimes,
  FaUser,
  FaIdCard,
  FaBuilding,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaEye,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL;

const slideInDown = keyframes`
  0% { opacity: 0; transform: translateY(-20px) }
  100% { opacity: 1; transform: translateY(0) }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px) }
  100% { opacity: 1; transform: translateY(0) }
`;

const Container = styled.div`
  padding: 1.5rem;
  background-color: #f3f4f6;
  min-height: 100vh;
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  animation: ${slideInDown} 0.5s ease-out;
`;

const TabButton = styled.button`
  padding: 0.5rem 1rem;
  font-weight: 600;
  color: ${(props) => (props.active ? "#2563eb" : "#4b5563")};
  border-bottom: ${(props) => (props.active ? "2px solid #2563eb" : "none")};
  transition: color 0.2s ease, border-bottom 0.2s ease;
  &:hover {
    color: #2563eb;
  }
`;

const TabContent = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
  margin-top: 1.5rem;
`;

const Card = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
`;

const Input = styled.input`
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  border-radius: 0.375rem;
  width: 100%;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
  &[type="radio"] {
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid #d1d5db;
    border-radius: 50%;
    cursor: pointer;
    &:checked {
      background-color: #2563eb;
      border-color: #2563eb;
      position: relative;
      &:after {
        content: "";
        width: 0.5rem;
        height: 0.5rem;
        background-color: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
    &:focus {
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3);
    }
  }
`;

const SelectInput = styled.select`
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  border-radius: 0.375rem;
  width: 100%;
  background-color: white;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  &:hover {
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
`;

const TableRow = styled.tr`
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(props) => props.$delay}s;
  &:nth-child(even) {
    background-color: #f9fafb;
  }
  &:hover {
    background-color: #e5e7eb;
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  background-color: #f1f5f9;
  border-bottom: 1px solid #d1d5db;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #d1d5db;
  font-size: 0.875rem;
`;

const ImagePreview = styled.img`
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-top: 0.5rem;
`;

const CameraModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: ${(props) =>
    props.$isDelivery ? 1100 : 1000}; /* Mayor z-index para cámara de entrega */
  padding: 1rem;
`;

const CameraContainer = styled.div`
  background-color: white;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Video = styled.video`
  width: 100%;
  max-height: 60vh;
  object-fit: cover;
  background-color: black;
`;

const CameraButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  justify-content: center;
`;

const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ResidentCard = styled.div`
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const AssociatedUsersContainer = styled.div`
  margin-top: 1rem;
`;

const UserCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-2px);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Badge = styled.span`
  background-color: #2563eb;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ToggleButton = styled(Button)`
  background-color: #2563eb;
  color: white;
  &:hover {
    background-color: #1d4ed8;
  }
`;

const SearchContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.5rem;
  align-items: end;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Spinner = styled(FaSpinner)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const formatDate = (dateInput) => {
  if (!dateInput) return "-";
  try {
    let date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return "-";
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "-";
  }
};

const RegisterOrder = () => {
  const { isAuthenticated, userId } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("history");
  const [searchCriteria, setSearchCriteria] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [phaseOptions, setPhaseOptions] = useState([
    { value: "all", label: "Todas las fases" },
  ]);
  const [results, setResults] = useState([]);
  const [selectedMainResident, setSelectedMainResident] = useState(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [encargos, setEncargos] = useState([]);
  const [filter, setFilter] = useState({
    nroDpto: "",
    descripcion: "",
    fechaRecepcion: "",
    estado: "1",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAssociatedUsers, setShowAssociatedUsers] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [stream, setStream] = useState(null);
  const [showSearchResults, setShowSearchResults] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [isDeliveryCameraActive, setIsDeliveryCameraActive] = useState(false); // Nuevo estado para cámara de entrega
  const [deliveryStream, setDeliveryStream] = useState(null); // Stream para cámara de entrega
  const [deliveryPhoto, setDeliveryPhoto] = useState(null); // Foto de entrega
  const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState(null); // Vista previa de foto de entrega
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const deliveryPhotoRef = useRef(null);
  const deliveryVideoRef = useRef(null); // Nuevo ref para video de entrega
  const deliveryCanvasRef = useRef(null); // Nuevo ref para canvas de entrega

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  const checkDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      console.log("Cámaras disponibles:", videoDevices);
      if (videoDevices.length === 0) {
        Swal.fire({
          icon: "error",
          title: "Sin cámaras",
          text: "No se encontraron cámaras en el dispositivo. Usa 'Seleccionar Foto' para cargar una imagen.",
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error al enumerar dispositivos:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo verificar las cámaras disponibles. Verifica los permisos del navegador.",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    checkDevices();
  }, []);

  // Sincronizar deliveryPhotoRef con deliveryPhoto
  useEffect(() => {
    deliveryPhotoRef.current = deliveryPhoto;
  }, [deliveryPhoto]);

  const fetchEncargos = async () => {
    try {
      const response = await fetch(`${API_URL}/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener los encargos");
      const data = await response.json();
      /*       console.log(
        "Datos de encargos recibidos:",
        JSON.stringify(data, null, 2)
      ); */
      setEncargos(
        data
          .map((encargo) => ({
            ...encargo,
            ESTADO:
              encargo.ESTADO === true
                ? 1
                : encargo.ESTADO === false
                ? 0
                : encargo.ESTADO,
            FECHA_RECEPCION: encargo.FECHA_RECEPCION,
            FECHA_ENTREGA: encargo.FECHA_ENTREGA,
            FASE: encargo.FASE || "No especificada",
            PERSONA_DESTINATARIO: encargo.PERSONA_DESTINATARIO || "-",
          }))
          .sort(
            (a, b) =>
              b.ESTADO - a.ESTADO ||
              new Date(b.FECHA_RECEPCION).getTime() -
                new Date(a.FECHA_RECEPCION).getTime()
          )
      );
    } catch (err) {
      console.error("Error en fetchEncargos:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los encargos",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    fetchEncargos();
    const interval = setInterval(fetchEncargos, 8000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  useEffect(() => {
    if (activeTab === "history") {
      setFilter({
        nroDpto: "",
        descripcion: "",
        fechaRecepcion: "",
        estado: "1",
      });
    }
  }, [activeTab]);

  const fetchAllPhases = async () => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el token de autenticación",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/all-phases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al obtener las fases");
      }
      const data = await response.json();
      const phases = [
        { value: "all", label: "Todas las fases" },
        ...data.map((phase) => ({
          value: phase.FASE,
          label: phase.FASE,
        })),
      ];
      setPhaseOptions(phases);
    } catch (error) {
      console.error("Error en fetchAllPhases:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las fases",
        timer: 2000,
        showConfirmButton: false,
      });
      setPhaseOptions([{ value: "all", label: "Todas las fases" }]);
    }
  };

  const fetchPersons = async (query, criteria, phase) => {
    if (!token) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el token de autenticación",
        timer: 2000,
        showConfirmButton: false,
      });
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const url =
        phase && phase !== "all"
          ? `${API_URL}?criteria=${criteria}&query=${encodeURIComponent(
              query
            )}&phase=${encodeURIComponent(phase)}`
          : `${API_URL}?criteria=${criteria}&query=${encodeURIComponent(
              query
            )}`;
      console.log("URL de fetchPersons:", url);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error del servidor");
      }
      const data = await response.json();
      console.log("Respuesta de fetchPersons:", JSON.stringify(data, null, 2));
      if (data.length === 0) {
        Swal.fire({
          icon: "info",
          title: "Sin resultados",
          text: "No se encontraron personas que coincidan con los criterios de búsqueda.",
          timer: 2000,
          showConfirmButton: false,
        });
        setResults([]);
        setHasSearched(true);
        return;
      }

      const resultsWithAssociatedUsers = data.map((person, index) => ({
        index,
        ID_PERSONA: person.ID_PERSONA,
        NOMBRES: person.NOMBRES,
        APELLIDOS: person.APELLIDOS,
        DNI: person.DNI,
        ID_DEPARTAMENTO: person.ID_DEPARTAMENTO,
        NRO_DPTO: person.NRO_DPTO,
        FASE: person.FASE,
        ES_PROPIETARIO: person.ES_PROPIETARIO,
        USUARIOS_ASOCIADOS:
          person.USUARIOS_ASOCIADOS.map((user) => ({
            ID_PERSONA: user.ID_PERSONA,
            NOMBRES: user.NOMBRES,
            APELLIDOS: user.APELLIDOS,
            DNI: user.DNI,
            ES_PROPIETARIO: user.ID_CLASIFICACION === 1,
          })) || [],
      }));

      console.log(
        "Resultados finales con USUARIOS_ASOCIADOS:",
        JSON.stringify(resultsWithAssociatedUsers, null, 2)
      );
      setResults(resultsWithAssociatedUsers);
      setShowSearchResults(true);
      setHasSearched(true);
    } catch (error) {
      console.error("Error en fetchPersons:", error);
      let errorMessage = "No se pudo realizar la búsqueda.";
      if (error.message.includes("Criterio de búsqueda inválido")) {
        errorMessage = "Por favor, selecciona un criterio de búsqueda válido.";
      } else if (error.message.includes("La consulta no puede estar vacía")) {
        errorMessage = "La consulta de búsqueda no puede estar vacía.";
      } else if (error.message.includes("al menos 3 caracteres")) {
        errorMessage = "La consulta debe tener al menos 3 caracteres.";
      } else if (
        error.message.includes("número de departamento debe ser válido")
      ) {
        errorMessage = "Ingresa un número de departamento válido.";
      } else if (error.message.includes("Error del servidor")) {
        errorMessage =
          "Error en el servidor. Por favor, intenta de nuevo más tarde.";
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        timer: 3000,
        showConfirmButton: false,
      });
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchCriteria) {
      Swal.fire({
        icon: "warning",
        title: "Criterio requerido",
        text: "Por favor, selecciona un criterio de búsqueda.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (searchCriteria === "name" && searchQuery.trim().length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Entrada inválida",
        text: "El nombre debe tener al menos 3 caracteres.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (searchCriteria === "dni" && searchQuery.trim().length < 3) {
      Swal.fire({
        icon: "warning",
        title: "Entrada inválida",
        text: "El DNI debe tener al menos 3 caracteres.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (searchCriteria === "department") {
      if (!searchQuery.trim() || isNaN(searchQuery) || searchQuery <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Entrada inválida",
          text: "Ingresa un número de departamento válido.",
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }
    }
    await fetchPersons(searchQuery, searchCriteria, selectedPhase);
    setSearchQuery("");
    setSelectedPhase("all");
  };

  const handleCriteriaChange = (e) => {
    const newCriteria = e.target.value;
    setSearchCriteria(newCriteria);
    setSearchQuery("");
    setSelectedPhase("all");
    setPhaseOptions([{ value: "all", label: "Todas las fases" }]);
    setResults([]);
    setSelectedMainResident(null);
    setPhoto(null);
    setPhotoPreview(null);
    setDescription("");
    setError("");
    setShowAssociatedUsers(false);
    setShowSearchResults(true);
    setHasSearched(false);
    stopCamera();
    if (newCriteria === "department") {
      fetchAllPhases();
    }
  };

  const handleDepartmentInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*$/.test(value)) {
      setSearchQuery(value);
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("getUserMedia no es compatible con este navegador");
      Swal.fire({
        icon: "error",
        title: "Navegador no compatible",
        text: "Este navegador no soporta el acceso a la cámara. Usa un navegador moderno como Chrome o Firefox.",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      console.log("Iniciando cámara...");
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Stream obtenido:", newStream);
      setStream(newStream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error al iniciar la cámara:", err.name, err.message);
      let errorMessage = "No se pudo acceder a la cámara.";
      if (err.name === "NotAllowedError") {
        errorMessage =
          "Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No se encontró una cámara en el dispositivo.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "La cámara está en uso por otra aplicación.";
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `${errorMessage} Verifica los permisos o usa 'Seleccionar Foto'.`,
        timer: 4000,
        showConfirmButton: false,
      });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    console.log("Deteniendo cámara...");
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Pista detenida:", track.kind);
      });
      setStream(null);
    }
    setIsCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log("Stream desasignado del elemento de video");
    }
  };

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      console.log("Asignando stream al elemento de video");
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current
            .play()
            .then(() => {
              console.log("Reproducción de video iniciada");
            })
            .catch((err) => {
              console.error("Error al reproducir el video:", err);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo reproducir el video de la cámara. Verifica la configuración.",
                timer: 3000,
                showConfirmButton: false,
              });
              stopCamera();
            });
        }
      };
    }

    return () => {
      if (isCameraActive) {
        console.log("Limpieza: Deteniendo cámara en useEffect");
        stopCamera();
      }
    };
  }, [isCameraActive, stream]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Falta el elemento de video o canvas");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se puede capturar la foto. Verifica que la cámara esté activa.",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log("Foto capturada desde el video");
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `captured-photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setPhoto(file);
          setPhotoPreview(URL.createObjectURL(file));
          console.log("Foto establecida y vista previa generada:", file.name);
          stopCamera();
        } else {
          console.error("No se pudo generar el blob de la foto");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo capturar la foto. Intenta de nuevo.",
            timer: 3000,
            showConfirmButton: false,
          });
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      console.log("Photo selected from file input:", file.name);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    document.getElementById("fileInput").value = null;
    stopCamera();
    console.log("Photo cleared");
  };

  const clearResidentSelection = () => {
    setSelectedMainResident(null);
    setShowAssociatedUsers(false);
    setShowSearchResults(true);
    setHasSearched(false);
    console.log("Resident selection cleared");
  };

  const toggleAssociatedUsers = () => {
    setShowAssociatedUsers(!showAssociatedUsers);
  };

  const toggleSearchResults = () => {
    setShowSearchResults(!showSearchResults);
  };

  const showConfirmationModal = async () => {
    if (!description.trim()) {
      setError("Por favor, describe el encargo.");
      Swal.fire({
        icon: "warning",
        title: "Descripción requerida",
        text: "Por favor, describe el encargo.",
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
    }
    if (!selectedMainResident) {
      setError("Selecciona un residente principal.");
      Swal.fire({
        icon: "warning",
        title: "Residente principal requerido",
        text: "Selecciona un residente principal para recoger el encargo.",
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
    }

    const modalContent = `
      <div style="text-align: left;">
        <p><strong>Persona Principal:</strong> ${
          selectedMainResident.NOMBRES
        } ${selectedMainResident.APELLIDOS}</p>
        <p><strong>Fase:</strong> ${
          selectedMainResident.FASE || "No especificada"
        }</p>
        <p><strong>Departamento:</strong> ${selectedMainResident.NRO_DPTO}</p>
        <p><strong>Descripción del encargo:</strong> ${description}</p>
        <p><strong>Foto:</strong> ${
          photo ? "Foto cargada" : "No se ha cargado ninguna foto"
        }</p>
      </div>
    `;

    const result = await Swal.fire({
      title: "Confirmar Registro",
      html: modalContent,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Registrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
    });

    return result.isConfirmed;
  };

  async function handleRegister() {
    console.log(
      "Estado de selectedMainResident:",
      JSON.stringify(selectedMainResident, null, 2)
    );
    console.log("Datos antes de registrar el encargo:", {
      description: description.trim(),
      personId: selectedMainResident?.ID_PERSONA,
      department: selectedMainResident?.ID_DEPARTAMENTO,
      receptionistId: userId || "0",
      hasPhoto: !!photo,
    });

    const cleanDescription = description
      .trim()
      .replace(
        /N[úu]mero de Documento: \d+|Departamento: \d+ \(Fase[^)]+\)/gi,
        ""
      )
      .trim();

    if (!cleanDescription || cleanDescription.length < 5) {
      setError(
        "La descripción del encargo debe tener al menos 5 caracteres y no puede estar vacía."
      );
      Swal.fire({
        icon: "warning",
        title: "Descripción inválida",
        text: "Por favor, proporciona una descripción válida para el encargo (mínimo 5 caracteres).",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const confirmed = await showConfirmationModal();
    if (!confirmed) return;

    if (
      !selectedMainResident?.ID_PERSONA ||
      !selectedMainResident?.ID_DEPARTAMENTO
    ) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debe seleccionar una persona principal y un departamento válido.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", cleanDescription);
      formData.append("personId", selectedMainResident.ID_PERSONA.toString());
      formData.append(
        "department",
        selectedMainResident.ID_DEPARTAMENTO.toString()
      );
      formData.append("receptionistId", userId || "0");
      if (photo) {
        formData.append("photo", photo);
        formData.append(
          "photoFormat",
          photo.name.split(".").pop().toLowerCase()
        );
      }

      // Depuración: Verificar contenido de FormData
      for (let [key, value] of formData.entries()) {
        console.log(`FormData - ${key}:`, value);
      }

      const response = await fetch(`${API_URL}/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log("Respuesta de la API:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Encargo registrado correctamente",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchEncargos();
      setDescription("");
      setSelectedMainResident(null);
      setPhoto(null);
      setPhotoPreview(null);
      setError("");
    } catch (error) {
      console.error("Error en handleRegister:", error);
      const errorMessage = error.message.includes("residente activo")
        ? `No se pudo registrar el encargo: La persona (ID: ${selectedMainResident?.ID_PERSONA}) no está registrada como residente activo en el departamento (ID: ${selectedMainResident?.ID_DEPARTAMENTO}). Verifica los datos.`
        : error.message || "No se pudo registrar el encargo.";
      setError(errorMessage);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  }

const handleMarkDelivered = async (idEncargo) => {
    const usersResponse = await fetch(
      `${API_URL}?criteria=department&query=${
        encargos.find((e) => e.ID_ENCARGO === idEncargo)?.NRO_DPTO
      }`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!usersResponse.ok) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la lista de personas",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    const deptData = await usersResponse.json();
    const users = deptData.map((person) => ({
      ID_PERSONA: person.ID_PERSONA,
      NOMBRES: person.NOMBRES,
      APELLIDOS: person.APELLIDOS,
      DNI: person.DNI,
      ES_PROPIETARIO: person.ID_CLASIFICACION === 1,
    }));

    const userOptions = users.map((user) => ({
      value: user.ID_PERSONA,
      label: `${user.NOMBRES} ${user.APELLIDOS} (DNI: ${user.DNI})${
        user.ES_PROPIETARIO ? " (Propietario)" : ""
      }`,
    }));

    let selectedPersonId = null;

    const result = await Swal.fire({
      title: "Seleccionar persona que retira",
      html: `
        <div class="text-left font-sans p-4">
          <div class="mb-4">
            <label for="swal-input1" class="block text-sm font-medium text-gray-600 mb-2">Persona que retira</label>
            <select id="swal-input1" class="swal2-select w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecciona una persona</option>
              ${userOptions
                .map(
                  (user) =>
                    `<option value="${user.value}">${user.label}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-600 mb-2">Foto de entrega (obligatoria)</label>
            <div id="photo-preview" class="mb-2"></div>
            <div class="flex gap-2">
              <button id="select-photo-btn" type="button" class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                Seleccionar Foto
              </button>
              <button id="take-photo-btn" type="button" class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h2l2-2h4l2 2h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Tomar Foto
              </button>
              <button id="remove-photo-btn" type="button" class="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors hidden">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Eliminar Foto
              </button>
            </div>
            <input type="file" id="delivery-photo-input" class="swal2-file hidden" accept="image/jpeg,image/png">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      customClass: {
        popup: "swal2-popup-custom",
        confirmButton:
          "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
        cancelButton:
          "bg-red-500 text-white px-4 py-2 rounded hover:bg-red-500",
      },
      didOpen: () => {
        const popup = Swal.getPopup();
        popup.style.maxWidth = "750px";
        popup.style.width = "90%";
        popup.style.overflow = "hidden";

        const selectPhotoBtn = document.getElementById("select-photo-btn");
        const takePhotoBtn = document.getElementById("take-photo-btn");
        const removePhotoBtn = document.getElementById("remove-photo-btn");
        const photoInput = document.getElementById("delivery-photo-input");

        selectPhotoBtn.addEventListener("click", () => {
          photoInput.click();
        });

        photoInput.addEventListener("change", (e) => {
          handleDeliveryPhotoChange(e);
        });

        takePhotoBtn.addEventListener("click", () => {
          startDeliveryCamera();
        });

        removePhotoBtn.addEventListener("click", () => {
          clearDeliveryPhoto();
        });
      },
      preConfirm: () => {
        selectedPersonId = document.getElementById("swal-input1").value;
        if (!selectedPersonId) {
          Swal.showValidationMessage("Debes seleccionar una persona");
          return false;
        }
        if (!deliveryPhotoRef.current) {
          Swal.showValidationMessage("La foto de entrega es obligatoria");
          return false;
        }
        return true;
      },
      willClose: () => {
        stopDeliveryCamera();
      },
    });

    if (!result.isConfirmed || !selectedPersonId) {
      stopDeliveryCamera();
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("personId", selectedPersonId.toString());
      if (deliveryPhotoRef.current) {
        formData.append("photo", deliveryPhotoRef.current);
      }

      for (let [key, value] of formData.entries()) {
        console.log(`FormData (markDelivered) - ${key}:`, value);
      }

      const response = await fetch(`${API_URL}/${idEncargo}/deliver`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log("Respuesta de la API (markDelivered):", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}`);
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Encargo marcado como entregado",
        timer: 1500,
        showConfirmButton: false,
      });

      await fetchEncargos();
      setDeliveryPhoto(null);
      setDeliveryPhotoPreview(null);
    } catch (error) {
      console.error("Error en handleMarkDelivered:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo marcar el encargo como entregado",
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
      stopDeliveryCamera();
    }
  };

  const fetchAssociatedUsers = async (nroDpto, phase) => {
    try {
      const url =
        phase && phase !== "all"
          ? `${API_URL}?criteria=department&query=${encodeURIComponent(
              nroDpto
            )}&phase=${encodeURIComponent(phase)}`
          : `${API_URL}?criteria=department&query=${encodeURIComponent(
              nroDpto
            )}`;
      console.log("URL de fetchAssociatedUsers:", url); // Log para depurar la URL
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Error al obtener personas asociadas");
      }
      const data = await response.json();
      console.log(
        "Datos recibidos en fetchAssociatedUsers:",
        JSON.stringify(data, null, 2)
      );
      return data.map((person) => ({
        ID_PERSONA: person.ID_PERSONA,
        NOMBRES: person.NOMBRES,
        APELLIDOS: person.APELLIDOS,
        DNI: person.DNI,
        ES_PROPIETARIO: person.ID_CLASIFICACION === 1,
        DETALLE_CLASIFICACION:
          person.ID_CLASIFICACION === 1
            ? "Propietario"
            : person.DETALLE_CLASIFICACION || "Residente",
      }));
    } catch (error) {
      console.error("Error en fetchAssociatedUsers:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las personas asociadas",
        timer: 2000,
        showConfirmButton: false,
      });
      return [];
    }
  };

  const showDetailsModal = async (encargo) => {
    const associatedUsers = await fetchAssociatedUsers(encargo.NRO_DPTO);
    const photoUrl =
      encargo.TIENE_FOTO > 0
        ? `${API_URL}/photos/${encargo.ID_ENCARGO}?tipo=PAQUETE`
        : null;
    const deliveredPhotoUrl =
      encargo.TIENE_FOTO_ENTREGA > 0
        ? `${API_URL}/photos/${encargo.ID_ENCARGO}?tipo=ENTREGA`
        : null;
    const token = localStorage.getItem("token");

    // Filter out the main person from associated users
    const filteredAssociatedUsers = associatedUsers.filter(
      (user) => user.DNI !== encargo.DNI
    );

    // Get delivery person details
    const deliveryPerson =
      encargo.ESTADO === 0 && encargo.ENTREGADO_A && encargo.ENTREGADO_A !== "-"
        ? { NOMBRES_APELLIDOS: encargo.ENTREGADO_A, DNI: encargo.DNI_ENTREGADO }
        : null;

    // Define modal content to reuse in both initial and "Atrás" scenarios
    const getModalContent = () => `
    <div class="text-left font-sans p-4">
      <div class="mb-4">
        <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${
          encargo.ESTADO === 1
            ? "bg-blue-100 text-blue-700"
            : "bg-green-100 text-green-700"
        }">
          ${encargo.ESTADO === 1 ? "Pendiente" : "Entregado"}
        </span>
      </div>
      ${
        encargo.ESTADO === 0
          ? `
            <div class="flex border-b border-gray-200 mb-4">
              <button id="tab-antes" class="tab-button px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600 focus:outline-none active-tab" data-tab="antes">Previo</button>
              <button id="tab-despues" class="tab-button px-4 py-2 text-sm font-medium text-gray-600 border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 focus:outline-none" data-tab="despues">Entregado</button>
            </div>
          `
          : ""
      }
      <div id="tab-content-antes" class="tab-content ${
        encargo.ESTADO === 0 ? "block" : "block"
      }">
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            Persona Principal
          </h3>
          <p class="text-gray-600">
            ${encargo.PERSONA_DESTINATARIO || "No asignado"} (DNI: ${
      encargo.DNI || "-"
    }) 
            ${
              encargo.TIPO_RESIDENTE && encargo.TIPO_RESIDENTE !== "-"
                ? `<span class="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full ml-2">${encargo.TIPO_RESIDENTE}</span>`
                : ""
            }
          </p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Personas Asociadas
          </h3>
          ${
            filteredAssociatedUsers.length > 0
              ? `<div class="grid gap-2">
                  ${filteredAssociatedUsers
                    .map(
                      (user) => `
                        <div class="bg-gray-50 border border-gray-100 rounded-md p-2 flex justify-between items-center">
                          <span class="text-gray-600">${user.NOMBRES} ${
                        user.APELLIDOS
                      } (DNI: ${user.DNI})</span>
                          ${
                            user.ES_PROPIETARIO
                              ? `<span class="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full">Propietario</span>`
                              : `<span class="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">${
                                  user.DETALLE_CLASIFICACION || "Residente"
                                }</span>`
                          }
                        </div>`
                    )
                    .join("")}
                </div>`
              : '<p class="text-gray-500">No hay personas asociadas</p>'
          }
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            Descripción del Encargo
          </h3>
          <p class="text-gray-600">${encargo.DESCRIPCION}</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center">
            <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            Foto del Encargo
          </h3>
          <div id="photo-container" class="text-gray-600">
            ${
              photoUrl
                ? `<button id="show-photo-btn" class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">Ver Foto <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M19 12a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>`
                : "No disponible"
            }
          </div>
        </div>
      </div>
      ${
        encargo.ESTADO === 0 && deliveryPerson
          ? `
            <div id="tab-content-despues" class="tab-content hidden">
              <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Persona que Recibió
                </h3>
                <p class="text-gray-600">
                  ${deliveryPerson.NOMBRES_APELLIDOS} (DNI: ${
              deliveryPerson.DNI
            })
                </p>
              </div>
              <div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Foto de Entrega
                </h3>
                <div id="delivered-photo-container" class="text-gray-600">
                  ${
                    deliveredPhotoUrl
                      ? `<button id="show-delivered-photo-btn" class="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">Ver Foto de Entrega <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M19 12a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></button>`
                      : "No disponible"
                  }
                </div>
              </div>
            </div>
          `
          : ""
      }
    </div>
    <style>
      .tab-content {
        display: none;
      }
      .tab-content.block {
        display: block;
      }
      .tab-button.active-tab {
        color: #2563eb;
        border-bottom: 2px solid #2563eb;
      }
    </style>
  `;

    // Function to show the main details modal
    const showMainModal = () => {
      Swal.fire({
        title: `Detalles del Encargo #${encargo.ID_ENCARGO}`,
        html: getModalContent(),
        showConfirmButton: true,
        confirmButtonText: "Cerrar",
        customClass: {
          popup: "swal2-popup-custom",
          confirmButton:
            "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
        },
        didOpen: () => {
          const popup = Swal.getPopup();
          popup.style.maxWidth = "750px";
          popup.style.width = "90%";

          // Tab switching logic
          const antesTab = document.getElementById("tab-antes");
          const despuesTab = document.getElementById("tab-despues");
          const antesContent = document.getElementById("tab-content-antes");
          const despuesContent = document.getElementById("tab-content-despues");

          if (antesTab && despuesTab && antesContent && despuesContent) {
            antesTab.addEventListener("click", () => {
              antesTab.classList.add("active-tab");
              despuesTab.classList.remove("active-tab");
              antesContent.classList.add("block");
              despuesContent.classList.remove("block");
            });
            despuesTab.addEventListener("click", () => {
              despuesTab.classList.add("active-tab");
              antesTab.classList.remove("active-tab");
              despuesContent.classList.add("block");
              antesContent.classList.remove("block");
            });
          }

          // Function to show photo in a new modal
          const showPhotoInModal = async (url, title) => {
            try {
              const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!response.ok) {
                throw new Error(
                  `Error ${response.status}: ${response.statusText}`
                );
              }
              const blob = await response.blob();
              const imageUrl = URL.createObjectURL(blob);
              Swal.fire({
                title,
                html: `<img src="${imageUrl}" alt="${title}" class="max-w-[80vw] max-h-[80vh] w-auto h-auto rounded-lg shadow-sm object-contain" />`,
                showConfirmButton: true,
                confirmButtonText: "Atrás",
                customClass: {
                  popup: "swal2-popup-custom",
                  confirmButton:
                    "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600",
                },
                didOpen: () => {
                  const newPopup = Swal.getPopup();
                  newPopup.style.maxWidth = "90vw";
                  newPopup.style.maxHeight = "90vh";
                  newPopup.style.width = "auto";
                  newPopup.style.padding = "1rem";
                },
                willClose: () => {
                  URL.revokeObjectURL(imageUrl); // Clean up the object URL
                },
                preConfirm: () => {
                  // Reopen the main modal when "Atrás" is clicked
                  showMainModal();
                  return false; // Prevent the photo modal from closing until explicitly handled
                },
              });
            } catch (error) {
              console.error(`Error al cargar la foto: ${error.message}`);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo cargar la foto. Verifica tu conexión o inicia sesión nuevamente.",
                timer: 3000,
                showConfirmButton: false,
              });
            }
          };

          // Handle "Ver Foto" button click
          const showPhotoBtn = document.getElementById("show-photo-btn");
          if (showPhotoBtn && photoUrl) {
            showPhotoBtn.addEventListener("click", () => {
              showPhotoInModal(photoUrl, "Foto del Encargo");
            });
          }

          // Handle "Ver Foto de Entrega" button click
          const showDeliveredPhotoBtn = document.getElementById(
            "show-delivered-photo-btn"
          );
          if (showDeliveredPhotoBtn && deliveredPhotoUrl) {
            showDeliveredPhotoBtn.addEventListener("click", () => {
              showPhotoInModal(deliveredPhotoUrl, "Foto de Entrega");
            });
          }
        },
      });
    };

    // Open the main modal initially
    showMainModal();
  };

  const filteredEncargos = encargos.filter((encargo) => {
    const fechaRecepcion = formatDate(encargo.FECHA_RECEPCION);
    return (
      (filter.nroDpto === "" ||
        encargo.NRO_DPTO.toString().includes(filter.nroDpto)) &&
      (filter.descripcion === "" ||
        encargo.DESCRIPCION.toLowerCase().includes(
          filter.descripcion.toLowerCase()
        )) &&
      (filter.fechaRecepcion === "" ||
        fechaRecepcion === filter.fechaRecepcion) &&
      (filter.estado === "" || encargo.ESTADO.toString() === filter.estado)
    );
  });

  const exportToCSV = () => {
    const headers =
      "ID Encargo,Fase,Número Dpto,Persona Destinatario,Fecha Recepción,Fecha Entrega,Recepcionista,Estado\n";
    const rows = filteredEncargos
      .map((encargo) => {
        return `${encargo.ID_ENCARGO},${encargo.FASE || "No especificada"},${
          encargo.NRO_DPTO
        },${encargo.PERSONA_DESTINATARIO || "-"},${formatDate(
          encargo.FECHA_RECEPCION
        )},${formatDate(encargo.FECHA_ENTREGA)},${
          encargo.RECEPCIONISTA || "-"
        },${encargo.ESTADO === 1 ? "Pendiente" : "Entregado"}`;
      })
      .join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "encargos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Archivo CSV exportado correctamente",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const clearFilters = () => {
    setFilter({
      nroDpto: "",
      descripcion: "",
      fechaRecepcion: "",
      estado: "1",
    });
  };

  const startDeliveryCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      Swal.fire({
        icon: "error",
        title: "Navegador no compatible",
        text: "Este navegador no soporta el acceso a la cámara. Usa un navegador moderno como Chrome o Firefox.",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      console.log("Iniciando cámara de entrega...");
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Stream de entrega obtenido:", newStream);
      setDeliveryStream(newStream);
      setIsDeliveryCameraActive(true);
    } catch (err) {
      console.error(
        "Error al iniciar la cámara de entrega:",
        err.name,
        err.message
      );
      let errorMessage = "No se pudo acceder a la cámara.";
      if (err.name === "NotAllowedError") {
        errorMessage =
          "Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No se encontró una cámara en el dispositivo.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "La cámara está en uso por otra aplicación.";
      }
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `${errorMessage} Verifica los permisos o usa 'Seleccionar Foto'.`,
        timer: 4000,
        showConfirmButton: false,
      });
      setIsDeliveryCameraActive(false);
    }
  };

  const stopDeliveryCamera = () => {
    console.log("Deteniendo cámara de entrega...");
    if (deliveryStream) {
      deliveryStream.getTracks().forEach((track) => {
        track.stop();
        console.log("Pista de entrega detenida:", track.kind);
      });
      setDeliveryStream(null);
    }
    setIsDeliveryCameraActive(false);
    if (deliveryVideoRef.current) {
      deliveryVideoRef.current.srcObject = null;
      console.log("Stream de entrega desasignado del elemento de video");
    }
  };

  useEffect(() => {
    if (isDeliveryCameraActive && deliveryStream && deliveryVideoRef.current) {
      console.log("Asignando stream de entrega al elemento de video");
      deliveryVideoRef.current.srcObject = deliveryStream;
      deliveryVideoRef.current.onloadedmetadata = () => {
        if (deliveryVideoRef.current) {
          deliveryVideoRef.current
            .play()
            .then(() => {
              console.log("Reproducción de video de entrega iniciada");
            })
            .catch((err) => {
              console.error("Error al reproducir el video de entrega:", err);
              Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo reproducir el video de la cámara. Verifica la configuración.",
                timer: 3000,
                showConfirmButton: false,
              });
              stopDeliveryCamera();
            });
        }
      };
    }

    return () => {
      if (isDeliveryCameraActive) {
        console.log("Limpieza: Deteniendo cámara de entrega en useEffect");
        stopDeliveryCamera();
      }
    };
  }, [isDeliveryCameraActive, deliveryStream]);

  const captureDeliveryPhoto = () => {
    if (!deliveryVideoRef.current || !deliveryCanvasRef.current) {
      console.error("Falta el elemento de video o canvas para entrega");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se puede capturar la foto. Verifica que la cámara esté activa.",
        timer: 3000,
        showConfirmButton: false,
      });
      return;
    }
    const canvas = deliveryCanvasRef.current;
    const video = deliveryVideoRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log("Foto de entrega capturada desde el video");
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `delivery-photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setDeliveryPhoto(file);
          setDeliveryPhotoPreview(URL.createObjectURL(file));
          console.log(
            "Foto de entrega establecida y vista previa generada:",
            file.name
          );

          // Actualizar el contenedor photo-preview en el modal de SweetAlert2
          const photoPreview = document.getElementById("photo-preview");
          if (photoPreview) {
            photoPreview.innerHTML = `<img src="${URL.createObjectURL(
              file
            )}" alt="Vista previa" class="max-w-[150px] max-h-[150px] object-contain border border-gray-300 rounded mt-2" />`;
            const removePhotoBtn = document.getElementById("remove-photo-btn");
            if (removePhotoBtn) {
              removePhotoBtn.classList.remove("hidden");
            }
          } else {
            console.error("No se encontró el contenedor photo-preview");
          }

          stopDeliveryCamera();
        } else {
          console.error("No se pudo generar el blob de la foto de entrega");
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo capturar la foto. Intenta de nuevo.",
            timer: 3000,
            showConfirmButton: false,
          });
        }
      },
      "image/jpeg",
      0.95
    );
  };

  const handleDeliveryPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeliveryPhoto(file);
      setDeliveryPhotoPreview(URL.createObjectURL(file));
      console.log("Foto de entrega seleccionada desde archivo:", file.name);

      // Actualizar el contenedor photo-preview en el modal de SweetAlert2
      const photoPreview = document.getElementById("photo-preview");
      if (photoPreview) {
        photoPreview.innerHTML = `<img src="${URL.createObjectURL(
          file
        )}" alt="Vista previa" class="max-w-[150px] max-h-[150px] object-contain border border-gray-300 rounded mt-2" />`;
        const removePhotoBtn = document.getElementById("remove-photo-btn");
        if (removePhotoBtn) {
          removePhotoBtn.classList.remove("hidden");
        }
      } else {
        console.error("No se encontró el contenedor photo-preview");
      }
    }
  };

  const clearDeliveryPhoto = () => {
    setDeliveryPhoto(null);
    setDeliveryPhotoPreview(null);
    const photoInput = document.getElementById("delivery-photo-input");
    if (photoInput) {
      photoInput.value = null;
    }
    const photoPreview = document.getElementById("photo-preview");
    if (photoPreview) {
      photoPreview.innerHTML = "";
    }
    const removePhotoBtn = document.getElementById("remove-photo-btn");
    if (removePhotoBtn) {
      removePhotoBtn.classList.add("hidden");
    }
    stopDeliveryCamera();
    console.log("Foto de entrega eliminada");
  };

  return (
    <Container>
      <Title>Gestión de Encargos</Title>
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
          >
            Registrar Encargo
          </TabButton>
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          >
            Historial de Encargos
          </TabButton>
        </div>
      </div>
      <TabContent>
        {activeTab === "create" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              Registrar Nuevo Encargo
            </h2>
            {error && (
              <p className="text-red-500 mb-4 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="space-y-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Buscar por:
                </label>
                <SelectInput
                  value={searchCriteria}
                  onChange={handleCriteriaChange}
                >
                  <option value="">Selecciona un criterio</option>
                  <option value="name">Apellidos y Nombres</option>
                  <option value="dni">Número de Documento</option>
                  <option value="department">Departamento</option>
                </SelectInput>
              </div>
              {searchCriteria && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    {searchCriteria === "name"
                      ? "Apellidos y Nombres"
                      : searchCriteria === "dni"
                      ? "Número de Documento"
                      : "Número de Departamento"}
                  </label>
                  <SearchContainer>
                    {searchCriteria === "department" && (
                      <SelectInput
                        value={selectedPhase}
                        onChange={(e) => setSelectedPhase(e.target.value)}
                        title="Seleccionar fase del edificio"
                      >
                        {phaseOptions.map((phase) => (
                          <option key={phase.value} value={phase.value}>
                            {phase.label}
                          </option>
                        ))}
                      </SelectInput>
                    )}
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        if (searchCriteria === "department") {
                          handleDepartmentInputChange(e);
                        } else {
                          setSearchQuery(e.target.value);
                        }
                      }}
                      placeholder={
                        searchCriteria === "name"
                          ? "Escribe para buscar..."
                          : searchCriteria === "dni"
                          ? "Ingresa el Número de Documento..."
                          : "Ingresa el número de departamento..."
                      }
                      title={
                        searchCriteria === "name"
                          ? "Ingresa el nombre completo"
                          : searchCriteria === "dni"
                          ? "Ingresa el Número de Documento"
                          : "Ingresa el número de departamento"
                      }
                    />
                    {searchCriteria !== "department" && <div />}
                    <Button
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleSearch}
                      disabled={isLoading}
                      title="Buscar residente"
                    >
                      {isLoading ? (
                        <Spinner className="mr-2" />
                      ) : (
                        <FaSearch className="mr-2" />
                      )}
                      {isLoading ? "Buscando..." : "Buscar"}
                    </Button>
                  </SearchContainer>
                </div>
              )}
              {results.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Resultados de la búsqueda
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        className="bg-gray-600 text-white hover:bg-gray-700 text-xs py-1 px-2"
                        onClick={clearResidentSelection}
                        title="Limpiar selección de residente"
                      >
                        <FaTimes className="mr-1" />
                        Limpiar Selección
                      </Button>
                      <ToggleButton
                        onClick={toggleSearchResults}
                        title={
                          showSearchResults
                            ? "Ocultar resultados"
                            : "Mostrar resultados"
                        }
                      >
                        {showSearchResults ? (
                          <>
                            <FaChevronUp className="mr-2" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <FaChevronDown className="mr-2" />
                            Mostrar
                          </>
                        )}
                      </ToggleButton>
                    </div>
                  </div>
                  {showSearchResults && (
                    <Table>
                      <thead>
                        <tr>
                          <TableHeader>Seleccionar</TableHeader>
                          <TableHeader>Fase</TableHeader>
                          <TableHeader>Departamento</TableHeader>
                          <TableHeader>Nombre</TableHeader>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => (
                          <TableRow
                            key={`resident-${result.index}`}
                            $delay={index * 0.1}
                          >
                            <TableCell>
                              <Input
                                type="radio"
                                name="mainResident"
                                value={result.index}
                                checked={
                                  selectedMainResident?.index === result.index
                                }
                                onChange={() => {
                                  setSelectedMainResident(result);
                                  setShowSearchResults(false);
                                  console.log(
                                    "Selected resident index:",
                                    result.index
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {result.FASE || "No especificada"}
                            </TableCell>
                            <TableCell>{result.NRO_DPTO}</TableCell>
                            <TableCell>{`${result.NOMBRES} ${
                              result.APELLIDOS
                            } (DNI: ${result.DNI})${
                              result.ES_PROPIETARIO ? " (Propietario)" : ""
                            }`}</TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}
              {results.length === 0 &&
                searchCriteria &&
                !isLoading &&
                hasSearched && (
                  <div className="mb-6 text-center text-gray-500">
                  </div>
                )}
              {selectedMainResident && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Persona Principal Seleccionada
                  </h3>
                  <ResidentCard>
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-500" />
                      <span className="font-semibold text-gray-700">
                        {selectedMainResident.NOMBRES}{" "}
                        {selectedMainResident.APELLIDOS}
                      </span>
                      {selectedMainResident.ES_PROPIETARIO && (
                        <Badge>Propietario</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaIdCard className="text-gray-500" />
                      <span className="text-gray-600">
                        Número de Documento: {selectedMainResident.DNI}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-gray-500" />
                      <span className="text-gray-600">
                        Departamento: {selectedMainResident.NRO_DPTO} (
                        {selectedMainResident.FASE || "No especificada"})
                      </span>
                    </div>
                  </ResidentCard>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Personas Asociadas al Departamento
                    </h3>
                    <ToggleButton
                      onClick={toggleAssociatedUsers}
                      title={
                        showAssociatedUsers
                          ? "Ocultar personas asociadas"
                          : "Mostrar personas asociadas"
                      }
                    >
                      {showAssociatedUsers ? (
                        <>
                          <FaChevronUp className="mr-2" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <FaChevronDown className="mr-2" />
                          Mostrar
                        </>
                      )}
                    </ToggleButton>
                  </div>
                  {showAssociatedUsers && (
                    <AssociatedUsersContainer>
                      {selectedMainResident.USUARIOS_ASOCIADOS.filter(
                        (user) =>
                          user.ID_PERSONA !== selectedMainResident.ID_PERSONA
                      ).map((user) => (
                        <UserCard key={user.ID_PERSONA}>
                          <UserInfo>
                            <FaUser className="text-gray-500" />
                            <span className="text-gray-700">
                              {user.NOMBRES} {user.APELLIDOS}
                            </span>
                          </UserInfo>
                          <UserInfo>
                            <span className="text-gray-600">
                              Número de Documento: {user.DNI}
                            </span>
                            {user.ES_PROPIETARIO && <Badge>Propietario</Badge>}
                          </UserInfo>
                        </UserCard>
                      ))}
                    </AssociatedUsersContainer>
                  )}
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Descripción del Encargo
                </label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 255))}
                  placeholder="Ejemplo: Paquete de Amazon con ropa"
                  title="Describe el paquete (máx. 255 caracteres)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/255 caracteres
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Foto del Paquete
                </label>
                <div className="flex gap-2">
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => document.getElementById("fileInput").click()}
                    title="Seleccionar foto desde el dispositivo"
                  >
                    <FaFileExport className="mr-2" />
                    Seleccionar Foto
                  </Button>
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={isCameraActive ? stopCamera : startCamera}
                    title={
                      isCameraActive
                        ? "Cerrar cámara"
                        : "Tomar foto con la cámara"
                    }
                  >
                    <FaCamera className="mr-2" />
                    {isCameraActive ? "Cerrar Cámara" : "Tomar Foto"}
                  </Button>
                  {photoPreview && (
                    <Button
                      className="bg-red-600 text-white hover:bg-red-700"
                      onClick={clearPhoto}
                      title="Eliminar foto seleccionada"
                    >
                      <FaTimes className="mr-2" />
                      Eliminar Foto
                    </Button>
                  )}
                </div>
                <Input
                  id="fileInput"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoChange}
                  style={{ display: "none" }}
                />
                {isCameraActive && (
                  <CameraModal>
                    <CameraContainer>
                      <Video ref={videoRef} autoPlay playsInline />
                      <CameraButtonContainer>
                        <Button
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={capturePhoto}
                          title="Capturar foto desde la cámara"
                        >
                          <FaCamera className="mr-2" />
                          Capturar
                        </Button>
                        <Button
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={stopCamera}
                          title="Cerrar cámara"
                        >
                          <FaTimes className="mr-2" />
                          Cerrar
                        </Button>
                      </CameraButtonContainer>
                    </CameraContainer>
                  </CameraModal>
                )}
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {photoPreview && (
                  <ImagePreview
                    src={photoPreview}
                    alt="Vista previa del paquete"
                  />
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={handleRegister}
                  disabled={isLoading}
                  title="Registrar nuevo encargo"
                >
                  <FaSave className="mr-2" />
                  {isLoading ? "Registrando..." : "Registrar Encargo"}
                </Button>
              </div>
            </div>
          </Card>
        )}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              Historial de Encargos
            </h2>
            <FilterContainer>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Número de Departamento
                </label>
                <Input
                  type="text"
                  name="nroDpto"
                  value={filter.nroDpto}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^[0-9]*$/.test(value))
                      setFilter((prev) => ({ ...prev, nroDpto: value }));
                  }}
                  placeholder="Ejemplo: 101"
                  title="Filtrar por número de departamento"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Descripción
                </label>
                <Input
                  type="text"
                  name="descripcion"
                  value={filter.descripcion}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                  placeholder="Ejemplo: Paquete de Amazon"
                  title="Filtrar por descripción del encargo"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Fecha de Recepción
                </label>
                <Input
                  type="date"
                  name="fechaRecepcion"
                  value={filter.fechaRecepcion}
                  onChange={(e) =>
                    setFilter((prev) => ({
                      ...prev,
                      fechaRecepcion: e.target.value,
                    }))
                  }
                  title="Filtrar por fecha de recepción"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Estado
                </label>
                <SelectInput
                  name="estado"
                  value={filter.estado}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, estado: e.target.value }))
                  }
                  title="Filtrar por estado del encargo"
                >
                  <option value="">Todos los estados</option>
                  <option value="1">Pendientes</option>
                  <option value="0">Entregados</option>
                </SelectInput>
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={exportToCSV}
                  title="Exportar tabla a CSV"
                >
                  <FaFileExport className="mr-2" />
                  Exportar
                </Button>
                <Button
                  className="bg-gray-600 text-white hover:bg-gray-700"
                  onClick={clearFilters}
                  title="Limpiar todos los filtros"
                >
                  <FaTimes className="mr-2" />
                  Limpiar
                </Button>
              </div>
            </FilterContainer>
            <div className="overflow-x-auto mt-6">
              <Table>
                <thead>
                  <tr>
                    <TableHeader title="Identificador único del encargo">
                      ID Encargo
                    </TableHeader>
                    <TableHeader title="Fase del edificio">Fase</TableHeader>
                    <TableHeader title="Número del departamento">
                      Nº Dpto
                    </TableHeader>
                    <TableHeader title="Persona que recibirá el encargo">
                      Persona Destinatario
                    </TableHeader>
                    <TableHeader title="Fecha de recepción del paquete">
                      Fecha Recepción
                    </TableHeader>
                    <TableHeader title="Fecha de entrega del paquete">
                      Fecha Entrega
                    </TableHeader>
                    <TableHeader title="Persona que recibió el paquete">
                      Recepcionista
                    </TableHeader>
                    <TableHeader title="Mostrar detalles del encargo">
                      Mostrar Datos
                    </TableHeader>
                    <TableHeader title="Estado actual del encargo">
                      Estado
                    </TableHeader>
                    <TableHeader title="Acciones disponibles">
                      Acciones
                    </TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredEncargos.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-gray-500 py-4"
                      >
                        No hay encargos que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEncargos.map((encargo, index) => (
                      <TableRow
                        key={encargo.ID_ENCARGO}
                        $estado={encargo.ESTADO}
                        $delay={index * 0.1}
                      >
                        <TableCell>{encargo.ID_ENCARGO}</TableCell>
                        <TableCell>
                          {encargo.FASE || "No especificada"}
                        </TableCell>
                        <TableCell>{encargo.NRO_DPTO}</TableCell>
                        <TableCell>
                          {encargo.PERSONA_DESTINATARIO || "-"}
                        </TableCell>
                        <TableCell>
                          {formatDate(encargo.FECHA_RECEPCION)}
                        </TableCell>
                        <TableCell>
                          {formatDate(encargo.FECHA_ENTREGA)}
                        </TableCell>
                        <TableCell>{encargo.RECEPCIONISTA || "-"}</TableCell>
                        <TableCell>
                          <Button
                            className="bg-blue-600 text-white hover:bg-blue-700 text-xs py-1 px-2"
                            onClick={() => showDetailsModal(encargo)}
                            title="Ver detalles del encargo"
                          >
                            <FaEye className="mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              encargo.ESTADO === 1
                                ? "bg-blue-100 text-[#2563eb]"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {encargo.ESTADO === 1 ? "Pendiente" : "Entregado"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {encargo.ESTADO === 1 && (
                            <Button
                              className="bg-blue-600 text-white hover:bg-blue-700 text-xs py-1 px-2"
                              onClick={() =>
                                handleMarkDelivered(encargo.ID_ENCARGO)
                              }
                              title="Marcar como entregado"
                            >
                              <FaCheck className="mr-1" />
                              Entregar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        )}
        {isCameraActive && (
          <CameraModal>
            <CameraContainer>
              <Video ref={videoRef} autoPlay playsInline />
              <CameraButtonContainer>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={capturePhoto}
                  title="Capturar foto desde la cámara"
                >
                  <FaCamera className="mr-2" />
                  Capturar
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={stopCamera}
                  title="Cerrar cámara"
                >
                  <FaTimes className="mr-2" />
                  Cerrar
                </Button>
              </CameraButtonContainer>
            </CameraContainer>
          </CameraModal>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {isDeliveryCameraActive && (
          <CameraModal $isDelivery={true}>
            <CameraContainer>
              <Video ref={deliveryVideoRef} autoPlay playsInline />
              <CameraButtonContainer>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={captureDeliveryPhoto}
                  title="Capturar foto desde la cámara"
                >
                  <FaCamera className="mr-2" />
                  Capturar
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={stopDeliveryCamera}
                  title="Cerrar cámara"
                >
                  <FaTimes className="mr-2" />
                  Cerrar
                </Button>
              </CameraButtonContainer>
            </CameraContainer>
          </CameraModal>
        )}
        <canvas ref={deliveryCanvasRef} style={{ display: "none" }} />
      </TabContent>
    </Container>
  );
};

export default RegisterOrder;
