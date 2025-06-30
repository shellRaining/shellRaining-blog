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
    halfPageUp: string;
    halfPageDown: string;
  };
  panels: {
    help: string;
  };
  // Special key combinations and sequences
  combinations: {
    ctrlU: string;
    ctrlD: string;
  };
  sequences: {
    doubleG: string;
  };
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
    lineUp: "k",
    lineDown: "j",
    top: "gg",
    bottom: "G",
    halfPageUp: "ctrl+u",
    halfPageDown: "ctrl+d",
  },
  panels: {
    help: "?",
  },
  combinations: {
    ctrlU: "u",
    ctrlD: "d",
  },
  sequences: {
    doubleG: "g",
  },
};

export const VIM_CONFIG_STORAGE_KEY = "vim-keybindings";

/**
 * Load vim configuration from localStorage with fallback to default
 */
export function loadVimConfig(): VimKeyBindingsConfig {
  try {
    const savedConfig = localStorage.getItem(VIM_CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Deep merge with default config to ensure all properties exist
      return mergeConfigs(DEFAULT_VIM_CONFIG, parsed);
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
    localStorage.setItem(VIM_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
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
    localStorage.removeItem(VIM_CONFIG_STORAGE_KEY);
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
