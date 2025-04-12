import { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import * as FaIcons from "react-icons/fa";
import { FaChevronDown, FaSearch, FaSignOutAlt, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import styled from "styled-components";

// Función para obtener el componente de ícono correspondiente
const getIconComponent = (iconName: string) => {
  const Icon = FaIcons[iconName as keyof typeof FaIcons];
  return Icon ? <Icon /> : null;
};

// Estilos con styled-components
const SidebarContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "sidebarOpen",
})<{ sidebarOpen: boolean }>`
  width: 16rem;
  background-color: #1a202c;
  color: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: transform 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;

  @media (min-width: 768px) {
    position: relative;
    transform: translateX(0);
  }

  transform: ${({ sidebarOpen }) =>
    sidebarOpen ? "translateX(0)" : "translateX(-100%)"};
`;

const FixedHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #2d3748;
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: background 0.3s ease;
  }

  &:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
  }
`;

const Footer = styled.div`
  padding: 1rem;
  border-top: 1px solid #2d3748;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.25rem;
  border-radius: 0.25rem;
  background-color: #2d3748;
  color: #ffffff;
  placeholder-color: #a0aec0;
  outline: none;
  transition: ring 0.2s ease;

  &:focus {
    ring: 1px solid #3b82f6;
  }
`;

const MenuButton = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2d3748;
  }
`;

const NavLinkStyled = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: #2d3748;
  }

  &.active {
    background-color: #4a5568;
    color: #93c5fd;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.5rem;
  width: 100%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2d3748;
  }
`;

interface SidebarStructure {
  title: string;
  icon: JSX.Element | null;
  items: { label: string; path: string; icon: JSX.Element | null }[];
}

const Sidebar = ({ closeSidebar, sidebarOpen }: { closeSidebar: () => void; sidebarOpen: boolean }) => {
  const { logout, userId, userName, role, isAuthenticated, isLoading } = useAuth();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarStructure, setSidebarStructure] = useState<SidebarStructure[]>([]);
  const hasFetchedRef = useRef(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  useEffect(() => {
    console.log("🧠 useEffect ejecutado (Sidebar)");
    console.log("👤 userId actual:", userId);

    const fetchSidebar = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !userId) {
          console.warn("Falta token o userId");
          return;
        }

        const API_URL = import.meta.env.VITE_API_URL;
        console.log(`📡 Llamando a: ${API_URL}/sidebar/${userId}`);

        const res = await axios.get(`${API_URL}/sidebar/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Menús obtenidos:", res.data);

        // Accede al primer elemento del array y luego a la clave que contiene el JSON
        const menuObject = res.data[0];
        const menusData = menuObject[Object.keys(menuObject)[0]];
        console.log("Datos de menús JSON:", menusData);

        // Verifica si menusData es una cadena y parsea
        let menus;
        if (typeof menusData === "string") {
          menus = JSON.parse(menusData);
        } else {
          console.error("Formato de datos no válido, se esperaba una cadena:", menusData);
          return;
        }

        console.log("Estructura de menús:", menus);

        // Procesar los menús
        const structure = menus.map((menu: any) => ({
          title: menu.MENU_NOMBRE,
          icon: getIconComponent(menu.MENU_ICONO),
          items: menu.SUBMENUS
            .sort((a: any, b: any) => a.SUBMENU_ORDEN - b.SUBMENU_ORDEN)
            .map((sub: any) => ({
              label: sub.SUBMENU_NOMBRE,
              path: sub.SUBMENU_URL,
              icon: getIconComponent(sub.SUBMENU_ICONO),
            })),
        }));

        console.log("Estructura procesada del sidebar:", structure);
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
    <SidebarContainer sidebarOpen={sidebarOpen}>
      {/* Sección fija: Usuario y Buscador */}
      <FixedHeader>
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
          <div className="flex items-center gap-3 mb-4">
            <FaSearch className="text-gray-400" />
            <SearchInput
              type="search"
              name="search_sidebar"
              autoComplete="off"
              placeholder="Buscar..."
              onChange={handleSearch}
            />
          </div>
        </form>
      </FixedHeader>

      {/* Sección desplazable: Menús */}
      <ScrollableContent>
        {sidebarStructure.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay menús disponibles</p>
        ) : (
          sidebarStructure.map((section) => {
            const filteredItems = section.items.filter((item) =>
              item.label.toLowerCase().includes(searchTerm)
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.title} className="mb-4">
                <MenuButton onClick={() => toggleSection(section.title)}>
                  <span className="flex items-center gap-2">
                    {section.icon}
                    {section.title}
                  </span>
                  <FaChevronDown
                    className={`transform transition-transform duration-300 ${
                      openSections[section.title] ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </MenuButton>
                {openSections[section.title] && (
                  <nav>
                    {filteredItems.map((item) => (
                      <NavLinkStyled
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebar}
                      >
                        {item.icon}
                        {item.label}
                      </NavLinkStyled>
                    ))}
                  </nav>
                )}
              </div>
            );
          })
        )}

        <NavLinkStyled to="/reservas" onClick={closeSidebar}>
          <FaCalendarAlt />
          Reservas
        </NavLinkStyled>
      </ScrollableContent>

      {/* Sección fija: Logout */}
      <Footer>
        <LogoutButton
          onClick={() => {
            logout();
            closeSidebar();
          }}
        >
          <FaSignOutAlt className="mr-3" />
          Cerrar Sesión
        </LogoutButton>
      </Footer>
    </SidebarContainer>
  );
};

export default Sidebar;