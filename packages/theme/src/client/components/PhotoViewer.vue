<template>
  <Teleport to="body">
    <div class="photo-viewer">
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
            id="photo-viewer-share-button"
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
            id="photo-viewer-close-button"
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
          :allow-touch-move="!isDragging && !touchState.isDragging"
          @swiperslidechange="onSlideChange"
        >
          <swiper-slide v-for="(photo, index) in photos" :key="index">
            <div class="slide-content">
              <div
                class="photo-container"
                @dblclick="(e) => handleDoubleClick(e, index)"
                @wheel="(e) => handleWheel(e, index)"
                @mousedown="(e) => handleMouseDown(e, index)"
                @mousemove="(e) => handleMouseMove(e, index)"
                @mouseup="handleMouseUp"
                @mouseleave="handleMouseUp"
                @touchstart="(e) => handleTouchStart(e, index)"
                @touchmove="(e) => handleTouchMove(e, index)"
                @touchend="(e) => handleTouchEnd(e, index)"
              >
                <img
                  :src="photo.url"
                  :alt="photo.caption || `Photo ${index + 1}`"
                  class="viewer-image"
                  :style="getImageStyle(index)"
                  draggable="false"
                />
              </div>
              <div class="zoom-hint">双击或捏合缩放 · 滚轮缩放</div>
            </div>
          </swiper-slide>
        </swiper-container>
      </div>

      <!-- 底部区域（信息栏 + 缩略图）合并 -->
      <div class="photo-viewer-bottom">
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

        <!-- 缩略图预览条 -->
        <div class="photo-viewer-thumbnails">
          <div ref="thumbnailsContainerRef" class="thumbnails-container">
            <div
              v-for="(photo, index) in photos"
              :key="index"
              :ref="
                (el) => {
                  if (el) thumbnailRefs[index] = el as HTMLElement;
                }
              "
              class="thumbnail-item"
              :class="{ active: index === currentIndex }"
              @click="goToSlide(index)"
            >
              <div
                v-if="photo.thumbhashDataURL"
                class="thumbnail-placeholder"
                :style="{ backgroundImage: `url(${photo.thumbhashDataURL})` }"
              ></div>
              <img
                :src="photo.url"
                :alt="photo.caption || `Photo ${index + 1}`"
                class="thumbnail-image"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <Toast ref="toastRef" />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { register } from "swiper/element/bundle";
import Toast from "./Toast.vue";

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
const thumbnailsContainerRef = ref<HTMLElement | null>(null);
const thumbnailRefs: HTMLElement[] = [];
const toastRef = ref<InstanceType<typeof Toast> | null>(null);

// 图片缩放和平移状态
interface ImageTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

const imageTransforms = ref<Map<number, ImageTransform>>(new Map());

const currentPhoto = computed(() => props.photos[currentIndex.value]);

// 获取或初始化图片变换状态
function getTransform(index: number): ImageTransform {
  if (!imageTransforms.value.has(index)) {
    imageTransforms.value.set(index, {
      scale: 1,
      translateX: 0,
      translateY: 0,
    });
  }
  return imageTransforms.value.get(index)!;
}

