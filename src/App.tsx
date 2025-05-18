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
import Users from "./components/Users";
import UserList from "./components/UserList";
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
import { FaBars, FaSpinner, FaBell } from "react-icons/fa";
import Notifications from "./components/Notifications";

const App = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // Inicialmente 3 no leídas
  const { isAuthenticated, isLoading, userPermissions } = useAuth();

  if (isLoading && location.pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
          <p className="text-lg font-semibold text-gray-700 animate-pulse">
            Cargando SoftHome
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && location.pathname !== "/login") {
    return <Navigate to="/login" replace />;
  }

  if (
    isAuthenticated &&
    userPermissions.length === 0 &&
    location.pathname !== "/login"
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center space-y-4">
          <FaSpinner className="animate-spin text-4xl text-blue-600" />
          <p className="text-lg font-semibold text-gray-700 animate-pulse">
            Cargando permisos...
          </p>
        </div>
      </div>
    );
  }

  if (
    location.pathname === "/" &&
    !isLoading &&
    userPermissions.length > 0
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      {!isLoginPage && (
        <div className="hidden md:block fixed top-0 left-0 z-50">
          <Sidebar
            closeSidebar={() => setSidebarOpen(false)}
            sidebarOpen={true}
            setNotificationsOpen={setNotificationsOpen}
            unreadCount={unreadCount}
          />
        </div>
      )}

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
              setNotificationsOpen={setNotificationsOpen}
              unreadCount={unreadCount}
            />
          </div>
        </>
      )}

      {!isLoginPage && (
        <div className="md:hidden fixed top-0 left-0 z-40 w-full bg-gray-900 p-4 flex items-center justify-between text-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-2xl"
          >
            <FaBars />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => setNotificationsOpen(true)}
              className="relative text-white text-2xl"
            >
              <FaBell />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                {unreadCount}
              </span>
            </button>
          )}
        </div>
      )}

      {!isLoginPage && (
        <Notifications
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
          setUnreadCount={setUnreadCount}
        />
      )}

      <div
        className={`flex-1 overflow-y-auto transition-all duration-300 px-4 w-full ${
          !isLoginPage ? "md:ml-64 pt-24 md:pt-4" : ""
        }`}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute requiredUrl="dashboard" />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="movements-list" />}>
            <Route path="/personal/movimientos" element={<Movements />} />
            <Route path="/movements-list" element={<MovementsList />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="users" />}>
            <Route path="/users" element={<Users />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="user-list" />}>
            <Route path="/user-list" element={<UserList />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="visits" />}>
            <Route path="/visits" element={<Visits />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="visitasProgramadas" />}>
            <Route path="/visitasProgramadas" element={<VisitasProgramadas />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="reservas" />}>
            <Route path="/reservas" element={<Reservations />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="menu-submenu" />}>
            <Route path="/menu-submenu" element={<MenuSubmenuGestion />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="LoginConfig" />}>
            <Route path="/LoginConfig" element={<LoginConfig />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="ChangePass" />}>
            <Route path="/ChangePass" element={<ChangePassword />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="RegisterOrder" />}>
            <Route path="/RegisterOrder" element={<RegisterOrder />} />
          </Route>

          <Route element={<ProtectedRoute requiredUrl="settings" />}>
            <Route
              path="/settings/:section"
              element={
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Configuración</h1>
                </div>
              }
            />
          </Route>

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