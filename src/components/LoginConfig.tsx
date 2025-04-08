import { useState } from "react";

const LoginConfigPage = () => {
  const [images, setImages] = useState<string[]>([]);  // Guardar las URLs de las imágenes
  const [imageUrl, setImageUrl] = useState<string>("");  // Almacenar el URL ingresado por el usuario
  const [error, setError] = useState<string>("");  // Para manejar errores

  // Función para agregar la URL de la imagen
  const handleAddImage = () => {
    if (imageUrl.trim() === "") {
      setError("Por favor, ingrese una URL válida.");
      return;
    }
    setImages((prevImages) => [...prevImages, imageUrl]);
    setImageUrl("");  // Limpiar el campo de texto
    setError("");  // Limpiar errores
  };

  // Función para eliminar una imagen de la lista
  const handleRemoveImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Configuración de Imágenes de Login</h2>

      {/* Formulario de entrada para agregar URL de imagen */}
      <div className="mb-4">
        <input
          type="url"
          placeholder="Agregar URL de imagen"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mb-4 p-2 border rounded"
        />
        <button
          onClick={handleAddImage}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Agregar Imagen
        </button>
      </div>

      {/* Mostrar errores si hay */}
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Lista de imágenes configuradas */}
      <div className="mb-4">
        <h3 className="font-semibold">Imágenes configuradas:</h3>
        <ul>
          {images.map((url, index) => (
            <li key={index} className="flex justify-between mb-2">
              <div className="flex items-center gap-2">
                {/* Aquí puedes mostrar una vista previa de la imagen */}
                <img src={url} alt="Imagen configurada" className="w-16 h-16 object-cover" />
                <span>{url}</span>
              </div>
              <button
                onClick={() => handleRemoveImage(index)}
                className="text-red-500"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Botón para guardar la configuración */}
      <button className="bg-green-500 text-white py-2 px-4 rounded">
        Guardar Configuración
      </button>
    </div>
  );
};

export default LoginConfigPage;
