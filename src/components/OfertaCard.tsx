import { useState, useEffect } from "react";
import { Copy, Check, QrCode, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface OfertaCardProps {
  qrCodeImage?: string;
  pixKey?: string;
  pixCode?: string;
  beneficiaryName?: string;
  bankName?: string;
  keyType?: string;
  isLoading?: boolean;
}

export const OfertaCard = ({
  qrCodeImage = "/pix-qr-code.jpg",
  pixKey = "Qr code ",
  pixCode = "2c309b87-c326-428c-92da-a0ed2a75c010",
  beneficiaryName = "Marcos A M Mendonça",
  bankName = "Mercado Pago",
  keyType = "Aleatória",
  isLoading = false,
}: OfertaCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success("Código PIX copiado com sucesso!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error("Erro ao copiar o código.");
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card glow-border max-w-md w-full animate-fade-in">
        <CardContent className="p-6 flex flex-col gap-6">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card glow-border max-w-md w-full overflow-hidden animate-fade-in">
      <CardContent className="p-0">
        {/* QR Code Area */}
        <div className="bg-white p-8 flex items-center justify-center relative group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="relative z-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            {qrCodeImage ? (
              <img 
                src={qrCodeImage} 
                alt="QR Code PIX" 
                className="w-48 h-48 md:w-64 md:h-64 object-contain"
                loading="lazy"
              />
            ) : (
              <div className="w-48 h-48 md:w-64 md:h-64 flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-2">
                <QrCode size={48} strokeWidth={1.5} />
                <span className="text-sm font-medium">QR Code indisponível</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Area */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Favorecido</p>
                <p className="font-semibold">{beneficiaryName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Banco</p>
                <p className="font-semibold">{bankName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Chave PIX</p>
                <p className="font-semibold break-all">{pixKey}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-semibold">{keyType}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleCopy}
              className={`w-full py-6 text-lg font-bold transition-all duration-300 ${
                copied ? "bg-success hover:bg-success/90" : "gradient-primary hover:opacity-90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5 animate-scale-in" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copiar código PIX
                </>
              )}
            </Button>

            <div className="relative group">
              <div className="bg-slate-900/50 border border-border/50 rounded-lg p-3 pr-10 text-xs font-mono text-muted-foreground break-all max-h-24 overflow-y-auto scrollbar-hide">
                {pixCode}
              </div>
              <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors"
                title="Copiar código"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
