<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";
import { onContentUpdated } from "vitepress";
import ImageViewer from "./ImageViewer.vue";

const viewerVisible = ref(false);
const currentImageSrc = ref("");

function previewImage(e: Event) {
  const target = e.target as HTMLElement;
  if (target.tagName.toLowerCase() !== "img") return;

  // 排除 link card 中的图片
  if (target.closest(".link-card")) return;

  const imgSrc = (target as HTMLImageElement).src;
  if (!imgSrc) return;

  currentImageSrc.value = imgSrc;
  viewerVisible.value = true;
}

onMounted(() => {
  const docDomContainer = document.querySelector("#VPContent");
  docDomContainer?.addEventListener("click", previewImage);
});

// 在路由切换/内容更新时关闭查看器
onContentUpdated(() => {
  viewerVisible.value = false;
});

onUnmounted(() => {
  const docDomContainer = document.querySelector("#VPContent");
  docDomContainer?.removeEventListener("click", previewImage);
});
</script>

<template>
  <ImageViewer
    v-model:visible="viewerVisible"
    :image-src="currentImageSrc"
  />
</template>
