# MDMindMap - High-Level Context Documentation

## Overview

MDMindMap is a **dynamic markdown document viewer** that automatically discovers and renders markdown files from a `documents/` folder. It provides a clean web interface with dual-mode viewing (rendered HTML + raw markdown), interactive table of contents, **automatic mindmap generation from markdown lists**, **hover-based link popover previews**, and seamless navigation for browsing markdown content without requiring manual file list maintenance.

**Key Value**: Zero-configuration markdown viewing with automatic file discovery, modern responsive UI with interactive table of contents navigation, **intelligent mindmap visualization using Mermaid.js**, **link preview popovers with text extraction**, and build system that maintains static hosting compatibility through JSON metadata generation.

## Feature-Specific Documentation

For detailed technical context on specific features, refer to:
- [`context-mindmap.md`](context-mindmap.md) - Mindmap generation and visualization
- [`context-popover.md`](context-popover.md) - Link popover preview functionality
- [`context-toc.md`](context-toc.md) - Table of contents functionality 
- [`context-build.md`](context-build.md) - Build system and file management

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
  - `index.html` (129 lines): Main HTML structure with TOC, mindmap components, and full-screen modal
  - `assets/style.css` (603 lines): Base responsive styling with gradient design and popover styling
  - `assets/mindmap.css` (409 lines): Dedicated mindmap panel, button styling, zoom controls, and full-screen modal
  - `assets/script.js` (796 lines): Core application logic, markdown rendering, UI controls, TOC functionality, and popover previews
  - `assets/mindmap.js` (815 lines): Dedicated mindmap detection, generation, Mermaid.js integration, zoom controls, and color styling
- **Configuration**: JSON-based configuration system
  - `config.json` (5 lines): Application configuration for mindmap types and other settings
