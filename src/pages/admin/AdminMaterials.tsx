import { ClassMaterialsManager } from "@/components/admin/ClassMaterialsManager";
import { AdminPage } from "@/components/admin/AdminPage";
import { FileText } from "lucide-react";

export default function AdminMaterials() {
  return (
    <AdminPage
      title="Materiais de Aula"
      description="Upload e envio de materiais para as turmas."
      Icon={FileText}
      variant="amber"
    >
      <ClassMaterialsManager />
    </AdminPage>
  );
}
