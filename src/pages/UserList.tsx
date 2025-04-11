import { useState, useEffect } from "react";
import { useEffectOnce } from "../hooks/useEffectOnce";
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
import Swal from "sweetalert2";
import dayjs from "dayjs";
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
  COMITE: boolean | number;
  USUARIO: string;
  ROL: string;
  SEXO: string;
  ID_TIPO_USUARIO: number;
  ID_SEXO: number;
}

interface Rol {
  ID_TIPO_USUARIO: number;
  DETALLE_USUARIO: string;
}

const ITEMS_PER_PAGE = 10;

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Nuevo estado para manejar el estado de carga
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
    console.log("🚀 Ejecutando fetchUsers()");
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
      console.log("📥 Usuarios recibidos del backend:", data);
      setUsers(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar los usuarios";
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  useEffectOnce(() => {
    console.count("📥 fetchUsers llamado");
    if (token) {
      fetchUsers();
    }
  });
  
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

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_URL}/roles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setRoles(data);
      } catch (error) {
        console.error("Error al cargar los roles:", error);
      }
    };

    fetchRoles();
  }, [token]);

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const payload = {
      nombres: editingUser.NOMBRES?.trim(),
      apellidos: editingUser.APELLIDOS?.trim(),
      dni: editingUser.DNI?.trim(),
      correo: editingUser.CORREO?.trim(),
      celular: editingUser.CELULAR?.trim(),
      fecha_nacimiento: editingUser.FECHA_NACIMIENTO?.split("T")[0],
      id_tipo_usuario: editingUser.ID_TIPO_USUARIO,
      id_sexo: editingUser.ID_SEXO,
      usuario: editingUser.USUARIO?.trim(),
      nro_dpto: editingUser.NRO_DPTO,
      comite: editingUser.COMITE ? 1 : 0,
    };

    const camposFaltantes = Object.entries(payload).filter(
      ([_, value]) => value === undefined || value === null || value === ""
    );

    if (camposFaltantes.length > 0) {
      await Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: `Faltan campos requeridos: ${camposFaltantes
          .map(([key]) => key)
          .join(", ")}`,
      });
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/users/${editingUser.ID_USUARIO}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Error al actualizar el usuario");
      }

      // ✅ Aquí se maneja el comité (después de guardar el usuario)
      const comiteEndpoint = `${API_URL}/users/${editingUser.ID_USUARIO}/${
        payload.comite === 1 ? "asignar-comite" : "quitar-comite"
      }`;
      await fetch(comiteEndpoint, {
        method: payload.comite === 1 ? "POST" : "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Usuario actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Error desconocido",
      });
    }
  };

  const handleResetPassword = async (id) => {
    setIsLoading(true); // Activa el estado de carga

    try {
      const response = await fetch(`${API_URL}/users/change-password/${id}`, {
        method: "PUT", // Cambiado a PUT para actualizar
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Mostrar mensaje de éxito y cerrar el modal
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Se ha actualizado la contraseña correctamente.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          setEditingUser(null); // Cierra el modal después del éxito
          setIsLoading(false); // Desactiva el estado de carga
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Hubo un error al actualizar la contraseña.",
        });
        setIsLoading(false); // Desactiva el estado de carga
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error inesperado.",
      });
      setIsLoading(false); // Desactiva el estado de carga
    }
  };

  const handleSaveUser = () => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Quieres guardar los cambios realizados?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, guardar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        handleUpdateUser(); // ya incluye cierre de modal y mensajes
      }
    });
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
                  <td className="py-3 px-4">{user.CORREO}</td>
                  <td className="py-3 px-4">{user.CELULAR}</td>
                  <td className="py-3 px-4">{user.NRO_DPTO ?? "N/A"}</td>
                  <td className="py-3 px-4">
                    {user.FECHA_NACIMIENTO
                      ? user.FECHA_NACIMIENTO.split("T")[0]
                          .split("-")
                          .reverse()
                          .join("/")
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4">{user.COMITE ? "Sí" : "No"}</td>
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
        onRequestClose={() => {
          setEditingUser(null);
          setTimeout(() => document.body.focus(), 0);
        }}
        className="bg-white p-6 w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto mt-20 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {editingUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 className="text-xl font-bold col-span-full">Editar Usuario</h2>

            <div>
              <label className="block font-semibold text-gray-700">
                Nombres
              </label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.NOMBRES}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, NOMBRES: e.target.value })
                }
                placeholder="Nombres"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Apellidos
              </label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.APELLIDOS}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, APELLIDOS: e.target.value })
                }
                placeholder="Apellidos"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">DNI</label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.DNI}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, DNI: e.target.value })
                }
                placeholder="DNI"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Correo
              </label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.CORREO}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, CORREO: e.target.value })
                }
                placeholder="Correo"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Celular
              </label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.CELULAR}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, CELULAR: e.target.value })
                }
                placeholder="Celular"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">Dpto</label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.NRO_DPTO ?? ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    NRO_DPTO: parseInt(e.target.value) || null,
                  })
                }
                placeholder="Dpto"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Fecha de Nacimiento
              </label>
              <input
                className="p-2 border rounded w-full"
                type="date"
                value={editingUser.FECHA_NACIMIENTO?.split("T")[0] || ""}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    FECHA_NACIMIENTO: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Comité
              </label>
              <select
                className="p-2 border rounded w-full"
                value={editingUser.COMITE ? 1 : 0}
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
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Usuario
              </label>
              <input
                className="p-2 border rounded w-full"
                value={editingUser.USUARIO}
                onChange={(e) =>
                  setEditingUser({ ...editingUser, USUARIO: e.target.value })
                }
                placeholder="Usuario"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700">Rol</label>
              <select
                className="p-2 border rounded w-full"
                value={editingUser.ID_TIPO_USUARIO}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    ID_TIPO_USUARIO: parseInt(e.target.value),
                  })
                }
              >
                {roles.map((rol) => (
                  <option key={rol.ID_TIPO_USUARIO} value={rol.ID_TIPO_USUARIO}>
                    {rol.DETALLE_USUARIO}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700">Sexo</label>
              <select
                className="p-2 border rounded w-full"
                value={editingUser.ID_SEXO}
                onChange={(e) =>
                  setEditingUser({
                    ...editingUser,
                    ID_SEXO: parseInt(e.target.value),
                  })
                }
              >
                <option value={1}>Masculino</option>
                <option value={2}>Femenino</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700">
                Reiniciar Contraseña
              </label>
              <input
                type="button"
                value={isLoading ? "Cargando..." : "Reiniciar Contraseña"}
                onClick={() => handleResetPassword(editingUser.ID_USUARIO)}
                className={`p-2 border rounded w-full ${
                  isLoading ? "bg-gray-400" : "bg-gray-200"
                } text-gray-700 hover:bg-gray-300 cursor-pointer`}
                disabled={isLoading}
              />
            </div>

            <div className="col-span-full flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
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
