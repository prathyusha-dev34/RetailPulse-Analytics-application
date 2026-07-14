import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import RegisterCompany from "../pages/RegisterCompany";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";

import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<RegisterCompany />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<h2>404 Page Not Found</h2>} />
    </Routes>
  );
}