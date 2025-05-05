import styled, { keyframes } from "styled-components";

// Animaciones
export const slideInDown = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  100% { opacity: 1; transform: translateY(0); }
`;

export const fadeIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
`;

export const spin = keyframes`
  to { transform: rotate(360deg); }
`;

// Contenedores principales
export const Container = styled.div`
  padding: 1.5rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  min-height: 100vh;
  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 1.5rem;
  animation: ${slideInDown} 0.5s ease-out;
  text-align: center;
  @media (min-width: 640px) {
    text-align: left;
  }
`;

export const Card = styled.div`
  background: linear-gradient(145deg, #ffffff 0%, #f9fafb 100%);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: ${fadeIn} 0.5s ease-out;
  border: 1px solid #e5e7eb;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  }
  @media (min-width: 768px) {
    padding: 1.25rem;
  }
`;

export const TableContainer = styled.div`
  overflow-x: auto;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

export const SpinnerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export const Spinner = styled.div`
  border: 8px solid #e5e7eb;
  border-top: 8px solid #2563eb;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  animation: ${spin} 0.8s linear infinite;
`;

export const SpinnerText = styled.p`
  margin-top: 1rem;
  color: white;
  font-size: 1.125rem;
  font-weight: 500;
`;

export const ProfileImage = styled.img`
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e5e7eb;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.05);
  }
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  background: #ffffff;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const InfoItem = styled.div`
  background: #f9fafb;
  padding: 1.25rem;
  border-radius: 0.375rem;
  animation: ${fadeIn} 0.4s ease-out;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    background: #f3f4f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  animation: ${fadeIn} 0.3s ease-out;
  text-align: center;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  @media (min-width: 640px) {
    text-align: left;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  color: #6b7280;
  transition: color 0.2s ease;
  &:hover {
    color: #1f2937;
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const PrimaryButton = styled(ActionButton)`
  background: #2563eb;
  color: white;
  &:hover {
    background: #1d4ed8;
  }
  &:disabled {
    background: #93c5fd;
    cursor: not-allowed;
  }
  &.small-button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    border-radius: 0.375rem;
  }
`;

export const SecondaryButton = styled(ActionButton)`
  background: #e5e7eb;
  color: #1f2937;
  &:hover {
    background: #d1d5db;
  }
`;

export const DangerButton = styled(ActionButton)`
  background: #ef4444;
  color: white;
  &:hover {
    background: #dc2626;
  }
`;

export const WarningButton = styled(ActionButton)`
  background: #f59e0b;
  color: white;
  &:hover {
    background: #d97706;
  }
`;

export const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  /* Ajustar el tamaño de los inputs y selects dentro del contenedor */
  & > div {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    @media (min-width: 640px) {
      flex-direction: row;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  }

  /* Reducir el ancho de los selects e inputs para FASE_AND_DEPARTAMENTO */
  & select,
  & input {
    max-width: 100%;
    @media (min-width: 640px) {
      max-width: 12rem; /* Limita el ancho de los combos y el input */
    }
  }

  /* Ajustar el botón de búsqueda */
  & button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  /* Estilos para el contenedor de SwitchContainer y botón Registrar Persona */
  & > div:last-child {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
  }
`;

export const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  font-weight: 500;
  color: #1f2937;
`;

export const Input = styled.input`
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

export const Select = styled.select`
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

// Componentes del modal
export const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  max-width: ${(props: { mode: string }) =>
    props.mode === "view" ? "64rem" : props.mode === "roles" ? "48rem" : "48rem"};
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;

  /* Ajustar el layout interno para el modo roles */
  &[mode="roles"] {
    & > div {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Ajustar el contenedor de los InfoItem para que sean más anchos */
    & ${InfoItem} {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1.25rem;
    }

    /* Asegurar que los inputs y selects sean más anchos */
    & input,
    & .react-select__control {
      width: 100%;
      max-width: 36rem;
    }

    /* Ajustar los botones para que se alineen mejor */
    & > div:last-child {
      flex-direction: row;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }
`;