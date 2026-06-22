import { ProjectsRoute } from "@/components/ship/project-sections";
import { ShipShell } from "@/components/ship/ship-shell";

export default function HistoryPage() {
  return (
    <ShipShell>
      <ProjectsRoute mode="history" />
    </ShipShell>
  );
}
