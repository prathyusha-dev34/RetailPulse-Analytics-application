import { Routes, Route } from "react-router-dom";

import Layout from "../layouts/Layout";

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

import Customers from "../pages/customers/Customers";
import AddCustomer from "../pages/customers/AddCustomer";
import EditCustomer from "../pages/customers/EditCustomer";
import CustomerProfile from "../pages/customers/CustomerProfile";
import CustomerAnalytics from "../pages/customers/CustomerAnalytics";
import TopCustomers from "../pages/customers/TopCustomers";

import Notifications from "../pages/Notifications";
import AuditLogs from "../pages/AuditLogs";
import Forecast from "../pages/Forecast";

import ProtectedRoute from "../components/ProtectedRoute";


// ==========================================================
// APP ROUTES
// ==========================================================

export default function AppRoutes() {
  return (
    <Routes>

      {/* =====================================================
          PUBLIC ROUTES
      ===================================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<RegisterCompany />}
      />


      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          PROFILE
      ===================================================== */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          CATEGORIES
      ===================================================== */}

      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <Layout>
              <Categories />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          PRODUCTS
      ===================================================== */}

      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <Layout>
              <Products />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/product-dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <ProductDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          INVENTORY
      ===================================================== */}

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/movements"
        element={
          <ProtectedRoute>
            <Layout>
              <InventoryMovements />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          SALES
      ===================================================== */}

      <Route
        path="/sales"
        element={
          <ProtectedRoute>
            <Layout>
              <Sales />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/sales/add"
        element={
          <ProtectedRoute>
            <Layout>
              <AddSale />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          EDIT SALE

          Correct URL:
          /sales/:id/edit

          Example:
          /sales/8/edit
      ===================================================== */}

      <Route
        path="/sales/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditSale />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* =====================================================
          SALE DETAILS

          Example:
          /sales/8
      ===================================================== */}

      <Route
        path="/sales/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <SaleDetails />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          CUSTOMERS
      ===================================================== */}

      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <Layout>
              <Customers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/add"
        element={
          <ProtectedRoute>
            <Layout>
              <AddCustomer />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/analytics"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerAnalytics />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/top-customers"
        element={
          <ProtectedRoute>
            <Layout>
              <TopCustomers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/:id/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <CustomerProfile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/customers/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditCustomer />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          REPORTS
      ===================================================== */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
    ANALYTICS
===================================================== */}

<Route
  path="/analytics/sales"
  element={
    <ProtectedRoute>
      <Layout>
        <Analytics />
      </Layout>
    </ProtectedRoute>
  }
/>

<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Layout>
        <Analytics />
      </Layout>
    </ProtectedRoute>
  }
/>


      {/* =====================================================
          AUDIT LOGS
      ===================================================== */}

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <Layout>
              <AuditLogs />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          FORECAST
      ===================================================== */}

      <Route
        path="/forecast"
        element={
          <ProtectedRoute>
            <Layout>
              <Forecast />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}