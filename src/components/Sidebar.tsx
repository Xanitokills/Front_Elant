import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import {
  FaChevronDown,
  FaSearch,
  FaSignOutAlt
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import styled from "styled-components";

// Estilos con styled-components (sin cambios)
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
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      #2d3748 20%,
      #2d3748 80%,
      transparent
    );
  }
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
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      #2d3748 20%,
      #2d3748 80%,
      transparent
    );
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background-color: #2d3748;
  color: #ffffff;
  placeholder-color: #a0aec0;
  outline: none;
  transition: ring 0.2s ease;

  &:focus {
    ring: 1px solid #3b82f6;
  }
`;

const MenuList = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const MenuItem = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const MenuButtonWrapper = styled.div`
  position: relative;

  &:hover button {
    background-color: #2d3748;
  }
`;

const MenuButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease;
  background-color: ${({ isOpen }) => (isOpen ? "#4a5568" : "transparent")};
`;

const SubmenuList = styled.nav`
  position: relative;
  margin-left: 1rem;
  margin-top: 0.5rem;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;

  &.open {
    max-height: 500px;
  }
`;

const SubmenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
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
  border-radius: 0.75rem;
  width: 100%;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2d3748;
  }
`;

// Función para obtener el componente de ícono correspondiente
const getIconComponent = (iconName: string) => {
  const Icon = FaIcons[iconName as keyof typeof FaIcons];
  return Icon ? <Icon /> : null;
};

interface SidebarStructure {
  title: string;
  icon: JSX.Element | null;
  items: { label: string; path: string; icon: JSX.Element | null }[];
}

const Sidebar = ({
  closeSidebar,
  sidebarOpen,
}: {
  closeSidebar: () => void;
  sidebarOpen: boolean;
}) => {
  const { logout, userName, role, isAuthenticated, isLoading, sidebarData } =
    useAuth();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarStructure, setSidebarStructure] = useState<SidebarStructure[]>([]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const newState: { [key: string]: boolean } = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = false;
      });
      newState[title] = !prev[title];
      return newState;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Procesar los datos del menú desde AuthContext
  useEffect(() => {
    if (sidebarData && sidebarData.length > 0) {
      const structure = sidebarData.map((menu: any) => ({
        title: menu.MENU_NOMBRE,
        icon: getIconComponent(menu.MENU_ICONO),
        items: menu.SUBMENUS.sort(
          (a: any, b: any) => a.SUBMENU_ORDEN - b.SUBMENU_ORDEN
        ).map((sub: any) => ({
          label: sub.SUBMENU_NOMBRE,
          path: sub.SUBMENU_URL,
          icon: getIconComponent(sub.SUBMENU_ICONO),
        })),
      }));
      setSidebarStructure(structure);
    } else {
      setSidebarStructure([]);
    }
  }, [sidebarData]);

  if (isLoading || !isAuthenticated) {
    console.log("⏳ Esperando a que el contexto esté listo...");
    return null;
  }

  return (
    <SidebarContainer sidebarOpen={sidebarOpen}>
      <FixedHeader>
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

      <ScrollableContent>
        {sidebarStructure.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay menús disponibles</p>
        ) : (
          <MenuList>
            {sidebarStructure.map((section) => {
              const filteredItems = section.items.filter((item) =>
                item.label.toLowerCase().includes(searchTerm)
              );
              if (filteredItems.length === 0) return null;

              return (
                <MenuItem key={section.title}>
                  <MenuButtonWrapper>
                    <MenuButton
                      isOpen={openSections[section.title]}
                      onClick={() => toggleSection(section.title)}
                    >
                      <span className="flex items-center gap-2">
                        {section.icon}
                        {section.title}
                      </span>
                      <FaChevronDown
                        className={`transform transition-transform duration-300 ${
                          openSections[section.title]
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    </MenuButton>
                  </MenuButtonWrapper>
                  <SubmenuList
                    className={openSections[section.title] ? "open" : ""}
                  >
                    {filteredItems.map((item) => (
                      <SubmenuItem
                        key={item.path}
                        to={item.path}
                        onClick={closeSidebar}
                      >
                        {item.icon}
                        {item.label}
                      </SubmenuItem>
                    ))}
                  </SubmenuList>
                </MenuItem>
              );
            })}
          </MenuList>
        )}
      </ScrollableContent>

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