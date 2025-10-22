<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick, onBeforeUnmount } from "vue";

let mermaid: any | null = null;
let observer: MutationObserver | null = null;
const Z_MIN = 0.25;
const Z_MAX = 4;
const Z_STEP = 0.2; // toolbar button step
const Z_WHEEL_STEP = 0.03; // ctrl/cmd + wheel step (less sensitive)
const Z_WHEEL_STEP_MODAL = 0.02; // modal wheel step (even less sensitive)

const modalOpen = ref(false);
const modalContainer = ref<HTMLDivElement | null>(null);
let modalKeyHandler: ((e: KeyboardEvent) => void) | null = null;

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function loadMermaidFromCDN(version = "11.2.1"): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).mermaid) return resolve((window as any).mermaid);
    const script = document.createElement("script");
    script.src = `https://cdn.jsdelivr.net/npm/mermaid@${version}/dist/mermaid.min.js`;
    script.async = true;
    script.onload = () => resolve((window as any).mermaid);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensureMermaid() {
  if (mermaid) return mermaid;
  try {
    const mod = await import("mermaid");
    mermaid = (mod as any).default || (mod as any);
  } catch {
    mermaid = await loadMermaidFromCDN();
  }
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: isDark() ? "dark" : "default",
  });
  return mermaid;
}

function getGraph(el: HTMLElement): string | null {
  const raw = el.getAttribute("data-graph");
  if (raw) return decodeURIComponent(raw);
  return el.textContent;
}

function parseViewBox(svg: SVGSVGElement) {
  const vb = svg.getAttribute("viewBox");
  if (vb) {
    const [x, y, w, h] = vb.split(/\s+/).map(Number);
    return { x, y, w, h };
  }
  // fallback from width/height
  const width = Number(svg.getAttribute("width")) || svg.clientWidth || 800;
  const height = Number(svg.getAttribute("height")) || svg.clientHeight || 600;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  return { x: 0, y: 0, w: width, h: height };
}

function buildInteractiveShell(
  target: HTMLElement,
  svgEl: SVGSVGElement,
  options: {
    enableClose?: boolean;
    onClose?: () => void;
    onOpenModal?: () => void;
    modalMode?: boolean;
  } = {},
) {
  const {
    enableClose = false,
    onClose,
    onOpenModal,
    modalMode = false,
  } = options;

  // Generate unique ID suffix for this instance
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const toolbar = document.createElement("div");
  toolbar.className = "mmd-toolbar";
  toolbar.innerHTML = `
    <button id="mmd-zoom-in-${uniqueId}" class="mmd-btn" data-action="zoom-in" title="放大">+</button>
    <button id="mmd-zoom-out-${uniqueId}" class="mmd-btn" data-action="zoom-out" title="缩小">−</button>
    <button id="mmd-reset-${uniqueId}" class="mmd-btn" data-action="reset" title="重置">⟳</button>
    <button id="mmd-view-${uniqueId}" class="mmd-btn" data-action="view" title="全屏">⛶</button>
    ${enableClose ? `<button id="mmd-close-${uniqueId}" class="mmd-btn" data-action="close" title="关闭">✕</button>` : ""}
  `;

  const viewport = document.createElement("div");
  viewport.className = "mmd-viewport";
  const canvas = document.createElement("div");
  canvas.className = "mmd-canvas";
  // Ensure SVG scales crisply inside viewport
  svgEl.removeAttribute("width");
  svgEl.removeAttribute("height");
  // Remove max-width from inline styles to prevent clipping in modal
  const style = svgEl.getAttribute("style");
  if (style) {
    const newStyle = style.replace(/max-width\s*:\s*[^;]+;?/gi, "");
    if (newStyle.trim()) {
      svgEl.setAttribute("style", newStyle);
    } else {
      svgEl.removeAttribute("style");
    }
  }
  svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
  canvas.appendChild(svgEl);
  viewport.appendChild(canvas);

  target.innerHTML = "";
  target.appendChild(toolbar);
  target.appendChild(viewport);

  // Zoom/Pan via SVG viewBox for crisp scaling
  const orig = parseViewBox(svgEl);
  let x = orig.x;
  let y = orig.y;
  let w = orig.w;
  let h = orig.h;
  let zoom = 1;

  const apply = () => {
    svgEl.setAttribute("viewBox", `${x} ${y} ${w} ${h}`);
  };

  const clamp = (z: number) => Math.min(Z_MAX, Math.max(Z_MIN, z));

  const zoomAt = (delta: number, clientX?: number, clientY?: number) => {
    const prev = zoom;
    const next = clamp(zoom + delta);
    if (next === prev) return;
    const rect = viewport.getBoundingClientRect();
    const px = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const py = (clientY ?? rect.top + rect.height / 2) - rect.top;
    // anchor as fraction in current view
    const ax = px / rect.width;
    const ay = py / rect.height;
    const newW = orig.w / next;
    const newH = orig.h / next;
    // keep anchor stable: shift x/y accordingly
    x = x + ax * (w - newW);
    y = y + ay * (h - newH);
    w = newW;
    h = newH;
    zoom = next;
    apply();
  };

  const reset = () => {
    x = orig.x;
    y = orig.y;
    w = orig.w;
    h = orig.h;
    zoom = 1;
    apply();
  };

  // Toolbar actions
  toolbar.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest(
      ".mmd-btn",
    ) as HTMLButtonElement | null;
    if (!btn) return;
    const action = btn.getAttribute("data-action");
    if (action === "zoom-in") zoomAt(Z_STEP);
    else if (action === "zoom-out") zoomAt(-Z_STEP);
    else if (action === "reset") reset();
    else if (action === "view") onOpenModal?.();
    else if (enableClose && action === "close") onClose?.();
  });

  // Wheel zoom - Ctrl/Cmd in normal mode, always active in modal
  viewport.addEventListener(
    "wheel",
    (e) => {
      if (!modalMode && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const step = modalMode ? Z_WHEEL_STEP_MODAL : Z_WHEEL_STEP;
      const delta = e.deltaY < 0 ? step : -step;
      zoomAt(delta, e.clientX, e.clientY);
    },
    { passive: false },
  );

  // Drag to pan (in SVG units)
  let dragging = false;
  let sx = 0,
    sy = 0;
  viewport.addEventListener("mousedown", (e) => {
    dragging = true;
    sx = e.clientX;
    sy = e.clientY;
    viewport.classList.add("mmd-panning");
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const rect = viewport.getBoundingClientRect();
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    sx = e.clientX;
    sy = e.clientY;
    // convert pixels to SVG units using current viewBox scale
    x -= dx * (w / rect.width);
    y -= dy * (h / rect.height);
    apply();
  });
  window.addEventListener("mouseup", () => {
    dragging = false;
    viewport.classList.remove("mmd-panning");
  });
  viewport.addEventListener("dblclick", reset);

  apply();
}

