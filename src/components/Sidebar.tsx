import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import { FaChevronDown, FaSearch, FaSignOutAlt, FaBell, FaCamera, FaEdit, FaLock } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import styled from "styled-components";
import Modal from "react-modal";
import Swal from "sweetalert2";
import {
  Container,
  Card,
  InfoGrid,
  InfoItem,
  SectionTitle,
  ProfileImage,
  CloseButton,
  PrimaryButton,
  SecondaryButton,
  Input,
  SpinnerOverlay,
  Spinner,
  SpinnerText,
  fadeIn,
} from "../Styles/SidebarStyles";

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

const SidebarProfileImage = styled.img`
  cursor: pointer;
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.1);
  }
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  max-width: 64rem;
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
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
      <ModalContent>
        <CloseButton onClick={handleCloseProfileModal}>
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
          <div className="flex flex-col items-center sm:grid sm:grid-cols-3 sm:gap-6">
            <SectionTitle className="col-span-3 text-center sm:text-left">Mi Perfil</SectionTitle>
            <div className="flex justify-center mb-6 sm:justify-start sm:mb-0">
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
              />
            </div>
            <InfoGrid className="col-span-2 grid-cols-2 sm:grid-cols-2">
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Nombres</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.NOMBRES}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Apellidos</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.APELLIDOS}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">DNI</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.DNI}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Correo</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.CORREO || "N/A"}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Celular</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.CELULAR || "N/A"}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Contacto de Emergencia</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.CONTACTO_EMERGENCIA || "N/A"}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Fecha de Nacimiento</label>
                <p className="mt-1 text-gray-800">{formatDate(personDetails.basicInfo.FECHA_NACIMIENTO)}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Sexo</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.SEXO}</p>
              </InfoItem>
            </InfoGrid>
            {(personDetails.residentInfo.length > 0 || personDetails.workerInfo.length > 0) && (
              <div className="col-span-3 mt-6">
                <SectionTitle className="text-center sm:text-left">Información Adicional</SectionTitle>
                <div className="additional-info-grid">
                  {personDetails.residentInfo.map((info, index) => (
                    <Card key={index}>
                      <p><strong>Departamento:</strong> Nº {info.NRO_DPTO}</p>
                      <p><strong>Fase:</strong> {info.FASE}</p>
                      <p><strong>Clasificación:</strong> {info.DETALLE_CLASIFICACION}</p>
                      <p><strong>Inicio de Residencia:</strong> {formatDate(info.INICIO_RESIDENCIA)}</p>
                    </Card>
                  ))}
                  {personDetails.workerInfo.map((info, index) => (
                    <Card key={index}>
                      <p><strong>Fase:</strong> {info.FASE}</p>
                      <p><strong>Fecha de Asignación:</strong> {formatDate(info.FECHA_ASIGNACION)}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-3 flex justify-center sm:justify-end gap-4 mt-6">
              <PrimaryButton onClick={() => setViewMode("edit")}>
                <FaEdit className="mr-2" />
                Editar Perfil
              </PrimaryButton>
              <PrimaryButton onClick={() => setViewMode("changePassword")}>
                <FaLock className="mr-2" />
                Cambiar Contraseña
              </PrimaryButton>
            </div>
          </div>
        )}
        {viewMode === "edit" && editingPerson && (
          <div className="flex flex-col items-center sm:grid sm:grid-cols-3 sm:gap-6">
            <SectionTitle className="col-span-3 text-center sm:text-left">Editar Perfil</SectionTitle>
            <div className="flex flex-col items-center mb-6 sm:items-start sm:mb-0">
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
                      await fetch(`${API_URL}/persons/${editingPerson.basicInfo.ID_PERSONA}/photo`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setEditingPerson({
                        ...editingPerson,
                        basicInfo: {
                          ...editingPerson.basicInfo,
                          FOTO: null,
                          FORMATO: null,
                        },
                      });
                      setPersonDetails({
                        ...personDetails,
                        basicInfo: {
                          ...personDetails.basicInfo,
                          FOTO: null,
                          FORMATO: null,
                        },
                      });
                      localStorage.removeItem("foto");
                      setFotoUrl(getDefaultPhoto(editingPerson.basicInfo.SEXO));
                      Swal.fire("Eliminada", "La foto fue eliminada", "success");
                    } catch (error) {
                      Swal.fire("Error", "No se pudo eliminar la foto", "error");
                    }
                  }
                }}
                className="mt-2 text-red-500 hover:text-red-700 underline"
              >
                Eliminar Foto
              </button>
            </div>
            <InfoGrid className="col-span-2 grid-cols-2 sm:grid-cols-2">
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
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Sexo *</label>
                <Select
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
                  required
                >
                  <option value={0} disabled>Seleccione</option>
                  {sexes.map((sex) => (
                    <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                      {sex.DESCRIPCION}
                    </option>
                  ))}
                </Select>
              </div>
            </InfoGrid>
            <div className="col-span-3 flex justify-center sm:justify-end gap-4 mt-6">
              <SecondaryButton
                onClick={() => {
                  setViewMode("view");
                  setNewPhoto(null);
                }}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                onClick={handleUpdatePerson}
                disabled={isLoadingProfile || !validateFields()}
              >
                Guardar
              </PrimaryButton>
            </div>
          </div>
        )}
        {viewMode === "changePassword" && (
          <div className="flex flex-col items-center sm:grid sm:grid-cols-1 sm:gap-6">
            <SectionTitle className="text-center sm:text-left">Cambiar Contraseña</SectionTitle>
            <InfoGrid className="grid-cols-2 sm:grid-cols-1 w-full max-w-md sm:max-w-full">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Contraseña Actual *</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
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
                  required
                />
              </div>
            </InfoGrid>
            <div className="flex justify-center sm:justify-end gap-4 mt-6">
              <SecondaryButton
                onClick={() => {
                  setViewMode("view");
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton
                onClick={handleChangePassword}
                disabled={isLoadingProfile || !currentPassword || !newPassword || !confirmPassword}
              >
                Guardar
              </PrimaryButton>
            </div>
          </div>
        )}
      </ModalContent>
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
            <SidebarProfileImage
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
        className="mx-4 sm:mx-auto mt-20"
        overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        ariaHideApp={false}
      >
        {renderModalContent()}
      </Modal>
    </>
  );
};

export default Sidebar;