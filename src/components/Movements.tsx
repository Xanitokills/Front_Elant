import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaSearch, FaFileExport } from "react-icons/fa";
import styled, { keyframes } from "styled-components";
import * as XLSX from "xlsx";

const API_URL = import.meta.env.VITE_API_URL;

interface Departamento {
  NRO_DPTO: number;
  ID_FASE: number;
  nombreFase: string; // Nombre de la fase para mostrar al usuario
}

interface Movimiento {
  ID_ACCESO: number;
  ID_USUARIO: number;
  DNI: number;
  nombre: string;
  CORREO: string;
  NRO_DPTO: number | null;
  ID_FASE: number | null; // Añadido para registrar la fase
  FECHA_ACCESO: string;
  EXITO: number;
  MOTIVO_FALLO: string | null;
  puerta: string;
  descripcion: string;
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
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  @media (min-width: 640px) {
    padding: 1.5rem;
  }
  @media (min-width: 1024px) {
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
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const TableRow = styled.tr<{ $exito: number; $delay: number }>`
  animation: ${fadeIn} 0.5s ease-out forwards;
  animation-delay: ${(props) => props.$delay}s;
  background-color: ${(props) => (props.$exito ? "#f0fff4" : "#fef2f2")};
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

  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);

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

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscarPorDNI = async () => {
    const token = localStorage.getItem("token");
    if (!dni) {
      Swal.fire("Advertencia", "Por favor, ingresa un DNI válido", "warning");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usuarios/${dni}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Usuario no encontrado");
      const data = await response.json();

      // Si el usuario tiene múltiples departamentos, mostrar un selector
      if (data.departamentos && data.departamentos.length > 1) {
        const departamentosOptions = data.departamentos
          .map(
            (dpto: Departamento) =>
              `<option value="${dpto.NRO_DPTO}|${dpto.ID_FASE}">${dpto.NRO_DPTO} (Fase: ${dpto.nombreFase})</option>`
          )
          .join("");

        const { value: selectedDpto } = await Swal.fire({
          title: "¿Registrar ingreso para este usuario?",
          html: `
            <p><strong>Nombre:</strong> ${data.nombre}</p>
            <p><strong>Correo:</strong> ${data.CORREO}</p>
            <label><strong>Seleccionar Departamento:</strong></label>
            <select id="dptoSelect" class="swal2-select">
              ${departamentosOptions}
            </select>
          `,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Registrar",
          cancelButtonText: "Cancelar",
          preConfirm: () => {
            const select = document.getElementById("dptoSelect") as HTMLSelectElement;
            return select.value; // Devuelve "NRO_DPTO|ID_FASE"
          },
        });

        if (selectedDpto) {
          const [nroDpto, idFase] = selectedDpto.split("|").map(Number);
          await registrarIngreso(data, nroDpto, idFase);
        } else {
          setDni("");
        }
      } else {
        // Caso de un solo departamento
        const nroDpto = data.departamentos?.[0]?.NRO_DPTO ?? null;
        const idFase = data.departamentos?.[0]?.ID_FASE ?? null;
        const content = `
          <p><strong>Nombre:</strong> ${data.nombre}</p>
          <p><strong>Correo:</strong> ${data.CORREO}</p>
          <p><strong>Dpto:</strong> ${nroDpto ?? "-"}</p>
          <p><strong>Fase:</strong> ${data.departamentos?.[0]?.nombreFase ?? "-"}</p>
        `;

        const result = await Swal.fire({
          title: "¿Registrar este ingreso?",
          html: content,
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Registrar",
          cancelButtonText: "Cancelar",
        });

        if (result.isConfirmed) {
          await registrarIngreso(data, nroDpto, idFase);
        } else {
          setDni("");
        }
      }
    } catch (error) {
      Swal.fire("Error", "No se encontró un usuario con ese DNI", "error");
      setDni("");
    }
  };

  const registrarIngreso = async (userData: any, nroDpto: number | null, idFase: number | null) => {
    const token = localStorage.getItem("token");
    try {
      const postResponse = await fetch(`${API_URL}/movements/registrar-acceso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dni, NRO_DPTO: nroDpto, ID_FASE: idFase }),
      });

      const resultData = await postResponse.json();
      if (resultData.success) {
        Swal.fire("¡Registrado!", resultData.message, "success");
        setDni("");
        fetchMovements();
      } else {
        Swal.fire("Error", resultData.message, "error");
        setDni("");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo registrar el ingreso", "error");
      setDni("");
    }
  };

  const exportToExcel = () => {
    const headers = [
      "ID Acceso",
      "ID Usuario",
      "Nombre",
      "Correo",
      "Nro Dpto",
      "Fase",
      "Fecha Acceso",
      "Éxito",
      "Motivo Fallo",
      "Puerta",
      "Descripción",
    ];
    const data = movimientos.map((mov) => [
      mov.ID_ACCESO,
      mov.ID_USUARIO,
      mov.nombre,
      mov.CORREO,
      mov.NRO_DPTO ?? "-",
      mov.ID_FASE ?? "-", // Añadido para mostrar la fase
      new Date(mov.FECHA_ACCESO).toLocaleString(),
      mov.EXITO ? "Sí" : "No",
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
      coincide = (mov.NRO_DPTO?.toString() || "").includes(texto);
    }

    return coincide && (filter.fecha === "" || fechaAcceso === filter.fecha);
  });

  return (
    <Container>
      <Title>Control de Ingresos y Salidas</Title>
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 border-b">
          <TabButton
            active={activeTab === "register"}
            onClick={() => setActiveTab("register")}
          >
            Registrar Ingreso
          </TabButton>
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          >
            Historial de Movimientos
          </TabButton>
        </div>
      </div>
      <TabContent>
        {activeTab === "register" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Registrar ingreso por DNI</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  DNI del usuario
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    placeholder="Ejemplo: 12345678"
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
              <div className="flex items-end">
                <Button
                  className="bg-blue-600 text-white hover:bg-blue-700 w-full"
                  onClick={handleBuscarPorDNI}
                >
                  Registrar
                </Button>
              </div>
            </div>
          </Card>
        )}
        {activeTab === "history" && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">Historial de Movimientos</h2>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
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
              <div className="flex justify-end mt-4 lg:mt-0">
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
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      DNI
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Nombre
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Correo
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Nro Dpto
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fase
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Fecha Acceso
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Éxito
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Motivo Fallo
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Puerta
                    </th>
                    <th className="py-3 px-4 border-b text-left text-sm font-semibold">
                      Descripción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-4 text-center text-gray-500">
                        No hay movimientos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((mov, index) => (
                      <TableRow
                        key={mov.ID_ACCESO}
                        $exito={mov.EXITO}
                        $delay={index * 0.1}
                      >
                        <td className="py-3 px-4">{mov.DNI}</td>
                        <td className="py-3 px-4">{mov.nombre}</td>
                        <td className="py-3 px-4">{mov.CORREO}</td>
                        <td className="py-3 px-4">{mov.NRO_DPTO ?? "-"}</td>
                        <td className="py-3 px-4">{mov.ID_FASE ?? "-"}</td>
                        <td className="py-3 px-4">
                          {new Date(mov.FECHA_ACCESO).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4">{mov.MOTIVO_FALLO ?? "-"}</td>
                        <td className="py-3 px-4">{mov.puerta}</td>
                        <td className="py-3 px-4">{mov.descripcion}</td>
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