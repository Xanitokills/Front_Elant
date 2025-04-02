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
  const [filter, setFilter] = useState({ campo: "nombre", valor: "", fecha: new Date().toISOString().slice(0, 10) });
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

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const exportToCSV = () => {
    const headers = "ID Acceso,ID Usuario,Nombre,Correo,Nro Dpto,Fecha Acceso,Éxito,Motivo Fallo,Puerta,Descripción\n";
    const rows = movimientos.map((mov) =>
      `${mov.ID_ACCESO},${mov.ID_USUARIO},${mov.nombre},${mov.CORREO},${mov.NRO_DPTO ?? "-"},${mov.FECHA_ACCESO},${mov.EXITO ? "Sí" : "No"},${mov.MOTIVO_FALLO ?? "-"},${mov.puerta},${mov.descripcion}`
    ).join("\n");

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
    if (!dni) return Swal.fire("Advertencia", "Por favor, ingresa un DNI válido", "warning");
  
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
          setDni(""); // Limpia DNI
          fetchMovements();
        } else {
          Swal.fire("Error", resultData.message, "error");
          setDni(""); // Limpia también en caso de error
        }
      } else {
        setDni(""); // Limpia si se cancela
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

    return (
      coincide &&
      (filter.fecha === "" || fechaAcceso === filter.fecha)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Control de Ingresos y Salidas</h1>

      {/* Registro por DNI */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Registrar ingreso por DNI</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">DNI del usuario</label>
            <input
              type="text"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ejemplo: 12345678"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleBuscarPorDNI}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 w-full"
            >
              Buscar y Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros + Tabla */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700">Buscar por</label>
              <select
                name="campo"
                value={filter.campo}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="nombre">Nombre</option>
                <option value="dni">DNI</option>
                <option value="departamento">Nro Departamento</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor a buscar</label>
              <input
                type="text"
                name="valor"
                value={filter.valor}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={filter.fecha}
                onChange={handleFilterChange}
                max={currentDate}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Botón exportar */}
          <div className="flex justify-end mt-4 md:mt-0">
            <button
              onClick={exportToCSV}
              className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
            >
              <FaFileExport className="mr-2" />
              Exportar a CSV
            </button>
          </div>
        </div>

        {/* Tabla */}
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
{/*               <th className="p-3">ID Acceso</th>
              <th className="p-3">ID Usuario</th> */}
              <th className="p-3">DNI</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Nro Dpto</th>
              <th className="p-3">Fecha Acceso</th>
              <th className="p-3">Éxito</th>
              <th className="p-3">Motivo Fallo</th>
              <th className="p-3">Puerta</th>
              <th className="p-3">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovimientos.map((mov) => (
              <tr key={mov.ID_ACCESO} className="border-b">
{/*                 <td className="p-3">{mov.ID_ACCESO}</td>
                <td className="p-3">{mov.ID_USUARIO}</td> */}
                <td className="p-3">{mov.DNI}</td>
                <td className="p-3">{mov.nombre}</td>
                <td className="p-3">{mov.CORREO}</td>
                <td className="p-3">{mov.NRO_DPTO ?? "-"}</td>
                <td className="p-3">{new Date(mov.FECHA_ACCESO).toLocaleString()}</td>
                <td className="p-3">{mov.EXITO ? "Sí" : "No"}</td>
                <td className="p-3">{mov.MOTIVO_FALLO ?? "-"}</td>
                <td className="p-3">{mov.puerta}</td>
                <td className="p-3">{mov.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Movements;
