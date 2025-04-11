import { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

// Interfaces para los datos
interface UserType {
  ID_TIPO_USUARIO: number;
  DETALLE_USUARIO: string;
}

interface Sex {
  ID_SEXO: number;
  DESCRIPCION: string;
}

interface FormData {
  nro_dpto: string;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  celular: string;
  contacto_emergencia: string;
  fecha_nacimiento: string;
  id_tipo_usuario: string;
  id_sexo: string;
  detalle: string;
  observaciones: string;
  comite: boolean;
  usuario: string;
}

const Users = () => {
  // Estado para los tipos de usuario y sexos
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);

  // Estado para el formulario
  const [formData, setFormData] = useState<FormData>({
    nro_dpto: "",
    nombres: "",
    apellidos: "",
    dni: "",
    correo: "",
    celular: "",
    contacto_emergencia: "",
    fecha_nacimiento: "",
    id_tipo_usuario: "",
    id_sexo: "",
    detalle: "",
    observaciones: "",
    comite: false,
    usuario: "",
  });

  // Estado para mensajes de éxito o error
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({
    text: "",
    type: "",
  });

  // Obtener el token de localStorage
  const token = localStorage.getItem("token");

  // Obtener tipos de usuario y sexos al montar el componente
  useEffect(() => {
    const fetchUserTypes = async () => {
      try {
        const response = await fetch(`${API_URL}/user-types`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Error al obtener tipos de usuario");
        const data = await response.json();
        setUserTypes(data);
      } catch (error) {
        console.error(error);
        setMessage({ text: "Error al cargar tipos de usuario", type: "error" });
      }
    };

    const fetchSexes = async () => {
      try {
        const response = await fetch(`${API_URL}/sexes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Error al obtener sexos");
        const data = await response.json();
        setSexes(data);
      } catch (error) {
        console.error(error);
        setMessage({ text: "Error al cargar sexos", type: "error" });
      }
    };

    fetchUserTypes();
    fetchSexes();
  }, [token]);

  // Manejar cambios en los inputs
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombres ||
      !formData.apellidos ||
      !formData.dni ||
      !formData.correo ||
      !formData.celular ||
      !formData.id_tipo_usuario ||
      !formData.id_sexo ||
      !formData.usuario
    ) {
      await Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Por favor, completa todos los campos requeridos (*)",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (!/^[0-9]{8}$/.test(formData.dni)) {
      await Swal.fire({
        icon: "error",
        title: "DNI inválido",
        text: "El DNI debe tener exactamente 8 dígitos",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (!/^[9][0-9]{8}$/.test(formData.celular)) {
      await Swal.fire({
        icon: "error",
        title: "Celular inválido",
        text: "El celular debe comenzar con 9 y tener 9 dígitos",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (
      formData.contacto_emergencia &&
      !/^[9][0-9]{8}$/.test(formData.contacto_emergencia)
    ) {
      await Swal.fire({
        icon: "error",
        title: "Contacto inválido",
        text: "El contacto de emergencia debe comenzar con 9 y tener 9 dígitos",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      await Swal.fire({
        icon: "error",
        title: "Correo inválido",
        text: "El formato del correo no es válido",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nro_dpto: formData.nro_dpto ? parseInt(formData.nro_dpto) : null,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          dni: formData.dni,
          correo: formData.correo,
          celular: formData.celular,
          contacto_emergencia: formData.contacto_emergencia || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
          id_tipo_usuario: parseInt(formData.id_tipo_usuario),
          id_sexo: parseInt(formData.id_sexo),
          detalle: formData.detalle || null,
          observaciones: formData.observaciones || null,
          comite: formData.comite ? 1 : 0,
          usuario: formData.usuario,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { ID_USUARIO } = await data; // asegúrate que el backend te devuelva el ID del nuevo usuario

        // 🧠 Si se marcó como Comité
        if (formData.comite) {
          try {
            await fetch(`${API_URL}/users/${ID_USUARIO}/asignar-comite`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("✅ Rol de Comité asignado correctamente");
          } catch (error) {
            console.error("⚠️ Error al asignar Comité:", error);
          }
        }

        await Swal.fire({
          icon: "success",
          title: "Usuario registrado correctamente",
          text: "La contraseña por defecto es el DNI.",
          timer: 2000,
          showConfirmButton: false,
        });
      
        // Limpiar el formulario
        setFormData({
          nro_dpto: "",
          nombres: "",
          apellidos: "",
          dni: "",
          correo: "",
          celular: "",
          contacto_emergencia: "",
          fecha_nacimiento: "",
          id_tipo_usuario: "",
          id_sexo: "",
          detalle: "",
          observaciones: "",
          comite: false,
          usuario: "",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Error al registrar el usuario",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error de conexión",
        text: String(error),
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Registro de Usuarios</h1>

      {/* Mensaje de éxito o error */}
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

      {/* Formulario de Registro */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Registrar Nuevo Usuario</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nro. Departamento
            </label>
            <input
              type="number"
              name="nro_dpto"
              value={formData.nro_dpto}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value < 0) return; //  Bloquea negativos manualmente
                handleInputChange(e);
              }}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombres *
            </label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Apellidos *
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              DNI *
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Correo *
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Celular *
            </label>
            <input
              type="text"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contacto de Emergencia
            </label>
            <input
              type="text"
              name="contacto_emergencia"
              value={formData.contacto_emergencia}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo de Usuario *
            </label>
            <select
              name="id_tipo_usuario"
              value={formData.id_tipo_usuario}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un tipo</option>
              {userTypes.map((type) => (
                <option key={type.ID_TIPO_USUARIO} value={type.ID_TIPO_USUARIO}>
                  {type.DETALLE_USUARIO}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sexo *
            </label>
            <select
              name="id_sexo"
              value={formData.id_sexo}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un sexo</option>
              {sexes.map((sex) => (
                <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                  {sex.DESCRIPCION}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Detalle
            </label>
            <input
              type="text"
              name="detalle"
              value={formData.detalle}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pertenece al Comité *
            </label>
            <input
              type="checkbox"
              name="comite"
              checked={formData.comite}
              onChange={handleInputChange}
              className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Usuario *
            </label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Registrar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;
