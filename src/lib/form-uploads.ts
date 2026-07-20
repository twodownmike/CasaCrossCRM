export type FormUploadValue = {
  path: string;
  name: string;
  type: string;
  size: number;
};

export const FORM_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const FORM_UPLOAD_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf";

export function parseFormUploadValue(value: unknown): FormUploadValue | null {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }
  const candidate = parsed as Partial<FormUploadValue>;
  if (
    typeof candidate.path !== "string" ||
    typeof candidate.name !== "string" ||
    typeof candidate.type !== "string" ||
    typeof candidate.size !== "number"
  ) {
    return null;
  }
  return {
    path: candidate.path,
    name: candidate.name,
    type: candidate.type,
    size: candidate.size,
  };
}

export function isAllowedFormUpload(file: { name: string; type: string }) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ].includes(file.type) ||
    ["jpg", "jpeg", "png", "webp", "heic", "heif", "pdf"].includes(
      extension || "",
    )
  );
}

export function formUploadMimeType(file: { name: string; type: string }) {
  if (
    [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "image/heif",
      "application/pdf",
    ].includes(file.type)
  ) {
    return file.type;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      heic: "image/heic",
      heif: "image/heif",
      pdf: "application/pdf",
    }[extension || ""] || "application/octet-stream"
  );
}
