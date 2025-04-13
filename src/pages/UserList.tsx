import { useState, useEffect } from "react";
import { useEffectOnce } from "../hooks/useEffectOnce";
import {
  FaExclamationCircle,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import Swal from "sweetalert2";
import styled, { keyframes } from "styled-components";

const API_URL = import.meta.env.VITE_API_URL;

// Keyframes for animations
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

// Styled components
const Container = styled.div`
  padding: 1.5rem;
  background-color: #f3f4f6;
  min-height: 100vh;
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  animation: ${slideInDown} 0.5s ease-out;
`;

const Card = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

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
  const [isLoading, setIsLoading] = useState(false);
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
        const res = await fetch(`${API_URL}/get-roles`, {
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

  const handleResetPassword = async (id: number) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/change-password/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Se ha actualizado la contraseña correctamente.",
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          setEditingUser(null);
          setIsLoading(false);
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Hubo un error al actualizar la contraseña.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un error inesperado.",
      });
      setIsLoading(false);
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
        handleUpdateUser();
      }
    });
  };

  const handleDeleteUser = async (id: number) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás deshacer esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${API_URL}/users/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error("Error al eliminar el usuario");
          }

          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Usuario eliminado correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchUsers();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo eliminar el usuario",
          });
        }
      }
    });
  };

  return (
    <Container>
      <Title>Gestión de Usuarios</Title>

      {/* Search and Add User */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Buscar por
              </label>
              <select
                value={searchField}
                onChange={(e) => {
                  setSearchField(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="NOMBRES">Nombres</option>
                <option value="DNI">DNI</option>
                <option value="NRO_DPTO">Nro. Dpto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Valor
              </label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setCurrentPage(1);
                }}
                className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar..."
              />
            </div>
          </div>
          <button
            onClick={() => navigate("/users")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FaPlus className="mr-2" /> Agregar Usuario
          </button>
        </div>

        {/* Message */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm font-semibold">
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
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-4 text-center text-gray-500">
                    No hay usuarios para mostrar.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => (
                  <tr
                    key={user.ID_USUARIO}
                    className={`border-b transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
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
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.ID_USUARIO)}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-500 hover:bg-blue-50"
              }`}
            >
              <FaChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg border ${
                  page === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-white text-blue-500 hover:bg-blue-50"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-500 hover:bg-blue-50"
              }`}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </Card>

      {/* Modal for Editing */}
      <Modal
        isOpen={!!editingUser}
        onRequestClose={() => {
          setEditingUser(null);
          setTimeout(() => document.body.focus(), 0);
        }}
        className="bg-white p-6 w-full sm:max-w-2xl mx-auto mt-20 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {editingUser && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Editar Usuario</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nombres
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.NOMBRES}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, NOMBRES: e.target.value })
                  }
                  placeholder="Nombres"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Apellidos
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.APELLIDOS}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, APELLIDOS: e.target.value })
                  }
                  placeholder="Apellidos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  DNI
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.DNI}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, DNI: e.target.value })
                  }
                  placeholder="DNI"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Correo
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.CORREO}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, CORREO: e.target.value })
                  }
                  placeholder="Correo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Celular
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.CELULAR}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, CELULAR: e.target.value })
                  }
                  placeholder="Celular"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Dpto
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Comité
                </label>
                <select
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Usuario
                </label>
                <input
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingUser.USUARIO}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, USUARIO: e.target.value })
                  }
                  placeholder="Usuario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Rol
                </label>
                <select
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={Number(editingUser.ID_TIPO_USUARIO)}
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Sexo
                </label>
                <select
                  className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Reiniciar Contraseña
                </label>
                <button
                  onClick={() => handleResetPassword(editingUser.ID_USUARIO)}
                  className={`p-2 w-full rounded-lg text-white ${
                    isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? "Cargando..." : "Reiniciar Contraseña"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default UserList;