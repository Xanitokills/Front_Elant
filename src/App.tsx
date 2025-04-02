import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar.tsx";
import Movements from "./components/Movements.tsx";
import Visits from "./components/Visits.tsx"; // Import the new Visits component
import Users from "./pages/Users";
import UserList from "./pages/UserList";
import MovementsList from "./components/Movements.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Login from "./pages/Login.tsx";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FaBars } from "react-icons/fa";

const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 relative">
      {location.pathname !== "/login" && (
        <Sidebar closeSidebar={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
      )}
      {location.pathname !== "/login" && (
        <div className="md:hidden flex justify-between p-4 bg-gray-900 text-white">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-2xl"
          >
            <FaBars />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal/movimientos" element={<Movements />} />
          <Route path="/users" element={<Users />} />
          <Route path="/user-list" element={<UserList />} />
          <Route path="/movements-list" element={<MovementsList />} />
          <Route path="/visits" element={<Visits />} />
          <Route
            path="/profile"
            element={<div className="p-6"><h1 className="text-2xl font-bold">Perfil</h1></div>}
          />
          <Route
            path="/statistics"
            element={<div className="p-6"><h1 className="text-2xl font-bold">Estadísticas</h1></div>}
          />
          <Route
            path="/settings/:section"
            element={<div className="p-6"><h1 className="text-2xl font-bold">Configuración</h1></div>}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const AppWrapper = () => {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
};

export default AppWrapper;
