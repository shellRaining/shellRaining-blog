import { ref, computed, onMounted, onUnmounted } from "vue";
import { useData } from "vitepress";
import {
  type VimKeyBindingsConfig,
  loadVimConfig,
  saveVimConfig,
  KeyUtils,
  createActionDefinitions,
} from "../config/vimKeybindings";
import {
  DOMUtils,
  ScrollUtils,
  StateUtils,
  NavigationUtils,
  SelectionUtils,
} from "../utils/vimUtils";
import {
  STORAGE_KEYS,
  UI_CONSTANTS,
  PAGE_TYPES,
  ACTION_TYPES,
} from "../config/vimConstants";

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

  // State management with utilities
  const debouncedSaveState = StateUtils.debounce(() => {
    saveHomepageState();
  }, UI_CONSTANTS.SCROLL_SAVE_DEBOUNCE);

  // Save homepage state to sessionStorage
  const saveHomepageState = () => {
    if (pageType.value === PAGE_TYPES.HOME) {
      const state = {
        scrollTop: window.scrollY,
        selectedIndex: selectedIndex.value,
        isSelectionActive: isSelectionActive.value,
      };
      StateUtils.saveStateWithExpiry(STORAGE_KEYS.HOMEPAGE_STATE, state);
    }
  };

  // Load homepage state from sessionStorage
  const loadHomepageState = () => {
    return StateUtils.loadStateWithExpiry(STORAGE_KEYS.HOMEPAGE_STATE);
  };

  // Clear homepage state
  const clearHomepageState = () => {
    StateUtils.clearState(STORAGE_KEYS.HOMEPAGE_STATE);
  };

  // Update config and save to localStorage
  const updateConfig = (newConfig: Partial<VimKeyBindingsConfig>) => {
    config.value = saveVimConfig(newConfig);
  };

  // Get current page type
  const pageType = computed(() => {
    if (page.value.relativePath === "index.md") return PAGE_TYPES.HOME;
    if (page.value.relativePath.startsWith("docs/")) return PAGE_TYPES.ARTICLE;
    return PAGE_TYPES.OTHER;
  });

  // Get selectable elements using utility
  const getSelectableElements = DOMUtils.getSelectableElements;

  // Find the most suitable article within viewport using utility
  const findBestArticleInViewport = SelectionUtils.findBestArticleInViewport;

  // Get series navigation info using utility
  const getSeriesInfo = DOMUtils.getSeriesNavigation;

  // Navigation handlers
  const navigateUp = () => {
    if (pageType.value !== PAGE_TYPES.HOME) return;

    const elements = getSelectableElements();
    if (elements.length === 0) return;

    // If selection is not active, find best article in viewport
    if (!isSelectionActive.value) {
      selectedIndex.value = findBestArticleInViewport("up");
      isSelectionActive.value = true;
    } else {
      // Normal navigation using utility
      selectedIndex.value = SelectionUtils.navigateSelection(
        selectedIndex.value,
        "up",
        elements.length,
      );
    }

    highlightSelected();
  };

  const navigateDown = () => {
    if (pageType.value !== PAGE_TYPES.HOME) return;

    const elements = getSelectableElements();
    if (elements.length === 0) return;

    // If selection is not active, find best article in viewport
    if (!isSelectionActive.value) {
      selectedIndex.value = findBestArticleInViewport("down");
      isSelectionActive.value = true;
    } else {
      // Normal navigation using utility
      selectedIndex.value = SelectionUtils.navigateSelection(
        selectedIndex.value,
        "down",
        elements.length,
      );
    }

    highlightSelected();
  };

  const selectCurrent = () => {
    if (pageType.value !== PAGE_TYPES.HOME) return;

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
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      // Save current homepage state before navigating
      saveHomepageState();
      NavigationUtils.navigateToHome();
    }
  };

  const navigateNextSeries = () => {
    if (pageType.value !== PAGE_TYPES.ARTICLE) return false;

    const seriesInfo = getSeriesInfo();
    if (seriesInfo?.hasNext && seriesInfo.nextLink) {
      NavigationUtils.navigateTo(seriesInfo.nextLink.href);
      return true;
    }
    return false;
  };

  const navigatePrevSeries = () => {
    if (pageType.value !== PAGE_TYPES.ARTICLE) return false;

    const seriesInfo = getSeriesInfo();
    if (seriesInfo?.hasPrev && seriesInfo.prevLink) {
      NavigationUtils.navigateTo(seriesInfo.prevLink.href);
      return true;
    }
    return false;
  };

  // Scrolling handlers for articles using utilities
  const scrollLineUp = () => {
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      ScrollUtils.scrollLineUp();
    }
  };

  const scrollLineDown = () => {
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      ScrollUtils.scrollLineDown();
    }
  };

  const scrollToTop = () => {
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      ScrollUtils.scrollToTop();
    }
  };

  const scrollToBottom = () => {
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      ScrollUtils.scrollToBottom();
    }
  };

  const scrollHalfPageUp = () => {
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      ScrollUtils.scrollHalfPageUp();
    }
  };

  const scrollHalfPageDown = () => {
    if (pageType.value === PAGE_TYPES.ARTICLE) {
      ScrollUtils.scrollHalfPageDown();
    }
  };

  // Panel handlers
  const toggleHelp = () => {
    showHelp.value = !showHelp.value;
  };

  // Visual feedback using utilities
  const highlightSelected = (smooth = true) => {
    const elements = getSelectableElements();

    // Update selection class using utility
    const currentElement = DOMUtils.updateSelectionClass(
      elements,
      selectedIndex.value,
      isSelectionActive.value,
    );

    // Scroll into view if smooth navigation is requested
    if (smooth && currentElement) {
      ScrollUtils.scrollIntoView(currentElement);
    }

    // Save state after highlighting changes
    if (pageType.value === PAGE_TYPES.HOME) {
      setTimeout(() => saveHomepageState(), UI_CONSTANTS.STATE_SAVE_DELAY);
    }
  };

  // Handler mapping for actions
  const handlerMap: Record<string, () => void | boolean> = {
    [ACTION_TYPES.NAVIGATE_UP]: navigateUp,
    [ACTION_TYPES.NAVIGATE_DOWN]: navigateDown,
    [ACTION_TYPES.SELECT_CURRENT]: selectCurrent,
    [ACTION_TYPES.SCROLL_LINE_UP]: scrollLineUp,
    [ACTION_TYPES.SCROLL_LINE_DOWN]: scrollLineDown,
    [ACTION_TYPES.SCROLL_TO_TOP]: scrollToTop,
    [ACTION_TYPES.SCROLL_TO_BOTTOM]: scrollToBottom,
    [ACTION_TYPES.SCROLL_HALF_PAGE_UP]: scrollHalfPageUp,
    [ACTION_TYPES.SCROLL_HALF_PAGE_DOWN]: scrollHalfPageDown,
    [ACTION_TYPES.GO_BACK]: goBack,
    [ACTION_TYPES.NEXT_SERIES]: navigateNextSeries,
    [ACTION_TYPES.PREV_SERIES]: navigatePrevSeries,
    [ACTION_TYPES.TOGGLE_HELP]: toggleHelp,
  };

  // Key binding definitions using action definitions
  const keyBindings = computed<VimKeyBinding[]>(() => {
    const actionDefinitions = createActionDefinitions(config.value);
    return actionDefinitions.map((def) => ({
      key: def.key,
      action: def.action,
      description: def.description,
      handler: handlerMap[def.action] || (() => {}),
    }));
  });

  // Keyboard event handler
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive.value) return;

    // Don't interfere with input fields using utility
    if (DOMUtils.isInputElement(event.target)) {
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
    if (pageType.value === PAGE_TYPES.HOME) {
      // Homepage navigation - use j/k for article navigation
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
    } else if (pageType.value === PAGE_TYPES.ARTICLE) {
      // Article scrolling - use j/k for line scrolling
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

      // Series navigation - use n/p for next/prev article in series
      if (KeyUtils.matchesBinding(event, config.value.navigation.nextSeries)) {
        event.preventDefault();
        const result = navigateNextSeries();
        if (!result) {
          // Optional: Provide visual feedback when no next article exists
          console.log("No next article in series");
        }
        return;
      }
      if (KeyUtils.matchesBinding(event, config.value.navigation.prevSeries)) {
        event.preventDefault();
        const result = navigatePrevSeries();
        if (!result) {
          // Optional: Provide visual feedback when no previous article exists
          console.log("No previous article in series");
        }
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
    if (pageType.value === PAGE_TYPES.HOME) {
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
        // Clear any existing highlights using utility
        const elements = getSelectableElements();
        DOMUtils.updateSelectionClass(elements, -1, false);
      }
    } else {
      // Clear homepage state when navigating away
      clearHomepageState();
    }
  };

  // Handle scroll events to save state using debounced utility
  const handleScroll = () => {
    if (pageType.value === PAGE_TYPES.HOME) {
      debouncedSaveState();
    }
  };

  // Lifecycle
  onMounted(() => {
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize with a slight delay to ensure DOM is ready
    setTimeout(() => {
      initializeSelection();
    }, UI_CONSTANTS.INITIALIZATION_DELAY);
  });

  onUnmounted(() => {
    document.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("scroll", handleScroll);
    if (keyPressTimeout.value) {
      clearTimeout(keyPressTimeout.value);
    }
    // Save state before unmounting if on homepage
    if (pageType.value === PAGE_TYPES.HOME) {
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
