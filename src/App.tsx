import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.tsx";
import Movements from "./components/Movements.tsx";
import Users from "./pages/Users";
import UserList from "./pages/UserList";
import MovementsList from "./components/Movements.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FaBars } from "react-icons/fa"; // Asegúrate de importar el ícono

const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  // Si está cargando, no renderizar nada todavía
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  // Si el usuario no está autenticado y no está en la página de login, redirigir a /login
  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {/* Renderizamos el Sidebar solo si no estamos en la página de login */}
      {location.pathname !== "/login" && (
        <Sidebar closeSidebar={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      )}

      {/* Navbar para móviles */}
      {location.pathname !== "/login" && (
        <div className="md:hidden flex justify-between p-4 bg-gray-900 text-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)} // Alterna el valor de sidebarOpen
            className="text-2xl"
          >
            <FaBars />
          </button>
        </div>
      )}

      {/* Contenido Principal */}
      <div className={`flex-1 overflow-auto ${location.pathname !== "/login" ? "" : ""}`}>
        {/* El contenido principal no se moverá con el sidebar */}
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal/movimientos" element={<Movements />} />
          <Route path="/users" element={<Users />} />
          <Route path="/user-list" element={<UserList />} />
          <Route path="/movements-list" element={<MovementsList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const AppWrapper = () => (
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);

export default AppWrapper;
