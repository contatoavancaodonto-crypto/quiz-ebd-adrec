import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import emblemaAsset from "@/assets/quizebd-emblema.png.asset.json";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="text-center relative z-10">
        <img
          src={emblemaAsset.url}
          alt="Quiz EBD"
          className="w-28 h-28 object-contain mx-auto mb-6 opacity-95 drop-shadow-[0_0_25px_rgba(76,201,224,0.4)]"
        />
        <h1 className="mb-2 text-6xl font-display font-bold gradient-text">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">Página não encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
