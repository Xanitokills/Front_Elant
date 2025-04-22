import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Select from "react-select";
import { debounce } from "lodash";
import { FaBox, FaSave, FaFileExport, FaCheck, FaSearch } from "react-icons/fa";
import styled, { keyframes } from "styled-components";

// Asegúrate de que styled-components está instalado:
// npm install styled-components @types/styled-components
// También instala el plugin para Vite:
// npm install vite-plugin-styled-components --save-dev

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

const UsersList = styled.ul`
  list-style-type: disc;
  margin-left: 1.5rem;
  margin-top: 1rem;
  color: #4b5563;
`;

const TableRow = styled.tr<{ $estado: number; $delay: number }>`
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(props) => props.$delay}s;
  background-color: ${(props) => (props.$estado === 1 ? "#f0fff4" : "#fef2f2")};
  &:hover {
    background-color: #f9fafb;
  }
`;

interface UserOption {
  value: number; // ID_USUARIO
  label: string; // Nombres y apellidos
  dni?: string;
  department?: number;
}

interface DepartmentOption {
  value: number; // NRO_DPTO
  label: string; // NRO_DPTO
  users?: { ID_USUARIO: number; NOMBRES: string; APELLIDOS: string; DNI: string; NRO_DPTO: number }[];
}

interface Encargo {
  ID_ENCARGO: number;
  NRO_DPTO: number;
  DESCRIPCION: string;
  FECHA_RECEPCION: string | Date;
  FECHA_ENTREGA: string | Date | null;
  ID_USUARIO_RECEPCION: number;
  RECEPCIONISTA: string;
  ID_USUARIO_ENTREGA: number | null;
  ENTREGADO_A: string | null;
  ESTADO: number;
  USUARIOS_ASOCIADOS: string;
}

