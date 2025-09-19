# MDMindMap - Context Documentation

## Overview

MDMindMap is a **dynamic markdown document viewer** that automatically discovers and renders markdown files from a `documents/` folder. It provides a clean web interface for browsing and viewing markdown content without requiring manual file list maintenance.

**Key Value**: Eliminates the need to hardcode file lists while maintaining static hosting compatibility through a build system that generates JSON metadata.

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
- **Markdown Rendering**: [markdown-it](https://github.com/markdown-it/markdown-it) (CDN)
- **Build System**: Node.js scripts with file watching
- **Development Server**: Python HTTP server
- **File Watching**: chokidar library

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
┌─────────────────┐
│ markdownFiles   │
│ .json (generated)│
└─────────────────┘
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
**Location**: `index.html` (lines 293-348)
```javascript
async function loadFileList() {
    const response = await fetch('markdownFiles.json');
    const fileData = await response.json();
    markdownFiles = fileData.files;
    // Populate dropdown with file options
}
```

### 3. Markdown Rendering
**Location**: `index.html` (lines 350-394)
```javascript
const md = window.markdownit({
    html: true, linkify: true, typographer: true
});

async function loadMarkdownFile(filename) {
    const response = await fetch(`documents/${filename}`);
    const markdownText = await response.text();
    const html = md.render(markdownText);
    contentEl.innerHTML = html;
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
├── documents/              # Markdown content source
│   ├── doc.md             # Example document
│   └── sample.md          # Sample content
├── scripts/
│   ├── generateFileList.js # Build script (71 lines)
│   └── watch.js           # File watcher (68 lines)
├── index.html             # Main application (414 lines)
├── markdownFiles.json     # Generated file list (auto-created)
└── package.json           # Build configuration
```

## Code Flow

1. **Build Phase**: `npm run build` → `generateFileList.js` scans `documents/` → creates `markdownFiles.json`
2. **Load Phase**: Browser loads `index.html` → fetches `markdownFiles.json` → populates file dropdown
3. **View Phase**: User selects file → `loadMarkdownFile()` fetches from `documents/` → markdown-it renders → displays HTML
4. **Development**: `npm run watch` monitors `documents/` → auto-rebuilds on file changes

## Key Features

- **Zero Configuration**: Drop markdown files in `documents/` folder
- **Auto-Discovery**: Build system automatically finds all `.md` files
- **Static Hosting Compatible**: No server-side processing required
- **Responsive UI**: Modern CSS with mobile-friendly design
- **Development Workflow**: File watching with auto-rebuild
- **Rich Markdown Support**: Full markdown-it feature set (tables, code blocks, links)

## Development Commands

```bash
npm run build    # Generate markdownFiles.json
npm run dev      # Build + start dev server (port 8000)
npm run watch    # Auto-rebuild on file changes
npm run serve    # Start server without building
```

## Extension Points

- **Styling**: Modify CSS in `index.html` (lines 8-250)
- **Markdown Config**: Adjust markdown-it options (lines 281-288)
- **File Filtering**: Modify extensions in `generateFileList.js` (lines 26-28)
- **UI Components**: Add features to file selector (lines 199-236)
