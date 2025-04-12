import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const API_URL = import.meta.env.VITE_API_URL;

interface MenuWithSubmenu {
  ID_MENU: number;
  MENU_NOMBRE: string;
  MENU_ICONO: string;
  MENU_URL: string | null;
  MENU_ORDEN: number;
  ID_SUBMENU: number;
  SUBMENU_NOMBRE: string;
  SUBMENU_ICONO: string;
  SUBMENU_URL: string;
  SUBMENU_ORDEN: number;
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
  const [isLoading, setIsLoading] = useState(false); // Added for loading states
  const token = localStorage.getItem("token");

  // Obtener los menús y submenús
  const fetchMenus = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Validar y crear un nuevo menú
  const handleCreateMenu = async () => {
    // Validaciones
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
    // URL es opcional, pero si se ingresa, debe ser válida
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Validar y crear un nuevo submenú
  const handleCreateSubmenu = async () => {
    // Validaciones
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo del orden (drag and drop)
  const onDragEnd = async (result: any) => {
    const { source, destination } = result;
    if (!destination) return;

    // Si el orden no cambia, no hacer nada
    if (source.index === destination.index) return;

    const reorderedSubmenus = Array.from(filteredSubmenus); // Use filteredSubmenus for correct context
    const [movedItem] = reorderedSubmenus.splice(source.index, 1);
    reorderedSubmenus.splice(destination.index, 0, movedItem);

    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/submenu/${movedItem.ID_SUBMENU}/update-order`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newOrder: destination.index + 1,
        }),
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
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el orden",
        timer: 2000,
        showConfirmButton: false,
      });
    } finally {
      setIsLoading(false);
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

  // Filtrar los submenús de acuerdo al menú seleccionado
  const filteredSubmenus = menus.filter(
    (item) => item.ID_MENU === parseInt(selectedMenu)
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Gestión de Menús y Submenús</h1>

      {/* Indicador de carga */}
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

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
            disabled={isLoading}
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
            disabled={isLoading}
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
              disabled={isLoading}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-home)"
              value={newMenu.icono}
              onChange={(e) =>
                setNewMenu({ ...newMenu, icono: e.target.value })
              }
              disabled={isLoading}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL (opcional)"
              value={newMenu.url}
              onChange={(e) =>
                setNewMenu({ ...newMenu, url: e.target.value })
              }
              disabled={isLoading}
            />
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 w-full"
              onClick={handleCreateMenu}
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Ícono (ej: fa-cog)"
              value={newSubmenu.icono}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, icono: e.target.value })
              }
              disabled={isLoading}
            />
            <input
              className="border p-3 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="URL del submenú"
              value={newSubmenu.url}
              onChange={(e) =>
                setNewSubmenu({ ...newSubmenu, url: e.target.value })
              }
              disabled={isLoading}
            />
            <button
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 w-full"
              onClick={handleCreateSubmenu}
              disabled={isLoading}
            >
              Crear Submenú
            </button>
          </div>
        </div>
      )}

      {/* Vista: Gestionar Menú y Submenú */}
      {activeTab === "manage" && (
        <div>
          {/* Combo Box para seleccionar el menú */}
          <select
            className="border p-3 mb-6 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={selectedMenu}
            onChange={(e) => setSelectedMenu(e.target.value)}
            disabled={isLoading}
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
            <p className="text-red-600 mb-4">Por favor, selecciona un menú para gestionar sus submenús.</p>
          )}

          {/* Lista de Submenús del Menú Seleccionado */}
          {selectedMenu && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="submenus">
                {(provided) => (
                  <ul
                    className="space-y-4"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {filteredSubmenus.length === 0 ? (
                      <li className="p-4 bg-white shadow rounded text-gray-600">
                        No hay submenús para este menú.
                      </li>
                    ) : (
                      filteredSubmenus.map((item, idx) => (
                        <Draggable
                          key={item.ID_SUBMENU}
                          draggableId={`${item.ID_SUBMENU}`}
                          index={idx}
                        >
                          {(provided) => (
                            <li
                              className="flex justify-between items-center p-4 bg-white shadow rounded hover:bg-gray-50 transition-colors duration-200"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
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
                                  disabled={isLoading}
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
                                  disabled={isLoading}
                                >
                                  🗑️
                                </button>
                              </div>
                            </li>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      )}
    </div>
  );
}