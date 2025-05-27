import { useState } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  const handleChangePassword = async () => {
    console.log("🔐 Token almacenado:", token);
    console.log("📦 currentPassword:", currentPassword);
    console.log("📦 newPassword:", newPassword);
    console.log("📦 confirmPassword:", confirmPassword);

    if (!currentPassword || !newPassword || !confirmPassword) {
      console.warn("⚠️ Campos vacíos detectados");
      return Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Todos los campos son obligatorios.",
        timer: 2500,
        showConfirmButton: false,
      });
    }

    if (newPassword !== confirmPassword) {
      console.warn("❌ Las contraseñas no coinciden");
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden.",
        timer: 2500,
        showConfirmButton: false,
      });
    }

    setIsSubmitting(true);

    try {
      const url = `${API_URL}/auth/change-password`;
      console.log("🌐 Enviando solicitud PUT a:", url);

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      console.log("📥 Código de respuesta:", res.status);

      const data = await res.json();
      console.log("📨 Respuesta del servidor:", data);

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Contraseña actualizada",
          text: "Tu contraseña fue cambiada con éxito.",
          timer: 2500,
          showConfirmButton: false,
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "No se pudo actualizar la contraseña.",
        });
      }
    } catch (error) {
      console.error("❌ Error al conectar con el servidor:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al conectar con el servidor.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 w-full max-w-[1440px] mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
        Cambiar Contraseña
      </h2>
      <div className="bg-white rounded-lg p-4 md:p-8 shadow-lg">
        <div className="space-y-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Contraseña Actual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Ingresa tu contraseña actual"
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Nueva Contraseña
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Ingresa tu nueva contraseña"
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-600 mb-1">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              className="p-2 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={isSubmitting}
              className={`py-2 px-4 rounded flex items-center justify-center transition ${
                isSubmitting
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Cambiando...
                </>
              ) : (
                "Cambiar Contraseña"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;