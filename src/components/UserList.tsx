import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import Select from "react-select";
import Swal from "sweetalert2";
import Switch from "react-switch";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaCheckCircle,
  FaLock,
  FaCamera,
} from "react-icons/fa";
import styled, { keyframes } from "styled-components";

const API_URL = import.meta.env.VITE_API_URL;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const SpinnerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4); // Fondo oscuro opaco
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Spinner = styled.div`
  border: 6px solid #eee;
  border-top: 6px solid #3b82f6;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: ${spin} 1s linear infinite;
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
  ESTADO: number; // Agregar campo ESTADO
  FASES_RESIDENTE?: string;
  FASES_TRABAJADOR?: string;
  DEPARTAMENTOS?: string;
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
    SEXO: string;
    DETALLE_PERFIL: string;
    ID_PERFIL: number;
    ID_SEXO: number;
    ACCESO_SISTEMA: boolean;
    USUARIO?: string;
    ID_USUARIO?: number;
    FOTO?: string;
    FORMATO?: string;
  };
  residentInfo: {
    ID_RESIDENTE: number;
    ID_DEPARTAMENTO: number;
    NRO_DPTO: number;
    DEPARTAMENTO_DESCRIPCION: string;
    FASE: string;
    ID_CLASIFICACION: number;
    DETALLE_CLASIFICACION: string;
    INICIO_RESIDENCIA: string;
  }[];
  workerInfo: {
    ID_TRABAJADOR: number;
    ID_FASE: number;
    FASE: string;
    FECHA_ASIGNACION: string;
  }[];
  roles: { ID_ROL: number; DETALLE_USUARIO: string }[];
}

interface Sex {
  ID_SEXO: number;
  DESCRIPCION: string;
}

interface Perfil {
  ID_PERFIL: number;
  DETALLE_PERFIL: string;
}

interface Departamento {
  ID_DEPARTAMENTO: number;
  NRO_DPTO: number;
  DESCRIPCION: string;
  ID_FASE: number;
}

interface Fase {
  ID_FASE: number;
  NOMBRE: string;
}

interface TipoResidente {
  ID_CLASIFICACION: number;
  DETALLE_CLASIFICACION: string;
}

interface Role {
  ID_ROL: number;
  DETALLE_USUARIO: string;
}

interface Message {
  text: string;
  type: "success" | "error";
}

interface PersonWithRoles {
  basicInfo: {
    ID_PERSONA: number;
    NOMBRES: string;
    APELLIDOS: string;
    CORREO: string;
  };
  roles: { ID_ROL: number }[];
  usuario?: string;
}

const UserList = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(
    null
  );
  const [editingPerson, setEditingPerson] = useState<PersonDetails | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"view" | "edit" | "roles">("view");
  const [message, setMessage] = useState<Message | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [sexes, setSexes] = useState<Sex[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [fases, setFases] = useState<Fase[]>([]);
  const [tiposResidente, setTiposResidente] = useState<TipoResidente[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [showActive, setShowActive] = useState(true); // Mostrar activas por defecto

  // Estados para búsqueda y paginación
  const [searchField, setSearchField] = useState<
    keyof Person | "FASE" | "DEPARTAMENTO" | "FASE_AND_DEPARTAMENTO"
  >("NOMBRES");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFase, setSelectedFase] = useState("");
  const [departamentoNumber, setDepartamentoNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedFaseId, setSelectedFaseId] = useState<number | null>(null);

  const fetchPersons = async () => {
    if (!token) {
      setMessage({
        text: "No se encontró un token. Por favor, inicia sesión.",
        type: "error",
      });
      navigate("/login");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/persons?mostrarActivos=${showActive ? 1 : 0}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
        text:
          error instanceof Error
            ? error.message
            : "Error al cargar las personas",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPersonDetails = async (
    id: number,
    mode: "view" | "edit" | "roles"
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/persons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok)
        throw new Error("Error al obtener detalles de la persona");

      const data = await response.json();
      setSelectedPerson(data);
      setEditingPerson(data);
      setViewMode(mode);
      if (mode === "roles" && !data.basicInfo.CORREO) {
        setShowEmailInput(true);
      }
    } catch (error) {
      setMessage({
        text:
          error instanceof Error ? error.message : "Error al cargar detalles",
        type: "error",
      });
    } finally {
      setIsLoading(false);
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
      console.error("Error fetching sexes:", error);
    }
  };

  const fetchPerfiles = async () => {
    try {
      const response = await fetch(`${API_URL}/perfiles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener perfiles");
      const data = await response.json();
      setPerfiles(data);
    } catch (error) {
      console.error("Error fetching perfiles:", error);
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
      console.error("Error fetching departamentos:", error);
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
      console.error("Error fetching fases:", error);
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
      console.error("Error fetching tipos de residente:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` },
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
      if (!response.ok) {
        throw new Error(`Error al obtener roles: ${response.statusText}`);
      }
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setMessage({
        text: error instanceof Error ? error.message : "Error al cargar roles",
        type: "error",
      });
    }
  };

  const handleDeletePerson = async (id: number) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`${API_URL}/persons/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) throw new Error("Error al eliminar la persona");

          setPersons(persons.filter((person) => person.ID_PERSONA !== id));
          Swal.fire({
            icon: "success",
            title: "Eliminado",
            text: "Persona eliminada correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
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

  const handleUpdatePerson = async () => {
    if (!editingPerson) return;
    try {
      setIsLoading(true);

      const photoData = newPhoto
        ? {
            foto: await newPhoto
              .arrayBuffer()
              .then((buffer) => Buffer.from(buffer).toString("base64")),
            formato: newPhoto.type.split("/")[1],
          }
        : null;

      const payload = {
        basicInfo: {
          nombres: editingPerson.basicInfo.NOMBRES,
          apellidos: editingPerson.basicInfo.APELLIDOS,
          dni: editingPerson.basicInfo.DNI,
          correo: editingPerson.basicInfo.CORREO,
          celular: editingPerson.basicInfo.CELULAR,
          contacto_emergencia: editingPerson.basicInfo.CONTACTO_EMERGENCIA,
          fecha_nacimiento: editingPerson.basicInfo.FECHA_NACIMIENTO,
          id_sexo: editingPerson.basicInfo.ID_SEXO,
          id_perfil: editingPerson.basicInfo.ID_PERFIL,
        },
        residentInfo: editingPerson.residentInfo.map((r) => ({
          id_departamento: r.ID_DEPARTAMENTO,
          id_clasificacion: r.ID_CLASIFICACION,
          inicio_residencia: r.INICIO_RESIDENCIA,
        })),
        workerInfo: editingPerson.workerInfo.map((w) => ({
          id_fase: w.ID_FASE,
          fecha_asignacion: w.FECHA_ASIGNACION,
        })),
        photo: photoData,
      };

      const response = await fetch(
        `${API_URL}/persons/${editingPerson.basicInfo.ID_PERSONA}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la persona");
      }

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Persona actualizada correctamente",
        timer: 2000,
        showConfirmButton: false,
      });

      setSelectedPerson(null);
      setEditingPerson(null);
      setNewPhoto(null);
      setViewMode("view");
      fetchPersons();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message.includes("correo")
          ? "El correo ya está registrado"
          : error.message.includes("DNI")
          ? "El DNI ya está registrado"
          : "No se pudo actualizar la persona",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Por favor, ingrese un correo válido.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/persons/${selectedPerson?.basicInfo.ID_PERSONA}/email`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ correo: newEmail }),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar el correo");

      setSelectedPerson({
        ...selectedPerson!,
        basicInfo: { ...selectedPerson!.basicInfo, CORREO: newEmail },
      });
      setEditingPerson({
        ...editingPerson!,
        basicInfo: { ...editingPerson!.basicInfo, CORREO: newEmail },
      });
      setShowEmailInput(false);
      setNewEmail("");
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Correo actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el correo",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateUsername = (nombres: string, apellidos: string): string => {
    const nombre = nombres?.split(" ")[0]?.toLowerCase() || "usuario";
    const apellido = apellidos?.split(" ")[0]?.toLowerCase() || "nuevo";
    return `${nombre}${apellido}`.slice(0, 15); // máximo 15 caracteres
  };

  const handleManageAccess = async (
    person: PersonWithRoles,
    activar: boolean
  ) => {
    if (!person) return;
    setIsLoading(true); // 🌀 Mostrar spinner

    const { ID_PERSONA, NOMBRES, APELLIDOS, CORREO } = person.basicInfo;
    const rolesSeleccionados = person.roles.map((r) => r.ID_ROL);

    if (activar) {
      // Validaciones
      if (!CORREO || rolesSeleccionados.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Faltan datos",
          text: "Debe ingresar un correo válido y asignar al menos un rol.",
        });
        setIsLoading(false);
        return;
      }

      // Generar usuario único
      const usuarioBase =
        person.usuario || generateUsername(NOMBRES, APELLIDOS);
      let usuario = usuarioBase;
      let intentos = 0;

      while ((await checkUsername(usuario)) && intentos < 5) {
        intentos++;
        usuario = `${usuarioBase}${intentos}`;
      }

      if (await checkUsername(usuario)) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo generar un nombre de usuario único. Intente manualmente.",
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/persons/${ID_PERSONA}/access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              usuario,
              correo: CORREO,
              roles: rolesSeleccionados,
              activar: true,
              nombres: NOMBRES,
              apellidos: APELLIDOS,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Error al activar acceso");
        }

        Swal.fire({
          icon: "success",
          title: "Acceso activado",
          text: `Se activó el acceso correctamente para ${NOMBRES}`,
          timer: 2000,
          showConfirmButton: false,
        });

        setSelectedPerson(null);
        setEditingPerson(null);
        setViewMode("view");
        fetchPersons();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo activar el acceso",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Desactivar acceso
      try {
        const response = await fetch(
          `${API_URL}/persons/${ID_PERSONA}/access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              activar: false,
              nombres: NOMBRES,
              apellidos: APELLIDOS,
              correo: CORREO,
              roles: [],
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Error al desactivar acceso");
        }

        Swal.fire({
          icon: "success",
          title: "Acceso desactivado",
          text: `Se desactivó el acceso correctamente para ${NOMBRES}`,
          timer: 2000,
          showConfirmButton: false,
        });

        setSelectedPerson(null);
        setEditingPerson(null);
        setViewMode("view");
        fetchPersons();
      } catch (error: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "No se pudo desactivar el acceso",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleManageRoles = async () => {
    if (!editingPerson) return;

    const roles = editingPerson.roles.map((r) => r.ID_ROL);

    if (roles.length === 0 && editingPerson.basicInfo.ACCESO_SISTEMA) {
      Swal.fire({
        title: "Desactivar Acceso",
        text: "No se han asignado roles. Esto desactivará el acceso al sistema.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Desactivar",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            setIsLoading(true);
            const response = await fetch(
              `${API_URL}/persons/${editingPerson.basicInfo.ID_PERSONA}/access`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ activar: false }),
              }
            );

            if (!response.ok) throw new Error("Error al desactivar acceso");

            setSelectedPerson({
              ...selectedPerson!,
              basicInfo: {
                ...selectedPerson!.basicInfo,
                ACCESO_SISTEMA: false,
                USUARIO: undefined,
                ID_USUARIO: undefined,
              },
              roles: [],
            });

            setEditingPerson({
              ...editingPerson,
              basicInfo: {
                ...editingPerson.basicInfo,
                ACCESO_SISTEMA: false,
                USUARIO: undefined,
                ID_USUARIO: undefined,
              },
              roles: [],
            });

            Swal.fire({
              icon: "success",
              title: "Éxito",
              text: "Acceso desactivado correctamente",
              timer: 2000,
              showConfirmButton: false,
            });
            fetchPersons();
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "No se pudo desactivar el acceso",
            });
          } finally {
            setIsLoading(false);
          }
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/persons/${editingPerson.basicInfo.ID_USUARIO}/roles`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ roles }),
        }
      );

      if (!response.ok) throw new Error("Error al actualizar roles");

      setSelectedPerson({
        ...selectedPerson!,
        roles: editingPerson.roles,
      });

      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Roles actualizados correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedPerson(null);
      setEditingPerson(null);
      setViewMode("view");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar los roles",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (idUsuario: number) => {
    Swal.fire({
      title: "¿Restablecer contraseña?",
      text: "Se generará una nueva contraseña para el usuario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Restablecer",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setIsLoading(true);
          const response = await fetch(
            `${API_URL}/persons/${idUsuario}/change-password`,
            {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) throw new Error("Error al restablecer contraseña");

          Swal.fire({
            icon: "success",
            title: "Éxito",
            text: "Contraseña restablecida correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo restablecer la contraseña",
          });
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const getDefaultPhoto = (sexo: string) => {
    return sexo === "Masculino" ? "/images/Hombree.jpeg" : "/images/Mujer.jpeg";
  };

  const filteredPersons = useMemo(() => {
    return persons.filter((person) => {
      if (person.ESTADO === 0 && showActive) return false; // Filtrar inactivas si showActive es true
      if (!searchValue && !selectedFase && !departamentoNumber) return true;

      if (searchField === "FASE_AND_DEPARTAMENTO") {
        const fases = [
          ...(person.FASES_RESIDENTE?.split(", ") || []),
          ...(person.FASES_TRABAJADOR?.split(", ") || []),
        ];
        const departamentos = person.DEPARTAMENTOS?.toLowerCase() || "";
        const faseMatch = selectedFase ? fases.includes(selectedFase) : true;
        const dptoMatch = departamentoNumber
          ? departamentos.includes(departamentoNumber.toLowerCase())
          : true;
        return faseMatch && dptoMatch;
      }

      const target =
        searchField === "NOMBRES"
          ? `${person.NOMBRES} ${person.APELLIDOS}`.toLowerCase()
          : String(person[searchField as keyof Person] ?? "").toLowerCase();
      return target.includes(searchValue.toLowerCase());
    });
  }, [
    persons,
    searchField,
    searchValue,
    selectedFase,
    departamentoNumber,
    showActive,
  ]);

  const paginatedPersons = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPersons.slice(start, start + itemsPerPage);
  }, [filteredPersons, currentPage]);

  const totalPages = Math.ceil(filteredPersons.length / itemsPerPage);

  const roleOptions = roles.map((r) => ({
    value: r.ID_ROL,
    label: r.DETALLE_USUARIO,
  }));

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Devuelve YYYY-MM-DD
  };

  const formatLocalDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD en zona horaria local
  };

  // Filtrar departamentos según la fase seleccionada
  const filteredDepartamentos = selectedFaseId
    ? departamentos.filter((dpto) => dpto.ID_FASE === selectedFaseId)
    : departamentos;

  const checkUsername = async (username: string): Promise<boolean> => {
    const res = await fetch(
      `${API_URL}/check-username?username=${encodeURIComponent(username)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await res.json();
    return data.exists;
  };

  useEffect(() => {
    fetchPersons();
    fetchSexes();
    fetchPerfiles();
    fetchDepartamentos();
    fetchFases();
    fetchTiposResidente();
    fetchRoles();
  }, [showActive]); // Agregar showActive como dependencia

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    setSearchValue("");
    setSelectedFase("");
    setDepartamentoNumber("");
    setCurrentPage(1);
  }, [searchField]);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center sm:text-left">
        Gestión de Personas
      </h1>
      <div className="mb-4 flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <span>Mostrar {showActive ? "Activos" : "Inactivos"}</span>
          <Switch
            onChange={() => {
              setShowActive(!showActive);
              setCurrentPage(1); // Resetear página al cambiar
            }}
            checked={showActive}
            onColor="#2563EB"
            offColor="#EF4444"
          />
        </label>
      </div>
      {message && (
        <div
          className={`p-4 mb-4 rounded-lg text-center ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:space-x-4">
        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(
              e.target.value as keyof Person | "FASE_AND_DEPARTAMENTO"
            );
          }}
          className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 sm:mb-0 sm:w-48"
        >
          <option value="NOMBRES">Nombres</option>
          <option value="DNI">DNI</option>
          <option value="CORREO">Correo</option>
          <option value="FASE_AND_DEPARTAMENTO">Fase y Departamento</option>
        </select>
        {searchField === "FASE_AND_DEPARTAMENTO" ? (
          <div className="flex items-center space-x-2">
            <select
              value={selectedFase}
              onChange={(e) => {
                setSelectedFase(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            >
              <option value="">Seleccione una fase</option>
              {fases.map((fase) => (
                <option key={fase.ID_FASE} value={fase.NOMBRE}>
                  {fase.NOMBRE}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nº Departamento"
              value={departamentoNumber}
              onChange={(e) => {
                setDepartamentoNumber(e.target.value);
                setCurrentPage(1);
              }}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
            <button
              onClick={() => setCurrentPage(1)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>
        ) : (
          <input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        )}
      </div>
      <div className="overflow-x-auto shadow-lg rounded-lg">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold">ID</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Nombres
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">DNI</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Perfil
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Acceso
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Estado
              </th>
              <th className="py-3 px-4 text-left text-sm font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedPersons.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-gray-500">
                  No hay personas para mostrar.
                </td>
              </tr>
            ) : (
              paginatedPersons.map((person, index) => (
                <tr
                  key={person.ID_PERSONA}
                  className={`border-b transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="py-3 px-4">{person.ID_PERSONA}</td>
                  <td className="py-3 px-4">{`${person.NOMBRES} ${person.APELLIDOS}`}</td>
                  <td className="py-3 px-4">{person.DNI}</td>
                  <td className="py-3 px-4">{person.DETALLE_PERFIL}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        person.ACCESO_SISTEMA
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {person.ACCESO_SISTEMA ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        person.ESTADO
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {person.ESTADO ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => {
                        setViewMode("view");
                        fetchPersonDetails(person.ID_PERSONA, "view");
                      }}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Visualizar"
                    >
                      <FaEye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("edit");
                        fetchPersonDetails(person.ID_PERSONA, "edit");
                      }}
                      className="text-green-600 hover:text-green-800 transition-colors"
                      title="Editar"
                    >
                      <FaEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePerson(person.ID_PERSONA)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar"
                    >
                      <FaTrash size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setViewMode("roles");
                        setShowEmailInput(false);
                        fetchPersonDetails(person.ID_PERSONA, "roles");
                      }}
                      className="text-purple-600 hover:text-purple-800 transition-colors"
                      title="Gestionar Acceso"
                    >
                      <FaUserShield size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
          >
            Anterior
          </button>
          <span className="px-4 py-2 text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
      <Modal
        isOpen={!!selectedPerson}
        onRequestClose={() => {
          setSelectedPerson(null);
          setEditingPerson(null);
          setNewPhoto(null);
          setViewMode("view");
          setShowEmailInput(false);
          setNewEmail("");
        }}
        className={`bg-white p-6 w-full mx-4 sm:mx-auto mt-20 rounded-lg shadow-xl overflow-y-auto ${
          viewMode === "view"
            ? "max-w-4xl max-h-[85vh]"
            : viewMode === "roles"
            ? "max-w-2xl max-h-[95vh]" // MÁS ALTURA AQUÍ
            : "max-w-3xl max-h-[90vh]"
        }`}
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {isLoading ? (
          <SpinnerOverlay>
            <div className="flex flex-col items-center">
              <Spinner />
              <p className="mt-4 text-white text-lg">Procesando...</p>
            </div>
          </SpinnerOverlay>
        ) : selectedPerson && editingPerson ? (
          <div className="relative">
            <button
              onClick={() => {
                setSelectedPerson(null);
                setEditingPerson(null);
                setNewPhoto(null);
                setViewMode("view");
                setShowEmailInput(false);
                setNewEmail("");
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {viewMode === "view" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 col-span-3">
                  Visualizar Persona
                </h2>
                <div className="col-span-1 flex justify-center">
                  <img
                    src={
                      selectedPerson.basicInfo.FOTO
                        ? `data:image/${selectedPerson.basicInfo.FORMATO};base64,${selectedPerson.basicInfo.FOTO}`
                        : getDefaultPhoto(selectedPerson.basicInfo.SEXO)
                    }
                    alt="Foto de perfil"
                    className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow-md"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultPhoto(
                        selectedPerson.basicInfo.SEXO
                      );
                    }}
                  />
                </div>
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nombres
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.NOMBRES}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Apellidos
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.APELLIDOS}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      DNI
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.DNI}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Correo
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.CORREO || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Celular
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.CELULAR || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contacto de Emergencia
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.CONTACTO_EMERGENCIA || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Fecha de Nacimiento
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {formatDate(selectedPerson.basicInfo.FECHA_NACIMIENTO)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Sexo
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.SEXO}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Perfil
                    </label>
                    <p className="p-3 bg-gray-100 rounded-lg text-gray-800">
                      {selectedPerson.basicInfo.DETALLE_PERFIL}
                    </p>
                  </div>
                </div>
                {selectedPerson.residentInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Información de Residente
                    </h2>
                    {selectedPerson.residentInfo.map((info, index) => (
                      <div
                        key={index}
                        className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm"
                      >
                        <p>
                          <strong>Departamento:</strong> Nº {info.NRO_DPTO}
                        </p>
                        <p>
                          <strong>Fase:</strong> {info.FASE}
                        </p>
                        <p>
                          <strong>Clasificación:</strong>{" "}
                          {info.DETALLE_CLASIFICACION}
                        </p>
                        <p>
                          <strong>Inicio de Residencia:</strong>{" "}
                          {formatDate(info.INICIO_RESIDENCIA)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPerson.workerInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Información de Trabajador
                    </h2>
                    {selectedPerson.workerInfo.map((info, index) => (
                      <div
                        key={index}
                        className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm"
                      >
                        <p>
                          <strong>Fase:</strong> {info.FASE}
                        </p>
                        <p>
                          <strong>Fecha de Asignación:</strong>{" "}
                          {info.FECHA_ASIGNACION}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {selectedPerson.basicInfo.ACCESO_SISTEMA && (
                  <div className="col-span-3 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Información de Acceso
                    </h2>
                    <p>
                      <strong>Usuario:</strong>{" "}
                      {selectedPerson.basicInfo.USUARIO || "N/A"}
                    </p>
                    <p>
                      <strong>Roles:</strong>{" "}
                      {selectedPerson.roles
                        .map((r) => r.DETALLE_USUARIO)
                        .join(", ") || "N/A"}
                    </p>
                  </div>
                )}
              </div>
            )}
            {viewMode === "edit" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 col-span-3">
                  Editar Persona
                </h2>
                <div className="col-span-1 flex flex-col items-center">
                  <img
                    src={
                      newPhoto
                        ? URL.createObjectURL(newPhoto)
                        : editingPerson.basicInfo.FOTO
                        ? `data:image/${editingPerson.basicInfo.FORMATO};base64,${editingPerson.basicInfo.FOTO}`
                        : getDefaultPhoto(editingPerson.basicInfo.SEXO)
                    }
                    alt="Foto de perfil"
                    className="w-40 h-40 rounded-full object-cover border-4 border-blue-200 shadow-md mb-4"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultPhoto(
                        editingPerson.basicInfo.SEXO
                      );
                    }}
                  />
                  <label className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    <FaCamera />
                    <span>Cambiar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nombres
                    </label>
                    <input
                      type="text"
                      value={editingPerson.basicInfo.NOMBRES}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            NOMBRES: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Apellidos
                    </label>
                    <input
                      type="text"
                      value={editingPerson.basicInfo.APELLIDOS}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            APELLIDOS: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      DNI
                    </label>
                    <input
                      type="text"
                      value={editingPerson.basicInfo.DNI}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            DNI: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Correo
                    </label>
                    <input
                      type="email"
                      value={editingPerson.basicInfo.CORREO}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            CORREO: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Celular
                    </label>
                    <input
                      type="text"
                      value={editingPerson.basicInfo.CELULAR}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            CELULAR: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contacto de Emergencia
                    </label>
                    <input
                      type="text"
                      value={editingPerson.basicInfo.CONTACTO_EMERGENCIA}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            CONTACTO_EMERGENCIA: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={formatDateForInput(
                        editingPerson.basicInfo.FECHA_NACIMIENTO
                      )}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            FECHA_NACIMIENTO: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Sexo
                    </label>
                    <select
                      value={editingPerson.basicInfo.ID_SEXO}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            ID_SEXO: Number(e.target.value),
                            SEXO:
                              sexes.find(
                                (s) => s.ID_SEXO === Number(e.target.value)
                              )?.DESCRIPCION || "",
                          },
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {sexes.map((sex) => (
                        <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                          {sex.DESCRIPCION}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Perfil
                    </label>
                    <select
                      value={editingPerson.basicInfo.ID_PERFIL}
                      onChange={(e) => {
                        const newPerfilId = Number(e.target.value);
                        const newPerfil =
                          perfiles.find((p) => p.ID_PERFIL === newPerfilId)
                            ?.DETALLE_PERFIL || "";
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            ID_PERFIL: newPerfilId,
                            DETALLE_PERFIL: newPerfil,
                          },
                          residentInfo:
                            newPerfilId === 1 ? editingPerson.residentInfo : [], // Residente
                          workerInfo:
                            newPerfilId !== 1 ? editingPerson.workerInfo : [], // No Residente
                        });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {perfiles.map((perfil) => (
                        <option key={perfil.ID_PERFIL} value={perfil.ID_PERFIL}>
                          {perfil.DETALLE_PERFIL}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {editingPerson.residentInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Información de Residente
                    </h2>

                    {editingPerson.residentInfo.map((info, index) => {
                      // Filtrar departamentos según la fase seleccionada en esta fila
                      const departamentosFiltrados = departamentos.filter(
                        (d) =>
                          fases.find((f) => f.NOMBRE === info.FASE)?.ID_FASE ===
                          d.ID_FASE
                      );

                      return (
                        <div
                          key={index}
                          className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 relative"
                        >
                          {/* Botón Eliminar */}
                          {editingPerson.residentInfo.length > 1 && (
                            <button
                              onClick={() => {
                                const newResidentInfo =
                                  editingPerson.residentInfo.filter(
                                    (_, i) => i !== index
                                  );
                                setEditingPerson({
                                  ...editingPerson,
                                  residentInfo: newResidentInfo,
                                });
                              }}
                              className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                              title="Eliminar Departamento"
                            >
                              <FaTrash size={18} />
                            </button>
                          )}

                          {/* Fase */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Fase
                            </label>
                            <select
                              value={
                                fases.find((f) => f.NOMBRE === info.FASE)
                                  ?.ID_FASE || ""
                              }
                              onChange={(e) => {
                                const faseId = Number(e.target.value);
                                const faseNombre =
                                  fases.find((f) => f.ID_FASE === faseId)
                                    ?.NOMBRE || "";

                                const departamentosFiltrados =
                                  departamentos.filter(
                                    (d) => d.ID_FASE === faseId
                                  );

                                const newResidentInfo = [
                                  ...editingPerson.residentInfo,
                                ];
                                newResidentInfo[index] = {
                                  ...info,
                                  FASE: faseNombre,
                                  ID_DEPARTAMENTO:
                                    departamentosFiltrados[0]
                                      ?.ID_DEPARTAMENTO || 0,
                                  NRO_DPTO:
                                    departamentosFiltrados[0]?.NRO_DPTO || 0,
                                  DEPARTAMENTO_DESCRIPCION:
                                    departamentosFiltrados[0]?.DESCRIPCION ||
                                    "",
                                };
                                setEditingPerson({
                                  ...editingPerson,
                                  residentInfo: newResidentInfo,
                                });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Seleccione una fase</option>
                              {fases.map((fase) => (
                                <option key={fase.ID_FASE} value={fase.ID_FASE}>
                                  {fase.NOMBRE}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Departamento (filtrado por fase) */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Departamento
                            </label>
                            <select
                              value={info.ID_DEPARTAMENTO}
                              onChange={(e) => {
                                const selectedDpto = departamentos.find(
                                  (d) =>
                                    d.ID_DEPARTAMENTO === Number(e.target.value)
                                );

                                const newResidentInfo = [
                                  ...editingPerson.residentInfo,
                                ];
                                newResidentInfo[index] = {
                                  ...info,
                                  ID_DEPARTAMENTO: Number(e.target.value),
                                  DEPARTAMENTO_DESCRIPCION:
                                    selectedDpto?.DESCRIPCION || "",
                                  NRO_DPTO: selectedDpto?.NRO_DPTO || 0,
                                };
                                setEditingPerson({
                                  ...editingPerson,
                                  residentInfo: newResidentInfo,
                                });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">
                                Seleccione un departamento
                              </option>
                              {departamentosFiltrados.map((dpto) => (
                                <option
                                  key={dpto.ID_DEPARTAMENTO}
                                  value={dpto.ID_DEPARTAMENTO}
                                >
                                  Nº {dpto.NRO_DPTO}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Clasificación */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Clasificación
                            </label>
                            <select
                              value={info.ID_CLASIFICACION}
                              onChange={(e) => {
                                const selectedClasificacion =
                                  tiposResidente.find(
                                    (t) =>
                                      t.ID_CLASIFICACION ===
                                      Number(e.target.value)
                                  );
                                const newResidentInfo = [
                                  ...editingPerson.residentInfo,
                                ];
                                newResidentInfo[index] = {
                                  ...info,
                                  ID_CLASIFICACION: Number(e.target.value),
                                  DETALLE_CLASIFICACION:
                                    selectedClasificacion?.DETALLE_CLASIFICACION ||
                                    "",
                                };
                                setEditingPerson({
                                  ...editingPerson,
                                  residentInfo: newResidentInfo,
                                });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
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

                          {/* Inicio de Residencia */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Inicio de Residencia
                            </label>
                            <input
                              type="date"
                              value={formatLocalDateForInput(
                                info.INICIO_RESIDENCIA
                              )}
                              onChange={(e) => {
                                const newResidentInfo = [
                                  ...editingPerson.residentInfo,
                                ];
                                newResidentInfo[index] = {
                                  ...info,
                                  INICIO_RESIDENCIA: e.target.value,
                                };
                                setEditingPerson({
                                  ...editingPerson,
                                  residentInfo: newResidentInfo,
                                });
                              }}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      );
                    })}

                    {/* Botón Agregar */}
                    <button
                      onClick={() => {
                        const defaultFase = fases[0];
                        const dptosDeFase = departamentos.filter(
                          (d) => d.ID_FASE === defaultFase?.ID_FASE
                        );
                        const defaultDpto = dptosDeFase[0];

                        setEditingPerson({
                          ...editingPerson,
                          residentInfo: [
                            ...editingPerson.residentInfo,
                            {
                              ID_RESIDENTE: 0,
                              FASE: defaultFase?.NOMBRE || "",
                              ID_DEPARTAMENTO:
                                defaultDpto?.ID_DEPARTAMENTO || 0,
                              DEPARTAMENTO_DESCRIPCION:
                                defaultDpto?.DESCRIPCION || "",
                              NRO_DPTO: defaultDpto?.NRO_DPTO || 0,
                              ID_CLASIFICACION:
                                tiposResidente[0]?.ID_CLASIFICACION || 0,
                              DETALLE_CLASIFICACION:
                                tiposResidente[0]?.DETALLE_CLASIFICACION || "",
                              INICIO_RESIDENCIA: new Date()
                                .toISOString()
                                .split("T")[0],
                            },
                          ],
                        });
                      }}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Agregar Departamento
                    </button>
                  </div>
                )}

                {editingPerson.workerInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                      Información de Trabajador
                    </h2>

                    {editingPerson.workerInfo.map((info, index) => (
                      <div
                        key={index}
                        className="mb-4 p-4 bg-gray-50 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 relative"
                      >
                        {/* Botón Eliminar */}
                        {editingPerson.workerInfo.length > 1 && (
                          <button
                            onClick={() => {
                              if (editingPerson.workerInfo.length <= 1) {
                                Swal.fire({
                                  icon: "error",
                                  title: "Error",
                                  text: "Debe haber al menos una fase asignada",
                                });
                                return;
                              }
                              const newWorkerInfo =
                                editingPerson.workerInfo.filter(
                                  (_, i) => i !== index
                                );
                              setEditingPerson({
                                ...editingPerson,
                                workerInfo: newWorkerInfo,
                              });
                            }}
                            className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                            title="Eliminar Fase"
                          >
                            <FaTrash size={18} />
                          </button>
                        )}

                        {/* Fase */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">
                            Fase
                          </label>
                          <select
                            value={info.ID_FASE}
                            onChange={(e) => {
                              const newWorkerInfo = [
                                ...editingPerson.workerInfo,
                              ];
                              const selectedFase = fases.find(
                                (f) => f.ID_FASE === Number(e.target.value)
                              );
                              newWorkerInfo[index] = {
                                ...info,
                                ID_FASE: Number(e.target.value),
                                FASE: selectedFase?.NOMBRE || "",
                              };
                              setEditingPerson({
                                ...editingPerson,
                                workerInfo: newWorkerInfo,
                              });
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {fases.map((fase) => (
                              <option key={fase.ID_FASE} value={fase.ID_FASE}>
                                {fase.NOMBRE}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Fecha de Asignación */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700">
                            Fecha de Asignación
                          </label>
                          <input
                            type="date"
                            value={formatDateForInput(info.FECHA_ASIGNACION)}
                            onChange={(e) => {
                              const newWorkerInfo = [
                                ...editingPerson.workerInfo,
                              ];
                              newWorkerInfo[index] = {
                                ...info,
                                FECHA_ASIGNACION: e.target.value,
                              };
                              setEditingPerson({
                                ...editingPerson,
                                workerInfo: newWorkerInfo,
                              });
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Botón Agregar Fase */}
                    <button
                      onClick={() => {
                        const defaultFase = fases[0] || {
                          ID_FASE: 0,
                          NOMBRE: "",
                        };
                        setEditingPerson({
                          ...editingPerson,
                          workerInfo: [
                            ...editingPerson.workerInfo,
                            {
                              ID_FASE: defaultFase.ID_FASE,
                              FASE: defaultFase.NOMBRE,
                              FECHA_ASIGNACION: new Date()
                                .toISOString()
                                .split("T")[0],
                            },
                          ],
                        });
                      }}
                      className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Agregar Fase
                    </button>
                  </div>
                )}
                <div className="col-span-3 flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => {
                      setSelectedPerson(null);
                      setEditingPerson(null);
                      setNewPhoto(null);
                      setViewMode("view");
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdatePerson}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
            {viewMode === "roles" && (
              <div className="flex flex-col space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Gestionar Acceso al Sistema
                </h2>
                <div className="text-gray-800 space-y-1">
                  <p>
                    <strong>Nombre:</strong> {editingPerson.basicInfo.NOMBRES}{" "}
                    {editingPerson.basicInfo.APELLIDOS}
                  </p>
                  <p>
                    <strong>DNI:</strong> {editingPerson.basicInfo.DNI}
                  </p>
                  <p>
                    <strong>Usuario:</strong>{" "}
                    {editingPerson.basicInfo.USUARIO ||
                      "(a generar al activar acceso)"}
                  </p>
                </div>

                {showEmailInput && (
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Correo Electrónico
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Ingrese el correo"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleUpdateEmail}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                      >
                        Guardar Correo
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700">
                    Roles
                  </label>
                  <Select
                    isMulti
                    options={roleOptions}
                    value={roleOptions.filter((option) =>
                      editingPerson.roles.some(
                        (role) => role.ID_ROL === option.value
                      )
                    )}
                    onChange={(selected) =>
                      setEditingPerson({
                        ...editingPerson,
                        roles: selected.map((option) => ({
                          ID_ROL: option.value,
                          DETALLE_USUARIO: option.label,
                        })),
                      })
                    }
                    placeholder={
                      roles.length ? "Seleccione roles..." : "Cargando roles..."
                    }
                    className="basic-multi-select"
                    classNamePrefix="select"
                    isDisabled={!roles.length}
                    menuPortalTarget={document.body} // PARA SACARLO DEL FLUJO DEL MODAL
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    }}
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                  {!editingPerson.basicInfo.ACCESO_SISTEMA ? (
                    <button
                      onClick={() => handleManageAccess(editingPerson, true)}
                      disabled={isLoading || showEmailInput}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300 flex items-center space-x-2"
                    >
                      <FaCheckCircle />
                      <span>Activar Acceso</span>
                    </button>
                  ) : (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleManageAccess(editingPerson, false)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 flex items-center space-x-2"
                      >
                        <FaLock />
                        <span>Desactivar Acceso</span>
                      </button>
                      {editingPerson.basicInfo.ID_USUARIO && (
                        <button
                          onClick={() =>
                            handleResetPassword(
                              editingPerson.basicInfo.ID_USUARIO!
                            )
                          }
                          disabled={isLoading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:bg-yellow-300 flex items-center space-x-2"
                        >
                          <FaLock />
                          <span>Restablecer Contraseña</span>
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setSelectedPerson(null);
                        setEditingPerson(null);
                        setViewMode("view");
                        setShowEmailInput(false);
                        setNewEmail("");
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleManageRoles}
                      disabled={isLoading || showEmailInput}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                    >
                      Guardar Roles
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default UserList;
