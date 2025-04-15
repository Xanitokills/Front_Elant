import { useState, useEffect } from "react";
import { FaSearch, FaSave, FaFileExport } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import styled, { keyframes } from "styled-components";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

const slideInDown = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
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

const TabButton = styled.button<{ active: boolean }>`
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
  @media (min-width: 768px) {
    padding: 2rem;
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
`;

const Select = styled.select`
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

// Nuevos estilos para el selector de hora
const TimePickerContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const TimeSelect = styled.select`
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  border-radius: 0.375rem;
  background: linear-gradient(145deg, #ffffff, #f9fafb);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    transform: translateY(-1px);
  }
  &:hover {
    border-color: #2563eb;
  }
`;

const AMPMButton = styled.button<{ selected: boolean }>`
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  background: ${(props) =>
    props.selected
      ? "linear-gradient(145deg, #2563eb, #1e40af)"
      : "linear-gradient(145deg, #ffffff, #f9fafb)"};
  color: ${(props) => (props.selected ? "#ffffff" : "#4b5563")};
  font-weight: 600;
  font-size: 0.875rem;
  border: 1px solid ${(props) => (props.selected ? "#1e40af" : "#d1d5db")};
  transition: all 0.2s ease;
  box-shadow: ${(props) =>
    props.selected
      ? "0 4px 6px rgba(37, 99, 235, 0.2)"
      : "0 2px 4px rgba(0, 0, 0, 0.05)"};
  &:hover {
    transform: translateY(-1px);
    background: ${(props) =>
      props.selected
        ? "linear-gradient(145deg, #1e40af, #2563eb)"
        : "#e5e7eb"};
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TableRow = styled.tr<{ $estado: number; $delay: number }>`
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(props) => props.$delay}s;
  background-color: ${(props) => (props.$estado === 1 ? "#f0fff4" : "#fef2f2")};
  &:hover {
    background-color: #f9fafb;
  }
`;

interface VisitaProgramada {
  ID_VISITA_PROGRAMADA: number;
  NRO_DPTO: number;
  NOMBRE_VISITANTE: string;
  DNI_VISITANTE: string;
  FECHA_LLEGADA: string | Date;
  HORA_LLEGADA: string | null;
  MOTIVO: string;
  ID_USUARIO_PROPIETARIO: number;
  NOMBRE_PROPIETARIO?: string;
  ESTADO: number | boolean;
}

interface Departamento {
  NRO_DPTO: number;
  IS_PRINCIPAL?: boolean;
}

const formatDate = (dateInput: string | Date): string => {
  if (!dateInput) return "-";
  try {
    let date: Date;
    if (typeof dateInput === "string") {
      if (dateInput.includes("T")) {
        date = new Date(dateInput);
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }
    if (isNaN(date.getTime())) return "-";
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "-";
  }
};

const formatDateForDisplay = (dateInput: string | Date): string => {
  if (!dateInput) return "-";
  try {
    let date: Date;
    if (typeof dateInput === "string") {
      if (dateInput.includes("T")) {
        date = new Date(dateInput);
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = dateInput;
    }
    if (isNaN(date.getTime())) return "-";
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "-";
  }
};

const formatTime = (timeInput: string | null): string => {
  if (!timeInput) return "-";
  try {
    let normalizedTime: string;
    if (timeInput.includes("T")) {
      const date = new Date(timeInput);
      if (isNaN(date.getTime())) return "-";
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      normalizedTime = `${hours}:${minutes}`;
    } else {
      const timeMatch = timeInput.match(/^(\d{2}:\d{2})/);
      if (!timeMatch) return "-";
      normalizedTime = timeMatch[1];
    }
    const date = new Date(`1970-01-01T${normalizedTime}:00-05:00`);
    if (isNaN(date.getTime())) return "-";
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

const VisitasProgramadas = () => {
  const { userId } = useAuth();
  const now = new Date();
  const utcOffset = -5 * 60; // UTC-5 en minutos
  const localDate = new Date(now.getTime() + utcOffset * 60 * 1000);
  const currentDate = localDate.toISOString().slice(0, 10); // '2025-04-14'

  const [dni, setDni] = useState("");
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [isNombreManual, setIsNombreManual] = useState(false);
  const [nroDpto, setNroDpto] = useState("");
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [motivo, setMotivo] = useState("");
  const [fechaLlegada, setFechaLlegada] = useState(currentDate);
  const [horaLlegada, setHoraLlegada] = useState<string>("");
  const [hour, setHour] = useState<string>("12");
  const [minute, setMinute] = useState<string>("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [visitasProgramadas, setVisitasProgramadas] = useState<
    VisitaProgramada[]
  >([]);
  const [filter, setFilter] = useState({
    nombre: "",
    fecha: currentDate,
    nroDpto: "",
    estado: "1",
  });
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [isCanceling, setIsCanceling] = useState(false);

  // Generar opciones para horas (1-12) y minutos (00, 15, 30, 45)
  const hours = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const minutes = ["00", "10", "20", "30", "40", "50"];


  // Actualizar horaLlegada cuando cambian hora, minuto o período
  useEffect(() => {
    let militaryHour = parseInt(hour);
    if (period === "PM" && militaryHour !== 12) {
      militaryHour += 12;
    } else if (period === "AM" && militaryHour === 12) {
      militaryHour = 0;
    }
    const formattedHour = militaryHour.toString().padStart(2, "0");
    setHoraLlegada(`${formattedHour}:${minute}`);
  }, [hour, minute, period]);

  const fetchOwnerDepartments = async () => {
    try {
      const response = await fetch(`${API_URL}/users/${userId}/departments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Error al obtener los departamentos");
      const data = await response.json();
      const departments = data.map((d: Departamento, index: number) => ({
        NRO_DPTO: d.NRO_DPTO,
        IS_PRINCIPAL: index === 0,
      }));
      setDepartamentos(departments);
      if (departments.length === 1) {
        setNroDpto(departments[0].NRO_DPTO.toString());
      } else if (departments.length === 0) {
        setError("No se encontraron departamentos asociados al propietario");
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se encontraron departamentos asociados al propietario",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (err) {
      console.error("Error al obtener departamentos:", err);
      setError("No se pudieron cargar los departamentos");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los departamentos",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const fetchScheduledVisits = async () => {
    if (isCanceling) return;
    try {
      const response = await fetch(`${API_URL}/scheduled-visits`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok)
        throw new Error("Error al obtener las visitas programadas");
      const data = await response.json();
      console.log("Raw API response:", JSON.stringify(data, null, 2));
      const normalizedData = data
        .filter(
          (visit: VisitaProgramada) => visit.ID_USUARIO_PROPIETARIO === userId
        )
        .map((visit: VisitaProgramada) => {
          console.log("Processing visit:", {
            ID: visit.ID_VISITA_PROGRAMADA,
            FECHA_LLEGADA: visit.FECHA_LLEGADA,
            HORA_LLEGADA: visit.HORA_LLEGADA,
            FECHA_TYPE: typeof visit.FECHA_LLEGADA,
            HORA_TYPE: typeof visit.HORA_LLEGADA,
          });
          let fechaLlegada: string | null = null;
          let horaLlegada: string | null = null;

          if (visit.FECHA_LLEGADA) {
            if (typeof visit.FECHA_LLEGADA === "string") {
              if (visit.FECHA_LLEGADA.includes("T")) {
                const date = new Date(visit.FECHA_LLEGADA);
                if (!isNaN(date.getTime())) {
                  fechaLlegada = date.toISOString().split("T")[0];
                }
              } else {
                fechaLlegada = visit.FECHA_LLEGADA;
              }
            } else {
              fechaLlegada = visit.FECHA_LLEGADA.toISOString().split("T")[0];
            }
          }

          if (visit.HORA_LLEGADA) {
            if (typeof visit.HORA_LLEGADA === "string") {
              if (visit.HORA_LLEGADA.includes("T")) {
                const date = new Date(visit.HORA_LLEGADA);
                if (!isNaN(date.getTime())) {
                  const hours = date.getUTCHours().toString().padStart(2, "0");
                  const minutes = date
                    .getUTCMinutes()
                    .toString()
                    .padStart(2, "0");
                  horaLlegada = `${hours}:${minutes}`;
                }
              } else {
                const timeMatch = visit.HORA_LLEGADA.match(/^(\d{2}:\d{2})/);
                horaLlegada = timeMatch ? timeMatch[1] : null;
              }
            }
          }

          return {
            ...visit,
            ESTADO:
              visit.ESTADO === true
                ? 1
                : visit.ESTADO === false
                ? 0
                : visit.ESTADO,
            NOMBRE_VISITANTE: visit.NOMBRE_VISITANTE.toUpperCase(),
            FECHA_LLEGADA: fechaLlegada,
            HORA_LLEGADA: horaLlegada,
          };
        });
      console.log("Normalized data:", JSON.stringify(normalizedData, null, 2));
      setVisitasProgramadas(
        normalizedData.sort(
          (a: VisitaProgramada, b: VisitaProgramada) =>
            new Date(b.FECHA_LLEGADA).getTime() -
            new Date(a.FECHA_LLEGADA).getTime()
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

  useEffect(() => {
    fetchOwnerDepartments();
    fetchScheduledVisits();
    const interval = setInterval(fetchScheduledVisits, 8000);
    return () => clearInterval(interval);
  }, [userId]);

  const handleSearchDni = async () => {
    if (!/^[a-zA-Z0-9]{8,12}$/.test(dni)) {
      setError(
        "El DNI o Carnet de Extranjería debe tener entre 8 y 12 caracteres alfanuméricos"
      );
      setIsNombreManual(true);
      return;
    }
    setError("");
    try {
      const response = await fetch(`${API_URL}/dni?dni=${dni}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) throw new Error("Error al buscar el DNI");
      const data = await response.json();
      setNombreVisitante(data.nombreCompleto.toUpperCase());
      setIsNombreManual(false);
    } catch (err) {
      setError("No se encontró el DNI. Puede ingresar el nombre manualmente.");
      setIsNombreManual(true);
      Swal.fire({
        icon: "info",
        title: "DNI no encontrado",
        text: "Puede ingresar el nombre del visitante manualmente.",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleSaveScheduledVisit = async () => {
    if (!dni || !nombreVisitante || !nroDpto || !fechaLlegada || !motivo || !horaLlegada) {
      setError("Por favor, complete todos los campos obligatorios");
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Todos los campos, incluyendo la hora de llegada, son obligatorios",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!/^[a-zA-Z0-9]{8,12}$/.test(dni)) {
      setError(
        "El DNI o Carnet de Extranjería debe tener entre 8 y 12 caracteres alfanuméricos"
      );
      Swal.fire({
        icon: "error",
        title: "Identificador inválido",
        text: "El DNI o Carnet de Extranjería debe tener entre 8 y 12 caracteres alfanuméricos",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (nombreVisitante.trim().length < 3) {
      setError("El nombre del visitante debe tener al menos 3 caracteres");
      Swal.fire({
        icon: "error",
        title: "Nombre inválido",
        text: "El nombre del visitante debe tener al menos 3 caracteres",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (motivo.trim().length === 0) {
      setError("El motivo de la visita es obligatorio");
      Swal.fire({
        icon: "error",
        title: "Motivo inválido",
        text: "El motivo de la visita es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    const fechaLlegadaFormatted = fechaLlegada.split("T")[0];
    const todayFormatted = currentDate.split("T")[0];
    if (fechaLlegadaFormatted < todayFormatted) {
      setError("La fecha de llegada no puede ser anterior a hoy");
      Swal.fire({
        icon: "error",
        title: "Fecha inválida",
        text: "La fecha de llegada no puede ser anterior a hoy",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    const timeMatch = horaLlegada.match(/^(\d{2}:\d{2})$/);
    if (!timeMatch) {
      setError("Formato de hora inválido.");
      Swal.fire({
        icon: "error",
        title: "Hora inválida",
        text: "Por favor, seleccione una hora válida.",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    const horaLlegadaFormatted = horaLlegada;
    try {
      const response = await fetch(`${API_URL}/scheduled-visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nro_dpto: parseInt(nroDpto),
          dni_visitante: dni,
          nombre_visitante: nombreVisitante.toUpperCase(),
          fecha_llegada: fechaLlegada,
          hora_llegada: horaLlegadaFormatted,
          motivo,
          id_usuario_propietario: userId,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al registrar la visita programada"
        );
      }
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Visita programada registrada correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      await fetchScheduledVisits();
      setDni("");
      setNombreVisitante("");
      setIsNombreManual(false);
      setNroDpto(
        departamentos.length === 1 ? departamentos[0].NRO_DPTO.toString() : ""
      );
      setMotivo("");
      setFechaLlegada(currentDate);
      setHoraLlegada("");
      setHour("12");
      setMinute("00");
      setPeriod("AM");
      setActiveTab("history");
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error al registrar la visita programada");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo registrar la visita programada",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelVisit = async (idVisita: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Estás seguro?",
      text: "¿Deseas cancelar esta visita programada?",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!result.isConfirmed) {
      return;
    }

    setIsCanceling(true);
    try {
      const response = await fetch(
        `${API_URL}/scheduled-visits/${idVisita}/cancel`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 400) {
          if (
            errorData.message === "La visita ya está procesada o cancelada" ||
            errorData.message === "No se pudo cancelar la visita: estado no válido"
          ) {
            const visitResponse = await fetch(`${API_URL}/scheduled-visits`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!visitResponse.ok)
              throw new Error("Error al verificar el estado de la visita");
            const visits = await visitResponse.json();
            const visit = visits.find(
              (v: VisitaProgramada) => v.ID_VISITA_PROGRAMADA === idVisita
            );

            if (!visit || visit.ESTADO === 0) {
              Swal.fire({
                icon: "success",
                title: "Éxito",
                text: "Visita cancelada correctamente",
                timer: 2000,
                showConfirmButton: false,
              });
            } else {
              throw new Error(errorData.message || "Error al cancelar la visita");
            }
          } else {
            throw new Error(errorData.message || "Error al cancelar la visita");
          }
        } else {
          throw new Error(errorData.message || "Error al cancelar la visita");
        }
      } else {
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Visita cancelada correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      await fetchScheduledVisits();
    } catch (err) {
      console.error("Error al cancelar visita:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "No se pudo cancelar la visita",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsCanceling(false);
    }
  };

  const filteredVisitasProgramadas = visitasProgramadas.filter((visita) => {
    const fechaLlegada = formatDate(visita.FECHA_LLEGADA);
    const filterFechaFormatted = filter.fecha || "";
    const estadoNum =
      typeof visita.ESTADO === "boolean"
        ? visita.ESTADO
          ? 1
          : 0
        : visita.ESTADO;
    return (
      (filter.nombre === "" ||
        visita.NOMBRE_VISITANTE.toLowerCase().includes(
          filter.nombre.toLowerCase()
        )) &&
      (filterFechaFormatted === "" || fechaLlegada === filterFechaFormatted) &&
      (filter.nroDpto === "" ||
        visita.NRO_DPTO.toString() === filter.nroDpto) &&
      (filter.estado === "" || estadoNum.toString() === filter.estado)
    );
  });

  const exportToCSV = () => {
    const headers =
      "ID Visita,Número Dpto,Nombre Visitante,DNI/CE,Propietario,Fecha Llegada,Hora Tentativa,Motivo,Estado\n";
    const rows = filteredVisitasProgramadas
      .map((visita) => {
        const estadoNum =
          typeof visita.ESTADO === "boolean"
            ? visita.ESTADO
              ? 1
              : 0
            : visita.ESTADO;
        return `${visita.ID_VISITA_PROGRAMADA},${visita.NRO_DPTO},${
          visita.NOMBRE_VISITANTE
        },${visita.DNI_VISITANTE},${
          visita.NOMBRE_PROPIETARIO || "-"
        },${formatDateForDisplay(visita.FECHA_LLEGADA)},${formatTime(
          visita.HORA_LLEGADA
        )},${visita.MOTIVO},${estadoNum === 1 ? "Pendiente" : "Procesada"}`;
      })
      .join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visitas_programadas.csv";
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

  return (
    <Container>
      <Title>Gestión de Visitas Programadas</Title>
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <TabButton
            active={activeTab === "create"}
            onClick={() => setActiveTab("create")}
          >
            Registrar Visita Programada
          </TabButton>
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          >
            Historial de Visitas Programadas
          </TabButton>
        </div>
      </div>
      <TabContent>
        {activeTab === "create" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              Registrar Nueva Visita Programada
            </h2>
            {error && (
              <p className="text-red-500 mb-4 bg-red-50 p-2 rounded-lg">
                {error}
              </p>
            )}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    DNI o Carnet de Extranjería
                  </label>
                  <div className="flex">
                    <Input
                      type="text"
                      value={dni}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[a-zA-Z0-9]{0,12}$/.test(value)) {
                          setDni(value);
                          if (value === "") setIsNombreManual(true);
                        }
                      }}
                      placeholder="Ejemplo: 7123XXXX o CE123456789"
                      required
                    />
                    <Button
                      className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleSearchDni}
                      disabled={!dni}
                    >
                      <FaSearch />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el DNI o CE y haz clic en buscar. Si no tienes,
                    ingresa manualmente.
                  </p>
                </div>
                <div className="md:col-span-7">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre del Visitante
                  </label>
                  <Input
                    type="text"
                    value={nombreVisitante}
                    onChange={(e) => {
                      if (isNombreManual)
                        setNombreVisitante(e.target.value.toUpperCase());
                    }}
                    readOnly={!isNombreManual}
                    className={
                      isNombreManual ? "" : "bg-gray-100 text-gray-700"
                    }
                    placeholder="Ingresa el nombre completo"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isNombreManual
                      ? "Ingresa el nombre manualmente (en mayúsculas)."
                      : "Se llena automáticamente tras buscar el DNI."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Departamento
                  </label>
                  {departamentos.length === 1 ? (
                    <Input
                      type="text"
                      value={nroDpto}
                      readOnly
                      className="bg-gray-100 text-gray-700"
                      required
                    />
                  ) : (
                    <Select
                      value={nroDpto}
                      onChange={(e) => setNroDpto(e.target.value)}
                      required
                    >
                      <option value="">Seleccione un departamento</option>
                      {departamentos.map((depto) => (
                        <option key={depto.NRO_DPTO} value={depto.NRO_DPTO}>
                          {depto.NRO_DPTO}{" "}
                          {depto.IS_PRINCIPAL ? "(Principal)" : ""}
                        </option>
                      ))}
                    </Select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {departamentos.length === 1
                      ? "Departamento asociado al propietario."
                      : "Seleccione el departamento para la visita."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha de Llegada
                  </label>
                  <Input
                    type="date"
                    value={fechaLlegada}
                    onChange={(e) => setFechaLlegada(e.target.value)}
                    min={currentDate}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seleccione la fecha de llegada del visitante.
                  </p>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Hora de Llegada Tentativa
                  </label>
                  <TimePickerContainer>
                    <TimeSelect
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      required
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </TimeSelect>
                    <span className="text-gray-600 font-bold">:</span>
                    <TimeSelect
                      value={minute}
                      onChange={(e) => setMinute(e.target.value)}
                      required
                    >
                      {minutes.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </TimeSelect>
                    <div className="flex gap-2">
                      <AMPMButton
                        selected={period === "AM"}
                        onClick={() => setPeriod("AM")}
                      >
                        AM
                      </AMPMButton>
                      <AMPMButton
                        selected={period === "PM"}
                        onClick={() => setPeriod("PM")}
                      >
                        PM
                      </AMPMButton>
                    </div>
                  </TimePickerContainer>
                  <p className="text-xs text-gray-500 mt-1">
                    Seleccione la hora y período (AM/PM) de llegada.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Motivo de la Visita
                </label>
                <Input
                  type="text"
                  value={motivo}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 100) setMotivo(value);
                  }}
                  placeholder="Ejemplo: Reunión familiar"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 100 caracteres. ({motivo.length}/100)
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleSaveScheduledVisit}
              >
                <FaSave className="mr-2" />
                Grabar Visita Programada
              </Button>
            </div>
          </Card>
        )}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">
              Historial de Visitas Programadas
            </h2>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full md:w-3/4">
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
                      if (value === "" || /^[0-9]*$/.test(value))
                        handleFilterChange(e);
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
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha de Llegada
                  </label>
                  <Input
                    type="date"
                    name="fecha"
                    value={filter.fecha}
                    onChange={handleFilterChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Estado
                  </label>
                  <Select
                    name="estado"
                    value={filter.estado}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todas</option>
                    <option value="1">Pendientes</option>
                    <option value="0">Procesadas</option>
                  </Select>
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
                      Número Dpto
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Nombre Visitante
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      DNI/CE
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Propietario
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
                      Estado
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
                        colSpan={10}
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
                      return (
                        <TableRow
                          key={visita.ID_VISITA_PROGRAMADA}
                          $estado={estadoNum}
                          $delay={index * 0.1}
                        >
                          <td className="py-3 px-4">
                            {visita.ID_VISITA_PROGRAMADA}
                          </td>
                          <td className="py-3 px-4">{visita.NRO_DPTO}</td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_VISITANTE}
                          </td>
                          <td className="py-3 px-4">{visita.DNI_VISITANTE}</td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_PROPIETARIO || "-"}
                          </td>
                          <td className="py-3 px-4">
                            {formatDateForDisplay(visita.FECHA_LLEGADA)}
                          </td>
                          <td className="py-3 px-4">
                            {formatTime(visita.HORA_LLEGADA)}
                          </td>
                          <td className="py-3 px-4">{visita.MOTIVO}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                estadoNum === 1
                                  ? "bg-blue-100 text-[#2563eb]"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {estadoNum === 1 ? "Pendiente" : "Procesada"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {estadoNum === 1 && (
                              <Button
                                className="bg-red-600 text-white hover:bg-red-700 text-xs py-1 px-2"
                                onClick={() =>
                                  handleCancelVisit(visita.ID_VISITA_PROGRAMADA)
                                }
                              >
                                Cancelar
                              </Button>
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

export default VisitasProgramadas;