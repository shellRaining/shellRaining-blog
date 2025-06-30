# Vim Key Bindings

This blog theme includes comprehensive Vim-style key bindings for enhanced navigation and productivity.

## Features

### 🏠 Homepage Navigation

- **j/k**: Navigate up and down through articles
- **Enter**: Open selected article
- **Visual feedback**: Selected articles are highlighted with a border

### 📖 Article Navigation

- **Escape**: Go back to previous page
- **n**: Next article in series (if available)
- **p**: Previous article in series (if available)

### 🔍 Search & Help

- **/**: Open search panel
- **?**: Toggle help panel showing all key bindings
- **Escape**: Close any open panel

### 🎨 Visual Indicators

- **Bottom-right corner**: Context-sensitive hints showing available shortcuts
- **Article highlighting**: Selected articles are visually highlighted
- **Smooth animations**: All interactions include smooth transitions

## Customization

### Key Binding Configuration

Users can customize key bindings by modifying their configuration in browser storage:

```javascript
// Access the vim bindings configuration
const vimConfig = {
  navigation: {
    up: "k", // Navigate up
    down: "j", // Navigate down
    enter: "Enter", // Select/open
    back: "Escape", // Go back
    nextSeries: "n", // Next in series
    prevSeries: "p", // Previous in series
  },
  panels: {
    search: "/", // Open search
    help: "?", // Toggle help
  },
};

// Save to localStorage
localStorage.setItem("vim-keybindings", JSON.stringify(vimConfig));
```

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
  - `VimSearchPanel.vue` - Search interface with keyboard navigation
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
- **Articles**: Available globally through `Layout.vue`
- **Series**: Automatic detection and navigation for series articles
- **Search**: Live search through all blog posts with keyboard navigation

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
