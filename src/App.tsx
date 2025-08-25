import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AssessmentWizard from "./components/AssessmentWizard";
import ReportDisplay from "./components/ReportDisplay";
import Dashboard from "./components/Dashboard";
import ComparisonTool from "./components/ComparisonTool";
import Chatbot from "./components/Chatbot";
import MFASetup from "./components/MFASetup";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assessment/new" element={<AssessmentWizard />} />
              <Route path="/comparison" element={<ComparisonTool />} />
              <Route path="/mfa-setup" element={<MFASetup />} />
              <Route path="/report/:id" element={<ReportDisplay />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Chatbot />
          </ProtectedRoute>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;