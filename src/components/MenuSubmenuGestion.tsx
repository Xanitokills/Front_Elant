import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

// Interfaz para permitir campos de submenú nulos
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

export default function MenuSubmenuGestion() {
  const [menus, setMenus] = useState<MenuWithSubmenu[]>([]);
  const [newMenu, setNewMenu] = useState({ nombre: "", icono: "", url: "" });
  const [newSubmenu, setNewSubmenu] = useState({
    nombre: "",
    icono: "",
    url: "",
    idMenu: "",
  });
  const [activeTab, setActiveTab] = useState("create");
  const [selectedMenu, setSelectedMenu] = useState<string>("");
  const [editMenu, setEditMenu] = useState<{ id: number; nombre: string } | null>(null);
  const token = localStorage.getItem("token");

  // Obtener los menús y submenús
  const fetchMenus = async () => {
    try {
      const res = await fetch(`${API_URL}/menus-submenus`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error al obtener menús");
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

  useEffect(() => {
    fetchMenus();
  }, []);

  // Validar y crear un nuevo menú
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
    if (newMenu.url && !isValidUrl(newMenu.url)) {
      Swal.fire({
        icon: "warning",
        title: "URL inválida",
        text: "Por favor, ingrese una URL válida",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

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

  // Validar y crear un nuevo submenú
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
    if (!isValidUrl(newSubmenu.url)) {
      Swal.fire({
        icon: "warning",
        title: "URL inválida",
        text: "Por favor, ingrese una URL válida para el submenú",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

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

  // Actualizar el nombre del menú
  const handleUpdateMenuName = async (id: number, nombre: string) => {
    if (!nombre.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Campo requerido",
        text: "El nombre del menú es obligatorio",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/menu/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      });
      if (!res.ok) throw new Error("Error al actualizar menú");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Nombre del menú actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setEditMenu(null);
      fetchMenus();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el nombre del menú",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Mover submenú hacia arriba
  const moveSubmenuUp = async (index: number) => {
    if (index === 0) return; // No se puede mover más arriba

    const reorderedSubmenus = Array.from(filteredSubmenus);
    const newOrder = index; // Nueva posición (1-based para el backend)
    const submenuToMove = reorderedSubmenus[index];

    try {
      const res = await fetch(`${API_URL}/submenu/${submenuToMove.ID_SUBMENU}/update-order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newOrder }),
      });
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
      console.error("Error updating order:", error);
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
    if (index === filteredSubmenus.length - 1) return; // No se puede mover más abajo

    const reorderedSubmenus = Array.from(filteredSubmenus);
    const newOrder = index + 2; // Nueva posición (1-based para el backend)
    const submenuToMove = reorderedSubmenus[index];

    try {
      const res = await fetch(`${API_URL}/submenu/${submenuToMove.ID_SUBMENU}/update-order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newOrder }),
      });
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
      console.error("Error updating order:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el orden",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  // Función auxiliar para validar URLs
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-home)"
              value={newMenu.icono}
              onChange={(e) =>
                setNewMenu({ ...newMenu, icono: e.target.value })
              }
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL (opcional)"
              value={newMenu.url}
              onChange={(e) =>
                setNewMenu({ ...newMenu, url: e.target.value })
              }
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
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-cog)"
              value={newSubmenu.icono}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, icono: e.target.value })
              }
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL del submenú"
              value={newSubmenu.url}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, url: e.target.value })
              }
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
          {/* Lista de Menús con opción de edición */}
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
                  <div>
                    {editMenu && editMenu.id === menu.ID_MENU ? (
                      <div className="flex space-x-2">
                        <input
                          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                          value={editMenu.nombre}
                          onChange={(e) =>
                            setEditMenu({ ...editMenu, nombre: e.target.value })
                          }
                        />
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          onClick={() =>
                            handleUpdateMenuName(editMenu.id, editMenu.nombre)
                          }
                        >
                          Guardar
                        </button>
                        <button
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                          onClick={() => setEditMenu(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium">{menu.MENU_NOMBRE}</span>
                    )}
                  </div>
                  {!editMenu && (
                    <button
                      className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                      onClick={() =>
                        setEditMenu({ id: menu.ID_MENU, nombre: menu.MENU_NOMBRE })
                      }
                    >
                      ✏️
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>

          {/* Combo Box para seleccionar el menú */}
          <h3 className="font-bold text-lg mb-4">Seleccionar Menú para Submenús</h3>
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

          {/* Validación para menú no seleccionado */}
          {!selectedMenu && (
            <p className="text-red-600 mb-4">
              Por favor, selecciona un menú para gestionar sus submenús.
            </p>
          )}

          {/* Lista de Submenús del Menú Seleccionado */}
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
                          idx === filteredSubmenus.length - 1 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        onClick={() => moveSubmenuDown(idx)}
                        disabled={idx === filteredSubmenus.length - 1}
                        title="Bajar"
                      >
                        ⬇️
                      </button>
                      <button
                        className="text-yellow-600 hover:text-yellow-800 transition-colors duration-200"
                        onClick={() => {
                          Swal.fire({
                            icon: "info",
                            title: "Funcionalidad pendiente",
                            text: "La edición de submenús no está implementada.",
                            timer: 2000,
                            showConfirmButton: false,
                          });
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        onClick={() => {
                          Swal.fire({
                            icon: "info",
                            title: "Funcionalidad pendiente",
                            text: "La eliminación de submenús no está implementada.",
                            timer: 2000,
                            showConfirmButton: false,
                          });
                        }}
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
    </div>
  );
}