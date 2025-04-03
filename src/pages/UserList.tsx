import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaCheckCircle,
  FaEdit,
  FaSave,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const fetchUsers = async () => {
    if (!token) {
      setMessage({ text: "No se encontró un token. Por favor, inicia sesión.", type: "error" });
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
        setMessage({ text: "Sesión expirada. Por favor, inicia sesión nuevamente.", type: "error" });
        navigate("/login");
        return;
      }

      if (response.status === 404) throw new Error("El endpoint de usuarios no fue encontrado en el servidor");
      if (!response.ok) throw new Error("Error al obtener los usuarios");

      const data = await response.json();
      setUsers(data);
      setMessage({ text: "Usuarios cargados exitosamente", type: "success" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al cargar los usuarios";
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token, navigate]);

  const handleEdit = (user: User) => {
    setEditingUserId(user.ID_USUARIO);
    setEditedUser({ ...user });
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setEditedUser({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditedUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (checked ? 1 : 0) : value,
    }));
  };

  const validateUserData = (user: Partial<User>): string | null => {
    if (!user.NOMBRES?.trim()) return "El nombre es requerido";
    if (!user.APELLIDOS?.trim()) return "Los apellidos son requeridos";
    if (!/^[0-9]{8}$/.test(user.DNI || "")) return "El DNI debe tener exactamente 8 dígitos";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.CORREO || "")) return "El correo debe ser válido";
    if (!/^[9][0-9]{8}$/.test(user.CELULAR || "")) return "El celular debe comenzar con 9 y tener 9 dígitos";
    if (!user.USUARIO?.trim()) return "El usuario es requerido";
    return null;
  };

  const handleSave = async (id: number) => {
    const validationError = validateUserData(editedUser);
    if (validationError) {
      setMessage({ text: validationError, type: "error" });
      return;
    }

    try {
      const userToUpdate = users.find((u) => u.ID_USUARIO === id);
      if (!userToUpdate) throw new Error("Usuario no encontrado");

      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nro_dpto: editedUser.NRO_DPTO || null,
          nombres: editedUser.NOMBRES || userToUpdate.NOMBRES,
          apellidos: editedUser.APELLIDOS || userToUpdate.APELLIDOS,
          dni: editedUser.DNI || userToUpdate.DNI,
          correo: editedUser.CORREO || userToUpdate.CORREO,
          celular: editedUser.CELULAR || userToUpdate.CELULAR,
          contacto_emergencia: null,
          fecha_nacimiento: editedUser.FECHA_NACIMIENTO || null,
          id_tipo_usuario: userToUpdate.ID_TIPO_USUARIO,
          id_sexo: userToUpdate.ID_SEXO,
          detalle: null,
          observaciones: null,
          comite: editedUser.COMITE !== undefined ? editedUser.COMITE : userToUpdate.COMITE,
          usuario: editedUser.USUARIO || userToUpdate.USUARIO,
        }),
      });

      if (response.status === 401) {
        localStorage.clear();
        setMessage({ text: "Sesión expirada. Por favor, inicia sesión nuevamente.", type: "error" });
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el usuario");
      }

      setMessage({ text: "Usuario actualizado exitosamente", type: "success" });
      setEditingUserId(null);
      setEditedUser({});
      fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el usuario";
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;

    try {
      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.clear();
        setMessage({ text: "Sesión expirada. Por favor, inicia sesión nuevamente.", type: "error" });
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el usuario");
      }

      setMessage({ text: "Usuario eliminado exitosamente", type: "success" });
      fetchUsers();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al eliminar el usuario";
      setMessage({ text: errorMessage, type: "error" });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lista de Usuarios</h1>
        <button
          onClick={() => navigate("/users")}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300 flex items-center"
        >
          <FaPlus className="mr-2" />
          Agregar Usuario
        </button>
      </div>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? <FaCheckCircle className="mr-2" /> : <FaExclamationCircle className="mr-2" />}
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
                <th className="py-3 px-4 text-left">Nro. Dpto</th>
                <th className="py-3 px-4 text-left">Fecha Nacimiento</th>
                <th className="py-3 px-4 text-left">Comité</th>
                <th className="py-3 px-4 text-left">Usuario</th>
                <th className="py-3 px-4 text-left">Rol</th>
                <th className="py-3 px-4 text-left">Sexo</th>
                <th className="py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 font-light">
              {users.map((user) => (
                <tr key={user.ID_USUARIO} className="border-b border-gray-200 hover:bg-gray-100">
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.ID_USUARIO}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.NOMBRES}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.APELLIDOS}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.DNI}</td>
                  <td className="py-3 px-4 text-left break-all">{user.CORREO}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.CELULAR}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.NRO_DPTO ?? "N/A"}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.FECHA_NACIMIENTO ? new Date(user.FECHA_NACIMIENTO).toLocaleDateString() : "N/A"}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.COMITE === 1 ? "Sí" : "No"}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.USUARIO}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.ROL}</td>
                  <td className="py-3 px-4 text-left whitespace-nowrap">{user.SEXO}</td>
                  <td className="py-3 px-4 text-left flex space-x-2">
                    <button onClick={() => handleEdit(user)} className="text-blue-500 hover:text-blue-700">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(user.ID_USUARIO)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserList;
