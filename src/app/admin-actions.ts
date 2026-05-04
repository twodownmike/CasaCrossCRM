"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function s(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function nullable(form: FormData, key: string) {
  const v = s(form, key);
  return v === "" ? null : v;
}

export async function updateStudioSettings(form: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await supabase
    .from("studio_settings")
    .update({
      studio_name: s(form, "studio_name") || "Casa Cross Events",
      contact_email: nullable(form, "contact_email"),
      contact_phone: nullable(form, "contact_phone"),
      instagram: nullable(form, "instagram"),
      website: nullable(form, "website"),
      apply_intro: nullable(form, "apply_intro"),
      apply_thank_you: nullable(form, "apply_thank_you"),
      email_signature: nullable(form, "email_signature"),
      venmo_url: nullable(form, "venmo_url"),
    })
    .eq("id", 1);
  revalidatePath("/admin/studio");
  revalidatePath("/admin");
  revalidatePath("/apply");
  revalidatePath("/apply/thanks");
}

export async function inviteTeamMember(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const email = s(form, "email");
  const name = nullable(form, "name");
  if (!email) return { ok: false, error: "Email is required." };
  const { data, error } = await supabase.rpc("invite_team_member", {
    member_email: email,
    name: name,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as { ok: boolean; error?: string } | null;
  if (!r?.ok) return { ok: false, error: r?.error || "Could not add member." };
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function removeTeamMember(
  form: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const userId = s(form, "user_id");
  if (!userId) return { ok: false, error: "Missing user." };
  const { data, error } = await supabase.rpc("remove_team_member", {
    uid: userId,
  });
  if (error) return { ok: false, error: error.message };
  const r = data as { ok: boolean; error?: string } | null;
  if (!r?.ok) return { ok: false, error: r?.error || "Could not remove." };
  revalidatePath("/admin/team");
  return { ok: true };
}
