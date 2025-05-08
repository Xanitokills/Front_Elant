import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import { FaChevronDown, FaSearch, FaSignOutAlt, FaBell, FaCamera, FaEdit, FaLock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import styled from "styled-components";
import Modal from "react-modal";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

const SidebarContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "sidebarOpen",
})<{ sidebarOpen: boolean }>`
  width: 16rem;
  background-color: #1a202c;
  color: #ffffff;
  height: 100vh;
  display: flex;
  flex-direction: column;
  z-index: 50;
  transition: transform 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  @media (min-width: 768px) {
    position: relative;
    transform: translateX(0);
  }
  transform: ${({ sidebarOpen }) =>
    sidebarOpen ? "translateX(0)" : "translateX(-100%)"};
`;

const FixedHeader = styled.div`
  padding: 1rem;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      #2d3748 20%,
      #2d3748 80%,
      transparent
    );
  }
`;

const ScrollableContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    width: 6px;
    background: transparent;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  &:hover::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.5);
  }
`;

const Footer = styled.div`
  padding: 1rem;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 1rem;
    right: 1rem;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      #2d3748 20%,
      #2d3748 80%,
      transparent
    );
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background-color: #2d3748;
  color: #ffffff;
  placeholder-color: #a0aec0;
  outline: none;
  transition: ring 0.2s ease;
  &:focus {
    ring: 1px solid #3b82f6;
  }
`;

const MenuList = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const MenuItem = styled.div`
  position: relative;
  margin-bottom: 1rem;
`;

const MenuButtonWrapper = styled.div`
  position: relative;
  &:hover button {
    background-color: #2d3748;
  }
`;

const MenuButton = styled.button<{ isOpen: boolean }>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease;
  background-color: ${({ isOpen }) => (isOpen ? "#4a5568" : "transparent")};
`;

const SubmenuList = styled.nav`
  position: relative;
  margin-left: 1rem;
  margin-top: 0.5rem;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
  &.open {
    max-height: 500px;
  }
`;

const SubmenuItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease, color 0.2s ease;
  &:hover {
    background-color: #2d3748;
  }
  &.active {
    background-color: #4a5568;
    color: #93c5fd;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.75rem;
  width: 100%;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #2d3748;
  }
`;

const NotificationsButton = styled.button`
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  width: 100%;
  font-size: 0.875rem;
  font-weight: 700;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #2d3748;
  }
