import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaList,
  FaCog,
  FaSignOutAlt,
  FaDoorOpen,
  FaUserFriends,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  closeSidebar: () => void;
  sidebarOpen: boolean;
}

const Sidebar = ({ closeSidebar, sidebarOpen }: SidebarProps) => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  return (
    <div
      className={`w-64 bg-gray-900 text-white h-screen p-4 flex flex-col z-50 transition-transform duration-300
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      md:relative md:translate-x-0 md:block fixed top-0 left-0`}
    >
      <div className="flex items-center mb-6">
        <img
          src="https://randomuser.me/api/portraits/men/75.jpg"
          alt="Logo"
          className="w-12 h-12 rounded-full mr-3"
        />
        <h1 className="text-xl font-bold">Mi App</h1>
      </div>
      <nav className="flex-1">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg mb-2 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
          onClick={closeSidebar}
        >
          <FaTachometerAlt className="mr-3" />
          Dashboard
        </NavLink>
        <NavLink
          to="/users"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg mb-2 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
          onClick={closeSidebar}
        >
          <FaUsers className="mr-3" />
          Registrar Usuarios
        </NavLink>
        <NavLink
          to="/user-list"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg mb-2 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
          onClick={closeSidebar}
        >
          <FaList className="mr-3" />
          Lista de Usuarios
        </NavLink>
        <NavLink
          to="/movements-list"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg mb-2 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
          onClick={closeSidebar}
        >
          <FaDoorOpen className="mr-3" />
          Control de Ingresos y Salidas
        </NavLink>
        <NavLink
          to="/visits"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg mb-2 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
          onClick={closeSidebar}
        >
          <FaUserFriends className="mr-3" />
          Visitas
        </NavLink>
        <NavLink
          to="/settings/general"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg mb-2 ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
          onClick={closeSidebar}
        >
          <FaCog className="mr-3" />
          Configuración
        </NavLink>
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center p-3 rounded-lg hover:bg-gray-800 mt-auto"
      >
        <FaSignOutAlt className="mr-3" />
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;
