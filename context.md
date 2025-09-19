# MDMindMap - Context Documentation

## Overview

MDMindMap is a **dynamic markdown document viewer** that automatically discovers and renders markdown files from a `documents/` folder. It provides a clean web interface with dual-mode viewing (rendered HTML + raw markdown) for browsing and viewing markdown content without requiring manual file list maintenance.

**Key Value**: Zero-configuration markdown viewing with automatic file discovery, modern responsive UI, and build system that maintains static hosting compatibility through JSON metadata generation.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
  - `index.html` (49 lines): Main HTML structure
  - `assets/style.css` (315 lines): Responsive styling with gradient design
  - `assets/script.js` (189 lines): Markdown rendering and UI logic
- **Markdown Rendering**: [markdown-it](https://github.com/markdown-it/markdown-it) v14.0.0 (CDN)
- **Build System**: Node.js scripts with file watching
  - `generateFileList.js` (71 lines): File discovery and metadata generation
  - `watch.js` (68 lines): Development file watcher with chokidar
- **Development Server**: Python HTTP server (port 8000)
- **File Watching**: chokidar v3.5.3 library
- **UI Features**: Responsive design, dual-mode viewing (HTML/raw markdown), gradient styling

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
**Location**: `assets/script.js` (lines 16-71)
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
**Location**: `assets/script.js` (lines 1-9, 73-175)
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

### 4. Development Workflow
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
│   ├── script.js          # JavaScript logic (189 lines)
│   └── style.css          # Styling and responsive design (315 lines)
├── documents/             # Markdown content source
│   ├── doc.md            # Example document
│   └── sample.md         # Sample content
├── scripts/
│   ├── generateFileList.js # Build script (71 lines)
│   └── watch.js          # File watcher (68 lines)
├── index.html            # Main HTML structure (49 lines)
├── markdownFiles.json    # Generated file list (auto-created)
└── package.json          # Build configuration (26 lines)
```

## Code Flow

1. **Build Phase**: `npm run build` → `generateFileList.js` scans `documents/` → creates `markdownFiles.json`
2. **Load Phase**: Browser loads `index.html` + `assets/script.js` → fetches `markdownFiles.json` → populates file dropdown
3. **View Phase**: User selects file → `loadMarkdownFile()` fetches from `documents/` → markdown-it renders → displays HTML
4. **Development**: `npm run watch` monitors `documents/` → auto-rebuilds on file changes

## Key Features

- **Zero Configuration**: Drop markdown files in `documents/` folder
- **Auto-Discovery**: Build system automatically finds all `.md` files
- **Dual-Mode Viewing**: Toggle between rendered HTML and raw markdown code
- **Static Hosting Compatible**: No server-side processing required
- **Modern Responsive UI**: Gradient design, mobile-friendly with view controls
- **Development Workflow**: File watching with auto-rebuild
- **Rich Markdown Support**: Full markdown-it feature set (tables, code blocks, links, typography)
- **File Metadata**: Shows file sizes and modification dates in dropdown

## Development Commands

```bash
npm run build    # Generate markdownFiles.json
npm run dev      # Build + start dev server (port 8000)
npm run watch    # Auto-rebuild on file changes
npm run serve    # Start server without building
```

## Extension Points

- **Styling**: Modify CSS in `assets/style.css` (315 lines)
- **Markdown Config**: Adjust markdown-it options in `assets/script.js` (lines 1-9)
- **File Filtering**: Modify extensions in `generateFileList.js` (lines 25-28)
- **UI Logic**: Enhance JavaScript functionality in `assets/script.js` (189 lines)
- **View Modes**: Extend dual-mode functionality in `assets/script.js` (lines 131-175)
- **File Processing**: Enhance metadata generation in `generateFileList.js` (lines 32-42)

## Quick Reference for AI Code Generation

### Common Tasks:
- **Add new markdown file**: Drop in `documents/` → run `npm run build`
- **Modify UI styling**: Edit `assets/style.css` (315 lines)
- **Change markdown rendering**: Update markdown-it config in `assets/script.js` (lines 1-9)
- **Add file processing**: Modify `generateFileList.js` (lines 32-42)
- **Extend view modes**: Work with functions in `assets/script.js` (lines 131-175)
- **Update HTML structure**: Modify `index.html` (49 lines)

### Key Files:
- `assets/script.js` (189 lines): Main JavaScript logic, rendering, UI interactions
- `assets/style.css` (315 lines): All styling and responsive design
- `index.html` (49 lines): HTML structure and layout
- `scripts/generateFileList.js` (71 lines): Build system, file discovery
- `scripts/watch.js` (68 lines): Development file watcher
- `documents/`: Content folder (user-managed)
- `markdownFiles.json`: Generated file metadata (auto-created)
