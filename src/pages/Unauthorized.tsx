import { Link } from "react-router-dom";

const Unauthorized = () => (
  <div className="p-6 flex items-center justify-center min-h-screen bg-gray-100">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-red-600">Acceso no autorizado</h1>
      <p className="mt-4 text-lg">No tienes permiso para acceder a esta página.</p>
      <Link
        to="/dashboard"
        className="mt-6 inline-block bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
      >
        Volver al Dashboard
      </Link>
    </div>
  </div>
);

export default Unauthorized;