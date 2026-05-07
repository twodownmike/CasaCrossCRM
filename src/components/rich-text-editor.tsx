"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef, useState } from "react";
import { mdToHtml } from "@/lib/contracts";

type MergeField = readonly [string, string];

export function RichTextEditor({
  name = "body_md",
  initialValue = "",
  mergeFields,
}: {
  name?: string;
  initialValue?: string;
  mergeFields?: readonly MergeField[];
}) {
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"edit" | "preview" | "markdown">("edit");
  const [markdown, setMarkdown] = useState(initialValue);

  function setHiddenValue(next: string) {
    setMarkdown(next);
    if (hiddenRef.current) hiddenRef.current.value = next;
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: initialValue,
    onUpdate({ editor }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setHiddenValue((editor.storage as any).markdown.getMarkdown());
    },
  });

  useEffect(() => {
    const hidden = hiddenRef.current;
    const form = hidden?.form;
    if (!form || !editor) return;

    function syncBeforeSubmit() {
      if (!hiddenRef.current) return;
      if (mode === "markdown") {
        hiddenRef.current.value = markdown;
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hiddenRef.current.value = (editor.storage as any).markdown.getMarkdown();
    }

    form.addEventListener("submit", syncBeforeSubmit, { capture: true });
    return () => {
      form.removeEventListener("submit", syncBeforeSubmit, { capture: true });
    };
  }, [editor, markdown, mode]);

  function insertMergeField(field: string) {
    editor?.chain().focus().insertContent(field).run();
  }

  function syncMarkdownToEditor() {
    editor?.commands.setContent(markdown);
  }

  function toolbarBtn(active: boolean): React.CSSProperties {
    return {
      padding: "4px 9px",
      borderRadius: 6,
      border: `1px solid ${active ? "var(--ink-2)" : "var(--hair)"}`,
      background: active ? "var(--ink)" : "var(--paper)",
      color: active ? "var(--paper)" : "var(--ink-2)",
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: "var(--sans)",
      transition: "all 100ms",
    };
  }

  const tb = (label: string, isActive: boolean, action: () => void) => (
    <button
      type="button"
      style={toolbarBtn(isActive)}
      onMouseDown={(e) => {
        e.preventDefault();
        action();
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <input
        type="hidden"
        name={name}
        ref={hiddenRef}
        defaultValue={initialValue}
      />

      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        {(["edit", "preview", "markdown"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              if (mode === "markdown" && m !== "markdown") {
                syncMarkdownToEditor();
              }
              setMode(m);
            }}
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              border: `1px solid ${mode === m ? "var(--ink)" : "var(--hair)"}`,
              background: mode === m ? "var(--ink)" : "var(--paper)",
              color: mode === m ? "var(--paper)" : "var(--ink-3)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--sans)",
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: mode === "edit" ? "flex" : "none",
          gap: 4,
          flexWrap: "wrap",
          marginBottom: 6,
          padding: "6px 10px",
          background: "var(--hair-2)",
          borderRadius: "var(--r-2) var(--r-2) 0 0",
          border: "1px solid var(--hair)",
          borderBottom: "none",
        }}
      >
        {tb("B", editor?.isActive("bold") ?? false, () =>
          editor?.chain().focus().toggleBold().run(),
        )}
        {tb(
          "I",
          editor?.isActive("italic") ?? false,
          () => editor?.chain().focus().toggleItalic().run(),
        )}
        <div
          style={{
            width: 1,
            background: "var(--hair)",
            margin: "2px 4px",
            alignSelf: "stretch",
          }}
        />
        {tb("H1", editor?.isActive("heading", { level: 1 }) ?? false, () =>
          editor?.chain().focus().toggleHeading({ level: 1 }).run(),
        )}
        {tb("H2", editor?.isActive("heading", { level: 2 }) ?? false, () =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run(),
        )}
        {tb("H3", editor?.isActive("heading", { level: 3 }) ?? false, () =>
          editor?.chain().focus().toggleHeading({ level: 3 }).run(),
        )}
        <div
          style={{
            width: 1,
            background: "var(--hair)",
            margin: "2px 4px",
            alignSelf: "stretch",
          }}
        />
        {tb(
          "• List",
          editor?.isActive("bulletList") ?? false,
          () => editor?.chain().focus().toggleBulletList().run(),
        )}
        {tb(
          "1. List",
          editor?.isActive("orderedList") ?? false,
          () => editor?.chain().focus().toggleOrderedList().run(),
        )}
      </div>

      {/* Editor body */}
      <div
        className="input rte-body"
        style={{
          display: mode === "edit" ? "block" : "none",
          borderRadius: "0 0 var(--r-2) var(--r-2)",
          minHeight: 320,
          padding: 0,
          cursor: "text",
        }}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} className="rte-content" />
      </div>

      {mode === "preview" && (
        <div
          className="input sign-body"
          style={{
            borderRadius: "var(--r-2)",
            minHeight: 320,
            padding: 18,
            background: "var(--paper)",
          }}
          dangerouslySetInnerHTML={{ __html: mdToHtml(markdown) }}
        />
      )}

      {mode === "markdown" && (
        <textarea
          className="input textarea"
          value={markdown}
          onChange={(e) => setHiddenValue(e.target.value)}
          onBlur={syncMarkdownToEditor}
          spellCheck={false}
          style={{
            minHeight: 360,
            fontFamily: "ui-monospace, Menlo, monospace",
            fontSize: 12,
            lineHeight: 1.55,
            resize: "vertical",
          }}
        />
      )}

      {/* Merge fields */}
      {mergeFields && mergeFields.length > 0 && (
        <details
          className="card elev"
          style={{ padding: 14, fontSize: 13, marginTop: 14 }}
        >
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 500,
              color: "var(--ink-2)",
            }}
          >
            Available merge fields — click to insert
          </summary>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18 }}>
            {mergeFields.map(([k, label]) => (
              <li key={k} style={{ marginBottom: 6 }}>
                <button
                  type="button"
                  onClick={() => insertMergeField(k)}
                  style={{
                    background: "var(--hair-2)",
                    border: "1px solid var(--hair)",
                    borderRadius: 4,
                    padding: "1px 6px",
                    cursor: "pointer",
                    fontFamily: "ui-monospace, Menlo, monospace",
                    fontSize: 12,
                    color: "var(--ink)",
                  }}
                >
                  {k}
                </button>{" "}
                — <span className="muted">{label}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
