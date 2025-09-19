# MDMindMap - Table of Contents Feature Context

## Overview

The TOC (Table of Contents) feature provides interactive navigation through markdown documents with a floating panel, smooth scrolling, and hierarchical heading structure.

## Core Components

### 1. TOC Generation
**Location**: `assets/script.js` (lines 340-450)
```javascript
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
```

### 2. TOC Rendering
**Location**: `assets/script.js` (lines 400-430)
```javascript
function updateTableOfContents() {
    const tocContent = document.getElementById('toc-content');
    
    if (currentTocData.length === 0) {
        tocContent.innerHTML = '<p class="toc-empty">No table of contents available for this document.</p>';
        return;
    }
    
    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    
    currentTocData.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = `toc-item toc-level-${item.level}`;
        
        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.textContent = item.text;
        link.onclick = (e) => {
            e.preventDefault();
            scrollToHeading(item.id);
            closeTocPanel();
        };
        
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });
    
    tocContent.innerHTML = '';
    tocContent.appendChild(tocList);
}
```

### 3. Smooth Scrolling Navigation
**Location**: `assets/script.js` (lines 190-200)
```javascript
function scrollToHeading(headingId) {
    const heading = document.getElementById(headingId);
    if (heading) {
        heading.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
}
```

### 4. Panel Management
**Location**: `assets/script.js` (lines 450-500)
```javascript
// TOC panel show/hide functionality
function showTocPanel() {
    const tocPanel = document.getElementById('toc-panel');
    tocPanel.classList.add('show');
}

function closeTocPanel() {
    const tocPanel = document.getElementById('toc-panel');
    tocPanel.classList.remove('show');
}
```

## UI Components

### TOC Button
**Location**: `index.html` (lines 14-16)
```html
<button id="toc-button" class="toc-button" title="Table of Contents">
    <i class="fas fa-book"></i>
</button>
```

### TOC Panel
**Location**: `index.html` (lines 24-34)
```html
<div id="toc-panel" class="toc-panel">
    <div class="toc-header">
        <h3>Table of Contents</h3>
        <button id="toc-close" class="toc-close">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div id="toc-content" class="toc-content">
        <p class="toc-empty">No table of contents available for this document.</p>
    </div>
</div>
```

## Styling

**Location**: `assets/style.css` (lines 317-483)

### Key Style Classes:
- `.toc-button` - Floating action button
- `.toc-panel` - Sliding panel container
- `.toc-list` - TOC navigation list
- `.toc-item` - Individual TOC entries
- `.toc-level-1` through `.toc-level-6` - Hierarchical indentation

### Responsive Design:
- Mobile-friendly touch targets
- Smooth slide-in animations
- Click-outside-to-close functionality
- Keyboard navigation (ESC key support)

## Features

- **Always Available**: TOC button always visible (unlike mindmap button)
- **Hierarchical Display**: Proper indentation for heading levels (H1-H6)
- **Smooth Scrolling**: Native smooth scroll behavior
- **Auto-Close**: Panel closes after navigation
- **Empty State**: Shows message when no headings found
- **Accessibility**: Keyboard navigation and proper ARIA labels

## Integration Points

- **Document Loading**: TOC regenerated on every document load
- **View Mode**: TOC only available in HTML view (not raw markdown)
- **Heading Detection**: Automatically finds all H1-H6 elements
- **ID Assignment**: Dynamically assigns IDs to headings for navigation

## Extension Points

- **Heading Levels**: Modify which heading levels to include
- **Panel Behavior**: Customize slide animations and positioning
- **Navigation Logic**: Enhance scrolling behavior or add highlighting
- **Styling**: Customize TOC appearance and responsive breakpoints
- **Keyboard Shortcuts**: Add hotkeys for TOC navigation
