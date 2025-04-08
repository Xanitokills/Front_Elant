import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaList,
  FaCog,
  FaSignOutAlt,
  FaDoorOpen,
  FaUserFriends,
  FaChevronDown,
  FaSearch,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const sidebarStructure = [
  {
    title: "Usuarios",
    items: [
      { label: "Registrar Usuarios", path: "/users", icon: <FaUsers /> },
      { label: "Lista de Usuarios", path: "/user-list", icon: <FaList /> },
    ],
  },
  {
    title: "Control de Accesos",
    items: [
      { label: "Control de Ingresos y Salidas", path: "/movements-list", icon: <FaDoorOpen /> },
      { label: "Visitas", path: "/visits", icon: <FaUserFriends /> },
    ],
  },
  {
    title: "Configuración",
    items: [
      { label: "Login", path: "/LoginConfig", icon: <FaCog /> }, 
    ],
  },
];

const Sidebar = ({ closeSidebar, sidebarOpen }) => {
  const { logout, user } = useAuth();
  const [openSections, setOpenSections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  return (
    <div
      className={`w-64 bg-gray-900 text-white h-screen p-4 flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 fixed top-0 left-0`}
    >
      {/* Usuario */}
      <div className="flex items-center mb-4">
        <img
          src={user?.avatarUrl || "https://randomuser.me/api/portraits/men/75.jpg"}
          alt="Usuario"
          className="w-12 h-12 rounded-full mr-3"
        />
        <div>
          <p className="font-semibold">{user?.name || "Usuario"}</p>
          <p className="text-sm text-gray-400">{user?.role || "Invitado"}</p>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3 mb-4">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          className="w-full p-1 rounded bg-gray-800 text-white placeholder-gray-400 outline-none"
          onChange={handleSearch}
        />
      </div>

      {sidebarStructure.map((section) => {
        const filteredItems = section.items.filter((item) =>
          item.label.toLowerCase().includes(searchTerm)
        );
        if (filteredItems.length === 0) return null;

        return (
          <div key={section.title} className="mb-4">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex justify-between items-center font-bold text-sm mb-1 px-2 py-1 rounded hover:bg-gray-800"
            >
              <span>{section.title}</span>
              <FaChevronDown
                className={`transform transition-transform duration-300 ${openSections[section.title] ? "rotate-180" : "rotate-0"}`}
              />
            </button>
            {openSections[section.title] && (
              <nav>
                {filteredItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded text-sm mb-1 transition-colors duration-200
                      ${isActive ? "bg-gray-700" : "hover:bg-gray-800"}`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        );
      })}

      <button
        onClick={() => {
          logout();
          closeSidebar();
        }}
        className="flex items-center p-3 rounded-lg hover:bg-gray-800 mt-auto"
      >
        <FaSignOutAlt className="mr-3" />
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;
