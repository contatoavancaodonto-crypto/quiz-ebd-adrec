import { Heart } from "lucide-react";
import { OfertaCard } from "@/components/OfertaCard";

const Oferta = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl w-full flex flex-col items-center text-center mb-8 md:mb-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg mb-4 animate-pulse-glow">
          <Heart className="text-primary-foreground h-8 w-8" />
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold glow-text">
          Oferta
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
          Oferte para garantir o bom funcionamento do nosso aplicativo. 
          Sua contribuição ajuda a manter nossos servidores e novas funcionalidades.
        </p>
      </div>

      <div className="w-full flex justify-center pb-12">
        <OfertaCard />
      </div>

      <footer className="mt-auto text-muted-foreground text-sm opacity-50 text-center pb-8">
        © {new Date().getFullYear()} — Sua ajuda faz a diferença
      </footer>
    </div>
  );
};

export default Oferta;
