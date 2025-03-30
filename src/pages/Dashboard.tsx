import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL; // Cargar la URL desde .env

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await fetch(`${API_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userName");
          localStorage.removeItem("role");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Error al obtener los usuarios");
        }

        const data = await response.json();
        setActiveUsers(data.length);
      } catch (error) {
        console.error("Error al cargar los usuarios:", error);
      }
    };

    if (isAuthenticated) {
      fetchActiveUsers();
    }
  }, [isAuthenticated, token, navigate]);

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800">Bienvenido al Dashboard</h1>
      <p className="text-gray-600 mt-2">Aquí puedes ver el contenido de tu aplicación.</p>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Usuarios Activos</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {activeUsers !== null ? activeUsers.toLocaleString() : "Cargando..."}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Ventas Totales</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">$ 23,540</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-yellow-500">
          <h3 className="text-lg font-semibold text-gray-700">Nuevas Solicitudes</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">98</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
