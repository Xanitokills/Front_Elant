import { useState, useEffect } from "react";
import { FaSearch, FaSave, FaFileExport, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import styled, { keyframes } from "styled-components";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

// Define keyframes for animations
const slideInDown = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled components
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

const TableRow = styled.tr<{
  $estado: number;
  $delay: number;
  $isHighlighted?: boolean;
}>`
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(props) => props.$delay}s;
  background-color: ${(props) =>
    props.$isHighlighted
      ? "rgba(37, 99, 235, 0.3)"
      : props.$estado === 1
      ? "#f0fff4"
      : "#fef2f2"};
  &:hover {
    background-color: ${(props) =>
      props.$isHighlighted ? "rgba(37, 99, 235, 0.4)" : "#f9fafb"};
  }
`;

interface Propietario {
  ID_USUARIO: number;
  NOMBRE_COMPLETO: string;
}

interface Visitante {
  ID_VISITA: number;
  NRO_DPTO: number | null;
  NOMBRE_VISITANTE: string;
  DNI_VISITANTE: string;
  FECHA_INGRESO: string;
  FECHA_SALIDA: string | null;
  MOTIVO: string;
  ID_USUARIO_REGISTRO: number;
  ID_USUARIO_PROPIETARIO: number;
  NOMBRE_PROPIETARIO: string;
  ESTADO: number | boolean; // Allow boolean due to SQL Server BIT type
}

const Visits = () => {
  const [dni, setDni] = useState("");
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [nroDpto, setNroDpto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [idUsuarioPropietario, setIdUsuarioPropietario] = useState("");
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  const [visitas, setVisitas] = useState<Visitante[]>([]);
  const [filter, setFilter] = useState({
    nombre: "",
    fecha: "",
    estado: "todos",
    nroDpto: "",
  });
  const [error, setError] = useState("");
  const { userId } = useAuth();
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [highlightedVisitId, setHighlightedVisitId] = useState<number | null>(
    null
  );

  // Fetch visits from backend
  const fetchVisits = async () => {
    try {
      const response = await fetch(`${API_URL}/visits`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener las visitas");
      const data = await response.json();
      // Convert ESTADO from boolean to number
      const normalizedData = data.map((visit: Visitante) => ({
        ...visit,
        ESTADO:
          visit.ESTADO === true ? 1 : visit.ESTADO === false ? 0 : visit.ESTADO,
      }));
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

  // Fetch owners by department number
  const fetchOwners = async (nroDpto: string) => {
    if (!nroDpto || isNaN(parseInt(nroDpto))) {
      setPropietarios([]);
      setIdUsuarioPropietario("");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/owners?nro_dpto=${nroDpto}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener propietarios");
      const data = await response.json();
      setPropietarios(data);
      if (data.length === 0) {
        setIdUsuarioPropietario("");
        setError("No se encontraron propietarios para este departamento");
      } else {
        setError("");
      }
    } catch (err) {
      console.error("Error al obtener propietarios:", err);
      setPropietarios([]);
      setIdUsuarioPropietario("");
      setError("No se pudieron cargar los propietarios");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los propietarios",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // End a visit
  const handleEndVisit = async (idVisita: number) => {
    Swal.fire({
      title: "¿Confirmar?",
      text: "¿Estás seguro de terminar esta visita?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sí, terminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${API_URL}/visits/${idVisita}/end`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al terminar la visita");
          }
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
      }
    });
  };

  useEffect(() => {
    fetchVisits();
    const interval = setInterval(fetchVisits, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle DNI search
  const handleSearchDni = async () => {
    if (!/^[0-9]{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos numéricos");
      return;
    }
    setError("");
    try {
      const response = await fetch(`${API_URL}/dni?dni=${dni}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al buscar el DNI");
      const data = await response.json();
      setNombreVisitante(data.nombreCompleto);
    } catch (err) {
      setError("No se pudo encontrar el DNI");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo encontrar el DNI",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Validate and handle department number change
  const handleNroDptoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || (/^[0-9]{1,5}$/.test(value) && parseInt(value) >= 0)) {
      setNroDpto(value);
      fetchOwners(value);
    } else {
      setPropietarios([]);
      setIdUsuarioPropietario("");
    }
  };

  // Validate and handle motivo change
  const handleMotivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 80) {
      setMotivo(value);
    }
  };

  // Handle saving a visit
  const handleSaveVisit = async () => {
    if (!nombreVisitante || !motivo || !nroDpto || !idUsuarioPropietario) {
      setError("Por favor, complete todos los campos, incluido el propietario");
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, complete todos los campos, incluido el propietario",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    setError("");
    try {
      const response = await fetch(`${API_URL}/visits`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          nro_dpto: parseInt(nroDpto),
          dni_visitante: dni,
          nombre_visitante: nombreVisitante,
          fecha_ingreso: new Date().toISOString(),
          motivo,
          id_usuario_registro: userId || 1,
          id_usuario_propietario: parseInt(idUsuarioPropietario),
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
      setNombreVisitante("");
      setNroDpto("");
      setMotivo("");
      setIdUsuarioPropietario("");
      setPropietarios([]);
      setActiveTab("history");
      setHighlightedVisitId((await response.json()).ID_VISITA || null);
      setTimeout(() => {
        setHighlightedVisitId(null);
      }, 10000);
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

  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Filter visits
  const filteredVisitas = visitas.filter((visita) => {
    const fechaIngreso = new Date(visita.FECHA_INGRESO)
      .toISOString()
      .slice(0, 10);
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
      (filter.fecha === "" || fechaIngreso === filter.fecha) &&
      (filter.nroDpto === "" ||
        (visita.NRO_DPTO && visita.NRO_DPTO.toString() === filter.nroDpto)) &&
      (filter.estado === "todos" ||
        (filter.estado === "activas" && estadoNum === 1) ||
        (filter.estado === "terminadas" && estadoNum === 0))
    );
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers =
      "ID Visita,Número Dpto,Nombre Visitante,DNI,Propietario,Fecha Ingreso,Fecha Salida,Motivo,Estado\n";
    const rows = filteredVisitas
      .map((visita) => {
        const estadoNum =
          typeof visita.ESTADO === "boolean"
            ? visita.ESTADO
              ? 1
              : 0
            : visita.ESTADO;
        return `${visita.ID_VISITA},${visita.NRO_DPTO ?? "-"},${
          visita.NOMBRE_VISITANTE
        },${visita.DNI_VISITANTE},${visita.NOMBRE_PROPIETARIO ?? "-"},${
          visita.FECHA_INGRESO
        },${visita.FECHA_SALIDA ?? "-"},${visita.MOTIVO},${
          estadoNum === 1 ? "Activa" : "Terminada"
        }`;
      })
      .join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visitas.csv";
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
      <Title>Gestión de Visitas</Title>

      {/* Tabs */}
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
        </div>
      </div>

      {/* Tab Content */}
      <TabContent>
        {/* Registrar Visita */}
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
              {/* DNI y Nombre */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    DNI del Visitante
                  </label>
                  <div className="flex">
                    <Input
                      type="text"
                      value={dni}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[0-9]*$/.test(value)) {
                          setDni(value);
                        }
                      }}
                      placeholder="Ejemplo: 7123XXXX"
                    />
                    <Button
                      className="ml-2 bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleSearchDni}
                    >
                      <FaSearch />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el DNI y haz clic en buscar para verificar.
                  </p>
                </div>
                <div className="md:col-span-7">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Nombre del Visitante
                  </label>
                  <Input
                    type="text"
                    value={nombreVisitante}
                    readOnly
                    className="bg-gray-100 text-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este campo se llena automáticamente tras buscar el DNI.
                  </p>
                </div>
              </div>

              {/* Número de Departamento y Propietario */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Número de Departamento
                  </label>
                  <Input
                    type="text"
                    value={nroDpto}
                    onChange={handleNroDptoChange}
                    placeholder="Ejemplo: 101"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ingresa el número del departamento visitado.
                  </p>
                </div>
                <div className="md:col-span-9">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Propietario
                  </label>
                  <Select
                    value={idUsuarioPropietario}
                    onChange={(e) => setIdUsuarioPropietario(e.target.value)}
                    disabled={propietarios.length === 0}
                  >
                    <option value="">Seleccione un propietario</option>
                    {propietarios.map((prop) => (
                      <option key={prop.ID_USUARIO} value={prop.ID_USUARIO}>
                        {prop.NOMBRE_COMPLETO}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Seleccione el propietario del departamento.
                  </p>
                </div>
              </div>

              {/* Motivo (en fila completa) */}
              <div className="grid grid-cols-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Motivo de la Visita
                </label>
                <Input
                  type="text"
                  value={motivo}
                  onChange={handleMotivoChange}
                  placeholder="Ejemplo: Reunión familiar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo 80 caracteres. ({motivo.length}/80)
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={handleSaveVisit}
              >
                <FaSave className="mr-2" />
                Grabar Visita
              </Button>
            </div>
          </Card>
        )}

        {/* Historial de Visitas */}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Historial de Visitas</h2>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full md:w-4/5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Estado
                  </label>
                  <Select
                    name="estado"
                    value={filter.estado}
                    onChange={handleFilterChange}
                  >
                    <option value="todos">Todos</option>
                    <option value="activas">Visitas Activas</option>
                    <option value="terminadas">Visitas Terminadas</option>
                  </Select>
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
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha de Ingreso
                  </label>
                  <Input
                    type="date"
                    name="fecha"
                    value={filter.fecha}
                    onChange={handleFilterChange}
                    max={currentDate}
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

            {/* Tabla de Visitas */}
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
                      DNI
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Propietario
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fecha Ingreso
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fecha Salida
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
                        colSpan={10}
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
                            {visita.NRO_DPTO ?? "-"}
                          </td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_VISITANTE}
                          </td>
                          <td className="py-3 px-4">{visita.DNI_VISITANTE}</td>
                          <td className="py-3 px-4">
                            {visita.NOMBRE_PROPIETARIO ?? "-"}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(visita.FECHA_INGRESO).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {visita.FECHA_SALIDA
                              ? new Date(visita.FECHA_SALIDA).toLocaleString()
                              : "-"}
                          </td>
                          <td className="py-3 px-4">{visita.MOTIVO}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                                estadoNum === 1
                                  ? "bg-green-200 text-green-800"
                                  : "bg-red-200 text-red-800"
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
      </TabContent>
    </Container>
  );
};

export default Visits;
