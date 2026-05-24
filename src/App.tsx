import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Welcome from "./pages/Welcome";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import DispatchPage from "./pages/Dispatch";
import ResponderPage from "./pages/Responder";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import WardDetailPanel from "@/components/ward-intel/WardDetailPanel";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/dashboard" element={<Index initialView="dashboard" />} />
              {/* Obsidian Tactical top-level destinations */}
              <Route path="/map"     element={<Index initialView="map-full" />} />
              <Route path="/routes"  element={<Index initialView="safe-route" />} />
              <Route path="/network" element={<Index initialView="community" />} />
              <Route path="/me"      element={<Index initialView="profile" />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/dispatch"
                element={
                  <ProtectedRoute requireAnyOfRoles={["dispatcher", "admin"]}>
                    <DispatchPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/responder"
                element={
                  <ProtectedRoute requireAnyOfRoles={["responder", "admin"]}>
                    <ResponderPage />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <WardDetailPanel />
          </BrowserRouter>
        </AuthProvider>
        <SpeedInsights />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
