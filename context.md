# MDMindMap - Context Documentation

## Overview

MDMindMap is a **dynamic markdown document viewer** that automatically discovers and renders markdown files from a `documents/` folder. It provides a clean web interface with dual-mode viewing (rendered HTML + raw markdown), interactive table of contents, **automatic mindmap generation from markdown lists**, and seamless navigation for browsing markdown content without requiring manual file list maintenance.

**Key Value**: Zero-configuration markdown viewing with automatic file discovery, modern responsive UI with interactive table of contents navigation, **intelligent mindmap visualization using Mermaid.js**, and build system that maintains static hosting compatibility through JSON metadata generation.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
  - `index.html` (86 lines): Main HTML structure with TOC and mindmap components
  - `assets/style.css` (664 lines): Responsive styling with gradient design, TOC, and mindmap panel styling
  - `assets/script.js` (636 lines): Markdown rendering, UI logic, TOC functionality, mindmap generation, and configuration system
- **Configuration**: JSON-based configuration system
  - `config.json` (11 lines): Application configuration for mindmap types and other settings
- **Markdown Rendering**: [markdown-it](https://github.com/markdown-it/markdown-it) v14.0.0 (CDN)
- **Mindmap Visualization**: [Mermaid.js](https://mermaid.js.org/) v10.6.1 (CDN) for dynamic mindmap generation with configurable layout types
- **Icons**: Font Awesome 6.4.0 (CDN) for UI icons
- **Build System**: Node.js scripts with file watching
  - `generateFileList.js` (71 lines): File discovery and metadata generation
  - `watch.js` (scripts/watch.js): Development file watcher with chokidar
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
**Location**: `assets/script.js` (lines 1-9, 178-294)
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
**Location**: `assets/script.js` (lines 210-224, 592), `config.json`
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
    "type": "spider", // or "tree"
    "description": "Controls the mindmap visualization style"
  }
}
```

### 5. Mindmap Detection & Generation
**Location**: `assets/script.js` (lines 32-41, 81-119, 184-207)
```javascript
// Detects markdown lists containing 1x1.png images for mindmap generation
function detectMindmapContent() {
    const mindmapImages = contentEl.querySelectorAll('img[src*="1x1.png"], img[src$="1x1.png"]');
    return mindmapImages.length > 0;
}

// Recursively traverses nested lists to build mindmap tree structure
function traverseList(ul) {
    const directLiChildren = Array.from(ul.children).filter(child => child.tagName === 'LI');
    
    for (const li of directLiChildren) {
        let img = li.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
        let label = img ? img.alt.trim() : '';
        let childList = li.querySelector(':scope > ul');
        let children = childList ? traverseList(childList) : [];
        
        nodes.push({ label, children });
    }
}

// Generates different mindmap types based on configuration
function generateMindmapFromLists() {
    const mindmapType = appConfig?.mindmap?.type || 'spider';
    
    if (mindmapType === 'tree') {
        return generateTreeMermaid(mindmapTree); // Hierarchical flowchart
    } else {
        // Spider mindmap (default)
        let mermaid = "mindmap\n  root)Mindmap(\n";
        for (const node of mindmapTree) {
            mermaid += treeToMermaid(node, 2);
        }
        return mermaid;
    }
}

// Tree layout generation for hierarchical mindmaps
function generateTreeMermaid(mindmapTree) {
    let mermaid = "flowchart TD\n";
    let nodeId = 0;
    // ... generates top-down tree structure
}
```

### 6. Interactive Table of Contents
**Location**: `assets/script.js` (lines 340-450)
```javascript
// Generate TOC from rendered headings
function generateTableOfContents() {
    const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
    currentTocData = [];
    
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const text = heading.textContent.trim();
        const id = `heading-${index}`;
        heading.id = id; // Add ID for navigation
        
        currentTocData.push({ level, text, id, element: heading });
    });
    
    updateTableOfContents();
}

// Smooth scroll navigation
function scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
```

### 7. Development Workflow
**Location**: `scripts/watch.js`
```javascript
// Watches documents/ folder for changes
chokidar.watch(documentsDir)
    .on('add', generateFileList)
    .on('unlink', generateFileList)
    .on('change', generateFileList);
