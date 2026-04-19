import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, Trash2, FileText, Download, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRoles } from "@/hooks/useRoles";

export function ClassMaterialsManager() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const { isSuperadmin, churchId, loading: rolesLoading } = useRoles();

  const [classId, setClassId] = useState("");
  const [trimester, setTrimester] = useState("1");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);

  // IDs de turmas permitidas para o admin de igreja (turmas com pelo menos 1 membro da igreja).
  const { data: allowedClassIds } = useQuery({
    queryKey: ["allowed-class-ids", churchId, isSuperadmin],
    enabled: !rolesLoading && !isSuperadmin && !!churchId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("class_id")
        .eq("church_id", churchId!)
        .not("class_id", "is", null);
      return Array.from(new Set((data ?? []).map((p: any) => p.class_id as string)));
    },
  });

  const handleNotifyAll = async (m: any) => {
    if (
      !confirm(
        `Disparar email para TODOS os usuários cadastrados sobre "${m.title}"?`,
      )
    ) {
      return;
    }
    setNotifyingId(m.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-bulk-material-notification",
        {
          body: {
            materialId: m.id,
            className: m.classes?.name ?? "",
            trimester: m.trimester,
            year: m.year,
            title: m.title,
            fileUrl: m.file_url,
          },
        },
      );
      if (error) throw error;
      if ((data as any)?.error === "email_not_configured") {
        toast.error(
          "Sistema de email ainda não ativado. Configure o domínio em Cloud → Emails.",
        );
      } else {
        toast.success(
          `📧 Emails disparados! ${(data as any)?.sent ?? 0} enviados, ${(data as any)?.skipped ?? 0} ignorados.`,
        );
      }
    } catch (e: any) {
      toast.error("Erro ao disparar emails: " + (e?.message ?? "desconhecido"));
    } finally {
      setNotifyingId(null);
    }
  };

  const { data: classes } = useQuery({
    queryKey: ["all-classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      return data ?? [];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("materials-classes-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "classes" }, () => {
        qc.invalidateQueries({ queryKey: ["all-classes"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  const { data: materials, refetch } = useQuery({
    queryKey: ["class-materials-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("class_materials")
        .select("*, classes(name)")
        .order("year", { ascending: false })
        .order("trimester", { ascending: false });
      return data ?? [];
    },
  });

  const visibleClasses = useMemo(() => {
    if (isSuperadmin || !allowedClassIds) return classes ?? [];
    return (classes ?? []).filter((c: any) => allowedClassIds.includes(c.id));
  }, [classes, isSuperadmin, allowedClassIds]);

  const visibleMaterials = useMemo(() => {
    if (isSuperadmin || !allowedClassIds) return materials ?? [];
    return (materials ?? []).filter((m: any) => allowedClassIds.includes(m.class_id));
  }, [materials, isSuperadmin, allowedClassIds]);

  const handleUpload = async () => {
    if (!classId || !file || !title) {
      toast.error("Preencha classe, título e selecione um PDF");
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("O arquivo precisa ser PDF");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF muito grande (máx 50MB)");
      return;
    }
    setUploading(true);
    const path = `${classId}/${year}-T${trimester}-${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from("class-materials")
      .upload(path, file, { upsert: true, contentType: "application/pdf" });
    if (upErr) {
      toast.error("Erro ao enviar PDF: " + upErr.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("class-materials").getPublicUrl(path);

    const { error: dbErr } = await supabase.from("class_materials").upsert(
      {
        class_id: classId,
        trimester: Number(trimester),
        year: Number(year),
        title,
        description: description || null,
        file_path: path,
        file_url: pub.publicUrl,
      },
      { onConflict: "class_id,trimester,year" }
    );

    if (dbErr) {
      toast.error("Erro ao salvar: " + dbErr.message);
    } else {
      toast.success("Revista publicada!");
      setTitle("");
      setDescription("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["class-materials-admin"] });
      qc.invalidateQueries({ queryKey: ["my-class-material"] });
    }
    setUploading(false);
  };

  const handleDelete = async (m: any) => {
    if (!confirm(`Remover "${m.title}"?`)) return;
    await supabase.storage.from("class-materials").remove([m.file_path]);
    await supabase.from("class_materials").delete().eq("id", m.id);
    toast.success("Removido");
    refetch();
    qc.invalidateQueries({ queryKey: ["my-class-material"] });
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Revistas da Classe</h2>
        <p className="text-sm text-muted-foreground">
          Envie o PDF da revista de cada classe por trimestre.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Classe</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {classes?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Trimestre</Label>
            <Select value={trimester} onValueChange={setTrimester}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((t) => (
                  <SelectItem key={t} value={String(t)}>{t}º</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ano</Label>
            <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Revista 1º TRI 2026" />
        </div>
        <div className="md:col-span-2">
          <Label>Descrição (opcional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="md:col-span-2">
          <Label>Arquivo PDF</Label>
          <Input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <Button onClick={handleUpload} disabled={uploading} className="w-full md:w-auto">
        {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
        Publicar revista
      </Button>

      <div className="space-y-2 pt-4 border-t border-border">
        <h3 className="font-medium text-foreground">Revistas publicadas</h3>
        {!materials || materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma revista ainda.</p>
        ) : (
          <ul className="space-y-2">
            {materials.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between gap-3 p-3 bg-muted/40 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.classes?.name} · {m.trimester}º TRI {m.year}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleNotifyAll(m)}
                    disabled={notifyingId === m.id}
                    title="Disparar email para todos os usuários"
                  >
                    {notifyingId === m.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Mail />
                    )}
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                      <Download />
                    </a>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(m)}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
