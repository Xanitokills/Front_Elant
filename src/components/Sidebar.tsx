import { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import * as FaIcons from "react-icons/fa";
import { FaChevronDown, FaSearch, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const getIconComponent = (iconName) => {
  const Icon = FaIcons[iconName];
  return Icon ? <Icon /> : null;
};

const Sidebar = ({ closeSidebar, sidebarOpen }) => {
  const { logout, userId, userName, role, isAuthenticated, isLoading } =
    useAuth();
  const [openSections, setOpenSections] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarStructure, setSidebarStructure] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);

  const toggleSection = (title) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    console.log("🧠 useEffect ejecutado (Sidebar)");
    console.log("👤 userId actual:", userId);

    const fetchSidebar = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !userId) return;

        const API_URL = import.meta.env.VITE_API_URL;
        console.log(`📡 Llamando a: ${API_URL}/sidebar/${userId}`);

        const res = await axios.get(`${API_URL}/sidebar/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const menus = res.data;

        const structure = menus.map((menu) => ({
          title: menu.MENU_NOMBRE,
          icon: getIconComponent(menu.ICONO),
          items: JSON.parse(menu.SUBMENUS || "[]").map((sub) => ({
            label: sub.SUBMENU_NOMBRE,
            path: sub.URL,
            icon: getIconComponent(sub.ICONO),
          })),
        }));

        setSidebarStructure(structure);
        hasFetchedRef.current = true;
      } catch (err) {
        console.error("❌ Error al obtener el menú:", err);
      }
    };

    if (!isLoading && isAuthenticated && userId && !hasFetchedRef.current) {
      fetchSidebar();
    }
  }, [isLoading, isAuthenticated, userId]);

  if (isLoading || !isAuthenticated || !userId) {
    console.log("⏳ Esperando a que el contexto esté listo...");
    return null;
  }

  return (
    <div
      className={`w-64 bg-gray-900 text-white h-screen p-4 flex flex-col z-50 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 fixed top-0 left-0`}
    >
      {/* Usuario */}
      <div className="flex items-center mb-4">
        <img
          src="https://randomuser.me/api/portraits/men/75.jpg"
          alt="Usuario"
          className="w-12 h-12 rounded-full mr-3"
        />
        <div>
          <p className="font-semibold">{userName || "Usuario"}</p>
          <p className="text-sm text-gray-400">{role || "Invitado"}</p>
        </div>
      </div>

      {/* Buscador */}
      <form autoComplete="off">
        {" "}
        {/* 👈 envolvemos en un form con autoComplete="off" */}
        <div className="flex items-center gap-3 mb-4">
          <FaSearch className="text-gray-400" />
          <input
            type="search"
            name="search_sidebar" // 👈 nombre poco común
            autoComplete="off" // 👈 explícito en el input también
            placeholder="Buscar..."
            className="w-full p-1 rounded bg-gray-800 text-white placeholder-gray-400 outline-none"
            onChange={handleSearch}
          />
        </div>
      </form>

      {/* Menús dinámicos */}
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
              <span className="flex items-center gap-2">
                {section.icon}
                {section.title}
              </span>
              <FaChevronDown
                className={`transform transition-transform duration-300 ${
                  openSections[section.title] ? "rotate-180" : "rotate-0"
                }`}
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

      {/* Logout */}
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
