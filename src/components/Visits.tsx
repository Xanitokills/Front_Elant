import { useState, useEffect } from "react";
import { FaSearch, FaSave, FaFileExport } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

interface Visitante {
  ID_VISITA: number;
  NRO_DPTO: number | null;
  NOMBRE_VISITANTE: string;
  DNI_VISITANTE: string;
  FECHA_INGRESO: string;
  FECHA_SALIDA: string | null;
  MOTIVO: string;
  ID_USUARIO_REGISTRO: number;
  ESTADO: number;
}

const Visits = () => {
  const [dni, setDni] = useState("");
  const [nombreVisitante, setNombreVisitante] = useState("");
  const [nroDpto, setNroDpto] = useState(""); // New state for department number
  const [motivo, setMotivo] = useState("");
  const [visitas, setVisitas] = useState<Visitante[]>([]);
  const [filter, setFilter] = useState({ nombre: "", fecha: "" });
  const [error, setError] = useState("");

  const { userId } = useAuth(); // Assuming you add userId to AuthContext
  const now = new Date();
  const currentDate = now.toISOString().slice(0, 10);

  // Fetch visits from the backend
  const fetchVisits = async () => {
    try {
      const response = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/visits", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Error al obtener las visitas");
      const data = await response.json();
      setVisitas(data);
    } catch (err) {
      console.error("Error al obtener las visitas:", err);
    }
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
      const response = await fetch(
        `https://sntps2jn-4000.brs.devtunnels.ms/api/dni?dni=${dni}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Error al buscar el DNI");
      const data = await response.json();
      setNombreVisitante(data.nombreCompleto);
    } catch (err) {
      setError("No se pudo encontrar el DNI");
      console.error("Error al buscar el DNI:", err);
    }
  };

  // Handle saving a visit
// Handle saving a visit
const handleSaveVisit = async () => {
    if (!nombreVisitante || !motivo || !nroDpto) {
      setError("Por favor, complete todos los campos");
      return;
    }
    setError("");
    try {
      const response = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/visits", {
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
          estado: 1,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al grabar la visita");
      }
      fetchVisits(); // Refresh the list
      setDni("");
      setNombreVisitante("");
      setNroDpto("");
      setMotivo("");
    } catch (err) {
      // Type the error as Error
      const error = err as Error;
      setError(error.message || "Error al grabar la visita");
      console.error("Error al grabar la visita:", error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Filter visits
  const filteredVisitas = visitas.filter((visita) => {
    const fechaIngreso = new Date(visita.FECHA_INGRESO).toISOString().slice(0, 10);
    return (
      (filter.nombre === "" ||
        visita.NOMBRE_VISITANTE.toLowerCase().includes(filter.nombre.toLowerCase())) &&
      (filter.fecha === "" || fechaIngreso === filter.fecha)
    );
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = "ID Visita,Número Dpto,Nombre Visitante,DNI,Fecha Ingreso,Fecha Salida,Motivo,Estado\n";
    const rows = filteredVisitas
      .map((visita) =>
        `${visita.ID_VISITA},${visita.NRO_DPTO},${visita.NOMBRE_VISITANTE},${visita.DNI_VISITANTE},${visita.FECHA_INGRESO},${visita.FECHA_SALIDA ?? "-"},${visita.MOTIVO},${visita.ESTADO}`
      )
      .join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visitas.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Registro de Visitas</h1>

      {/* Formulario de Búsqueda y Registro */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">Registrar Visita</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">DNI</label>
            <div className="flex">
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese DNI (8 dígitos)"
              />
              <button
                onClick={handleSearchDni}
                className="ml-2 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
              >
                <FaSearch />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre y Apellidos</label>
            <input
              type="text"
              value={nombreVisitante}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Número de Departamento</label>
            <input
              type="number"
              value={nroDpto}
              onChange={(e) => setNroDpto(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nro. Dpto"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Motivo</label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Motivo de la visita"
            />
          </div>
        </div>
        <button
          onClick={handleSaveVisit}
          className="mt-4 flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          <FaSave className="mr-2" />
          Grabar Visita
        </button>
      </div>

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
              max={currentDate}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabla de Visitas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Historial de Visitas</h2>
          <button
            onClick={exportToCSV}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            <FaFileExport className="mr-2" />
            Exportar a CSV
          </button>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3">ID Visita</th>
              <th className="p-3">Número Dpto</th>
              <th className="p-3">Nombre Visitante</th>
              <th className="p-3">DNI</th>
              <th className="p-3">Fecha Ingreso</th>
              <th className="p-3">Fecha Salida</th>
              <th className="p-3">Motivo</th>
              <th className="p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisitas.map((visita) => (
              <tr key={visita.ID_VISITA} className="border-b">
                <td className="p-3">{visita.ID_VISITA}</td>
                <td className="p-3">{visita.NRO_DPTO}</td>
                <td className="p-3">{visita.NOMBRE_VISITANTE}</td>
                <td className="p-3">{visita.DNI_VISITANTE}</td>
                <td className="p-3">{new Date(visita.FECHA_INGRESO).toLocaleString()}</td>
                <td className="p-3">{visita.FECHA_SALIDA ? new Date(visita.FECHA_SALIDA).toLocaleString() : "-"}</td>
                <td className="p-3">{visita.MOTIVO}</td>
                <td className="p-3">{visita.ESTADO === 1 ? "Activo" : "Inactivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Visits;