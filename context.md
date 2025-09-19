# MDMindMap - High-Level Context Documentation

## Overview

MDMindMap is a **dynamic markdown document viewer** that automatically discovers and renders markdown files from a `documents/` folder. It provides a clean web interface with dual-mode viewing (rendered HTML + raw markdown), interactive table of contents, **automatic mindmap generation from markdown lists**, and seamless navigation for browsing markdown content without requiring manual file list maintenance.

**Key Value**: Zero-configuration markdown viewing with automatic file discovery, modern responsive UI with interactive table of contents navigation, **intelligent mindmap visualization using Mermaid.js**, and build system that maintains static hosting compatibility through JSON metadata generation.

## Feature-Specific Documentation

For detailed technical context on specific features, refer to:
- [`context-mindmap.md`](context-mindmap.md) - Mindmap generation and visualization
- [`context-toc.md`](context-toc.md) - Table of contents functionality 
- [`context-build.md`](context-build.md) - Build system and file management

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
  - `index.html` (89 lines): Main HTML structure with TOC and mindmap components
  - `assets/style.css` (486 lines): Base responsive styling with gradient design
  - `assets/mindmap.css` (226 lines): Dedicated mindmap panel and button styling
  - `assets/script.js` (466 lines): Core application logic, markdown rendering, UI controls, TOC functionality
  - `assets/mindmap.js` (619 lines): Dedicated mindmap detection, generation, and Mermaid.js integration
- **Configuration**: JSON-based configuration system
  - `config.json` (6 lines): Application configuration for mindmap types and other settings
