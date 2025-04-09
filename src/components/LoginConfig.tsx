import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";

const LoginConfigPage = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [customImageName, setCustomImageName] = useState<string>("");
  const [images, setImages] = useState<any[]>([]);
  const { userId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [currentPage]);

  const fetchImages = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/get-login-images`
      );
      const loadedImages = response.data.images || [];
      const maxPage = Math.ceil(loadedImages.length / imagesPerPage);
      if (currentPage > maxPage && maxPage !== 0) {
        setCurrentPage(maxPage);
      } else {
        setImages(loadedImages);
      }
    } catch (error) {
      console.error("Error al cargar las imágenes:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        Swal.fire("Error", "Seleccione un archivo de imagen válido.", "error");
        return;
      }
      setImageFile(file);
      setCustomImageName(file.name.replace(/\.[^/.]+$/, ""));
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);

        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = async () => {
    if (!imageFile || !userId) {
      Swal.fire(
        "Error",
        "Debe seleccionar una imagen válida y tener sesión iniciada.",
        "error"
      );
      return;
    }

    Swal.fire({
      title: "Subiendo imagen...",
      text: "Por favor espere",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("userId", userId.toString());
      formData.append("customName", customImageName);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/upload-login-images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Éxito",
        text: "Imagen subida correctamente.",
        timer: 1500,
        showConfirmButton: false,
      });
      setImageFile(null);
      setImagePreview(null);
      setImageDimensions(null);
      setCustomImageName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchImages();
    } catch (error: any) {
      Swal.close();
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Fallo al subir imagen",
        "error"
      );
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la imagen permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/delete-login-image/${imageId}`
        );
        Swal.fire({
          icon: "success",
          title: "Eliminada",
          text: "Imagen eliminada exitosamente.",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchImages();
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar la imagen.", "error");
      }
    }
  };

  const handleViewImage = (imageUrl: string) => {
    Swal.fire({
      title: "Vista de Imagen",
      imageUrl,
      imageWidth: 300,
      imageHeight: 200,
      imageAlt: "Imagen Login",
    });
  };

  const indexOfLast = currentPage * imagesPerPage;
  const indexOfFirst = indexOfLast - imagesPerPage;
  const currentImages = images.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(images.length / imagesPerPage);

  return (
    <div className="p-4 md:p-6 w-full max-w-[1440px] mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center md:text-left">
        Configuración de Imágenes de Login
      </h2>
      <div className="bg-white rounded-lg p-4 md:p-8 shadow-lg">
        <div className="mb-6 flex flex-col md:flex-row md:items-start md:gap-6">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="mb-4 p-2 border rounded md:mb-0"
          />

          {imagePreview && (
            <div className="flex flex-col md:flex-row md:items-start md:gap-6 w-full">
              <div className="flex-shrink-0 w-full md:w-1/2">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full max-w-full h-auto object-contain border"
                />
              </div>
              <div className="text-sm text-gray-700 mt-4 md:mt-0 w-full">
                <p>
                  <strong>Nombre del archivo:</strong>{" "}
                  {imageFile?.name.replace(/\.[^/.]+$/, "")}
                </p>
                <p>
                  <strong>Tamaño:</strong> {(imageFile!.size / 1024).toFixed(2)}{" "}
                  KB
                </p>
                {imageDimensions && (
                  <p>
                    <strong>Dimensiones:</strong> {imageDimensions.width} x{" "}
                    {imageDimensions.height} px
                  </p>
                )}
                <div className="mt-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Cambiar nombre:
                  </label>
                  <input
                    type="text"
                    value={customImageName}
                    onChange={(e) => setCustomImageName(e.target.value)}
                    className="border px-2 py-1 rounded w-full"
                  />
                </div>
                <p className="text-blue-600 italic mt-2">
                  Recomendación: Usar imágenes de 1600px x 1000px
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 md:mt-0">
            <button
              onClick={handleSaveImage}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full md:w-auto"
            >
              Guardar Imagen
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 px-4 border">Nombre</th>
                <th className="py-2 px-4 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentImages.map((img, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-4 border">
                    {img.imageName.replace(/\.[^/.]+$/, "")}
                  </td>
                  <td className="py-2 px-4 border space-x-2">
                    <button
                      onClick={() => handleViewImage(img.imageData)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {currentImages.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center py-4">
                    No hay imágenes cargadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center mt-4 space-x-2 flex-wrap">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx + 1)}
              className={`px-3 py-1 rounded border ${
                currentPage === idx + 1
                  ? "bg-blue-500 text-white"
                  : "bg-white text-blue-500"
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginConfigPage;
