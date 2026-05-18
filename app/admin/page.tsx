import { PendingUsersPanel } from "@/components/admin/pending-users-panel";
import { Card, CardContent } from "@/components/ui/card";
import { listPendingUsersForApproval } from "@/lib/auth/actions";

export default async function AdminPage() {
  const pendingUsers = await listPendingUsersForApproval();

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-6">
          <h1 className="font-display text-3xl font-semibold">Panel de administración</h1>
          <p className="mt-2 text-base text-muted-foreground">Espacio reservado para gestión avanzada.</p>
        </CardContent>
      </Card>
      <PendingUsersPanel users={pendingUsers} />
    </div>
  );
}
