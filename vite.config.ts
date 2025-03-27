import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Asegura que use el puerto correcto
    open: true, // Abre automáticamente el navegador
  },
})
