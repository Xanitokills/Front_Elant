import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import styled, { keyframes } from "styled-components";

// Animación para los puntos
const dotsAnimation = keyframes`
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
`;

const Dots = styled.span`
  display: inline-block;
  position: relative;
`;

const Dot = styled.span`
  display: inline-block;
  animation: ${dotsAnimation} 1.5s steps(5, end) infinite;
  font-size: 30px;
  margin: 0 5px;
  color: #000;

  &:nth-child(1) {
    animation-delay: 0s;
  }

  &:nth-child(2) {
    animation-delay: 0.3s;
  }

  &:nth-child(3) {
    animation-delay: 0.6s;
  }
`;

const LoginConfigPage = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Para el estado de carga de las imágenes
  const { userId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const imagesPerPage = 5;
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, [currentPage]);

  const fetchImages = async () => {
    try {
      setLoading(true); // Iniciar la carga

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
    } finally {
      setLoading(false); // Finalizar la carga
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (images.length >= 3) {
      Swal.fire("Error", "Solo se pueden cargar hasta 3 imágenes.", "error");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (file) {
      if (!file.type.startsWith("image/")) {
        Swal.fire(
          "Error",
          "Seleccione un archivo de imagen válido.",
          "error"
        ).then(() => {
          setImageFile(null);
          setImagePreview(null);
          setImageDimensions(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);

        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;

          if (width < 1024 || height < 1520 || width > 2874 || height > 3582) {
            Swal.fire(
              "Error",
              "Las dimensiones de la imagen no son válidas. Debe estar entre 1280x1600 y 2874x3582.",
              "error"
            ).then(() => {
              setImageFile(null);
              setImagePreview(null);
              setImageDimensions(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            });
            return;
          }

          setImageDimensions({ width, height });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  };

  const resizeImage = (file: File) => {
    return new Promise<File>((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onloadend = () => {
        img.src = reader.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxWidth = 1437;
        const maxHeight = 1791;

        const scaleFactor = Math.min(
          maxWidth / img.width,
          maxHeight / img.height
        );
        const newWidth = img.width * scaleFactor;
        const newHeight = img.height * scaleFactor;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
            });
            resolve(resizedFile);
          }
        }, file.type);
      };

      reader.readAsDataURL(file);
    });
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

    const resizedImage = await resizeImage(imageFile);

    try {
      const formData = new FormData();
      formData.append("image", resizedImage);
      formData.append("userId", userId.toString());
      formData.append("customName", `imagen_${images.length + 1}`);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/upload-login-images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

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
      fetchImages();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
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
            className="mb-4 p-2 border rounded w-full md:w-2/5"
            disabled={loading} // Deshabilitar si la carga está en proceso
          />

          {imagePreview && (
            <div className="flex flex-col md:flex-row md:gap-6 w-full md:w-3/5">
              <div className="flex-shrink-0 w-full md:w-1/4">
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-auto object-contain border"
                />
              </div>
              <div className="text-sm text-gray-700 mt-4 md:mt-0 md:w-2/3">
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
                <p className="text-blue-600 italic mt-2">
                  Importante: Usar imágenes de 1024px x 1520px{" "}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <button
              onClick={handleSaveImage}
              className={`bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full md:w-auto ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={loading || images.length === 0} // Deshabilitar el botón mientras se carga o si no hay imágenes
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
              {loading ? (
                <tr>
                  <td colSpan={2} className="text-center py-4">
                    Cargando imágenes
                    <Dots>
                      <Dot>.</Dot>
                      <Dot>.</Dot>
                      <Dot>.</Dot>
                    </Dots>
                  </td>
                </tr>
              ) : (
                currentImages.map((img, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-4 border">{`imagen_${idx + 1}`}</td>
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
                ))
              )}
              {currentImages.length === 0 && !loading && (
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
