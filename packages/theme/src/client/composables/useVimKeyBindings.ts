import { ref, computed, onMounted, onUnmounted } from "vue";
import { useData } from "vitepress";
import {
  type VimKeyBindingsConfig,
  loadVimConfig,
  saveVimConfig,
  KeyUtils,
} from "../config/vimKeybindings";

export interface VimKeyBinding {
  key: string;
  action: string;
  description: string;
  handler: () => void;
}

export function useVimKeyBindings() {
  const { page } = useData();

  // State
  const isActive = ref(true);
  const selectedIndex = ref(0);
  const showHelp = ref(false);
  const config = ref<VimKeyBindingsConfig>(loadVimConfig());
  const lastKeyPressed = ref("");
  const keyPressTimeout = ref<number | null>(null);

  // Update config and save to localStorage
  const updateConfig = (newConfig: Partial<VimKeyBindingsConfig>) => {
    config.value = saveVimConfig(newConfig);
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
      window.location.href = "/";
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

  // Scrolling handlers for articles
  const scrollLineUp = () => {
    if (pageType.value === "article") {
      window.scrollBy({ top: -40, behavior: "smooth" });
    }
  };

  const scrollLineDown = () => {
    if (pageType.value === "article") {
      window.scrollBy({ top: 40, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    if (pageType.value === "article") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    if (pageType.value === "article") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  const scrollHalfPageUp = () => {
    if (pageType.value === "article") {
      window.scrollBy({ top: -window.innerHeight / 2, behavior: "smooth" });
    }
  };

  const scrollHalfPageDown = () => {
    if (pageType.value === "article") {
      window.scrollBy({ top: window.innerHeight / 2, behavior: "smooth" });
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
    // Homepage navigation
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
    // Article scrolling
    {
      key: config.value.scrolling.lineUp,
      action: "scroll-line-up",
      description: "Scroll up one line",
      handler: scrollLineUp,
    },
    {
      key: config.value.scrolling.lineDown,
      action: "scroll-line-down",
      description: "Scroll down one line",
      handler: scrollLineDown,
    },
    {
      key: config.value.scrolling.top,
      action: "scroll-to-top",
      description: "Jump to top of page",
      handler: scrollToTop,
    },
    {
      key: config.value.scrolling.bottom,
      action: "scroll-to-bottom",
      description: "Jump to bottom of page",
      handler: scrollToBottom,
    },
    {
      key: config.value.scrolling.halfPageUp,
      action: "scroll-half-page-up",
      description: "Scroll up half page",
      handler: scrollHalfPageUp,
    },
    {
      key: config.value.scrolling.halfPageDown,
      action: "scroll-half-page-down",
      description: "Scroll down half page",
      handler: scrollHalfPageDown,
    },
    // Navigation
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
    // Panels
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

    // Handle Ctrl combinations using config
    if (event.ctrlKey) {
      if (KeyUtils.matchesBinding(event, config.value.scrolling.halfPageUp)) {
        event.preventDefault();
        scrollHalfPageUp();
        return;
      }
      if (KeyUtils.matchesBinding(event, config.value.scrolling.halfPageDown)) {
        event.preventDefault();
        scrollHalfPageDown();
        return;
      }
    }

    // Handle multi-key sequences (gg) using config
    if (pageType.value === "article") {
      const sequenceKey = config.value.sequences.doubleG;
      if (KeyUtils.isSequenceStart(event, sequenceKey)) {
        if (lastKeyPressed.value === sequenceKey) {
          // Double sequence - go to top
          event.preventDefault();
          scrollToTop();
          clearSequenceTimeout();
          return;
        } else {
          // First key in sequence
          lastKeyPressed.value = sequenceKey;
          keyPressTimeout.value = window.setTimeout(() => {
            clearSequenceTimeout();
          }, 1000);
          return;
        }
      }

      // Handle single G for bottom using config
      if (KeyUtils.matchesBinding(event, config.value.scrolling.bottom)) {
        event.preventDefault();
        scrollToBottom();
        return;
      }
    }

    // Clear multi-key sequence if different key pressed
    if (
      lastKeyPressed.value &&
      !KeyUtils.isSequenceStart(event, config.value.sequences.doubleG)
    ) {
      clearSequenceTimeout();
    }

    // Handle context-specific key bindings using config
    if (pageType.value === "home") {
      // Homepage navigation
      if (KeyUtils.matchesBinding(event, config.value.navigation.down)) {
        event.preventDefault();
        navigateDown();
        return;
      }
      if (KeyUtils.matchesBinding(event, config.value.navigation.up)) {
        event.preventDefault();
        navigateUp();
        return;
      }
    } else if (pageType.value === "article") {
      // Article scrolling
      if (KeyUtils.matchesBinding(event, config.value.scrolling.lineDown)) {
        event.preventDefault();
        scrollLineDown();
        return;
      }
      if (KeyUtils.matchesBinding(event, config.value.scrolling.lineUp)) {
        event.preventDefault();
        scrollLineUp();
        return;
      }
    }

    // Handle common key bindings using config
    if (KeyUtils.matchesBinding(event, config.value.navigation.enter)) {
      event.preventDefault();
      selectCurrent();
      return;
    }

    if (KeyUtils.matchesBinding(event, config.value.navigation.back)) {
      event.preventDefault();
      goBack();
      return;
    }

    if (KeyUtils.matchesBinding(event, config.value.navigation.nextSeries)) {
      event.preventDefault();
      navigateNextSeries();
      return;
    }

    if (KeyUtils.matchesBinding(event, config.value.navigation.prevSeries)) {
      event.preventDefault();
      navigatePrevSeries();
      return;
    }

    if (KeyUtils.matchesBinding(event, config.value.panels.help)) {
      event.preventDefault();
      toggleHelp();
      return;
    }
  };

  // Helper function to clear sequence timeout
  const clearSequenceTimeout = () => {
    lastKeyPressed.value = "";
    if (keyPressTimeout.value) {
      clearTimeout(keyPressTimeout.value);
      keyPressTimeout.value = null;
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
    document.addEventListener("keydown", handleKeyDown);
    initializeSelection();
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
    if (keyPressTimeout.value) {
      clearTimeout(keyPressTimeout.value);
    }
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
    updateConfig,
    initializeSelection,

    // Handlers
    navigateUp,
    navigateDown,
    selectCurrent,
    goBack,
    navigateNextSeries,
    navigatePrevSeries,
    scrollLineUp,
    scrollLineDown,
    scrollToTop,
    scrollToBottom,
    scrollHalfPageUp,
    scrollHalfPageDown,
    toggleHelp,
  };
}
