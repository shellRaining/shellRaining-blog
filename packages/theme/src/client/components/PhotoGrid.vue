<template>
  <div class="photo-grid-container">
    <div class="photo-grid">
      <div
        v-for="(photo, index) in photos"
        :key="index"
        class="photo-item"
        :style="{ aspectRatio: dynamicAspectRatio }"
        @click="openViewer(index)"
      >
        <!-- ThumbHash 占位符 -->
        <div
          v-if="photo.thumbhashDataURL"
          class="photo-placeholder"
          :style="{
            backgroundImage: `url(${photo.thumbhashDataURL})`,
          }"
        ></div>

        <!-- 实际图片 -->
        <img
          :src="photo.url"
          :alt="photo.caption || `Photo ${index + 1}`"
          class="photo-image"
          loading="lazy"
        />

        <!-- Hover 遮罩 -->
        <div class="photo-overlay">
          <div class="photo-info">
            <h3 v-if="photo.caption" class="photo-caption">
              {{ photo.caption }}
            </h3>
            <div class="photo-meta">
              <span v-if="photo.date" class="photo-date">{{
                formatDate(photo.date)
              }}</span>
              <span v-if="photo.location" class="photo-location">{{
                photo.location
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 照片查看器 -->
    <PhotoViewer
      v-if="viewerVisible"
      :photos="photos"
      :initial-index="currentIndex"
      @close="closeViewer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import PhotoViewer from "./PhotoViewer.vue";

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
}

const props = defineProps<Props>();

const viewerVisible = ref(false);
const currentIndex = ref(0);

// 根据图片数量动态计算宽高比
const dynamicAspectRatio = computed(() => {
  const count = props.photos.length;
  if (count <= 6) {
    return "16 / 9"; // 1-6张图片：宽屏比例
  } else if (count <= 12) {
    return "4 / 3"; // 7-12张图片：中等比例
  } else {
    return "1 / 1"; // 12张以上：正方形
  }
});

// 从照片 URL 提取文件名（不含扩展名）作为 slug
function getPhotoSlug(url: string): string {
  const filename = url.split("/").pop() || "";
  return filename.replace(/\.[^.]+$/, ""); // 移除扩展名
}

// 根据 slug 查找照片索引
function findPhotoIndexBySlug(slug: string): number {
  return props.photos.findIndex(
    (photo) => getPhotoSlug(photo.url).toLowerCase() === slug.toLowerCase(),
  );
}

// 处理 hash 变化（浏览器前进/后退）
function handleHashChange() {
  const hash = window.location.hash.slice(1); // 移除 # 号

  if (!hash) {
    // hash 被清除，关闭预览器
    if (viewerVisible.value) {
      viewerVisible.value = false;
    }
    return;
  }

  const index = findPhotoIndexBySlug(hash);
  if (index !== -1) {
    currentIndex.value = index;
    viewerVisible.value = true;
  }
}

function openViewer(index: number) {
  currentIndex.value = index;
  viewerVisible.value = true;

  // 设置 hash 为照片文件名
  const slug = getPhotoSlug(props.photos[index].url);
  window.location.hash = slug;
}

function closeViewer() {
  viewerVisible.value = false;

  // 清除 hash（会触发 hashchange 事件，但此时 viewerVisible 已经是 false）
  history.pushState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
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

onMounted(() => {
  // 检查初始 hash，如果有则打开对应照片
  const initialHash = window.location.hash.slice(1);
  if (initialHash) {
    const index = findPhotoIndexBySlug(initialHash);
    if (index !== -1) {
      currentIndex.value = index;
      viewerVisible.value = true;
    }
  }

  // 监听 hash 变化
  window.addEventListener("hashchange", handleHashChange);
});

onUnmounted(() => {
  window.removeEventListener("hashchange", handleHashChange);
});
</script>

<style scoped>
.photo-grid-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .photo-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1025px) {
  .photo-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.photo-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  cursor: pointer;
  background: var(--vp-c-bg-soft);
  /* aspect-ratio 通过内联样式动态设置 */
}

.photo-placeholder {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(20px);
  transform: scale(1.1);
}

.photo-image {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.photo-item:hover .photo-image {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.4) 50%,
    transparent 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  padding: 1.5rem;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  color: white;
  width: 100%;
}

.photo-caption {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.photo-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.photo-date,
.photo-location {
  display: flex;
  align-items: center;
}

.photo-date::before {
  content: "📅";
  margin-right: 0.25rem;
}

.photo-location::before {
  content: "📍";
  margin-right: 0.25rem;
}

/* 响应式字体 */
@media (max-width: 768px) {
  .photo-caption {
    font-size: 0.875rem;
  }

  .photo-meta {
    font-size: 0.75rem;
  }
}

/* 加载动画 */
.photo-image {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