// 重置图片变换状态
function resetTransform(index: number) {
  imageTransforms.value.set(index, {
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
}

// 触摸和手势状态
interface TouchState {
  startDistance: number;
  startScale: number;
  lastX: number;
  lastY: number;
  isDragging: boolean;
}

const touchState = ref<TouchState>({
  startDistance: 0,
  startScale: 1,
  lastX: 0,
  lastY: 0,
  isDragging: false,
});

// 计算两点间距离（用于pinch缩放）
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// 处理触摸开始
function handleTouchStart(event: TouchEvent, index: number) {
  const transform = getTransform(index);
  
  if (event.touches.length === 2) {
    // 双指触摸：准备缩放
    event.preventDefault();
    touchState.value.startDistance = getDistance(
      event.touches[0],
      event.touches[1]
    );
    touchState.value.startScale = transform.scale;
  } else if (event.touches.length === 1 && transform.scale > 1) {
    // 单指触摸且已放大：准备拖动
    event.preventDefault();
    touchState.value.isDragging = true;
    touchState.value.lastX = event.touches[0].clientX;
    touchState.value.lastY = event.touches[0].clientY;
  }
}

// 处理触摸移动
function handleTouchMove(event: TouchEvent, index: number) {
  const transform = getTransform(index);
  
  if (event.touches.length === 2) {
    // 双指缩放
    event.preventDefault();
    const currentDistance = getDistance(event.touches[0], event.touches[1]);
    const scale = (currentDistance / touchState.value.startDistance) * touchState.value.startScale;
    
    // 限制缩放范围 1x-4x
    transform.scale = Math.max(1, Math.min(4, scale));
    
    // 如果缩放到1，重置平移
    if (transform.scale <= 1) {
      transform.translateX = 0;
      transform.translateY = 0;
    }
  } else if (event.touches.length === 1 && touchState.value.isDragging && transform.scale > 1) {
    // 单指拖动
    event.preventDefault();
    const deltaX = event.touches[0].clientX - touchState.value.lastX;
    const deltaY = event.touches[0].clientY - touchState.value.lastY;
    
    transform.translateX += deltaX;
    transform.translateY += deltaY;
    
    touchState.value.lastX = event.touches[0].clientX;
    touchState.value.lastY = event.touches[0].clientY;
  }
}

// 处理触摸结束
function handleTouchEnd(event: TouchEvent, index: number) {
  touchState.value.isDragging = false;
  
  // 如果缩放回到1，确保重置平移
  const transform = getTransform(index);
  if (transform.scale <= 1) {
    transform.translateX = 0;
    transform.translateY = 0;
  }
}

// 双击缩放
function handleDoubleClick(event: MouseEvent, index: number) {
  event.preventDefault();
  const transform = getTransform(index);
  
  if (transform.scale > 1) {
    // 已放大，缩小到原始大小
    resetTransform(index);
  } else {
    // 原始大小，放大到2倍
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    transform.scale = 2;
    // 以点击位置为中心放大
    transform.translateX = (centerX - x) * 0.5;
    transform.translateY = (centerY - y) * 0.5;
  }
}

// 鼠标滚轮缩放
function handleWheel(event: WheelEvent, index: number) {
  event.preventDefault();
  const transform = getTransform(index);
  
  const delta = -event.deltaY;
  const scaleChange = delta > 0 ? 1.1 : 0.9;
  const newScale = transform.scale * scaleChange;
  
  // 限制缩放范围
  transform.scale = Math.max(1, Math.min(4, newScale));
  
  // 如果缩放到1，重置平移
  if (transform.scale <= 1) {
    transform.translateX = 0;
    transform.translateY = 0;
  }
}

// 鼠标拖动（当放大时）
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

function handleMouseDown(event: MouseEvent, index: number) {
  const transform = getTransform(index);
  if (transform.scale > 1) {
    isDragging = true;
    dragStartX = event.clientX - transform.translateX;
    dragStartY = event.clientY - transform.translateY;
    event.preventDefault();
  }
}

function handleMouseMove(event: MouseEvent, index: number) {
  if (isDragging) {
    const transform = getTransform(index);
    transform.translateX = event.clientX - dragStartX;
    transform.translateY = event.clientY - dragStartY;
    event.preventDefault();
  }
}

function handleMouseUp() {
  isDragging = false;
}

// 获取图片变换样式
function getImageStyle(index: number): Record<string, string> {
  const transform = getTransform(index);
  return {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`,
    cursor: transform.scale > 1 ? 'grab' : 'zoom-in',
    transition: isDragging || touchState.value.isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };
}

function onSlideChange(event: any) {
  // Swiper Web Components 事件格式：event.detail[0] 是 swiper 实例
  const swiper = event.detail?.[0];
  if (swiper && typeof swiper.activeIndex === "number") {
    currentIndex.value = swiper.activeIndex;
  }
}

function goToSlide(index: number) {
  if (swiperRef.value?.swiper) {
    swiperRef.value.swiper.slideTo(index);
  }
}

function close() {
  emit("close");
}

function getPhotoSlug(url: string): string {
  const filename = url.split("/").pop() || "";
  return filename.replace(/\.[^.]+$/, "");
}

async function sharePhoto() {
  const photo = currentPhoto.value;
  if (!photo) return;

  // 构建完整的 URL（包括 hash）
  const slug = getPhotoSlug(photo.url);
  const fullUrl = `${window.location.origin}${window.location.pathname}#${slug}`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(fullUrl);
      toastRef.value?.show("链接已复制");
    } else {
      // Fallback for non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = fullUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toastRef.value?.show("链接已复制");
    }
  } catch (error) {
    toastRef.value?.show("复制失败");
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

function scrollThumbnailIntoView() {
  if (!thumbnailsContainerRef.value) return;

  const activeThumbnail = thumbnailRefs[currentIndex.value];
  if (!activeThumbnail) return;

  const container = thumbnailsContainerRef.value;
  const thumbnailRect = activeThumbnail.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // 计算需要滚动的距离，使缩略图居中
  const scrollLeft =
    activeThumbnail.offsetLeft -
    container.offsetWidth / 2 +
    activeThumbnail.offsetWidth / 2;

  container.scrollTo({
    left: scrollLeft,
    behavior: "smooth",
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    close();
  }
}

// 监听当前索引变化，自动滚动缩略图并重置上一个图片的缩放
watch(currentIndex, (newIndex, oldIndex) => {
  nextTick(() => {
    scrollThumbnailIntoView();
  });
  
  // 重置上一个图片的变换状态（可选）
  if (oldIndex !== undefined && oldIndex !== newIndex) {
    // 可以选择重置或保留缩放状态
    // resetTransform(oldIndex);
  }
});

onMounted(() => {
  // 锁定 body 滚动
  document.body.style.overflow = "hidden";

  // 监听键盘事件
  window.addEventListener("keydown", handleKeydown);
  
  // 添加全局鼠标事件监听，确保拖动平滑
  window.addEventListener("mousemove", (e) => {
    if (isDragging) {
      handleMouseMove(e as MouseEvent, currentIndex.value);
    }
  });
  window.addEventListener("mouseup", handleMouseUp);

  // 初始化时滚动到当前缩略图
  nextTick(() => {
    scrollThumbnailIntoView();
  });
});

onUnmounted(() => {
  // 恢复 body 滚动
  document.body.style.overflow = "";

  // 移除键盘监听
  window.removeEventListener("keydown", handleKeydown);
  
  // 移除全局鼠标监听
  window.removeEventListener("mouseup", handleMouseUp);
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
  overflow: hidden;
  touch-action: none; /* 禁用浏览器默认手势 */
}

.viewer-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  user-select: none;
  transform-origin: center center;
  will-change: transform; /* 优化性能 */
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

/* 底部区域（合并信息栏和缩略图） */
.photo-viewer-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 11;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  backdrop-filter: blur(10px);
  padding-top: 2rem; /* 顶部留空，用于渐变过渡 */
}

/* 底部信息栏 */
.photo-viewer-info {
  padding: 0 1.5rem 1rem;
  color: white;
}

/* 缩略图预览条 */
.photo-viewer-thumbnails {
  padding: 1rem 0;
}

.thumbnails-container {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* 隐藏滚动条但保持功能 */
.thumbnails-container::-webkit-scrollbar {
  height: 4px;
}

.thumbnails-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.thumbnails-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.thumbnails-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.thumbnail-item {
  position: relative;
  flex-shrink: 0;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  opacity: 0.6;
}

.thumbnail-item:hover {
  opacity: 1;
  border-color: rgba(255, 255, 255, 0.3);
}

.thumbnail-item.active {
  opacity: 1;
  border-color: var(--vp-c-brand-1, #646cff);
  box-shadow: 0 0 0 2px rgba(100, 108, 255, 0.3);
}

.thumbnail-placeholder {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(4px);
  transform: scale(1.1);
}

.thumbnail-image {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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

  .photo-viewer-bottom {
    padding-top: 1.5rem;
  }

  .photo-viewer-info {
    padding: 0 1rem 0.75rem;
  }

  .photo-viewer-thumbnails {
    padding: 0.75rem 0;
  }

  .thumbnails-container {
    padding: 0 1rem;
    gap: 0.5rem;
  }

  .thumbnail-item {
    width: 60px;
    height: 60px;
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
