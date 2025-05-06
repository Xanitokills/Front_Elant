import { useState } from "react";
import { FaTimes } from "react-icons/fa";
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
  transition: transform 0.3s ease;
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
`;

const NotificationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const NotificationItem = styled.div`
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: #2d3748;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #4a5568;
  }
`;

const NotificationTitle = styled.h3`
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const NotificationDescription = styled.p`
  font-size: 0.875rem;
  color: #a0aec0;
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

interface Notification {
  id: number;
  title: string;
  description: string;
  timestamp: string;
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    title: "Nueva visita programada",
    description: "Una visita ha sido programada para el 10 de mayo.",
    timestamp: "2025-05-06 10:30",
  },
  {
    id: 2,
    title: "Usuario actualizado",
    description: "Se han actualizado los permisos de un usuario.",
    timestamp: "2025-05-06 09:15",
  },
  {
    id: 3,
    title: "Reserva confirmada",
    description: "La reserva #1234 ha sido confirmada.",
    timestamp: "2025-05-05 14:20",
  },
];

const Notifications = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [notifications] = useState<Notification[]>(mockNotifications);

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
        <NotificationList>
          {notifications.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay notificaciones</p>
          ) : (
            notifications.map((notification) => (
              <NotificationItem key={notification.id}>
                <NotificationTitle>{notification.title}</NotificationTitle>
                <NotificationDescription>{notification.description}</NotificationDescription>
                <NotificationDescription>{notification.timestamp}</NotificationDescription>
              </NotificationItem>
            ))
          )}
        </NotificationList>
      </NotificationsPanel>
    </>
  );
};

export default Notifications;