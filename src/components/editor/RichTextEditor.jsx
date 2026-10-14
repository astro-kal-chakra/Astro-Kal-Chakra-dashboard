"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Youtube from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Film,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  MonitorPlay as YoutubeIcon,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Button";
import { useToast } from "@/providers/ToastProvider";
import { uploadBlogMedia } from "@/actions/content";
import { Video } from "./videoNode";

const BLOCKS = [
  { value: "p", label: "Normal text" },
  { value: "1", label: "Heading 1" },
  { value: "2", label: "Heading 2" },
  { value: "3", label: "Heading 3" },
  { value: "4", label: "Heading 4" },
];
const SIZES = [
  { value: "", label: "Size" },
  { value: "14px", label: "Small" },
  { value: "16px", label: "Normal" },
  { value: "20px", label: "Large" },
  { value: "24px", label: "Larger" },
  { value: "32px", label: "Huge" },
];
const COLORS = ["#1c1511", "#6d4fd8", "#c2581a", "#0b8a5f", "#c62f3b", "#2b58c9", "#a86400"];

/**
 * Rich-text editor for blog articles (TipTap). Writes HTML to a hidden input named `name`, so the
 * surrounding <form> submits it like any other field. Images and short videos are uploaded and inserted at
 * the cursor; YouTube links are embedded. The backend sanitises the HTML again before saving.
 */
