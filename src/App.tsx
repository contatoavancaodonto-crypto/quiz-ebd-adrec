import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import QuizPage from "./pages/Quiz";
import ResultPage from "./pages/Result";
import RankingPage from "./pages/Ranking";
import GabaritoPage from "./pages/Gabarito";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { ProfileGate } from "./components/ProfileGate";
import MeuPerfil from "./pages/membro/MeuPerfil";
import MeuDesempenho from "./pages/membro/MeuDesempenho";
import Historico from "./pages/membro/Historico";
import Configuracoes from "./pages/membro/Configuracoes";
import Revista from "./pages/membro/Revista";
import { Biblia, Harpa } from "./pages/membro/EmBreve";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <ProfileGate />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/gabarito" element={<GabaritoPage />} />
          <Route path="/painel-ebd-2025" element={<AdminDashboard />} />
          <Route path="/membro" element={<MeuPerfil />} />
          <Route path="/membro/perfil" element={<MeuPerfil />} />
          <Route path="/membro/desempenho" element={<MeuDesempenho />} />
          <Route path="/membro/historico" element={<Historico />} />
          <Route path="/membro/revista" element={<Revista />} />
          <Route path="/membro/biblia" element={<Biblia />} />
          <Route path="/membro/harpa" element={<Harpa />} />
          <Route path="/membro/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
