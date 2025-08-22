import {
  SELECTORS,
  UI_CONSTANTS,
  SCROLL_BEHAVIOR,
  SCROLL_POSITION,
} from "../config/vimConstants";

/**
 * DOM utility functions for Vim operations
 */
export const DOMUtils = {
  /**
   * Get all selectable elements on the page
   */
  getSelectableElements(): HTMLElement[] {
    const elements = document.querySelectorAll(SELECTORS.POST_TITLE);
    return Array.from(elements) as HTMLElement[];
  },

  /**
   * Get series navigation elements
   */
  getSeriesNavigation() {
    const seriesNav = document.querySelector(SELECTORS.SERIES_NAV);
    if (!seriesNav) return null;

    const prevLink = seriesNav.querySelector(
      SELECTORS.PREV_LINK,
    ) as HTMLAnchorElement;
    const nextLink = seriesNav.querySelector(
      SELECTORS.NEXT_LINK,
    ) as HTMLAnchorElement;

    return {
      prevLink,
      nextLink,
      hasPrev: !!prevLink,
      hasNext: !!nextLink,
    };
  },

  /**
   * Add or remove vim selection class
   */
  updateSelectionClass(
    elements: HTMLElement[],
    selectedIndex: number,
    isActive: boolean,
  ) {
    // Remove previous highlights
    elements.forEach((el) => el.classList.remove(SELECTORS.VIM_SELECTED));

    // Add highlight to current selection if active and valid
    if (isActive && selectedIndex >= 0 && selectedIndex < elements.length) {
      const currentElement = elements[selectedIndex];
      if (currentElement) {
        currentElement.classList.add(SELECTORS.VIM_SELECTED);
        return currentElement;
      }
    }
    return null;
  },

  /**
   * Check if element is an input field
   */
  isInputElement(element: EventTarget | null): boolean {
    return (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    );
  },
};

/**
 * Scroll utility functions
 */
export const ScrollUtils = {
  /**
   * Scroll by a specific amount
   */
  scrollBy(amount: number, behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH) {
    window.scrollBy({ top: amount, behavior });
  },

  /**
   * Scroll to specific position
   */
  scrollTo(
    position: number,
    behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH,
  ) {
    window.scrollTo({ top: position, behavior });
  },

  /**
   * Scroll to top of page
   */
  scrollToTop(behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH) {
    this.scrollTo(0, behavior);
  },

  /**
   * Scroll to bottom of page
   */
  scrollToBottom(behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH) {
    this.scrollTo(document.body.scrollHeight, behavior);
  },

  /**
   * Scroll by line amount
   */
  scrollLineUp(behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH) {
    this.scrollBy(-UI_CONSTANTS.SCROLL_LINE_AMOUNT, behavior);
  },

  scrollLineDown(behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH) {
    this.scrollBy(UI_CONSTANTS.SCROLL_LINE_AMOUNT, behavior);
  },

  /**
   * Fast line scrolling for responsive navigation
   */
  fastScrollLineUp() {
    this.scrollBy(-UI_CONSTANTS.SCROLL_LINE_AMOUNT, SCROLL_BEHAVIOR.INSTANT);
  },

  fastScrollLineDown() {
    this.scrollBy(UI_CONSTANTS.SCROLL_LINE_AMOUNT, SCROLL_BEHAVIOR.INSTANT);
  },

  /**
   * Scroll element into view
   */
  scrollIntoView(
    element: HTMLElement,
    behavior: ScrollBehavior = SCROLL_BEHAVIOR.SMOOTH,
    block: ScrollLogicalPosition = SCROLL_POSITION.CENTER,
  ) {
    element.scrollIntoView({ behavior, block });
  },

  /**
   * Smart scroll element into view - only scrolls if element is not visible
   */
  smartScrollIntoView(
    element: HTMLElement,
    behavior: ScrollBehavior = SCROLL_BEHAVIOR.INSTANT,
    block: ScrollLogicalPosition = SCROLL_POSITION.CENTER,
  ) {
    // Check if element is already fully visible
    if (ViewportUtils.isElementVisible(element, 50)) {
      return; // Don't scroll if element is already visible with some padding
    }

    // Use instant scrolling for better responsiveness during rapid navigation
    element.scrollIntoView({ behavior, block });
  },

  /**
   * Force element to stay in viewport center - always scrolls for perfect centering
   */
  forceElementToCenter(
    element: HTMLElement,
    behavior: ScrollBehavior = SCROLL_BEHAVIOR.INSTANT,
  ) {
    const rect = element.getBoundingClientRect();
    const elementCenter = rect.top + window.scrollY + rect.height / 2;
    const viewportCenter = window.scrollY + window.innerHeight / 2;

    // Calculate the scroll distance needed to center the element
    const scrollDistance = elementCenter - viewportCenter;

    // Only scroll if the element is not already perfectly centered (with small tolerance)
    if (Math.abs(scrollDistance) > 5) {
      window.scrollBy({
        top: scrollDistance,
        behavior,
      });
    }
  },
};

