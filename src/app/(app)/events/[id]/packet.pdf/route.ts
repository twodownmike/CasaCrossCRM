import { renderToBuffer } from "@react-pdf/renderer";
import { notFound, redirect } from "next/navigation";
import { getEvent } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import {
  EventPacketPdf,
  eventPacketFilename,
  type PacketContract,
  type PacketFormAssignment,
} from "../packet-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: isTeamMember } = await supabase.rpc("is_team_member");
  if (!isTeamMember) redirect("/portal");

  const event = await getEvent(params.id);
  if (!event) notFound();

  const participantIds = event.participants.map((p) => p.id);
  const [{ data: contracts }, { data: formAssignments }] = participantIds.length
    ? await Promise.all([
        supabase
          .from("contracts")
          .select("participant_id, title, status, sent_at, signed_at, created_at")
          .in("participant_id", participantIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("form_assignments")
          .select("participant_id, sent_at, completed_at, form:forms(title)")
          .in("participant_id", participantIds)
          .order("created_at", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const buffer = await renderToBuffer(
    EventPacketPdf({
      event,
      contracts: (contracts ?? []) as PacketContract[],
      formAssignments: (formAssignments ?? []) as PacketFormAssignment[],
    }),
  );

  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${eventPacketFilename(event)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
