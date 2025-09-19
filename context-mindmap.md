# MDMindMap - Mindmap Feature Context

## Overview

The mindmap feature automatically detects markdown lists containing 1x1.png placeholder images and generates interactive Mermaid.js visualizations with configurable layouts, zoom controls, full-screen mode, and branch color styling using a golden-angle palette.

## Core Components

### 1. Mindmap Detection
**Location**: `assets/mindmap.js` (lines 11-20)
```javascript
function detectMindmapContent() {
    const contentEl = document.getElementById('markdown-content');
    if (!contentEl || isMarkdownView) {
        return false;
    }
    
    // Look for images with src containing "1x1.png" or ending with "1x1.png"
    const mindmapImages = contentEl.querySelectorAll('img[src*="1x1.png"], img[src$="1x1.png"]');
    return mindmapImages.length > 0;
}
```

### 2. List Parsing & Tree Building
**Location**: `assets/mindmap.js` (lines 22-46)
```javascript
function traverseList(ul) {
    let nodes = [];
    
    // Get direct children li elements only
    const directLiChildren = Array.from(ul.children).filter(child => child.tagName === 'LI');
    
    for (const li of directLiChildren) {
        // Find first 1x1 image and get its alt text
        let img = li.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
        let label = img ? img.alt.trim() : '';
        
        // Skip if no mindmap image found
        if (!label) {
            continue;
        }
        
        // Check for nested ul (direct child only)
        let childList = li.querySelector(':scope > ul');
        let children = childList ? traverseList(childList) : [];
        
        nodes.push({ label, children });
    }
    
    return nodes;
}
```

### 3. Mermaid Generation
**Location**: `assets/mindmap.js` (lines 196-359)
```javascript
// Tree layout generation (top-down)
function generateTreeMermaid(mindmapTree) {
    let mermaid = "flowchart TD\n";
    let nodeId = 0;
    // ... generates hierarchical tree structure with connections
}

// Tree layout generation (left-to-right)
function generateTreeRightMermaid(mindmapTree) {
    let mermaid = "flowchart LR\n";
    let nodeId = 0;
    // ... generates horizontal tree structure
}

// Main generation function with layout selection
function generateMindmapFromLists() {
    const mindmapType = appConfig?.mindmap?.type || 'spider';
    
    if (mindmapType === 'tree' || mindmapType === 'tree-down') {
        return generateTreeMermaid(mindmapTree);
    } else if (mindmapType === 'tree-right') {
        return generateTreeRightMermaid(mindmapTree);
    } else {
        return generateSpiderMermaid(mindmapTree);
    }
}
```

### 4. Zoom Controls
**Location**: `assets/mindmap.js` (lines 642-667)
```javascript
function zoomIn(container) {
    currentZoomLevel = Math.min(currentZoomLevel * 1.2, 3);
    applyZoom(container);
}

function zoomOut(container) {
    currentZoomLevel = Math.max(currentZoomLevel / 1.2, 0.3);
    applyZoom(container);
}

function resetZoom(container) {
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
    applyZoom(container);
}

function applyZoom(container) {
    const svg = container.querySelector('svg');
    if (svg) {
        svg.style.transform = `scale(${currentZoomLevel}) translate(${translateX}px, ${translateY}px)`;
    }
}
```

### 5. Full-Screen Mode
**Location**: `assets/mindmap.js` (lines 770-814)
```javascript
function openFullScreenMindmap() {
    const modal = document.getElementById('mindmap-fullscreen-modal');
    const fullscreenContent = document.getElementById('mindmap-fullscreen-content');
    const panelContent = document.getElementById('mindmap-content');
    
    // Clone mindmap content to fullscreen modal
    if (panelContent.innerHTML.trim() && !panelContent.innerHTML.includes('No mindmap available')) {
        fullscreenContent.innerHTML = panelContent.innerHTML;
        modal.style.display = 'flex';
        // Setup zoom controls for fullscreen
        setupFullScreenZoomControls();
    }
}

function closeFullScreenMindmap() {
    const modal = document.getElementById('mindmap-fullscreen-modal');
    modal.style.display = 'none';
}
```

### 6. Branch Color Styling
**Location**: `assets/mindmap.js` (lines 92-195)
```javascript
function colorMindmapBranches({
    container = null,
    colorFor = (n) => {
        // Golden-angle palette for good separation with improved contrast
        const hue = (n * 137.508) % 360;
        const lightness = 34 + ((n * 9) % 12); // Vary lightness slightly
        return `hsl(${hue} 72% ${lightness}%)`;
    }
} = {}) {
    // Apply colors to different branches using CSS injection
    // Each .section-N group gets a unique color
}
```

## Configuration

The `config.json` controls the mindmap visualization style.

You can set the type of mindmap that gets rendered:
- "spider": "Radial mindmap with central root node (default)",
- "tree": "Hierarchical tree layout with top-down structure",
- "tree-down": "Hierarchical tree layout with top-down structure (same as tree)",
- "tree-right": "Hierarchical tree layout with left-to-right structure"

**File**: `config.json` (5 lines)
```json
{
  "mindmap": {
    "type": "spider"
  }
}
```

## Mindmap Creation Pattern

```markdown
- ![Root Node](img/1x1.png)
  - ![Child Node 1](img/1x1.png)
    - ![Grandchild](img/1x1.png)
  - ![Child Node 2](img/1x1.png)
```

## UI Integration

- **Mindmap Button**: `index.html` (lines 19-22) - Appears only when mindmap content detected
- **Mindmap Panel**: `index.html` (lines 37-67) - Floating panel with zoom controls for mindmap display
- **Full-Screen Modal**: `index.html` (lines 69-92) - Full-screen mindmap viewing with dedicated controls
- **Panel Styling**: `assets/mindmap.css` (408 lines) - Dedicated mindmap panel styles, zoom controls, and full-screen modal

## Key Features

- **Automatic Detection**: Scans for 1x1.png images in markdown lists
- **Configurable Layouts**: Spider (radial), Tree (top-down), and Tree-Right (left-to-right) layouts
- **Zoom Controls**: Zoom in/out/reset with smooth scaling transitions
- **Full-Screen Mode**: Dedicated full-screen modal with independent zoom controls
- **Branch Color Styling**: Automatic branch coloring using golden-angle palette for visual separation
- **Dynamic UI**: Mindmap button appears only when relevant content exists
- **Mermaid Integration**: Uses Mermaid.js v10.6.1 for SVG rendering
- **Responsive Design**: Mobile-friendly mindmap panel with touch support and drag functionality

## Extension Points

- **Layout Types**: Add new mindmap layouts in `generateMindmapFromLists()`
- **Detection Patterns**: Modify image detection in `detectMindmapContent()`
- **Zoom Functionality**: Enhance zoom controls and limits in zoom functions
- **Color Schemes**: Modify branch coloring algorithm in `colorMindmapBranches()`
- **Full-Screen Features**: Add more full-screen controls and functionality
- **Mermaid Themes**: Customize Mermaid configuration
- **Panel Behavior**: Enhance mindmap panel functionality
- **Configuration**: Extend mindmap options in `config.json`

