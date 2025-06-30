# Vim Key Bindings

This blog theme includes comprehensive Vim-style key bindings for enhanced navigation and productivity.

## Features

### 🏠 Homepage Navigation

- **j/k**: Navigate up and down through articles
- **Enter**: Open selected article
- **Visual feedback**: Selected articles are highlighted with a border

### 📖 Article Navigation & Scrolling

- **j/k**: Scroll up and down line by line
- **gg**: Jump to top of article
- **G**: Jump to bottom of article
- **Ctrl+u**: Scroll up half page
- **Ctrl+d**: Scroll down half page
- **Escape**: Go back to previous page
- **n**: Next article in series (if available)
- **p**: Previous article in series (if available)

### 🔍 Help

- **?**: Toggle help panel showing all key bindings
- **Escape**: Close any open panel

### 🎨 Visual Indicators

- **Bottom-right corner**: Context-sensitive hints showing available shortcuts
- **Article highlighting**: Selected articles are visually highlighted
- **Smooth animations**: All interactions include smooth transitions

## Customization

### Key Binding Configuration

The theme now uses a centralized configuration system for all key bindings. Users can customize key bindings by modifying their configuration in browser storage:

```javascript
// Import configuration utilities (if using in a module)
import {
  saveVimConfig,
  loadVimConfig,
  resetVimConfig,
} from "./src/client/config/vimKeybindings";

// Or directly modify localStorage
const vimConfig = {
  navigation: {
    up: "k", // Navigate up on homepage
    down: "j", // Navigate down on homepage
    enter: "Enter", // Select/open
    back: "Escape", // Go back
    nextSeries: "n", // Next in series
    prevSeries: "p", // Previous in series
  },
  scrolling: {
    lineUp: "k", // Scroll up one line in articles
    lineDown: "j", // Scroll down one line in articles
    top: "gg", // Jump to top (multi-key sequence)
    bottom: "G", // Jump to bottom
    halfPageUp: "ctrl+u", // Scroll up half page
    halfPageDown: "ctrl+d", // Scroll down half page
  },
  panels: {
    help: "?", // Toggle help
  },
  // Special key combinations and sequences
  combinations: {
    ctrlU: "u", // Ctrl+u key
    ctrlD: "d", // Ctrl+d key
  },
  sequences: {
    doubleG: "g", // Double-g sequence key
  },
};

// Save to localStorage
localStorage.setItem("vim-keybindings", JSON.stringify(vimConfig));

// Or use the utility functions for better error handling
// saveVimConfig(vimConfig);
// const currentConfig = loadVimConfig();
// resetVimConfig(); // Reset to defaults
```

#### Configuration Features

- **Centralized Management**: All key bindings are now managed through a single configuration system
- **Type Safety**: Full TypeScript support with proper interfaces
- **Deep Merging**: Partial updates merge with existing configuration
- **Error Handling**: Graceful fallback to defaults if configuration is corrupted
- **Utility Functions**: Helper functions for key matching and formatting
- **Backward Compatibility**: Existing localStorage configurations are automatically migrated

### CSS Customization

The visual styling can be customized through CSS variables:

```css
/* Selection highlight */
.post-title.vim-selected {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  outline: 2px solid var(--vp-c-brand);
}

/* Vim indicator */
.vim-indicator {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}
```

## Technical Implementation

### Architecture

The Vim key bindings are implemented using:

- **Composable**: `useVimKeyBindings.ts` - Core logic and state management
- **Components**:
  - `VimHelpPanel.vue` - Help panel with key binding reference
  - `VimIndicator.vue` - Context-sensitive hint display
  - `SeriesNavigation.vue` - Series article navigation

### Key Features

1. **Context Awareness**: Different key bindings available based on current page type
2. **Keyboard Focus Management**: Proper handling of input focus states
3. **Accessibility**: Full keyboard navigation support
4. **Mobile Responsive**: Indicator and panels adapt to mobile screens
5. **TypeScript**: Full type safety throughout the implementation

### Integration Points

- **Homepage**: Integrated into `Home.vue` for article selection
- **Articles**: Available globally through `Layout.vue` with full scrolling support
- **Series**: Automatic detection and navigation for series articles
- **Scrolling**: Smooth scrolling with Vim-style navigation keys

## Browser Support

- **Modern browsers**: Full support for all features
- **Legacy browsers**: Graceful degradation with basic functionality
- **Mobile devices**: Touch-friendly with keyboard shortcuts when hardware keyboard is available

## Performance

- **Lazy loading**: Components are loaded only when needed
- **Event delegation**: Efficient keyboard event handling
- **Minimal bundle size**: Lightweight implementation with no external dependencies
- **Memory efficient**: Proper cleanup on component unmount

## Accessibility

- **Keyboard navigation**: Full keyboard accessibility
- **Screen readers**: Proper ARIA labels and descriptions
- **Focus management**: Logical focus flow
- **High contrast**: Respects user's color preferences

## Future Enhancements

Potential improvements for future versions:

- **Command palette**: Quick access to all blog functions
- **Bookmarks**: Vim-style bookmarking system
- **History**: Navigation history with jump list
- **Tabs**: Multiple article tabs (if applicable)
- **Macros**: Recordable action sequences
