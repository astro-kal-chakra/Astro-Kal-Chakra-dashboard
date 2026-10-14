"use client";

import { useRef, useState } from "react";
import { Film, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useToast } from "@/providers/ToastProvider";
import { uploadBlogMedia } from "@/actions/content";

const YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

/**
 * Cover of an article: an image (card + top of the article) and, optionally, a short video that plays at
 * the top of the article (uploaded MP4 / WebM, or a YouTube link). Submitted as hidden `cover` / `video`.
 */
export function BlogCoverField({ cover: initialCover, video: initialVideo }) {
  const toast = useToast();
  const [cover, setCover] = useState(initialCover || "");
  const [video, setVideo] = useState(initialVideo || "");
  const [busy, setBusy] = useState(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const upload = async (file, kind) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setBusy(kind);
    const r = await uploadBlogMedia(fd);
    setBusy(null);
    if (!r.ok) return toast(r.error.message, { type: "error" });
    if (kind === "image") setCover(r.data.url);
    else setVideo(r.data.url);
  };

  const youtubeId = video.match(YOUTUBE)?.[1];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="cover" value={cover} />
      <input type="hidden" name="video" value={video} />
      <input ref={imageRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => { upload(e.target.files?.[0], "image"); e.target.value = ""; }} />
      <input ref={videoRef} type="file" accept="video/mp4,video/webm" className="sr-only" onChange={(e) => { upload(e.target.files?.[0], "video"); e.target.value = ""; }} />

      <Field label="Cover image" help="Shown on the blog cards and at the top of the article. JPG, PNG or WebP, up to 10 MB (1200 × 675 works best).">
        {cover ? (
          <div className="relative overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="aspect-video w-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button size="xs" onClick={() => imageRef.current?.click()} loading={busy === "image"}>Change</Button>
              <Button size="xs" variant="danger-soft" icon={<Trash2 />} onClick={() => setCover("")} aria-label="Remove cover image" />
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => imageRef.current?.click()} disabled={busy === "image"} className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border-strong bg-surface-2 text-sm text-text-2 hover:bg-surface-3">
            <ImagePlus className="size-5 text-muted" />
            {busy === "image" ? "Uploading…" : "Upload cover image"}
          </button>
        )}
      </Field>

      <Field label="Cover video (optional)" help="Plays at the top of the article instead of the image. Upload an MP4 / WebM (up to 50 MB) or paste a YouTube link.">
        {video ? (
          <div className="relative overflow-hidden rounded-lg border border-border bg-black">
            {youtubeId ? (
              <iframe src={`https://www.youtube-nocookie.com/embed/${youtubeId}`} title="Cover video" className="aspect-video w-full" allowFullScreen />
            ) : (
              <video src={video} controls playsInline preload="metadata" className="aspect-video w-full" />
            )}
            <Button size="xs" variant="danger-soft" icon={<Trash2 />} onClick={() => setVideo("")} className="absolute top-2 right-2" aria-label="Remove cover video" />
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface-2 p-3">
            <Button size="sm" icon={<Film />} loading={busy === "video"} onClick={() => videoRef.current?.click()}>
              Upload video
            </Button>
            <p className="text-center text-xs text-muted">or</p>
            <Input
              placeholder="Paste a YouTube link"
              onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (!v) return;
                if (!YOUTUBE.test(v)) return toast("That doesn't look like a YouTube link", { type: "error" });
                setVideo(v);
              }}
            />
          </div>
        )}
      </Field>
    </div>
  );
}
