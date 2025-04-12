// src/pages/MenuSubmenuGestion.tsx
import { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
  const [newSubmenu, setNewSubmenu] = useState({ nombre: "", icono: "", url: "", idMenu: "" });
  const [editingSubmenu, setEditingSubmenu] = useState<MenuWithSubmenu | null>(null);
  const token = localStorage.getItem("token");

  const fetchMenus = async () => {
    const res = await fetch(`${API_URL}/menus-submenus`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMenus(data);
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOrder = async (id: number, direction: "up" | "down") => {
    await fetch(`${API_URL}/submenu/${id}/${direction}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchMenus();
  };

  const handleCreateMenu = async () => {
    await fetch(`${API_URL}/menu`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(newMenu),
    });
    setNewMenu({ nombre: "", icono: "", url: "" });
    fetchMenus();
  };

  const handleCreateSubmenu = async () => {
    await fetch(`${API_URL}/submenu`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: newSubmenu.nombre,
        icono: newSubmenu.icono,
        url: newSubmenu.url,
        idMenu: parseInt(newSubmenu.idMenu),
      }),
    });
    setNewSubmenu({ nombre: "", icono: "", url: "", idMenu: "" });
    fetchMenus();
  };

  const handleEditSubmenu = async () => {
    if (!editingSubmenu) return;
    await fetch(`${API_URL}/submenu/${editingSubmenu.ID_SUBMENU}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        nombre: editingSubmenu.SUBMENU_NOMBRE,
        icono: editingSubmenu.SUBMENU_ICONO,
        url: editingSubmenu.SUBMENU_URL,
      }),
    });
    setEditingSubmenu(null);
    fetchMenus();
  };

  const handleDeleteSubmenu = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
    });
    if (result.isConfirmed) {
      await fetch(`${API_URL}/submenu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMenus();
    }
  };

  const uniqueMenus = Array.from(new Set(menus.map((m) => m.ID_MENU)))
    .map((id) => menus.find((m) => m.ID_MENU === id))
    .filter((m): m is MenuWithSubmenu => !!m);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Gestión de Menús y Submenús</h2>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 shadow rounded">
          <h3 className="font-bold mb-2">Crear Menú</h3>
          <input className="border p-2 mb-2 w-full" placeholder="Nombre" value={newMenu.nombre} onChange={(e) => setNewMenu({ ...newMenu, nombre: e.target.value })} />
          <input className="border p-2 mb-2 w-full" placeholder="Ícono" value={newMenu.icono} onChange={(e) => setNewMenu({ ...newMenu, icono: e.target.value })} />
          <input className="border p-2 mb-2 w-full" placeholder="URL" value={newMenu.url} onChange={(e) => setNewMenu({ ...newMenu, url: e.target.value })} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleCreateMenu}>Crear Menú</button>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h3 className="font-bold mb-2">Crear Submenú</h3>
          <select className="border p-2 mb-2 w-full" value={newSubmenu.idMenu} onChange={(e) => setNewSubmenu({ ...newSubmenu, idMenu: e.target.value })}>
            <option value="">Selecciona Menú</option>
            {uniqueMenus.map((menu) => (
              <option key={menu.ID_MENU} value={menu.ID_MENU}>{menu.MENU_NOMBRE}</option>
            ))}
          </select>
          <input className="border p-2 mb-2 w-full" placeholder="Nombre" value={newSubmenu.nombre} onChange={(e) => setNewSubmenu({ ...newSubmenu, nombre: e.target.value })} />
          <input className="border p-2 mb-2 w-full" placeholder="Ícono" value={newSubmenu.icono} onChange={(e) => setNewSubmenu({ ...newSubmenu, icono: e.target.value })} />
          <input className="border p-2 mb-2 w-full" placeholder="URL" value={newSubmenu.url} onChange={(e) => setNewSubmenu({ ...newSubmenu, url: e.target.value })} />
          <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleCreateSubmenu}>Crear Submenú</button>
        </div>
      </div>

      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Menú</th>
            <th className="p-2">Submenú</th>
            <th className="p-2">Orden</th>
            <th className="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {menus.map((item, idx) => (
            <tr key={idx} className="border-t">
              <td className="p-2">{item.MENU_NOMBRE}</td>
              <td className="p-2">
                {editingSubmenu?.ID_SUBMENU === item.ID_SUBMENU ? (
                  <input value={editingSubmenu.SUBMENU_NOMBRE} onChange={(e) => setEditingSubmenu({ ...editingSubmenu, SUBMENU_NOMBRE: e.target.value })} />
                ) : (
                  item.SUBMENU_NOMBRE
                )}
              </td>
              <td className="text-center">{item.SUBMENU_ORDEN}</td>
              <td className="text-center">
                {editingSubmenu?.ID_SUBMENU === item.ID_SUBMENU ? (
                  <>
                    <button className="text-green-600 mr-2" onClick={handleEditSubmenu}>Guardar</button>
                    <button className="text-gray-600" onClick={() => setEditingSubmenu(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="text-blue-600 mr-2" onClick={() => handleOrder(item.ID_SUBMENU, "up")}>🔼</button>
                    <button className="text-blue-600 mr-2" onClick={() => handleOrder(item.ID_SUBMENU, "down")}>🔽</button>
                    <button className="text-yellow-600 mr-2" onClick={() => setEditingSubmenu(item)}>✏️</button>
                    <button className="text-red-600" onClick={() => handleDeleteSubmenu(item.ID_SUBMENU)}>🗑️</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
