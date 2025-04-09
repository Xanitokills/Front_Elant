import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import logoSoftHome from "../../public/LogoSoftHome/Logo_SoftHome_1.png";
import ImagenLoginDefault from "../images/fachada_canada.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState<{ imageData: string; imageName: string }[]>([]);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Refs para el div con las imágenes
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Obtener las dimensiones del div
  useEffect(() => {
    if (imageContainerRef.current) {
      const { offsetWidth, offsetHeight } = imageContainerRef.current;
      console.log("Ancho del contenedor de la imagen:", offsetWidth);
      console.log("Alto del contenedor de la imagen:", offsetHeight);
    }
  }, []);

  // Manejo de login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  // Redirección a dashboard si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Obtener imágenes de anuncios
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/get-login-images`);
        if (Array.isArray(response.data.images)) {
          setImages(response.data.images);
        } else {
          console.error("Respuesta no válida para imágenes", response.data);
          setImages([]);
        }
      } catch (error) {
        console.error("Error al obtener las imágenes:", error);
        setImages([]);
      }
    };

    fetchImages();
  }, []);

  // Cambio de imagen cada 5 segundos
  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev + 1) % images.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [images]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-10 md:pt-0">
      {/* Lado izquierdo - Formulario de inicio de sesión */}
      <div className="flex flex-col justify-center items-center bg-white p-8 w-full md:w-1/2 shadow-md z-10">
        <img
          src={logoSoftHome}
          alt="Logo SoftHome"
          className="mb-2 w-48 h-auto"
        />
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Iniciar Sesión</h1>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700">Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-[rgb(47,140,152)] hover:bg-[rgb(35,105,115)] text-white py-2 px-4 rounded-lg shadow-md transition"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>

      {/* Lado derecho - Carrusel de imágenes (Anuncios) */}
      <div
        ref={imageContainerRef}
        className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Fondo con filtro blur */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url('${
              images.length > 0 ? images[currentImage].imageData : ImagenLoginDefault
            }')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: "100%",
            filter: "blur(10px)",
            zIndex: -1,
          }}
        ></div>

        {/* Imagen principal sin blur */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{
            backgroundImage: `url('${
              images.length > 0 ? images[currentImage].imageData : ImagenLoginDefault
            }')`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            height: "100%",
            zIndex: 0,
          }}
        ></div>

        {/* Paginación de imágenes */}
        {images.length > 0 && (
          <div className="relative z-10 flex justify-center mt-auto mb-6 space-x-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  index === currentImage ? "bg-white" : "bg-white/50"
                }`}
              ></button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