async function openModal(graph: string) {
  modalOpen.value = true;
  await nextTick();
  if (!modalContainer.value) return;

  // 设置模态框容器并添加加载状态
  modalContainer.value.classList.add("mmd-modal-loading");
  modalContainer.value.innerHTML = "";

  const m = await ensureMermaid();
  const { svg } = await m.render(`mmd-modal-${Date.now()}`, graph);
  const temp = document.createElement("div");
  temp.innerHTML = svg;
  const svgEl = temp.querySelector("svg") as SVGSVGElement | null;

  if (!svgEl) {
    modalContainer.value.classList.remove("mmd-modal-loading");
    return;
  }

  // 移除加载状态并构建交互式shell
  modalContainer.value.classList.remove("mmd-modal-loading");

  const wrapper = document.createElement("div");
  wrapper.className = "mmd-dialog";
  modalContainer.value.appendChild(wrapper);
  buildInteractiveShell(wrapper, svgEl, {
    enableClose: true,
    onClose: closeModal,
    modalMode: true,
  });

  // ESC to close
  modalKeyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeModal();
  };
  window.addEventListener("keydown", modalKeyHandler);
}

function closeModal() {
  modalOpen.value = false;
  if (modalKeyHandler) window.removeEventListener("keydown", modalKeyHandler);
  modalKeyHandler = null;
  if (modalContainer.value) modalContainer.value.innerHTML = "";
}

async function renderOne(el: HTMLElement, index: number) {
  // 添加加载状态
  el.classList.add("mmd-loading");

  const m = await ensureMermaid();
  const graph = getGraph(el);
  if (!graph) return;
  const id = `mmd-${Date.now()}-${index}`;
  try {
    const { svg } = await m.render(id, graph);
    const temp = document.createElement("div");
    temp.innerHTML = svg;
    const svgEl = temp.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) return;
    buildInteractiveShell(el, svgEl, { onOpenModal: () => openModal(graph) });
    el.setAttribute("data-processed", "true");
  } catch (e) {
    el.innerHTML = `<pre class="mmd-error">${(e as Error).message}</pre>`;
  } finally {
    // 移除加载状态
    el.classList.remove("mmd-loading");
  }
}

async function renderAll(root: ParentNode = document) {
  const nodes = Array.from(
    root.querySelectorAll<HTMLElement>("#VPContent .mermaid"),
  );
  // 并行处理所有图表而不是串行，确保都能显示加载状态
  const promises = nodes.map((el, index) => {
    if (el.getAttribute("data-processed") === "true") return Promise.resolve();
    return renderOne(el, index);
  });
  await Promise.all(promises);
}

function observeContent() {
  const container = document.querySelector("#VPContent");
  if (!container) return;
  observer = new MutationObserver((mutations) => {
    let shouldRender = false;
    for (const m of mutations) {
      if (
        m.type === "childList" &&
        (m.addedNodes.length || m.removedNodes.length)
      ) {
        shouldRender = true;
        break;
      }
      if (
        m.type === "attributes" &&
        (m.target as HTMLElement).classList.contains("content")
      ) {
        shouldRender = true;
        break;
      }
    }
    if (shouldRender) renderAll(container);
  });
  observer.observe(container, { childList: true, subtree: true });
}

function observeAppearance() {
  const html = document.documentElement;
  const htmlObserver = new MutationObserver(async (mutations) => {
    for (const m of mutations) {
      if (m.type === "attributes" && m.attributeName === "class") {
        if (!mermaid) continue;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          theme: isDark() ? "dark" : "default",
        });
        // Reset processed state and re-render to apply theme
        document.querySelectorAll("#VPContent .mermaid").forEach((el) => {
          el.removeAttribute("data-processed");
        });
        await renderAll();
      }
    }
  });
  htmlObserver.observe(html, { attributes: true, attributeFilter: ["class"] });
}

onMounted(async () => {
  await renderAll();
  observeContent();
  observeAppearance();
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
});

onBeforeUnmount(() => {
  if (modalKeyHandler) window.removeEventListener("keydown", modalKeyHandler);
});
</script>

<template>
  <div v-if="modalOpen" class="mmd-modal" @click.self="closeModal">
    <div class="mmd-modal-container" ref="modalContainer"></div>
  </div>
</template>

<style scoped>
.mmd-error {
  color: var(--vp-c-danger-2);
  white-space: pre-wrap;
}
</style>
