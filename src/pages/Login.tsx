import { useState, useEffect, useRef, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth, CustomError } from "../context/AuthContext";
import { FaEye, FaEyeSlash, FaSpinner } from "react-icons/fa";
import axios from "axios";
import logoSoftHome from "../../public/LogoSoftHome/Logo_SoftHome_1.png";
import ImagenLoginDefault from "../images/fachada_canada.jpg";

const Login = () => {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState([]);
  const [forgotDni, setForgotDni] = useState("");
  const [verificationCode, setVerificationCode] = useState(["", "", "", "", "", ""]);
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [codeTimer, setCodeTimer] = useState(900);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const imageContainerRef = useRef(null);
  const inputRefs = useRef([]);

  const validateDNI = (dni) => /^[a-zA-Z0-9]{1,12}$/.test(dni);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    if (!validateDNI(dni)) {
      setError("El DNI debe tener hasta 12 caracteres alfanuméricos");
      setIsSubmitting(false);
      return;
    }
    try {
      await login(dni, password);
    } catch (err) {
      const error = err;
      let errorMessage = "Error al iniciar sesión. Por favor, intenta de nuevo.";
      switch (error.code) {
        case "USER_NOT_FOUND":
          errorMessage = "Usuario no encontrado";
          break;
        case "ACCOUNT_LOCKED":
          errorMessage = "Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador.";
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
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!validateDNI(forgotDni)) {
      setError("DNI inválido");
      return;
    }
    setIsSendingCode(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/forgot-password`, { dni: forgotDni });
      setEmail(response.data.email);
      setCodeSent(true);
      setCodeTimer(900);
    } catch (err) {
      setError(err.response?.data?.message || "DNI no encontrado o error al enviar código");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const code = verificationCode.join("");
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/verify-code`, {
        dni: forgotDni,
        code,
      });
      if (response.data.success) {
        setError("");
        setShowRecoveryModal(false);
        navigate(`/reset-password/${forgotDni}`);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Error al verificar código";
      setError(msg);
      const match = msg.match(/Intento (\d) de 3/);
      if (match) {
        const intento = parseInt(match[1], 10);
        setCodeAttempts(intento);
      }
    }
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
    const pasted = e.clipboardData.getData("text").replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toLowerCase();
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
      setError("El código ha expirado. Solicite un nuevo código.");
    }
  }, [isAuthenticated, codeSent, codeTimer]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/get-login-images`).then((res) => {
      setImages(Array.isArray(res.data.images) ? res.data.images : []);
    }).catch(() => setImages([]));
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => setCurrentImage((prev) => (prev + 1) % images.length), 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-10 md:pt-0 bg-gray-100">
      <div className="flex flex-col justify-center items-center p-8 w-full md:w-1/2 bg-white shadow-md z-10">
        <img src={logoSoftHome} alt="Logo SoftHome" className="mb-6 w-48 h-auto" />
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Iniciar Sesión</h1>
          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI" required className="w-full px-4 py-2 border rounded-lg bg-gray-50" disabled={isSubmitting} />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" required className="w-full px-4 py-2 border rounded-lg bg-gray-50 pr-10" disabled={isSubmitting} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-500">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg shadow-md flex items-center justify-center" disabled={isSubmitting}>
              {isSubmitting ? (<><FaSpinner className="animate-spin mr-2" />Procesando...</>) : "Iniciar Sesión"}
            </button>
            <div className="text-center">
              <a href="#" onClick={(e) => { e.preventDefault(); setShowRecoveryModal(true); }} className="text-blue-600 hover:underline">
                ¿Olvidé mi contraseña?
              </a>
            </div>
          </form>
        </div>
      </div>

      <div ref={imageContainerRef} className="hidden md:flex w-1/2 items-center justify-center relative bg-gradient-to-b from-purple-500 to-white">
        <div className="absolute inset-0 bg-cover bg-center blur-sm" style={{ backgroundImage: `url('${images[currentImage]?.imageData || ImagenLoginDefault}')`, backgroundSize: "cover" }}></div>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${images[currentImage]?.imageData || ImagenLoginDefault}')`, backgroundSize: "contain" }}></div>
      </div>

      <Transition appear show={showRecoveryModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowRecoveryModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {codeSent ? "Verificar Código" : "Recuperar Contraseña"}
                  </Dialog.Title>
                  <form onSubmit={codeSent ? handleVerifyCode : handleForgotPassword} className="mt-4 space-y-4">
                    {!codeSent ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700">DNI</label>
                        <input type="text" value={forgotDni} onChange={(e) => setForgotDni(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50" required />
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center" disabled={isSendingCode}>
                          {isSendingCode ? (<><FaSpinner className="animate-spin mr-2" />Enviando...</>) : "Enviar Código"}
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          Se envió un código a: {maskEmail(email)} (expira en {formatTimer(codeTimer)})
                        </p>
                        <label className="block text-sm font-medium text-gray-700">Código</label>
                        <div className="flex space-x-2 justify-center" onPaste={handleCodePaste}>
                          {verificationCode.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleCodeChange(index, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              ref={(el) => (inputRefs.current[index] = el)}
                              className="w-10 h-10 text-center border rounded-lg bg-gray-50 focus:ring-2 focus:ring-green-500"
                              required
                            />
                          ))}
                        </div>
                        {codeAttempts > 0 && codeAttempts < 3 && (
                          <p className="text-sm text-red-500">Intento {codeAttempts} de 3</p>
                        )}
                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
                          Verificar
                        </button>
                      </>
                    )}
                    {error && (
                      <p className="text-sm text-red-500 text-center">{error}</p>
                    )}
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default Login;