/**
 * Viewport utility functions
 */
export const ViewportUtils = {
  /**
   * Get viewport dimensions and position
   */
  getViewportInfo() {
    return {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight,
      center: window.scrollY + window.innerHeight / 2,
      height: window.innerHeight,
      width: window.innerWidth,
    };
  },

  /**
   * Check if element is visible in viewport
   */
  isElementVisible(element: HTMLElement, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const viewport = this.getViewportInfo();

    const elementTop = rect.top + window.scrollY;
    const elementBottom = elementTop + rect.height;

    return (
      elementBottom > viewport.top + threshold &&
      elementTop < viewport.bottom - threshold
    );
  },

  /**
   * Get element visibility ratio
   */
  getElementVisibilityRatio(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const viewport = this.getViewportInfo();

    const elementTop = rect.top + window.scrollY;
    const elementBottom = elementTop + rect.height;

    const visibleTop = Math.max(elementTop, viewport.top);
    const visibleBottom = Math.min(elementBottom, viewport.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    return visibleHeight / rect.height;
  },

  /**
   * Calculate distance from viewport center
   */
  getDistanceFromCenter(element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    const viewport = this.getViewportInfo();

    const elementCenter = rect.top + window.scrollY + rect.height / 2;
    return Math.abs(elementCenter - viewport.center);
  },
};

/**
 * State management utilities
 */
export const StateUtils = {
  /**
   * Save state to storage with expiry
   */
  saveStateWithExpiry(
    key: string,
    state: any,
    expiryTime = UI_CONSTANTS.STATE_EXPIRY_TIME,
  ) {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
      expiryTime,
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(stateWithTimestamp));
    } catch (error) {
      console.warn(`Failed to save state for key ${key}:`, error);
    }
  },

  /**
   * Load state from storage checking expiry
   */
  loadStateWithExpiry(key: string) {
    try {
      const saved = sessionStorage.getItem(key);
      if (!saved) return null;

      const state = JSON.parse(saved);
      const now = Date.now();

      if (
        now - state.timestamp >
        (state.expiryTime || UI_CONSTANTS.STATE_EXPIRY_TIME)
      ) {
        this.clearState(key);
        return null;
      }

      return state;
    } catch (error) {
      console.warn(`Failed to load state for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Clear state from storage
   */
  clearState(key: string) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to clear state for key ${key}:`, error);
    }
  },

  /**
   * Create debounced function
   */
  debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number,
  ): T & { cancel: () => void } {
    let timeout: number | null = null;

    const debounced = ((...args: any[]) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => func(...args), wait);
    }) as T & { cancel: () => void };

    debounced.cancel = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };

    return debounced;
  },
};

/**
 * Navigation utilities
 */
export const NavigationUtils = {
  /**
   * Navigate to URL
   */
  navigateTo(url: string) {
    window.location.href = url;
  },

  /**
   * Navigate to home page
   */
  navigateToHome() {
    this.navigateTo("/");
  },

  /**
   * Navigate to previous page
   */
  navigateBack() {
    window.history.back();
  },
};

/**
 * Selection utilities for smart article selection
 */
export const SelectionUtils = {
  /**
   * Find the best article to select within viewport
   */
  findBestArticleInViewport(direction: "up" | "down" = "down"): number {
    const elements = DOMUtils.getSelectableElements();
    if (elements.length === 0) return -1;

    // Find articles that are at least partially visible
    const visibleArticles = elements
      .map((element, index) => {
        const visibilityRatio =
          ViewportUtils.getElementVisibilityRatio(element);
        const distanceFromCenter = ViewportUtils.getDistanceFromCenter(element);

        // Only consider visible elements
        if (visibilityRatio <= 0) return null;

        return {
          index,
          element,
          visibilityRatio,
          distanceFromCenter,
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
  },

  /**
   * Navigate selection up/down with bounds checking
   */
  navigateSelection(
    currentIndex: number,
    direction: "up" | "down",
    maxIndex: number,
  ): number {
    if (direction === "up") {
      return Math.max(0, currentIndex - 1);
    } else {
      return Math.min(maxIndex - 1, currentIndex + 1);
    }
  },
};
