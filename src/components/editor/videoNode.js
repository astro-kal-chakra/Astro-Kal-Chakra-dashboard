import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Uploaded video (MP4 / WebM) as its own block in the article: <video src controls playsinline>.
 * Reads <video src> and <video><source src></video> back when an article is edited again.
 */
export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      poster: { default: null },
    };
  },

  parseHTML() {
    return [
      { tag: "video[src]" },
      { tag: "video", getAttrs: (el) => ({ src: el.querySelector("source")?.getAttribute("src") || null }) },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { controls: "controls", playsinline: "playsinline", preload: "metadata" })];
  },

  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