`;

const ProfileImage = styled.img`
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
`;

// Profile Modal Styles (inlined from UserListStyles)
const Card = styled.div`
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #4a5568;
  &:hover {
    color: #2d3748;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  &: hovering
  &:hover {
    opacity: 0.9;
  }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #e2e8f0;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  outline: none;
  transition: border-color 0.2s ease;
  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SpinnerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SpinnerText = styled.p`
  color: #ffffff;
  margin-top: 0.5rem;
  font-size: 1rem;
`;

const getIconComponent = (iconName: string) => {
  const Icon = FaIcons[iconName as keyof typeof FaIcons];
  return Icon ? <Icon /> : null;
};

interface SidebarStructure {
  id: number;
  nombre: string;
  icono: string;
  url?: string;
  submenus: { id: number; nombre: string; url: string; icono: string }[];
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
    ID_SEXO: number;
    FOTO?: string;
    FORMATO?: string;
    ID_PERFIL?: string;
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
}

interface SidebarProps {
  closeSidebar: () => void;
  sidebarOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  unreadCount: number;
}

const Sidebar = ({
  closeSidebar,
  sidebarOpen,
  setNotificationsOpen,
  unreadCount,
}: SidebarProps) => {
  const { logout, userName, roles, isAuthenticated, isLoading, sidebarData } = useAuth();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarStructure, setSidebarStructure] = useState<SidebarStructure[]>([]);
  const [fotoUrl, setFotoUrl] = useState<string>("");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [editingPerson, setEditingPerson] = useState<PersonDetails | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "changePassword">("view");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [sexes, setSexes] = useState<{ ID_SEXO: number; DESCRIPCION: string }[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const token = localStorage.getItem("token");
  const personaId = localStorage.getItem("personaId");

  const toggleSection = (id: number) => {
    setOpenSections((prev) => {
      const newState: { [key: string]: boolean } = {};
      Object.keys(prev).forEach((key) => {
        newState[key] = false;
      });
      newState[id] = !prev[id];
      return newState;
    });
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const fetchFoto = async () => {
    let sexo = localStorage.getItem("sexo");
    let storedFoto = localStorage.getItem("foto");

    if (!sexo || (sexo !== "Femenino" && sexo !== "Masculino")) {
      sexo = "Masculino";
    }

    if (storedFoto && storedFoto !== "") {
      setFotoUrl(storedFoto);
      return;
    }

    if (!personaId) {
      const defaultFoto = sexo === "Femenino" ? "/images/Mujer.jpeg" : "/images/Hombree.jpeg";
      setFotoUrl(defaultFoto);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/users/foto/${personaId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.fotoBase64) {
          setFotoUrl(data.fotoBase64);
          localStorage.setItem("foto", data.fotoBase64);
        } else {
          const defaultFoto = sexo === "Femenino" ? "/images/Mujer.jpeg" : "/images/Hombree.jpeg";
          setFotoUrl(defaultFoto);
        }
      } else {
        const defaultFoto = sexo === "Femenino" ? "/images/Mujer.jpeg" : "/images/Hombree.jpeg";
        setFotoUrl(defaultFoto);
      }
    } catch (error) {
      console.error("Error cargando la foto desde el backend:", error);
      const defaultFoto = sexo === "Femenino" ? "/images/Mujer.jpeg" : "/images/Hombree.jpeg";
      setFotoUrl(defaultFoto);
    }
  };

  const fetchPersonDetails = async () => {
    if (!token || !personaId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el token o ID de persona.",
      });
      setIsProfileModalOpen(false);
      return;
    }
    setIsLoadingProfile(true);
    try {
      const response = await fetch(`${API_URL}/persons/${personaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener detalles de la persona");
      const data = await response.json();
      setPersonDetails(data);
      setEditingPerson(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la información del perfil.",
      });
      setPersonDetails(null);
    } finally {
      setIsLoadingProfile(false);
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

  const resizeImage = (file: File, maxWidth = 600, quality = 0.7): Promise<string> => {
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

  const validateFields = () => {
    if (!editingPerson) return false;
    const { basicInfo } = editingPerson;
    return (
      basicInfo.NOMBRES.trim() !== "" &&
      basicInfo.APELLIDOS.trim() !== "" &&
      basicInfo.CORREO.trim() !== "" &&
      basicInfo.CELULAR.trim() !== "" &&
      basicInfo.CONTACTO_EMERGENCIA.trim() !== "" &&
      basicInfo.FECHA_NACIMIENTO.trim() !== "" &&
      basicInfo.ID_SEXO !== 0
    );
  };

  const handleUpdatePerson = async () => {
    if (!editingPerson) return;

    if (!validateFields()) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Por favor, completa todos los campos obligatorios.",
      });
      return;
    }

    try {
      setIsLoadingProfile(true);
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
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Perfil actualizado correctamente",
        timer: 2000,
        showConfirmButton: false,
      });
      setPersonDetails((prev) => {
        if (!prev) return editingPerson;
        return {
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            ...editingPerson.basicInfo,
            FOTO: photoData ? photoData.foto : prev.basicInfo.FOTO,
            FORMATO: photoData ? photoData.formato : prev.basicInfo.FORMATO,
          },
        };
      });
      if (photoData) {
        const fotoBase64 = `data:image/jpg;base64,${photoData.foto}`;
        localStorage.setItem("foto", fotoBase64);
        setFotoUrl(fotoBase64);
      }
      setViewMode("view");
      setNewPhoto(null);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Todos los campos son obligatorios.",
        timer: 2500,
        showConfirmButton: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden.",
        timer: 2500,
        showConfirmButton: false,
      });
    }

    try {
      setIsLoadingProfile(true);
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Contraseña actualizada",
          text: "Tu contraseña fue cambiada con éxito.",
          timer: 2500,
          showConfirmButton: false,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setViewMode("view");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo actualizar la contraseña.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al conectar con el servidor.",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const getDefaultPhoto = (sexo: string) => {
    return sexo === "Masculino" ? "/images/Hombree.jpeg" : "/images/Mujer.jpeg";
  };

  useEffect(() => {
    if (sidebarData && sidebarData.length > 0) {
      const structure = sidebarData.map((menu: any) => ({
        id: menu.id,
        nombre: menu.nombre,
        icono: menu.icono,
        url: menu.url,
        submenus: menu.submenus
          ? menu.submenus
              .sort((a: any, b: any) => a.orden - b.orden)
              .map((sub: any) => ({
                id: sub.id,
                nombre: sub.nombre,
                url: sub.url,
                icono: sub.icono,
              }))
          : [],
      }));
      setSidebarStructure(structure);
    } else {
      setSidebarStructure([]);
    }
  }, [sidebarData]);

  useEffect(() => {
    fetchFoto();
  }, []);

  const handleOpenProfileModal = async () => {
    // Resetear estados para asegurar que el modal se cargue desde cero
    setPersonDetails(null);
    setEditingPerson(null);
    setSexes([]);
    setViewMode("view");
    setNewPhoto(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    const storedFoto = localStorage.getItem("foto");
    if (!fotoUrl && storedFoto) {
      setFotoUrl(storedFoto);
    }
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) {
      closeSidebar();
    }
    setIsProfileModalOpen(true);
    await fetchPersonDetails();
    await fetchSexes();
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setPersonDetails(null);
    setEditingPerson(null);
    setSexes([]);
    setViewMode("view");
    setNewPhoto(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const renderModalContent = () => {
    if (!personDetails) return null;

    return (
      <>
        <div className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
          <Card className="p-4 relative">
            <CloseButton onClick={handleCloseProfileModal}>
              <svg
                className="w-5 h-5"
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
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <SectionTitle className="col-span-1 lg:col-span-4 text-center text-gray-700 text-lg">
                  Mi Perfil
                </SectionTitle>
                <div className="flex justify-center lg:col-span-1">
                  <ProfileImage
                    src={
                      personDetails.basicInfo.FOTO
                        ? `data:image/${personDetails.basicInfo.FORMATO};base64,${personDetails.basicInfo.FOTO}`
                        : getDefaultPhoto(personDetails.basicInfo.SEXO)
                    }
                    alt="Foto de perfil"
                    onError={(e) => {
                      e.currentTarget.src = getDefaultPhoto(personDetails.basicInfo.SEXO);
                    }}
                    className="w-24 h-24 rounded-full object-cover border border-gray-300"
                  />
                </div>
                <InfoGrid className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Nombres</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.NOMBRES}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Apellidos</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.APELLIDOS}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">DNI</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.DNI}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Correo</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.CORREO || "N/A"}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Celular</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.CELULAR || "N/A"}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Contacto de Emergencia</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.CONTACTO_EMERGENCIA || "N/A"}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Fecha de Nacimiento</label>
                    <p className="mt-1 text-gray-800 text-base">{formatDate(personDetails.basicInfo.FECHA_NACIMIENTO)}</p>
                  </InfoItem>
                  <InfoItem>
                    <label className="block text-sm font-semibold text-gray-700">Sexo</label>
                    <p className="mt-1 text-gray-800 text-base">{personDetails.basicInfo.SEXO}</p>
                  </InfoItem>
                </InfoGrid>
                <div className="col-span-1 lg:col-span-4 flex justify-end gap-4 mt-4">
                  <PrimaryButton onClick={() => setViewMode("edit")} className="bg-blue-600 text-white text-base py-2 px-4">
                    <FaEdit className="mr-2" />
                    Editar Perfil
                  </PrimaryButton>
                  <PrimaryButton onClick={() => setViewMode("changePassword")} className="bg-green-600 text-white text-base py-2 px-4">
                    <FaLock className="mr-2" />
                    Cambiar Contraseña
                  </PrimaryButton>
                </div>
                {(personDetails.residentInfo.length > 0 || personDetails.workerInfo.length > 0) && (
                  <div className="col-span-1 lg:col-span-4 mt-4">
                    <SectionTitle className="text-gray-700 text-lg">Información Adicional</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {personDetails.residentInfo.map((info, index) => (
                        <Card key={index} className="p-2 text-sm bg-gray-50">
                          <p><strong>Dept.:</strong> Nº {info.NRO_DPTO}</p>
                          <p><strong>Fase:</strong> {info.FASE}</p>
                        </Card>
                      ))}
                      {personDetails.workerInfo.map((info, index) => (
                        <Card key={index} className="p-2 text-sm bg-gray-50">
                          <p><strong>Fase:</strong> {info.FASE}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {viewMode === "edit" && editingPerson && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <SectionTitle className="col-span-1 lg:col-span-4 text-center text-gray-700 text-lg">
                  Editar Perfil
                </SectionTitle>
                <div className="flex flex-col items-center lg:col-span-1">
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
                      e.currentTarget.src = getDefaultPhoto(editingPerson.basicInfo.SEXO);
                    }}
                    className="w-24 h-24 rounded-full object-cover border border-gray-300"
                  />
                  <label className="mt-2 flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm">
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
                <InfoGrid className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Nombres *</label>
                    <Input
                      type="text"
                      value={editingPerson.basicInfo.NOMBRES}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: { ...editingPerson.basicInfo, NOMBRES: e.target.value },
                        })
                      }
                      className="text-base p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Apellidos *</label>
                    <Input
                      type="text"
                      value={editingPerson.basicInfo.APELLIDOS}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: { ...editingPerson.basicInfo, APELLIDOS: e.target.value },
                        })
                      }
                      className="text-base p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Correo *</label>
                    <Input
                      type="email"
                      value={editingPerson.basicInfo.CORREO}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: { ...editingPerson.basicInfo, CORREO: e.target.value },
                        })
                      }
                      className="text-base p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Celular *</label>
                    <Input
                      type="text"
                      value={editingPerson.basicInfo.CELULAR}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: { ...editingPerson.basicInfo, CELULAR: e.target.value },
                        })
                      }
                      className="text-base p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Contacto de Emergencia *</label>
                    <Input
                      type="text"
                      value={editingPerson.basicInfo.CONTACTO_EMERGENCIA}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: { ...editingPerson.basicInfo, CONTACTO_EMERGENCIA: e.target.value },
                        })
                      }
                      className="text-base p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Fecha de Nacimiento *</label>
                    <Input
                      type="date"
                      value={formatDateForInput(editingPerson.basicInfo.FECHA_NACIMIENTO)}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: { ...editingPerson.basicInfo, FECHA_NACIMIENTO: e.target.value },
                        })
                      }
                      className="text-base p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Sexo *</label>
                    <select
                      value={editingPerson.basicInfo.ID_SEXO}
                      onChange={(e) =>
                        setEditingPerson({
                          ...editingPerson,
                          basicInfo: {
                            ...editingPerson.basicInfo,
                            ID_SEXO: Number(e.target.value),
                            SEXO: sexes.find((s) => s.ID_SEXO === Number(e.target.value))?.DESCRIPCION || "",
                          },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 text-base"
                      required
                    >
                      <option value={0} disabled>Seleccione</option>
                      {sexes.map((sex) => (
                        <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                          {sex.DESCRIPCION}
                        </option>
                      ))}
                    </select>
                  </div>
                </InfoGrid>
                <div className="col-span-1 lg:col-span-4 flex justify-end gap-4 mt-4">
                  <SecondaryButton
                    onClick={() => {
                      setViewMode("view");
                      setNewPhoto(null);
                    }}
                    className="text-base bg-gray-200 text-gray-700 py-2 px-4"
                  >
                    Cancelar
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleUpdatePerson}
                    disabled={isLoadingProfile || !validateFields()}
                    className={`text-base py-2 px-4 ${isLoadingProfile || !validateFields() ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 text-white"}`}
                  >
                    Guardar
                  </PrimaryButton>
                </div>
              </div>
            )}
            {viewMode === "changePassword" && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <SectionTitle className="col-span-1 lg:col-span-4 text-center text-gray-700 text-lg">
                  Cambiar Contraseña
                </SectionTitle>
                <div className="col-span-1 lg:col-span-4">
                  <InfoGrid className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Contraseña Actual *</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña actual"
                        className="text-base p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Nueva Contraseña *</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ingresa tu nueva contraseña"
                        className="text-base p-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Confirmar Contraseña *</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                        className="text-base p-2"
                        required
                      />
                    </div>
                  </InfoGrid>
                  <div className="flex justify-end gap-4 mt-4">
                    <SecondaryButton
                      onClick={() => {
                        setViewMode("view");
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      className="text-base bg-gray-200 text-gray-700 py-2 px-4"
                    >
                      Cancelar
                    </SecondaryButton>
                    <PrimaryButton
                      onClick={handleChangePassword}
                      disabled={isLoadingProfile || !currentPassword || !newPassword || !confirmPassword}
                      className={`text-base py-2 px-4 ${isLoadingProfile || !currentPassword || !newPassword || !confirmPassword ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 text-white"}`}
                    >
                      Guardar
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </>
    );
  };

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <SidebarContainer sidebarOpen={sidebarOpen}>
        <FixedHeader>
          <div className="flex items-center mb-4">
            <ProfileImage
              src={fotoUrl}
              alt="Usuario"
              className="w-12 h-12 rounded-full mr-3 object-cover"
              onClick={handleOpenProfileModal}
            />
            <div>
              <p className="font-semibold">{userName || "Usuario"}</p>
              <p className="text-sm text-gray-400">
                {roles.length > 0 ? roles.join(", ") : "Invitado"}
              </p>
            </div>
          </div>
          <form autoComplete="off">
            <div className="flex items-center gap-3 mb-4">
              <FaSearch className="text-gray-400" />
              <SearchInput
                type="search"
                name="search_sidebar"
                autoFocus
                autoComplete="off"
                placeholder="Buscar..."
                onChange={handleSearch}
              />
            </div>
          </form>
        </FixedHeader>

        <ScrollableContent>
          <MenuItem>
            <NotificationsButton onClick={() => setNotificationsOpen(true)}>
              <FaBell className="mr-3" />
              Notificaciones
              {unreadCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NotificationsButton>
          </MenuItem>
          {sidebarStructure.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay menús disponibles</p>
          ) : (
            <MenuList>
              {sidebarStructure.map((section) => {
                const filteredSubmenus = section.submenus.filter((submenu) =>
                  submenu.nombre.toLowerCase().includes(searchTerm)
                );

                if (section.submenus.length === 0 && section.url) {
                  return (
                    <MenuItem key={section.id}>
                      <SubmenuItem
                        to={section.url}
                        onClick={closeSidebar}
                        className="font-bold"
                      >
                        {getIconComponent(section.icono)}
                        {section.nombre}
                      </SubmenuItem>
                    </MenuItem>
                  );
                }

                if (filteredSubmenus.length === 0) return null;

                return (
                  <MenuItem key={section.id}>
                    <MenuButtonWrapper>
                      <MenuButton
                        isOpen={openSections[section.id]}
                        onClick={() => toggleSection(section.id)}
                      >
                        <span className="flex items-center gap-2">
                          {getIconComponent(section.icono)}
                          {section.nombre}
                        </span>
                        <FaChevronDown
                          className={`transform transition-transform duration-300 ${
                            openSections[section.id] ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </MenuButton>
                    </MenuButtonWrapper>
                    <SubmenuList
                      className={openSections[section.id] ? "open" : ""}
                    >
                      {filteredSubmenus.map((submenu) => (
                        <SubmenuItem
                          key={submenu.id}
                          to={submenu.url}
                          onClick={closeSidebar}
                        >
                          {getIconComponent(submenu.icono)}
                          {submenu.nombre}
                        </SubmenuItem>
                      ))}
                    </SubmenuList>
                  </MenuItem>
                );
              })}
            </MenuList>
          )}
        </ScrollableContent>

        <Footer>
          <LogoutButton
            onClick={() => {
              logout();
              closeSidebar();
            }}
          >
            <FaSignOutAlt className="mr-3" />
            Cerrar Sesión
          </LogoutButton>
        </Footer>
      </SidebarContainer>

      {isLoadingProfile && (
        <SpinnerOverlay>
          <Spinner />
          <SpinnerText>Procesando...</SpinnerText>
        </SpinnerOverlay>
      )}

      <Modal
        isOpen={isProfileModalOpen && !isLoadingProfile && personDetails !== null}
        onRequestClose={handleCloseProfileModal}
        className="w-[95%] max-w-4xl mx-auto mt-4 rounded-lg sm:mt-8 sm:w-[90%] md:w-[80%] lg:w-[70%]"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000]"
        style={{
          overlay: {
            zIndex: 1000,
            overflowY: "auto",
            padding: "1rem",
            transition: "opacity 0.2s ease-in-out",
          },
          content: {
            position: "relative",
            top: "auto",
            left: "auto",
            right: "auto",
            bottom: "auto",
            margin: "auto",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "0",
            border: "none",
            background: "transparent",
            zIndex: 1001,
          },
        }}
        ariaHideApp={false}
      >
        {renderModalContent()}
      </Modal>
    </>
  );
};

export default Sidebar;