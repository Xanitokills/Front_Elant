import { useState, useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import Select from "react-select";
import styled, { keyframes } from "styled-components";

const API_URL = import.meta.env.VITE_API_URL;

// Keyframes for animations
const slideInDown = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

// Styled components
const Container = styled.div`
  padding: 1.5rem;
  background-color: #f3f4f6;
  min-height: 100vh;
  @media (min-width: 768px) { padding: 2rem; }
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
  &:hover { box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }
  @media (min-width: 768px) { padding: 2rem; }
`;

interface Perfil {
  ID_PERFIL: number;
  DETALLE_PERFIL: string;
}

interface Sex {
  ID_SEXO: number;
  DESCRIPCION: string;
}

interface Fase {
  ID_FASE: number;
  NOMBRE: string;
}

interface Departamento {
  ID_DEPARTAMENTO: number;
  NRO_DPTO: number;
  DESCRIPCION: string;
  ID_FASE: number;
}

interface TipoResidente {
  ID_CLASIFICACION: number;
  DETALLE_CLASIFICACION: string;
}

interface Rol {
  ID_ROL: number;
  DETALLE_USUARIO: string;
}

interface FormData {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  celular: string;
  contacto_emergencia: string;
  fecha_nacimiento: string;
  id_sexo: string;
  id_perfil: string;
  departamentos: number[];
  id_clasificacion: string;
  inicio_residencia: string;
  fases_trabajador: number[];
  acceso_sistema: boolean;
  usuario: string;
  roles: string[];
}

const Users = () => {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [tiposResidente, setTiposResidente] = useState<TipoResidente[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nombres: "",
    apellidos: "",
    dni: "",
    correo: "",
    celular: "",
    contacto_emergencia: "",
    fecha_nacimiento: "",
    id_sexo: "",
    id_perfil: "",
    departamentos: [],
    id_clasificacion: "",
    inicio_residencia: "",
    fases_trabajador: [],
    acceso_sistema: false,
    usuario: "",
    roles: [],
  });
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({
    text: "",
    type: "",
  });

  const token = localStorage.getItem("token");

  // Calcular edad a partir de la fecha de nacimiento
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.fecha_nacimiento);

  // Generar nombre de usuario
  const generateUsername = (nombres: string, apellidos: string): string => {
    if (!nombres || !apellidos) return "";
    const firstName = nombres.trim().split(" ")[0];
    const lastName = apellidos.trim().replace(/\s+/g, "").toLowerCase();
    return `${firstName[0].toLowerCase()}${lastName}`;
  };

  // Actualizar usuario cuando cambian nombres o apellidos
  useEffect(() => {
    if (formData.acceso_sistema) {
      setFormData((prev) => ({
        ...prev,
        usuario: generateUsername(prev.nombres, prev.apellidos),
      }));
    } else {
      setFormData((prev) => ({ ...prev, usuario: "" }));
    }
  }, [formData.nombres, formData.apellidos, formData.acceso_sistema]);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchPerfiles = async () => {
      try {
        const response = await fetch(`${API_URL}/perfiles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener perfiles");
        const data = await response.json();
        setPerfiles(data);
      } catch (error) {
        setMessage({ text: "Error al cargar perfiles", type: "error" });
      }
    };

    const fetchSexes = async () => {
      try {
        const response = await fetch(`${API_URL}/sexes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener sexos");
        const data = await response.json();
        setSexes(data);
      } catch (error) {
        setMessage({ text: "Error al cargar sexos", type: "error" });
      }
    };

    const fetchFases = async () => {
      try {
        const response = await fetch(`${API_URL}/fases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener fases");
        const data = await response.json();
        setFases(data);
      } catch (error) {
        setMessage({ text: "Error al cargar fases", type: "error" });
      }
    };

    const fetchDepartamentos = async () => {
      try {
        const response = await fetch(`${API_URL}/departamentos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener departamentos");
        const data = await response.json();
        setDepartamentos(data);
      } catch (error) {
        setMessage({ text: "Error al cargar departamentos", type: "error" });
      }
    };

    const fetchTiposResidente = async () => {
      try {
        const response = await fetch(`${API_URL}/tipos-residente`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener tipos de residente");
        const data = await response.json();
        setTiposResidente(data);
      } catch (error) {
        setMessage({ text: "Error al cargar tipos de residente", type: "error" });
      }
    };

    const fetchRoles = async () => {
      try {
        const response = await fetch(`${API_URL}/get-roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Error al obtener roles");
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        setMessage({ text: "Error al cargar roles", type: "error" });
      }
    };

    fetchPerfiles();
    fetchSexes();
    fetchFases();
    fetchDepartamentos();
    fetchTiposResidente();
    fetchRoles();
  }, [token]);

  // Manejar cambios en los inputs
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    let newValue: string | boolean = type === "checkbox" ? checked : value;

    const capitalizeWords = (str: string) =>
      str
        .split(" ")  // Divide el texto por espacios
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza la primera letra de cada palabra
        .join(" ");  // Junta las palabras con espacio
    
    if (name === "nombres" || name === "apellidos") {
      newValue = capitalizeWords(value);  // Aplica la función al valor de los campos
    }
    

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleDepartamentosChange = (selectedOptions: any) => {
    const departamentos = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, departamentos }));
  };

  const handleFasesTrabajadorChange = (selectedOptions: any) => {
    const fases_trabajador = selectedOptions
      ? selectedOptions.map((option: any) => option.value)
      : [];
    setFormData((prev) => ({ ...prev, fases_trabajador }));
  };

  const handleRoleChange = (roleId: string) => {
    setFormData((prev) => {
      const roles = prev.roles.includes(roleId)
        ? prev.roles.filter((id) => id !== roleId)
        : [...prev.roles, roleId];
      return { ...prev, roles };
    });
  };

  const departamentoOptions = departamentos.map((dpto) => {
    const fase = fases.find((f) => f.ID_FASE === dpto.ID_FASE);
    return {
      value: dpto.ID_DEPARTAMENTO,
      label: `${
        dpto.DESCRIPCION && dpto.DESCRIPCION !== String(dpto.NRO_DPTO)
          ? `${dpto.NRO_DPTO} - ${dpto.DESCRIPCION}`
          : `${dpto.NRO_DPTO}`
      } (${fase?.NOMBRE || "Desconocida"})`,
    };
  });

  const faseOptions = fases.map((fase) => ({
    value: fase.ID_FASE,
    label: fase.NOMBRE,
  }));

  const formatDateToDDMMYYYY = (date: string): string => {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombres ||
      !formData.apellidos ||
      !formData.dni ||
      !formData.fecha_nacimiento ||
      !formData.id_sexo ||
      !formData.id_perfil
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

    if (formData.celular && !/^[9][0-9]{8}$/.test(formData.celular)) {
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

    if (formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      await Swal.fire({
        icon: "error",
        title: "Correo inválido",
        text: "El formato del correo no es válido",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (formData.acceso_sistema && (!formData.correo || !formData.roles.length)) {
      await Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "El correo y al menos un rol son obligatorios para acceso al sistema",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (formData.id_perfil === "1") {
      if (
        !formData.departamentos.length ||
        !formData.id_clasificacion ||
        !formData.inicio_residencia
      ) {
        await Swal.fire({
          icon: "error",
          title: "Campos incompletos",
          text:
            "Departamentos, tipo de residente y fecha de inicio de residencia son obligatorios para residentes",
          timer: 2500,
          showConfirmButton: false,
        });
        return;
      }
    }

    if (formData.id_perfil !== "1" && !formData.fases_trabajador.length) {
      await Swal.fire({
        icon: "error",
        title: "Campos incompletos",
        text: "Debe seleccionar al menos una fase para trabajadores",
        timer: 2500,
        showConfirmButton: false,
      });
      return;
    }

    if (age < 18) {
      if (!formData.contacto_emergencia) {
        await Swal.fire({
          icon: "error",
          title: "Contacto requerido",
          text: "El contacto de emergencia es obligatorio para menores de edad",
          timer: 2500,
          showConfirmButton: false,
        });
        return;
      }
    } else {
      if (!formData.celular) {
        await Swal.fire({
          icon: "error",
          title: "Celular requerido",
          text: "El celular es obligatorio para mayores de edad",
          timer: 2500,
          showConfirmButton: false,
        });
        return;
      }
    }

    try {
      const formattedInicioResidencia = formData.inicio_residencia
        ? formatDateToDDMMYYYY(formData.inicio_residencia)
        : null;

      const requestBody = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        dni: formData.dni,
        correo: formData.correo || null,
        celular: formData.celular || null,
        contacto_emergencia: formData.contacto_emergencia || null,
        fecha_nacimiento: formData.fecha_nacimiento,
        id_sexo: parseInt(formData.id_sexo),
        id_perfil: parseInt(formData.id_perfil),
        departamentos: formData.departamentos.length
          ? formData.departamentos
          : null,
        id_clasificacion: formData.id_clasificacion
          ? parseInt(formData.id_clasificacion)
          : null,
        inicio_residencia: formattedInicioResidencia,
        fases_trabajador: formData.fases_trabajador.length
          ? formData.fases_trabajador
          : null,
        usuario: formData.acceso_sistema ? formData.usuario : null,
        roles: formData.acceso_sistema ? formData.roles.map(Number) : null,
        acceso_sistema: formData.acceso_sistema,
      };

      console.log("Enviando solicitud a /register con los siguientes datos:", requestBody);

      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("Respuesta del servidor:", {
        status: response.status,
        data,
      });

      if (response.ok) {
        await Swal.fire({
          icon: "success",
          title: "Persona registrada correctamente",
          text: formData.acceso_sistema
            ? "Se ha enviado un correo con las credenciales de acceso."
            : "Registro completado.",
          timer: 2000,
          showConfirmButton: false,
        });

        setFormData({
          nombres: "",
          apellidos: "",
          dni: "",
          correo: "",
          celular: "",
          contacto_emergencia: "",
          fecha_nacimiento: "",
          id_sexo: "",
          id_perfil: "",
          departamentos: [],
          id_clasificacion: "",
          inicio_residencia: "",
          fases_trabajador: [],
          acceso_sistema: false,
          usuario: "",
          roles: [],
        });
      } else {
        // Manejo específico para el error de departamentos duplicados (50014)
        if (data.errorNumber === 50014) {
          await Swal.fire({
            icon: "error",
            title: "Error de registro",
            text: data.message || "El residente ya está registrado en uno o más departamentos seleccionados.",
            timer: 3000,
            showConfirmButton: false,
          });
        } else {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message || "Error al registrar la persona",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      }
    } catch (error) {
      console.error("Error al enviar la solicitud a /register:", error);
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
      <Title>Registro de Personas</Title>

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

      <Card>
        <h2 className="text-lg font-semibold mb-4">Registrar Nueva Persona</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
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
              Correo {formData.acceso_sistema && "*"}
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={formData.acceso_sistema}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Celular {age >= 18 && "*"}
            </label>
            <input
              type="text"
              name="celular"
              value={formData.celular}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={age >= 18}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Contacto de Emergencia {age < 18 && "*"}
            </label>
            <input
              type="text"
              name="contacto_emergencia"
              value={formData.contacto_emergencia}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={age < 18}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Fecha de Nacimiento *
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
              Perfil *
            </label>
            <select
              name="id_perfil"
              value={formData.id_perfil}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccione un perfil</option>
              {perfiles.map((perfil) => (
                <option key={perfil.ID_PERFIL} value={perfil.ID_PERFIL}>
                  {perfil.DETALLE_PERFIL}
                </option>
              ))}
            </select>
          </div>
          {formData.id_perfil === "1" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Departamentos *
                </label>
                <Select
                  isMulti
                  options={departamentoOptions}
                  onChange={handleDepartamentosChange}
                  placeholder="Busca o selecciona departamentos..."
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Tipo de Residente *
                </label>
                <select
                  name="id_clasificacion"
                  value={formData.id_clasificacion}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione un tipo</option>
                  {tiposResidente.map((tipo) => (
                    <option
                      key={tipo.ID_CLASIFICACION}
                      value={tipo.ID_CLASIFICACION}
                    >
                      {tipo.DETALLE_CLASIFICACION}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Inicio de Residencia *
                </label>
                <input
                  type="date"
                  name="inicio_residencia"
                  value={formData.inicio_residencia}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}
          {formData.id_perfil !== "" && formData.id_perfil !== "1" && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Fases de Trabajo *
              </label>
              <Select
                isMulti
                options={faseOptions}
                onChange={handleFasesTrabajadorChange}
                placeholder="Selecciona fases de trabajo..."
                className="basic-multi-select"
                classNamePrefix="select"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Acceso al Sistema
            </label>
            <input
              type="checkbox"
              name="acceso_sistema"
              checked={formData.acceso_sistema}
              onChange={handleInputChange}
              className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          {formData.acceso_sistema && (
            <>
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
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Roles *
                </label>
                <div className="space-y-2">
                  {roles.map((rol) => (
                    <div key={rol.ID_ROL} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`rol-${rol.ID_ROL}`}
                        value={rol.ID_ROL}
                        checked={formData.roles.includes(String(rol.ID_ROL))}
                        onChange={() => handleRoleChange(String(rol.ID_ROL))}
                        className="h-5 w-5 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`rol-${rol.ID_ROL}`}
                        className="ml-2 text-sm text-gray-600"
                      >
                        {rol.DETALLE_USUARIO}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center transition duration-300"
            >
              <FaCheckCircle className="mr-2" />
              Registrar Persona
            </button>
          </div>
        </form>
      </Card>
    </Container>
  );
};

export default Users;