import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseFormUploadValue } from "@/lib/form-uploads";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { id: string; responseId: string; fieldKey: string };
  },
) {
  const supabase = createClient();
  const [{ data: userData }, { data: isTeamMember }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("is_team_member"),
  ]);
  if (!userData.user || !isTeamMember) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: response } = await supabase
    .from("form_responses")
    .select("data")
    .eq("id", params.responseId)
    .eq("form_id", params.id)
    .maybeSingle();
  const upload = parseFormUploadValue(
    (response?.data as Record<string, unknown> | undefined)?.[params.fieldKey],
  );
  if (!upload || !upload.path.startsWith(`${params.id}/`)) {
    return new NextResponse("File not found", { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from("form-uploads")
    .createSignedUrl(upload.path, 60, { download: upload.name });
  if (error || !data?.signedUrl) {
    return new NextResponse("File not found", { status: 404 });
  }
  return NextResponse.redirect(data.signedUrl);
}
