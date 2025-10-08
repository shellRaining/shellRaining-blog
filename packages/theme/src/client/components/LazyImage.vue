<template>
  <div class="lazy-image-container" :style="containerStyle">
    <!-- 骨架屏 -->
    <div v-if="showSkeleton" class="lazy-image-skeleton">
      <div class="skeleton-shimmer"></div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="lazy-image-error">
      <div class="error-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <span class="error-text">加载失败</span>
    </div>

    <!-- 实际图片 -->
    <img
      v-else
      :src="src"
      :alt="alt"
      :loading="loading"
      class="lazy-image"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useImage } from "@vueuse/core";

interface Props {
  src: string;
  alt?: string;
  aspectRatio?: number | string;
  skeletonDelay?: number;
  loading?: "lazy" | "eager";
}

const props = withDefaults(defineProps<Props>(), {
  alt: "",
  aspectRatio: 4 / 3,
  skeletonDelay: 300,
  loading: "lazy",
});

const emit = defineEmits<{
  load: [event: Event];
  error: [event: Event];
}>();

// 使用 VueUse 的 useImage 管理加载状态
const { isLoading, error } = useImage({ src: props.src }, { delay: 0 });

// 骨架屏显示控制
const showSkeleton = ref(false);
const skeletonTimer = ref<ReturnType<typeof setTimeout>>();
const loadStartTime = ref(0);

// 监听加载状态
watch(isLoading, (loading) => {
  if (loading) {
    loadStartTime.value = Date.now();
    // 延迟显示骨架屏，避免快速加载时的闪烁
    skeletonTimer.value = setTimeout(() => {
      if (isLoading.value) {
        showSkeleton.value = true;
      }
    }, props.skeletonDelay);
  } else {
    clearTimeout(skeletonTimer.value);
    const loadDuration = Date.now() - loadStartTime.value;
    // 如果加载时间小于延迟时间，直接跳过骨架屏
    if (loadDuration < props.skeletonDelay) {
      showSkeleton.value = false;
    } else {
      // 给用户一点视觉缓冲，避免突兀消失
      setTimeout(() => {
        showSkeleton.value = false;
      }, 100);
    }
  }
});

// 清理定时器
onUnmounted(() => {
  clearTimeout(skeletonTimer.value);
});

// 容器样式
const containerStyle = computed(() => {
  const ratio =
    typeof props.aspectRatio === "string"
      ? props.aspectRatio
      : `${props.aspectRatio}`;

  return {
    "--img-aspect-ratio": ratio,
  };
});

// 事件处理
const handleLoad = (event: Event) => {
  emit("load", event);
};

const handleError = (event: Event) => {
  emit("error", event);
};
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  max-width: 300px;
  margin: 0 auto;
  aspect-ratio: var(--img-aspect-ratio, 4/3);
  overflow: hidden;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  display: block;
}

/* 骨架屏样式 */
.lazy-image-skeleton {
  position: absolute;
  inset: 0;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in oklab, var(--vp-c-bg) 50%, transparent) 50%,
    transparent 100%
  );
  animation: shimmer 2s infinite;
  transform: translateX(-100%);
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* 错误状态样式 */
.lazy-image-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px dashed var(--vp-c-border);
  color: var(--vp-c-text-2);
}

.error-icon {
  width: 32px;
  height: 32px;
  color: var(--vp-c-text-3);
  animation: error-bounce 1s ease-in-out infinite;
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

@keyframes error-bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.error-text {
  font-size: 12px;
  color: var(--vp-c-text-3);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .lazy-image-container {
    max-width: 100%;
  }
}

/* 深色模式优化 */
.dark .lazy-image-skeleton {
  background: var(--vp-c-bg-alt);
}

.dark .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    color-mix(in oklab, var(--vp-c-bg-soft) 30%, transparent) 50%,
    transparent 100%
  );
}

/* 动画性能优化 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer,
  .error-icon {
    animation: none;
  }
}
</style>
