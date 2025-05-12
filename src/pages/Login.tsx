import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../context/AuthContext";
import {
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaUser,
  FaLock,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import axios from "axios";
import logoSoftHome from "../../public/LogoSoftHome/Logo_SoftHome_1.png";
import ImagenLoginDefault from "../../public/images/SoftHome_login_2.png";

const COLOR_DARK_GRAY = "#4a5568";
const COLOR_LIGHT_BLUE = "#93c5fd";
const COLOR_BLUE = "#60a5fa";
const COLOR_TEAL = "#6caeb6";
const COLOR_WHITE = "#ffffff";
const COLOR_CHARCOAL = "#1a202c";

const Login = () => {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState([]);
  const [forgotDni, setForgotDni] = useState("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [codeTimer, setCodeTimer] = useState(900);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const imageContainerRef = useRef(null);
  const inputRefs = useRef([]);

  const validateDNI = (dni) => /^[a-zA-Z0-9]{1,12}$/.test(dni);

  useEffect(() => {
    if (loginError || recoveryError || successMessage) {
      const timer = setTimeout(() => {
        setLoginError("");
        setRecoveryError("");
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loginError, recoveryError, successMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    if (!validateDNI(dni)) {
      setLoginError("El DNI debe tener hasta 12 caracteres alfanuméricos");
      setIsSubmitting(false);
      return;
    }
    try {
      await login(dni, password);
    } catch (err) {
      const error = err;
      let errorMessage =
        "Error al iniciar sesión. Por favor, intenta de nuevo.";
      switch (error.code) {
        case "USER_NOT_FOUND":
          errorMessage = "Usuario no encontrado";
          break;
        case "ACCOUNT_LOCKED":
          errorMessage =
            "Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador.";
          break;
        case "INVALID_PASSWORD":
          errorMessage = "Contraseña incorrecta";
          break;
        case "VALIDATION_ERROR":
          errorMessage = "Faltan campos requeridos";
          break;
        default:
          if (error.data?.message) errorMessage = error.data.message;
          break;
      }
      setLoginError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateDNI(forgotDni)) {
      setRecoveryError("DNI inválido");
      return;
    }
    setIsSendingCode(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/forgot-password`,
        { dni: forgotDni }
      );
      setEmail(response.data.email);
      setCodeSent(true);
      setCodeTimer(900);
      setRecoveryError("");
      setCodeAttempts(0);
    } catch (err) {
      setRecoveryError(
        err.response?.data?.message ||
          "DNI no encontrado o error al enviar código"
      );
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const code = verificationCode.join("");
    setIsVerifying(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/verify-code`,
        {
          dni: forgotDni,
          code,
        }
      );
      if (response.data.success) {
        setRecoveryError("");
        setSuccessMessage(
          "¡Código verificado! Se ha enviado una nueva contraseña a tu correo."
        );
        setShowRecoveryModal(false);
        setCodeSent(false);
        setVerificationCode(["", "", "", "", "", ""]);
        setForgotDni("");
        setCodeAttempts(0);
      } else {
        setVerificationCode(["", "", "", "", "", ""]);
        const msg = response.data.message || "Código inválido";
        if (msg === "Código inválido. Se ha superado el número de intentos.") {
          setCodeAttempts(3);
          setRecoveryError(msg);
          setTimeout(() => {
            setShowRecoveryModal(false);
            setCodeSent(false);
            setVerificationCode(["", "", "", "", "", ""]);
            setForgotDni("");
            setCodeAttempts(0);
          }, 1000);
        } else {
          const match = msg.match(/Intento (\d) de 3/);
          const nuevosIntentos = match
            ? parseInt(match[1], 10)
            : codeAttempts + 1;
          setCodeAttempts(nuevosIntentos);
          setRecoveryError(msg);
        }
      }
    } catch (err) {
      setVerificationCode(["", "", "", "", "", ""]);
      const msg = err.response?.data?.message || "Código inválido";
      if (msg === "Código inválido. Se ha superado el número de intentos.") {
        setCodeAttempts(3);
        setRecoveryError(msg);
        setTimeout(() => {
          setShowRecoveryModal(false);
          setCodeSent(false);
          setVerificationCode(["", "", "", "", "", ""]);
          setForgotDni("");
          setCodeAttempts(0);
        }, 2000);
      } else {
        const match = msg.match(/Intento (\d) de 3/);
        const nuevosIntentos = match
          ? parseInt(match[1], 10)
          : codeAttempts + 1;
        setCodeAttempts(nuevosIntentos);
        setRecoveryError(msg);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    setShowRecoveryModal(false);
    setCodeSent(false);
    setVerificationCode(["", "", "", "", "", ""]);
    setForgotDni("");
    setCodeAttempts(0);
    setRecoveryError("");
  };

  const handleCodeChange = (index, value) => {
    if (/^[0-9a-fA-F]?$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value.toLowerCase();
      setVerificationCode(newCode);
      if (value && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleCodePaste = (e) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9a-fA-F]/g, "")
      .slice(0, 6)
      .toLowerCase();
    if (pasted.length === 6) {
      setVerificationCode(pasted.split(""));
      inputRefs.current[5].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const maskEmail = (email) => {
    const [user, domain] = email.split("@");
    const maskedUser = user.slice(0, 2) + "*".repeat(user.length - 2);
    return `${maskedUser}@${domain}`;
  };

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
    if (codeSent && codeTimer > 0) {
      const timer = setInterval(() => setCodeTimer((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
    if (codeTimer === 0) {
      setCodeSent(false);
      setRecoveryError("El código ha expirado. Solicite un nuevo código.");
    }
  }, [isAuthenticated, codeSent, codeTimer, navigate]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/get-login-images`)
      .then((res) => {
        setImages(Array.isArray(res.data.images) ? res.data.images : []);
      })
      .catch(() => setImages([]));
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(
        () => setCurrentImage((prev) => (prev + 1) % images.length),
        5000
      );
      return () => clearInterval(interval);
    }
  }, [images]);

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row pt-10 md:pt-0"
      style={{ backgroundColor: COLOR_WHITE }}
    >
      <div className="flex flex-col justify-center items-center p-8 w-full md:w-1/2 bg-white shadow-md z-10">
        <div className="relative mb-6">
          <img
            src={logoSoftHome}
            alt="Logo SoftHome"
            className="w-48 h-auto relative z-10 animate-contour-glow"
          />
        </div>
        <div className="w-full max-w-md">
          <h1
            className="text-3xl font-bold mb-6 text-center"
            style={{ color: COLOR_DARK_GRAY }}
          >
            Iniciar Sesión
          </h1>
          {loginError && (
            <div className="flex items-center bg-red-100 text-red-600 text-sm mb-4 p-3 rounded-lg shadow-sm animate-fade-in">
              <FaExclamationCircle className="mr-2" />
              <span>{loginError}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center bg-green-100 text-green-600 text-sm mb-4 p-3 rounded-lg shadow-sm animate-fade-in">
              <FaCheckCircle className="mr-2" />
              <span>{successMessage}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <FaUser
                className="absolute left-3 top-2.5"
                style={{ color: COLOR_TEAL }}
              />
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="DNI"
                required
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                style={{
                  backgroundColor: COLOR_WHITE,
                  borderColor: COLOR_DARK_GRAY,
                }}
                disabled={isSubmitting}
              />
            </div>
            <div className="relative">
              <FaLock
                className="absolute left-3 top-2.5"
                style={{ color: COLOR_TEAL }}
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                required

                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                style={{
                  backgroundColor: COLOR_WHITE,
                  borderColor: COLOR_DARK_GRAY,
                }}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 hover:text-blue-400 transition-colors duration-200"
                style={{ color: COLOR_DARK_GRAY }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full text-white py-2 px-4 rounded-lg shadow-md flex items-center justify-center relative overflow-hidden transition-all duration-300 button-glow"
              style={{ backgroundColor: COLOR_BLUE }}
              disabled={isSubmitting}
            >
              <span className="relative z-10 flex items-center">
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-3" />
                    Procesando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </span>
            </button>
            <div className="text-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRecoveryModal(true);
                  setSuccessMessage("");
                }}
                className="hover:underline hover:text-blue-400 transition-colors duration-200"
                style={{ color: COLOR_LIGHT_BLUE }}
              >
                ¿Olvidé mi contraseña?
              </a>
            </div>
          </form>
        </div>
      </div>

      <div
        ref={imageContainerRef}
        className="image-section w-full md:w-1/2 flex items-center justify-center relative min-h-[50vh] md:min-h-screen"
        style={{
          background: `linear-gradient(to bottom, ${COLOR_LIGHT_BLUE}80, ${COLOR_WHITE})`,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center blur-md"
          style={{
            backgroundImage: `url('${
              images[currentImage]?.imageData || ImagenLoginDefault
            }')`,
            backgroundSize: "cover",
            backgroundColor: `${COLOR_LIGHT_BLUE}40`,
          }}
        ></div>
        <div
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${
              images[currentImage]?.imageData || ImagenLoginDefault
            }')`,
          }}
        ></div>
      </div>

      <Transition appear show={showRecoveryModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6"
                    style={{ color: COLOR_DARK_GRAY }}
                  >
                    {codeSent ? "Verificar Código" : "Recuperar tu Contraseña"}
                  </Dialog.Title>
                  <form
                    onSubmit={
                      codeSent ? handleVerifyCode : handleForgotPassword
                    }
                    className="mt-4 space-y-4"
                  >
                    {!codeSent ? (
                      <>
                        <label
                          className="block text-sm font-medium"
                          style={{ color: COLOR_DARK_GRAY }}
                        >
                          Ingresa tu DNI para recuperar tu contraseña
                        </label>
                        <div className="relative">
                          <FaUser
                            className="absolute left-3 top-2.5"
                            style={{ color: COLOR_TEAL }}
                          />
                          <input
                            type="text"
                            value={forgotDni}
                            onChange={(e) => setForgotDni(e.target.value)}
                            maxLength={12}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                            style={{
                              backgroundColor: COLOR_WHITE,
                              borderColor: COLOR_DARK_GRAY,
                            }}
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full text-white py-2 px-4 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 button-glow"
                          style={{ backgroundColor: COLOR_BLUE }}
                          disabled={isSendingCode}
                        >
                          <span className="relative z-10 flex items-center">
                            {isSendingCode ? (
                              <>
                                <FaSpinner className="animate-spin mr-3" />
                                Enviando...
                              </>
                            ) : (
                              "Enviar Código"
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="w-full text-gray-600 py-2 px-4 rounded-lg border border-gray-300 flex items-center justify-center transition-all duration-300 hover:bg-gray-100"
                          style={{ color: COLOR_DARK_GRAY }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <p
                          className="text-sm"
                          style={{ color: COLOR_DARK_GRAY }}
                        >
                          Se envió un código a: {maskEmail(email)} (expira en{" "}
                          {formatTimer(codeTimer)})
                        </p>
                        <label
                          className="block text-sm font-medium"
                          style={{ color: COLOR_DARK_GRAY }}
                        >
                          Código
                        </label>
                        <div
                          className="flex space-x-2 justify-center"
                          onPaste={handleCodePaste}
                        >
                          {verificationCode.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) =>
                                handleCodeChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              ref={(el) => (inputRefs.current[index] = el)}
                              className="w-10 h-10 text-center border rounded-lg focus:ring-2 focus:ring-blue-300 transition-all duration-300"
                              style={{
                                backgroundColor: COLOR_WHITE,
                                borderColor: COLOR_DARK_GRAY,
                              }}
                              required
                            />
                          ))}
                        </div>
                        {codeAttempts > 0 && codeAttempts < 3 && (
                          <p className="text-sm text-red-400">
                            Intento {codeAttempts} de 3
                          </p>
                        )}
                        <button
                          type="submit"
                          className="w-full text-white py-2 px-4 rounded-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 button-glow"
                          style={{ backgroundColor: COLOR_BLUE }}
                          disabled={isVerifying}
                        >
                          <span className="relative z-10 flex items-center">
                            {isVerifying ? (
                              <>
                                <FaSpinner className="animate-spin mr-3" />
                                Verificando...
                              </>
                            ) : (
                              "Verificar"
                            )}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="w-full text-gray-600 py-2 px-4 rounded-lg border border-gray-300 flex items-center justify-center transition-all duration-300 hover:bg-gray-100"
                          style={{ color: COLOR_DARK_GRAY }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {recoveryError && (
                      <p className="flex items-center bg-red-100 text-red-600 text-sm p-3 rounded-lg shadow-sm animate-fade-in">
                        <FaExclamationCircle className="mr-2" />
                        <span>{recoveryError}</span>
                      </p>
                    )}
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      <style jsx>{`
        @media (max-width: 767px) {
          .image-section {
            display: none;
          }
          .min-h-screen {
            flex-direction: column;
          }
          .flex-col {
            width: 100%;
          }
        }
        .animate-contour-glow {
          position: relative;
          filter: url(#glow-filter);
        }
        .animate-contour-glow::after {
          content: "";
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(
            45deg,
            rgba(147, 197, 253, 0) 0%,
            rgba(147, 197, 253, 0.8) 25%,
            rgba(147, 197, 253, 0) 50%,
            rgba(147, 197, 253, 0.8) 75%,
            rgba(147, 197, 253, 0) 100%
          );
          background-size: 200% 200%;
          animation: glowTrail 3s linear infinite;
          z-index: 0;
          mix-blend-mode: overlay;
        }
        .button-glow {
          position: relative;
          transition: all 0.3s ease-in-out;
        }
        .button-glow::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at center,
            rgba(147, 197, 253, 0.4) 0%,
            transparent 70%
          );
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
          z-index: 0;
        }
        .button-glow:hover::before {
          opacity: 1;
        }
        .button-glow:hover {
          background-color: #3b82f6;
          box-shadow: 0 0 10px rgba(147, 197, 253, 0.4);
        }
        .button-glow:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          box-shadow: none;
        }
        .button-glow:disabled::before {
          opacity: 0;
        }
        @keyframes glowTrail {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 200% 200%;
          }
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-out {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in forwards;
        }
        .animate-fade-out {
          animation: fade-out 0.3s ease-out forwards;
        }
      `}</style>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="glow-filter">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feFlood floodColor="#93c5fd" floodOpacity="0.7" result="color" />
            <feComposite
              in="color"
              in2="blur"
              operator="in"
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Login;