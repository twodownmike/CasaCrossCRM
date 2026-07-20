"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FORM_UPLOAD_ACCEPT,
  FORM_UPLOAD_MAX_BYTES,
  formUploadMimeType,
  isAllowedFormUpload,
  parseFormUploadValue,
  type FormUploadValue,
} from "@/lib/form-uploads";
import type { FormField } from "@/lib/types";

export function FileUploadInput({
  formId,
  field,
  savedValue,
  onValueChange,
  onPendingChange,
}: {
  formId: string;
  field: FormField;
  savedValue: unknown;
  onValueChange: (value: FormUploadValue | null) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState(() => parseFormUploadValue(savedValue));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = `field-${field.id}`;

  async function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > FORM_UPLOAD_MAX_BYTES) {
      setError("Choose a file smaller than 10 MB.");
      event.target.value = "";
      return;
    }
    if (!isAllowedFormUpload(file)) {
      setError("Choose a JPG, PNG, WebP, HEIC, or PDF file.");
      event.target.value = "";
      return;
    }

    setPending(true);
    onPendingChange(true);
    try {
      const safeName =
        file.name
          .normalize("NFKD")
          .replace(/[^a-zA-Z0-9._-]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(-100) || "upload";
      const path = `${formId}/${field.id}/${window.crypto.randomUUID()}-${safeName}`;
      const supabase = createClient();
      const contentType = formUploadMimeType(file);
      const { error: uploadError } = await supabase.storage
        .from("form-uploads")
        .upload(path, file, {
          cacheControl: "3600",
          contentType,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const nextValue: FormUploadValue = {
        path,
        name: file.name.slice(0, 180),
        type: contentType,
        size: file.size,
      };
      setUpload(nextValue);
      onValueChange(nextValue);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The file could not be uploaded.",
      );
      event.target.value = "";
    } finally {
      setPending(false);
      onPendingChange(false);
    }
  }

  function clear() {
    setUpload(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onValueChange(null);
  }

  return (
    <div>
      <label className="form-label" htmlFor={inputId}>
        {field.label}
        {field.required && (
          <span style={{ color: "var(--terracotta)", marginLeft: 4 }}>*</span>
        )}
      </label>
      <input
        type="hidden"
        name={field.field_key}
        value={upload ? JSON.stringify(upload) : ""}
      />
      <div className={`form-upload-control${upload ? " has-file" : ""}`}>
        {upload && (
          <div className="form-upload-file">
            <strong>{upload.name}</strong>
            <span>{formatBytes(upload.size)}</span>
          </div>
        )}
        <label className="btn" htmlFor={inputId}>
          {pending ? "Uploading…" : upload ? "Replace file" : "Choose file"}
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={FORM_UPLOAD_ACCEPT}
          disabled={pending}
          onChange={pickFile}
          className="form-upload-native"
        />
        {upload && (
          <button className="cancel-link" type="button" onClick={clear}>
            Remove
          </button>
        )}
      </div>
      <p className="muted form-upload-note">
        {field.helper || "JPG, PNG, WebP, HEIC, or PDF. Maximum 10 MB."}
      </p>
      {error && (
        <div className="form-upload-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
