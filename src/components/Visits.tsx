import React, { useState, useEffect, useCallback, useRef } from "react";
import styled from "styled-components";
import Select from "react-select";
import {
  FaSearch,
  FaSave,
  FaSignOutAlt,
  FaCheck,
  FaFileExport,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "../context/AuthContext";

// Estilos
const Container = styled.div`
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #1f2937;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ active }) => (active ? "#2563eb" : "#4b5563")};
  border-bottom: ${({ active }) => (active ? "2px solid #2563eb" : "none")};
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #2563eb;
  }
`;

const TabContent = styled.div`
  margin-top: 1.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  border: 1px solid #e5e7eb;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }

  &[type="text"][readonly] {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const SelectNative = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #1f2937;
  background: white;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }

  &:disabled {
    background-color: #f3f4f6;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  background: #2563eb;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const TableRow = styled.tr<{
  $estado: number;
  $delay: number;
  $isHighlighted?: boolean;
}>`
  background: ${({ $isHighlighted }) => ($isHighlighted ? "#f0fdf4" : "white")};
  animation: fadeIn 0.5s ease-in-out;
  animation-delay: ${({ $delay }) => $delay}s;
  transition: background 0.3s ease;

  td {
    border-bottom: 1px solid #e5e7eb;
    font-size: 0.875rem;
    color: ${({ $estado }) => ($estado === 1 ? "#1f2937" : "#6b7280")};
  }

  &:hover {
    background: #f9fafb;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MotivoCell = styled.td`
  cursor: pointer;
  &:hover {
    text-decoration: underline;
    color: #2563eb;
  }
`;

const customSelectStyles = {
  control: (provided: any) => ({
    ...provided,
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.875rem",
    color: "#1f2937",
    background: "white",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#2563eb",
    },
    "&:focus": {
      borderColor: "#2563eb",
      boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.1)",
    },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    fontSize: "0.875rem",
    color: "#1f2937",
    background: state.isSelected ? "#2563eb" : state.isFocused ? "#f3f4f6" : "white",
    "&:hover": {
      background: "#f3f4f6",
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "#9ca3af",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "#1f2937",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "#1f2937",
  }),
};

// Interfaces
interface Fase {
  ID_FASE: number;
  NOMBRE: string;
}

interface Residente {
  ID_RESIDENTE: number;
  NOMBRE_COMPLETO: string;
}

interface Departamento {
  ID_DEPARTAMENTO: number;
  NRO_DPTO: number;
}

interface Visitante {
  ID_VISITA: number;
  NRO_DPTO: number | null;
  NOMBRE_VISITANTE: string;
  NRO_DOC_VISITANTE: string;
  ID_TIPO_DOC_VISITANTE: number | null;
  FECHA_INGRESO: string;
  HORA_INGRESO: string;
  FECHA_SALIDA: string | null;
  HORA_SALIDA: string | null;
  MOTIVO: string;
  ID_USUARIO_REGISTRO: number;
  ID_RESIDENTE: number;
  NOMBRE_PROPIETARIO: string;
  ESTADO: number | boolean;
  NOMBRE_FASE: string;
}

interface VisitaProgramada {
  ID_VISITA_PROGRAMADA: number;
  NRO_DPTO: number;
  NOMBRE_VISITANTE: string;
  DNI_VISITANTE: string;
  ID_TIPO_DOC_VISITANTE: number | null;
  FECHA_LLEGADA: string;
  HORA_LLEGADA: string | null;
  MOTIVO: string;
  ID_RESIDENTE: number;
  NOMBRE_PROPIETARIO: string;
  ESTADO: number | boolean;
  NOMBRE_FASE: string;
}

interface FilterState {
  estado: string;
  nroDpto: string;
  nombre: string;
  fase: string;
}

interface FilterScheduledState {
  nroDpto: string;
  nombre: string;
  fecha: string;
  fase: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const Visits = () => {
  const { userId } = useAuth();

  // Estados
  const [dni, setDni] = useState("");
  const [tipoDoc, setTipoDoc] = useState<string>("");
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [idFase, setIdFase] = useState("");
  const [nroDpto, setNroDpto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [idResidente, setIdResidente] = useState("");
  const [fases, setFases] = useState<Fase[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [visitas, setVisitas] = useState<Visitante[]>([]);
  const [visitasProgramadas, setVisitasProgramadas] = useState<VisitaProgramada[]>([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [highlightedVisitId, setHighlightedVisitId] = useState<number | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    estado: "todos",
    nroDpto: "",
    nombre: "",
    fase: "",
  });
  const [filterScheduled, setFilterScheduled] = useState<FilterScheduledState>({
    nroDpto: "",
    nombre: "",
    fecha: "",
    fase: "",
  });

  // Refs for form fields
  const tipoDocRef = useRef<HTMLSelectElement>(null);
  const dniRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const nombreVisitanteRef = useRef<HTMLInputElement>(null);
  const idFaseRef = useRef<HTMLSelectElement>(null);
  const nroDptoRef = useRef<any>(null); // react-select ref
  const idResidenteRef = useRef<HTMLSelectElement>(null);
  const motivoRef = useRef<HTMLInputElement>(null);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  const currentDate = new Date().toISOString().split("T")[0];

  // Funciones de formato
  const formatDate = (date: string | Date): string => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatTime = (date: Date): string => {
    try {
      return date.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Lima",
      });
    } catch {
      return "-";
    }
  };

  // Handle Enter key press
  const handleEnterKey = (e: React.KeyboardEvent, nextField: React.RefObject<any>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextField.current) {
        if (nextField === nroDptoRef) {
          nextField.current.focus();
        } else if (nextField === searchButtonRef) {
          nextField.current.click();
        } else if (nextField === saveButtonRef) {
          nextField.current.click();
        } else {
          nextField.current.focus();
          if (nextField.current.tagName === "SELECT") {
            nextField.current.click();
          }
        }
      }
    }
  };

  // Mostrar modal con motivo completo
  const showMotivoModal = (motivo: string) => {
    Swal.fire({
      title: "Motivo de la Visita",
      text: motivo,
      confirmButtonText: "Cerrar",
      customClass: {
        confirmButton: "bg-blue-600 text-white hover:bg-blue-700",
      },
    });
  };

  // Manejo de cambios en inputs
  const handleIdFaseChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setIdFase(value);
      setNroDpto("");
      setDepartamentos([]);
      setResidentes([]);
      setIdResidente("");
      if (value) {
        fetchDepartamentos(value);
      }
    },
    []
  );

  const handleNroDptoChange = useCallback(
    (selectedOption: any) => {
      const value = selectedOption ? selectedOption.value : "";
      setNroDpto(value);
      setError("");
      setResidentes([]);
      setIdResidente("");
      if (value) {
        fetchResidents(value);
      }
    },
    []
  );

  const handleMotivoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value.length <= 80) {
        setMotivo(value);
        setError("");
      }
    },
    []
  );

  const handleNombreVisitanteChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.toUpperCase();
      setNombreVisitante(value);
      setError("");
    },
    []
  );

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilter((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Fetch functions
  const fetchFases = async () => {
    try {
      const response = await fetch(`${API_URL}/fases`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener fases");
      const data = await response.json();
      setFases(data);
    } catch (err) {
      console.error("Error al obtener fases:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las fases",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const fetchDepartamentos = async (idFase: string) => {
    if (!idFase) {
      setDepartamentos([]);
      return;
    }
    try {
      const response = await fetch(
        `${API_URL}/departamentosFase?id_fase=${idFase}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Error al obtener departamentos");
      const data = await response.json();
      setDepartamentos(data);
    } catch (err) {
      console.error("Error al obtener departamentos:", err);
      setDepartamentos([]);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los departamentos",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const fetchResidents = async (nroDpto: string) => {
    if (!nroDpto || isNaN(parseInt(nroDpto))) {
      setResidentes([]);
      setIdResidente("");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/owners?nro_dpto=${nroDpto}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener residentes");
      const data = await response.json();
      setResidentes(data);
      if (data.length === 0) {
        setIdResidente("");
        setError("No se encontraron residentes para este departamento");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Error al obtener residentes:", err);
      setResidentes([]);
      setIdResidente("");
      setError("No se pudieron cargar los residentes");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los residentes",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleSearchDni = async () => {
    if (!tipoDoc) {
      setError("Por favor, seleccione el tipo de documento");
      return;
    }
    if (tipoDoc === "2" && !/^[0-9]{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos");
      return;
    }
    if (!/^[a-zA-Z0-9]{8,12}$/.test(dni)) {
      setError(
        "El número de documento debe tener entre 8 y 12 caracteres alfanuméricos"
      );
      return;
    }
    setError("");
    if (tipoDoc === "2") {
      try {
        const response = await fetch(`${API_URL}/dni?dni=${dni}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (!response.ok) throw new Error("Error al buscar el documento");
        const data = await response.json();
        setNombreVisitante(data.nombreCompleto.toUpperCase());
        idFaseRef.current?.focus();
      } catch (err) {
        setError("No se pudo encontrar el documento");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo encontrar el documento",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } else {
      nombreVisitanteRef.current?.focus();
    }
  };

  const handleSaveVisit = async () => {
    if (
      !tipoDoc ||
      !nombreVisitante ||
      !dni ||
      !idFase ||
      !nroDpto ||
      !idResidente ||
      !motivo
    ) {
      setError("Por favor, complete todos los campos");
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, complete todos los campos",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!userId) {
      setError("No se encontró el ID del usuario autenticado");
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Por favor, inicia sesión nuevamente",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    setError("");
    try {
      const now = new Date();
      const localDate = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Lima" })
      );
      const fechaIngreso = localDate
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      const response = await fetch(`${API_URL}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nombre_visitante: nombreVisitante,
          nro_doc_visitante: dni,
          id_residente: idResidente,
          fecha_ingreso: fechaIngreso,
          motivo,
          id_usuario_registro: userId,
          id_tipo_doc_visitante: tipoDoc,
          estado: 1,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al grabar la visita");
      }
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Visita registrada correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchVisits();
      setDni("");
      setTipoDoc("");
      setNombreVisitante("");
      setIdFase("");
      setNroDpto("");
      setMotivo("");
      setIdResidente("");
      setDepartamentos([]);
      setResidentes([]);
      setActiveTab("history");
      const data = await response.json();
      setHighlightedVisitId(data.ID_VISITA || null);
      setTimeout(() => {
        setHighlightedVisitId(null);
      }, 10000);
      tipoDocRef.current?.focus();
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error al grabar la visita");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo registrar la visita",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const fetchVisits = async () => {
    try {
      const response = await fetch(`${API_URL}/visits`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener las visitas");
      const data = await response.json();
      const normalizedData = data.map((visit: Visitante) => {
        let fechaIngreso = visit.FECHA_INGRESO;
        let horaIngreso = "";
        let fechaSalida = null;
        let horaSalida = null;

        if (fechaIngreso) {
          if (typeof fechaIngreso === "string" && fechaIngreso.includes("T")) {
            const date = new Date(fechaIngreso);
            fechaIngreso = formatDate(date);
            horaIngreso = formatTime(date);
          }
        }

        if (visit.FECHA_SALIDA) {
          const date = new Date(visit.FECHA_SALIDA);
          fechaSalida = formatDate(date);
          horaSalida = formatTime(date);
        }

        return {
          ...visit,
          FECHA_INGRESO: fechaIngreso,
          HORA_INGRESO: horaIngreso,
          FECHA_SALIDA: fechaSalida,
          HORA_SALIDA: horaSalida,
          ESTADO:
            visit.ESTADO === true
              ? 1
              : visit.ESTADO === false
              ? 0
              : visit.ESTADO,
        };
      });
      setVisitas(
        normalizedData.sort(
          (a: Visitante, b: Visitante) => b.ID_VISITA - a.ID_VISITA
        )
      );
    } catch (err) {
      console.error("Error al obtener las visitas:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las visitas",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const fetchScheduledVisits = async () => {
    try {
      const response = await fetch(`${API_URL}/all-scheduled-visits`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok)
        throw new Error("Error al obtener las visitas programadas");
      const data = await response.json();
      const normalizedData = data.map((visit: VisitaProgramada) => ({
        ...visit,
        FECHA_LLEGADA: formatDate(visit.FECHA_LLEGADA),
        ESTADO:
          visit.ESTADO === true ? 1 : visit.ESTADO === false ? 0 : visit.ESTADO,
      }));
      setVisitasProgramadas(
        normalizedData.sort(
          (a: VisitaProgramada, b: VisitaProgramada) =>
            new Date(a.FECHA_LLEGADA).getTime() -
            new Date(b.FECHA_LLEGADA).getTime()
        )
      );
    } catch (err) {
      console.error("Error al obtener las visitas programadas:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las visitas programadas",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleEndVisit = async (idVisita: number) => {
    if (!userId) {
      setError("No se encontró el ID del usuario autenticado");
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Por favor, inicia sesión nuevamente",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/end-visit/${idVisita}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id_usuario_registro: userId,
        }),
      });
      if (!response.ok) throw new Error("Error al terminar la visita");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Visita terminada correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchVisits();
    } catch (err) {
      console.error("Error al terminar la visita:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo terminar la visita",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleAcceptScheduledVisit = async (
    idVisitaProgramada: number,
    fechaLlegada: string
  ) => {
    if (!userId) {
      setError("No se encontró el ID del usuario autenticado");
      Swal.fire({
        icon: "error",
        title: "Error de autenticación",
        text: "Por favor, inicia sesión nuevamente",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const fechaLlegadaFormatted = formatDate(fechaLlegada);
    if (fechaLlegadaFormatted !== currentDate) {
      Swal.fire({
        icon: "warning",
        title: "Fecha no válida",
        text: "La visita solo puede ser aceptada el día de la fecha de llegada programada",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/accept-scheduled-visit/${idVisitaProgramada}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            id_usuario_registro: userId,
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al aceptar la visita");
      }
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Visita registrada correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchVisits();
      await fetchScheduledVisits();
      setActiveTab("history");
      const data = await response.json();
      setHighlightedVisitId(data.id_visita || null);
      setTimeout(() => {
        setHighlightedVisitId(null);
      }, 10000);
    } catch (err) {
      console.error("Error al aceptar la visita programada:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo registrar la visita",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      "ID Visita",
      "Fase",
      "Número Dpto",
      "Nombre Visitante",
      "Documento",
      "Tipo Doc",
      "Residente",
      "Fecha Ingreso",
      "Hora Ingreso",
      "Fecha Salida",
      "Hora Salida",
      "Motivo",
      "Estado",
    ];

    const rows = filteredVisitas.map((visita) => [
      visita.ID_VISITA,
      visita.NOMBRE_FASE ?? "-",
      visita.NRO_DPTO ?? "-",
      visita.NOMBRE_VISITANTE,
      visita.NRO_DOC_VISITANTE,
      visita.ID_TIPO_DOC_VISITANTE
        ? {
            2: "DNI",
            3: "Carnet de Extranjería",
            4: "Pasaporte",
            5: "Partida de Nacimiento",
            6: "Otros",
          }[visita.ID_TIPO_DOC_VISITANTE] || "-"
        : "-",
      visita.NOMBRE_PROPIETARIO ?? "-",
      visita.FECHA_INGRESO,
      visita.HORA_INGRESO,
      visita.FECHA_SALIDA ?? "-",
      visita.HORA_SALIDA ?? "-",
      visita.MOTIVO,
      visita.ESTADO === 1 ? "Activa" : "Terminada",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "historial_visitas.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredVisitas = visitas.filter((visita) => {
    const matchesEstado =
      filter.estado === "todos" ||
      (filter.estado === "activas" && visita.ESTADO === 1) ||
      (filter.estado === "terminadas" && visita.ESTADO === 0);
    const matchesFase =
      filter.fase === "" ||
      (visita.NOMBRE_FASE &&
        visita.NOMBRE_FASE === fases.find((f) => f.ID_FASE.toString() === filter.fase)?.NOMBRE);
    const matchesNroDpto =
      filter.nroDpto === "" ||
      (visita.NRO_DPTO && visita.NRO_DPTO.toString().includes(filter.nroDpto));
    const matchesNombre =
      filter.nombre === "" ||
      visita.NOMBRE_VISITANTE.toLowerCase().includes(
        filter.nombre.toLowerCase()
      );
    return matchesEstado && matchesFase && matchesNroDpto && matchesNombre;
  });

  const filteredVisitasProgramadas = visitasProgramadas.filter((visita) => {
    const matchesFase =
      filterScheduled.fase === "" ||
      (visita.NOMBRE_FASE &&
        visita.NOMBRE_FASE.toLowerCase().includes(
          filterScheduled.fase.toLowerCase()
        ));
    const matchesNroDpto =
      filterScheduled.nroDpto === "" ||
      visita.NRO_DPTO.toString().includes(filterScheduled.nroDpto);
    const matchesNombre =
      filterScheduled.nombre === "" ||
      visita.NOMBRE_VISITANTE.toLowerCase().includes(
        filterScheduled.nombre.toLowerCase()
      );
    const matchesFecha =
      filterScheduled.fecha === "" ||
      formatDate(visita.FECHA_LLEGADA) === formatDate(filterScheduled.fecha);
    return matchesFase && matchesNroDpto && matchesNombre && matchesFecha;
  });

  const departamentoOptions = departamentos.map((depto) => ({
    value: depto.NRO_DPTO.toString(),
    label: depto.NRO_DPTO.toString(),
  }));

  useEffect(() => {
    fetchFases();
    if (activeTab === "history") {
      fetchVisits();
    } else if (activeTab === "scheduled") {
      fetchScheduledVisits();
    }
  }, [activeTab]);

  return (
    <Container>
      <Title>Gestión de Visitas</Title>
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
          >
            Registrar Visita
          </TabButton>
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          >
            Historial de Visitas
          </TabButton>
          <TabButton
            active={activeTab === "scheduled"}
            onClick={() => setActiveTab("scheduled")}
          >
            Visitas Programadas
          </TabButton>
        </div>
      </div>

      <TabContent>
        {activeTab === "create" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              Registrar Nueva Visita
            </h2>
            {error && (
              <p className="text-red-500 mb-4 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Tipo de Documento *
                  </label>
                  <SelectNative
                    ref={tipoDocRef}
                    value={tipoDoc}
                    onChange={(e) => setTipoDoc(e.target.value)}
                    onKeyDown={(e) => handleEnterKey(e, dniRef)}
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    <option value="2">DNI</option>
                    <option value="3">Carnet de Extranjería</option>
                    <option value="4">Pasaporte</option>
                    <option value="5">Partida de Nacimiento</option>
                    <option value="6">Otros</option>
                  </SelectNative>
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Documento *
                  </label>
                  <div className="flex">
                    <Input
                      ref={dniRef}
                      type="text"
                      value={dni}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[a-zA-Z0-9]{0,12}$/.test(value)) {
                          setDni(value);
                        }
                      }}
                      onKeyDown={(e) =>
                        handleEnterKey(e, tipoDoc === "2" ? searchButtonRef : nombreVisitanteRef)
                      }
                      placeholder="Ejemplo: 7123XXXX o CE123456789"
                    />
                    {tipoDoc === "2" && (
                      <Button
                        ref={searchButtonRef}
                        className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
                        onClick={handleSearchDni}
                        onKeyDown={(e) => handleEnterKey(e, idFaseRef)}
                      >
                        <FaSearch />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {tipoDoc === "2"
                      ? "Ingresa el número y haz clic en buscar para verificar."
                      : "Ingresa el número de documento."}
                  </p>
                </div>
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre del Visitante *
                  </label>
                  <Input
                    ref={nombreVisitanteRef}
                    type="text"
                    value={nombreVisitante}
                    onChange={handleNombreVisitanteChange}
                    onKeyDown={(e) => handleEnterKey(e, idFaseRef)}
                    readOnly={tipoDoc === "2"}
                    placeholder="Ingrese el nombre en mayúsculas"
                    className={
                      tipoDoc === "2" ? "bg-gray-100 text-gray-700" : ""
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {tipoDoc === "2"
                      ? "Este campo se llena automáticamente tras buscar el documento."
                      : "Ingrese el nombre completo en mayúsculas."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fase *
                  </label>
                  <SelectNative
                    ref={idFaseRef}
                    value={idFase}
                    onChange={handleIdFaseChange}
                    onKeyDown={(e) => handleEnterKey(e, nroDptoRef)}
                    required
                  >
                    <option value="">Seleccione una fase</option>
                    {fases.map((fase) => (
                      <option key={fase.ID_FASE} value={fase.ID_FASE}>
                        {fase.NOMBRE}
                      </option>
                    ))}
                  </SelectNative>
                  <p className="text-xs text-gray-500 mt-1">
                    Seleccione la fase del departamento.
                  </p>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Departamento *
                  </label>
                  <Select
                    ref={nroDptoRef}
                    options={departamentoOptions}
                    value={
                      nroDpto
                        ? departamentoOptions.find(
                            (option) => option.value === nroDpto
                          )
                        : null
                    }
                    onChange={handleNroDptoChange}
                    onKeyDown={(e: React.KeyboardEvent) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        idResidenteRef.current?.focus();
                      }
                    }}
                    placeholder="Escribe o selecciona un departamento"
                    isClearable
                    isDisabled={!idFase}
                    styles={customSelectStyles}
                    noOptionsMessage={() => "No hay departamentos disponibles"}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Escribe para buscar o selecciona el número del departamento.
                  </p>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Residente *
                  </label>
                  <SelectNative
                    ref={idResidenteRef}
                    value={idResidente}
                    onChange={(e) => setIdResidente(e.target.value)}
                    onKeyDown={(e) => handleEnterKey(e, motivoRef)}
                    disabled={residentes.length === 0 || !nroDpto}
                    required
                  >
                    <option value="">Seleccione un residente</option>
                    {residentes.map((res) => (
                      <option key={res.ID_RESIDENTE} value={res.ID_RESIDENTE}>
                        {res.NOMBRE_COMPLETO}
                      </option>
                    ))}
                  </SelectNative>
                  <p className="text-xs text-gray-500 mt-1">
                    Seleccione el residente del departamento.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Motivo de la Visita *
                </label>
                <Input
                  ref={motivoRef}
                  type="text"
                  value={motivo}
                  onChange={handleMotivoChange}
                  onKeyDown={(e) => handleEnterKey(e, saveButtonRef)}
                  placeholder="Ejemplo: Reunión familiar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 80 caracteres. ({motivo.length}/80)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                ref={saveButtonRef}
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleSaveVisit}
              >
                <FaSave className="mr-2" />
                Grabar Visita
              </Button>
            </div>
          </Card>
        )}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Historial de Visitas</h2>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full md:w-3/4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Estado
                  </label>
                  <SelectNative
                    name="estado"
                    value={filter.estado}
                    onChange={handleFilterChange}
                  >
                    <option value="todos">Todos</option>
                    <option value="activas">Visitas Activas</option>
                    <option value="terminadas">Visitas Terminadas</option>
                  </SelectNative>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fase
                  </label>
                  <SelectNative
                    name="fase"
                    value={filter.fase}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todas</option>
                    {fases.map((fase) => (
                      <option key={fase.ID_FASE} value={fase.ID_FASE}>
                        {fase.NOMBRE}
                      </option>
                    ))}
                  </SelectNative>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Departamento
                  </label>
                  <Input
                    type="text"
                    name="nroDpto"
                    value={filter.nroDpto}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]*$/.test(value)) {
                        setFilter((prev) => ({ ...prev, nroDpto: value }));
                      }
                    }}
                    placeholder="Ejemplo: 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre del Visitante
                  </label>
                  <Input
                    type="text"
                    name="nombre"
                    value={filter.nombre}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por nombre"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 md:mt-0">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={exportToCSV}
                >
                  <FaFileExport className="mr-2" />
                  Exportar a CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      ID Visita
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fase
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Número Dpto
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Nombre Visitante
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Documento
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Tipo Doc
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Residente
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fecha Ingreso
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Hora Ingreso
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fecha Salida
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Hora Salida
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Motivo
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Estado
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="py-4 text-center text-gray-500"
                      >
                        No hay visitas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filteredVisitas.map((visita, index) => {
                      const estadoNum =
                        typeof visita.ESTADO === "boolean"
                          ? visita.ESTADO
                            ? 1
                            : 0
                          : visita.ESTADO;
                      return (
                        <TableRow
                          key={visita.ID_VISITA}
                          $estado={estadoNum}
                          $delay={index * 0.1}
                          $isHighlighted={
                            visita.ID_VISITA === highlightedVisitId
                          }
                        >
                          <td className="py-3 px-4">{visita.ID_VISITA}</td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_FASE ?? "-"}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NRO_DPTO ?? "-"}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_VISITANTE}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NRO_DOC_VISITANTE}
                          </td>
                          <td className="py-3 px-4">
                            {visita.ID_TIPO_DOC_VISITANTE
                              ? {
                                  2: "DNI",
                                  3: "Carnet de Extranjería",
                                  4: "Pasaporte",
                                  5: "Partida de Nacimiento",
                                  6: "Otros",
                                }[visita.ID_TIPO_DOC_VISITANTE] || "-"
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_PROPIETARIO ?? "-"}
                          </td>
                          <td className="py-3 px-4">{visita.FECHA_INGRESO}</td>
                          <td className="py-3 px-4">{visita.HORA_INGRESO}</td>
                          <td className="py-3 px-4">
                            {visita.FECHA_SALIDA ? visita.FECHA_SALIDA : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {visita.HORA_SALIDA ? visita.HORA_SALIDA : "-"}
                          </td>
                          {visita.MOTIVO.length > 16 ? (
                            <MotivoCell
                              className="py-3 px-4"
                              onClick={() => showMotivoModal(visita.MOTIVO)}
                            >
                              {visita.MOTIVO.slice(0, 16) + "..."}
                            </MotivoCell>
                          ) : (
                            <td className="py-3 px-4">{visita.MOTIVO}</td>
                          )}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                estadoNum === 1
                                  ? "bg-blue-100 text-[#2563eb]"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {estadoNum === 1 ? "Activa" : "Terminada"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {estadoNum === 1 ? (
                              <Button
                                className="bg-red-600 text-white hover:bg-red-700 px-2 py-1"
                                onClick={() => handleEndVisit(visita.ID_VISITA)}
                                title="Terminar Visita"
                              >
                                <FaSignOutAlt />
                              </Button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </TableRow>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        {activeTab === "scheduled" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Visitas Programadas</h2>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full md:w-3/4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fase
                  </label>
                  <Input
                    type="text"
                    name="fase"
                    value={filterScheduled.fase}
                    onChange={(e) =>
                      setFilterScheduled((prev) => ({
                        ...prev,
                        fase: e.target.value,
                      }))
                    }
                    placeholder="Ejemplo: Fase1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Departamento
                  </label>
                  <Input
                    type="text"
                    name="nroDpto"
                    value={filterScheduled.nroDpto}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]*$/.test(value)) {
                        setFilterScheduled((prev) => ({
                          ...prev,
                          nroDpto: value,
                        }));
                      }
                    }}
                    placeholder="Ejemplo: 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre del Visitante
                  </label>
                  <Input
                    type="text"
                    name="nombre"
                    value={filterScheduled.nombre}
                    onChange={(e) =>
                      setFilterScheduled((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Filtrar por nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha de Llegada
                  </label>
                  <Input
                    type="date"
                    name="fecha"
                    value={filterScheduled.fecha}
                    onChange={(e) =>
                      setFilterScheduled((prev) => ({
                        ...prev,
                        fecha: e.target.value,
                      }))
                    }
                    min={currentDate}
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      ID Visita
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fase
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Número Dpto
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Nombre Visitante
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Documento
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Tipo Doc
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Residente
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fecha Llegada
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Hora Tentativa
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Motivo
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitasProgramadas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="py-4 text-center text-gray-500"
                      >
                        No hay visitas programadas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filteredVisitasProgramadas.map((visita, index) => {
                      const estadoNum =
                        typeof visita.ESTADO === "boolean"
                          ? visita.ESTADO
                            ? 1
                            : 0
                          : visita.ESTADO;
                      const fechaLlegadaFormatted = formatDate(
                        visita.FECHA_LLEGADA
                      );
                      const isToday = fechaLlegadaFormatted === currentDate;
                      const currentDateObj = new Date(currentDate);
                      const fechaLlegadaDate = new Date(visita.FECHA_LLEGADA);
                      const isPastDate = fechaLlegadaDate < currentDateObj;
                      const isFutureDate = fechaLlegadaDate > currentDateObj;

                      return (
                        <TableRow
                          key={visita.ID_VISITA_PROGRAMADA}
                          $estado={estadoNum}
                          $delay={index * 0.1}
                        >
                          <td className="py-3 px-4">
                            {visita.ID_VISITA_PROGRAMADA}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_FASE ?? "-"}
                          </td>
                          <td className="py-3 px-4">{visita.NRO_DPTO}</td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_VISITANTE}
                          </td>
                          <td className="py-3 px-4">{visita.DNI_VISITANTE}</td>
                          <td className="py-3 px-4">
                            {visita.ID_TIPO_DOC_VISITANTE
                              ? {
                                  2: "DNI",
                                  3: "Carnet de Extranjería",
                                  4: "Pasaporte",
                                  5: "Partida de Nacimiento",
                                  6: "Otros",
                                }[visita.ID_TIPO_DOC_VISITANTE] || "-"
                              : "-"}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_PROPIETARIO ?? "-"}
                          </td>
                          <td className="py-3 px-4">{fechaLlegadaFormatted}</td>
                          <td className="py-3 px-4">
                            {(() => {
                              if (!visita.HORA_LLEGADA) {
                                return "-";
                              }
                              try {
                                let normalizedTime = visita.HORA_LLEGADA.trim();
                                if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
                                  normalizedTime = `${normalizedTime}:00`;
                                } else if (
                                  !/^\d{2}:\d{2}:\d{2}$/.test(normalizedTime)
                                ) {
                                  return "-";
                                }
                                const date = new Date(
                                  `1970-01-01T${normalizedTime}`
                                );
                                if (isNaN(date.getTime())) {
                                  return "-";
                                }
                                return date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                  timeZone: "America/Lima",
                                });
                              } catch (error) {
                                return "-";
                              }
                            })()}
                          </td>
                          {visita.MOTIVO.length > 16 ? (
                            <MotivoCell
                              className="py-3 px-4"
                              onClick={() => showMotivoModal(visita.MOTIVO)}
                            >
                              {visita.MOTIVO.slice(0, 16) + "..."}
                            </MotivoCell>
                          ) : (
                            <td className="py-3 px-4">{visita.MOTIVO}</td>
                          )}
                          <td className="py-3 px-4">
                            {estadoNum === 1 && isToday ? (
                              <Button
                                className="bg-green-600 text-white hover:bg-green-700 px-2 py-1"
                                onClick={() =>
                                  handleAcceptScheduledVisit(
                                    visita.ID_VISITA_PROGRAMADA,
                                    visita.FECHA_LLEGADA
                                  )
                                }
                                title="Registrar Visita"
                              >
                                <FaCheck />
                              </Button>
                            ) : (
                              <span className="text-gray-500">
                                {isPastDate
                                  ? "No se puede aceptar: Fecha pasada"
                                  : isFutureDate
                                  ? "No se puede aceptar: Fecha futura"
                                  : "Procesada"}
                              </span>
                            )}
                          </td>
                        </TableRow>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </TabContent>
    </Container>
  );
};

export default Visits;