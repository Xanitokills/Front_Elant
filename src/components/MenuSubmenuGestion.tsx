import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

// Interfaz para menús y submenús
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

// Interfaz para tipos de usuario
interface TipoUsuario {
  ID_TIPO_USUARIO: number;
  DETALLE_USUARIO: string;
  ESTADO: boolean;
}

export default function MenuSubmenuGestion() {
  const [menus, setMenus] = useState<MenuWithSubmenu[]>([]);
  const [tiposUsuario, setTiposUsuario] = useState<TipoUsuario[]>([]);
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

  // Obtener los menús y submenús
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
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTiposUsuario(data.filter((tipo: TipoUsuario) => tipo.ESTADO === true));
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los tipos de usuario",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  useEffect(() => {
    fetchMenus();
    fetchTiposUsuario();
  }, []);

  // Validar longitud de campos
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

  // Crear un nuevo menú
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

  // Crear un nuevo submenú
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

  // Actualizar un menú
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

  // Actualizar un submenú
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

  // Eliminar un submenú
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

  // Mover submenú hacia arriba
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

  // Mover submenú hacia abajo
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

  // Asignar menú a tipo de usuario
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
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Menú "${menuNombre}" asignado correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });
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

  // Eliminar asignación de menú a tipo de usuario
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
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `Acceso al menú "${menuNombre}" eliminado correctamente`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la asignación del menú",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  // Asignar submenú a tipo de usuario
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
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: `Submenú "${submenuNombre}" asignado correctamente`,
        timer: 2000,
        showConfirmButton: false,
      });
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

  // Eliminar asignación de submenú a tipo de usuario
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
          body: JSON.stringify({ idTipoUsuario, idSubmenu }),
        });
        if (!res.ok) throw new Error();
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: `Acceso al submenú "${submenuNombre}" desasignado correctamente`,
          timer: 2000,
          showConfirmButton: false,
        });
      } catch {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo desasignar el submenú",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    }
  };

  // Obtener menús únicos
  const uniqueMenus = Array.from(new Set(menus.map((m) => m.ID_MENU)))
    .map((id) => menus.find((m) => m.ID_MENU === id))
    .filter((m): m is MenuWithSubmenu => !!m);

  // Filtrar submenús válidos y ordenarlos por SUBMENU_ORDEN
  const filteredSubmenus = menus
    .filter(
      (item) =>
        item.ID_MENU === parseInt(selectedMenu) &&
        item.ID_SUBMENU !== null &&
        item.SUBMENU_NOMBRE !== null
    )
    .sort((a, b) => (a.SUBMENU_ORDEN || 0) - (b.SUBMENU_ORDEN || 0));

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Gestión de Menús y Submenús</h1>

      {/* Submenú */}
      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setActiveTab("create")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "create"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            } transition-colors duration-200`}
          >
            Crear Menú y Submenú
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "manage"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            } transition-colors duration-200`}
          >
            Gestionar Menú y Submenú
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "assign"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            } transition-colors duration-200`}
          >
            Asignar Roles
          </button>
        </div>
      </div>

      {/* Vista: Crear Menú y Submenú */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="font-bold text-lg mb-4">Crear Menú</h3>
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nombre del menú"
              value={newMenu.nombre}
              onChange={(e) =>
                setNewMenu({ ...newMenu, nombre: e.target.value })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-home)"
              value={newMenu.icono}
              onChange={(e) =>
                setNewMenu({ ...newMenu, icono: e.target.value })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL (opcional)"
              value={newMenu.url}
              onChange={(e) => setNewMenu({ ...newMenu, url: e.target.value })}
              maxLength={100}
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 w-full"
              onClick={handleCreateMenu}
            >
              Crear Menú
            </button>
          </div>

          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h3 className="font-bold text-lg mb-4">Crear Submenú</h3>
            <select
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nombre del submenú"
              value={newSubmenu.nombre}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, nombre: e.target.value })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-cog)"
              value={newSubmenu.icono}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, icono: e.target.value })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL del submenú"
              value={newSubmenu.url}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, url: e.target.value })
              }
              maxLength={100}
            />
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 w-full"
              onClick={handleCreateSubmenu}
            >
              Crear Submenú
            </button>
          </div>
        </div>
      )}

      {/* Vista: Gestionar Menú y Submenú */}
      {activeTab === "manage" && (
        <div>
          <h3 className="font-bold text-lg mb-4">Menús Disponibles</h3>
          <ul className="space-y-4 mb-6">
            {uniqueMenus.length === 0 ? (
              <li className="p-4 bg-white shadow rounded text-gray-600">
                No hay menús disponibles.
              </li>
            ) : (
              uniqueMenus.map((menu) => (
                <li
                  key={menu.ID_MENU}
                  className="flex justify-between items-center p-4 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="font-medium">{menu.MENU_NOMBRE}</span>
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
                  >
                    ✏️
                  </button>
                </li>
              ))
            )}
          </ul>

          <h3 className="font-bold text-lg mb-4">
            Seleccionar Menú para Submenús
          </h3>
          <select
            className="border p-3 mb-6 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
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
            <p className="text-red-600 mb-4">
              Por favor, selecciona un menú para gestionar sus submenús.
            </p>
          )}

          {selectedMenu && (
            <ul className="space-y-4">
              {filteredSubmenus.length === 0 ? (
                <li className="p-4 bg-white shadow rounded text-gray-600">
                  No hay submenús para este menú.
                </li>
              ) : (
                filteredSubmenus.map((item, idx) => (
                  <li
                    key={item.ID_SUBMENU}
                    className="flex justify-between items-center p-4 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center">
                      <span className="mr-2 font-medium">
                        {idx + 1}. {item.SUBMENU_NOMBRE}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({item.SUBMENU_URL})
                      </span>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        className={`text-blue-600 hover:text-blue-800 transition-colors duration-200 ${
                          idx === 0 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => moveSubmenuUp(idx)}
                        disabled={idx === 0}
                        title="Subir"
                      >
                        ⬆️
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
                        ⬇️
                      </button>
                      <button
                        className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                        onClick={() =>
                          setEditSubmenuModal({
                            id: item.ID_SUBMENU!,
                            nombre: item.SUBMENU_NOMBRE!,
                            icono: item.SUBMENU_ICONO!,
                            url: item.SUBMENU_URL!,
                          })
                        }
                      >
                        ✏️
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        onClick={() =>
                          handleDeleteSubmenu(
                            item.ID_SUBMENU!,
                            item.SUBMENU_NOMBRE!
                          )
                        }
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}

      {/* Vista: Asignar Roles */}
      {activeTab === "assign" && (
        <div>
          <h3 className="font-bold text-lg mb-4">
            Asignar Menús y Submenús por Tipo de Usuario
          </h3>
          <select
            className="border p-3 mb-6 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={selectedTipoUsuario}
            onChange={(e) => setSelectedTipoUsuario(e.target.value)}
          >
            <option value="">Selecciona un tipo de usuario</option>
            {tiposUsuario.map((tipo) => (
              <option key={tipo.ID_TIPO_USUARIO} value={tipo.ID_TIPO_USUARIO}>
                {tipo.DETALLE_USUARIO}
              </option>
            ))}
          </select>

          {!selectedTipoUsuario && (
            <p className="text-red-600 mb-4">
              Por favor, selecciona un tipo de usuario para asignar menús y
              submenús.
            </p>
          )}

          {selectedTipoUsuario && (
            <div>
              <h4 className="font-bold text-md mb-4">Menús Disponibles</h4>
              <ul className="space-y-4 mb-6">
                {uniqueMenus.length === 0 ? (
                  <li className="p-4 bg-white shadow rounded text-gray-600">
                    No hay menús disponibles.
                  </li>
                ) : (
                  uniqueMenus.map((menu) => (
                    <li
                      key={menu.ID_MENU}
                      className="flex justify-between items-center p-4 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                    >
                      <span className="font-medium">{menu.MENU_NOMBRE}</span>
                      <div className="flex space-x-3">
                        <button
                          className="bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200"
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
                        <button
                          className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700 transition-colors duration-200"
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
                      </div>
                    </li>
                  ))
                )}
              </ul>

              <h4 className="font-bold text-md mb-4">Submenús Disponibles</h4>
              <select
                className="border p-3 mb-6 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
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
                <ul className="space-y-4">
                  {filteredSubmenus.length === 0 ? (
                    <li className="p-4 bg-white shadow rounded text-gray-600">
                      No hay submenús para este menú.
                    </li>
                  ) : (
                    filteredSubmenus.map((item) => (
                      <li
                        key={item.ID_SUBMENU}
                        className="flex justify-between items-center p-4 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                      >
                        <span className="font-medium">
                          {item.SUBMENU_NOMBRE}
                        </span>
                        <div className="flex space-x-3">
                          <button
                            className="bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 transition-colors duration-200"
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
                          <button
                            className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700 transition-colors duration-200"
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
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal para editar menú */}
      {editMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Editar Menú</h3>
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nombre del menú"
              value={editMenuModal.nombre}
              onChange={(e) =>
                setEditMenuModal({ ...editMenuModal, nombre: e.target.value })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-home)"
              value={editMenuModal.icono}
              onChange={(e) =>
                setEditMenuModal({ ...editMenuModal, icono: e.target.value })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL (opcional)"
              value={editMenuModal.url || ""}
              onChange={(e) =>
                setEditMenuModal({ ...editMenuModal, url: e.target.value })
              }
              maxLength={100}
            />
            <div className="flex space-x-3">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1"
                onClick={handleUpdateMenu}
              >
                Guardar
              </button>
              <button
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex-1"
                onClick={() => setEditMenuModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar submenú */}
      {editSubmenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Editar Submenú</h3>
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nombre del submenú"
              value={editSubmenuModal.nombre}
              onChange={(e) =>
                setEditSubmenuModal({
                  ...editSubmenuModal,
                  nombre: e.target.value,
                })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-cog)"
              value={editSubmenuModal.icono}
              onChange={(e) =>
                setEditSubmenuModal({
                  ...editSubmenuModal,
                  icono: e.target.value,
                })
              }
              maxLength={50}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL del submenú"
              value={editSubmenuModal.url}
              onChange={(e) =>
                setEditSubmenuModal({
                  ...editSubmenuModal,
                  url: e.target.value,
                })
              }
              maxLength={100}
            />
            <div className="flex space-x-3">
              <button
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-1"
                onClick={handleUpdateSubmenu}
              >
                Guardar
              </button>
              <button
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex-1"
                onClick={() => setEditSubmenuModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