export function RichTextEditor({ name = "body", defaultValue = "", placeholder = "Start writing…" }) {
  const toast = useToast();
  const [html, setHtml] = useState(defaultValue);
  const [uploading, setUploading] = useState(null); // "image" | "video" | null
  const fileRef = useRef(null);
  const pending = useRef("image");

  const editor = useEditor({
    immediatelyRender: false, // Next.js: render on the client only
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ inline: false }),
      Youtube.configure({ nocookie: true, width: 640, height: 360, modestBranding: true }),
      Video,
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    onUpdate: ({ editor: e }) => setHtml(e.isEmpty ? "" : e.getHTML()),
    editorProps: { attributes: { class: "rich-content min-h-72 px-4 py-3 focus:outline-none" } },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            block: e.isActive("heading") ? String(e.getAttributes("heading").level) : "p",
            size: e.getAttributes("textStyle").fontSize || "",
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
            align: ["center", "right"].find((a) => e.isActive({ textAlign: a })) || "left",
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  const chain = () => editor.chain().focus();

  const setBlock = (v) => (v === "p" ? chain().setParagraph().run() : chain().toggleHeading({ level: Number(v) }).run());
  const setSize = (v) => (v ? chain().setFontSize(v).run() : chain().unsetFontSize().run());

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Link address (leave empty to remove the link)", prev);
    if (url === null) return;
    if (!url.trim()) return chain().extendMarkRange("link").unsetLink().run();
    chain().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("YouTube video link (youtube.com/watch?v=… or youtu.be/…)");
    if (!url?.trim()) return;
    const ok = editor.commands.setYoutubeVideo({ src: url.trim() });
    if (!ok) toast("That doesn't look like a YouTube link", { type: "error" });
  };

  const pick = (kind) => {
    pending.current = kind;
    if (fileRef.current) {
      fileRef.current.accept = kind === "image" ? "image/jpeg,image/png,image/webp" : "video/mp4,video/webm";
      fileRef.current.click();
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const kind = pending.current;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(kind);
    const r = await uploadBlogMedia(fd);
    setUploading(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    const url = r.data?.url;
    if (!url) return toast("Upload failed", { type: "error" });
    if (file.type.startsWith("video/")) chain().setVideo({ src: url }).run();
    else chain().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
      <input type="hidden" name={name} value={html} />
      <input ref={fileRef} type="file" className="sr-only" onChange={onFile} tabIndex={-1} aria-hidden />

      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-2 px-2 py-1.5">
        <ToolSelect value={state?.block ?? "p"} onChange={setBlock} options={BLOCKS} label="Text style" className="w-32" />
        <ToolSelect value={state?.size ?? ""} onChange={setSize} options={SIZES} label="Text size" className="w-24" />
        <Sep />
        <Tool label="Bold" active={state?.bold} onClick={() => chain().toggleBold().run()} icon={<Bold />} />
        <Tool label="Italic" active={state?.italic} onClick={() => chain().toggleItalic().run()} icon={<Italic />} />
        <Tool label="Underline" active={state?.underline} onClick={() => chain().toggleUnderline().run()} icon={<UnderlineIcon />} />
        <Tool label="Strikethrough" active={state?.strike} onClick={() => chain().toggleStrike().run()} icon={<Strikethrough />} />
        <span className="flex items-center gap-0.5 px-1" role="group" aria-label="Text colour">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={`Colour ${c}`}
              aria-label={`Text colour ${c}`}
              onClick={() => (c === COLORS[0] ? chain().unsetColor().run() : chain().setColor(c).run())}
              className="size-4 rounded-full border border-border"
              style={{ background: c }}
            />
          ))}
        </span>
        <Sep />
        <Tool label="Bulleted list" active={state?.bullet} onClick={() => chain().toggleBulletList().run()} icon={<List />} />
        <Tool label="Numbered list" active={state?.ordered} onClick={() => chain().toggleOrderedList().run()} icon={<ListOrdered />} />
        <Tool label="Quote" active={state?.quote} onClick={() => chain().toggleBlockquote().run()} icon={<Quote />} />
        <Tool label="Divider" onClick={() => chain().setHorizontalRule().run()} icon={<Minus />} />
        <Sep />
        <Tool label="Align left" active={state?.align === "left"} onClick={() => chain().setTextAlign("left").run()} icon={<AlignLeft />} />
        <Tool label="Align centre" active={state?.align === "center"} onClick={() => chain().setTextAlign("center").run()} icon={<AlignCenter />} />
        <Tool label="Align right" active={state?.align === "right"} onClick={() => chain().setTextAlign("right").run()} icon={<AlignRight />} />
        <Sep />
        <Tool label="Link" active={state?.link} onClick={setLink} icon={<Link2 />} />
        <Tool label="Insert image" onClick={() => pick("image")} disabled={Boolean(uploading)} icon={uploading === "image" ? <Spinner /> : <ImagePlus />} />
        <Tool label="Insert video (MP4 / WebM, up to 50 MB)" onClick={() => pick("video")} disabled={Boolean(uploading)} icon={uploading === "video" ? <Spinner /> : <Film />} />
        <Tool label="Embed a YouTube video" onClick={addYoutube} icon={<YoutubeIcon />} />
        <span className="ml-auto flex items-center gap-1">
          <Tool label="Undo" onClick={() => chain().undo().run()} disabled={!state?.canUndo} icon={<Undo2 />} />
          <Tool label="Redo" onClick={() => chain().redo().run()} disabled={!state?.canRedo} icon={<Redo2 />} />
        </span>
      </div>

      {uploading && (
        <p className="border-b border-border bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary-ink">
          Uploading {uploading}… it will appear where the cursor is.
        </p>
      )}
      <div className="max-h-[60vh] overflow-y-auto">{editor ? <EditorContent editor={editor} /> : <p className="min-h-72 px-4 py-3 text-sm text-muted">Loading editor…</p>}</div>
    </div>
  );
}

function Tool({ label, icon, onClick, active, disabled }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ?? undefined}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-text-2 transition-colors hover:bg-surface-3 disabled:opacity-40 [&_svg]:size-4",
        active && "bg-primary-soft text-primary-ink",
      )}
    >
      {icon}
    </button>
  );
}

function ToolSelect({ value, onChange, options, label, className }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("h-8 rounded-md border border-border bg-surface px-2 text-xs text-text focus:border-primary focus:outline-none", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

const Sep = () => <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
