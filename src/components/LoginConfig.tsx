import { useState } from "react";
import { useAuth } from "../context/AuthContext"; // Importar el contexto
import axios from "axios";

const LoginConfigPage = () => {
  const [imageFile, setImageFile] = useState<File | null>(null); // Guardar el archivo de la imagen
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Para la vista previa de la imagen
  const [error, setError] = useState<string>("");  // Para manejar errores
  const { userId } = useAuth(); // Obtener el userId desde el contexto de autenticación

  // Función para manejar la selección de la imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);

        // Crear vista previa de la imagen
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Por favor, seleccione un archivo de imagen válido.");
      }
    }
  };

  const handleSaveImage = async () => {
    if (!imageFile) {
      setError("Debe seleccionar una imagen.");
      return;
    }
  
    if (!userId) {
      setError("No se ha encontrado el userId.");
      return;
    }
  
    const formData = new FormData();
    formData.append("image", imageFile); // Se añade el archivo de imagen
    formData.append("userId", userId.toString()); // Se añade el userId dinámicamente, asegurándonos de enviarlo como string
  
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/upload-login-images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response.data); // Si la imagen se sube correctamente
      setError(""); // Limpiar cualquier error
    } catch (error: any) {
      console.error("Error al subir la imagen:", error);
      if (error.response) {
        setError(`Error al subir la imagen: ${error.response.data.message || error.response.statusText}`);
      } else {
        setError("Error de red o no se recibió respuesta del servidor.");
      }
    }
  };
  

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Configuración de Imágenes de Login</h2>

      {/* Selector de imagen */}
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="mb-4 p-2 border rounded"
        />
        {imagePreview && (
          <div className="mb-4">
            <img src={imagePreview} alt="Vista previa" className="w-32 h-32 object-cover" />
          </div>
        )}
        <button
          onClick={handleSaveImage}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Guardar Imagen
        </button>
      </div>

      {/* Mostrar errores si hay */}
      {error && <div className="text-red-500 mb-4">{error}</div>}
    </div>
  );
};

export default LoginConfigPage;
