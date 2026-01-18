import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import BonsReception from "./pages/BonsReception";
import Trituration from "./pages/Trituration";
import Stock from "./pages/Stock";
import Vente from "./pages/Vente";
import Paiement from "./pages/Paiement";
import Parametres from "./pages/Parametres";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/bons-reception" element={<BonsReception />} />
          <Route path="/trituration" element={<Trituration />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/vente" element={<Vente />} />
          <Route path="/paiement" element={<Paiement />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