- **Markdown Rendering**: [markdown-it](https://github.com/markdown-it/markdown-it) v14.0.0 (CDN)
- **Mindmap Visualization**: [Mermaid.js](https://mermaid.js.org/) v10.6.1 (CDN) for dynamic mindmap generation with configurable layout types
- **Icons**: Font Awesome 6.4.0 (CDN) for UI icons
- **Build System**: Node.js scripts with file watching
  - `scripts/generateFileList.js` (70 lines): File discovery and metadata generation
  - `scripts/watch.js` (67 lines): Development file watcher with chokidar
- **Development Server**: Python HTTP server (port 8000)
- **File Watching**: chokidar v3.5.3 library
- **UI Features**: Responsive design, dual-mode viewing (HTML/raw markdown), gradient styling, interactive table of contents with smooth scrolling, **configurable mindmap generation with spider/tree layouts, zoom controls, full-screen mode, and branch coloring from markdown lists with 1x1.png placeholder images**, **hover-based link popover previews with text extraction using 1x2.png markers**

## Architecture

```
Client (Browser)          Build System              File System
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ index.html      │      │ generateFileList │      │ documents/      │
│ ├─ File dropdown│◄─────┤ ├─ Scans .md     │◄─────┤ ├─ doc.md       │
│ ├─ Markdown     │      │ ├─ Creates JSON  │      │ ├─ sample.md    │
│ ├─ TOC Panel    │      │ └─ watch.js      │      │ └─ img/         │
│ ├─ Mindmap Panel│      └──────────────────┘      │   └─ 1x1.png   │
│ └─ Renderer     │                                └─────────────────┘
└─────────────────┘      
        ▲ ▲              ┌──────────────────┐      ┌─────────────────┐
        │ │ Fetches      │ Mermaid.js       │      │ config.json     │
        │ └─config       │ ├─ Spider layout │◄─────┤ ├─ mindmap.type │
        ▼                │ ├─ Tree layout   │      │ └─ Configurable │
┌──────────────────┐     │ ├─ Detects lists │      │   settings      │
│ markdownFiles    │     │ ├─ Parses 1x1.png│      └─────────────────┘
│ .json (generated)│     │ └─ Renders SVG   │
└──────────────────┘     └──────────────────┘
```

## Core Components

### 1. File Discovery System
**Location**: `scripts/generateFileList.js`
```javascript
// Scans documents/ folder and generates metadata
const markdownFiles = files
    .filter(file => ext === '.md' || ext === '.markdown')
    .map(filename => ({
        filename: filename,
        name: path.basename(filename, path.extname(filename)),
        size: stats.size,
        modified: stats.mtime.toISOString()
    }));
```

### 2. Dynamic File Loading
**Location**: `assets/script.js` (lines 17-72)
```javascript
async function loadFileList() {
    const response = await fetch('markdownFiles.json');
    const fileData = await response.json();
    markdownFiles = fileData.files;
    // Populate dropdown with file options
    // Auto-select first file if available
}
```

### 3. Markdown Rendering & Dual-Mode Viewing
**Location**: `assets/script.js` (lines 1-9, 110-158, 194-229)
```javascript
const md = window.markdownit({
    html: true, linkify: true, typographer: true
});

async function loadMarkdownFile(filename) {
    const response = await fetch(`documents/${filename}`);
    const markdownText = await response.text();
    currentMarkdownText = markdownText; // Store for dual-mode
    renderCurrentView(); // Render based on current view mode
}

function toggleView() {
    isMarkdownView = !isMarkdownView;
    renderCurrentView(); // Switch between HTML and raw markdown
}
```

### 4. Configuration System
**Location**: `assets/script.js` (lines 37-51), `config.json`
```javascript
// Loads application configuration at startup
async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            appConfig = await response.json();
        } else {
            appConfig = { mindmap: { type: 'spider' } };
        }
    } catch (error) {
        appConfig = { mindmap: { type: 'spider' } };
    }
}

// Configuration structure in config.json
{
  "mindmap": {
    "type": "spider" // "spider", "tree", "tree-down", or "tree-right"
  }
}
```

### 5. Link Popover Previews
**Location**: `assets/script.js` (lines 235-457)
```javascript
function enhanceLinksWithPopovers() {
    const links = contentEl.querySelectorAll('a[href]');
    
    links.forEach(link => {
        const nextElement = link.nextElementSibling;
        if (nextElement && nextElement.tagName === 'IMG') {
            const imgSrc = nextElement.getAttribute('src');
            if (imgSrc && (imgSrc.includes('1x2.png') || imgSrc.endsWith('1x2'))) {
                const altText = nextElement.getAttribute('alt');
                if (altText && (altText.includes('...') || altText.includes('..'))) {
                    // Parse boundary words and setup popover
                    const separator = altText.includes('...') ? '...' : '..';
                    const [startWord, endWord] = altText.split(separator);
                    setupPopoverForLink(link, startWord.trim(), endWord.trim());
                }
            }
        }
    });
}
```

### 6. Key Feature Integration
- **Mindmap System**: Automatic detection and generation from markdown lists with 1x1.png images (*see `context-mindmap.md`*)
- **Link Popover Previews**: Hover-based content previews with text extraction using 1x2.png markers (*see `context-popover.md`*)
- **Table of Contents**: Interactive navigation with smooth scrolling (*see `context-toc.md`*)
- **Build System**: File watching and metadata generation (*see `context-build.md`*)

## File Structure

```
mdmindmap/
├── assets/
│   ├── script.js          # Core application logic, markdown rendering, UI controls, popover previews (796 lines)
│   ├── mindmap.js         # Dedicated mindmap detection, generation, and Mermaid.js integration (815 lines)
│   ├── style.css          # Base responsive styling with gradient design and popover styling (603 lines)
│   └── mindmap.css        # Dedicated mindmap panel, zoom controls, and full-screen modal (409 lines)
├── documents/             # Markdown content source
│   ├── doc.md            # Example document
│   ├── sample.md         # Sample content
│   ├── mindmap-test.md   # Mindmap demonstration document (53 lines)
│   ├── popover-test.md   # Popover preview demonstration document (28 lines)
│   ├── 1x2.png          # Placeholder image for popover link detection
│   └── img/              # Image assets for mindmaps
│       └── 1x1.png       # Placeholder image for mindmap node detection
├── scripts/
│   ├── generateFileList.js # Build script (70 lines)
│   └── watch.js          # File watcher (67 lines)
├── config.json           # Application configuration for mindmap types and settings (6 lines)
├── index.html            # Main HTML structure with TOC, mindmap components, and full-screen modal (129 lines)
├── markdownFiles.json    # Generated file list (auto-created)
├── package.json          # Build configuration (25 lines)
└── context.md            # This documentation file
```

## Code Flow

1. **Build Phase**: `npm run build` → `generateFileList.js` scans `documents/` → creates `markdownFiles.json`
2. **Load Phase**: Browser loads `index.html` + `assets/script.js` + `assets/mindmap.js` → `loadConfig()` fetches `config.json` → fetches `markdownFiles.json` → populates file dropdown
3. **View Phase**: User selects file → `loadMarkdownFile()` fetches from `documents/` → markdown-it renders → displays HTML → generates TOC → detects mindmap content → prerenders mindmap for instant access → enhances links with popover functionality
4. **Navigation**: User clicks TOC button → floating panel appears → clicking headings scrolls smoothly to sections
5. **Mindmap Generation**: If 1x1.png images detected in lists → mindmap button appears → user clicks → prerendered mindmap displays instantly with zoom controls and full-screen option → `generateMindmapFromLists()` checks config for layout type → Mermaid.js renders spider/tree SVG mindmap with branch color styling using golden-angle palette
6. **Popover Previews**: If 1x2.png images detected after links → enhanced link styling applied → user hovers → popover fetches target webpage → extracts text between boundary words → displays preview with caching
7. **Development**: `npm run watch` monitors `documents/` → auto-rebuilds on file changes

## Key Features

- **Zero Configuration**: Drop markdown files in `documents/` folder
- **Auto-Discovery**: Build system automatically finds all `.md` files
- **Dual-Mode Viewing**: Toggle between rendered HTML and raw markdown code
- **Interactive Table of Contents**: Floating TOC panel with smooth scroll navigation and hierarchical heading structure
- **Intelligent Mindmap Generation**: Automatically detects markdown lists with 1x1.png placeholder images and generates interactive Mermaid.js mindmaps with configurable layouts (spider/tree), zoom controls, full-screen mode, and instant prerendering
- **Link Popover Previews**: Hover-based content previews that fetch and extract text from external webpages using 1x2.png markers with boundary word patterns (A..B or A...B)
- **Dynamic UI Elements**: Contextual buttons (TOC always available, mindmap only when detected, enhanced link styling for popovers) with smooth animations
- **Static Hosting Compatible**: No server-side processing required
- **Modern Responsive UI**: Gradient design, mobile-friendly with view controls, responsive TOC and mindmap panels with zoom controls, full-screen modal, and dedicated CSS styling
- **Development Workflow**: File watching with auto-rebuild
- **Rich Markdown Support**: Full markdown-it feature set (tables, code blocks, links, typography)
- **File Metadata**: Shows file sizes and modification dates in dropdown
- **Accessibility Features**: Keyboard navigation (ESC to close panels), click outside to close, Font Awesome icons
- **Performance Optimization**: Mindmap prerendering for instant display, CSS-based branch coloring with golden-angle palette, zoom controls with smooth scaling

## Development Commands

```bash
npm run build    # Generate markdownFiles.json
npm run dev      # Build + start dev server (port 8000)
npm run watch    # Auto-rebuild on file changes
npm run serve    # Start server without building
```

## Quick Reference for AI Code Generation

### Key Files:
- `assets/script.js` (796 lines): Core application logic, markdown rendering, UI controls, TOC functionality, and popover previews
- `assets/mindmap.js` (815 lines): Dedicated mindmap detection, generation, Mermaid.js integration, zoom controls, and color styling
- `assets/style.css` (603 lines): Base responsive styling with gradient design and popover styling
- `assets/mindmap.css` (409 lines): Dedicated mindmap panel, button styling, zoom controls, and full-screen modal
- `index.html` (129 lines): HTML structure, layout, TOC components, mindmap components, and full-screen modal
- `config.json` (6 lines): Application configuration for mindmap types and other settings
- `scripts/generateFileList.js` (71 lines): Build system, file discovery
- `documents/`: Content folder (user-managed)
- `markdownFiles.json`: Generated file metadata (auto-created)

### Common Tasks:
- **Add new markdown file**: Drop in `documents/` → run `npm run build`
- **Create mindmap**: Add markdown list with `![Node Label](img/1x1.png)` images → mindmap auto-detects and prerenders
- **Create popover preview**: Add link followed by `![startWord..endWord](../1x2.png)` or `![startWord...endWord](../1x2.png)` → popover auto-detects and enhances link
- **Change mindmap layout**: Edit `config.json` - set `mindmap.type` to "spider", "tree", "tree-down", or "tree-right"
- **Modify base styling**: Edit `assets/style.css` for general UI changes and popover styling
- **Modify mindmap styling**: Edit `assets/mindmap.css` for mindmap-specific appearance, zoom controls, and full-screen modal
- **Extend mindmap functionality**: Edit `assets/mindmap.js` for detection, generation, rendering logic, zoom controls, or color styling
- **Extend popover functionality**: Edit `assets/script.js` popover functions for content fetching, text extraction, or UI behavior
- **Extend core functionality**: Edit `assets/script.js` for UI controls, file handling, or TOC features
- **Extend functionality**: Refer to feature-specific context files for detailed implementation guides

### Mindmap Creation Pattern:
```markdown
- ![Root Node](img/1x1.png)
  - ![Child Node 1](img/1x1.png)
    - ![Grandchild](img/1x1.png)
  - ![Child Node 2](img/1x1.png)
```

### Popover Preview Creation Pattern:
```markdown
[Link Text](https://example.com) ![startWord..endWord](../1x2.png)
[Link Text](https://example.com) ![startWord...endWord](../1x2.png)
```
