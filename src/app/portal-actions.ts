"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

async function requireTeam() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: isTeamMember } = await supabase.rpc("is_team_member");
  if (!isTeamMember) redirect("/portal");
  return { supabase, user };
}

export async function grantPortalAccess(form: FormData) {
  const { supabase, user } = await requireTeam();
  const personId = s(form, "person_id");
  const email = s(form, "email").toLowerCase();
  const displayName = s(form, "display_name");
  if (!personId || !email) return;

  await supabase.from("portal_users").upsert(
    {
      person_id: personId,
      email,
      display_name: displayName || null,
      active: true,
      created_by: user.id,
    },
    { onConflict: "person_id,email" },
  );

  revalidatePath(`/people/${personId}`);
}

export async function revokePortalAccess(form: FormData) {
  const { supabase } = await requireTeam();
  const id = s(form, "id");
  const personId = s(form, "person_id");
  if (!id) return;

  await supabase.from("portal_users").update({ active: false }).eq("id", id);
  if (personId) revalidatePath(`/people/${personId}`);
}
