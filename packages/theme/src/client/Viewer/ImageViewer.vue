<template>
  <Teleport to="body">
    <Transition name="viewer-fade">
      <div v-if="visible" class="image-viewer" @click="handleBackdropClick">
        <!-- 工具栏 -->
        <div class="image-viewer-toolbar">
          <button
            type="button"
            class="toolbar-button"
            title="关闭 (ESC)"
            @click="close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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

        <!-- 图片容器 -->
        <div class="image-container" @click.stop>
          <img
            ref="imageRef"
            :src="imageSrc"
            class="viewer-image"
            :style="imageStyle"
            draggable="false"
            @dblclick="handleDoubleClick"
            @wheel="handleWheel"
            @mousedown="handleMouseDown"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          />
        </div>

        <!-- 缩放提示 -->
        <div class="zoom-hint">
          双击或滚轮缩放 · 拖动移动 · ESC 关闭
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

interface Props {
  visible: boolean;
  imageSrc: string;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const imageRef = ref<HTMLImageElement | null>(null);

// 图片变换状态
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);

// 触摸状态
interface TouchState {
  startDistance: number;
  startScale: number;
  lastX: number;
  lastY: number;
}

const touchState = ref<TouchState>({
  startDistance: 0,
  startScale: 1,
  lastX: 0,
  lastY: 0,
});

// 计算图片样式
const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  cursor: scale.value > 1 ? (isDragging.value ? "grabbing" : "grab") : "zoom-in",
  transition: isDragging.value ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
}));

// 重置变换
function resetTransform() {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
}

// 关闭查看器
function close() {
  emit("update:visible", false);
}

// 点击背景关闭
function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    close();
  }
}

// 双击缩放
function handleDoubleClick(event: MouseEvent) {
  event.preventDefault();
  
  if (scale.value > 1) {
    resetTransform();
  } else {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    scale.value = 2;
    translateX.value = (centerX - x) * 0.5;
    translateY.value = (centerY - y) * 0.5;
  }
}

// 滚轮缩放
function handleWheel(event: WheelEvent) {
  event.preventDefault();
  
  const delta = -event.deltaY;
  const scaleChange = delta > 0 ? 1.1 : 0.9;
  const newScale = scale.value * scaleChange;
  
  scale.value = Math.max(1, Math.min(4, newScale));
  
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  }
}

// 鼠标拖动
let dragStartX = 0;
let dragStartY = 0;

function handleMouseDown(event: MouseEvent) {
  if (scale.value > 1) {
    isDragging.value = true;
    dragStartX = event.clientX - translateX.value;
    dragStartY = event.clientY - translateY.value;
    event.preventDefault();
  }
}

function handleMouseMove(event: MouseEvent) {
  if (isDragging.value) {
    translateX.value = event.clientX - dragStartX;
    translateY.value = event.clientY - dragStartY;
    event.preventDefault();
  }
}

function handleMouseUp() {
  isDragging.value = false;
}

// 触摸手势
function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function handleTouchStart(event: TouchEvent) {
  if (event.touches.length === 2) {
    event.preventDefault();
    touchState.value.startDistance = getDistance(
      event.touches[0],
      event.touches[1]
    );
    touchState.value.startScale = scale.value;
  } else if (event.touches.length === 1 && scale.value > 1) {
    event.preventDefault();
    touchState.value.lastX = event.touches[0].clientX;
    touchState.value.lastY = event.touches[0].clientY;
  }
}

function handleTouchMove(event: TouchEvent) {
  if (event.touches.length === 2) {
    event.preventDefault();
    const currentDistance = getDistance(event.touches[0], event.touches[1]);
    const newScale =
      (currentDistance / touchState.value.startDistance) *
      touchState.value.startScale;
    
    scale.value = Math.max(1, Math.min(4, newScale));
    
    if (scale.value <= 1) {
      translateX.value = 0;
      translateY.value = 0;
    }
  } else if (event.touches.length === 1 && scale.value > 1) {
    event.preventDefault();
    const deltaX = event.touches[0].clientX - touchState.value.lastX;
    const deltaY = event.touches[0].clientY - touchState.value.lastY;
    
    translateX.value += deltaX;
    translateY.value += deltaY;
    
    touchState.value.lastX = event.touches[0].clientX;
    touchState.value.lastY = event.touches[0].clientY;
  }
}

function handleTouchEnd() {
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  }
}

// 键盘事件
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.visible) {
    close();
  }
}

// 监听可见性变化，重置状态
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      resetTransform();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
  document.body.style.overflow = "";
});
</script>

<style scoped>
.image-viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer-toolbar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
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

.image-container {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.viewer-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  user-select: none;
  transform-origin: center center;
  will-change: transform;
}

.zoom-hint {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 0.875rem;
  opacity: 0.8;
  pointer-events: none;
}

/* 过渡动画 */
.viewer-fade-enter-active,
.viewer-fade-leave-active {
  transition: opacity 0.3s ease;
}

.viewer-fade-enter-from,
.viewer-fade-leave-to {
  opacity: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .zoom-hint {
    font-size: 0.75rem;
    padding: 0.5rem 1rem;
    bottom: 1rem;
  }
}
</style>
