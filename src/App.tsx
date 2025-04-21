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
import ChangePassword from "./components/ChangePassword";
import Login from "./pages/Login";
import LoginConfig from "./components/LoginConfig";
import Reservations from "./components/Reservations";
import MenuSubmenuGestion from "./components/MenuSubmenuGestion";
import VisitasProgramadas from "./components/VisitasProgramadas";
import RegisterOrder from "./components/RegisterOrder";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FaBars, FaSpinner } from "react-icons/fa"; // Importa FaSpinner

// Main App component
const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Manage sidebar state
  const { isAuthenticated, isLoading } = useAuth(); // Authentication context

  // Loading state when checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner animado */}
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
          {/* Texto elegante */}
          <p className="text-lg font-semibold text-gray-700 animate-pulse">
            Cargando SoftHome
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login page if not authenticated
  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  // Check if current page is the login page
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {/* Sidebar for all pages except login */}
      {!isLoginPage && (
        <div className="hidden md:block fixed top-0 left-0 z-50">
          <Sidebar
            closeSidebar={() => setSidebarOpen(false)}
            sidebarOpen={true}
          />
        </div>
      )}

      {/* Sidebar overlay when opened */}
      {!isLoginPage && sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed top-0 left-0 z-50 md:hidden">
            <Sidebar
              closeSidebar={() => setSidebarOpen(false)}
              sidebarOpen={sidebarOpen}
            />
          </div>
        </>
      )}

      {/* Mobile sidebar toggle */}
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

      {/* Main content area */}
      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 px-4 w-full ${
          !isLoginPage ? "md:ml-64 pt-24 md:pt-4" : ""
        }`}
      >
        {/* Routing setup */}
        <Routes>
          {/* Route for login page */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute requiredPermission="Dashboard" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Movements and related pages */}
          <Route
            element={
              <ProtectedRoute requiredPermission="Control de Ingresos y Salidas" />
            }
          >
            <Route path="/personal/movimientos" element={<Movements />} />
            <Route path="/movements-list" element={<MovementsList />} />
          </Route>

          {/* Users and related pages */}
          <Route
            element={<ProtectedRoute requiredPermission="Registrar Usuarios" />}
          >
            <Route path="/users" element={<Users />} />
          </Route>
          <Route
            element={<ProtectedRoute requiredPermission="Lista de Usuarios" />}
          >
            <Route path="/user-list" element={<UserList />} />
          </Route>

          {/* Visits and related pages */}
          <Route element={<ProtectedRoute requiredPermission="Gestión Visitas" />}>
            <Route path="/visits" element={<Visits />} />
          </Route>
          <Route
            element={<ProtectedRoute requiredPermission="Visitas Programadas" />}
          >
            <Route path="/VisitasProgramadas" element={<VisitasProgramadas />} />
          </Route>

          {/* Other protected routes */}
          <Route element={<ProtectedRoute requiredPermission="Reservas" />}>
            <Route path="/reservas" element={<Reservations />} />
          </Route>
          <Route
            element={
              <ProtectedRoute requiredPermission="Gestión de Menús y Submenús" />
            }
          >
            <Route path="/menu-submenu" element={<MenuSubmenuGestion />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="Login" />}>
            <Route path="/LoginConfig" element={<LoginConfig />} />
          </Route>
          <Route
            element={<ProtectedRoute requiredPermission="Cambio Contraseña" />}
          >
            <Route path="/ChangePass" element={<ChangePassword />} />
          </Route>

          <Route
            element={<ProtectedRoute requiredPermission="Registrar Encargo" />}
          >
            <Route path="/RegisterOrder" element={<RegisterOrder />} />
          </Route>

          {/* Settings page with section param */}
          <Route element={<ProtectedRoute requiredPermission="Configuración" />}>
            <Route
              path="/settings/:section"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Configuración</h1>
                </div>
              }
            />
          </Route>

          {/* Redirect to dashboard if route not found */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

// App wrapper with authentication context and router
const AppWrapper = () => (
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);

export default AppWrapper;