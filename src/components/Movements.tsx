import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaSearch, FaFileExport } from "react-icons/fa";
import styled, { keyframes } from "styled-components";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

interface Departamento {
  NRO_DPTO: number;
  ID_FASE: number;
  nombreFase: string;
}

interface Movimiento {
  ID_ACCESO: number;
  ID_PERSONA: number;
  DNI: string;
  nombre: string;
  CORREO: string;
  id_departamento: number | null;
  numero_dpto: string | null;
  ID_FASE: number | null;
  nombreFase: string | null;
  FECHA_ACCESO: string;
  EXITO: number;
  MOTIVO_FALLO: string | null;
  tipo_registro: string;
  puerta: string;
  descripcion: string;
}

interface UserData {
  ID_PERSONA: number;
  nombre: string;
  CORREO: string;
  departamentos: Departamento[];
}

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

const Container = styled.div`
  padding: 1rem;
  background-color: #f3f4f6;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  @media (min-width: 640px) {
    padding: 1.5rem;
  }
  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  animation: ${slideInDown} 0.5s ease-out;
  @media (min-width: 640px) {
    font-size: 1.5rem;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: ${(props) => (props.active ? "#2563eb" : "#4b5563")};
  border-bottom: ${(props) => (props.active ? "2px solid #2563eb" : "none")};
  transition: color 0.2s ease, border-bottom 0.2s ease;
  &:hover {
    color: #2563eb;
  }
  @media (min-width: 640px) {
    font-size: 1rem;
  }
`;

const TabContent = styled.div`
  animation: ${fadeIn} 0.5s ease-out;
  margin-top: 1rem;
`;