- **Markdown Rendering**: [markdown-it](https://github.com/markdown-it/markdown-it) v14.0.0 (CDN)
- **Mindmap Visualization**: [Mermaid.js](https://mermaid.js.org/) v10.6.1 (CDN) for dynamic mindmap generation with configurable layout types
- **Icons**: Font Awesome 6.4.0 (CDN) for UI icons
- **Build System**: Node.js scripts with file watching
  - `scripts/generateFileList.js` (71 lines): File discovery and metadata generation
  - `scripts/watch.js`: Development file watcher with chokidar
- **Development Server**: Python HTTP server (port 8000)
- **File Watching**: chokidar v3.5.3 library
- **UI Features**: Responsive design, dual-mode viewing (HTML/raw markdown), gradient styling, interactive table of contents with smooth scrolling, **configurable mindmap generation with spider/tree layouts from markdown lists with 1x1.png placeholder images**

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

### 5. Key Feature Integration
- **Mindmap System**: Automatic detection and generation from markdown lists with 1x1.png images (*see `context-mindmap.md`*)
- **Table of Contents**: Interactive navigation with smooth scrolling (*see `context-toc.md`*)
- **Build System**: File watching and metadata generation (*see `context-build.md`*)

## File Structure

```
mdmindmap/
├── assets/
│   ├── script.js          # Core application logic, markdown rendering, UI controls (466 lines)
│   ├── mindmap.js         # Dedicated mindmap detection, generation, and Mermaid.js integration (619 lines)
│   ├── style.css          # Base responsive styling with gradient design (486 lines)
│   └── mindmap.css        # Dedicated mindmap panel and button styling (226 lines)
├── documents/             # Markdown content source
│   ├── doc.md            # Example document
│   ├── sample.md         # Sample content
│   ├── mindmap-test.md   # Mindmap demonstration document (54 lines)
│   └── img/              # Image assets for mindmaps
│       └── 1x1.png       # Placeholder image for mindmap node detection
├── scripts/
│   ├── generateFileList.js # Build script (71 lines)
│   └── watch.js          # File watcher
├── config.json           # Application configuration for mindmap types and settings (6 lines)
├── index.html            # Main HTML structure with TOC and mindmap components (89 lines)
├── markdownFiles.json    # Generated file list (auto-created)
├── package.json          # Build configuration (26 lines)
└── context.md            # This documentation file
```

## Code Flow

1. **Build Phase**: `npm run build` → `generateFileList.js` scans `documents/` → creates `markdownFiles.json`
2. **Load Phase**: Browser loads `index.html` + `assets/script.js` + `assets/mindmap.js` → `loadConfig()` fetches `config.json` → fetches `markdownFiles.json` → populates file dropdown
3. **View Phase**: User selects file → `loadMarkdownFile()` fetches from `documents/` → markdown-it renders → displays HTML → generates TOC → detects mindmap content → prerenders mindmap for instant access
4. **Navigation**: User clicks TOC button → floating panel appears → clicking headings scrolls smoothly to sections
5. **Mindmap Generation**: If 1x1.png images detected in lists → mindmap button appears → user clicks → prerendered mindmap displays instantly or `generateMindmapFromLists()` checks config for layout type → Mermaid.js renders spider/tree SVG mindmap with color styling
6. **Development**: `npm run watch` monitors `documents/` → auto-rebuilds on file changes

## Key Features

- **Zero Configuration**: Drop markdown files in `documents/` folder
- **Auto-Discovery**: Build system automatically finds all `.md` files
- **Dual-Mode Viewing**: Toggle between rendered HTML and raw markdown code
- **Interactive Table of Contents**: Floating TOC panel with smooth scroll navigation and hierarchical heading structure
- **Intelligent Mindmap Generation**: Automatically detects markdown lists with 1x1.png placeholder images and generates interactive Mermaid.js mindmaps with configurable layouts (spider/tree) and instant prerendering
- **Dynamic UI Elements**: Contextual buttons (TOC always available, mindmap only when detected) with smooth animations
- **Static Hosting Compatible**: No server-side processing required
- **Modern Responsive UI**: Gradient design, mobile-friendly with view controls, responsive TOC and mindmap panels with dedicated CSS styling
- **Development Workflow**: File watching with auto-rebuild
- **Rich Markdown Support**: Full markdown-it feature set (tables, code blocks, links, typography)
- **File Metadata**: Shows file sizes and modification dates in dropdown
- **Accessibility Features**: Keyboard navigation (ESC to close panels), click outside to close, Font Awesome icons
- **Performance Optimization**: Mindmap prerendering for instant display, CSS-based branch coloring with golden-angle palette

## Development Commands

```bash
npm run build    # Generate markdownFiles.json
npm run dev      # Build + start dev server (port 8000)
npm run watch    # Auto-rebuild on file changes
npm run serve    # Start server without building
```

## Quick Reference for AI Code Generation

### Key Files:
- `assets/script.js` (466 lines): Core application logic, markdown rendering, UI controls, TOC functionality
- `assets/mindmap.js` (619 lines): Dedicated mindmap detection, generation, Mermaid.js integration, and color styling
- `assets/style.css` (486 lines): Base responsive styling with gradient design
- `assets/mindmap.css` (226 lines): Dedicated mindmap panel and button styling with animations
- `index.html` (89 lines): HTML structure, layout, TOC components, and mindmap components
- `config.json` (6 lines): Application configuration for mindmap types and other settings
- `scripts/generateFileList.js` (71 lines): Build system, file discovery
- `documents/`: Content folder (user-managed)
- `markdownFiles.json`: Generated file metadata (auto-created)

### Common Tasks:
- **Add new markdown file**: Drop in `documents/` → run `npm run build`
- **Create mindmap**: Add markdown list with `![Node Label](img/1x1.png)` images → mindmap auto-detects and prerenders
- **Change mindmap layout**: Edit `config.json` - set `mindmap.type` to "spider", "tree", "tree-down", or "tree-right"
- **Modify base styling**: Edit `assets/style.css` for general UI changes
- **Modify mindmap styling**: Edit `assets/mindmap.css` for mindmap-specific appearance
- **Extend mindmap functionality**: Edit `assets/mindmap.js` for detection, generation, or rendering logic
- **Extend core functionality**: Edit `assets/script.js` for UI controls, file handling, or TOC features
- **Extend functionality**: Refer to feature-specific context files for detailed implementation guides

### Mindmap Creation Pattern:
```markdown
- ![Root Node](img/1x1.png)
  - ![Child Node 1](img/1x1.png)
    - ![Grandchild](img/1x1.png)
  - ![Child Node 2](img/1x1.png)
```
