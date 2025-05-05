import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import Select from "react-select";
import Swal from "sweetalert2";
import Switch from "react-switch";
import { Buffer } from "buffer";
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaUserShield,
  FaCheckCircle,
  FaLock,
  FaCamera,
  FaUserPlus,
} from "react-icons/fa";
import {
  Container,
  Title,
  Card,
  TableContainer,
  SpinnerOverlay,
  Spinner,
  SpinnerText,
  ModalContent,
  CloseButton,
  ProfileImage,
  InfoGrid,
  InfoItem,
  SectionTitle,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  WarningButton,
  SearchContainer,
  SwitchContainer,
  Input,
  Select as StyledSelect,
} from "../Styles/UserListStyles";

const API_URL = import.meta.env.VITE_API_URL;

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
  ESTADO: number;
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
  const [showActive, setShowActive] = useState(true);
  const [searchField, setSearchField] = useState<
    keyof Person | "FASE_AND_DEPARTAMENTO"
  >("NOMBRES");
  const [searchValue, setSearchValue] = useState("");
  const [selectedFase, setSelectedFase] = useState("");
  const [departamentoNumber, setDepartamentoNumber] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedFaseId, setSelectedFaseId] = useState<number | null>(null);

  const [loadingActions, setLoadingActions] = useState<{
    [key: number]: "view" | "edit" | "delete" | "activate" | "roles" | null;
  }>({});

  const currentRoles = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("roles") || "[]");
    } catch {
      return [];
    }
  }, []);

  const hasAccess = (requiredRoles: string[]) => {
    return currentRoles.some((role: string) => requiredRoles.includes(role));
  };

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
    setLoadingAction(id, mode);
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
      setLoadingAction(id, null);
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
        setLoadingAction(id, "delete");
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
        } finally {
          setLoadingAction(id, null);
        }
      }
    });
  };

  const resizeImage = (
    file: File,
    maxWidth = 600,
    quality = 0.7
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) return reject("No se pudo leer el archivo");
        img.src = e.target.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No se pudo crear el contexto");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpdatePerson = async () => {
    if (!editingPerson) return;
    try {
      setIsLoading(true);
      let photoData = null;
      if (newPhoto) {
        if (newPhoto.size > 3 * 1024 * 1024) {
          Swal.fire({
            icon: "warning",
            title: "Imagen muy grande",
            text: "La imagen supera los 3MB. Se intentará comprimir automáticamente.",
          });
        }
        try {
          const resizedBase64 = await resizeImage(newPhoto);
          photoData = {
            foto: resizedBase64.split(",")[1],
            formato: "jpg",
          };
        } catch (resizeError) {
          console.error("Error al redimensionar imagen:", resizeError);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo procesar la imagen seleccionada.",
          });
          return;
        }
      }
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
        workerInfo: editingPerson.workerInfo.map((w) => w.ID_FASE),
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
        console.error("Detalle del error al actualizar persona:", errorData);
        throw new Error(
          errorData.message ||
            `Error ${response.status}: ${response.statusText}`
        );
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
    } catch (error: any) {
      console.error("Error al actualizar persona:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message.includes("correo")
          ? "El correo ya está registrado"
          : error.message.includes("DNI")
          ? "El DNI ya está registrado"
          : error.message,
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
    return `${nombre}${apellido}`.slice(0, 15);
  };

  const handleManageAccess = async (
    person: PersonWithRoles,
    activar: boolean
  ) => {
    if (!person) return;
    setIsLoading(true);
    const { ID_PERSONA, NOMBRES, APELLIDOS, CORREO } = person.basicInfo;
    const rolesSeleccionados = person.roles.map((r) => r.ID_ROL);
    if (activar) {
      if (!CORREO || rolesSeleccionados.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Faltan datos",
          text: "Debe ingresar un correo válido y asignar al menos un rol.",
        });
        setIsLoading(false);
        return;
      }
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
      if (person.ESTADO === 0 && showActive) return false;
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
    const [year, month, day] = dateString.split("T")[0].split("-");
    if (!year || !month || !day) return "N/A";
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const formatInicioResidenciaInputEdit = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${year}-${month}-${day}`;
  };

  const filteredDepartamentos = selectedFaseId
    ? departamentos.filter((dpto) => dpto.ID_FASE === selectedFaseId)
    : departamentos;

  const checkUsername = async (username: string): Promise<boolean> => {
    const res = await fetch(
      `${API_URL}/check-username?username=${encodeURIComponent(username)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await res.json();
    return data.exists;
  };

  const handleActivatePerson = async (id: number) => {
    Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción reactivará a la persona.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Activar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingAction(id, "activate");
        try {
          const response = await fetch(`${API_URL}/persons/${id}/activate`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Error al activar la persona");
          setPersons(persons.filter((person) => person.ID_PERSONA !== id));
          Swal.fire({
            icon: "success",
            title: "Activado",
            text: "Persona activada correctamente",
            timer: 2000,
            showConfirmButton: false,
          });
        } catch (error) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo activar la persona",
          });
        } finally {
          setLoadingAction(id, null);
        }
      }
    });
  };

  const setLoadingAction = (
    id: number,
    action: "view" | "edit" | "delete" | "activate" | "roles" | null
  ) => {
    setLoadingActions((prev) => ({
      ...prev,
      [id]: action,
    }));
  };

  useEffect(() => {
    fetchPersons();
    fetchSexes();
    fetchPerfiles();
    fetchDepartamentos();
    fetchFases();
    fetchTiposResidente();
    fetchRoles();
  }, [showActive]);

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
    <Container>
      <Title>Gestión de Personas</Title>
      {message && (
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
      <SearchContainer>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <StyledSelect
            value={searchField}
            onChange={(e) =>
              setSearchField(
                e.target.value as keyof Person | "FASE_AND_DEPARTAMENTO"
              )
            }
          >
            <option value="NOMBRES">Nombres</option>
            <option value="DNI">DNI</option>
            <option value="CORREO">Correo</option>
            <option value="FASE_AND_DEPARTAMENTO">Fase y Departamento</option>
          </StyledSelect>
          {searchField === "FASE_AND_DEPARTAMENTO" ? (
            <div className="fase-departamento-search flex flex-col sm:flex-row gap-2">
              <StyledSelect
                value={selectedFase}
                onChange={(e) => {
                  setSelectedFase(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Seleccione una fase</option>
                {fases.map((fase) => (
                  <option key={fase.ID_FASE} value={fase.NOMBRE}>
                    {fase.NOMBRE}
                  </option>
                ))}
              </StyledSelect>
              <Input
                type="text"
                placeholder="Nº Departamento"
                value={departamentoNumber}
                onChange={(e) => {
                  setDepartamentoNumber(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <PrimaryButton
                onClick={() => setCurrentPage(1)}
                className="small-button"
              >
                Buscar
              </PrimaryButton>
            </div>
          ) : (
            <Input
              type="text"
              placeholder="Buscar..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
        <SwitchContainer>
          <span>Mostrar {showActive ? "Activos" : "Inactivos"}</span>
          <Switch
            onChange={() => {
              setShowActive(!showActive);
              setCurrentPage(1);
            }}
            checked={showActive}
            onColor="#2563EB"
            offColor="#EF4444"
          />
          {hasAccess(["Sistemas", "Administrador"]) && (
            <PrimaryButton
              onClick={() => navigate("/users")}
              className="small-button ml-2"
              title="Registrar nueva persona"
            >
              <FaUserPlus className="mr-1" /> Registrar
            </PrimaryButton>
          )}
        </SwitchContainer>
      </SearchContainer>
      <TableContainer>
        <table className="min-w-full">
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
                  } hover:bg-blue-100`}
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
                  <td className="py-3 px-4 flex space-x-3">
                    {hasAccess(["Seguridad", "Sistemas", "Administrador"]) && (
                      <button
                        onClick={() => {
                          setViewMode("view");
                          fetchPersonDetails(person.ID_PERSONA, "view");
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors relative"
                        title="Visualizar"
                        disabled={!!loadingActions[person.ID_PERSONA]}
                      >
                        {loadingActions[person.ID_PERSONA] === "view" ? (
                          <div className="w-5 h-5 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin" />
                        ) : (
                          <FaEye size={20} />
                        )}
                      </button>
                    )}
                    {hasAccess(["Sistemas", "Administrador"]) && (
                      <>
                        <button
                          onClick={() => {
                            setViewMode("edit");
                            fetchPersonDetails(person.ID_PERSONA, "edit");
                          }}
                          className="text-green-600 hover:text-green-800 transition-colors relative"
                          title="Editar"
                          disabled={!!loadingActions[person.ID_PERSONA]}
                        >
                          {loadingActions[person.ID_PERSONA] === "edit" ? (
                            <div className="w-5 h-5 border-2 border-t-green-600 border-gray-200 rounded-full animate-spin" />
                          ) : (
                            <FaEdit size={20} />
                          )}
                        </button>
                        {showActive ? (
                          <button
                            onClick={() =>
                              handleDeletePerson(person.ID_PERSONA)
                            }
                            className="text-red-600 hover:text-red-800 transition-colors relative"
                            title="Eliminar"
                            disabled={!!loadingActions[person.ID_PERSONA]}
                          >
                            {loadingActions[person.ID_PERSONA] === "delete" ? (
                              <div className="w-5 h-5 border-2 border-t-red-600 border-gray-200 rounded-full animate-spin" />
                            ) : (
                              <FaTrash size={20} />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleActivatePerson(person.ID_PERSONA)
                            }
                            className="text-green-600 hover:text-green-800 transition-colors relative"
                            title="Activar"
                            disabled={!!loadingActions[person.ID_PERSONA]}
                          >
                            {loadingActions[person.ID_PERSONA] ===
                            "activate" ? (
                              <div className="w-5 h-5 border-2 border-t-green-600 border-gray-200 rounded-full animate-spin" />
                            ) : (
                              <FaCheckCircle size={20} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setViewMode("roles");
                            setShowEmailInput(false);
                            fetchPersonDetails(person.ID_PERSONA, "roles");
                          }}
                          className="text-purple-600 hover:text-purple-800 transition-colors relative"
                          title="Gestionar Acceso"
                          disabled={!!loadingActions[person.ID_PERSONA]}
                        >
                          {loadingActions[person.ID_PERSONA] === "roles" ? (
                            <div className="w-5 h-5 border-2 border-t-purple-600 border-gray-200 rounded-full animate-spin" />
                          ) : (
                            <FaUserShield size={20} />
                          )}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableContainer>
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <PrimaryButton
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </PrimaryButton>
          <span className="px-4 py-2 text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <PrimaryButton
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Siguiente
          </PrimaryButton>
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
        className="mx-4 sm:mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {isLoading ? (
          <SpinnerOverlay>
            <Spinner />
            <SpinnerText>Procesando...</SpinnerText>
          </SpinnerOverlay>
        ) : selectedPerson && editingPerson ? (
          <ModalContent mode={viewMode}>
            <CloseButton
              onClick={() => {
                setSelectedPerson(null);
                setEditingPerson(null);
                setNewPhoto(null);
                setViewMode("view");
                setShowEmailInput(false);
                setNewEmail("");
              }}
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
            </CloseButton>
            {viewMode === "view" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SectionTitle className="col-span-3">
                  Visualizar Persona
                </SectionTitle>
                <div className="flex justify-center">
                  <ProfileImage
                    src={
                      selectedPerson.basicInfo.FOTO
                        ? `data:image/${selectedPerson.basicInfo.FORMATO};base64,${selectedPerson.basicInfo.FOTO}`
                        : getDefaultPhoto(selectedPerson.basicInfo.SEXO)
                    }
                    alt="Foto de perfil"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultPhoto(
                        selectedPerson.basicInfo.SEXO
                      );
                    }}
                  />
                </div>
                <InfoGrid className="col-span-2">
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nombres
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.NOMBRES}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Apellidos
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.APELLIDOS}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      DNI
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.DNI}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Correo
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.CORREO || "N/A"}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Celular
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.CELULAR || "N/A"}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contacto de Emergencia
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.CONTACTO_EMERGENCIA || "N/A"}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Fecha de Nacimiento
                    </label>
                    <p className="mt-1 text-gray-800">
                      {formatDate(selectedPerson.basicInfo.FECHA_NACIMIENTO)}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Sexo
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.SEXO}
                    </p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">
                      Perfil
                    </label>
                    <p className="mt-1 text-gray-800">
                      {selectedPerson.basicInfo.DETALLE_PERFIL}
                    </p>
                  </InfoItem>
                </InfoGrid>
                {selectedPerson.residentInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <SectionTitle>Información de Residente</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPerson.residentInfo.map((info, index) => (
                        <Card key={index}>
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
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPerson.workerInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <SectionTitle>Información de Trabajador</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedPerson.workerInfo.map((info, index) => (
                        <Card key={index}>
                          <p>
                            <strong>Fase:</strong> {info.FASE}
                          </p>
                          <p>
                            <strong>Fecha de Asignación:</strong>{" "}
                            {formatDate(info.FECHA_ASIGNACION)}
                          </p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPerson.basicInfo.ACCESO_SISTEMA && (
                  <div className="col-span-3 mt-6">
                    <SectionTitle>Información de Acceso</SectionTitle>
                    <Card>
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
                    </Card>
                  </div>
                )}
              </div>
            )}
            {viewMode === "edit" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SectionTitle className="col-span-3">
                  Editar Persona
                </SectionTitle>
                <div className="flex flex-col items-center">
                  <ProfileImage
                    src={
                      newPhoto
                        ? URL.createObjectURL(newPhoto)
                        : editingPerson.basicInfo.FOTO
                        ? `data:image/${editingPerson.basicInfo.FORMATO};base64,${editingPerson.basicInfo.FOTO}`
                        : getDefaultPhoto(editingPerson.basicInfo.SEXO)
                    }
                    alt="Foto de perfil"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultPhoto(
                        editingPerson.basicInfo.SEXO
                      );
                    }}
                  />
                  <label className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    <FaCamera />
                    <span>Cambiar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewPhoto(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={async () => {
                      const confirm = await Swal.fire({
                        title: "¿Eliminar foto?",
                        text: "Esta acción eliminará la foto actual.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Sí, eliminar",
                        cancelButtonText: "Cancelar",
                      });
                      if (confirm.isConfirmed) {
                        try {
                          await fetch(
                            `${API_URL}/persons/${editingPerson.basicInfo.ID_PERSONA}/photo`,
                            {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          setEditingPerson({
                            ...editingPerson,
                            basicInfo: {
                              ...editingPerson.basicInfo,
                              FOTO: null,
                              FORMATO: null,
                            },
                          });
                          Swal.fire(
                            "Eliminada",
                            "La foto fue eliminada",
                            "success"
                          );
                        } catch (error) {
                          Swal.fire(
                            "Error",
                            "No se pudo eliminar la foto",
                            "error"
                          );
                        }
                      }
                    }}
                    className="mt-2 text-red-500 hover:text-red-700 underline"
                  >
                    Eliminar Foto
                  </button>
                </div>
                <InfoGrid className="col-span-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Nombres
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Apellidos
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      DNI
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Correo
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Celular
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Contacto de Emergencia
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Fecha de Nacimiento
                    </label>
                    <Input
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Sexo
                    </label>
                    <StyledSelect
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
                    >
                      {sexes.map((sex) => (
                        <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                          {sex.DESCRIPCION}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">
                      Perfil
                    </label>
                    <StyledSelect
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
                            newPerfilId === 1 ? editingPerson.residentInfo : [],
                          workerInfo:
                            newPerfilId !== 1 ? editingPerson.workerInfo : [],
                        });
                      }}
                    >
                      {perfiles.map((perfil) => (
                        <option key={perfil.ID_PERFIL} value={perfil.ID_PERFIL}>
                          {perfil.DETALLE_PERFIL}
                        </option>
                      ))}
                    </StyledSelect>
                  </div>
                </InfoGrid>
                {editingPerson.residentInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <SectionTitle>Información de Residente</SectionTitle>
                    {editingPerson.residentInfo.map((info, index) => {
                      const departamentosFiltrados = departamentos.filter(
                        (d) =>
                          fases.find((f) => f.NOMBRE === info.FASE)?.ID_FASE ===
                          d.ID_FASE
                      );
                      return (
                        <Card key={index} className="relative">
                          {editingPerson.residentInfo.length > 1 && (
                            <button
                              onClick={async () => {
                                const confirm = await Swal.fire({
                                  title: "¿Eliminar departamento?",
                                  text: "Esta acción no se puede deshacer.",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonText: "Eliminar",
                                  cancelButtonText: "Cancelar",
                                });
                                if (confirm.isConfirmed) {
                                  const newResidentInfo =
                                    editingPerson.residentInfo.filter(
                                      (_, i) => i !== index
                                    );
                                  setEditingPerson({
                                    ...editingPerson,
                                    residentInfo: newResidentInfo,
                                  });
                                  Swal.fire({
                                    icon: "success",
                                    title: "Eliminado",
                                    text: "Departamento eliminado correctamente",
                                    timer: 2000,
                                    showConfirmButton: false,
                                  });
                                }
                              }}
                              className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                              title="Eliminar Departamento"
                            >
                              <FaTrash size={18} />
                            </button>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">
                                Fase
                              </label>
                              <StyledSelect
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
                              >
                                <option value="">Seleccione una fase</option>
                                {fases.map((fase) => (
                                  <option
                                    key={fase.ID_FASE}
                                    value={fase.ID_FASE}
                                  >
                                    {fase.NOMBRE}
                                  </option>
                                ))}
                              </StyledSelect>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">
                                Departamento
                              </label>
                              <StyledSelect
                                value={info.ID_DEPARTAMENTO}
                                onChange={(e) => {
                                  const selectedDpto = departamentos.find(
                                    (d) =>
                                      d.ID_DEPARTAMENTO ===
                                      Number(e.target.value)
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
                              </StyledSelect>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">
                                Clasificación
                              </label>
                              <StyledSelect
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
                              >
                                {tiposResidente.map((tipo) => (
                                  <option
                                    key={tipo.ID_CLASIFICACION}
                                    value={tipo.ID_CLASIFICACION}
                                  >
                                    {tipo.DETALLE_CLASIFICACION}
                                  </option>
                                ))}
                              </StyledSelect>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700">
                                Inicio de Residencia
                              </label>
                              <Input
                                type="date"
                                value={formatInicioResidenciaInputEdit(
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
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                    <PrimaryButton
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
                      className="mt-4"
                    >
                      Agregar Departamento
                    </PrimaryButton>
                  </div>
                )}
                {editingPerson.workerInfo.length > 0 && (
                  <div className="col-span-3 mt-6">
                    <SectionTitle>Información de Trabajador</SectionTitle>
                    {editingPerson.workerInfo.map((info, index) => (
                      <Card key={index} className="relative">
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
                            className="absolute top-4 right-4 text-red-600 hover:text-red-800"
                            title="Eliminar Fase"
                          >
                            <FaTrash size={18} />
                          </button>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Fase
                            </label>
                            <StyledSelect
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
                            >
                              {fases.map((fase) => (
                                <option key={fase.ID_FASE} value={fase.ID_FASE}>
                                  {fase.NOMBRE}
                                </option>
                              ))}
                            </StyledSelect>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Fecha de Asignación
                            </label>
                            <Input
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
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    <PrimaryButton
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
                      className="mt-4"
                    >
                      Agregar Fase
                    </PrimaryButton>
                  </div>
                )}
                <div className="col-span-3 flex justify-end gap-4 mt-6">
                  <SecondaryButton
                    onClick={() => {
                      setSelectedPerson(null);
                      setEditingPerson(null);
                      setNewPhoto(null);
                      setViewMode("view");
                    }}
                  >
                    Cancelar
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleUpdatePerson}
                    disabled={isLoading}
                  >
                    Guardar
                  </PrimaryButton>
                </div>
              </div>
            )}
            {viewMode === "roles" && (
              <div className="flex flex-col gap-4">
                <SectionTitle>Gestionar Acceso al Sistema</SectionTitle>

                {/* Contenedor para Información de la Persona */}
                <Card>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Información de la Persona
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Nombre
                      </label>
                      <p className="mt-1 text-gray-800">
                        {editingPerson.basicInfo.NOMBRES}{" "}
                        {editingPerson.basicInfo.APELLIDOS}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        DNI
                      </label>
                      <p className="mt-1 text-gray-800">
                        {editingPerson.basicInfo.DNI}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Usuario
                      </label>
                      <p className="mt-1 text-gray-800">
                        {editingPerson.basicInfo.USUARIO || "No asignado"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">
                        Correo
                      </label>
                      {showEmailInput ? (
                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                          <Input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="Ingrese un correo"
                          />
                          <PrimaryButton
                            onClick={handleUpdateEmail}
                            disabled={isLoading}
                          >
                            Guardar Correo
                          </PrimaryButton>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                          <p className="text-gray-800">
                            {editingPerson.basicInfo.CORREO || "No asignado"}
                          </p>
                          {!editingPerson.basicInfo.CORREO && (
                            <WarningButton
                              onClick={() => setShowEmailInput(true)}
                            >
                              Agregar Correo
                            </WarningButton>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Contenedor para Roles */}
                <Card>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Roles
                  </h3>
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
                      onChange={(selectedOptions) => {
                        const newRoles = selectedOptions.map((option) => ({
                          ID_ROL: option.value,
                          DETALLE_USUARIO: option.label,
                        }));
                        setEditingPerson({
                          ...editingPerson,
                          roles: newRoles,
                        });
                      }}
                      placeholder="Seleccione roles..."
                      className="mt-2"
                      menuPortalTarget={document.body} // Renderiza el dropdown fuera del modal
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 10000 }), // Asegura que el dropdown esté por encima del modal
                      }}
                    />
                  </div>
                </Card>

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  {editingPerson.basicInfo.ACCESO_SISTEMA ? (
                    <>
                      <DangerButton
                        onClick={() =>
                          handleManageAccess(
                            {
                              basicInfo: editingPerson.basicInfo,
                              roles: editingPerson.roles,
                              usuario: editingPerson.basicInfo.USUARIO,
                            },
                            false
                          )
                        }
                        disabled={isLoading}
                      >
                        <FaLock className="mr-2" />
                        Desactivar Acceso
                      </DangerButton>
                      <WarningButton
                        onClick={() =>
                          handleResetPassword(
                            editingPerson.basicInfo.ID_USUARIO!
                          )
                        }
                        disabled={
                          isLoading || !editingPerson.basicInfo.ID_USUARIO
                        }
                      >
                        <FaLock className="mr-2" />
                        Restablecer Contraseña
                      </WarningButton>
                      <PrimaryButton
                        onClick={handleManageRoles}
                        disabled={isLoading}
                      >
                        Guardar Roles
                      </PrimaryButton>
                    </>
                  ) : (
                    <PrimaryButton
                      onClick={() =>
                        handleManageAccess(
                          {
                            basicInfo: editingPerson.basicInfo,
                            roles: editingPerson.roles,
                          },
                          true
                        )
                      }
                      disabled={isLoading || !editingPerson.basicInfo.CORREO}
                    >
                      <FaUserShield className="mr-2" />
                      Activar Acceso
                    </PrimaryButton>
                  )}
                  <SecondaryButton
                    onClick={() => {
                      setSelectedPerson(null);
                      setEditingPerson(null);
                      setViewMode("view");
                      setShowEmailInput(false);
                      setNewEmail("");
                    }}
                  >
                    Cancelar
                  </SecondaryButton>
                </div>
              </div>
            )}
          </ModalContent>
        ) : null}
      </Modal>
    </Container>
  );
};

export default UserList;
