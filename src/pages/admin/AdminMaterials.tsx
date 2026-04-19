import { ClassMaterialsManager } from "@/components/admin/ClassMaterialsManager";

export default function AdminMaterials() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Materiais de Aula</h2>
        <p className="text-sm text-muted-foreground">Upload e envio de materiais para as turmas</p>
      </div>
      <ClassMaterialsManager />
    </div>
  );
}
