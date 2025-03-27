import { useState } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const token = localStorage.getItem("token");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setMessage({ text: "Por favor, completa todos los campos", type: "error" });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: "Las contraseñas nuevas no coinciden", type: "error" });
      return;
    }

    if (formData.newPassword.length < 8) {
      setMessage({ text: "La nueva contraseña debe tener al menos 8 caracteres", type: "error" });
      return;
    }

    try {
      const response = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Contraseña cambiada exitosamente", type: "success" });
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ text: data.message || "Error al cambiar la contraseña", type: "error" });
      }
    } catch (error) {
      setMessage({ text: "Error de conexión: " + error, type: "error" });
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Cambiar Contraseña</h1>

      {/* Mensaje de éxito o error */}
      {message.text && (
        <div
          className={`p-4 mb-6 rounded-lg flex items-center ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <FaCheckCircle className="mr-2" />
          ) : (
            <FaExclamationCircle className="mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Formulario para cambiar contraseña */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Actualizar Contraseña</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña Actual *</label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nueva Contraseña *</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirmar Nueva Contraseña *</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Cambiar Contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;