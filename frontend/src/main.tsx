import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import {
  CssBaseline,
  GlobalStyles,
} from "@mui/material";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CssBaseline />

          <GlobalStyles
            styles={{
              body: {
                margin: 0,
                minHeight: "100vh",
                background:
                  "linear-gradient(135deg,#020617,#0f172a,#1e293b)",
              },
              "#root": {
                minHeight: "100vh",
              },
            }}
          />

          <App />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);