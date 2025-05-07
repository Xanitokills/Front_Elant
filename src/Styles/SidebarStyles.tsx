import styled from "styled-components";

export const SpinnerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 3000;
`;

export const Spinner = styled.div`
  border: 2px solid #e5e7eb; /* Fondo gris claro del círculo */
  border-top: 2px solid #3b82f6; /* Borde superior azul para el llenado */
  border-left: 2px solid transparent; /* Borde izquierdo transparente */
  border-right: 2px solid transparent; /* Borde derecho transparente */
  border-bottom: 2px solid transparent; /* Borde inferior transparente */
  border-radius: 50%;
  width: 32px; /* Tamaño más pequeño */
  height: 32px;
  animation: fill 0.7s linear infinite; /* Animación más rápida y fluida */

  @keyframes fill {
    0% {
      transform: rotate(0deg);
      border-top-color: #3b82f6;
    }
    25% {
      transform: rotate(90deg);
      border-right-color: #3b82f6;
    }
    50% {
      transform: rotate(180deg);
      border-bottom-color: #3b82f6;
    }
    75% {
      transform: rotate(270deg);
      border-left-color: #3b82f6;
    }
    100% {
      transform: rotate(360deg);
      border-top-color: #3b82f6;
    }
  }
`;

export const SpinnerText = styled.p`
  color: #ffffff;
  margin-top: 8px; /* Espaciado reducido */
  font-size: 0.9rem; /* Texto más pequeño */
  font-weight: 500;
`;