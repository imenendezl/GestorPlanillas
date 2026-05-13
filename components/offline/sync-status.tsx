"use client";

import { CloudOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { readOfflineStore, requestOfflineSync, subscribeOfflineStore } from "@/lib/offline/client-store";
import { webConnectivityAdapter } from "@/lib/platform/web";

export function SyncStatus() {
  const [online, setOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [lastSyncErrorAt, setLastSyncErrorAt] = useState<number | null>(null);

  useEffect(() => {
    function refresh() {
      const store = readOfflineStore();
      setOnline(webConnectivityAdapter.isOnline());
      setQueueCount(store.queue.length);
      setLastSyncErrorAt(store.lastSyncErrorAt);
    }

    refresh();
    const unsubscribeConnectivity = webConnectivityAdapter.subscribe(refresh);
    const unsubscribeStore = subscribeOfflineStore(refresh);

    return () => {
      unsubscribeConnectivity();
      unsubscribeStore();
    };
  }, []);

  if (online && queueCount === 0 && !lastSyncErrorAt) {
    return null;
  }

  return (
    <button
      aria-label={online ? "Sincronizar cambios pendientes" : "Sin conexión"}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-black/8 px-2.5 text-xs font-semibold text-zinc-800 transition hover:bg-black/12 dark:bg-white/12 dark:text-zinc-100"
      onClick={requestOfflineSync}
      type="button"
    >
      {online ? <RefreshCw className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      {queueCount > 0 ? <span>{queueCount}</span> : <span className="sr-only">Estado local</span>}
    </button>
  );
}
