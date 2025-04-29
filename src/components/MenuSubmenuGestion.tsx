import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import Select, { SingleValue } from "react-select";
import styled, { keyframes } from "styled-components";
import {
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { iconOptions } from "../components/iconList";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL;

// Animations
const slideInDown = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const Container = styled.div`
  padding: 1rem;
  background-color: #f3f4f6;
  min-height: 100vh;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 1rem;
  animation: ${slideInDown} 0.5s ease-out;

  @media (min-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

const Card = styled.div`
  background-color: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
  transition: box-shadow 0.2s ease;
  animation: ${fadeIn} 0.5s ease-out;

  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  @media (min-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
`;

// Interfaces
interface MenuWithSubmenu {
  ID_MENU: number;
  MENU_NOMBRE: string;
  MENU_ICONO: string;
  MENU_URL: string | null;
  MENU_ORDEN: number;
  ID_SUBMENU: number | null;
  SUBMENU_NOMBRE: string | null;
  SUBMENU_ICONO: string | null;
  SUBMENU_URL: string | null;
  SUBMENU_ORDEN: number | null;
}

interface TipoUsuario {
  ID_ROL: number;
  DETALLE_USUARIO: string;
  ESTADO: boolean;
}

interface IconOption {
  value: string;
  label: string;
  icon: JSX.Element;
}

interface Assignments {
  menus: number[];
  submenus: number[];
}

const MenuSubmenuGestion = () => {
  const { refreshSidebar } = useAuth();
  const [menus, setMenus] = useState<MenuWithSubmenu[]>([]);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({ menus: [], submenus: [] });
  const [newMenu, setNewMenu] = useState({ nombre: "", icono: "", url: "" });
  const [newSubmenu, setNewSubmenu] = useState({
    nombre: "",
    icono: "",
    url: "",
    idMenu: "",
  });
  const [activeTab, setActiveTab] = useState("create");
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [editMenuModal, setEditMenuModal] = useState<{
    id: number;
    nombre: string;
    icono: string;
    url: string | null;
  } | null>(null);
  const [editSubmenuModal, setEditSubmenuModal] = useState<{
    id: number;
    nombre: string;
    icono: string;
    url: string;
  } | null>(null);
  const [selectedTipoUsuario, setSelectedTipoUsuario] = useState<string>("");
  const token = localStorage.getItem("token");

  // Fetch menus and user types
  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_URL}/menus-submenus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error al obtener menús: ${res.statusText}`);
      const data = await res.json();
      setMenus(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los menús",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const fetchTiposUsuario = async () => {
    try {
      const res = await fetch(`${API_URL}/tiposUsuario`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error al obtener tipos de usuario: ${res.statusText}`);
      const data = await res.json();
      setTiposUsuario(data.filter((tipo: TipoUsuario) => tipo.ESTADO === true));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los tipos de usuario",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Fetch assignments
  const fetchAssignments = async (idTipoUsuario: string) => {
    if (!idTipoUsuario) {
      setAssignments({ menus: [], submenus: [] });
      return;
    }
    try {
      const res = await fetch(`${API_URL}/rol-menu-submenu/${idTipoUsuario}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener asignaciones");
      const data = await res.json();
      setAssignments(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las asignaciones",
        timer: 2000,
        showConfirmButton: false,
      });
      setAssignments({ menus: [], submenus: [] });
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchTiposUsuario();
  }, []);

  useEffect(() => {
    fetchAssignments(selectedTipoUsuario);
  }, [selectedTipoUsuario]);

  // Icon options for react-select
  const selectIconOptions: IconOption[] = iconOptions.map((opt) => ({
    value: opt.name,
    label: opt.name,
    icon: opt.icon,
  }));

  // Validate field lengths
  const validateLength = (field: string, value: string, maxLength: number) => {
    if (value.length > maxLength) {
      Swal.fire({
        icon: "warning",
        title: "Entrada inválida",
        text: `El campo ${field} no puede exceder ${maxLength} caracteres`,
        timer: 2000,
        showConfirmButton: false,
      });
      return false;
    }
    return true;
  };

  // Create menu
  const handleCreateMenu = async () => {
    if (!newMenu.nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre del menú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!newMenu.icono.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El ícono del menú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!validateLength("nombre", newMenu.nombre, 50)) return;
    if (!validateLength("ícono", newMenu.icono, 50)) return;
    if (newMenu.url && !validateLength("URL", newMenu.url, 100)) return;

    try {
      const res = await fetch(`${API_URL}/menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newMenu),
      });
      if (!res.ok) throw new Error("Error al crear menú");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Menú creado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setNewMenu({ nombre: "", icono: "", url: "" });
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear el menú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Create submenu
  const handleCreateSubmenu = async () => {
    if (!newSubmenu.idMenu) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "Seleccione un menú",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!newSubmenu.nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre del submenú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!newSubmenu.icono.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El ícono del submenú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!newSubmenu.url.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "La URL del submenú es obligatoria",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!validateLength("nombre", newSubmenu.nombre, 50)) return;
    if (!validateLength("ícono", newSubmenu.icono, 50)) return;
    if (!validateLength("URL", newSubmenu.url, 100)) return;

    try {
      const res = await fetch(`${API_URL}/submenu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: newSubmenu.nombre,
          icono: newSubmenu.icono,
          url: newSubmenu.url,
          idMenu: parseInt(newSubmenu.idMenu),
        }),
      });
      if (!res.ok) throw new Error("Error al crear submenú");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Submenú creado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setNewSubmenu({ nombre: "", icono: "", url: "", idMenu: "" });
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo crear el submenú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Update menu
  const handleUpdateMenu = async () => {
    if (!editMenuModal) return;

    if (!editMenuModal.nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre del menú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!editMenuModal.icono.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El ícono del menú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!validateLength("nombre", editMenuModal.nombre, 50)) return;
    if (!validateLength("ícono", editMenuModal.icono, 50)) return;
    if (editMenuModal.url && !validateLength("URL", editMenuModal.url, 100))
      return;

    try {
      const res = await fetch(`${API_URL}/menu/${editMenuModal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: editMenuModal.nombre,
          icono: editMenuModal.icono,
          url: editMenuModal.url || null,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar menú");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Menú actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setEditMenuModal(null);
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el menú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Update submenu
  const handleUpdateSubmenu = async () => {
    if (!editSubmenuModal) return;

    if (!editSubmenuModal.nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre del submenú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!editSubmenuModal.icono.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El ícono del submenú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!editSubmenuModal.url.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "La URL del submenú es obligatoria",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }
    if (!validateLength("nombre", editSubmenuModal.nombre, 50)) return;
    if (!validateLength("ícono", editSubmenuModal.icono, 50)) return;
    if (!validateLength("URL", editSubmenuModal.url, 100)) return;

    try {
      const res = await fetch(`${API_URL}/submenu/${editSubmenuModal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: editSubmenuModal.nombre,
          icono: editSubmenuModal.icono,
          url: editSubmenuModal.url,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar submenú");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Submenú actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setEditSubmenuModal(null);
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el submenú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Delete submenu
  const handleDeleteSubmenu = async (id: number, nombre: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Estás seguro?",
      text: `¿Deseas eliminar el submenú "${nombre}"?`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/submenu/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Error al eliminar submenú");
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Submenú eliminado correctamente",
          timer: 2000,
          showConfirmButton: false,
        });
        fetchMenus();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el submenú",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  // Move submenu up
  const moveSubmenuUp = async (index: number) => {
    if (index === 0) return;

    const reorderedSubmenus = Array.from(filteredSubmenus);
    const newOrder = index;
    const submenuToMove = reorderedSubmenus[index];

    try {
      const res = await fetch(
        `${API_URL}/submenu/${submenuToMove.ID_SUBMENU}/update-order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newOrder }),
        }
      );
      if (!res.ok) throw new Error("Error al actualizar orden");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Orden actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el orden",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Move submenu down
  const moveSubmenuDown = async (index: number) => {
    if (index === filteredSubmenus.length - 1) return;

    const reorderedSubmenus = Array.from(filteredSubmenus);
    const newOrder = index + 2;
    const submenuToMove = reorderedSubmenus[index];

    try {
      const res = await fetch(
        `${API_URL}/submenu/${submenuToMove.ID_SUBMENU}/update-order`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newOrder }),
        }
      );
      if (!res.ok) throw new Error("Error al actualizar orden");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Orden actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el orden",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Assign menu to role
  const handleAssignMenuToRole = async (
    idTipoUsuario: number,
    idMenu: number,
    menuNombre: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/rol-menu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idTipoUsuario,
          idMenu,
        }),
      });
      if (!res.ok) throw new Error("Error al asignar menú");
      const data = await res.json();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Menú "${menuNombre}" asignado correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });
      fetchAssignments(selectedTipoUsuario);
      if (data.refreshSidebar) {
        await refreshSidebar();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo asignar el menú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Remove menu from role
  const handleRemoveMenuFromRole = async (
    idTipoUsuario: number,
    idMenu: number,
    menuNombre: string
  ) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Estás seguro?",
      text: `¿Deseas desasignar el acceso al menú "${menuNombre}"?`,
      showCancelButton: true,
      confirmButtonText: "Sí, desasignar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/rol-menu`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            idTipoUsuario,
            idMenu,
          }),
        });
        if (!res.ok) throw new Error("Error al eliminar asignación de menú");
        const data = await res.json();
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `Acceso al menú "${menuNombre}" eliminado correctamente`,
          timer: 2000,
          showConfirmButton: false,
        });
        fetchAssignments(selectedTipoUsuario);
        if (data.refreshSidebar) {
          await refreshSidebar();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo elemental la asignación del menú",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  // Assign submenu to role
  const handleAssignSubmenuToRole = async (
    idTipoUsuario: number,
    idSubmenu: number,
    submenuNombre: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/rol-submenu`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idTipoUsuario,
          idSubmenu,
        }),
      });
      if (!res.ok) throw new Error("Error al asignar submenú");
      const data = await res.json();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Submenú "${submenuNombre}" asignado correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });
      fetchAssignments(selectedTipoUsuario);
      if (data.refreshSidebar) {
        await refreshSidebar();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo asignar el submenú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Remove submenu from role
  const handleRemoveSubmenuFromRole = async (
    idTipoUsuario: number,
    idSubmenu: number,
    submenuNombre: string
  ) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "¿Estás seguro?",
      text: `¿Deseas desasignar el acceso al submenú "${submenuNombre}"?`,
      showCancelButton: true,
      confirmButtonText: "Sí, desasignar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/rol-submenu`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            idTipoUsuario,
            idSubmenu,
          }),
        });
        if (!res.ok) throw new Error("Error al eliminar asignación de submenú");
        const data = await res.json();
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `Acceso al submenú "${submenuNombre}" eliminado correctamente`,
          timer: 2000,
          showConfirmButton: false,
        });
        fetchAssignments(selectedTipoUsuario);
        if (data.refreshSidebar) {
          await refreshSidebar();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la asignación del submenú",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  // Unique menus
  const uniqueMenus = Array.from(new Set(menus.map((m) => m.ID_MENU)))
    .map((id) => menus.find((m) => m.ID_MENU === id))
    .filter((m): m is MenuWithSubmenu => !!m);

  // Filtered submenus
  const filteredSubmenus = menus
    .filter(
      (item) =>
        item.ID_MENU === parseInt(selectedMenu) &&
        item.ID_SUBMENU !== null &&
        item.SUBMENU_NOMBRE !== null
    )
    .sort((a, b) => (a.SUBMENU_ORDEN || 0) - (b.SUBMENU_ORDEN || 0));

  // Custom Option Component for react-select
  const CustomOption = ({
    innerProps,
    label,
    data,
  }: {
    innerProps: any;
    label: string;
    data: IconOption;
  }) => (
    <div
      {...innerProps}
      className="flex items-center p-2 hover:bg-blue-50 cursor-pointer"
    >
      <span className="mr-2">{data.icon}</span>
      <span>{label}</span>
    </div>
  );

  // Custom SingleValue Component for react-select
  const CustomSingleValue = ({ data }: { data: IconOption }) => (
    <div className="flex items-center">
      <span className="mr-2">{data.icon}</span>
      <span>{data.label}</span>
    </div>
  );

  return (
    <Container>
      <Title>Gestión de Menús y Submenús</Title>

      {/* Tabs */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:space-x-4 border-b mb-6">
          {["create", "manage", "assign"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-3 font-semibold text-xs sm:text-sm md:text-base text-center ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              } transition-colors duration-200`}
            >
              {tab === "create"
                ? "Crear Menú y Submenú"
                : tab === "manage"
                ? "Gestionar Menú y Submenú"
                : "Asignar Roles"}
            </button>
          ))}
        </div>

        {/* Create Tab */}
        {activeTab === "create" && (
          <div className="grid grid-cols-1 gap-4">
            {/* Create Menu */}
            <Card>
              <h3 className="font-bold text-base sm:text-lg mb-4">Crear Menú</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Nombre del Menú *
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del menú"
                    value={newMenu.nombre}
                    onChange={(e) =>
                      setNewMenu({ ...newMenu, nombre: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Ícono *
                  </label>
                  <Select
                    options={selectIconOptions}
                    value={selectIconOptions.find(
                      (opt) => opt.value === newMenu.icono
                    )}
                    onChange={(option: SingleValue<IconOption>) =>
                      setNewMenu({
                        ...newMenu,
                        icono: option ? option.value : "",
                      })
                    }
                    placeholder="Selecciona o escribe un ícono"
                    isClearable
                    isSearchable
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue,
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db",
                        borderRadius: "0.5rem",
                        padding: "0.25rem",
                        "&:hover": { borderColor: "#3b82f6" },
                        boxShadow: "none",
                        fontSize: "0.875rem",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        marginTop: "0.25rem",
                      }),
                      option: (base) => ({
                        ...base,
                        backgroundColor: "transparent",
                        "&:hover": { backgroundColor: "#eff6ff" },
                        fontSize: "0.875rem",
                      }),
                    }}
                    onInputChange={(input) => {
                      if (
                        input &&
                        !selectIconOptions.some((opt) => opt.value === input)
                      ) {
                        setNewMenu({ ...newMenu, icono: input });
                      }
                    }}
                  />
                  {newMenu.icono && (
                    <div className="mt-2 text-gray-600 text-xs sm:text-sm flex items-center space-x-2">
                      <span>Vista previa:</span>
                      <span>
                        {iconOptions.find((item) => item.name === newMenu.icono)
                          ?.icon || newMenu.icono}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    URL (Opcional)
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL (opcional)"
                    value={newMenu.url}
                    onChange={(e) =>
                      setNewMenu({ ...newMenu, url: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 w-full flex items-center justify-center text-sm sm:text-base"
                  onClick={handleCreateMenu}
                >
                  <FaCheckCircle className="mr-2" />
                  Crear Menú
                </button>
              </div>
            </Card>

            {/* Create Submenu */}
            <Card>
              <h3 className="font-bold text-base sm:text-lg mb-4">Crear Submenú</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Menú Padre *
                  </label>
                  <select
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newSubmenu.idMenu}
                    onChange={(e) =>
                      setNewSubmenu({ ...newSubmenu, idMenu: e.target.value })
                    }
                  >
                    <option value="">Selecciona un menú</option>
                    {uniqueMenus.map((menu) => (
                      <option key={menu.ID_MENU} value={menu.ID_MENU}>
                        {menu.MENU_NOMBRE}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Nombre del Submenú *
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del submenú"
                    value={newSubmenu.nombre}
                    onChange={(e) =>
                      setNewSubmenu({ ...newSubmenu, nombre: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Ícono *
                  </label>
                  <Select
                    options={selectIconOptions}
                    value={selectIconOptions.find(
                      (opt) => opt.value === newSubmenu.icono
                    )}
                    onChange={(option: SingleValue<IconOption>) =>
                      setNewSubmenu({
                        ...newSubmenu,
                        icono: option ? option.value : "",
                      })
                    }
                    placeholder="Selecca o escribe un ícono"
                    isClearable
                    isSearchable
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue,
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db",
                        borderRadius: "0.5rem",
                        padding: "0.25rem",
                        "&:hover": { borderColor: "#3b82f6" },
                        boxShadow: "none",
                        fontSize: "0.875rem",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        marginTop: "0.25rem",
                      }),
                      option: (base) => ({
                        ...base,
                        backgroundColor: "transparent",
                        "&:hover": { backgroundColor: "#eff6ff" },
                        fontSize: "0.875rem",
                      }),
                    }}
                    onInputChange={(input) => {
                      if (
                        input &&
                        !selectIconOptions.some((opt) => opt.value === input)
                      ) {
                        setNewSubmenu({ ...newSubmenu, icono: input });
                      }
                    }}
                  />
                  {newSubmenu.icono && (
                    <div className="mt-2 text-gray-600 text-xs sm:text-sm flex items-center space-x-2">
                      <span>Vista previa:</span>
                      <span>
                        {iconOptions.find(
                          (item) => item.name儿童 === newSubmenu.icono
                        )?.icon || newSubmenu.icono}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    URL *
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="URL del submenú"
                    value={newSubmenu.url}
                    onChange={(e) =>
                      setNewSubmenu({ ...newSubmenu, url: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 w-full flex items-center justify-center text-sm sm:text-base"
                  onClick={handleCreateSubmenu}
                >
                  <FaCheckCircle className="mr-2" />
                  Crear Submenú
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === "manage" && (
          <div className="space-y-4">
            <Card>
              <h3 className="font-bold text-base sm:text-lg mb-4">Menús Disponibles</h3>
              <ul className="space-y-3">
                {uniqueMenus.length === 0 ? (
                  <li className="p-3 bg-white shadow rounded text-gray-600 text-sm">
                    No hay menús disponibles.
                  </li>
                ) : (
                  uniqueMenus.map((menu) => (
                    <li
                      key={menu.ID_MENU}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center mb-2 sm:mb-0">
                        <span className="mr-2">{menu.MENU_ICONO}</span>
                        <span className="font-medium text-sm sm:text-base">{menu.MENU_NOMBRE}</span>
                      </div>
                      <button
                        className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                        onClick={() =>
                          setEditMenuModal({
                            id: menu.ID_MENU,
                            nombre: menu.MENU_NOMBRE,
                            icono: menu.MENU_ICONO,
                            url: menu.MENU_URL,
                          })
                        }
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </Card>

            <Card>
              <h3 className="font-bold text-base sm:text-lg mb-4">
                Seleccionar Menú para Submenús
              </h3>
              <select
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedMenu}
                onChange={(e) => setSelectedMenu(e.target.value)}
              >
                <option value="">Selecciona un menú</option>
                {uniqueMenus.map((menu) => (
                  <option key={menu.ID_MENU} value={menu.ID_MENU}>
                    {menu.MENU_NOMBRE}
                  </option>
                ))}
              </select>

              {!selectedMenu && (
                <p className="text-red-600 mt-2 text-xs sm:text-sm">
                  Por favor, selecciona un menú para gestionar sus submenús.
                </p>
              )}

              {selectedMenu && (
                <ul className="space-y-3 mt-4">
                  {filteredSubmenus.length === 0 ? (
                    <li className="p-3 bg-white shadow rounded text-gray-600 text-sm">
                      No hay submenús para este menú.
                    </li>
                  ) : (
                    filteredSubmenus.map((item, idx) => (
                      <li
                        key={item.ID_SUBMENU}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-0">
                          <div className="flex items-center">
                            <span className="mr-2">{item.SUBMENU_ICONO}</span>
                            <span className="font-medium text-sm sm:text-base">
                              {idx + 1}. {item.SUBMENU_NOMBRE}
                            </span>
                          </div>
                          <span className="text-gray-500 text-xs sm:text-sm sm:ml-2">
                            ({item.SUBMENU_URL})
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className={`text-blue-600 hover:text-blue-800 transition-colors duration-200 ${
                              idx === 0 ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            onClick={() => moveSubmenuUp(idx)}
                            disabled={idx === 0}
                            title="Subir"
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            className={`text-blue-600 hover:text-blue-800 transition-colors duration-200 ${
                              idx === filteredSubmenus.length - 1
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            onClick={() => moveSubmenuDown(idx)}
                            disabled={idx === filteredSubmenus.length - 1}
                            title="Bajar"
                          >
                            <FaArrowDown />
                          </button>
                          <button
                            className="text-yellow-600 hover:text-yellow-800 transitioned-colors duration-200"
                            onClick={() =>
                              setEditSubmenuModal({
                                id: item.ID_SUBMENU!,
                                nombre: item.SUBMENU_NOMBRE!,
                                icono: item.SUBMENU_ICONO!,
                                url: item.SUBMENU_URL!,
                              })
                            }
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 transition-colors duration-200"
                            onClick={() =>
                              handleDeleteSubmenu(
                                item.ID_SUBMENU!,
                                item.SUBMENU_NOMBRE!
                              )
                            }
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* Assign Roles Tab */}
        {activeTab === "assign" && (
          <Card>
            <h3 className="font-bold text-base sm:text-lg mb-4">
              Asignar Menús y Submenús por Tipo de Usuario
            </h3>
            <select
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              value={selectedTipoUsuario}
              onChange={(e) => setSelectedTipoUsuario(e.target.value)}
            >
              <option value="">Selecciona un tipo de usuario</option>
              {tiposUsuario.map((tipo) => (
                <option key={tipo.ID_ROL} value={tipo.ID_ROL}>
                  {tipo.DETALLE_USUARIO}
                </option>
              ))}
            </select>

            {!selectedTipoUsuario && (
              <p className="text-red-600 mb-4 text-xs sm:text-sm">
                Por favor, selecciona un tipo de usuario para asignar menús y
                submenús.
              </p>
            )}

            {selectedTipoUsuario && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-sm sm:text-md mb-4">Menús Disponibles</h4>
                  <ul className="space-y-3">
                    {uniqueMenus.length === 0 ? (
                      <li className="p-3 bg-white shadow rounded text-gray-600 text-sm">
                        No hay menús disponibles.
                      </li>
                    ) : (
                      uniqueMenus.map((menu) => (
                        <li
                          key={menu.ID_MENU}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-0">
                            <div className="flex items-center">
                              <span className="mr-2">{menu.MENU_ICONO}</span>
                              <span className="font-medium text-sm sm:text-base">
                                {menu.MENU_NOMBRE}
                              </span>
                            </div>
                            <span className="text-gray-500 text-xs sm:text-sm sm:ml-2">
                              {assignments.menus.includes(menu.ID_MENU)
                                ? "(Asignado)"
                                : "(No asignado)"}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            {assignments.menus.includes(menu.ID_MENU) ? (
                              <button
                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                                onClick={() =>
                                  handleRemoveMenuFromRole(
                                    parseInt(selectedTipoUsuario),
                                    menu.ID_MENU,
                                    menu.MENU_NOMBRE
                                  )
                                }
                              >
                                Desasignar
                              </button>
                            ) : (
                              <button
                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                                onClick={() =>
                                  handleAssignMenuToRole(
                                    parseInt(selectedTipoUsuario),
                                    menu.ID_MENU,
                                    menu.MENU_NOMBRE
                                  )
                                }
                              >
                                Asignar
                              </button>
                            )}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-sm sm:text-md mb-4">Submenús Disponibles</h4>
                  <select
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    value={selectedMenu}
                    onChange={(e) => setSelectedMenu(e.target.value)}
                  >
                    <option value="">Selecciona un menú</option>
                    {uniqueMenus.map((menu) => (
                      <option key={menu.ID_MENU} value={menu.ID_MENU}>
                        {menu.MENU_NOMBRE}
                      </option>
                    ))}
                  </select>

                  {selectedMenu && (
                    <ul className="space-y-3">
                      {filteredSubmenus.length === 0 ? (
                        <li className="p-3 bg-white shadow rounded text-gray-600 text-sm">
                          No hay submenús para este menú.
                        </li>
                      ) : (
                        filteredSubmenus.map((item) => (
                          <li
                            key={item.ID_SUBMENU}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center mb-2 sm:mb-0">
                              <div className="flex items-center">
                                <span className="mr-2">{item.SUBMENU_ICONO}</span>
                                <span className="font-medium text-sm sm:text-base">
                                  {item.SUBMENU_NOMBRE}
                                </span>
                              </div>
                              <span className="text-gray-500 text-xs sm:text-sm sm:ml-2">
                                {assignments.submenus.includes(item.ID_SUBMENU!)
                                  ? "(Asignado)"
                                  : "(No asignado)"}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              {assignments.submenus.includes(item.ID_SUBMENU!) ? (
                                <button
                                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
                                  onClick={() =>
                                    handleRemoveSubmenuFromRole(
                                      parseInt(selectedTipoUsuario),
                                      item.ID_SUBMENU!,
                                      item.SUBMENU_NOMBRE!
                                    )
                                  }
                                >
                                  Desasignar
                                </button>
                              ) : (
                                <button
                                  className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm"
                                  onClick={() =>
                                    handleAssignSubmenuToRole(
                                      parseInt(selectedTipoUsuario),
                                      item.ID_SUBMENU!,
                                      item.SUBMENU_NOMBRE!
                                    )
                                  }
                                >
                                  Asignar
                                </button>
                              )}
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Edit Menu Modal */}
        {editMenuModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <h3 className="font-bold text-base sm:text-lg mb-4">Editar Menú</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Nombre del Menú *
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editMenuModal.nombre}
                    onChange={(e) =>
                      setEditMenuModal({
                        ...editMenuModal,
                        nombre: e.target.value,
                      })
                    }
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Ícono *
                  </label>
                  <Select
                    options={selectIconOptions}
                    value={selectIconOptions.find(
                      (opt) => opt.value === editMenuModal.icono
                    )}
                    onChange={(option: SingleValue<IconOption>) =>
                      setEditMenuModal({
                        ...editMenuModal,
                        icono: option ? option.value : "",
                      })
                    }
                    placeholder="Selecciona o escribe un ícono"
                    isClearable
                    isSearchable
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue,
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db",
                        borderRadius: "0.5rem",
                        padding: "0.25rem",
                        "&:hover": { borderColor: "#3b82f6" },
                        boxShadow: "none",
                        fontSize: "0.875rem",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        marginTop: "0.25rem",
                      }),
                      option: (base) => ({
                        ...base,
                        backgroundColor: "transparent",
                        "&:hover": { backgroundColor: "#eff6ff" },
                        fontSize: "0.875rem",
                      }),
                    }}
                    onInputChange={(input) => {
                      if (
                        input &&
                        !selectIconOptions.some((opt) => opt.value === input)
                      ) {
                        setEditMenuModal({ ...editMenuModal, icono: input });
                      }
                    }}
                  />
                  {editMenuModal.icono && (
                    <div className="mt-2 text-gray-600 text-xs sm:text-sm flex items-center space-x-2">
                      <span>Vista previa:</span>
                      <span>
                        {iconOptions.find(
                          (item) => item.name === editMenuModal.icono
                        )?.icon || editMenuModal.icono}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    URL (Opcional)
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editMenuModal.url || ""}
                    onChange={(e) =>
                      setEditMenuModal({
                        ...editMenuModal,
                        url: e.target.value,
                      })
                    }
                    maxLength={100}
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1 text-sm sm:text-base"
                    onClick={handleUpdateMenu}
                  >
                    Guardar
                  </button>
                  <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex-1 text-sm sm:text-base"
                    onClick={() => setEditMenuModal(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Submenu Modal */}
        {editSubmenuModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <h3 className="font-bold text-base sm:text-lg mb-4">Editar Submenú</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Nombre del Submenú *
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editSubmenuModal.nombre}
                    onChange={(e) =>
                      setEditSubmenuModal({
                        ...editSubmenuModal,
                        nombre: e.target.value,
                      })
                    }
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    Ícono *
                  </label>
                  <Select
                    options={selectIconOptions}
                    value={selectIconOptions.find(
                      (opt) => opt.value === editSubmenuModal.icono
                    )}
                    onChange={(option: SingleValue<IconOption>) =>
                      setEditSubmenuModal({
                        ...editSubmenuModal,
                        icono: option ? option.value : "",
                      })
                    }
                    placeholder="Selecciona o escribe un ícono"
                    isClearable
                    isSearchable
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue,
                    }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderColor: "#d1d5db",
                        borderRadius: "0.5rem",
                        padding: "0.25rem",
                        "&:hover": { borderColor: "#3b82f6" },
                        boxShadow: "none",
                        fontSize: "0.875rem",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: "0.5rem",
                        marginTop: "0.25rem",
                      }),
                      option: (base) => ({
                        ...base,
                        backgroundColor: "transparent",
                        "&:hover": { backgroundColor: "#eff6ff" },
                        fontSize: "0.875rem",
                      }),
                    }}
                    onInputChange={(input) => {
                      if (
                        input &&
                        !selectIconOptions.some((opt) => opt.value === input)
                      ) {
                        setEditSubmenuModal({
                          ...editSubmenuModal,
                          icono: input,
                        });
                      }
                    }}
                  />
                  {editSubmenuModal.icono && (
                    <div className="mt-2 text-gray-600 text-xs sm:text-sm flex items-center space-x-2">
                      <span>Vista previa:</span>
                      <span>
                        {iconOptions.find(
                          (item) => item.name === editSubmenuModal.icono
                        )?.icon || editSubmenuModal.icono}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
                    URL *
                  </label>
                  <input
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editSubmenuModal.url}
                    onChange={(e) =>
                      setEditSubmenuModal({
                        ...editSubmenuModal,
                        url: e.target.value,
                      })
                    }
                    maxLength={100}
                  />
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1 text-sm sm:text-base"
                    onClick={handleUpdateSubmenu}
                  >
                    Guardar
                  </button>
                  <button
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex-1 text-sm sm:text-base"
                    onClick={() => setEditSubmenuModal(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default MenuSubmenuGestion;