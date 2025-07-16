import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import styled, { keyframes } from "styled-components";
import { FaBox, FaSave, FaFileExport, FaCheck, FaSearch, FaCamera, FaTimes, FaUser, FaIdCard, FaBuilding, FaChevronDown, FaChevronUp } from "react-icons/fa";

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
        content: '';
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
  z-index: 1000;
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
  const [phaseOptions, setPhaseOptions] = useState([{ value: "all", label: "Todas las fases" }]);
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  const fetchEncargos = async () => {
    try {
      const response = await fetch(`${API_URL}/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener los encargos");
      const data = await response.json();
      setEncargos(
        data
          .map((encargo) => ({
            ...encargo,
            ESTADO: encargo.ESTADO === true ? 1 : encargo.ESTADO === false ? 0 : encargo.ESTADO,
            FECHA_RECEPCION: encargo.FECHA_RECEPCION,
            FECHA_ENTREGA: encargo.FECHA_ENTREGA,
          }))
          .sort(
            (a, b) =>
              b.ESTADO - a.ESTADO ||
              new Date(b.FECHA_RECEPCION).getTime() - new Date(a.FECHA_RECEPCION).getTime()
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
      setFilter({ nroDpto: "", descripcion: "", fechaRecepcion: "", estado: "1" });
    }
  }, [activeTab]);

  const fetchPhases = async (nroDpto) => {
    if (!nroDpto || isNaN(nroDpto)) {
      setPhaseOptions([{ value: "all", label: "Todas las fases" }]);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/phases?nroDpto=${encodeURIComponent(nroDpto)}`, {
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
      console.error("Error en fetchPhases:", error);
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
      const url = phase && phase !== "all"
        ? `${API_URL}?criteria=${criteria}&query=${encodeURIComponent(query)}&phase=${encodeURIComponent(phase)}`
        : `${API_URL}?criteria=${criteria}&query=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al buscar personas");
      }
      const data = await response.json();
      setResults(
        data.map((person, index) => ({
          index,
          ID_PERSONA: person.ID_PERSONA,
          NOMBRES: person.NOMBRES,
          APELLIDOS: person.APELLIDOS,
          DNI: person.DNI,
          ID_DEPARTAMENTO: person.ID_DEPARTAMENTO,
          NRO_DPTO: person.NRO_DPTO,
          FASE: person.FASE,
          ES_PROPIETARIO: person.ES_PROPIETARIO,
          USUARIOS_ASOCIADOS: person.USUARIOS_ASOCIADOS,
        }))
      );
    } catch (error) {
      console.error("Error en fetchPersons:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo realizar la búsqueda",
        timer: 2000,
        showConfirmButton: false,
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
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
    if (searchCriteria === "department" && !searchQuery.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Entrada inválida",
        text: "Ingresa un número de departamento válido.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    fetchPersons(searchQuery, searchCriteria, selectedPhase);
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
    stopCamera();
  };

  const handleDepartmentInputChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]*$/.test(value)) {
      setSearchQuery(value);
      fetchPhases(value);
    }
  };

  const startCamera = async () => {
    try {
      console.log("Attempting to start camera...");
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      console.log("Camera stream obtained:", newStream);
      setStream(newStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().then(() => {
          console.log("Video playback started");
        }).catch((err) => {
          console.error("Error playing video:", err);
        });
      } else {
        console.error("Video ref is not available");
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo acceder a la cámara. Verifica los permisos o usa 'Seleccionar Foto'.",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  const stopCamera = () => {
    console.log("Stopping camera...");
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
        console.log("Camera track stopped:", track);
      });
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error("Video or canvas ref is missing");
      return;
    }
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    console.log("Photo captured from video");
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "captured-photo.jpg", { type: "image/jpeg" });
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
        console.log("Photo set and preview generated");
        stopCamera();
      } else {
        console.error("Failed to generate photo blob");
      }
    }, "image/jpeg");
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
    console.log("Resident selection cleared");
  };

  const toggleAssociatedUsers = () => {
    setShowAssociatedUsers(!showAssociatedUsers);
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
        <p><strong>Persona Principal:</strong> ${selectedMainResident.NOMBRES} ${selectedMainResident.APELLIDOS}</p>
        <p><strong>Fase:</strong> ${selectedMainResident.FASE}</p>
        <p><strong>Departamento:</strong> ${selectedMainResident.NRO_DPTO}</p>
        <p><strong>Descripción del encargo:</strong> ${description}</p>
        <p><strong>Foto:</strong> ${photo ? "Foto cargada" : "No se ha cargado ninguna foto"}</p>
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

  const handleRegister = async () => {
    const confirmed = await showConfirmationModal();
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("personId", selectedMainResident.ID_PERSONA);
      formData.append("department", selectedMainResident.ID_DEPARTAMENTO);
      formData.append("receptionistId", userId || "0");
      if (photo) {
        formData.append("photo", photo);
      }

      const response = await fetch(`${API_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al registrar el encargo");
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Encargo registrado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      await fetchEncargos();
      setDescription("");
      setSearchQuery("");
      setSelectedPhase("all");
      setPhaseOptions([{ value: "all", label: "Todas las fases" }]);
      setResults([]);
      setSelectedMainResident(null);
      setPhoto(null);
      setPhotoPreview(null);
      setError("");
      setSearchCriteria("");
      setFilter({ nroDpto: "", descripcion: "", fechaRecepcion: "", estado: "1" });
      setActiveTab("history");
      setShowAssociatedUsers(false);
      stopCamera();
    } catch (error) {
      console.error("Error en handleRegister:", error);
      setError(error.message || "No se pudo registrar el encargo.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo registrar el encargo.",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkDelivered = async (idEncargo) => {
    const usersResponse = await fetch(
      `${API_URL}?criteria=department&query=${encargos.find(e => e.ID_ENCARGO === idEncargo)?.NRO_DPTO}`,
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
    const users = deptData.map(person => ({
      ID_PERSONA: person.ID_PERSONA,
      NOMBRES: person.NOMBRES,
      APELLIDOS: person.APELLIDOS,
      DNI: person.DNI,
      ES_PROPIETARIO: person.ES_PROPIETARIO,
    }));

    const userOptions = users.map((user) => ({
      value: user.ID_PERSONA,
      label: `${user.NOMBRES} ${user.APELLIDOS} (DNI: ${user.DNI})${user.ES_PROPIETARIO ? " (Propietario)" : ""}`,
    }));

    const { value: selectedPersonId, inputValue: photoFile } = await Swal.fire({
      title: "Seleccionar persona que retira",
      html: `
        <select id="swal-input1" class="swal2-select">
          <option value="">Selecciona una persona</option>
          ${userOptions
            .map((user) => `<option value="${user.value}">${user.label}</option>`)
            .join("")}
        </select>
        <div style="margin-top: 1rem;">
          <label for="swal-input2" class="swal2-file-label">Foto de entrega</label>
          <input type="file" id="swal-input2" class="swal2-file" accept="image/jpeg,image/png">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      preConfirm: () => {
        const personId = document.getElementById("swal-input1").value;
        const photoInput = document.getElementById("swal-input2").files[0];
        if (!personId) {
          Swal.showValidationMessage("Debes seleccionar una persona");
          return false;
        }
        return { personId, photoFile: photoInput };
      },
    });

    if (!selectedPersonId) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("personId", selectedPersonId);
      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const response = await fetch(`${API_URL}/${idEncargo}/deliver`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Error al marcar como entregado");

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Encargo marcado como entregado",
        timer: 2000,
        showConfirmButton: false,
      });

      await fetchEncargos();
    } catch (error) {
      console.error("Error en handleMarkDelivered:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo marcar el encargo como entregado",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEncargos = encargos.filter((encargo) => {
    const fechaRecepcion = formatDate(encargo.FECHA_RECEPCION);
    return (
      (filter.nroDpto === "" || encargo.NRO_DPTO.toString().includes(filter.nroDpto)) &&
      (filter.descripcion === "" ||
        encargo.DESCRIPCION.toLowerCase().includes(filter.descripcion.toLowerCase())) &&
      (filter.fechaRecepcion === "" || fechaRecepcion === filter.fechaRecepcion) &&
      (filter.estado === "" || encargo.ESTADO.toString() === filter.estado)
    );
  });

  const exportToCSV = () => {
    const headers =
      "ID Encargo,Número Dpto,Fase,Descripción,Fecha Recepción,Fecha Entrega,Recepcionista,Entregado A,Usuarios Asociados,Estado\n";
    const rows = filteredEncargos
      .map((encargo) => {
        return `${encargo.ID_ENCARGO},${encargo.NRO_DPTO},${encargo.FASE || "-"},${encargo.DESCRIPCION},${formatDate(
          encargo.FECHA_RECEPCION
        )},${formatDate(encargo.FECHA_ENTREGA)},${encargo.RECEPCIONISTA || "-"},${
          encargo.ENTREGADO_A || "-"
        },${encargo.USUARIOS_ASOCIADOS || "-"},${encargo.ESTADO === 1 ? "Pendiente" : "Entregado"}`;
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
    setFilter({ nroDpto: "", descripcion: "", fechaRecepcion: "", estado: "1" });
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
            <h2 className="text-lg font-semibold mb-4">Registrar Nuevo Encargo</h2>
            {error && (
              <p className="text-red-500 mb-4 bg-red-50 p-2 rounded-lg">{error}</p>
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
                  <option value="name">Nombre</option>
                  <option value="dni">DNI</option>
                  <option value="department">Departamento</option>
                </SelectInput>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {searchCriteria === "name"
                    ? "Nombres y Apellidos"
                    : searchCriteria === "dni"
                    ? "DNI"
                    : "Número de Departamento"}
                </label>
                <div className="flex gap-2">
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
                        ? "Ingresa el DNI..."
                        : "Ingresa el número de departamento..."
                    }
                  />
                  {searchCriteria === "department" && (
                    <SelectInput
                      value={selectedPhase}
                      onChange={(e) => setSelectedPhase(e.target.value)}
                    >
                      {phaseOptions.map((phase) => (
                        <option key={phase.value} value={phase.value}>
                          {phase.label}
                        </option>
                      ))}
                    </SelectInput>
                  )}
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleSearch}
                    disabled={isLoading}
                    title="Buscar residente"
                  >
                    <FaSearch className="mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
              {results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">
                    Resultados de la búsqueda
                  </h3>
                  <div className="flex justify-end mb-2">
                    <Button
                      className="bg-gray-600 text-white hover:bg-gray-700 text-xs py-1 px-2"
                      onClick={clearResidentSelection}
                      title="Limpiar selección de residente"
                    >
                      <FaTimes className="mr-1" />
                      Limpiar Selección
                    </Button>
                  </div>
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
                        <TableRow key={`resident-${result.index}`} $delay={index * 0.1}>
                          <TableCell>
                            <Input
                              type="radio"
                              name="mainResident"
                              value={result.index}
                              checked={selectedMainResident?.index === result.index}
                              onChange={() => {
                                setSelectedMainResident(result);
                                console.log("Selected resident index:", result.index);
                              }}
                            />
                          </TableCell>
                          <TableCell>{result.FASE}</TableCell>
                          <TableCell>{result.NRO_DPTO}</TableCell>
                          <TableCell>{`${result.NOMBRES} ${result.APELLIDOS} (DNI: ${result.DNI})${result.ES_PROPIETARIO ? " (Propietario)" : ""}`}</TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
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
                        {selectedMainResident.NOMBRES} {selectedMainResident.APELLIDOS}
                      </span>
                      {selectedMainResident.ES_PROPIETARIO && (
                        <Badge>Propietario</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <FaIdCard className="text-gray-500" />
                      <span className="text-gray-600">DNI: {selectedMainResident.DNI}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaBuilding className="text-gray-500" />
                      <span className="text-gray-600">
                        Departamento: {selectedMainResident.NRO_DPTO} ({selectedMainResident.FASE})
                      </span>
                    </div>
                  </ResidentCard>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-600">
                      Personas Asociadas al Departamento
                    </h3>
                    <ToggleButton
                      onClick={toggleAssociatedUsers}
                      title={showAssociatedUsers ? "Ocultar personas asociadas" : "Mostrar personas asociadas"}
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
                      {selectedMainResident.USUARIOS_ASOCIADOS.map((user) => (
                        <UserCard key={user.ID_PERSONA}>
                          <UserInfo>
                            <FaUser className="text-gray-500" />
                            <span className="text-gray-700">
                              {user.NOMBRES} {user.APELLIDOS}
                            </span>
                          </UserInfo>
                          <UserInfo>
                            <span className="text-gray-600">DNI: {user.DNI}</span>
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
                    title={isCameraActive ? "Cerrar cámara" : "Tomar foto con la cámara"}
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
                  <ImagePreview src={photoPreview} alt="Vista previa del paquete" />
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
            <h2 className="text-lg font-semibold mb-4">Historial de Encargos</h2>
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
                  onChange={(e) => setFilter((prev) => ({ ...prev, descripcion: e.target.value }))}
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
                  onChange={(e) => setFilter((prev) => ({ ...prev, fechaRecepcion: e.target.value }))}
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
                  onChange={(e) => setFilter((prev) => ({ ...prev, estado: e.target.value }))}
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
                    <TableHeader title="Identificador único del encargo">ID Encargo</TableHeader>
                    <TableHeader title="Número del departamento">Nº Dpto</TableHeader>
                    <TableHeader title="Fase del edificio">Fase</TableHeader>
                    <TableHeader title="Descripción del paquete">Descripción</TableHeader>
                    <TableHeader title="Fecha de recepción del paquete">Fecha Recepción</TableHeader>
                    <TableHeader title="Fecha de entrega del paquete">Fecha Entrega</TableHeader>
                    <TableHeader title="Persona que recibió el paquete">Recepcionista</TableHeader>
                    <TableHeader title="Persona que retiró el paquete">Entregado A</TableHeader>
                    <TableHeader title="Usuarios asociados al departamento">Usuarios Asociados</TableHeader>
                    <TableHeader title="Estado actual del encargo">Estado</TableHeader>
                    <TableHeader title="Acciones disponibles">Acciones</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {filteredEncargos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-gray-500 py-4">
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
                        <TableCell>{encargo.NRO_DPTO}</TableCell>
                        <TableCell>{encargo.FASE || "-"}</TableCell>
                        <TableCell>{encargo.DESCRIPCION}</TableCell>
                        <TableCell>{formatDate(encargo.FECHA_RECEPCION)}</TableCell>
                        <TableCell>{formatDate(encargo.FECHA_ENTREGA)}</TableCell>
                        <TableCell>{encargo.RECEPCIONISTA || "-"}</TableCell>
                        <TableCell>{encargo.ENTREGADO_A || "-"}</TableCell>
                        <TableCell>{encargo.USUARIOS_ASOCIADOS || "-"}</TableCell>
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
                              onClick={() => handleMarkDelivered(encargo.ID_ENCARGO)}
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
      </TabContent>
    </Container>
  );
};

export default RegisterOrder;