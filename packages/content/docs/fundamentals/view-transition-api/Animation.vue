<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";

const progress = ref(0);
const isDarkMode = ref(false);

// Refs for DOM elements
const containerRef = ref<HTMLElement | null>(null);
const originRef = ref<HTMLElement | null>(null);
const targetRef = ref<HTMLElement | null>(null);

// Variables to store positions
const originPos = ref({ left: 60, top: 60, width: 40, height: 40 });
const targetPos = ref({ left: 0, top: 0, width: 80, height: 80 });
const containerSize = ref({ width: 0, height: 0 });

// Check for dark mode
const checkDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains("dark");
};

// Function to update measurements
const updateMeasurements = () => {
  if (containerRef.value && originRef.value && targetRef.value) {
    // Get the container dimensions
    const containerRect = containerRef.value.getBoundingClientRect();
    containerSize.value = {
      width: containerRect.width,
      height: containerRect.height,
    };

    // Get the origin element position
    const originRect = originRef.value.getBoundingClientRect();
    originPos.value = {
      left: originRect.left - containerRect.left,
      top: originRect.top - containerRect.top,
      width: originRect.width,
      height: originRect.height,
    };

    // Get the target element position
    const targetRect = targetRef.value.getBoundingClientRect();
    targetPos.value = {
      left: targetRect.left - containerRect.left,
      top: targetRect.top - containerRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };
  }
};

// Update measurements on mount and when window is resized
onMounted(() => {
  checkDarkMode();
  updateMeasurements();

  window.addEventListener("resize", updateMeasurements);

  // Listen for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "class") {
        checkDarkMode();
      }
    });
  });

  observer.observe(document.documentElement, { attributes: true });

  onUnmounted(() => {
    window.removeEventListener("resize", updateMeasurements);
    observer.disconnect();
  });
});

// Use computed properties to calculate CSS variables
const transitionStyles = computed(() => {
  const percent = progress.value / 100;

  // Calculate color interpolation based on theme
  const colors = {
    light: {
      origin: { r: 255, g: 118, b: 117 }, // #ff7675
      target: { r: 85, g: 239, b: 196 }, // #55efc4
    },
    dark: {
      origin: { r: 234, g: 84, b: 85 }, // darker red #ea5455
      target: { r: 46, g: 213, b: 115 }, // darker green #2ed573
    },
  };

  // Select color based on theme
  const theme = isDarkMode.value ? "dark" : "light";
  const startColor = colors[theme].origin;
  const endColor = colors[theme].target;

  const r = Math.round(startColor.r + (endColor.r - startColor.r) * percent);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * percent);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * percent);

  const interpolatedColor = `rgb(${r}, ${g}, ${b})`;

  // Calculate the interpolated position
  const left =
    originPos.value.left +
    (targetPos.value.left - originPos.value.left) * percent;
  const top =
    originPos.value.top + (targetPos.value.top - originPos.value.top) * percent;
  const width =
    originPos.value.width +
    (targetPos.value.width - originPos.value.width) * percent;
  const height =
    originPos.value.height +
    (targetPos.value.height - originPos.value.height) * percent;

  return {
    // Use CSS custom properties to control the animation
    "--progress": percent,
    "--interpolated-color": interpolatedColor,
    "--pos-left": `${left}px`,
    "--pos-top": `${top}px`,
    "--width": `${width}px`,
    "--height": `${height}px`,
    "--rotate": `${percent * 360}deg`,
    "--opacity": 0.7 + 0.3 * percent,
  };
});
</script>

<template>
  <div class="sr-interpolation-demo">
    <div class="sr-container" ref="containerRef">
      <div class="sr-origin sr-element" ref="originRef"></div>
      <div class="sr-transition sr-element" :style="transitionStyles"></div>
      <div class="sr-target sr-element" ref="targetRef"></div>
    </div>

    <div class="sr-controls">
      <input
        type="range"
        min="0"
        max="100"
        v-model="progress"
        class="sr-slider"
      />
      <div class="sr-value-display">{{ progress }}%</div>
    </div>
  </div>
</template>

<style scoped>
.sr-interpolation-demo {
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  max-width: 800px;
  margin: 0 auto;
  color: var(--sr-c-text);
}

.sr-title {
  text-align: center;
  color: var(--sr-c-text);
  margin-bottom: 1rem;
  font-weight: 600;
}

.sr-container {
  position: relative;
  width: 100%;
  height: 240px;
  background: var(--sr-c-bg-section);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: var(--sr-card-shadow);
  border: var(--sr-border);
}

.sr-element {
  position: absolute;
  border-radius: 10px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}

.sr-origin {
  left: 60px;
  top: 60px;
  width: 40px;
  height: 40px;
  background-color: #ff7675;
  z-index: 1;
}

.dark .sr-origin {
  background-color: #ea5455;
}

.sr-transition {
  background-color: var(--interpolated-color, #74b9ff);
  z-index: 3;
  left: var(--pos-left, 60px);
  top: var(--pos-top, 60px);
  width: var(--width, 40px);
  height: var(--height, 40px);
  transform: rotate(var(--rotate, 0));
  opacity: var(--opacity, 1);
  /* Add a smooth transition */
  transition: all 0.2s ease-out;
  box-shadow: var(--sr-float-shadow);
}

.sr-target {
  right: 60px;
  bottom: 60px;
  width: 80px;
  height: 80px;
  background-color: #55efc4;
  z-index: 2;
}

.dark .sr-target {
  background-color: #2ed573;
}

.sr-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px;
  background-color: var(--sr-c-bg);
  border-radius: 12px;
  box-shadow: var(--sr-float-shadow);
  border: var(--sr-border);
}

.sr-slider {
  flex: 1;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--sr-c-bg-hover);
  border-radius: 4px;
  outline: none;
}

.sr-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(
    --sr-c-btn
  ); /* Using the button color from your CSS variables */
  cursor: pointer;
  box-shadow: var(--sr-float-shadow);
  transition: all 0.2s;
}

.sr-slider::-webkit-slider-thumb:hover {
  background: var(--sr-c-btn-hover);
  transform: scale(1.1);
}

.sr-slider::-webkit-slider-thumb:active {
  background: var(--sr-c-btn-active);
}

.sr-value-display {
  font-size: 18px;
  font-weight: 600;
  color: var(--sr-c-text);
  min-width: 60px;
  text-align: center;
  background-color: var(--sr-c-bg-section);
  padding: 8px 12px;
  border-radius: 8px;
}
</style>
