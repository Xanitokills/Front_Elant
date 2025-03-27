import { Link } from "react-router-dom";
import { FaTachometerAlt, FaSignOutAlt, FaUser, FaChartBar, FaCog } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  closeSidebar: () => void;
}

const Sidebar = ({ closeSidebar }: SidebarProps) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-700">Menú</h2>
      </div>
      <nav className="flex-1">
        <ul>
          <li>
            <Link
              to="/dashboard"
              className="flex items-center p-4 text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <FaTachometerAlt className="mr-3" /> Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/personal/movimientos"
              className="flex items-center p-4 text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <FaTachometerAlt className="mr-3" /> Ingresos y Salidas
            </Link>
          </li>
          <li>
            <Link
              to="/users"
              className="flex items-center p-4 text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <FaUser className="mr-3" /> Usuarios
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className="flex items-center p-4 text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <FaUser className="mr-3" /> Perfil
            </Link>
          </li>
          <li>
            <Link
              to="/statistics"
              className="flex items-center p-4 text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <FaChartBar className="mr-3" /> Estadísticas
            </Link>
          </li>
          <li>
            <Link
              to="/settings/general"
              className="flex items-center p-4 text-gray-700 hover:bg-gray-100"
              onClick={closeSidebar}
            >
              <FaCog className="mr-3" /> Configuración
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4">
        <button
          className="flex items-center p-4 text-gray-700 hover:bg-gray-100 w-full"
          onClick={handleLogout}
        >
          <FaSignOutAlt className="mr-3" /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;