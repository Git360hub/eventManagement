import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { BrowserRouter } from "react-router";
import "./index.css";
import AuthContextProvider from "./contexts/AuthContext/AuthContextProvider.tsx";
import AlertContextProvider from "./contexts/AlertContext/AlertContextProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AlertContextProvider>
      <AuthContextProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthContextProvider>
    </AlertContextProvider>
  </StrictMode>
);