const Card = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  transition: box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  @media (min-width: 640px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  @media (min-width: 1024px) {
    padding: 2rem;
  }
`;

const UserInfoCard = styled(Card)`
  margin-top: 1rem;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Input = styled.input`
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  width: 100%;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
  @media (min-width: 640px) {
    padding: 0.75rem;
    font-size: 1rem;
  }
`;

const Select = styled.select`
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  width: 100%;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
  @media (min-width: 640px) {
    padding: 0.75rem;
    font-size: 1rem;
  }
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  @media (min-width: 640px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    width: auto;
  }
`;

const TableRow = styled.tr<{ $exito: number; $delay: number; $highlight?: boolean }>`
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(props) => props.$delay}s;
  background-color: ${(props) =>
    props.$highlight ? "#2563eb33" : props.$exito ? "#f0fff4" : "#fef2f2"};
  transition: background-color 1s ease;
  &:hover {
    background-color: #f9fafb;
  }
`;

const Movements = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filter, setFilter] = useState({
    campo: "nombre",
    valor: "",
    fecha: new Date().toISOString().slice(0, 10),
  });
  const [dni, setDni] = useState("");
  const [activeTab, setActiveTab] = useState<"register" | "history">("register");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedDpto, setSelectedDpto] = useState<string>("");
  const [highlightLast, setHighlightLast] = useState(false);

  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);

  const validateDNI = (dni: string): boolean => {
    const dniRegex = /^[a-zA-Z0-9]{1,12}$/;
    return dniRegex.test(dni);
  };

  const fetchMovements = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/movements`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al obtener los movimientos");
      const data = await response.json();
      setMovimientos(data);
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los movimientos",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    fetchMovements();
    const interval = setInterval(fetchMovements, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (highlightLast) {
      const timer = setTimeout(() => {
        setHighlightLast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightLast]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscarPorDNI = async () => {
    if (!validateDNI(dni)) {
      Swal.fire(
        "Advertencia",
        "El DNI o pasaporte debe tener hasta 12 caracteres alfanuméricos",
        "warning"
      );
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/usuarios/${dni}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Usuario no encontrado");
      const data = await response.json();
      setUserData(data);
      setSelectedDpto(
        data.departamentos?.length === 1 ? String(data.departamentos[0].NRO_DPTO) : ""
      );
    } catch (error) {
      Swal.fire("Error", "No se encontró un usuario con ese DNI o pasaporte", "error");
      setUserData(null);
      setDni("");
    }
  };

  const handleRegistrar = async () => {
    if (!userData) return;
    if (!selectedDpto) {
      Swal.fire("Error", "Por favor, selecciona un departamento", "error");
      return;
    }

    const nroDpto = Number(selectedDpto);
    await registrarIngreso(userData, nroDpto);
  };

  const handleCancelar = () => {
    setUserData(null);
    setDni("");
    setSelectedDpto("");
  };

  const registrarIngreso = async (userData: UserData, nroDpto: number) => {
    const token = localStorage.getItem("token");
    try {
      const postResponse = await fetch(`${API_URL}/movements/registrar-acceso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dni, NRO_DPTO: nroDpto }),
      });

      const resultData = await postResponse.json();
      if (resultData.success) {
        Swal.fire("¡Registrado!", resultData.message, "success");
        setDni("");
        setUserData(null);
        setSelectedDpto("");
        setActiveTab("history");
        await fetchMovements();
        setHighlightLast(true);
      } else {
        Swal.fire("Error", resultData.message, "error");
        setDni("");
        setUserData(null);
        setSelectedDpto("");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo registrar el ingreso", "error");
      setDni("");
      setUserData(null);
      setSelectedDpto("");
    }
  };

  const exportToExcel = () => {
    const headers = [
      "ID Acceso",
      "ID Persona",
      "DNI",
      "Nombre",
      "Correo",
      "Nro Dpto",
      "Fase",
      "Fecha Acceso",
      "Éxito",
      "Tipo Registro",
      "Motivo Fallo",
      "Puerta",
      "Descripción",
    ];
    const data = movimientos.map((mov) => [
      mov.ID_ACCESO,
      mov.ID_PERSONA,
      mov.DNI,
      mov.nombre,
      mov.CORREO,
      mov.numero_dpto ?? "-",
      mov.nombreFase ?? "-",
      new Date(mov.FECHA_ACCESO).toLocaleString(),
      mov.EXITO ? "Sí" : "No",
      mov.tipo_registro,
      mov.MOTIVO_FALLO ?? "-",
      mov.puerta,
      mov.descripcion,
    ]);

    const ws = XLSX.utils.json_to_sheet([headers, ...data], { skipHeader: true });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, "movimientos.xlsx");

    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: "Archivo Excel exportado correctamente",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const filteredMovimientos = movimientos.filter((mov) => {
    const fechaAcceso = new Date(mov.FECHA_ACCESO).toISOString().slice(0, 10);
    const texto = filter.valor.toLowerCase();

    let coincide = true;
    if (filter.campo === "nombre") {
      coincide = mov.nombre.toLowerCase().includes(texto);
    } else if (filter.campo === "dni") {
      coincide = mov.DNI.toString().includes(texto);
    } else if (filter.campo === "departamento") {
      coincide = (mov.numero_dpto?.toString() || "").includes(texto);
    }

    return coincide && (filter.fecha === "" || fechaAcceso === filter.fecha);
  });

  return (
    <Container>
      <Title>Control de Ingresos Personas</Title>
      <div className="mb-4 flex flex-wrap gap-2 border-b">
        <TabButton
          active={activeTab === "register"}
          onClick={() => setActiveTab("register")}
        >
          Registrar Ingreso Manual
        </TabButton>
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
        >
          Historial de Ingresos
        </TabButton>
      </div>
      <TabContent>
        {activeTab === "register" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Registrar ingreso con documento</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  DNI o Pasaporte
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ejemplo: 12345678 o AB1234567890"
                    required
                  />
                  <Button
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleBuscarPorDNI}
                  >
                    <FaSearch />
                  </Button>
                </div>
              </div>
            </div>
            {userData && (
              <UserInfoCard>
                <h3 className="text-md font-semibold mb-2">Información del Usuario</h3>
                <p className="text-sm text-gray-600">
                  <strong>Nombre:</strong> {userData.nombre}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Correo:</strong> {userData.CORREO}
                </p>
                {userData.departamentos?.length > 0 ? (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Seleccionar Departamento
                    </label>
                    <Select
                      value={selectedDpto}
                      onChange={(e) => setSelectedDpto(e.target.value)}
                    >
                      <option value="">Seleccione un departamento</option>
                      {userData.departamentos.map((dpto) => (
                        <option key={dpto.NRO_DPTO} value={dpto.NRO_DPTO}>
                          Departamento {dpto.NRO_DPTO} ({dpto.nombreFase})
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 mt-2">
                    No hay departamentos asociados
                  </p>
                )}
                <div className="mt-4 flex gap-2 flex-col sm:flex-row">
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={handleRegistrar}
                    disabled={!selectedDpto}
                  >
                    Registrar
                  </Button>
                  <Button
                    className="bg-gray-600 text-white hover:bg-gray-700"
                    onClick={handleCancelar}
                  >
                    Cancelar
                  </Button>
                </div>
              </UserInfoCard>
            )}
          </Card>
        )}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Historial de Movimientos</h2>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full lg:w-3/4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Buscar por
                  </label>
                  <Select
                    name="campo"
                    value={filter.campo}
                    onChange={handleFilterChange}
                  >
                    <option value="nombre">Nombre</option>
                    <option value="dni">DNI</option>
                    <option value="departamento">Nro Departamento</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Valor a buscar
                  </label>
                  <Input
                    type="text"
                    name="valor"
                    value={filter.valor}
                    onChange={handleFilterChange}
                    placeholder="Ingresa el valor a buscar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Fecha
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
              <div className="flex justify-end mt-2 lg:mt-0">
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={exportToExcel}
                >
                  <FaFileExport className="mr-2" />
                  Exportar a Excel
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      DNI
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Nombre
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Nro Dpto
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Fase
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Fecha Ingreso
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Éxito
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Tipo Registro
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Puerta
                    </th>
                    <th className="py-2 px-3 border-b text-left text-xs font-semibold sm:text-sm">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-gray-500 text-sm">
                        No hay movimientos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((mov, index) => (
                      <TableRow
                        key={mov.ID_ACCESO}
                        $exito={mov.EXITO}
                        $delay={index * 0.1}
                        $highlight={highlightLast && index === 0}
                      >
                        <td className="py-2 px-3 text-sm">{mov.DNI}</td>
                        <td className="py-2 px-3 text-sm">{mov.nombre}</td>
                        <td className="py-2 px-3 text-sm">{mov.numero_dpto ?? "-"}</td>
                        <td className="py-2 px-3 text-sm">{mov.nombreFase ?? "-"}</td>
                        <td className="py-2 px-3 text-sm">
                          {new Date(mov.FECHA_ACCESO).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              mov.EXITO
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {mov.EXITO ? "Sí" : "No"}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-sm">{mov.tipo_registro}</td>
                        <td className="py-2 px-3 text-sm">{mov.puerta}</td>
                        <td className="py-2 px-3 text-sm">{mov.descripcion}</td>
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

export default Movements;