# MDMindMap - Table of Contents Feature Context

## Overview

The TOC (Table of Contents) feature provides interactive navigation through markdown documents with a floating panel, smooth scrolling, and hierarchical heading structure.

## Core Components

### 1. TOC Generation
**Location**: `assets/script.js` (lines 232-295)
```javascript
// Generate TOC from rendered HTML headings
function generateTableOfContents() {
    const contentEl = document.getElementById('markdown-content');
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

// Generate TOC from raw markdown text (for markdown view)
function generateTableOfContentsFromMarkdown() {
    if (!currentMarkdownText) {
        currentTocData = [];
        updateTableOfContents();
        return;
    }
    
    const lines = currentMarkdownText.split('\n');
    currentTocData = [];
    
    lines.forEach((line, index) => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
            const level = match[1].length;
            const text = match[2].trim();
            const id = `heading-${currentTocData.length}`;
            
            currentTocData.push({ level, text, id, lineNumber: index + 1 });
        }
    });
    
    updateTableOfContents();
}
```

### 2. TOC Rendering
**Location**: `assets/script.js` (lines 298-342)
```javascript
function updateTableOfContents() {
    const tocContent = document.getElementById('toc-content');
    
    if (currentTocData.length === 0) {
        tocContent.innerHTML = '<p class="toc-empty">No table of contents available for this document.</p>';
        return;
    }
    
    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    
    currentTocData.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = `toc-item toc-level-${item.level}`;
        
        const link = document.createElement('a');
        link.className = 'toc-link';
        link.href = `#${item.id}`;
        link.textContent = item.text;
        link.dataset.headingId = item.id;
        
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
**Location**: `assets/script.js` (lines 343-390)
```javascript
function scrollToHeading(headingId) {
    if (isMarkdownView) {
        // In markdown view, scroll to approximate line position
        const tocItem = currentTocData.find(item => item.id === headingId);
        if (tocItem && tocItem.lineNumber) {
            const markdownContent = document.getElementById('markdown-content');
            const lines = markdownContent.textContent.split('\n');
            const targetLine = Math.min(tocItem.lineNumber - 1, lines.length - 1);
            
            // Estimate scroll position based on line number
            const totalLines = lines.length;
            const scrollPercentage = targetLine / totalLines;
            const scrollPosition = scrollPercentage * (markdownContent.scrollHeight - markdownContent.clientHeight);
            
            markdownContent.scrollTo({
                top: scrollPosition,
                behavior: 'smooth'
            });
        }
    } else {
        // In HTML view, scroll to the actual heading element
        const heading = document.getElementById(headingId);
        if (heading) {
            heading.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
            
            // Update active TOC item
            updateActiveTocItem(headingId);
        }
    }
}

// Update active TOC item highlighting
function updateActiveTocItem(activeId = null) {
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach(link => {
        if (link.dataset.headingId === activeId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}
```

### 4. Panel Management
**Location**: `assets/script.js` (lines 407-416)
```javascript
// TOC panel toggle functionality
function toggleTocPanel() {
    const tocPanel = document.getElementById('toc-panel');
    tocPanel.classList.toggle('visible');
}

function closeTocPanel() {
    const tocPanel = document.getElementById('toc-panel');
    tocPanel.classList.remove('visible');
}
```

## UI Components

### TOC Button
**Location**: `index.html` (lines 14-17)
```html
<button id="toc-button" class="toc-button" title="Table of Contents">
    <i class="fas fa-book"></i>
</button>
```

### TOC Panel
**Location**: `index.html` (lines 24-35)
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
- `.toc-panel` - Sliding panel container with `.visible` state
- `.toc-list` - TOC navigation list
- `.toc-item` - Individual TOC entries
- `.toc-link` - TOC navigation links with `.active` state
- `.toc-level-1` through `.toc-level-6` - Hierarchical indentation

### Responsive Design:
- Mobile-friendly touch targets
- Smooth slide-in animations
- Click-outside-to-close functionality
- Keyboard navigation (ESC key support)

## Features

- **Always Available**: TOC button always visible (unlike mindmap button)
- **Dual-Mode Support**: Works in both HTML and raw markdown views
- **Hierarchical Display**: Proper indentation for heading levels (H1-H6)
- **Smooth Scrolling**: Native smooth scroll behavior with active item highlighting
- **Auto-Close**: Panel closes after navigation
- **Empty State**: Shows message when no headings found
- **Active Item Highlighting**: Current section highlighted in TOC
- **Accessibility**: Keyboard navigation and proper ARIA labels

## Integration Points

- **Document Loading**: TOC regenerated on every document load
- **View Mode**: TOC available in both HTML view (from DOM elements) and raw markdown view (from text parsing)
- **Heading Detection**: Automatically finds all H1-H6 elements or markdown heading patterns
- **ID Assignment**: Dynamically assigns IDs to headings for navigation
- **Active Tracking**: Updates active item highlighting during scroll navigation

## Extension Points

- **Heading Levels**: Modify which heading levels to include
- **Panel Behavior**: Customize slide animations and positioning
- **Navigation Logic**: Enhance scrolling behavior or add highlighting
- **Styling**: Customize TOC appearance and responsive breakpoints
- **Keyboard Shortcuts**: Add hotkeys for TOC navigation
