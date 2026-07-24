import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import RegisterCompany from "../pages/RegisterCompany";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";

import Categories from "../pages/Categories";
import Products from "../pages/Products";
import ProductDashboard from "../pages/ProductDashboard";
import Inventory from "../pages/Inventory";
import InventoryMovements from "../pages/InventoryMovements";
import Reports from "../pages/Reports";
import Analytics from "../pages/Analytics";

import Sales from "../pages/Sales";
import AddSale from "../pages/AddSale";
import EditSale from "../pages/EditSale";
import SaleDetails from "../pages/SaleDetails";

import ProtectedRoute from "../components/ProtectedRoute";
import Notifications from "../pages/Notifications";
export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<RegisterCompany />}
      />

      {/* Dashboard */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Categories */}
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Categories />
          </ProtectedRoute>
        }
      />

      {/* Products */}
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Products />
          </ProtectedRoute>
        }
      />

      {/* Product Dashboard */}
      <Route
        path="/product-dashboard"
        element={
          <ProtectedRoute>
            <ProductDashboard />
          </ProtectedRoute>
        }
      />

      {/* Inventory */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Inventory />
          </ProtectedRoute>
        }
      />
       
       <Route
  path="/inventory/movements"
  element={
    <ProtectedRoute>
      <InventoryMovements />
    </ProtectedRoute>
  }
/>

    
      {/* Sales */}
      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/add"
        element={
          <ProtectedRoute>
            <AddSale />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/edit/:id"
        element={
          <ProtectedRoute>
            <EditSale />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/:id"
        element={
          <ProtectedRoute>
            <SaleDetails />
          </ProtectedRoute>
        }
      />

      {/* Reports */}
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Analytics */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />

      <Route
  path="/notifications"
  element={<Notifications />}
/>
    </Routes>
  );
}