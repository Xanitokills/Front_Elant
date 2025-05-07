import { useEffect, useState } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { FaCamera, FaEdit } from "react-icons/fa";
import {
  Container,
  Card,
  ProfileImage,
  InfoGrid,
  InfoItem,
  SectionTitle,
  CloseButton,
  PrimaryButton,
  SecondaryButton,
  Input,
  SpinnerOverlay,
  Spinner,
  SpinnerText,
} from "../Styles/UserListStyles";

const API_URL = import.meta.env.VITE_API_URL;

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

interface ProfileModalProps {
  onClose: () => void;
  setFotoUrl: (url: string) => void;
}

const ProfileModal = ({ onClose, setFotoUrl }: ProfileModalProps) => {
  const token = localStorage.getItem("token");
  const personaId = localStorage.getItem("personaId");
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  const [editingPerson, setEditingPerson] = useState<PersonDetails | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [isLoading, setIsLoading] = useState(false);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [sexes, setSexes] = useState<{ ID_SEXO: number; DESCRIPCION: string }[]>([]);

  const fetchPersonDetails = async () => {
    if (!token || !personaId) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se encontró el token o ID de persona.",
      });
      onClose();
      return;
    }
    setIsLoading(true);
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
      if (photoData) {
        const fotoBase64 = `data:image/jpg;base64,${photoData.foto}`;
        setPersonDetails((prev) => prev ? { ...prev, basicInfo: { ...prev.basicInfo, FOTO: photoData.foto, FORMATO: photoData.formato } } : prev);
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
      setIsLoading(false);
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
    fetchPersonDetails();
    fetchSexes();
  }, []);

  if (!personDetails) return null;

  return (
    <Container className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      {isLoading && (
        <SpinnerOverlay>
          <Spinner />
          <SpinnerText>Procesando...</SpinnerText>
        </SpinnerOverlay>
      )}
      <Card className="relative max-h-[65vh] overflow-y-auto p-6 bg-white rounded-lg shadow-lg">
        <CloseButton onClick={onClose}>
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <SectionTitle className="col-span-1 lg:col-span-4 text-center text-gray-700">
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
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />
            </div>
            <InfoGrid className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Nombres</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.NOMBRES}</p>
              </InfoItem>
              <InfoItem>
                <label className="block text-sm font-semibold text-gray-700">Apellidos</label>
                <p className="mt-1 text-gray-800">{personDetails.basicInfo.APELLIDOS}</p>
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
              <div className="col-span-1 lg:col-span-4 mt-4">
                <SectionTitle className="text-gray-700">Información Adicional</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {personDetails.residentInfo.map((info, index) => (
                    <Card key={index} className="p-2 text-sm bg-gray-50">
                      <p><strong>Dept.:</strong> Nº {info.NRO_DPTO}</p>
                      <p><strong>Fase:</strong> {info.FASE}</p>
                      <p><strong>Inicio:</strong> {formatDate(info.INICIO_RESIDENCIA)}</p>
                    </Card>
                  ))}
                  {personDetails.workerInfo.map((info, index) => (
                    <Card key={index} className="p-2 text-sm bg-gray-50">
                      <p><strong>Fase:</strong> {info.FASE}</p>
                      <p><strong>Asignación:</strong> {formatDate(info.FECHA_ASIGNACION)}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            <div className="col-span-1 lg:col-span-4 flex justify-end mt-4">
              <PrimaryButton onClick={() => setViewMode("edit")} className="bg-blue-600 text-white">
                <FaEdit className="mr-2" />
                Editar Perfil
              </PrimaryButton>
            </div>
          </div>
        )}
        {viewMode === "edit" && editingPerson && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <SectionTitle className="col-span-1 lg:col-span-4 text-center text-gray-700">
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
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
              />
              <label className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors text-sm">
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
            <InfoGrid className="col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Nombres</label>
                <Input
                  type="text"
                  value={editingPerson.basicInfo.NOMBRES}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      basicInfo: { ...editingPerson.basicInfo, NOMBRES: e.target.value },
                    })
                  }
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Apellidos</label>
                <Input
                  type="text"
                  value={editingPerson.basicInfo.APELLIDOS}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      basicInfo: { ...editingPerson.basicInfo, APELLIDOS: e.target.value },
                    })
                  }
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Correo</label>
                <Input
                  type="email"
                  value={editingPerson.basicInfo.CORREO}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      basicInfo: { ...editingPerson.basicInfo, CORREO: e.target.value },
                    })
                  }
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Celular</label>
                <Input
                  type="text"
                  value={editingPerson.basicInfo.CELULAR}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      basicInfo: { ...editingPerson.basicInfo, CELULAR: e.target.value },
                    })
                  }
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Contacto de Emergencia</label>
                <Input
                  type="text"
                  value={editingPerson.basicInfo.CONTACTO_EMERGENCIA}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      basicInfo: { ...editingPerson.basicInfo, CONTACTO_EMERGENCIA: e.target.value },
                    })
                  }
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Fecha de Nacimiento</label>
                <Input
                  type="date"
                  value={formatDateForInput(editingPerson.basicInfo.FECHA_NACIMIENTO)}
                  onChange={(e) =>
                    setEditingPerson({
                      ...editingPerson,
                      basicInfo: { ...editingPerson.basicInfo, FECHA_NACIMIENTO: e.target.value },
                    })
                  }
                  className="text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700">Sexo</label>
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
                  className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 text-sm"
                >
                  {sexes.map((sex) => (
                    <option key={sex.ID_SEXO} value={sex.ID_SEXO}>
                      {sex.DESCRIPCION}
                    </option>
                  ))}
                </select>
              </div>
            </InfoGrid>
            <div className="col-span-1 lg:col-span-4 flex justify-end gap-3 mt-4">
              <SecondaryButton
                onClick={() => {
                  setViewMode("view");
                  setNewPhoto(null);
                }}
                className="text-sm bg-gray-200 text-gray-700"
              >
                Cancelar
              </SecondaryButton>
              <PrimaryButton onClick={handleUpdatePerson} disabled={isLoading} className="text-sm bg-blue-600 text-white">
                Guardar
              </PrimaryButton>
            </div>
          </div>
        )}
      </Card>
    </Container>
  );
};

export default ProfileModal;