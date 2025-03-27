import { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.tsx";
import Movements from "./components/Movements.tsx";
import Users from "./pages/Users";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import { FaBars } from "react-icons/fa";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Componente separado para el navbar y sidebar
const MobileNavbarAndSidebar = ({
  hideSidebar,
  sidebarOpen,
  setSidebarOpen,
  userName,
}: {
  hideSidebar: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName: string | null;
}) => {
  return (
    <>
      {/* Navbar para móviles */}
      {!hideSidebar && (
        <div className="w-full bg-gray-900 text-white flex justify-between items-center p-4 md:hidden">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white text-2xl">
            <FaBars />
          </button>
          <div className="flex items-center">
            <img
              src="https://randomuser.me/api/portraits/men/75.jpg"
              alt="Usuario"
              className="w-10 h-10 rounded-full border-2 border-white mr-2"
            />
            <span className="text-lg font-semibold">{userName || "Usuario"}</span>
          </div>
        </div>
      )}

      {/* Fondo oscuro para cerrar sidebar en móviles */}
      {sidebarOpen && !hideSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      {!hideSidebar && (
        <div
          className={`absolute md:relative ${
            sidebarOpen ? "left-0" : "-left-72"
          } md:left-0 transition-all duration-300 z-50`}
        >
          <Sidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>
      )}
    </>
  );
};

const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, userName, isLoading } = useAuth();

  // Memoizar hideSidebar para evitar cálculos innecesarios
  const hideSidebar = useMemo(() => {
    return location.pathname === "/" || location.pathname === "/login";
  }, [location.pathname]);

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
    console.log("Usuario no autenticado, redirigiendo a /login...");
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      <MobileNavbarAndSidebar
        hideSidebar={hideSidebar}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userName={userName}
      />

      {/* Contenido Principal */}
      <div className="flex-1">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal/movimientos" element={<Movements />} />
          <Route path="/users" element={<Users />} />
          <Route
            path="/profile"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Perfil</h1>
              </div>
            }
          />
          <Route
            path="/statistics"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Estadísticas</h1>
              </div>
            }
          />
          <Route
            path="/settings/:section"
            element={
              <div className="p-6">
                <h1 className="text-2xl font-bold">Configuración</h1>
              </div>
            }
          />
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