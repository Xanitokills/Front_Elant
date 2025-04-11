import { useState } from "react";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md mt-10">
      <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Contraseña Actual</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Nueva Contraseña</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Confirmar Contraseña</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={handleChangePassword}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Cambiar Contraseña
      </button>
    </div>
  );
};

export default ChangePassword;
