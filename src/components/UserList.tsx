import { useState, useEffect } from "react";
import {
  FaExclamationCircle,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaEye,
  FaLock,
  FaUserShield,
  FaCamera,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import Swal from "sweetalert2";
import styled, { keyframes } from "styled-components";
import Select from "react-select";

const API_URL = import.meta.env.VITE_API_URL;

const slideInDown = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

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
  &:hover { box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }
  @media (min-width: 768px) { padding: 2rem; }
`;

interface Person {
  ID_PERSONA: number;
  NOMBRES: string;
  APELLIDOS: string;
  DNI: string;
  CORREO: string;
  CELULAR: string;
  FECHA_NACIMIENTO: string;
  SEXO: string;
  DETALLE_PERFIL: string;
  ACCESO_SISTEMA: boolean;
  TIENE_FOTO: boolean;
}

interface PersonDetails {
  basicInfo: {
    ID_PERSONA: number;
    NOMBRES: string;
    APELLIDOS: string;
    DNI: string;
    CORREO: string;
    CELULAR: string;
    CONTACTO_EMERGENCIA: string;
    FECHA_NACIMIENTO: string;
    ID_SEXO: number;
    SEXO: string;
    ID_PERFIL: number;
    DETALLE_PERFIL: string;
    ACCESO_SISTEMA: boolean;
    USUARIO: string;
    ID_USUARIO: number;
    FOTO?: string;
    FORMATO?: string;
  };
  residentInfo: Array<{
    ID_RESIDENTE: number;
    ID_DEPARTAMENTO: number;
    NRO_DPTO: number;
    DEPARTAMENTO_DESCRIPCION: string;
    FASE: string;
    ID_CLASIFICACION: number;
    DETALLE_CLASIFICACION: string;
    INICIO_RESIDENCIA: string;
    FIN_RESIDENCIA?: string;
  }>;
  workerInfo: Array<{
    ID_TRABAJADOR: number;
    ID_FASE: number;
    FASE: string;
    FECHA_ASIGNACION: string;
  }>;
  roles: Array<{
    ID_ROL: number;
    DETALLE_USUARIO: string;
  }>;
}

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

const UserList = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [tiposResidente, setTiposResidente] = useState<TipoResidente[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
  const [editingPerson, setEditingPerson] = useState<PersonDetails | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "roles">("view");
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
  const [newPhoto, setNewPhoto] = useState<File | null>(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const ITEMS_PER_PAGE = 10;

  const fetchPersons = async () => {
    if (!token) {
      setMessage({
        text: "No se encontró un token. Por favor, inicia sesión.",
        type: "error",
      });
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/persons`, {
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

      if (!response.ok) throw new Error("Error al obtener las personas");

      const data = await response.json();
      setPersons(data);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Error al cargar las personas",
        type: "error",
      });
    }
  };

  const fetchPersonDetails = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/persons/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Error al obtener detalles de la persona");

      const data = await response.json();
      setSelectedPerson(data);
      if (viewMode === "edit") setEditingPerson(data);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Error al cargar detalles",
        type: "error",
      });
    }
  };

  const fetchInitialData = async () => {
    try {
      const [perfilesRes, sexesRes, fasesRes, departamentosRes, tiposResidenteRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/perfiles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/sexes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/fases`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/departamentos`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/tipos-residente`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/get-roles`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [perfilesData, sexesData, fasesData, departamentosData, tiposResidenteData, rolesData] = await Promise.all([
        perfilesRes.json(),
        sexesRes.json(),
        fasesRes.json(),
        departamentosRes.json(),
        tiposResidenteRes.json(),
        rolesRes.json(),
      ]);

      setPerfiles(perfilesData);
      setSexes(sexesData);
      setFases(fasesData);
      setDepartamentos(departamentosData);
      setTiposResidente(tiposResidenteData);
      setRoles(rolesData);
    } catch (error) {
      setMessage({
        text: "Error al cargar datos iniciales",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (token) {
      fetchPersons();
      fetchInitialData();
    }
  }, [token]);

  const filteredPersons = persons.filter((person) => {
    const target =
      searchField === "NOMBRES"
        ? `${person.NOMBRES} ${person.APELLIDOS}`.toLowerCase()
        : String(person[searchField as keyof Person] ?? "").toLowerCase();
    return target.includes(searchValue.toLowerCase());
  });

  const paginatedPersons = filteredPersons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredPersons.length / ITEMS_PER_PAGE);

  const handleUpdatePerson = async () => {
    if (!editingPerson) return;

    const payload = {
      nombres: editingPerson.basicInfo.NOMBRES?.trim(),
      apellidos: editingPerson.basicInfo.APELLIDOS?.trim(),
      dni: editingPerson.basicInfo.DNI?.trim(),
      correo: editingPerson.basicInfo.CORREO?.trim(),
      celular: editingPerson.basicInfo.CELULAR?.trim(),
      contacto_emergencia: editingPerson.basicInfo.CONTACTO_EMERGENCIA?.trim(),
      fecha_nacimiento: editingPerson.basicInfo.FECHA_NACIMIENTO?.split("T")[0],
      id_sexo: editingPerson.basicInfo.ID_SEXO,
      id_perfil: editingPerson.basicInfo.ID_PERFIL,
      departamentos: editingPerson.residentInfo.map((r) => r.ID_DEPARTAMENTO),
      id_clasificacion: editingPerson.residentInfo[0]?.ID_CLASIFICACION,
      inicio_residencia: editingPerson.residentInfo[0]?.INICIO_RESIDENCIA?.split("T")[0],
      fases_trabajador: editingPerson.workerInfo.map((w) => w.ID_FASE),
    };

    try {
      const response = await fetch(`${API_URL}/persons/${editingPerson.basicInfo.ID_PERSONA}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la persona");
      }

      if (newPhoto) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result?.toString().split(",")[1];
          await fetch(`${API_URL}/persons/${editingPerson.basicInfo.ID_PERSONA}/photo`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              foto: base64String,
              formato: newPhoto.type.split("/")[1],
            }),
          });
        };
        reader.readAsDataURL(newPhoto);
      }

      await Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Persona actualizada correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      setEditingPerson(null);
      setNewPhoto(null);
      fetchPersons();
      setSelectedPerson(null);
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  };

  const handleDeletePerson = async (id: number) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás deshacer esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${API_URL}/persons/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) throw new Error("Error al eliminar la persona");

          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Persona eliminada correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchPersons();
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo eliminar la persona",
          });
        }
      }
    });
  };

  const handleManageAccess = async (person: PersonDetails, activar: boolean) => {
    Swal.fire({
      title: activar ? "Activar Acceso" : "Desactivar Acceso",
      text: activar
        ? "Se generará un usuario y contraseña para esta persona."
        : "Se desactivará el acceso al sistema para esta persona.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: activar ? "Activar" : "Desactivar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const payload = activar
            ? {
                usuario: `${person.basicInfo.NOMBRES[0].toLowerCase()}${person.basicInfo.APELLIDOS.toLowerCase().replace(/\s+/g, "")}`,
                correo: person.basicInfo.CORREO,
                roles: person.roles.map((r) => r.ID_ROL),
                activar,
                nombres: person.basicInfo.NOMBRES,
                apellidos: person.basicInfo.APELLIDOS,
              }
            : { activar };

          const response = await fetch(`${API_URL}/persons/${person.basicInfo.ID_PERSONA}/access`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) throw new Error("Error al gestionar acceso");

          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: activar ? "Acceso activado correctamente" : "Acceso desactivado correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
          fetchPersons();
          fetchPersonDetails(person.basicInfo.ID_PERSONA);
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo gestionar el acceso",
          });
        }
      }
    });
  };

  const handleManageRoles = async () => {
    if (!editingPerson) return;

    try {
      const response = await fetch(`${API_URL}/persons/${editingPerson.basicInfo.ID_USUARIO}/roles`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roles: editingPerson.roles.map((r) => r.ID_ROL) }),
      });

      if (!response.ok) throw new Error("Error al actualizar roles");

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Roles actualizados correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      fetchPersonDetails(editingPerson.basicInfo.ID_PERSONA);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar los roles",
      });
    }
  };

  const handleResetPassword = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/persons/${id}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al restablecer la contraseña");
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Se ha restablecido la contraseña correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Error al restablecer la contraseña",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultPhoto = (sexo: string) => {
    return sexo === "Masculino"
      ? "https://via.placeholder.com/150?text=Hombre"
      : "https://via.placeholder.com/150?text=Mujer";
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

  const rolOptions = roles.map((rol) => ({
    value: rol.ID_ROL,
    label: rol.DETALLE_USUARIO,
  }));

  return (
    <Container>
      <Title>Gestión de Personas</Title>

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
                <option value="CORREO">Correo</option>
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
            <FaCheckCircle className="mr-2" /> Registrar Persona
          </button>
        </div>

        {message.text && (
          <div
            className={`p-4 mb-6 rounded-lg flex items-center ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
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

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm font-semibold">
                <th className="py-3 px-4 text-left">Foto</th>
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Nombres</th>
                <th className="py-3 px-4 text-left">DNI</th>
                <th className="py-3 px-4 text-left">Perfil</th>
                <th className="py-3 px-4 text-left">Acceso</th>
                <th className="py-3 px-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPersons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">
                    No hay personas para mostrar.
                  </td>
                </tr>
              ) : (
                paginatedPersons.map((person, index) => (
                  <tr
                    key={person.ID_PERSONA}
                    className={`border-b transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100`}
                  >
                    <td className="py-3 px-4">
                      <img
                        src={
                          person.TIENE_FOTO
                            ? `${API_URL}/persons/${person.ID_PERSONA}/photo`
                            : getDefaultPhoto(person.SEXO)
                        }
                        alt="Foto"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = getDefaultPhoto(person.SEXO);
                        }}
                      />
                    </td>
                    <td className="py-3 px-4">{person.ID_PERSONA}</td>
                    <td className="py-3 px-4">{`${person.NOMBRES} ${person.APELLIDOS}`}</td>
                    <td className="py-3 px-4">{person.DNI}</td>
                    <td className="py-3 px-4">{person.DETALLE_PERFIL}</td>
                    <td className="py-3 px-4">
                      {person.ACCESO_SISTEMA ? "Sí" : "No"}
                    </td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button
                        onClick={() => {
                          setViewMode("view");
                          fetchPersonDetails(person.ID_PERSONA);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                        title="Visualizar"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setViewMode("edit");
                          fetchPersonDetails(person.ID_PERSONA);
                        }}
                        className="text-green-500 hover:text-green-700"
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeletePerson(person.ID_PERSONA)}
                        className="text-red-500 hover:text-red-700"
                        title="Eliminar"
                      >
                        <FaTrash />
                      </button>
                      <button
                        onClick={() => {
                          setViewMode("roles");
                          fetchPersonDetails(person.ID_PERSONA);
                        }}
                        className="text-purple-500 hover:text-purple-700"
                        title="Gestionar Acceso"
                      >
                        <FaUserShield />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
              ←
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
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-blue-500 hover:bg-blue-50"
              }`}
            >
              →
            </button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={!!selectedPerson}
        onRequestClose={() => {
          setSelectedPerson(null);
          setEditingPerson(null);
          setNewPhoto(null);
          setViewMode("view");
        }}
        className="bg-white p-6 w-full sm:max-w-3xl mx-auto mt-20 rounded-lg shadow-lg max-h-[90vh] overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {selectedPerson && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {viewMode === "view"
                  ? "Detalles de Persona"
                  : viewMode === "edit"
                  ? "Editar Persona"
                  : "Gestionar Acceso"}
              </h2>
              <button
                onClick={() => {
                  setSelectedPerson(null);
                  setEditingPerson(null);
                  setNewPhoto(null);
                  setViewMode("view");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaExclamationCircle />
              </button>
            </div>

            {viewMode === "view" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 flex justify-center">
                  <img
                    src={
                      selectedPerson.basicInfo.FOTO
                        ? `data:image/${selectedPerson.basicInfo.FORMATO};base64,${selectedPerson.basicInfo.FOTO}`
                        : getDefaultPhoto(selectedPerson.basicInfo.SEXO)
                    }
                    alt="Foto"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultPhoto(selectedPerson.basicInfo.SEXO);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Nombres</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.NOMBRES}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Apellidos</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.APELLIDOS}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">DNI</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.DNI}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Correo</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.CORREO || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Celular</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.CELULAR || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Contacto de Emergencia</label>
                  <p className="p-2 border border-gray-300 rounded-lg">
                    {selectedPerson.basicInfo.CONTACTO_EMERGENCIA || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Fecha de Nacimiento</label>
                  <p className="p-2 border border-gray-300 rounded-lg">
                    {selectedPerson.basicInfo.FECHA_NACIMIENTO?.split("T")[0].split("-").reverse().join("/")}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Sexo</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.SEXO}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Perfil</label>
                  <p className="p-2 border border-gray-300 rounded-lg">{selectedPerson.basicInfo.DETALLE_PERFIL}</p>
                </div>
                {selectedPerson.basicInfo.ID_PERFIL === 1 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Información de Residente</label>
                    <div className="p-2 border border-gray-300 rounded-lg">
                      {selectedPerson.residentInfo.length > 0 ? (
                        selectedPerson.residentInfo.map((res) => (
                          <div key={res.ID_RESIDENTE} className="mb-2">
                            <p><strong>Departamento:</strong> {res.NRO_DPTO} - {res.DEPARTAMENTO_DESCRIPCION}</p>
                            <p><strong>Fase:</strong> {res.FASE}</p>
                            <p><strong>Tipo de Residente:</strong> {res.DETALLE_CLASIFICACION}</p>
                            <p><strong>Inicio de Residencia:</strong> {res.INICIO_RESIDENCIA.split("T")[0].split("-").reverse().join("/")}</p>
                          </div>
                        ))
                      ) : (
                        <p>No hay información de residente.</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedPerson.basicInfo.ID_PERFIL !== 1 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Fases de Trabajo</label>
                    <div className="p-2 border border-gray-300 rounded-lg">
                      {selectedPerson.workerInfo.length > 0 ? (
                        selectedPerson.workerInfo.map((work) => (
                          <div key={work.ID_FASE} className="mb-2">
                            <p><strong>Fase:</strong> {work.FASE}</p>
                            <p><strong>Fecha de Asignación:</strong> {work.FECHA_ASIGNACION.split("T")[0].split("-").reverse().join("/")}</p>
                          </div>
                        ))
                      ) : (
                        <p>No hay fases de trabajo asignadas.</p>
                      )}
                    </div>
                  </div>
                )}
                {selectedPerson.basicInfo.ACCESO_SISTEMA && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Roles</label>
                    <div className="p-2 border border-gray-300 rounded-lg">
                      {selectedPerson.roles.length > 0 ? (
                        selectedPerson.roles.map((rol) => (
                          <p key={rol.ID_ROL}>{rol.DETALLE_USUARIO}</p>
                        ))
                      ) : (
                        <p>No hay roles asignados.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {viewMode === "edit" && editingPerson && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-2 flex justify-center">
                  <div className="relative">
                    <img
                      src={
                        newPhoto
                          ? URL.createObjectURL(newPhoto)
                          : editingPerson.basicInfo.FOTO
                          ? `data:image/${editingPerson.basicInfo.FORMATO};base64,${editingPerson.basicInfo.FOTO}`
                          : getDefaultPhoto(editingPerson.basicInfo.SEXO)
                      }
                      alt="Foto"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
                      onError={(e) => {
                        e.currentTarget.src = getDefaultPhoto(editingPerson.basicInfo.SEXO);
                      }}
                    />
                    <label
                      htmlFor="photo-upload"
                      className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer"
                    >
                      <FaCamera />
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nombres</label>
                  <input
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.NOMBRES}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, NOMBRES: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Apellidos</label>
                  <input
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.APELLIDOS}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, APELLIDOS: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">DNI</label>
                  <input
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.DNI}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, DNI: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Correo</label>
                  <input
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.CORREO || ""}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, CORREO: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Celular</label>
                  <input
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.CELULAR || ""}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, CELULAR: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Contacto de Emergencia</label>
                  <input
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.CONTACTO_EMERGENCIA || ""}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, CONTACTO_EMERGENCIA: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.FECHA_NACIMIENTO?.split("T")[0]}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, FECHA_NACIMIENTO: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Sexo</label>
                  <select
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.ID_SEXO}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, ID_SEXO: parseInt(e.target.value) },
                      })
                    }
                  >
                    {sexes.map((sex) => (
                      <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                        {sex.DESCRIPCION}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Perfil</label>
                  <select
                    className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingPerson.basicInfo.ID_PERFIL}
                    onChange={(e) =>
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: { ...editingPerson.basicInfo, ID_PERFIL: parseInt(e.target.value) },
                        residentInfo: parseInt(e.target.value) === 1 ? editingPerson.residentInfo : [],
                        workerInfo: parseInt(e.target.value) !== 1 ? editingPerson.workerInfo : [],
                      })
                    }
                  >
                    {perfiles.map((perfil) => (
                      <option key={perfil.ID_PERFIL} value={perfil.ID_PERFIL}>
                        {perfil.DETALLE_PERFIL}
                      </option>
                    ))}
                  </select>
                </div>
                {editingPerson.basicInfo.ID_PERFIL === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Departamentos</label>
                      <Select
                        isMulti
                        options={departamentoOptions}
                        value={departamentoOptions.filter((opt) =>
                          editingPerson.residentInfo.some((res) => res.ID_DEPARTAMENTO === opt.value)
                        )}
                        onChange={(selected) =>
                          setEditingPerson({
                            ...editingPerson,
                            residentInfo: selected.map((opt) => ({
                              ID_RESIDENTE: 0,
                              ID_DEPARTAMENTO: opt.value,
                              NRO_DPTO: departamentos.find((d) => d.ID_DEPARTAMENTO === opt.value)?.NRO_DPTO || 0,
                              DEPARTAMENTO_DESCRIPCION:
                                departamentos.find((d) => d.ID_DEPARTAMENTO === opt.value)?.DESCRIPCION || "",
                              FASE:
                                fases.find(
                                  (f) =>
                                    f.ID_FASE ===
                                    departamentos.find((d) => d.ID_DEPARTAMENTO === opt.value)?.ID_FASE
                                )?.NOMBRE || "",
                              ID_CLASIFICACION: editingPerson.residentInfo[0]?.ID_CLASIFICACION || 0,
                              DETALLE_CLASIFICACION:
                                tiposResidente.find(
                                  (t) => t.ID_CLASIFICACION === editingPerson.residentInfo[0]?.ID_CLASIFICACION
                                )?.DETALLE_CLASIFICACION || "",
                              INICIO_RESIDENCIA: editingPerson.residentInfo[0]?.INICIO_RESIDENCIA || new Date().toISOString(),
                            })),
                          })
                        }
                        placeholder="Selecciona departamentos..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Residente</label>
                      <select
                        className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingPerson.residentInfo[0]?.ID_CLASIFICACION || ""}
                        onChange={(e) =>
                          setEditingPerson({
                            ...editingPerson,
                            residentInfo: editingPerson.residentInfo.map((res) => ({
                              ...res,
                              ID_CLASIFICACION: parseInt(e.target.value),
                              DETALLE_CLASIFICACION:
                                tiposResidente.find((t) => t.ID_CLASIFICACION === parseInt(e.target.value))
                                  ?.DETALLE_CLASIFICACION || "",
                            })),
                          })
                        }
                      >
                        <option value="">Seleccione un tipo</option>
                        {tiposResidente.map((tipo) => (
                          <option key={tipo.ID_CLASIFICACION} value={tipo.ID_CLASIFICACION}>
                            {tipo.DETALLE_CLASIFICACION}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Inicio de Residencia</label>
                      <input
                        type="date"
                        className="p-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={editingPerson.residentInfo[0]?.INICIO_RESIDENCIA?.split("T")[0] || ""}
                        onChange={(e) =>
                          setEditingPerson({
                            ...editingPerson,
                            residentInfo: editingPerson.residentInfo.map((res) => ({
                              ...res,
                              INICIO_RESIDENCIA: e.target.value,
                            })),
                          })
                        }
                      />
                    </div>
                  </>
                )}
                {editingPerson.basicInfo.ID_PERFIL !== 1 && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Fases de Trabajo</label>
                    <Select
                      isMulti
                      options={faseOptions}
                      value={faseOptions.filter((opt) =>
                        editingPerson.workerInfo.some((w) => w.ID_FASE === opt.value)
                      )}
                      onChange={(selected) =>
                        setEditingPerson({
                          ...editingPerson,
                          workerInfo: selected.map((opt) => ({
                            ID_TRABAJADOR: editingPerson.basicInfo.ID_PERSONA,
                            ID_FASE: opt.value,
                            FASE: fases.find((f) => f.ID_FASE === opt.value)?.NOMBRE || "",
                            FECHA_ASIGNACION: new Date().toISOString(),
                          })),
                        })
                      }
                      placeholder="Selecciona fases..."
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />
                  </div>
                )}
                <div className="col-span-2 flex justify-end space-x-4 mt-4">
                  <button
                    onClick={() => {
                      setEditingPerson(null);
                      setNewPhoto(null);
                      setViewMode("view");
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdatePerson}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <FaCheckCircle className="mr-2" /> Guardar
                  </button>
                </div>
              </div>
            )}

            {viewMode === "roles" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Estado de Acceso</label>
                  <p className="p-2 border border-gray-300 rounded-lg">
                    {selectedPerson.basicInfo.ACCESO_SISTEMA ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Usuario</label>
                  <p className="p-2 border border-gray-300 rounded-lg">
                    {selectedPerson.basicInfo.USUARIO || "N/A"}
                  </p>
                </div>
                {selectedPerson.basicInfo.ACCESO_SISTEMA && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Roles</label>
                      <Select
                        isMulti
                        options={rolOptions}
                        value={rolOptions.filter((opt) =>
                          selectedPerson.roles.some((r) => r.ID_ROL === opt.value)
                        )}
                        onChange={(selected) =>
                          setEditingPerson({
                            ...selectedPerson,
                            roles: selected.map((opt) => ({
                              ID_ROL: opt.value,
                              DETALLE_USUARIO: opt.label,
                            })),
                          })
                        }
                        placeholder="Selecciona roles..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleManageRoles}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                      >
                        <FaCheckCircle className="mr-2" /> Guardar Roles
                      </button>
                    </div>
                  </>
                )}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => handleManageAccess(selectedPerson, !selectedPerson.basicInfo.ACCESO_SISTEMA)}
                    className={`${
                      selectedPerson.basicInfo.ACCESO_SISTEMA ? "bg-red-600" : "bg-green-600"
                    } text-white px-4 py-2 rounded-lg hover:${
                      selectedPerson.basicInfo.ACCESO_SISTEMA ? "bg-red-700" : "bg-green-700"
                    } flex items-center`}
                  >
                    <FaLock className="mr-2" />
                    {selectedPerson.basicInfo.ACCESO_SISTEMA ? "Desactivar Acceso" : "Activar Acceso"}
                  </button>
                  {selectedPerson.basicInfo.ACCESO_SISTEMA && (
                    <button
                      onClick={() => handleResetPassword(selectedPerson.basicInfo.ID_USUARIO)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center"
                      disabled={isLoading}
                    >
                      <FaLock className="mr-2" /> Restablecer Contraseña
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default UserList;