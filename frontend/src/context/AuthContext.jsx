import { createContext, useContext, useEffect, useState } from "react";
import { loginUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("chaincoder_token");
    const storedUser = localStorage.getItem("chaincoder_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to restore session:", error);
        localStorage.removeItem("chaincoder_token");
        localStorage.removeItem("chaincoder_user");
      }
    }

    setLoading(false);
  }, []);

  const login = async (userId, password) => {
    const data = await loginUser(userId, password);

    localStorage.setItem("chaincoder_token", data.token);
    localStorage.setItem("chaincoder_user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("chaincoder_token");
    localStorage.removeItem("chaincoder_user");

    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}