import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import fachada from "../images/fachada_canada.jpg";
import logoSoftHome from "../../public/LogoSoftHome/Logo_SoftHome_1.png";
const images = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  fachada,
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row pt-10 md:pt-0">
      {/* Lado izquierdo */}
      <div className="flex flex-col justify-center items-center bg-white p-8 w-full md:w-1/2 shadow-md z-10">
        {/* Logo de la empresa */}
        <img
          src={logoSoftHome}
          alt="Logo SoftHome"
          className="mb-2 w-48 h-auto"
        />{" "}
        {/* Ajusta el tamaño */}
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            Iniciar Sesión
          </h1>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                placeholder="correo@ejemplo.com"
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
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> Recordarme
              </label>
              <a href="#" className="text-blue-600 hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
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

      {/* Lado derecho con carrusel de imágenes */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url('${images[currentImage]}')` }}
        ></div>
        {/* Paginación */}
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
      </div>
    </div>
  );
};

export default Login;
