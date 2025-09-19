# MDMindMap - Context Documentation

## Overview

MDMindMap is a **dynamic markdown document viewer** that automatically discovers and renders markdown files from a `documents/` folder. It provides a clean web interface with dual-mode viewing (rendered HTML + raw markdown), interactive table of contents, and seamless navigation for browsing markdown content without requiring manual file list maintenance.

**Key Value**: Zero-configuration markdown viewing with automatic file discovery, modern responsive UI with interactive table of contents navigation, and build system that maintains static hosting compatibility through JSON metadata generation.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
  - `index.html` (68 lines): Main HTML structure with TOC components
  - `assets/style.css` (483 lines): Responsive styling with gradient design and TOC styling
  - `assets/script.js` (331 lines): Markdown rendering, UI logic, and TOC functionality
- **Markdown Rendering**: [markdown-it](https://github.com/markdown-it/markdown-it) v14.0.0 (CDN)
- **Build System**: Node.js scripts with file watching
  - `generateFileList.js` (71 lines): File discovery and metadata generation
  - `watch.js` (68 lines): Development file watcher with chokidar
- **Development Server**: Python HTTP server (port 8000)
- **File Watching**: chokidar v3.5.3 library
- **UI Features**: Responsive design, dual-mode viewing (HTML/raw markdown), gradient styling, interactive table of contents with smooth scrolling

## Architecture

```
Client (Browser)          Build System              File System
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ index.html      │      │ generateFileList │      │ documents/      │
│ ├─ File dropdown│◄─────┤ ├─ Scans .md     │◄─────┤ ├─ doc.md       │
│ ├─ Markdown     │      │ ├─ Creates JSON  │      │ └─ sample.md    │
│ └─ Renderer     │      │ └─ watch.js      │      └─────────────────┘
└─────────────────┘      └──────────────────┘
        ▲
        │ Fetches markdown files
        ▼
┌──────────────────┐
│ markdownFiles    │
│ .json (generated)│
└──────────────────┘
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
**Location**: `assets/script.js` (lines 1-9, 74-182)
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

### 4. Interactive Table of Contents
**Location**: `assets/script.js` (lines 184-296)
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

### 5. Development Workflow
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
│   ├── script.js          # JavaScript logic with TOC functionality (331 lines)
│   └── style.css          # Styling and responsive design with TOC styles (483 lines)
├── documents/             # Markdown content source
│   ├── doc.md            # Example document (309 lines)
│   └── sample.md         # Sample content (30 lines)
├── scripts/
│   ├── generateFileList.js # Build script (71 lines)
│   └── watch.js          # File watcher (68 lines)
├── index.html            # Main HTML structure with TOC components (68 lines)
├── markdownFiles.json    # Generated file list (auto-created)
├── package.json          # Build configuration (25 lines)
└── context.md            # This documentation file (172 lines)
```

## Code Flow

1. **Build Phase**: `npm run build` → `generateFileList.js` scans `documents/` → creates `markdownFiles.json`
2. **Load Phase**: Browser loads `index.html` + `assets/script.js` → fetches `markdownFiles.json` → populates file dropdown
3. **View Phase**: User selects file → `loadMarkdownFile()` fetches from `documents/` → markdown-it renders → displays HTML → generates TOC
4. **Navigation**: User clicks TOC button → floating panel appears → clicking headings scrolls smoothly to sections
5. **Development**: `npm run watch` monitors `documents/` → auto-rebuilds on file changes

## Key Features

- **Zero Configuration**: Drop markdown files in `documents/` folder
- **Auto-Discovery**: Build system automatically finds all `.md` files
- **Dual-Mode Viewing**: Toggle between rendered HTML and raw markdown code
- **Interactive Table of Contents**: Floating TOC panel with smooth scroll navigation and hierarchical heading structure
- **Static Hosting Compatible**: No server-side processing required
- **Modern Responsive UI**: Gradient design, mobile-friendly with view controls and responsive TOC
- **Development Workflow**: File watching with auto-rebuild
- **Rich Markdown Support**: Full markdown-it feature set (tables, code blocks, links, typography)
- **File Metadata**: Shows file sizes and modification dates in dropdown
- **Accessibility Features**: Keyboard navigation (ESC to close TOC), click outside to close

## Development Commands

```bash
npm run build    # Generate markdownFiles.json
npm run dev      # Build + start dev server (port 8000)
npm run watch    # Auto-rebuild on file changes
npm run serve    # Start server without building
```

## Extension Points

- **Styling**: Modify CSS in `assets/style.css` (483 lines) - includes TOC styles (lines 317-483)
- **Markdown Config**: Adjust markdown-it options in `assets/script.js` (lines 1-9)
- **File Filtering**: Modify extensions in `generateFileList.js` (lines 25-28)
- **UI Logic**: Enhance JavaScript functionality in `assets/script.js` (331 lines)
- **View Modes**: Extend dual-mode functionality in `assets/script.js` (lines 132-182)
- **Table of Contents**: Customize TOC generation and styling in `assets/script.js` (lines 184-296)
- **File Processing**: Enhance metadata generation in `generateFileList.js` (lines 32-42)

## Quick Reference for AI Code Generation

### Common Tasks:
- **Add new markdown file**: Drop in `documents/` → run `npm run build`
- **Modify UI styling**: Edit `assets/style.css` (483 lines) - TOC styles at lines 317-483
- **Change markdown rendering**: Update markdown-it config in `assets/script.js` (lines 1-9)
- **Add file processing**: Modify `generateFileList.js` (lines 32-42)
- **Extend view modes**: Work with functions in `assets/script.js` (lines 132-182)
- **Customize TOC**: Modify TOC generation/display in `assets/script.js` (lines 184-296)
- **Update HTML structure**: Modify `index.html` (68 lines) - TOC elements at lines 12-28

### Key Files:
- `assets/script.js` (331 lines): Main JavaScript logic, rendering, UI interactions, TOC functionality
- `assets/style.css` (483 lines): All styling, responsive design, and TOC styles
- `index.html` (68 lines): HTML structure, layout, and TOC components
- `scripts/generateFileList.js` (71 lines): Build system, file discovery
- `scripts/watch.js` (68 lines): Development file watcher
- `documents/`: Content folder (user-managed)
- `markdownFiles.json`: Generated file metadata (auto-created)
