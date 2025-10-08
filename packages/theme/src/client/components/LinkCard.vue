<template>
  <div class="link-card">
    <a
      :href="url"
      target="_blank"
      rel="noopener noreferrer"
      class="link-card-content"
    >
      <div class="link-card-text">
        <h3 class="link-card-title">{{ title }}</h3>
        <p v-if="description" class="link-card-description">
          {{ description }}
        </p>
        <div class="link-card-meta">
          <span class="link-card-site">{{ siteName || domain }}</span>
          <span class="link-card-url">{{ domain }}</span>
        </div>
      </div>
      <div v-if="image && showImage" class="link-card-image">
        <img
          :src="image"
          :alt="title"
          @error="handleImageError"
          @load="handleImageLoad"
          loading="lazy"
        />
      </div>
    </a>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";

interface Props {
  id?: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  id: "",
  description: "",
  image: "",
  siteName: "",
});

const showImage = ref(true);

// 从URL提取域名
const domain = computed(() => {
  try {
    return new URL(props.url).hostname;
  } catch {
    return props.url;
  }
});

// 处理图片加载错误
const handleImageError = () => {
  showImage.value = false;
};

// 处理图片加载成功
const handleImageLoad = () => {
  showImage.value = true;
};

// 截断长文本
const truncatedTitle = computed(() => {
  if (props.title.length > 60) {
    return props.title.slice(0, 60) + "...";
  }
  return props.title;
});

const truncatedDescription = computed(() => {
  if (props.description && props.description.length > 120) {
    return props.description.slice(0, 120) + "...";
  }
  return props.description;
});
</script>

<style scoped>
.link-card {
  margin: 1rem 0;
  border: var(--sr-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--sr-c-bg);
  box-shadow: var(--sr-float-shadow);
  transition: all 0.3s ease;
}

.link-card:hover {
  background: var(--sr-c-bg-hover);
  box-shadow: var(--sr-card-shadow);
  transform: translateY(-2px);
}

.link-card-content {
  display: flex;
  text-decoration: none;
  color: inherit;
  padding: 1rem;
  gap: 1rem;
  align-items: flex-start;
}

.link-card-text {
  flex: 1;
  min-width: 0; /* 防止flex item溢出 */
}

.link-card-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  color: var(--sr-c-text);
  word-wrap: break-word;
  hyphens: auto;
}

.link-card:hover .link-card-title {
  color: var(--sr-c-text-hover);
}

.link-card-description {
  font-size: 0.875rem;
  color: var(--sr-c-text-muted);
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
  word-wrap: break-word;
  hyphens: auto;
}

.link-card-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--sr-c-small-text-muted);
}

.link-card-site {
  font-weight: 500;
  color: var(--sr-c-small-text);
}

.link-card-url {
  opacity: 0.8;
}

.link-card-url::before {
  content: "•";
  margin-right: 0.5rem;
}

.link-card-image {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--sr-c-bg-section);
}

.link-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.link-card:hover .link-card-image img {
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .link-card-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .link-card-image {
    width: 100%;
    height: 160px;
    order: -1; /* 在移动设备上将图片放在顶部 */
  }

  .link-card-title {
    font-size: 1rem;
  }

  .link-card-description {
    font-size: 0.8rem;
  }
}

/* 无图片时的样式 */
.link-card-content:not(:has(.link-card-image)) .link-card-text {
  flex: 1;
}

/* 深色模式适配 */
.dark .link-card {
  border-color: var(--vp-c-border);
}

.dark .link-card:hover {
  background: var(--sr-c-bg-hover);
}

/* 加载状态 */
.link-card-image img[src=""] {
  display: none;
}

/* 无障碍设计 */
.link-card:focus-within {
  outline: 2px solid var(--vp-c-brand);
  outline-offset: 2px;
}

.link-card-content:focus {
  outline: none;
}

/* 动画 */
@media (prefers-reduced-motion: no-preference) {
  .link-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .link-card:hover {
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .link-card,
  .link-card-image img {
    transition: none;
  }

  .link-card:hover {
    transform: none;
  }
}
</style>

<style>
/* 全局样式：控制 LinkCard 在文档流中的间距 */
.VPDoc .content .link-card {
  margin: 1.5rem 0;
}

.VPDoc .content .link-card:first-child {
  margin-top: 0;
}

.VPDoc .content .link-card:last-child {
  margin-bottom: 0;
}

/* 确保链接卡片在文档内容中的间距正确 */
.VPDoc .content p + .link-card,
.VPDoc .content .link-card + p,
.VPDoc .content .link-card + h1,
.VPDoc .content .link-card + h2,
.VPDoc .content .link-card + h3,
.VPDoc .content .link-card + h4,
.VPDoc .content .link-card + h5,
.VPDoc .content .link-card + h6 {
  margin-top: 1.5rem;
}

/* 链接卡片在打印时的样式 */
@media print {
  .link-card {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ddd;
  }

  .link-card:hover {
    transform: none;
    box-shadow: none;
  }

  .link-card-image {
    display: none; /* 打印时隐藏图片 */
  }
}
</style>