```

## File Structure

```
mdmindmap/
├── assets/
│   ├── script.js          # JavaScript logic with TOC, mindmap functionality, and config system (636 lines)
│   └── style.css          # Styling, responsive design, TOC, and mindmap panel styles (664 lines)
├── documents/             # Markdown content source
│   ├── doc.md            # Example document (309 lines)
│   ├── sample.md         # Sample content
│   ├── mindmap-test.md   # Mindmap demonstration document (54 lines)
│   └── img/              # Image assets for mindmaps
│       └── 1x1.png       # Placeholder image for mindmap node detection
├── scripts/
│   ├── generateFileList.js # Build script (71 lines)
│   └── watch.js          # File watcher
├── config.json           # Application configuration for mindmap types and settings (11 lines)
├── index.html            # Main HTML structure with TOC and mindmap components (86 lines)
├── markdownFiles.json    # Generated file list (auto-created)
├── package.json          # Build configuration (26 lines)
└── context.md            # This documentation file
```

## Code Flow

1. **Build Phase**: `npm run build` → `generateFileList.js` scans `documents/` → creates `markdownFiles.json`
2. **Load Phase**: Browser loads `index.html` + `assets/script.js` → `loadConfig()` fetches `config.json` → fetches `markdownFiles.json` → populates file dropdown
3. **View Phase**: User selects file → `loadMarkdownFile()` fetches from `documents/` → markdown-it renders → displays HTML → generates TOC → detects mindmap content
4. **Navigation**: User clicks TOC button → floating panel appears → clicking headings scrolls smoothly to sections
5. **Mindmap Generation**: If 1x1.png images detected in lists → mindmap button appears → user clicks → `generateMindmapFromLists()` checks config for layout type → Mermaid.js renders spider/tree SVG mindmap
6. **Development**: `npm run watch` monitors `documents/` → auto-rebuilds on file changes

## Key Features

- **Zero Configuration**: Drop markdown files in `documents/` folder
- **Auto-Discovery**: Build system automatically finds all `.md` files
- **Dual-Mode Viewing**: Toggle between rendered HTML and raw markdown code
- **Interactive Table of Contents**: Floating TOC panel with smooth scroll navigation and hierarchical heading structure
- **Intelligent Mindmap Generation**: Automatically detects markdown lists with 1x1.png placeholder images and generates interactive Mermaid.js mindmaps with configurable layouts (spider/tree)
- **Dynamic UI Elements**: Contextual buttons (TOC always available, mindmap only when detected)
- **Static Hosting Compatible**: No server-side processing required
- **Modern Responsive UI**: Gradient design, mobile-friendly with view controls, responsive TOC and mindmap panels
- **Development Workflow**: File watching with auto-rebuild
- **Rich Markdown Support**: Full markdown-it feature set (tables, code blocks, links, typography)
- **File Metadata**: Shows file sizes and modification dates in dropdown
- **Accessibility Features**: Keyboard navigation (ESC to close panels), click outside to close, Font Awesome icons

## Development Commands

```bash
npm run build    # Generate markdownFiles.json
npm run dev      # Build + start dev server (port 8000)
npm run watch    # Auto-rebuild on file changes
npm run serve    # Start server without building
```

## Extension Points

- **Configuration**: Modify application settings in `config.json` (11 lines) - mindmap types, themes, and other options
- **Styling**: Modify CSS in `assets/style.css` (664 lines) - includes TOC styles (lines 317-483) and mindmap panel styles (lines 484-664)
- **Markdown Config**: Adjust markdown-it options in `assets/script.js` (lines 1-9)
- **Mermaid Config**: Customize Mermaid.js themes and options in `assets/script.js` (lines 19-29)
- **File Filtering**: Modify extensions in `generateFileList.js` (lines 25-28)
- **UI Logic**: Enhance JavaScript functionality in `assets/script.js` (636 lines)
- **View Modes**: Extend dual-mode functionality in `assets/script.js` (lines 280-340)
- **Table of Contents**: Customize TOC generation and styling in `assets/script.js` (lines 340-450)
- **Mindmap Detection**: Modify mindmap detection patterns in `assets/script.js` (lines 32-41)
- **Mindmap Rendering**: Enhance Mermaid integration and rendering in `assets/script.js` (lines 81-207)
- **Configuration Loading**: Modify config loading logic in `assets/script.js` (lines 210-224)
- **File Processing**: Enhance metadata generation in `generateFileList.js` (lines 32-42)

## Quick Reference for AI Code Generation

### Common Tasks:
- **Add new markdown file**: Drop in `documents/` → run `npm run build`
- **Create mindmap**: Add markdown list with `![Node Label](img/1x1.png)` images → mindmap auto-detects
- **Change mindmap layout**: Edit `config.json` - set `mindmap.type` to "spider" or "tree"
- **Modify UI styling**: Edit `assets/style.css` (664 lines) - TOC styles at lines 317-483, mindmap styles at lines 484-664
- **Change markdown rendering**: Update markdown-it config in `assets/script.js` (lines 1-9)
- **Customize mindmap appearance**: Modify Mermaid config in `assets/script.js` (lines 19-29)
- **Add file processing**: Modify `generateFileList.js` (lines 32-42)
- **Extend view modes**: Work with functions in `assets/script.js` (lines 280-340)
- **Customize TOC**: Modify TOC generation/display in `assets/script.js` (lines 340-450)
- **Enhance mindmap detection**: Modify detection logic in `assets/script.js` (lines 32-41)
- **Add new configuration options**: Extend config loading in `assets/script.js` (lines 210-224) and `config.json`
- **Update HTML structure**: Modify `index.html` (86 lines) - TOC elements at lines 13-34, mindmap elements at lines 36-47

### Key Files:
- `assets/script.js` (636 lines): Main JavaScript logic, rendering, UI interactions, TOC functionality, mindmap generation, and configuration system
- `assets/style.css` (664 lines): All styling, responsive design, TOC styles, and mindmap panel styles
- `index.html` (86 lines): HTML structure, layout, TOC components, and mindmap components
- `config.json` (11 lines): Application configuration for mindmap types and other settings
- `scripts/generateFileList.js` (71 lines): Build system, file discovery
- `scripts/watch.js`: Development file watcher
- `documents/`: Content folder (user-managed)
- `documents/img/1x1.png`: Placeholder image for mindmap node detection
- `markdownFiles.json`: Generated file metadata (auto-created)

### Mindmap Creation Pattern:
```markdown
- ![Root Node](img/1x1.png)
  - ![Child Node 1](img/1x1.png)
    - ![Grandchild](img/1x1.png)
  - ![Child Node 2](img/1x1.png)
```
