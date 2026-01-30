import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Equipe from "./pages/Equipe";
import Produtos from "./pages/Produtos";
import Relatorios from "./pages/Relatorios";
import Despesas from "./pages/Despesas";
import Vendas from "./pages/Vendas";
import Caixa from "./pages/Caixa";
import Comissoes from "./pages/Comissoes";
import Configuracoes from "./pages/Configuracoes";
import Integracoes from "./pages/Integracoes";
import AcceptInvite from "./pages/AcceptInvite";
import AgendamentoPublico from "./pages/AgendamentoPublico";
import AvaliacaoPublica from "./pages/AvaliacaoPublica";
import Checkout from "./pages/Checkout";
import Descontos from "./pages/Descontos";
import Fidelidade from "./pages/Fidelidade";
import Notificacoes from "./pages/Notificacoes";
import Avaliacoes from "./pages/Avaliacoes";
import NotFound from "./pages/NotFound";

// Components
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/convite/:token" element={<AcceptInvite />} />
              <Route path="/agendar/:slug" element={<AgendamentoPublico />} />
              <Route path="/avaliacao/:token" element={<AvaliacaoPublica />} />
              
              {/* Onboarding - requires auth but no organization */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requireOrganization={false}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              
              {/* Protected routes - requires auth and organization */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/checkout/:appointmentId" element={<Checkout />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/servicos" element={<Servicos />} />
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/produtos" element={<Produtos />} />
                <Route path="/vendas" element={<Vendas />} />
                <Route path="/caixa" element={<Caixa />} />
                <Route path="/comissoes" element={<Comissoes />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/despesas" element={<Despesas />} />
                <Route path="/descontos" element={<Descontos />} />
                <Route path="/fidelidade" element={<Fidelidade />} />
                <Route path="/notificacoes" element={<Notificacoes />} />
                <Route path="/avaliacoes" element={<Avaliacoes />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/integracoes" element={<Integracoes />} />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
