import { useState, useEffect } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { Mail, Send, Eye, RefreshCw, CheckCircle2, AlertCircle, Search, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/hooks/useRoles";
import { Navigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmailLog {
  id: string | number;
  message_id: string;
  template_name: string;
  recipient_email: string;
  status: 'pending' | 'sent' | 'failed' | 'rate_limited' | 'suppressed' | 'dlq';
  error_message?: string;
  created_at: string;
}

interface EmailTemplate {
  name: string;
  displayName: string;
  subject: string;
  html: string;
}

export default function AdminEmails() {
  const { isSuperadmin, loading: rolesLoading } = useRoles();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('email_send_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar logs: " + error.message);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Usamos a edge function de preview para obter os templates renderizados
      const { data, error } = await supabase.functions.invoke('preview-transactional-email');
      
      if (error) throw error;
      if (data?.templates) {
        setTemplates(data.templates.map((t: any) => ({
          name: t.templateName,
          displayName: t.displayName,
          subject: t.subject,
          html: t.html
        })));
      }
    } catch (error: any) {
      console.error("Erro ao carregar templates:", error);
      // Fallback para templates básicos se a função falhar
      setTemplates([
        { name: 'new-class-material', displayName: 'Nova Revista', subject: '📖 Nova revista disponível', html: '<p>Template de nova revista</p>' },
        { name: 'support-ticket-created', displayName: 'Suporte Criado', subject: '🎫 Seu chamado foi recebido', html: '<p>Template de suporte</p>' }
      ]);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      setLoading(true);
      Promise.all([fetchLogs(), fetchTemplates()]).finally(() => setLoading(false));
    }
  }, [isSuperadmin]);

  const handleSendTest = async () => {
    if (!testEmail || !selectedTemplate) {
      toast.error("Informe o e-mail e selecione um template");
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: selectedTemplate.name,
          recipientEmail: testEmail,
          templateData: selectedTemplate.name === 'new-class-material' ? {
            name: "Usuário de Teste",
            className: "Classe de Teste",
            trimester: 1,
            year: 2026,
            title: "Revista de Teste",
            fileUrl: "https://example.com"
          } : {
            userName: "Usuário de Teste",
            ticketId: "123",
            subject: "Assunto de Teste"
          }
        }
      });

      if (error) throw error;
      toast.success("E-mail de teste enviado para a fila!");
      setTestEmail("");
      fetchLogs();
    } catch (error: any) {
      toast.error("Erro ao enviar teste: " + error.message);
    } finally {
      setSendingTest(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.message_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: EmailLog['status']) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500 animate-pulse">Pendente</Badge>;
      case 'failed':
      case 'dlq':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Falhou</Badge>;
      case 'suppressed':
        return <Badge variant="secondary">Suprimido</Badge>;
      case 'rate_limited':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">Rate Limit</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (rolesLoading) return null;
  if (!isSuperadmin) return <Navigate to="/painel" replace />;

  return (
    <AdminPage
      title="Gerenciamento de E-mails"
      description="Monitore envios, visualize templates e realize testes de entrega."
      Icon={Mail}
      variant="primary"
    >
      <Tabs defaultValue="logs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="logs">Logs de Envio</TabsTrigger>
          <TabsTrigger value="templates">Templates & Testes</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por e-mail, template ou ID..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Carregando logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum e-mail encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium">{log.recipient_email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.template_name}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.name} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setSelectedTemplate(template)}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.displayName}</CardTitle>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <CardDescription className="text-xs font-mono">{template.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-1">Assunto: {template.subject}</p>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="w-full">Visualizar</Button>
                    <Button size="sm" className="w-full" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                    }}>Testar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Log */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Envio</DialogTitle>
            <DialogDescription>Informações detalhadas sobre a transação de e-mail.</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">ID da Mensagem</Label>
                  <p className="font-mono text-xs truncate">{selectedLog.message_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destinatário</Label>
                  <p className="font-medium">{selectedLog.recipient_email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Template</Label>
                  <p>{selectedLog.template_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data/Hora</Label>
                  <p>{format(new Date(selectedLog.created_at), "PPP p", { locale: ptBR })}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <Label className="text-destructive flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3 h-3" /> Erro de Envio
                  </Label>
                  <p className="text-sm font-mono break-all">{selectedLog.error_message}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Preview/Teste de Template */}
      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Template: {selectedTemplate?.displayName}</DialogTitle>
            <DialogDescription>Visualize o design e envie um e-mail de teste para sua conta.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-1 space-y-1">
                <Label htmlFor="test-email">Enviar e-mail de teste para:</Label>
                <Input
                  id="test-email"
                  placeholder="exemplo@gmail.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button className="mt-auto" onClick={handleSendTest} disabled={sendingTest}>
                {sendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Enviar Teste
              </Button>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-white">
              <ScrollArea className="h-full">
                {selectedTemplate && (
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html }} />
                )}
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
