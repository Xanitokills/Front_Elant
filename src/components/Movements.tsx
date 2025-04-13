import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaFileExport } from "react-icons/fa";
const API_URL = import.meta.env.VITE_API_URL;

interface Movimiento {
  ID_ACCESO: number;
  ID_USUARIO: number;
  DNI: number;
  nombre: string;
  CORREO: string;
  NRO_DPTO: number | null;
  FECHA_ACCESO: string;
  EXITO: number;
  MOTIVO_FALLO: string | null;
  puerta: string;
  descripcion: string;
}

const Movements = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filter, setFilter] = useState({
    campo: "nombre",
    valor: "",
    fecha: new Date().toISOString().slice(0, 10),
  });
  const [dni, setDni] = useState("");

  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);

  const fetchMovements = async () => {
    try {
      const response = await fetch(`${API_URL}/movements`);
      if (!response.ok) throw new Error("Error al obtener los movimientos");
      const data = await response.json();
      setMovimientos(data);
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
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

  const exportToCSV = () => {
    const headers =
      "ID Acceso,ID Usuario,Nombre,Correo,Nro Dpto,Fecha Acceso,Éxito,Motivo Fallo,Puerta,Descripción\n";
    const rows = movimientos
      .map((mov) =>
        `${mov.ID_ACCESO},${mov.ID_USUARIO},${mov.nombre},${mov.CORREO},${
          mov.NRO_DPTO ?? "-"
        },${mov.FECHA_ACCESO},${mov.EXITO ? "Sí" : "No"},${
          mov.MOTIVO_FALLO ?? "-"
        },${mov.puerta},${mov.descripcion}`
      )
      .join("\n");

    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "movimientos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBuscarPorDNI = async () => {
    if (!dni)
      return Swal.fire("Advertencia", "Por favor, ingresa un DNI válido", "warning");

    try {
      const response = await fetch(`${API_URL}/usuarios/${dni}`);
      if (!response.ok) throw new Error("Usuario no encontrado");
      const data = await response.json();

      const content = `
        <p><strong>Nombre:</strong> ${data.nombre}</p>
        <p><strong>Correo:</strong> ${data.CORREO}</p>
        <p><strong>Dpto:</strong> ${data.NRO_DPTO ?? "-"}</p>
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
        const postResponse = await fetch(`${API_URL}/movements/registrar-acceso`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dni }),
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
      } else {
        setDni("");
      }
    } catch (error) {
      Swal.fire("Error", "No se encontró un usuario con ese DNI", "error");
      setDni("");
    }
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
    <div className="p-4 md:p-6 w-full max-w-[1440px] mx-auto min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-center md:text-left animate-slide-in-down">
        Control de Ingresos y Salidas
      </h1>

      {/* Registro por DNI */}
      <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg mb-6 transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-lg font-semibold mb-4">Registrar ingreso por DNI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              DNI del usuario
            </label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ejemplo: 12345678"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBuscarPorDNI}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 w-full transform hover:-translate-y-1"
            >
              Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros + Tabla */}
      <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Buscar por
              </label>
              <select
                name="campo"
                value={filter.campo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
              >
                <option value="nombre">Nombre</option>
                <option value="dni">DNI</option>
                <option value="departamento">Nro Departamento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Valor a buscar
              </label>
              <input
                type="text"
                name="valor"
                value={filter.valor}
                onChange={handleFilterChange}
                placeholder="Ingresa el valor a buscar"
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                value={filter.fecha}
                onChange={handleFilterChange}
                max={currentDate}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
              />
            </div>
          </div>

          {/* Botón exportar */}
          <div className="flex justify-end mt-4 md:mt-0">
            <button
              onClick={exportToCSV}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 transform hover:-translate-y-1"
            >
              <FaFileExport className="mr-2" />
              Exportar a CSV
            </button>
          </div>
        </div>

        {/* Tabla */}
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
                  <td colSpan={9} className="py-4 text-center text-gray-500">
                    No hay movimientos para mostrar.
                  </td>
                </tr>
              ) : (
                filteredMovimientos.map((mov, index) => (
                  <tr
                    key={mov.ID_ACCESO}
                    className={`border-b transition-colors duration-200 hover:bg-gray-50 animate-fade-in ${
                      mov.EXITO ? "bg-green-50" : "bg-red-50"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="py-3 px-4">{mov.DNI}</td>
                    <td className="py-3 px-4">{mov.nombre}</td>
                    <td className="py-3 px-4">{mov.CORREO}</td>
                    <td className="py-3 px-4">{mov.NRO_DPTO ?? "-"}</td>
                    <td className="py-3 px-4">
                      {new Date(mov.FECHA_ACCESO).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          mov.EXITO
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {mov.EXITO ? "Sí" : "No"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{mov.MOTIVO_FALLO ?? "-"}</td>
                    <td className="py-3 px-4">{mov.puerta}</td>
                    <td className="py-3 px-4">{mov.descripcion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in-down {
          animation: slide-in-down 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Movements;