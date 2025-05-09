import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/socket.io": {
        target: "http://localhost:4000",
        ws: true,
      },
    },
  },
});


/* 
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// Detectar entorno
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    strictPort: true, // Evita cambiar de puerto automáticamente
    cors: false, // Opcional: evita CORS abiertos innecesarios
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:4000",
        changeOrigin: true,
        secure: false, // no exige HTTPS en desarrollo
        rewrite: (path) => path.replace(/^\/api/, "/api"), // mantiene /api en backend
        configure: (proxy, options) => {
          // Puedes agregar aquí lógica para validar cabeceras, tokens, etc.
          console.log("Proxy configurado:", options.target);
        },
      },
      "/socket.io": {
        target: process.env.VITE_SOCKET_PROXY || "http://localhost:4000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})); 

*/