import { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
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
  animation: ${fadeIn} 0.5s ease-out;
  &:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

// Interfaces
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
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
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
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({
    text: "",
    type: "",
  });

  const token = localStorage.getItem("token");

  // Generate username from nombres and apellidos
  const generateUsername = (nombres: string, apellidos: string): string => {
    if (!nombres || !apellidos) return "";
    const firstName = nombres.trim().split(" ")[0];
    const lastName = apellidos.trim().replace(/\s+/g, "").toLowerCase();
    return `${firstName[0].toLowerCase()}${lastName}`;
  };

  // Update username whenever nombres or apellidos change
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      usuario: generateUsername(prev.nombres, prev.apellidos),
    }));
  }, [formData.nombres, formData.apellidos]);

  // Fetch user types and sexes
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

  // Handle input changes
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

  // Handle form submission
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
        const { ID_USUARIO } = data;

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
    <Container>
      <Title>Registro de Usuarios</Title>

      {/* Message */}
      {message.text && (
        <Card>
          <div
            className={`p-4 rounded-lg flex items-center ${
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
        </Card>
      )}

      {/* Form */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">Registrar Nuevo Usuario</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nro. Departamento
            </label>
            <input
              type="number"
              name="nro_dpto"
              value={formData.nro_dpto}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value < 0) return;
                handleInputChange(e);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nombres *
            </label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Apellidos *
            </label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              DNI *
            </label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Correo *
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Celular *
            </label>
            <input
              type="text"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Contacto de Emergencia
            </label>
            <input
              type="text"
              name="contacto_emergencia"
              value={formData.contacto_emergencia}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tipo de Usuario *
            </label>
            <select
              name="id_tipo_usuario"
              value={formData.id_tipo_usuario}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Sexo *
            </label>
            <select
              name="id_sexo"
              value={formData.id_sexo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Detalle
            </label>
            <input
              type="text"
              name="detalle"
              value={formData.detalle}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Pertenece al Comité
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
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Usuario *
            </label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">
              Generado automáticamente a partir del nombre y apellido.
            </p>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition duration-300"
            >
              <FaCheckCircle className="mr-2" />
              Registrar Usuario
            </button>
          </div>
        </form>
      </Card>
    </Container>
  );
};

export default Users;