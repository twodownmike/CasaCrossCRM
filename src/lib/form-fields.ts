export function normalizeFormFieldOptions(options: unknown): string[] {
  if (Array.isArray(options)) {
    return options
      .map((option) => String(option).trim())
      .filter(Boolean);
  }

  if (typeof options === "string") {
    const trimmed = options.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return normalizeFormFieldOptions(JSON.parse(trimmed));
      } catch {
        // Fall through to line splitting for malformed legacy values.
      }
    }

    return trimmed
      .split(/\r?\n/)
      .map((option) => option.trim())
      .filter(Boolean);
  }

  return [];
}
