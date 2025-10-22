<script lang="ts" setup>
import { onMounted, onUnmounted } from "vue";
import { onContentUpdated } from "vitepress";
import "viewerjs/dist/viewer.css";

let viewer: any = null;

async function initViewer() {
  const docDomContainer = document.querySelector("#VPContent") as HTMLElement;
  if (!docDomContainer) return;

  const ViewerModule = await import("viewerjs");
  viewer = new ViewerModule.default(docDomContainer, {
    toolbar: {
      prev: {
        show: 1,
        size: "large",
      },
      next: {
        show: 1,
        size: "large",
      },
    },
  });
}

function destroyViewer() {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
}

async function previewImage(e: Event) {
  const target = e.target as HTMLElement;
  if (target.tagName.toLowerCase() !== "img") return;

  // 排除 link card 中的图片
  if (target.closest(".link-card")) return;

  if (!viewer) {
    await initViewer();
  }
  viewer?.show();
}

onMounted(() => {
  const docDomContainer = document.querySelector("#VPContent");
  docDomContainer?.addEventListener("click", previewImage);

  // 空闲时预加载 viewer.js，避免点击延迟
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => initViewer());
  } else {
    setTimeout(() => initViewer(), 2000);
  }
});

// 在路由切换/内容更新时重新初始化 viewer
onContentUpdated(() => {
  destroyViewer();

  // 使用 nextTick 确保 DOM 已更新
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => initViewer());
  } else {
    setTimeout(() => initViewer(), 100);
  }
});

onUnmounted(() => {
  const docDomContainer = document.querySelector("#VPContent");
  docDomContainer?.removeEventListener("click", previewImage);
  destroyViewer();
});
</script>

<template></template>
