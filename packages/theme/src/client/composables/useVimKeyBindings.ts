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
  const selectedIndex = ref(-1); // Start with no selection
  const isSelectionActive = ref(false); // Track if user has activated selection
  const showHelp = ref(false);
  const config = ref<VimKeyBindingsConfig>(loadVimConfig());
  const lastKeyPressed = ref("");
  const keyPressTimeout = ref<number | null>(null);

  // State persistence keys
  const HOMEPAGE_STATE_KEY = "vim-homepage-state";

  // Save homepage state to sessionStorage
  const saveHomepageState = () => {
    if (pageType.value === "home") {
      const state = {
        scrollTop: window.scrollY,
        selectedIndex: selectedIndex.value,
        isSelectionActive: isSelectionActive.value,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(HOMEPAGE_STATE_KEY, JSON.stringify(state));
    }
  };

  // Load homepage state from sessionStorage
  const loadHomepageState = () => {
    try {
      const saved = sessionStorage.getItem(HOMEPAGE_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if saved recently (within 5 minutes)
        if (Date.now() - state.timestamp < 300000) {
          return state;
        }
      }
    } catch (error) {
      console.warn("Failed to load homepage state:", error);
    }
    return null;
  };

  // Clear homepage state
  const clearHomepageState = () => {
    sessionStorage.removeItem(HOMEPAGE_STATE_KEY);
  };

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

  // Find the most suitable article within viewport
  const findBestArticleInViewport = (direction: "up" | "down"): number => {
    const elements = getSelectableElements();
    if (elements.length === 0) return -1;

    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const viewportCenter = viewportTop + window.innerHeight / 2;

    // Find articles that are at least partially visible
    const visibleArticles = elements
      .map((element, index) => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementBottom = elementTop + rect.height;

        // Check if element is at least partially visible
        const isVisible =
          elementBottom > viewportTop && elementTop < viewportBottom;

        if (!isVisible) return null;

        // Calculate how much of the element is in viewport
        const visibleTop = Math.max(elementTop, viewportTop);
        const visibleBottom = Math.min(elementBottom, viewportBottom);
        const visibleHeight = visibleBottom - visibleTop;
        const visibilityRatio = visibleHeight / rect.height;

        // Calculate distance from viewport center
        const elementCenter = elementTop + rect.height / 2;
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);

        return {
          index,
          element,
          elementTop,
          elementBottom,
          visibilityRatio,
          distanceFromCenter,
          elementCenter,
        };
      })
      .filter((item) => item !== null);

    if (visibleArticles.length === 0) {
      // No articles in viewport, return first or last based on direction
      return direction === "down" ? 0 : elements.length - 1;
    }

    // Sort by visibility ratio (more visible = better) and distance from center (closer = better)
    visibleArticles.sort((a, b) => {
      // Prioritize articles that are more visible
      if (Math.abs(a.visibilityRatio - b.visibilityRatio) > 0.1) {
        return b.visibilityRatio - a.visibilityRatio;
      }
      // If visibility is similar, prefer the one closer to center
      return a.distanceFromCenter - b.distanceFromCenter;
    });

    return visibleArticles[0].index;
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

    // If selection is not active, find best article in viewport
    if (!isSelectionActive.value) {
      selectedIndex.value = findBestArticleInViewport("up");
      isSelectionActive.value = true;
    } else {
      // Normal navigation
      selectedIndex.value = Math.max(0, selectedIndex.value - 1);
    }

    highlightSelected();
  };

  const navigateDown = () => {
    if (pageType.value !== "home") return;

    const elements = getSelectableElements();
    if (elements.length === 0) return;

    // If selection is not active, find best article in viewport
    if (!isSelectionActive.value) {
      selectedIndex.value = findBestArticleInViewport("down");
      isSelectionActive.value = true;
    } else {
      // Normal navigation
      selectedIndex.value = Math.min(
        elements.length - 1,
        selectedIndex.value + 1,
      );
    }

    highlightSelected();
  };

  const selectCurrent = () => {
    if (pageType.value !== "home") return;

    const elements = getSelectableElements();

    // If no selection is active, activate selection first
    if (!isSelectionActive.value) {
      selectedIndex.value = findBestArticleInViewport("down");
      isSelectionActive.value = true;
      highlightSelected();
      return;
    }

    const currentElement = elements[selectedIndex.value];
    if (currentElement) {
      currentElement.click();
    }
  };

  const goBack = () => {
    if (pageType.value === "article") {
      // Save current homepage state before navigating
      saveHomepageState();
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
  const highlightSelected = (smooth = true) => {
    const elements = getSelectableElements();

    // Remove previous highlights
    elements.forEach((el) => el.classList.remove("vim-selected"));

    // Add highlight to current selection if selection is active and valid
    if (isSelectionActive.value && selectedIndex.value >= 0) {
      const currentElement = elements[selectedIndex.value];
      if (currentElement) {
        currentElement.classList.add("vim-selected");
        // Only scroll into view if smooth navigation is requested
        if (smooth) {
          currentElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }
    }

    // Save state after highlighting changes
    if (pageType.value === "home") {
      setTimeout(() => saveHomepageState(), 100);
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

    // When help modal is open, only allow help toggle key
    if (showHelp.value) {
      if (KeyUtils.matchesBinding(event, config.value.panels.help)) {
        event.preventDefault();
        toggleHelp();
      }
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
      // Try to restore previous state
      const savedState = loadHomepageState();

      if (savedState) {
        // Restore state smoothly
        selectedIndex.value = savedState.selectedIndex;
        isSelectionActive.value = savedState.isSelectionActive;

        // Restore scroll position after DOM updates
        setTimeout(() => {
          window.scrollTo({
            top: savedState.scrollTop,
            behavior: "instant", // No animation to prevent flickering
          });

          // Restore selection highlight if active
          if (isSelectionActive.value && selectedIndex.value >= 0) {
            highlightSelected(false); // No smooth scrolling to prevent double scroll
          }
        }, 0);
      } else {
        // Reset selection state - no initial selection
        selectedIndex.value = -1;
        isSelectionActive.value = false;
        // Clear any existing highlights
        const elements = getSelectableElements();
        elements.forEach((el) => el.classList.remove("vim-selected"));
      }
    } else {
      // Clear homepage state when navigating away
      clearHomepageState();
    }
  };

  // Handle scroll events to save state
  const handleScroll = () => {
    if (pageType.value === "home") {
      // Debounce scroll state saving
      clearTimeout(keyPressTimeout.value);
      keyPressTimeout.value = window.setTimeout(() => {
        saveHomepageState();
      }, 150);
    }
  };

  // Lifecycle
  onMounted(() => {
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize with a slight delay to ensure DOM is ready
    setTimeout(() => {
      initializeSelection();
    }, 50);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("scroll", handleScroll);
    if (keyPressTimeout.value) {
      clearTimeout(keyPressTimeout.value);
    }
    // Save state before unmounting if on homepage
    if (pageType.value === "home") {
      saveHomepageState();
    }
  });

  return {
    // State
    isActive,
    selectedIndex,
    isSelectionActive,
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
