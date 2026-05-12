"use server";

import { createClient } from "@/lib/supabase/server";

export async function listUnits() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("units").select("name").order("name", { ascending: true });

  if (error || !data || data.length === 0) {
    return ["Urgencias"];
  }

  return data.map((unit) => unit.name);
}
