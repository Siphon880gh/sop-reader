# MDMindMap - Build System & File Management Context

## Overview

The build system provides automatic file discovery, metadata generation, and development workflow support for the markdown viewer application.

## Core Components

### 1. File Discovery System
**Location**: `scripts/generateFileList.js` (71 lines)
```javascript
// Scans documents/ folder and generates metadata
const markdownFiles = files
    .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.md' || ext === '.markdown';
    })
    .map(filename => {
        const stats = fs.statSync(filePath);
        return {
            filename: filename,
            name: path.basename(filename, path.extname(filename)),
            size: stats.size,
            modified: stats.mtime.toISOString()
        };
    });

// Generate JSON output
const output = {
    generated: new Date().toISOString(),
    count: markdownFiles.length,
    files: markdownFiles.sort((a, b) => a.name.localeCompare(b.name))
};
```

### 2. File Watching System
**Location**: `scripts/watch.js`
```javascript
const chokidar = require('chokidar');

// Watch documents/ folder for changes
chokidar.watch(documentsDir)
    .on('add', generateFileList)
    .on('unlink', generateFileList)
    .on('change', generateFileList);
```

### 3. Dynamic File Loading
**Location**: `assets/script.js` (lines 17-72)
```javascript
async function loadFileList() {
    try {
        const response = await fetch('markdownFiles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const fileData = await response.json();
        markdownFiles = fileData.files;
        populateFileSelect();
        
        // Auto-select first file if available
        if (markdownFiles.length > 0) {
            const firstFile = markdownFiles[0].filename;
            document.getElementById('file-select').value = firstFile;
            await loadMarkdownFile(firstFile);
        }
    } catch (error) {
        console.error('Error loading file list:', error);
        showError('Failed to load file list. Please check that markdownFiles.json exists.');
    }
}
```

## Build Configuration

### Package.json Scripts
**Location**: `package.json` (26 lines)
```json
{
  "scripts": {
    "build": "node scripts/generateFileList.js",
    "dev": "npm run build && python3 -m http.server 8000 --bind 127.0.0.1",
    "serve": "python3 -m http.server 8000 --bind 127.0.0.1",
    "watch": "node scripts/watch.js"
  },
  "devDependencies": {
    "chokidar": "^3.5.3"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

## Generated Output

### markdownFiles.json Structure
**Location**: `markdownFiles.json` (auto-generated, 24 lines)
```json
{
  "generated": "2025-09-19T05:23:03.016Z",
  "count": 3,
  "files": [
    {
      "filename": "doc.md",
      "name": "doc",
      "size": 8848,
      "modified": "2025-09-19T01:24:08.680Z"
    },
    {
      "filename": "mindmap-test.md",
      "name": "mindmap-test",
      "size": 2182,
      "modified": "2025-09-19T05:17:54.518Z"
    }
  ]
}
```

## File Management

### Document Structure
```
documents/
├── doc.md              # Example document (309 lines)
├── sample.md           # Sample content
├── mindmap-test.md     # Mindmap demonstration (54 lines)
└── img/                # Image assets
    └── 1x1.png         # Placeholder for mindmap detection
```

### File Metadata
- **Filename**: Original file name with extension
- **Name**: Display name without extension
- **Size**: File size in bytes
- **Modified**: ISO timestamp of last modification

## Development Workflow

### Build Phase
1. `npm run build` executes `generateFileList.js`
2. Script scans `documents/` directory recursively
3. Filters for `.md` and `.markdown` extensions
4. Generates metadata (size, modified date)
5. Creates `markdownFiles.json` with sorted file list

### Development Mode
1. `npm run watch` starts file watcher
2. Monitors `documents/` folder for changes
3. Auto-rebuilds on file add/remove/change
4. No browser refresh needed for new files

### Serving
- Uses Python HTTP server on port 8000
- Binds to localhost (127.0.0.1) for security
- Serves static files with proper MIME types

## Extension Points

### File Processing
- **File Types**: Modify extensions in `generateFileList.js` (lines 25-28)
- **Metadata**: Add custom file properties (tags, categories)
- **Sorting**: Change file ordering logic
- **Filtering**: Add file exclusion patterns

### Build System
- **Pre-processing**: Add markdown transformation steps
- **Optimization**: Implement file minification or bundling
- **Validation**: Add markdown linting or validation
- **Deployment**: Add build steps for different environments

### Development Tools
- **Live Reload**: Implement browser auto-refresh
- **Hot Module Replacement**: Add module hot-swapping
- **Error Handling**: Enhance build error reporting
- **Performance**: Add build time optimization

## Static Hosting Compatibility

The build system maintains compatibility with static hosting platforms:

- **No Server-Side Processing**: All file discovery happens at build time
- **JSON Metadata**: Pre-generated file list eliminates need for directory scanning
- **CDN Friendly**: All assets can be cached and served from CDN
- **GitHub Pages Compatible**: Works with Jekyll and other static site generators
