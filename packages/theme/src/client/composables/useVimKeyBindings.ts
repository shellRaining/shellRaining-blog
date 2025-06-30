import { ref, computed, onMounted, onUnmounted } from "vue";
import { useData } from "vitepress";

export interface VimKeyBinding {
  key: string;
  action: string;
  description: string;
  handler: () => void;
}

export interface VimKeyBindingsConfig {
  navigation: {
    up: string;
    down: string;
    enter: string;
    back: string;
    nextSeries: string;
    prevSeries: string;
  };
  panels: {
    help: string;
  };
}

const defaultConfig: VimKeyBindingsConfig = {
  navigation: {
    up: "k",
    down: "j",
    enter: "Enter",
    back: "Escape",
    nextSeries: "n",
    prevSeries: "p",
  },
  panels: {
    help: "?",
  },
};

export function useVimKeyBindings() {
  const { page } = useData();

  // State
  const isActive = ref(true);
  const selectedIndex = ref(0);
  const showHelp = ref(false);
  const config = ref<VimKeyBindingsConfig>(defaultConfig);

  // Load custom config from localStorage
  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem("vim-keybindings");
      if (savedConfig) {
        config.value = { ...defaultConfig, ...JSON.parse(savedConfig) };
      }
    } catch (error) {
      console.warn("Failed to load vim keybindings config:", error);
    }
  };

  // Save config to localStorage
  const saveConfig = (newConfig: Partial<VimKeyBindingsConfig>) => {
    try {
      config.value = { ...config.value, ...newConfig };
      localStorage.setItem("vim-keybindings", JSON.stringify(config.value));
    } catch (error) {
      console.warn("Failed to save vim keybindings config:", error);
    }
  };

  // Get current page type
  const pageType = computed(() => {
    if (page.value.relativePath === "index.md") return "home";
    if (page.value.relativePath.startsWith("docs/")) return "article";
    return "other";
  });

  // Get selectable elements on homepage
  const getSelectableElements = (): HTMLElement[] => {
    const postItems = document.querySelectorAll(".post-title");
    return Array.from(postItems) as HTMLElement[];
  };

  // Get series navigation info
  const getSeriesInfo = () => {
    const seriesNav = document.querySelector("[data-series-nav]");
    if (!seriesNav) return null;

    const prevLink = seriesNav.querySelector(
      '[rel="prev"]',
    ) as HTMLAnchorElement;
    const nextLink = seriesNav.querySelector(
      '[rel="next"]',
    ) as HTMLAnchorElement;

    return { prevLink, nextLink };
  };

  // Navigation handlers
  const navigateUp = () => {
    if (pageType.value !== "home") return;

    const elements = getSelectableElements();
    if (elements.length === 0) return;

    selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    highlightSelected();
  };

  const navigateDown = () => {
    if (pageType.value !== "home") return;

    const elements = getSelectableElements();
    if (elements.length === 0) return;

    selectedIndex.value = Math.min(
      elements.length - 1,
      selectedIndex.value + 1,
    );
    highlightSelected();
  };

  const selectCurrent = () => {
    if (pageType.value !== "home") return;

    const elements = getSelectableElements();
    const currentElement = elements[selectedIndex.value];

    if (currentElement) {
      currentElement.click();
    }
  };

  const goBack = () => {
    if (pageType.value === "article") {
      window.history.back();
    }
  };

  const navigateNextSeries = () => {
    if (pageType.value !== "article") return;

    const seriesInfo = getSeriesInfo();
    if (seriesInfo?.nextLink) {
      window.location.href = seriesInfo.nextLink.href;
    }
  };

  const navigatePrevSeries = () => {
    if (pageType.value !== "article") return;

    const seriesInfo = getSeriesInfo();
    if (seriesInfo?.prevLink) {
      window.location.href = seriesInfo.prevLink.href;
    }
  };

  // Panel handlers
  const toggleHelp = () => {
    showHelp.value = !showHelp.value;
  };

  // Visual feedback
  const highlightSelected = () => {
    const elements = getSelectableElements();

    // Remove previous highlights
    elements.forEach((el) => el.classList.remove("vim-selected"));

    // Add highlight to current selection
    const currentElement = elements[selectedIndex.value];
    if (currentElement) {
      currentElement.classList.add("vim-selected");
      currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Key binding definitions
  const keyBindings = computed<VimKeyBinding[]>(() => [
    {
      key: config.value.navigation.up,
      action: "navigate-up",
      description: "Navigate up in article list",
      handler: navigateUp,
    },
    {
      key: config.value.navigation.down,
      action: "navigate-down",
      description: "Navigate down in article list",
      handler: navigateDown,
    },
    {
      key: config.value.navigation.enter,
      action: "select-current",
      description: "Enter selected article",
      handler: selectCurrent,
    },
    {
      key: config.value.navigation.back,
      action: "go-back",
      description: "Go back to previous page",
      handler: goBack,
    },
    {
      key: config.value.navigation.nextSeries,
      action: "next-series",
      description: "Go to next article in series",
      handler: navigateNextSeries,
    },
    {
      key: config.value.navigation.prevSeries,
      action: "prev-series",
      description: "Go to previous article in series",
      handler: navigatePrevSeries,
    },
    {
      key: config.value.panels.help,
      action: "toggle-help",
      description: "Toggle help panel",
      handler: toggleHelp,
    },
  ]);

  // Keyboard event handler
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive.value) return;

    // Don't interfere with input fields
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const binding = keyBindings.value.find(
      (b) =>
        b.key === event.key ||
        (b.key === "Enter" && event.key === "Enter") ||
        (b.key === "Escape" && event.key === "Escape"),
    );

    if (binding) {
      event.preventDefault();
      binding.handler();
    }
  };

  // Initialize selection on route change
  const initializeSelection = () => {
    if (pageType.value === "home") {
      selectedIndex.value = 0;
      highlightSelected();
    }
  };

  // Lifecycle
  onMounted(() => {
    loadConfig();
    document.addEventListener("keydown", handleKeyDown);
    initializeSelection();
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });

  return {
    // State
    isActive,
    selectedIndex,
    showHelp,
    config,
    pageType,
    keyBindings,

    // Methods
    saveConfig,
    initializeSelection,

    // Handlers
    navigateUp,
    navigateDown,
    selectCurrent,
    goBack,
    navigateNextSeries,
    navigatePrevSeries,
    toggleHelp,
  };
}
