import { useState, useEffect } from "react";
import {  FaFileExport } from "react-icons/fa";

// Define the interface for a movement (based on the backend response)
interface Movimiento {
  ID_ACCESO: number;
  ID_USUARIO: number;
  nombre: string;
  CORREO: string;
  NRO_DPTO: number | null;
  FECHA_ACCESO: string;
  EXITO: number;
  MOTIVO_FALLO: string | null;
  puerta: string;
}

const Movements = () => {
  // State for movements
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  // State for filters
  const [filter, setFilter] = useState({
    nombre: "",
    fecha: "",
  });

  // Get the current date for the filter
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10); // Format: "2025-03-26"

  // Fetch movements from the backend
  const fetchMovements = async () => {
    try {
      const response = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/movements");
      if (!response.ok) {
        throw new Error("Error al obtener los movimientos");
      }
      const data = await response.json();
      setMovimientos(data);
    } catch (error) {
      console.error("Error al obtener los movimientos:", error);
    }
  };

  // Fetch movements initially and every 5 seconds
  useEffect(() => {
    fetchMovements(); // Initial fetch
    const interval = setInterval(fetchMovements, 5000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  // Handle filter input changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = "ID Acceso,ID Usuario,Nombre,Correo,Nro Dpto,Fecha Acceso,Éxito,Motivo Fallo,Puerta\n";
    const rows = movimientos
      .map((mov) =>
        `${mov.ID_ACCESO},${mov.ID_USUARIO},${mov.nombre},${mov.CORREO},${mov.NRO_DPTO ?? "-"},${mov.FECHA_ACCESO},${mov.EXITO ? "Sí" : "No"},${mov.MOTIVO_FALLO ?? "-"},${mov.puerta}`
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

  // Filter movements based on name and date
  const filteredMovimientos = movimientos.filter((mov) => {
    const fechaAcceso = new Date(mov.FECHA_ACCESO).toISOString().slice(0, 10); // Extract date part
    return (
      (filter.nombre === "" || mov.nombre.toLowerCase().includes(filter.nombre.toLowerCase())) &&
      (filter.fecha === "" || fechaAcceso === filter.fecha)
    );
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Control de Ingresos y Salidas</h1>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={filter.nombre}
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
              max={currentDate} // Restrict filter to current date or earlier
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Movimientos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Historial de Movimientos</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
          >
            <FaFileExport className="mr-2" />
            Exportar a CSV
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">ID Acceso</th>
              <th className="p-3">ID Usuario</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Correo</th>
              <th className="p-3">Nro Dpto</th>
              <th className="p-3">Fecha Acceso</th>
              <th className="p-3">Éxito</th>
              <th className="p-3">Motivo Fallo</th>
              <th className="p-3">Puerta</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovimientos.map((mov) => (
              <tr key={mov.ID_ACCESO} className="border-b">
                <td className="p-3">{mov.ID_ACCESO}</td>
                <td className="p-3">{mov.ID_USUARIO}</td>
                <td className="p-3">{mov.nombre}</td>
                <td className="p-3">{mov.CORREO}</td>
                <td className="p-3">{mov.NRO_DPTO ?? "-"}</td>
                <td className="p-3">{new Date(mov.FECHA_ACCESO).toLocaleString()}</td>
                <td className="p-3">{mov.EXITO ? "Sí" : "No"}</td>
                <td className="p-3">{mov.MOTIVO_FALLO ?? "-"}</td>
                <td className="p-3">{mov.puerta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Movements;