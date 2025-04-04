import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
const API_URL = import.meta.env.VITE_API_URL;

interface User {
  ID_USUARIO: number;
  NOMBRES: string;
  APELLIDOS: string;
  DNI: string;
  CORREO: string;
  CELULAR: string;
  NRO_DPTO: number | null;
  FECHA_NACIMIENTO: string | null;
  COMITE: number;
  USUARIO: string;
  ROL: string;
  SEXO: string;
  ID_TIPO_USUARIO: number;
  ID_SEXO: number;
}

const ITEMS_PER_PAGE = 10;

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({
    text: "",
    type: "",
  });
  const [searchField, setSearchField] = useState("NOMBRES");
  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    if (!token) {
      setMessage({
        text: "No se encontró un token. Por favor, inicia sesión.",
        type: "error",
      });
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        setMessage({
          text: "Sesión expirada. Por favor, inicia sesión nuevamente.",
          type: "error",
        });
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Error al obtener los usuarios");

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar los usuarios";
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, navigate]);

  const filteredUsers = users.filter((user) => {
    const target =
      searchField === "NOMBRES"
        ? `${user.NOMBRES} ${user.APELLIDOS}`.toLowerCase()
        : String(user[searchField as keyof User] ?? "").toLowerCase();
    return target.includes(searchValue.toLowerCase());
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(
        `${API_URL}/users/${editingUser.ID_USUARIO}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editingUser),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar el usuario");
      setEditingUser(null);
      fetchUsers();
      setMessage({ text: "Usuario actualizado exitosamente", type: "success" });
    } catch (error) {
      setMessage({ text: "Error al actualizar el usuario", type: "error" });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Usuarios</h1>
        <button
          onClick={() => navigate("/users")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
        >
          <FaPlus className="mr-2" /> Agregar Usuario
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-2">Buscar usuarios</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          className="p-2 border rounded-lg w-full max-w-[160px]"
        >
          <option value="NOMBRES">Nombres</option>
          <option value="DNI">DNI</option>
          <option value="NRO_DPTO">Nro. Dpto</option>
        </select>

        <input
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setCurrentPage(1);
          }}
          className="p-2 border rounded-lg w-full max-w-xs"
          placeholder="Buscar..."
        />
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <FaCheckCircle className="mr-2" />
          ) : (
            <FaExclamationCircle className="mr-2" />
          )}
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <div className="min-w-[1200px]">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Nombres</th>
                <th className="py-3 px-4 text-left">Apellidos</th>
                <th className="py-3 px-4 text-left">DNI</th>
                <th className="py-3 px-4 text-left">Correo</th>
                <th className="py-3 px-4 text-left">Celular</th>
                <th className="py-3 px-4 text-left">Dpto</th>
                <th className="py-3 px-4 text-left">Nacimiento</th>
                <th className="py-3 px-4 text-left">Comité</th>
                <th className="py-3 px-4 text-left">Usuario</th>
                <th className="py-3 px-4 text-left">Rol</th>
                <th className="py-3 px-4 text-left">Sexo</th>
                <th className="py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr
                  key={user.ID_USUARIO}
                  className="border-b hover:bg-gray-100"
                >
                  <td className="py-3 px-4">{user.ID_USUARIO}</td>
                  <td className="py-3 px-4">{user.NOMBRES}</td>
                  <td className="py-3 px-4">{user.APELLIDOS}</td>
                  <td className="py-3 px-4">{user.DNI}</td>
                  <td className="py-3 px-4 break-all">{user.CORREO}</td>
                  <td className="py-3 px-4">{user.CELULAR}</td>
                  <td className="py-3 px-4">{user.NRO_DPTO ?? "N/A"}</td>
                  <td className="py-3 px-4">
                    {user.FECHA_NACIMIENTO
                      ? new Date(user.FECHA_NACIMIENTO).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4">
                    {user.COMITE === 1 ? "Sí" : "No"}
                  </td>
                  <td className="py-3 px-4">{user.USUARIO}</td>
                  <td className="py-3 px-4">{user.ROL}</td>
                  <td className="py-3 px-4">{user.SEXO}</td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <FaEdit />
                    </button>
                    <button className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg border ${
                  page === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal para editar */}
      <Modal
        isOpen={!!editingUser}
        onRequestClose={() => setEditingUser(null)}
        className="bg-white p-6 w-full max-w-2xl mx-auto mt-20 rounded-lg shadow-lg"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {editingUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-xl font-bold col-span-full">Editar Usuario</h2>
            <input
              className="p-2 border rounded"
              value={editingUser.NOMBRES}
              onChange={(e) =>
                setEditingUser({ ...editingUser, NOMBRES: e.target.value })
              }
              placeholder="Nombres"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.APELLIDOS}
              onChange={(e) =>
                setEditingUser({ ...editingUser, APELLIDOS: e.target.value })
              }
              placeholder="Apellidos"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.DNI}
              onChange={(e) =>
                setEditingUser({ ...editingUser, DNI: e.target.value })
              }
              placeholder="DNI"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.CORREO}
              onChange={(e) =>
                setEditingUser({ ...editingUser, CORREO: e.target.value })
              }
              placeholder="Correo"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.CELULAR}
              onChange={(e) =>
                setEditingUser({ ...editingUser, CELULAR: e.target.value })
              }
              placeholder="Celular"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.NRO_DPTO ?? ""}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  NRO_DPTO: parseInt(e.target.value) || null,
                })
              }
              placeholder="Dpto"
            />
            <input
              className="p-2 border rounded"
              type="date"
              value={editingUser.FECHA_NACIMIENTO?.split("T")[0] || ""}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  FECHA_NACIMIENTO: e.target.value,
                })
              }
              placeholder="Nacimiento"
            />
            <select
              className="p-2 border rounded"
              value={editingUser.COMITE}
              onChange={(e) =>
                setEditingUser({
                  ...editingUser,
                  COMITE: parseInt(e.target.value),
                })
              }
            >
              <option value={0}>No</option>
              <option value={1}>Sí</option>
            </select>
            <input
              className="p-2 border rounded"
              value={editingUser.USUARIO}
              onChange={(e) =>
                setEditingUser({ ...editingUser, USUARIO: e.target.value })
              }
              placeholder="Usuario"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.ROL}
              onChange={(e) =>
                setEditingUser({ ...editingUser, ROL: e.target.value })
              }
              placeholder="Rol"
            />
            <input
              className="p-2 border rounded"
              value={editingUser.SEXO}
              onChange={(e) =>
                setEditingUser({ ...editingUser, SEXO: e.target.value })
              }
              placeholder="Sexo"
            />
            <div className="col-span-full flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserList;
