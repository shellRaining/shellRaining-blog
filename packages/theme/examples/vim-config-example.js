/**
 * Example: Custom Vim Key Bindings Configuration
 *
 * This file demonstrates how to customize the Vim key bindings in the blog theme.
 * You can use this configuration in your browser's console or as a reference
 * when setting up custom key bindings.
 */

// Example 1: Change navigation keys to use WASD instead of HJKL
const wasdConfig = {
  navigation: {
    up: "w",
    down: "s",
    enter: "Enter",
    back: "Escape",
    nextSeries: "d",
    prevSeries: "a",
  },
  scrolling: {
    lineUp: "w",
    lineDown: "s",
    top: "ww", // Double w to go to top
    bottom: "S", // Shift+S to go to bottom
    halfPageUp: "ctrl+w",
    halfPageDown: "ctrl+s",
  },
  panels: {
    help: "?",
  },
  combinations: {
    ctrlU: "w",
    ctrlD: "s",
  },
  sequences: {
    doubleG: "w",
  },
};

// Example 2: Arrow key configuration for users who prefer arrow keys
const arrowConfig = {
  navigation: {
    up: "ArrowUp",
    down: "ArrowDown",
    enter: "Enter",
    back: "Escape",
    nextSeries: "ArrowRight",
    prevSeries: "ArrowLeft",
  },
  scrolling: {
    lineUp: "ArrowUp",
    lineDown: "ArrowDown",
    top: "Home",
    bottom: "End",
    halfPageUp: "PageUp",
    halfPageDown: "PageDown",
  },
  panels: {
    help: "F1",
  },
  combinations: {
    ctrlU: "PageUp",
    ctrlD: "PageDown",
  },
  sequences: {
    doubleG: "Home",
  },
};

// Example 3: Emacs-style configuration
const emacsConfig = {
  navigation: {
    up: "ctrl+p",
    down: "ctrl+n",
    enter: "Enter",
    back: "ctrl+g",
    nextSeries: "ctrl+f",
    prevSeries: "ctrl+b",
  },
  scrolling: {
    lineUp: "ctrl+p",
    lineDown: "ctrl+n",
    top: "ctrl+a",
    bottom: "ctrl+e",
    halfPageUp: "ctrl+v",
    halfPageDown: "alt+v",
  },
  panels: {
    help: "ctrl+h",
  },
  combinations: {
    ctrlU: "v",
    ctrlD: "v",
  },
  sequences: {
    doubleG: "a",
  },
};

// How to apply configurations:

// Method 1: Direct localStorage (works in browser console)
console.log("To apply WASD config:");
console.log(
  "localStorage.setItem('vim-keybindings', JSON.stringify(" +
    JSON.stringify(wasdConfig, null, 2) +
    "));",
);

console.log("\nTo apply Arrow keys config:");
console.log(
  "localStorage.setItem('vim-keybindings', JSON.stringify(" +
    JSON.stringify(arrowConfig, null, 2) +
    "));",
);

console.log("\nTo apply Emacs config:");
console.log(
  "localStorage.setItem('vim-keybindings', JSON.stringify(" +
    JSON.stringify(emacsConfig, null, 2) +
    "));",
);

// Method 2: Using utility functions (if importing in a module)
/*
import { saveVimConfig, resetVimConfig } from '../src/client/config/vimKeybindings';

// Apply WASD configuration
saveVimConfig(wasdConfig);

// Reset to default
resetVimConfig();
*/

// Method 3: Partial configuration update
const partialUpdate = {
  navigation: {
    up: "w",
    down: "s",
  },
};

console.log("\nTo partially update config (only change up/down keys):");
console.log(
  "const current = JSON.parse(localStorage.getItem('vim-keybindings') || '{}');",
);
console.log(
  "const updated = Object.assign(current, " +
    JSON.stringify(partialUpdate, null, 2) +
    ");",
);
console.log(
  "localStorage.setItem('vim-keybindings', JSON.stringify(updated));",
);

// Export configurations for use in modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    wasdConfig,
    arrowConfig,
    emacsConfig,
    partialUpdate,
  };
}
