import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  useAuth();

  // No necesitamos useEffect ni navigate aquí, porque App.tsx ya maneja las redirecciones
  // Si el usuario no está autenticado, App.tsx lo redirigirá a /login

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800">Bienvenido al Dashboard</h1>
      <p className="text-gray-600 mt-2">Aquí puedes ver el contenido de tu aplicación.</p>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-4 rounded-lg shadow-md border-t-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">Usuarios Activos</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">1,320</p>
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