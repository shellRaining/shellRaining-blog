import {
  STORAGE_KEYS,
  PAGE_TYPES,
  ACTION_GROUPS,
  ACTION_TYPES,
} from "./vimConstants";

export interface VimKeyBindingsConfig {
  navigation: {
    up: string;
    down: string;
    enter: string;
    back: string;
    nextSeries: string;
    prevSeries: string;
  };
  scrolling: {
    lineUp: string;
    lineDown: string;
    top: string;
    bottom: string;
  };
  panels: {
    help: string;
  };
  // Special key sequences
  sequences: {
    doubleG: string;
  };
}

export interface VimActionDefinition {
  key: string;
  action: string;
  description: string;
  contexts: string[];
  group: string;
}

export const DEFAULT_VIM_CONFIG: VimKeyBindingsConfig = {
  navigation: {
    up: "k",
    down: "j",
    enter: "i",
    back: "u",
    nextSeries: "n",
    prevSeries: "p",
  },
  scrolling: {
    lineUp: "k", // Same as navigation up, but context-dependent
    lineDown: "j", // Same as navigation down, but context-dependent
    top: "gg",
    bottom: "G",
  },
  panels: {
    help: "?",
  },
  sequences: {
    doubleG: "g",
  },
};

export const VIM_CONFIG_STORAGE_KEY = STORAGE_KEYS.VIM_CONFIG;

/**
 * Predefined action definitions with context information
 */
export function createActionDefinitions(
  config: VimKeyBindingsConfig,
): VimActionDefinition[] {
  return [
    // Navigation actions
    {
      key: config.navigation.up,
      action: ACTION_TYPES.NAVIGATE_UP,
      description: "Navigate up in article list",
      contexts: [PAGE_TYPES.HOME],
      group: ACTION_GROUPS.NAVIGATION,
    },
    {
      key: config.navigation.down,
      action: ACTION_TYPES.NAVIGATE_DOWN,
      description: "Navigate down in article list",
      contexts: [PAGE_TYPES.HOME],
      group: ACTION_GROUPS.NAVIGATION,
    },
    {
      key: config.navigation.enter,
      action: ACTION_TYPES.SELECT_CURRENT,
      description: "Enter selected article",
      contexts: [PAGE_TYPES.HOME],
      group: ACTION_GROUPS.NAVIGATION,
    },
    {
      key: config.navigation.back,
      action: ACTION_TYPES.GO_BACK,
      description: "Go back to previous page",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.NAVIGATION,
    },
    // Scrolling actions
    {
      key: config.scrolling.lineUp,
      action: ACTION_TYPES.SCROLL_LINE_UP,
      description: "Scroll up one line",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.SCROLLING,
    },
    {
      key: config.scrolling.lineDown,
      action: ACTION_TYPES.SCROLL_LINE_DOWN,
      description: "Scroll down one line",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.SCROLLING,
    },
    {
      key: config.scrolling.top,
      action: ACTION_TYPES.SCROLL_TO_TOP,
      description: "Jump to top of page",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.SCROLLING,
    },
    {
      key: config.scrolling.bottom,
      action: ACTION_TYPES.SCROLL_TO_BOTTOM,
      description: "Jump to bottom of page",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.SCROLLING,
    },
    // Series navigation
    {
      key: config.navigation.nextSeries,
      action: ACTION_TYPES.NEXT_SERIES,
      description: "Go to next article in series",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.SERIES,
    },
    {
      key: config.navigation.prevSeries,
      action: ACTION_TYPES.PREV_SERIES,
      description: "Go to previous article in series",
      contexts: [PAGE_TYPES.ARTICLE],
      group: ACTION_GROUPS.SERIES,
    },
    // Panel actions
    {
      key: config.panels.help,
      action: ACTION_TYPES.TOGGLE_HELP,
      description: "Toggle help panel",
      contexts: [PAGE_TYPES.HOME, PAGE_TYPES.ARTICLE, PAGE_TYPES.OTHER],
      group: ACTION_GROUPS.PANELS,
    },
  ];
}

/**
 * Load vim configuration from localStorage with fallback to default
 */
export function loadVimConfig(): VimKeyBindingsConfig {
  try {
    // Check if localStorage is available (browser environment)
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      const savedConfig = localStorage.getItem(VIM_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Deep merge with default config to ensure all properties exist
        return mergeConfigs(DEFAULT_VIM_CONFIG, parsed);
      }
    }
  } catch (error) {
    console.warn("Failed to load vim keybindings config:", error);
  }
  return DEFAULT_VIM_CONFIG;
}

/**
 * Save vim configuration to localStorage
 */
export function saveVimConfig(
  config: Partial<VimKeyBindingsConfig>,
): VimKeyBindingsConfig {
  try {
    const currentConfig = loadVimConfig();
    const newConfig = mergeConfigs(currentConfig, config);
    // Check if localStorage is available (browser environment)
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(VIM_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
    }
    return newConfig;
  } catch (error) {
    console.warn("Failed to save vim keybindings config:", error);
    return DEFAULT_VIM_CONFIG;
  }
}

/**
 * Deep merge two configuration objects
 */
function mergeConfigs(
  target: VimKeyBindingsConfig,
  source: Partial<VimKeyBindingsConfig>,
): VimKeyBindingsConfig {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key as keyof VimKeyBindingsConfig];
    if (
      sourceValue &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue)
    ) {
      result[key as keyof VimKeyBindingsConfig] = {
        ...result[key as keyof VimKeyBindingsConfig],
        ...sourceValue,
      } as any;
    } else if (sourceValue !== undefined) {
      (result as any)[key] = sourceValue;
    }
  }

  return result;
}

/**
 * Reset vim configuration to default
 */
export function resetVimConfig(): VimKeyBindingsConfig {
  try {
    // Check if localStorage is available (browser environment)
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem(VIM_CONFIG_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Failed to reset vim keybindings config:", error);
  }
  return DEFAULT_VIM_CONFIG;
}

/**
 * Key binding utility functions
 */
export const KeyUtils = {
  /**
   * Check if event matches a key binding considering modifiers
   */
  matchesBinding(event: KeyboardEvent, binding: string): boolean {
    const normalizedBinding = binding.toLowerCase();

    // Handle ctrl combinations
    if (normalizedBinding.startsWith("ctrl+")) {
      const key = normalizedBinding.replace("ctrl+", "");
      return event.ctrlKey && event.key.toLowerCase() === key;
    }

    // Handle special keys
    if (normalizedBinding === "enter") {
      return event.key === "Enter";
    }

    if (normalizedBinding === "escape") {
      return event.key === "Escape";
    }

    // Handle regular keys
    return event.key.toLowerCase() === normalizedBinding;
  },

  /**
   * Check if event is a sequence start (like 'g' for 'gg')
   */
  isSequenceStart(event: KeyboardEvent, sequenceKey: string): boolean {
    return event.key.toLowerCase() === sequenceKey.toLowerCase();
  },

  /**
   * Format key binding for display
   */
  formatForDisplay(binding: string): string {
    return binding
      .replace("ctrl+", "Ctrl+")
      .replace("enter", "Enter")
      .replace("escape", "Esc");
  },
};
