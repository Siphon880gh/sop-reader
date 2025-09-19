# MDMindMap - Mindmap Feature Context

## Overview

The mindmap feature automatically detects markdown lists containing 1x1.png placeholder images and generates interactive Mermaid.js visualizations with configurable layouts.

## Core Components

### 1. Mindmap Detection
**Location**: `assets/script.js` (lines 37-46)
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
**Location**: `assets/script.js` (lines 48-80)
```javascript
function traverseList(ul) {
    let nodes = [];
    const directLiChildren = Array.from(ul.children).filter(child => child.tagName === 'LI');
    
    for (const li of directLiChildren) {
        let img = li.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
        let label = img ? img.alt.trim() : '';
        let childList = li.querySelector(':scope > ul');
        let children = childList ? traverseList(childList) : [];
        
        nodes.push({ label, children });
    }
    return nodes;
}
```

### 3. Mermaid Generation
**Location**: `assets/script.js` (lines 82-150)
```javascript
// Spider mindmap generation (default)
function generateSpiderMermaid(mindmapTree) {
    let mermaid = "mindmap\n  root)Mindmap(\n";
    for (const node of mindmapTree) {
        mermaid += treeToMermaid(node, 2);
    }
    return mermaid;
}

// Tree layout generation
function generateTreeMermaid(mindmapTree) {
    let mermaid = "flowchart TD\n";
    let nodeId = 0;
    // ... generates hierarchical tree structure
}
```

### 4. Configuration Integration
**Location**: `assets/script.js` (lines 147-160), `config.json`
```javascript
function generateMindmapFromLists() {
    const mindmapType = appConfig?.mindmap?.type || 'spider';
    
    if (mindmapType === 'tree') {
        return generateTreeMermaid(mindmapTree);
    } else {
        return generateSpiderMermaid(mindmapTree);
    }
}
```

## Configuration

The `config.json` controls the mindmap visualization style.

You can set the type of mindmap that gets rendered:
- "spider": "Radial mindmap with central root node (default)",
- "tree": "Hierarchical tree layout with top-down structure",
- "tree-down": "Hierarchical tree layout with top-down structure (same as tree)",
- "tree-right": "Hierarchical tree layout with left-to-right structure"

**File**: `config.json` (13 lines)
```json
{
  "mindmap": {
    "type": "spider",  // "spider", "tree", "tree-down", or "tree-right"
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

- **Mindmap Button**: `index.html` (lines 18-21) - Appears only when mindmap content detected
- **Mindmap Panel**: `index.html` (lines 36-47) - Floating panel for mindmap display
- **Panel Styling**: `assets/style.css` (lines 484-688) - Responsive mindmap panel styles

## Key Features

- **Automatic Detection**: Scans for 1x1.png images in markdown lists
- **Configurable Layouts**: Spider (radial) and Tree (hierarchical) layouts
- **Dynamic UI**: Mindmap button appears only when relevant content exists
- **Mermaid Integration**: Uses Mermaid.js v10.6.1 for SVG rendering
- **Responsive Design**: Mobile-friendly mindmap panel with touch support

## Extension Points

- **Layout Types**: Add new mindmap layouts in `generateMindmapFromLists()`
- **Detection Patterns**: Modify image detection in `detectMindmapContent()`
- **Mermaid Themes**: Customize Mermaid configuration (lines 19-34)
- **Panel Behavior**: Enhance mindmap panel functionality
- **Configuration**: Extend mindmap options in `config.json`
