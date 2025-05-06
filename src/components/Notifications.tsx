import { useState, useEffect } from "react";
import { FaTimes, FaCheck } from "react-icons/fa";
import styled from "styled-components";

const NotificationsPanel = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isOpen",
})<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  max-width: 400px;
  height: 100vh;
  background-color: #1a202c;
  color: #ffffff;
  z-index: 60;
  transform: ${({ isOpen }) => (isOpen ? "translateX(0)" : "translateX(100%)")};
  transition: transform 0.3s ease-in-out, opacity 0.2s ease;
  opacity: ${({ isOpen }) => (isOpen ? 1 : 0)};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #2d3748;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: bold;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #93c5fd;
  }
`;

const FilterBar = styled.div`
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #2d3748;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ active }) => (active ? "#4a5568" : "transparent")};
  color: #ffffff;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #4a5568;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.25rem;
  border-radius: 0.5rem;
  background-color: #2d3748;
  color: #ffffff;
  border: none;
  outline: none;
  font-size: 0.875rem;
  &::placeholder {
    color: #a0aec0;
  }
`;

const MarkAllReadButton = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #60a5fa;
  }
`;

const NotificationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const NotificationItem = styled.div<{ isRead: boolean }>`
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${({ isRead }) => (isRead ? "#2d3748" : "#3b82f6")};
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease, transform 0.1s ease;
  &:hover {
    background-color: ${({ isRead }) => (isRead ? "#4a5568" : "#60a5fa")};
    transform: translateX(5px);
  }
  display: flex;
  flex-direction: column;
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
`;

const NotificationTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NotificationStatus = styled.span<{ status: string }>`
  padding: 0.1rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  background-color: ${({ status }) =>
    status === "Nuevo" ? "#ef4444" : status === "Urgente" ? "#f59e0b" : "transparent"};
  color: #ffffff;
`;

const NotificationDescription = styled.p`
  font-size: 0.875rem;
  color: #a0aec0;
  margin-bottom: 0.25rem;
`;

const TimeAgo = styled.p`
  font-size: 0.75rem;
  color: #a0aec0;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #93c5fd;
  font-size: 0.875rem;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: color 0.2s ease;
  &:hover {
    color: #bfdbfe;
  }
`;

const ReadToggle = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #93c5fd;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 70;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: #1a202c;
  color: #ffffff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: bold;
`;

const ModalCloseButton = styled.button`
  background: none;
  border: none;
  color: #ffffff;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.2s ease;
  &:hover {
    color: #93c5fd;
  }
`;

const ModalBody = styled.div`
  margin-bottom: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const ArchiveButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #ef4444;
  color: #ffffff;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #f87171;
  }
`;

interface Notification {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  status?: string;
  additionalInfo?: string;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "Nueva visita programada",
    description: "Una visita ha sido programada para el 10 de mayo.",
    timestamp: "2025-05-06 10:30",
    isRead: false,
    status: "Nuevo",
    additionalInfo: "Acción completada por el usuario Juan Pérez.",
  },
  {
    id: 2,
    title: "Usuario actualizado",
    description: "Se han actualizado los permisos de un usuario.",
    timestamp: "2025-05-06 09:15",
    isRead: true,
    additionalInfo: "Acción completada por el administrador María Gómez.",
  },
  {
    id: 3,
    title: "Reserva confirmada",
    description: "La reserva #1234 ha sido confirmada.",
    timestamp: "2025-05-05 14:20",
    isRead: false,
    status: "Urgente",
    additionalInfo: "Acción completada por el sistema automáticamente.",
  },
];

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays} día${diffDays > 1 ? "s" : ""} atrás`;
  if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? "s" : ""} atrás`;
  return `${diffMin} minuto${diffMin > 1 ? "s" : ""} atrás`;
};

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  setUnreadCount: (count: number) => void;
}

const Notifications = ({ isOpen, onClose, setUnreadCount }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<"Todas" | "Nuevas" | "Leídas">("Todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && !isOpen) onClose();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, onClose]);

  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(unreadCount);
  }, [notifications, setUnreadCount]);

  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter =
      filter === "Todas" ||
      (filter === "Nuevas" && !n.isRead) ||
      (filter === "Leídas" && n.isRead);
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: !n.isRead, status: !n.isRead && n.status === "Nuevo" ? undefined : n.status }
          : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.isRead ? n : { ...n, isRead: true, status: n.status === "Nuevo" ? undefined : n.status }
      )
    );
  };

  const openModal = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedNotification(null);
  };

  const archiveNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    closeModal();
  };

  return (
    <>
      {isOpen && <Overlay onClick={onClose} />}
      <NotificationsPanel isOpen={isOpen}>
        <Header>
          <Title>Notificaciones</Title>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </Header>
        <FilterBar>
          <FilterButton active={filter === "Todas"} onClick={() => setFilter("Todas")}>
            Todas
          </FilterButton>
          <FilterButton active={filter === "Nuevas"} onClick={() => setFilter("Nuevas")}>
            Nuevas
          </FilterButton>
          <FilterButton active={filter === "Leídas"} onClick={() => setFilter("Leídas")}>
            Leídas
          </FilterButton>
          <SearchInput
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MarkAllReadButton onClick={markAllAsRead}>
            Marcar todos como leídos
          </MarkAllReadButton>
        </FilterBar>
        <NotificationList>
          {filteredNotifications.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay notificaciones</p>
          ) : (
            filteredNotifications.map((notification) => (
              <NotificationItem key={notification.id} isRead={notification.isRead}>
                <NotificationHeader>
                  <NotificationTitle>
                    {notification.status && (
                      <NotificationStatus status={notification.status}>
                        {notification.status}
                      </NotificationStatus>
                    )}
                    {notification.title}
                  </NotificationTitle>
                  {!notification.isRead && (
                    <ReadToggle onClick={() => toggleRead(notification.id)}>
                      <FaCheck />
                    </ReadToggle>
                  )}
                </NotificationHeader>
                <NotificationDescription>{notification.description}</NotificationDescription>
                <TimeAgo>{getTimeAgo(notification.timestamp)}</TimeAgo>
                <ActionButton onClick={() => openModal(notification)}>
                  Ver detalles
                </ActionButton>
              </NotificationItem>
            ))
          )}
        </NotificationList>
      </NotificationsPanel>

      {modalOpen && selectedNotification && (
        <ModalOverlay onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{selectedNotification.title}</ModalTitle>
              <ModalCloseButton onClick={closeModal}>
                <FaTimes />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm mb-2">{selectedNotification.description}</p>
              <p className="text-sm mb-2">Fecha: {selectedNotification.timestamp}</p>
              <p className="text-sm mb-2">Estado: {selectedNotification.isRead ? "Leído" : "No leído"}</p>
              {selectedNotification.status && (
                <p className="text-sm mb-2">Prioridad: {selectedNotification.status}</p>
              )}
              <p className="text-sm">{selectedNotification.additionalInfo}</p>
            </ModalBody>
            <ModalFooter>
              <ArchiveButton onClick={() => archiveNotification(selectedNotification.id)}>
                Archivar
              </ArchiveButton>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default Notifications;