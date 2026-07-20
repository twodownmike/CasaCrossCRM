import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseFormUploadValue } from "@/lib/form-uploads";

const VALID_RANGES = new Set(["7", "30", "90", "all"]);

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const rangeParam = new URL(request.url).searchParams.get("range") || "30";
  const range = VALID_RANGES.has(rangeParam) ? rangeParam : "30";
  const [{ data: form }, { data: fields }] = await Promise.all([
    supabase.from("forms").select("title").eq("id", params.id).maybeSingle(),
    supabase
      .from("form_fields")
      .select("field_key, label, type")
      .eq("form_id", params.id)
      .neq("type", "section")
      .order("position", { ascending: true }),
  ]);
  if (!form) return new NextResponse("Form not found", { status: 404 });

  let query = supabase
    .from("form_responses")
    .select("created_at, status, completion_seconds, data")
    .eq("form_id", params.id)
    .order("created_at", { ascending: false });
  if (range !== "all") {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(range) + 1);
    cutoff.setHours(0, 0, 0, 0);
    query = query.gte("created_at", cutoff.toISOString());
  }
  const { data: responses, error } = await query;
  if (error) return new NextResponse(error.message, { status: 500 });

  const header = [
    "Submitted at",
    "Workflow status",
    "Completion seconds",
    ...(fields ?? []).map((field) => field.label),
  ];
  const rows = (responses ?? []).map((response) => [
    response.created_at,
    response.status,
    response.completion_seconds ?? "",
    ...(fields ?? []).map((field) =>
      csvValue((response.data as Record<string, unknown>)[field.field_key]),
    ),
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const filename = `${slugify(form.title)}-responses-${range}-days.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function csvValue(value: unknown) {
  const upload = parseFormUploadValue(value);
  if (upload) return upload.name;
  if (Array.isArray(value)) return value.join("; ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value === null || value === undefined ? "" : String(value);
}

function escapeCsvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "form"
  );
}
