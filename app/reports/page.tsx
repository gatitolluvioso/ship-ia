import { ProjectsRoute } from "@/components/ship/project-sections";
import { ShipShell } from "@/components/ship/ship-shell";

export default function ReportsPage() {
  return (
    <ShipShell>
      <ProjectsRoute mode="reports" />
    </ShipShell>
  );
}
