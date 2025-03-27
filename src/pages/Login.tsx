import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !password) {
      setError("Por favor, completa todos los campos");
      setIsSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, introduce un correo válido");
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      const err = error as Error;
      console.error("Error al iniciar sesión:", err);
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
  className="relative flex items-center justify-center min-h-screen bg-center"
  style={{
    backgroundImage: `url('/images/fachada_canada.jpg')`,
    backgroundSize: "75%", // Adjust this percentage to make the image smaller
  }}
>
      {/* Black overlay with opacity */}
      <div className="absolute inset-0 bg-black opacity-50"></div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full z-10" // z-10 ensures the form is above the overlay
      >
        <h2 className="text-4xl font-extrabold text-center text-gray-700 mb-6">Bienvenido</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <label className="block text-lg font-medium text-gray-600">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Introduce tu correo"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 hover:shadow-md"
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-5">
            <label className="block text-lg font-medium text-gray-600">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduce tu contraseña"
              className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 hover:shadow-md"
              disabled={isSubmitting}
            />
          </div>
          <motion.button
            type="submit"
            whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
            className={`w-full py-3 bg-blue-600 text-white text-xl font-semibold rounded-lg transition duration-300 shadow-lg ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;