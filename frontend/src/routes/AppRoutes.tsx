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

import Notifications from "../pages/Notifications";
import AuditLogs from "../pages/AuditLogs";

import ProtectedRoute from "../components/ProtectedRoute";



export default function AppRoutes() {


  return (

    <Routes>


      {/* PUBLIC ROUTES */}


      <Route

        path="/login"

        element={<Login />}

      />


      <Route

        path="/register"

        element={<RegisterCompany />}

      />





      {/* DASHBOARD */}


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






      {/* PROFILE */}


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






      {/* CATEGORIES */}


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






      {/* PRODUCTS */}


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







      {/* INVENTORY */}


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







      {/* SALES */}


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



      <Route

        path="/sales/edit/:id"

        element={

          <ProtectedRoute>

            <Layout>

              <EditSale />

            </Layout>

          </ProtectedRoute>

        }

      />



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







      {/* REPORTS */}


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







      {/* ANALYTICS */}


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







      {/* AUDIT LOGS */}


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







      {/* NOTIFICATIONS */}


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