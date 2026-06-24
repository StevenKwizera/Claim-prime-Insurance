import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { router } from "@/routes/router";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { clearGoogleTranslateArtifacts } from "@/utils/language";
import "@/index.css";

const queryClient = new QueryClient();

clearGoogleTranslateArtifacts();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "16px",
              background: "#0f2e22",
              color: "#f8fafc",
              fontSize: "0.875rem"
            }
          }}
        />
      </LanguageProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