const formatDate = (dateInput: string | Date | null): string => {
  if (!dateInput) return "-";
  try {
    let date: Date;
    if (typeof dateInput === "string") {
      date = new Date(dateInput);
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

const RegisterOrder = () => {
  const { isAuthenticated, userId } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState<"create" | "history">("history");
  const [searchCriteria, setSearchCriteria] = useState<"name" | "dni" | "department">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentOption | null>(null);
  const [description, setDescription] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [filter, setFilter] = useState({
    nroDpto: "",
    descripcion: "",
    fechaRecepcion: "",
    estado: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  const fetchEncargos = async () => {
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
      const response = await fetch(`${API_URL}/orders/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener los encargos");
      const data = await response.json();
      console.log("Encargos recibidos:", data);
      setEncargos(
        data.map((encargo: Encargo) => ({
          ...encargo,
          ESTADO: encargo.ESTADO === true ? 1 : encargo.ESTADO === false ? 0 : encargo.ESTADO,
          FECHA_RECEPCION: encargo.FECHA_RECEPCION,
          FECHA_ENTREGA: encargo.FECHA_ENTREGA,
        })).sort(
          (a: Encargo, b: Encargo) =>
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

  const fetchUsers = async (query: string, criteria: string) => {
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
      console.log("Enviando solicitud a:", `${API_URL}/orders?criteria=${criteria}&query=${encodeURIComponent(query)}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(
        `${API_URL}/orders?criteria=${criteria}&query=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("Error al buscar usuarios");
      const data = await response.json();
      console.log("Resultados de búsqueda:", data);
      if (criteria === "department") {
        setDepartmentOptions(
          data.map((dept: any) => ({
            value: dept.NRO_DPTO,
            label: dept.NRO_DPTO.toString(),
            users: dept.USUARIOS,
          }))
        );
      } else {
        setUserOptions(
          data.map((user: any) => ({
            value: user.ID_USUARIO,
            label: `${user.NOMBRES} ${user.APELLIDOS}`,
            dni: user.DNI,
            department: user.NRO_DPTO,
          }))
        );
      }
    } catch (error) {
      console.error("Error en fetchUsers:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.name === "AbortError" ? "Tiempo de espera agotado. Verifica que el servidor esté corriendo." : "No se pudo realizar la búsqueda.",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchCriteria === "name") {
      fetchUsers(searchQuery, searchCriteria);
    } else if (searchCriteria === "dni" && searchQuery.trim().length >= 3) {
      fetchUsers(searchQuery, searchCriteria);
    } else if (searchCriteria === "department" && searchQuery.trim()) {
      fetchUsers(searchQuery, searchCriteria);
    } else {
      Swal.fire({
        icon: "warning",
        title: "Entrada inválida",
        text: searchCriteria === "dni" ? "El DNI debe tener al menos 3 caracteres." : "Ingresa un número de departamento válido.",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleCriteriaChange = (criteria: "name" | "dni" | "department") => {
    setSearchCriteria(criteria);
    setSearchQuery("");
    setSelectedUser(null);
    setSelectedDepartment(null);
    setUserOptions([]);
    setDepartmentOptions([]);
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
    if (!selectedUser && !selectedDepartment) {
      setError("Selecciona un usuario o departamento.");
      Swal.fire({
        icon: "warning",
        title: "Destinatario requerido",
        text: "Selecciona un usuario o departamento.",
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
    }

    let modalContent = "";
    if (selectedUser) {
      modalContent = `
        <div style="text-align: left;">
          <p><strong>Usuario:</strong> ${selectedUser.label}</p>
          <p><strong>DNI:</strong> ${selectedUser.dni}</p>
          <p><strong>Departamento:</strong> ${selectedUser.department}</p>
          <p><strong>Descripción del encargo:</strong> ${description}</p>
        </div>
      `;
    } else if (selectedDepartment) {
      const users = selectedDepartment.users || [];
      modalContent = `
        <div style="text-align: left;">
          <p><strong>Departamento:</strong> ${selectedDepartment.label}</p>
          <p><strong>Descripción del encargo:</strong> ${description}</p>
          <p><strong>Usuarios asociados:</strong></p>
          <ul style="list-style-type: disc; margin-left: 20px;">
            ${users.length > 0
              ? users
                  .map(
                    (user) =>
                      `<li>${user.NOMBRES} ${user.APELLIDOS} (DNI: ${user.DNI})</li>`
                  )
                  .join("")
              : "<li>No hay usuarios asociados</li>"}
          </ul>
        </div>
      `;
    }

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
      const payload = {
        description: description.trim(),
        userId: selectedUser ? selectedUser.value : null,
        department: selectedDepartment ? selectedDepartment.value : null,
        receptionistId: parseInt(userId || "0"),
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
      setSelectedUser(null);
      setSelectedDepartment(null);
      setUserOptions([]);
      setDepartmentOptions([]);
      setError("");
      setActiveTab("history");
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

  const handleMarkDelivered = async (idEncargo: number) => {
    const usersResponse = await fetch(
      `${API_URL}/orders?criteria=department&query=${encargos.find(e => e.ID_ENCARGO === idEncargo)?.NRO_DPTO}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!usersResponse.ok) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo obtener la lista de usuarios",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    const deptData = await usersResponse.json();
    const users = deptData[0]?.USUARIOS || [];

    const userOptions = users.map((user: any) => ({
      value: user.ID_USUARIO,
      label: `${user.NOMBRES} ${user.APELLIDOS} (DNI: ${user.DNI})`,
    }));

    const { value: selectedUserId } = await Swal.fire({
      title: "Seleccionar usuario que retira",
      input: "select",
      inputOptions: userOptions.reduce((acc: any, user: any) => {
        acc[user.value] = user.label;
        return acc;
      }, {}),
      inputPlaceholder: "Selecciona un usuario",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      inputValidator: (value) => {
        if (!value) {
          return "Debes seleccionar un usuario";
        }
      },
    });

    if (!selectedUserId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/${idEncargo}/deliver`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: parseInt(selectedUserId) }),
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
      "ID Encargo,Número Dpto,Descripción,Fecha Recepción,Fecha Entrega,Recepcionista,Entregado A,Usuarios Asociados,Estado\n";
    const rows = filteredEncargos
      .map((encargo) => {
        return `${encargo.ID_ENCARGO},${encargo.NRO_DPTO},${encargo.DESCRIPCION},${formatDate(
          encargo.FECHA_RECEPCION
        )},${formatDate(encargo.FECHA_ENTREGA)},${encargo.RECEPCIONISTA},${
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
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleCriteriaChange("name")}
                    className={`px-4 py-2 ${
                      searchCriteria === "name"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    } hover:bg-blue-700 hover:text-white transition-colors`}
                  >
                    Nombre
                  </Button>
                  <Button
                    onClick={() => handleCriteriaChange("dni")}
                    className={`px-4 py-2 ${
                      searchCriteria === "dni"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    } hover:bg-blue-700 hover:text-white transition-colors`}
                  >
                    DNI
                  </Button>
                  <Button
                    onClick={() => handleCriteriaChange("department")}
                    className={`px-4 py-2 ${
                      searchCriteria === "department"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    } hover:bg-blue-700 hover:text-white transition-colors`}
                  >
                    Departamento
                  </Button>
                </div>
              </div>
              {searchCriteria === "name" ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Nombres y Apellidos
                  </label>
                  <Select
                    options={userOptions}
                    value={selectedUser}
                    onChange={(option) => setSelectedUser(option)}
                    onInputChange={(input) => {
                      setSearchQuery(input);
                      fetchUsers(input, "name");
                    }}
                    placeholder="Escribe para buscar..."
                    isLoading={isLoading}
                    className="text-sm"
                    isClearable
                  />
                </div>
              ) : searchCriteria === "dni" ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    DNI
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ingresa el DNI..."
                    />
                    <Button
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleSearch}
                      disabled={isLoading}
                    >
                      <FaSearch className="mr-2" />
                      Buscar
                    </Button>
                  </div>
                  {userOptions.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Seleccionar Usuario
                      </label>
                      <Select
                        options={userOptions}
                        value={selectedUser}
                        onChange={(option) => setSelectedUser(option)}
                        placeholder="Selecciona un usuario..."
                        className="text-sm"
                        isClearable
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Número de Departamento
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^[0-9]*$/.test(value))
                          setSearchQuery(value);
                      }}
                      placeholder="Ingresa el número de departamento..."
                    />
                    <Button
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={handleSearch}
                      disabled={isLoading}
                    >
                      <FaSearch className="mr-2" />
                      Buscar
                    </Button>
                  </div>
                  {departmentOptions.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Seleccionar Departamento
                      </label>
                      <Select
                        options={departmentOptions}
                        value={selectedDepartment}
                        onChange={(option) => setSelectedDepartment(option)}
                        placeholder="Selecciona un departamento..."
                        className="text-sm"
                        isClearable
                      />
                      {selectedDepartment && selectedDepartment.users && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Usuarios Asociados
                          </label>
                          <UsersList>
                            {selectedDepartment.users.map((user) => (
                              <li key={user.ID_USUARIO}>
                                {user.NOMBRES} {user.APELLIDOS} (DNI: {user.DNI})
                              </li>
                            ))}
                          </UsersList>
                        </div>
                      )}
                    </div>
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
                  placeholder="Describe el paquete (máx. 255 caracteres)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/255 caracteres
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={handleRegister}
                  disabled={isLoading}
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
                        setFilter((prev) => ({ ...prev, nroDpto: value }));
                    }}
                    placeholder="Ejemplo: 101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Descripción
                  </label>
                  <Input
                    type="text"
                    name="descripcion"
                    value={filter.descripcion}
                    onChange={(e) => setFilter((prev) => ({ ...prev, descripcion: e.target.value }))}
                    placeholder="Filtrar por descripción"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha de Recepción
                  </label>
                  <Input
                    type="date"
                    name="fechaRecepcion"
                    value={filter.fechaRecepcion}
                    onChange={(e) => setFilter((prev) => ({ ...prev, fechaRecepcion: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={filter.estado}
                    onChange={(e) => setFilter((prev) => ({ ...prev, estado: e.target.value }))}
                    className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">Todas</option>
                    <option value="1">Pendientes</option>
                    <option value="0">Entregados</option>
                  </select>
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
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">ID Encargo</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Número Dpto</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Descripción</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Fecha Recepción</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Fecha Entrega</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Recepcionista</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Entregado A</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Usuarios Asociados</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Estado</th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEncargos.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-4 text-center text-gray-500">
                        No hay encargos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filteredEncargos.map((encargo, index) => (
                      <TableRow
                        key={encargo.ID_ENCARGO}
                        $estado={encargo.ESTADO}
                        $delay={index * 0.1}
                      >
                        <td className="py-3 px-4">{encargo.ID_ENCARGO}</td>
                        <td className="py-3 px-4">{encargo.NRO_DPTO}</td>
                        <td className="py-3 px-4">{encargo.DESCRIPCION}</td>
                        <td className="py-3 px-4">{formatDate(encargo.FECHA_RECEPCION)}</td>
                        <td className="py-3 px-4">{formatDate(encargo.FECHA_ENTREGA)}</td>
                        <td className="py-3 px-4">{encargo.RECEPCIONISTA}</td>
                        <td className="py-3 px-4">{encargo.ENTREGADO_A || "-"}</td>
                        <td className="py-3 px-4">{encargo.USUARIOS_ASOCIADOS || "-"}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              encargo.ESTADO === 1
                                ? "bg-blue-100 text-[#2563eb]"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {encargo.ESTADO === 1 ? "Pendiente" : "Entregado"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {encargo.ESTADO === 1 && (
                            <Button
                              className="bg-blue-600 text-white hover:bg-blue-700 text-xs py-1 px-2"
                              onClick={() => handleMarkDelivered(encargo.ID_ENCARGO)}
                            >
                              <FaCheck className="mr-1" />
                              Marcar Entregado
                            </Button>
                          )}
                        </td>
                      </TableRow>
                    ))
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

export default RegisterOrder;