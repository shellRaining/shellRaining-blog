import type MarkdownIt from "markdown-it";

export interface MermaidMarkdownOptions {
  class?: string;
}

export function createMermaidMarkdown(options: MermaidMarkdownOptions = {}) {
  const cssClass = options.class || "mermaid";
  return (md: MarkdownIt) => {
    const defaultFence = md.renderer.rules.fence?.bind(md.renderer.rules);

    md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
      const token = tokens[idx];
      const info = (token.info || "").trim();

      if (info === "mermaid") {
        const code = token.content;
        const encoded = encodeURIComponent(code);
        return `<div class="${cssClass}" data-graph="${encoded}">${md.utils.escapeHtml(code)}</div>`;
      }

      // allow highlighting mermaid code itself via ```mmd
      if (info === "mmd") {
        tokens[idx].info = "mermaid";
      }

      if (defaultFence) return defaultFence(tokens, idx, opts, env, self);
      return self.renderToken(tokens, idx, opts);
    };
  };
}
