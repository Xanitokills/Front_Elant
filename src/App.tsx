import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Movements from "./components/Movements";
import Visits from "./components/Visits";
import Users from "./pages/Users";
import UserList from "./pages/UserList";
import MovementsList from "./components/Movements";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
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

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Sidebar escritorio */}
      {!isLoginPage && (
        <div className="hidden md:block fixed top-0 left-0 z-50">
          <Sidebar closeSidebar={() => setSidebarOpen(false)} sidebarOpen={true} />
        </div>
      )}

      {/* Sidebar móvil con overlay */}
      {!isLoginPage && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 z-50 md:hidden">
            <Sidebar closeSidebar={() => setSidebarOpen(false)} sidebarOpen={sidebarOpen} />
          </div>
        </>
      )}

      {/* Header móvil */}
      {!isLoginPage && (
        <div className="md:hidden fixed top-0 left-0 z-40 w-full bg-gray-900 p-4 flex items-center justify-between text-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-2xl"
          >
            <FaBars />
          </button>
          <h1 className="text-lg font-semibold">Mi App</h1>
        </div>
      )}

      {/* Contenido principal */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 px-4 w-full ${
          !isLoginPage ? "md:ml-64 pt-24 md:pt-4" : ""
        }`}
      >
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/personal/movimientos" element={<Movements />} />
          <Route path="/users" element={<Users />} />
          <Route path="/user-list" element={<UserList />} />
          <Route path="/movements-list" element={<MovementsList />} />
          <Route path="/visits" element={<Visits />} />
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
