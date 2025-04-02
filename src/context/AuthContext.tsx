import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  userName: string | null;
  userId: number | null; // Add userId
  role: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null); // Add userId state
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem("token");
      console.log("Validating session, token found:", token);
      if (token) {
        try {
          const response = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/validate", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log("Session validated successfully:", data);
            setIsAuthenticated(true);
            setUserName(localStorage.getItem("userName"));
            setUserId(data.user.id); // Set userId from the validate response
            setRole(localStorage.getItem("role"));
          } else {
            console.log("Session validation failed, removing token...");
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            localStorage.removeItem("role");
            setIsAuthenticated(false);
            setUserId(null);
          }
        } catch (error) {
          console.error("Error validating session:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("userName");
          localStorage.removeItem("role");
          setIsAuthenticated(false);
          setUserId(null);
        }
      } else {
        console.log("No token found, setting isAuthenticated to false");
        setIsAuthenticated(false);
        setUserId(null);
      }
      setIsLoading(false);
    };

    validateSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Error al iniciar sesión");
      }

      const data = await response.json();
      console.log("Login successful, storing token and updating state:", data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.userName);
      localStorage.setItem("role", data.role);

      // Fetch user ID by validating the token immediately after login
      const validateResponse = await fetch("https://sntps2jn-4000.brs.devtunnels.ms/api/validate", {
        headers: {
          Authorization: `Bearer ${data.token}`,
        },
      });
      if (!validateResponse.ok) {
        throw new Error("Error al validar el token después del login");
      }
      const validateData = await validateResponse.json();
      setUserId(validateData.user.id); // Set userId from the validate response

      setIsAuthenticated(true);
      setUserName(data.userName);
      setRole(data.role);
      console.log("isAuthenticated set to true");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      throw error;
    }
  };

  const logout = () => {
    console.log("Logging out, clearing localStorage and resetting state...");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("role");
    setIsAuthenticated(false);
    setUserName(null);
    setUserId(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, userName, userId, role, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};