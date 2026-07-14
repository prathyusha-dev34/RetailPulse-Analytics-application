import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id?: number;
  name: string;
  email: string;
  role: string;
  company?: string;
  last_login?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      setUser({
        id: 1,
        name: "Praveen",
        email: "admin@test.com",
        role: "Company Admin",
        company: "RetailPulse",
        last_login: new Date().toLocaleString(),
        status: "Active",
      });
    }

    setLoading(false);
  }, []);

  const login = async (
    accessToken: string,
    refreshToken: string
  ) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    setUser({
      id: 1,
      name: "Praveen",
      email: "admin@test.com",
      role: "Company Admin",
      company: "RetailPulse",
      last_login: new Date().toLocaleString(),
      status: "Active",
    });

    setLoading(false);
  };

  const logoutUser = async () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}