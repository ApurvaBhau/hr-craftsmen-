import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PdfTools from "./pages/PdfTools";
import ContentWriter from "./pages/ContentWriter";
import ExcelFormula from "./pages/ExcelFormula";
import WordFormatting from "./pages/WordFormatting";
import EventSchedule from "./pages/EventSchedule";
import FileConverter from "./pages/FileConverter";
import OfferLetter from "./pages/OfferLetter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pdf-tools" element={<PdfTools />} />
                <Route path="/content-writer" element={<ContentWriter />} />
                <Route path="/excel-formula" element={<ExcelFormula />} />
                <Route path="/word-formatting" element={<WordFormatting />} />
                <Route path="/event-schedule" element={<EventSchedule />} />
                <Route path="/file-converter" element={<FileConverter />} />
                <Route path="/offer-letter" element={<OfferLetter />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
