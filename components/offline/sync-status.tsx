"use client";

import { CloudOff } from "lucide-react";
import { useEffect, useState } from "react";

export function SyncStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function refresh() {
      setOnline(navigator.onLine);
    }

    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);

    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <CloudOff
      aria-label="Sin conexión"
      className="h-5 w-5 text-zinc-700 dark:text-zinc-200"
      role="img"
    />
  );
}
