import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  const [images, setImages] = useState<{ imageData: string; imageName: string }[]>([]);
  const [forgotDni, setForgotDni] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState("");
  const [codeAttempts, setCodeAttempts] = useState(0);
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [codeTimer, setCodeTimer] = useState(900); // 15 minutos en segundos
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (imageContainerRef.current) {
      const { offsetWidth, offsetHeight } = imageContainerRef.current;
      console.log("Ancho del contenedor de la imagen:", offsetWidth);
      console.log("Alto del contenedor de la imagen:", offsetHeight);
    }
  }, []);

  const validateDNI = (dni: string) => {
    const dniRegex = /^[a-zA-Z0-9]{1,12}$/;
    return dniRegex.test(dni);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al iniciar sesión, por favor intenta de nuevo");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) console.log("Login - Estado error renderizado:", error);
  }, [error]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/get-login-images`);
        if (Array.isArray(response.data.images)) setImages(response.data.images);
        else setImages([]);
      } catch (error) {
        console.error("Error al obtener las imágenes:", error);
        setImages([]);
      }
    };
    fetchImages();
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  useEffect(() => {
    if (codeSent && codeTimer > 0) {
      const timer = setInterval(() => {
        setCodeTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
    if (codeTimer === 0) {
      setCodeSent(false);
      setError("El código ha expirado. Solicite un nuevo código.");
    }
  }, [codeSent, codeTimer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDNI(forgotDni)) {
      setError("DNI inválido");
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/forgot-password`, { dni: forgotDni });
      setEmail(response.data.email);
      setCodeSent(true);
      setCodeTimer(900); // Reiniciar temporizador a 15 minutos
      setError(`Código enviado con éxito a ${response.data.email}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "DNI no encontrado o error al enviar código");
    }
  };

const handleVerifyCode = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/verify-code`, {
      dni: forgotDni,
      code: verificationCode,
    });
    if (response.data.success) {
      navigate(`/reset-password/${forgotDni}`);
    } else {
      setCodeAttempts(codeAttempts + 1);
      setError(response.data.message); // Mostrar mensaje del backend
    }
  } catch (err: any) {
    setCodeAttempts(codeAttempts + 1);
    setError(err.response?.data?.message || "Error al verificar código");
  }
};

  const maskEmail = (email: string) => {
    const [user, domain] = email.split("@");
    const maskedUser = user.slice(0, 2) + "*".repeat(user.length - 2);
    return `${maskedUser}@${domain}`;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-10 md:pt-0 bg-gray-100">
      <div className="flex flex-col justify-center items-center p-8 w-full md:w-1/2 bg-white shadow-md z-10">
        <img src={logoSoftHome} alt="Logo SoftHome" className="mb-6 w-48 h-auto" />
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">Iniciar Sesión</h1>
          {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI</label>
              <input
                type="text"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="12345678"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 pr-10"
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                  disabled={isSubmitting}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-md transition flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
            <div className="text-center">
              <a href="#forgot" onClick={() => { setShowForgotForm(true); setCodeSent(false); }} className="text-blue-600 hover:underline">
                ¿Olvidé mi contraseña?
              </a>
            </div>
          </form>

          {/* Sección de recuperación de contraseña */}
          {(showForgotForm || codeSent) && (
            <form onSubmit={codeSent ? handleVerifyCode : handleForgotPassword} className="mt-6 space-y-4" id="forgot">
              <h2 className="text-xl font-semibold text-gray-800">{codeSent ? "Verificar Código" : "Recuperar Contraseña"}</h2>
              {!codeSent ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">DNI</label>
                    <input
                      type="text"
                      value={forgotDni}
                      onChange={(e) => setForgotDni(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="12345678"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md transition"
                  >
                    Enviar Código
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-600">
                      Se envió un código a: {maskEmail(email)} (expira en {formatTimer(codeTimer)})
                    </p>
                    <label className="block text-sm font-medium text-gray-700">Código</label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="123456"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow-md transition"
                  >
                    Verificar
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>

      <div
        ref={imageContainerRef}
        className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-purple-500 to-white"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url('${images.length > 0 ? images[currentImage].imageData : ImagenLoginDefault}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "100%",
            filter: "blur(10px)",
            zIndex: -1,
          }}
        ></div>
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url('${images.length > 0 ? images[currentImage].imageData : ImagenLoginDefault}')`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            height: "100%",
            zIndex: 0,
          }}
        ></div>
        {images.length > 0 && (
          <div className="relative z-10 flex justify-center mt-auto mb-6 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${index === currentImage ? "bg-white" : "bg-white/50"}`}
              ></button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;