import { updateUserApprovalAction } from "@/lib/auth/actions";
import type { PendingUser } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatRequestedAt(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function PendingUsersPanel({ users }: { users: PendingUser[] }) {
  async function submitApproval(formData: FormData) {
    "use server";

    await updateUserApprovalAction(formData);
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-2xl font-semibold">Altas pendientes</h2>
        <p className="text-sm text-muted-foreground">Usuarios que ya han validado el código OTP y esperan aprobación.</p>
      </div>
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-5 text-sm text-muted-foreground">No hay usuarios pendientes ahora mismo.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
                      Pendiente
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.unit} · {user.position} · {formatRequestedAt(user.createdAt)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <form action={submitApproval}>
                    <input name="userId" type="hidden" value={user.id} />
                    <input name="decision" type="hidden" value="reject" />
                    <Button className="w-full" type="submit" variant="outline">
                      Rechazar
                    </Button>
                  </form>
                  <form action={submitApproval}>
                    <input name="userId" type="hidden" value={user.id} />
                    <input name="decision" type="hidden" value="approve" />
                    <Button className="w-full" type="submit">
                      Aprobar
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
