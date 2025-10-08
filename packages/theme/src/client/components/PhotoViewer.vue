<template>
  <Teleport to="body">
    <div class="photo-viewer" @click.self="close">
      <!-- 背景遮罩 -->
      <div class="photo-viewer-backdrop"></div>

      <!-- 顶部工具栏 -->
      <div class="photo-viewer-toolbar">
        <div class="toolbar-left">
          <span class="photo-counter"
            >{{ currentIndex + 1 }} / {{ photos.length }}</span
          >
        </div>
        <div class="toolbar-right">
          <button
            type="button"
            class="toolbar-button"
            title="分享"
            @click="sharePhoto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </button>
          <button
            type="button"
            class="toolbar-button"
            title="关闭 (ESC)"
            @click="close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Swiper 容器 -->
      <div class="photo-viewer-swiper-container">
        <swiper-container
          ref="swiperRef"
          :initial-slide="initialIndex"
          :space-between="20"
          :keyboard="{ enabled: true }"
          :navigation="true"
          :loop="false"
          @slidechange="onSlideChange"
        >
          <swiper-slide v-for="(photo, index) in photos" :key="index">
            <div class="slide-content">
              <div
                class="photo-container"
                :class="{ zoomed: zoomedSlides.has(index) }"
                @dblclick="toggleZoom(index)"
              >
                <img
                  :src="photo.url"
                  :alt="photo.caption || `Photo ${index + 1}`"
                  class="viewer-image"
                  draggable="false"
                />
              </div>
              <div class="zoom-hint">双击或捏合缩放</div>
            </div>
          </swiper-slide>
        </swiper-container>
      </div>

      <!-- 底部信息栏 -->
      <div v-if="currentPhoto" class="photo-viewer-info">
        <h3 v-if="currentPhoto.caption" class="info-caption">
          {{ currentPhoto.caption }}
        </h3>
        <div class="info-meta">
          <span v-if="currentPhoto.date" class="meta-item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {{ formatDate(currentPhoto.date) }}
          </span>
          <span v-if="currentPhoto.location" class="meta-item">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {{ currentPhoto.location }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { register } from "swiper/element/bundle";

// 注册 Swiper Web Components
register();

export interface Photo {
  url: string;
  caption?: string;
  date?: string;
  location?: string;
  tags?: string[];
  thumbhash?: string;
  thumbhashDataURL?: string;
  aspectRatio?: number;
}

interface Props {
  photos: Photo[];
  initialIndex?: number;
}

interface Emits {
  (e: "close"): void;
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0,
});

const emit = defineEmits<Emits>();

const swiperRef = ref<any>(null);
const currentIndex = ref(props.initialIndex);
const zoomedSlides = ref(new Set<number>());

const currentPhoto = computed(() => props.photos[currentIndex.value]);

function onSlideChange(event: any) {
  currentIndex.value = event.detail[0].activeIndex;
}

function toggleZoom(index: number) {
  if (zoomedSlides.value.has(index)) {
    zoomedSlides.value.delete(index);
  } else {
    zoomedSlides.value.add(index);
  }
}

function close() {
  emit("close");
}

function sharePhoto() {
  const photo = currentPhoto.value;
  if (!photo) return;

  // 复制图片 URL 到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(photo.url)
      .then(() => {
        alert("图片链接已复制到剪贴板");
      })
      .catch(() => {
        alert("复制失败");
      });
  } else {
    alert(photo.url);
  }
}

function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    close();
  }
}

onMounted(() => {
  // 锁定 body 滚动
  document.body.style.overflow = "hidden";

  // 监听键盘事件
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  // 恢复 body 滚动
  document.body.style.overflow = "";

  // 移除键盘监听
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
}

.photo-viewer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
}

/* 工具栏 */
.photo-viewer-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.6) 0%,
    transparent 100%
  );
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.photo-counter {
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

/* Swiper 容器 */
.photo-viewer-swiper-container {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

swiper-container {
  width: 100%;
  height: 100%;
}

swiper-slide {
  display: flex;
  align-items: center;
  justify-content: center;
}

.slide-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-container {
  position: relative;
  max-width: 90%;
  max-height: 80%;
  transition: transform 0.3s ease;
  cursor: zoom-in;
}

.photo-container.zoomed {
  transform: scale(1.5);
  cursor: zoom-out;
}

.viewer-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  user-select: none;
}

.zoom-hint {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem 1rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.photo-container:hover + .zoom-hint {
  opacity: 0.7;
}

/* 底部信息栏 */
.photo-viewer-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 1.5rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
  color: white;
}

.info-caption {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
}

.info-meta {
  display: flex;
  gap: 1.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-item svg {
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .photo-viewer-toolbar {
    padding: 0.75rem 1rem;
  }

  .photo-viewer-info {
    padding: 1rem;
  }

  .info-caption {
    font-size: 1rem;
  }

  .info-meta {
    font-size: 0.75rem;
    gap: 1rem;
  }

  .viewer-image {
    max-height: 70vh;
  }
}

/* Swiper navigation 样式覆盖 */
:global(.swiper-button-next),
:global(.swiper-button-prev) {
  color: white !important;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  width: 44px !important;
  height: 44px !important;
  border-radius: 50%;
  transition: all 0.2s ease;
}

:global(.swiper-button-next):hover,
:global(.swiper-button-prev):hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

:global(.swiper-button-next::after),
:global(.swiper-button-prev::after) {
  font-size: 20px !important;
}
</style>
