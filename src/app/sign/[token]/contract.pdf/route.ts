import { renderToBuffer } from "@react-pdf/renderer";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasVisiblePngSignature } from "@/lib/signatures";
import type { ContractTokenView } from "@/lib/types";
import {
  SignedContractPdf,
  signedContractFilename,
} from "../contract-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_contract_by_token", {
    token: params.token,
  });
  if (error) console.error("get_contract_by_token failed", error);

  const contract = (data as ContractTokenView | null) || null;
  if (!contract || !contract.body_md?.trim()) notFound();

  const buffer = await renderToBuffer(
    SignedContractPdf({
      contract,
      includeSignatureImage: hasVisiblePngSignature(contract.signature_url),
    }),
  );
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${signedContractFilename(contract)}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
