import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { FaFileExport } from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

interface Area {
  id: number;
  name: string;
  description: string;
  capacity: number;
  status: number;
  imageName?: string;
  imagePath?: string;
}

interface Document {
  id: number;
  name: string;
  uploadDate: string;
}

interface Reservation {
  id: number;
  areaId: string;
  areaName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: number;
  departmentNumber: number;
}

interface ReservationData {
  area: number;
  date: string;
  startTime: string;
  endTime: string;
  departmentNumber: number;
}

interface FilterData {
  campo: "areaName" | "date" | "departmentNumber";
  valor: string;
}

interface Slot {
  HORA_INICIO: string;
  HORA_FIN: string;
}

interface AuthContextType {
  userId: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userPermissions: string[];
}

const Reservations = () => {
  const { userId, isAuthenticated, isLoading, userPermissions } = useAuth() as AuthContextType;

  const [areas, setAreas] = useState<Area[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState<FilterData>({ campo: "areaName", valor: "" });
  const [newReservation, setNewReservation] = useState<ReservationData>({
    area: 0,
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
    departmentNumber: 0,
  });
  const [activeTab, setActiveTab] = useState<"myReservations" | "createReservation" | "manageAreas">("myReservations");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [occupiedSlots, setOccupiedSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const [noSlotsMessage, setNoSlotsMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [newArea, setNewArea] = useState({
    name: "",
    description: "",
    capacity: 0,
    status: 1,
    image: null as File | null,
    documents: [] as { name: string; file: File | null }[], // Commenting out document support for now
  });
  const [editArea, setEditArea] = useState<Area | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [areaDocuments, setAreaDocuments] = useState<Document[]>([]);

  const cancelTokenSource = useRef(axios.CancelToken.source());
  const isMounted = useRef(true);

  // Removed hardcoded areaImages since we now get imagePath from the backend
  const hasCreateReservationPermission = userPermissions.includes("Crear Reservas") || userPermissions.includes("Reservas");

  const fetchAreas = async () => {
    try {
      setIsLoadingAreas(true);
      const res = await axios.get<Area[]>(`${API_URL}/reservations/areas`, {
        cancelToken: cancelTokenSource.current.token,
      });
      const formattedAreas: Area[] = res.data.map((area, index) => ({
        id: area.id || index + 1,
        name: String(area.name),
        description: area.description || "",
        capacity: area.capacity || 0,
        status: area.status || 1,
        imageName: area.imageName || "",
        imagePath: area.imagePath || "", // Use the base64 image from the backend
      }));
      setAreas(formattedAreas);
      setErrorMessage("");
    } catch (err) {
      if (axios.isCancel(err)) return;
      setErrorMessage("No se pudieron cargar las áreas.");
      Swal.fire("Error", "No se pudieron cargar las áreas", "error");
    } finally {
      setIsLoadingAreas(false);
    }
  };

  const fetchUserReservations = async () => {
    if (!userId) {
      console.log("No userId disponible para fetchUserReservations");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<any[]>(`${API_URL}/reservations/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenSource.current.token,
      });

      console.log("Reservas recibidas del backend:", res.data);

      const validReservations: Reservation[] = res.data
        .filter((reservation) => reservation != null && typeof reservation === "object")
        .map((reservation) => ({
          id: typeof reservation.id === "number" ? reservation.id : 0,
          areaId: String(reservation.areaId || reservation.areaName || ""),
          areaName: String(reservation.areaName || ""),
          date: typeof reservation.date === "string" ? reservation.date.split("T")[0] : "",
          startTime: typeof reservation.startTime === "string" ? (reservation.startTime.includes("T") ? reservation.startTime.split("T")[1]?.slice(0, 5) : reservation.startTime.slice(0, 5)) || reservation.startTime : "",
          endTime: typeof reservation.endTime === "string" ? (reservation.endTime.includes("T") ? reservation.endTime.split("T")[1]?.slice(0, 5) : reservation.endTime.slice(0, 5)) || reservation.endTime : "",
          status: typeof reservation.status === "boolean" ? (reservation.status ? 1 : 0) : typeof reservation.status === "number" ? reservation.status : 0,
          departmentNumber: typeof reservation.departmentNumber === "number" ? reservation.departmentNumber : 0,
        }))
        .filter((reservation) => reservation.id !== 0 && reservation.areaId && reservation.areaName && reservation.date && reservation.startTime && reservation.endTime);

      if (validReservations.length === 0 && res.data.length > 0) {
        console.log("No se encontraron reservas válidas después de la validación");
        setErrorMessage("No se encontraron reservas válidas.");
      } else if (validReservations.length === 0) {
        console.log("No se encontraron reservas para el usuario");
        setErrorMessage("No se encontraron reservas.");
      } else {
        console.log("Reservas válidas después de la validación:", validReservations);
        setErrorMessage("");
      }

      setReservations(validReservations);
    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Error al obtener reservas:", err);
      setReservations([]);
      setErrorMessage("Error al cargar las reservas.");
    }
  };

  const fetchOccupiedSlots = async () => {
    if (!newReservation.area || !newReservation.date || !isAuthenticated || !userId) return;
    setIsLoadingSlots(true);
    setNoSlotsMessage("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get<Slot[]>(`${API_URL}/reservations/slots/occupied`, {
        params: { areaId: newReservation.area, date: newReservation.date },
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenSource.current.token,
      });
      const validSlots = res.data.filter(
        (slot) => slot.HORA_INICIO != null && slot.HORA_FIN != null && typeof slot.HORA_INICIO === "string" && typeof slot.HORA_FIN === "string"
      );
      if (validSlots.length === 0) {
        setNoSlotsMessage("No hay horarios ocupados para esta fecha y área.");
      }
      setOccupiedSlots(validSlots);
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      setOccupiedSlots([]);
      setNoSlotsMessage("No se pudieron cargar los horarios ocupados.");
      if (err.response?.status !== 404) {
        Swal.fire("Error", err.response?.data?.message || "No se pudieron cargar los horarios ocupados", "error");
      }
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const fetchAreaDetails = async (areaId: string) => {
    try {
      const area = areas.find((a) => a.id === parseInt(areaId));
      if (area) {
        setSelectedArea(area);
        setAreaDocuments([]); // Documents not supported yet
      } else {
        throw new Error("Área no encontrada");
      }
    } catch (err) {
      Swal.fire("Error", "No se pudieron cargar los detalles del área", "error");
      setSelectedArea(null);
      setAreaDocuments([]);
    }
  };

  const handleCreateArea = async () => {
    if (!newArea.name || !newArea.status || !newArea.image) {
      return Swal.fire("Advertencia", "Por favor, completa los campos requeridos para el área", "warning");
    }

    const formData = new FormData();
    formData.append("name", newArea.name);
    formData.append("description", newArea.description);
    formData.append("capacity", newArea.capacity.toString());
    formData.append("status", newArea.status.toString());
    if (newArea.image) {
      formData.append("image", newArea.image);
    }

    // Document upload is not supported yet by the backend
    // If you want to support documents, you'll need to create a separate table and endpoint
    // for (let i = 0; i < newArea.documents.length; i++) {
    //   if (newArea.documents[i].file) {
    //     formData.append(`documents[${i}]`, newArea.documents[i].file);
    //   }
    // }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Error", "No se encontró un token de autenticación", "error");
        return;
      }

      const response = await axios.post(`${API_URL}/reservations/areas`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        cancelToken: cancelTokenSource.current.token,
      });

      Swal.fire("¡Creado!", "Área creada con éxito", "success");
      setNewArea({
        name: "",
        description: "",
        capacity: 0,
        status: 1,
        image: null,
        documents: [],
      });
      fetchAreas(); // Refresh the areas list
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      console.error("Error al crear área:", err.response?.data || err.message);
      Swal.fire("Error", err.response?.data?.message || "No se pudo crear el área", "error");
    }
  };

  const handleAddDocument = () => {
    setNewArea({
      ...newArea,
      documents: [...newArea.documents, { name: "", file: null }],
    });
  };

  const handleDocumentChange = (index: number, field: "name" | "file", value: string | File | null) => {
    const updatedDocs = [...newArea.documents];
    if (field === "name") {
      updatedDocs[index].name = value as string;
    } else {
      updatedDocs[index].file = value as File | null;
    }
    setNewArea({ ...newArea, documents: updatedDocs });
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocs = newArea.documents.filter((_, i) => i !== index);
    setNewArea({ ...newArea, documents: updatedDocs });
  };

  const handleEditArea = async () => {
    if (!editArea || !editArea.name || !editArea.status) {
      return Swal.fire("Advertencia", "Por favor, completa todos los campos requeridos", "warning");
    }

    const formData = new FormData();
    formData.append("name", editArea.name);
    formData.append("description", editArea.description);
    formData.append("capacity", editArea.capacity.toString());
    formData.append("status", editArea.status.toString());
    // Only append image if a new file is selected (editArea.imagePath might be a File or a string)
    if (editArea.imagePath instanceof File) {
      formData.append("image", editArea.imagePath);
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Error", "No se encontró un token de autenticación", "error");
        return;
      }

      const response = await axios.put(`${API_URL}/reservations/areas/${editArea.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        cancelToken: cancelTokenSource.current.token,
      });

      Swal.fire("¡Actualizado!", "Área actualizada con éxito", "success");
      setEditArea(null);
      fetchAreas(); // Refresh the areas list
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      console.error("Error al editar área:", err.response?.data || err.message);
      Swal.fire("Error", err.response?.data?.message || "No se pudo actualizar el área", "error");
    }
  };

  const handleDeleteArea = async (areaId: number) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción. ¿Deseas eliminar el área?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          Swal.fire("Error", "No se encontró un token de autenticación", "error");
          return;
        }

        await axios.delete(`${API_URL}/reservations/areas/${areaId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cancelToken: cancelTokenSource.current.token,
        });

        Swal.fire("¡Eliminado!", "El área ha sido eliminada con éxito", "success");
        fetchAreas();
      } catch (err: any) {
        if (axios.isCancel(err)) return;
        console.error("Error al eliminar área:", err.response?.data || err.message);
        Swal.fire("Error", err.response?.data?.message || "No se pudo eliminar el área", "error");
      }
    }
  };

  const handleToggleAreaStatus = async (areaId: number, currentStatus: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Error", "No se encontró un token de autenticación", "error");
        return;
      }

      const newStatus = currentStatus === 1 ? 0 : 1;
      const formData = new FormData();
      formData.append("status", newStatus.toString());

      const response = await axios.put(`${API_URL}/reservations/areas/${areaId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        cancelToken: cancelTokenSource.current.token,
      });

      Swal.fire("¡Actualizado!", `Área ${newStatus === 1 ? "activada" : "desactivada"} con éxito`, "success");
      fetchAreas(); // Refresh the areas list
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      console.error("Error al cambiar estado del área:", err.response?.data || err.message);
      Swal.fire("Error", err.response?.data?.message || "No se pudo cambiar el estado del área", "error");
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchAreas();
    let interval: NodeJS.Timeout | null = null;
    if (isAuthenticated && !isLoading && userId) {
      fetchUserReservations();
      interval = setInterval(() => {
        if (isMounted.current) {
          fetchUserReservations();
        }
      }, 5000);
    }
    return () => {
      isMounted.current = false;
      if (interval) clearInterval(interval);
      cancelTokenSource.current.cancel("Component unmounted");
      cancelTokenSource.current = axios.CancelToken.source();
    };
  }, [isAuthenticated, isLoading, userId]);

  useEffect(() => {
    fetchOccupiedSlots();
  }, [newReservation.area, newReservation.date, isAuthenticated, userId]);

  useEffect(() => {
    if (newReservation.area) {
      fetchAreaDetails(newReservation.area.toString());
    } else {
      setSelectedArea(null);
      setAreaDocuments([]);
    }
  }, [newReservation.area]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const filteredReservations = reservations.filter((res) => {
    const texto = filter.valor.toLowerCase();
    let coincide = true;
    if (filter.campo === "areaName") {
      coincide = res.areaName.toLowerCase().includes(texto);
    } else if (filter.campo === "date") {
      coincide = res.date.includes(texto);
    } else if (filter.campo === "departmentNumber") {
      coincide = res.departmentNumber.toString().includes(texto);
    }
    return coincide;
  });

  const exportToCSV = () => {
    const headers = "ID,Área,Fecha,Hora Inicio,Hora Fin,Número de Departamento,Estado\n";
    const rows = filteredReservations
      .map((res) => {
        const formattedDate = formatDate(res.date);
        const formattedTime = `${formatTime(res.startTime)} - ${formatTime(res.endTime)}`;
        return `${res.id},${res.areaName},${formattedDate},${formattedTime},${res.departmentNumber},${
          res.status === 1 ? "Activa" : "Cancelada"
        }`;
      })
      .join("\n");
    const csv = headers + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reservas.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCreateReservation = async () => {
    if (!hasCreateReservationPermission) {
      Swal.fire("Error", "No tienes permiso para crear reservas", "error");
      return;
    }

    const deptNum = parseInt(newReservation.departmentNumber.toString());
    if (
      !newReservation.area ||
      !newReservation.date ||
      !newReservation.startTime ||
      !newReservation.endTime ||
      isNaN(deptNum) ||
      deptNum <= 0
    ) {
      Swal.fire("Advertencia", "Por favor, completa todos los campos correctamente", "warning");
      return;
    }
    if (!isAuthenticated || !userId || typeof userId !== "number") {
      Swal.fire("Advertencia", "Debes estar autenticado con un ID de usuario válido para crear una reserva", "warning");
      return;
    }

    const formatTimeForBackend = (time: string): string => {
      if (!time) return "";
      return time.length === 5 ? `${time}:00` : time;
    };

    const payload = {
      userId,
      areaId: newReservation.area,
      date: newReservation.date,
      startTime: formatTimeForBackend(newReservation.startTime),
      endTime: formatTimeForBackend(newReservation.endTime),
      departmentNumber: deptNum,
    };

    console.log("Enviando payload al backend:", payload);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        Swal.fire("Error", "No se encontró un token de autenticación", "error");
        return;
      }

      const response = await axios.post(`${API_URL}/reservations`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        cancelToken: cancelTokenSource.current.token,
      });

      Swal.fire("¡Registrado!", "Reserva creada con éxito", "success");
      setNewReservation({
        area: 0,
        date: new Date().toISOString().slice(0, 10),
        startTime: "",
        endTime: "",
        departmentNumber: 0,
      });
      setActiveTab("myReservations");
      fetchUserReservations();
      fetchOccupiedSlots();
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      console.error("Error al crear reserva:", err.response?.data || err.message);
      Swal.fire("Error", err.response?.data?.message || "No se pudo crear la reserva", "error");
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 23; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeToMinutes = (time: string | undefined): number => {
    if (!time || typeof time !== "string") return -1;
    const [hours, minutes] = time.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return -1;
    return hours * 60 + minutes;
  };

  const isSlotOccupied = (startTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    if (startMinutes === -1) return false;
    return occupiedSlots.some((slot) => {
      const slotStartMinutes = timeToMinutes(slot.HORA_INICIO);
      const slotEndMinutes = timeToMinutes(slot.HORA_FIN);
      if (slotStartMinutes === -1 || slotEndMinutes === -1) return false;
      return startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes;
    });
  };

  const formatDate = (date?: string): string => {
    if (!date || typeof date !== "string") return "N/A";
    return date;
  };

  const formatTime = (time?: string): string => {
    if (!time || typeof time !== "string") return "N/A";
    return time.slice(0, 5);
  };

  const formatTimeForInput = (time: string): string => {
    if (!time || typeof time !== "string") return "";
    return time.slice(0, 5);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setNewReservation({
      ...newReservation,
      date: date.toISOString().slice(0, 10),
    });
  };

  const handleTimeSlotSelect = (startTime: string) => {
    if (isSlotOccupied(startTime)) {
      Swal.fire("Advertencia", "Este horario no está disponible", "warning");
      return;
    }
    const startMinutes = timeToMinutes(startTime);
    if (startMinutes === -1) return;
    const endMinutes = startMinutes + 60;
    const endHours = Math.floor(endMinutes / 60);
    const endMinutesRemainder = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, "0")}:${endMinutesRemainder.toString().padStart(2, "0")}:00`;
    setNewReservation({
      ...newReservation,
      startTime,
      endTime,
    });
  };

  const handleViewDocument = (documentId: number) => {
    Swal.fire("Advertencia", "La visualización de documentos no está soportada por el backend", "warning");
  };

  const handleTabChange = (tab: "myReservations" | "createReservation" | "manageAreas") => {
    setActiveTab(tab);
    setErrorMessage("");
    if (tab !== "createReservation") {
      setNewReservation({
        area: 0,
        date: new Date().toISOString().slice(0, 10),
        startTime: "",
        endTime: "",
        departmentNumber: 0,
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Control de Reservas</h1>

      <div className="mb-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => handleTabChange("myReservations")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "myReservations" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"
            }`}
          >
            Mis Reservas
          </button>
          {hasCreateReservationPermission && (
            <button
              onClick={() => handleTabChange("createReservation")}
              className={`py-2 px-4 font-semibold ${
                activeTab === "createReservation" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"
              }`}
            >
              Crear Reserva
            </button>
          )}
          <button
            onClick={() => handleTabChange("manageAreas")}
            className={`py-2 px-4 font-semibold ${
              activeTab === "manageAreas" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"
            }`}
          >
            Administrar Áreas
          </button>
        </div>
      </div>

      {activeTab === "myReservations" && isAuthenticated && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          {errorMessage && (
            <div className="p-3 text-center text-red-500">
              {errorMessage}
              <button
                onClick={() => {
                  setErrorMessage("");
                  fetchUserReservations();
                }}
                className="ml-2 text-blue-500 underline"
              >
                Reintentar
              </button>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-700">Buscar por</label>
                <select
                  name="campo"
                  value={filter.campo}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="areaName">Área</option>
                  <option value="date">Fecha</option>
                  <option value="departmentNumber">Número de Departamento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Valor a buscar</label>
                <input
                  type="text"
                  name="valor"
                  value={filter.valor}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 md:mt-0">
              <button
                onClick={exportToCSV}
                className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
              >
                <FaFileExport className="mr-2" />
                Exportar a CSV
              </button>
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3">ID</th>
                <th className="p-3">Área</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Horario</th>
                <th className="p-3">Número de Departamento</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.filter((res): res is Reservation => res != null).map((res) => (
                <tr key={res.id} className="border-b">
                  <td className="p-3">{res.id}</td>
                  <td className="p-3">{res.areaName || "N/A"}</td>
                  <td className="p-3">{formatDate(res.date)}</td>
                  <td className="p-3">
                    {res.startTime && res.endTime ? `${formatTime(res.startTime)} - ${formatTime(res.endTime)}` : "N/A"}
                  </td>
                  <td className="p-3">{res.departmentNumber}</td>
                  <td className="p-3">{res.status === 1 ? "Activa" : "Cancelada"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredReservations.length === 0 && (
            <div className="p-3 text-center text-gray-500">No hay reservas para mostrar.</div>
          )}
        </div>
      )}

      {activeTab === "createReservation" && hasCreateReservationPermission && (
        <div>
          {isLoadingAreas ? (
            <div className="p-3 text-center text-gray-500">Cargando áreas...</div>
          ) : errorMessage ? (
            <div className="p-3 text-center text-red-500">
              {errorMessage}
              <button
                onClick={() => {
                  setErrorMessage("");
                  fetchAreas();
                }}
                className="ml-2 text-blue-500 underline"
              >
                Reintentar
              </button>
            </div>
          ) : areas.length === 0 ? (
            <div className="p-3 text-center text-gray-500">No hay áreas disponibles.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer ${
                    newReservation.area === area.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setNewReservation({ ...newReservation, area: area.id })}
                >
                  <img
                    src={area.imagePath || "https://via.placeholder.com/300x200?text=Default+Area"}
                    alt={area.name}
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/300x200?text=Default+Area";
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">{area.name}</h3>
                    <button className="mt-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                      Reservar aquí con Elant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {newReservation.area !== 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              {selectedArea && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Detalles del Área: {selectedArea.name}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={selectedArea.imagePath || "https://via.placeholder.com/300x200?text=Default+Area"}
                        alt={selectedArea.name}
                        className="w-full h-40 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/300x200?text=Default+Area";
                        }}
                      />
                      <div className="mt-4">
                        <p>
                          <strong>ID Área:</strong> {selectedArea.id}
                        </p>
                        <p>
                          <strong>Nombre:</strong> {selectedArea.name}
                        </p>
                        <p>
                          <strong>Descripción:</strong> {selectedArea.description || "No disponible"}
                        </p>
                        <p>
                          <strong>Capacidad:</strong> {selectedArea.capacity || "No disponible"}
                        </p>
                        <p>
                          <strong>Estado:</strong> {selectedArea.status === 1 ? "Disponible" : "No Disponible"}
                        </p>
                        <p>
                          <strong>Nombre de la Imagen:</strong> {selectedArea.imageName || "No disponible"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-md font-semibold mb-2">Documentos Subidos</h3>
                      {areaDocuments.length === 0 ? (
                        <p className="text-gray-500">No hay documentos subidos.</p>
                      ) : (
                        <ul className="list-disc pl-5">
                          {areaDocuments.map((doc) => (
                            <li key={doc.id}>
                              <button onClick={() => handleViewDocument(doc.id)} className="text-blue-500 underline">
                                {doc.name}
                              </button>{" "}
                              (Subido el: {new Date(doc.uploadDate).toLocaleDateString()})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold mb-4">Selecciona Fecha y Horario</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona la Fecha</label>
                  <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    minDate={new Date()}
                    className="border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona el Horario</label>
                  {isLoadingSlots ? (
                    <div className="text-center text-gray-500">Cargando horarios...</div>
                  ) : (
                    <div>
                      {noSlotsMessage && <div className="text-center text-gray-500 mb-2">{noSlotsMessage}</div>}
                      <div className="grid grid-cols-3 gap-2">
                        {generateTimeSlots().map((time) => {
                          const isOccupied = isSlotOccupied(time);
                          return (
                            <button
                              key={time}
                              onClick={() => handleTimeSlotSelect(time)}
                              className={`p-2 border rounded-lg text-center ${
                                newReservation.startTime === time
                                  ? "bg-blue-500 text-white"
                                  : isOccupied
                                  ? "bg-red-500 text-white cursor-not-allowed"
                                  : "bg-green-200 text-gray-700 hover:bg-green-300"
                              }`}
                              disabled={isOccupied}
                            >
                              {time.slice(0, 5)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Detalles de la Reserva</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hora de Fin</label>
                    <input
                      type="time"
                      value={formatTimeForInput(newReservation.endTime)}
                      onChange={(e) =>
                        setNewReservation({
                          ...newReservation,
                          endTime: e.target.value ? `${e.target.value}:00` : "",
                        })
                      }
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Departamento</label>
                    <input
                      type="number"
                      value={newReservation.departmentNumber === 0 ? "" : newReservation.departmentNumber}
                      onChange={(e) =>
                        setNewReservation({
                          ...newReservation,
                          departmentNumber: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Ejemplo: 101"
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleCreateReservation}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 w-full"
                    >
                      Confirmar Reserva
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "manageAreas" && (
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Crear Nueva Área</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre del Área</label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ejemplo: Gimnasio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  value={newArea.description}
                  onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ejemplo: Área para ejercicios"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Capacidad</label>
                <input
                  type="number"
                  value={newArea.capacity === 0 ? "" : newArea.capacity}
                  onChange={(e) => setNewArea({ ...newArea, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ejemplo: 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <select
                  value={newArea.status}
                  onChange={(e) => setNewArea({ ...newArea, status: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Disponible</option>
                  <option value={0}>No Disponible</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fotografía</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewArea({ ...newArea, image: e.target.files?.[0] || null })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            {/* Commenting out document upload UI since the backend doesn't support it yet */}
            {/* <div className="mt-6">
              <h3 className="text-md font-semibold mb-2">Subir Documentos (Opcional)</h3>
              {newArea.documents.map((doc, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Documento</label>
                    <input
                      type="text"
                      value={doc.name}
                      onChange={(e) => handleDocumentChange(index, "name", e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ejemplo: Reglamento"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Archivo PDF</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleDocumentChange(index, "file", e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleRemoveDocument(index)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddDocument}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300 mb-4"
              >
                Agregar Documento
              </button>
            </div> */}
            <button
              onClick={handleCreateArea}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Crear Área
            </button>
          </div>

          {editArea && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-lg font-semibold mb-4">Editar Área: {editArea.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre del Área</label>
                  <input
                    type="text"
                    value={editArea.name}
                    onChange={(e) => setEditArea({ ...editArea, name: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción</label>
                  <input
                    type="text"
                    value={editArea.description}
                    onChange={(e) => setEditArea({ ...editArea, description: e.target.value })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Capacidad</label>
                  <input
                    type="number"
                    value={editArea.capacity}
                    onChange={(e) => setEditArea({ ...editArea, capacity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <select
                    value={editArea.status}
                    onChange={(e) => setEditArea({ ...editArea, status: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={1}>Disponible</option>
                    <option value={0}>No Disponible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fotografía (opcional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEditArea({ ...editArea, imagePath: e.target.files?.[0] || editArea.imagePath })}
                    className="w-full p-2 border rounded-lg"
                  />
                  {typeof editArea.imagePath === "string" && editArea.imagePath && (
                    <img
                      src={editArea.imagePath}
                      alt="Current Area"
                      className="mt-2 w-full h-20 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={handleEditArea}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setEditArea(null)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Áreas Existentes</h2>
            {isLoadingAreas ? (
              <div className="text-center text-gray-500">Cargando áreas...</div>
            ) : areas.length === 0 ? (
              <div className="text-center text-gray-500">No hay áreas disponibles.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {areas.map((area) => (
                  <div key={area.id} className="bg-gray-50 rounded-lg shadow-md overflow-hidden">
                    <img
                      src={area.imagePath || "https://via.placeholder.com/300x200?text=Default+Area"}
                      alt={area.name}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/300x200?text=Default+Area";
                      }}
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">{area.name}</h3>
                      <p className="text-sm text-gray-600">
                        Estado: {area.status === 1 ? "Disponible" : "No Disponible"}
                      </p>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditArea(area);
                          }}
                          className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition duration-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteArea(area.id);
                          }}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAreaStatus(area.id, area.status);
                          }}
                          className={`${
                            area.status === 1 ? "bg-orange-500" : "bg-green-500"
                          } text-white px-3 py-1 rounded-lg hover:${
                            area.status === 1 ? "bg-orange-600" : "bg-green-600"
                          } transition duration-300`}
                        >
                          {area.status === 1 ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;