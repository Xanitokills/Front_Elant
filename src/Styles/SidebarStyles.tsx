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
  padding: 0.75rem; /* Reduced padding for mobile */
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  animation: ${fadeIn} 0.5s ease-out;
  border: 1px solid #e5e7eb;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  width: 8rem; /* Slightly smaller for mobile */
  height: 8rem;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e5e7eb;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  &:hover {
    transform: scale(1.05);
  }
  @media (min-width: 640px) {
    width: 10rem;
    height: 10rem;
    border: 4px solid #e5e7eb;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem; /* Reduced gap for mobile */
  background: #ffffff;
  padding: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  @media (min-width: 640px) {
    gap: 1rem;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

export const InfoItem = styled.div`
  background: #f9fafb;
  padding: 0.75rem; /* Reduced padding for mobile */
  border-radius: 0.375rem;
  animation: ${fadeIn} 0.4s ease-out;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid #e5e7eb; /* Subtle border for better separation */
  &:hover {
    background: #f3f4f6;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }
  @media (min-width: 640px) {
    padding: 1.25rem;
  }

  label {
    font-size: 0.75rem; /* Smaller font for mobile */
    font-weight: 600;
    color: #4b5563;
    @media (min-width: 640px) {
      font-size: 0.875rem;
    }
  }

  p {
    margin-top: 0.25rem;
    font-size: 0.875rem; /* Slightly smaller text for mobile */
    color: #1f2937;
    @media (min-width: 640px) {
      font-size: 1rem;
    }
  }
`;

export const SectionTitle = styled.h2`
  font-size: 1.25rem; /* Smaller for mobile */
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  animation: ${fadeIn} 0.3s ease-out;
  text-align: center;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  @media (min-width: 640px) {
    font-size: 1.5rem;
    text-align: left;
    margin-bottom: 1.5rem;
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
  padding: 0.5rem 1rem; /* Smaller padding for mobile */
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem; /* Smaller font for mobile */
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  @media (min-width: 640px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
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

  & select,
  & input {
    max-width: 100%;
    @media (min-width: 640px) {
      max-width: 12rem;
    }
  }

  & button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

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
  padding: 0.5rem; /* Smaller padding for mobile */
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  outline: none;
  font-size: 0.875rem; /* Smaller font for mobile */
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  @media (min-width: 640px) {
    padding: 0.75rem;
    font-size: 1rem;
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  outline: none;
  font-size: 0.875rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
  @media (min-width: 640px) {
    padding: 0.75rem;
    font-size: 1rem;
  }

  & .react-select__control {
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.25rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }

  & .react-select__menu {
    z-index: 9999;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-top: 0.25rem;
    overflow: visible;
  }

  & .react-select__menu-list {
    padding: 0;
    border-radius: 0.5rem;
  }

  & .react-select__option {
    padding: 0.75rem;
    cursor: pointer;
    &:hover {
      background: #f3f4f6;
    }
  }
`;

export const ModalContent = styled.div`
  background: white;
  padding: 1.5rem; /* Reduced padding for mobile */
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
  width: 100%;
  max-width: ${(props: { mode: string }) =>
    props.mode === "view" ? "64rem" : "48rem"};
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;

  & > div {
    display: flex;
    flex-direction: column;
    align-items: center;
    @media (min-width: 640px) {
      display: grid;
      grid-template-columns: 1fr 2fr;
      align-items: start;
      gap: 1.5rem;
    }
  }

  /* Adjust the grid for Información Adicional section */
  & .additional-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* Two columns for all screen sizes */
    gap: 0.75rem;
    @media (min-width: 640px) {
      gap: 1rem;
    }
  }
`;

export const RolesModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  width: 100%;
  max-width: 48rem;
  animation: ${fadeIn} 0.3s ease-out;
  position: relative;

  & > div {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
`;

export const RolesModalInfoItem = styled.div`
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

export const RolesModalSelect = styled.select`
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

  & .react-select__control {
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    padding: 0.25rem;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    &:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }

  & .react-select__menu {
    position: fixed;
    z-index: 10000;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    margin-top: 0.25rem;
    background: white;
    width: inherit;
  }

  & .react-select__menu-list {
    padding: 0;
    border-radius: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
  }

  & .react-select__option {
    padding: 0.75rem;
    cursor: pointer;
    &:hover {
      background: #f3f4f6;
    }
  }
`;