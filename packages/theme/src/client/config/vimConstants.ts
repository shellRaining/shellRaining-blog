/**
 * Vim-related constants and configuration
 */

// Storage keys
export const STORAGE_KEYS = {
  VIM_CONFIG: "vim-keybindings",
  HOMEPAGE_STATE: "vim-homepage-state",
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SCROLL_LINE_AMOUNT: 60,
  SEQUENCE_TIMEOUT: 1000,
  SCROLL_SAVE_DEBOUNCE: 150,
  INITIALIZATION_DELAY: 50,
  STATE_SAVE_DELAY: 100,
  STATE_EXPIRY_TIME: 300000, // 5 minutes
} as const;

// Selectors
export const SELECTORS = {
  POST_TITLE: ".post-title",
  SERIES_NAV: "[data-series-nav]",
  PREV_LINK: '[rel="prev"]',
  NEXT_LINK: '[rel="next"]',
  VIM_SELECTED: "vim-selected",
} as const;

// Page types
export const PAGE_TYPES = {
  HOME: "home",
  ARTICLE: "article",
  OTHER: "other",
} as const;

// Action types for keybindings
export const ACTION_TYPES = {
  NAVIGATE_UP: "navigate-up",
  NAVIGATE_DOWN: "navigate-down",
  SELECT_CURRENT: "select-current",
  SCROLL_LINE_UP: "scroll-line-up",
  SCROLL_LINE_DOWN: "scroll-line-down",
  SCROLL_TO_TOP: "scroll-to-top",
  SCROLL_TO_BOTTOM: "scroll-to-bottom",
  GO_BACK: "go-back",
  NEXT_SERIES: "next-series",
  PREV_SERIES: "prev-series",
  TOGGLE_HELP: "toggle-help",
} as const;

// Scroll behaviors
export const SCROLL_BEHAVIOR = {
  SMOOTH: "smooth",
  INSTANT: "instant",
  AUTO: "auto",
} as const;

// Scroll positions
export const SCROLL_POSITION = {
  CENTER: "center",
  START: "start",
  END: "end",
  NEAREST: "nearest",
} as const;

// Context-specific action groups for help panel
export const ACTION_GROUPS = {
  NAVIGATION: "Navigation",
  SCROLLING: "Scrolling",
  PANELS: "Panels",
  SERIES: "Series",
} as const;

// Keyboard event types
export const KEY_EVENTS = {
  KEYDOWN: "keydown",
  KEYUP: "keyup",
  KEYPRESS: "keypress",
} as const;

// Special keys
export const SPECIAL_KEYS = {
  ENTER: "Enter",
  ESCAPE: "Escape",
  CTRL: "ctrl",
  SHIFT: "shift",
  ALT: "alt",
  META: "meta",
} as const;
