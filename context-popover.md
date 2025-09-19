# MDMindMap - Link Popover Preview Feature Context

## Overview

The link popover preview feature provides hover-based content previews for external links in markdown documents. When users hover over enhanced links, the system fetches content from the target webpage and displays relevant text excerpts in a styled popover tooltip.

## Core Components

### 1. Popover Detection
**Location**: `assets/script.js` (lines 235-264)
```javascript
function enhanceLinksWithPopovers() {
    const contentEl = document.getElementById('markdown-content');
    const links = contentEl.querySelectorAll('a[href]');
    
    links.forEach(link => {
        // Check if this link is followed by an image with 1x2.png or 1x2 filename
        const nextElement = link.nextElementSibling;
        if (nextElement && nextElement.tagName === 'IMG') {
            const imgSrc = nextElement.getAttribute('src');
            if (imgSrc && (imgSrc.includes('1x2.png') || imgSrc.endsWith('1x2'))) {
                const altText = nextElement.getAttribute('alt');
                if (altText && (altText.includes('...') || altText.includes('..'))) {
                    // Parse boundary words and setup popover
                    const separator = altText.includes('...') ? '...' : '..';
                    const [startWord, endWord] = altText.split(separator).map(word => word.trim());
                    if (startWord && endWord) {
                        // Hide marker image and add popover functionality
                        nextElement.style.display = 'none';
                        link.setAttribute('data-has-popover', 'true');
                        setupPopoverForLink(link, startWord, endWord);
                    }
                }
            }
        }
    });
}
```

### 2. Hover Interaction Management
**Location**: `assets/script.js` (lines 266-338)
```javascript
function setupPopoverForLink(link, startWord, endWord) {
    let popover = null;
    let hoverTimeout = null;
    let hideTimeout = null;
    
    // Show popover after 300ms hover delay
    link.addEventListener('mouseenter', (e) => {
        clearTimeout(hideTimeout);
        hoverTimeout = setTimeout(() => {
            showPopover(link, startWord, endWord, e);
        }, 300);
    });
    
    // Hide popover after 200ms delay when leaving link
    link.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        hideTimeout = setTimeout(() => {
            hidePopover();
        }, 200);
    });
}
```

### 3. Content Fetching & Text Extraction
**Location**: `assets/script.js` (lines 362-430)
```javascript
async function fetchPopoverContent(url, startWord, endWord, popover) {
    // Check cache first
    const cacheKey = `${url}:${startWord}:${endWord}`;
    if (popoverCache.has(cacheKey)) {
        displayPopoverContent(popover, popoverCache.get(cacheKey));
        return;
    }
    
    try {
        // Use CORS proxy for cross-origin requests
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const htmlContent = data.contents;
        
        // Extract text between boundary words
        const extractedText = extractTextBetweenWords(htmlContent, startWord, endWord);
        
        // Cache and display result
        popoverCache.set(cacheKey, extractedText);
        displayPopoverContent(popover, extractedText);
    } catch (error) {
        // Handle CORS and other errors gracefully
        const errorMessage = 'Failed to load preview. This may be due to CORS restrictions.';
        popoverCache.set(cacheKey, { error: errorMessage });
        displayPopoverContent(popover, { error: errorMessage });
    }
}

function extractTextBetweenWords(htmlContent, startWord, endWord) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Find boundary words (case-insensitive)
    const startIndex = textContent.toLowerCase().indexOf(startWord.toLowerCase());
    const endIndex = textContent.toLowerCase().indexOf(endWord.toLowerCase());
    
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return {
            error: `Could not load preview because text matching no longer valid. Website changed content. Notify the author to update their excerpt selection. Code: Failed "${startWord}".."${endWord}"`
        };
    }
    
    // Extract and clean text (limit to 500 characters)
    const extractedText = textContent.substring(startIndex, endIndex + endWord.length);
    const cleanedText = extractedText.replace(/\s+/g, ' ').trim().substring(0, 500);
    
    return { text: cleanedText, startWord, endWord };
}
```

### 4. Popover UI & Positioning
**Location**: `assets/script.js` (lines 340-361, 432-457)
```javascript
function positionPopover(popover, linkElement) {
    const linkRect = linkElement.getBoundingClientRect();
    const popoverWidth = 300;
    const popoverHeight = 200;
    
    let left = linkRect.left + (linkRect.width / 2) - (popoverWidth / 2);
    let top = linkRect.bottom + 10;
    
    // Adjust if popover would go off screen
    if (left < 10) left = 10;
    if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
    }
    
    if (top + popoverHeight > window.innerHeight - 10) {
        top = linkRect.top - popoverHeight - 10;
    }
    
    popover.style.left = left + 'px';
    popover.style.top = top + 'px';
}

function displayPopoverContent(popover, content) {
    const popoverContent = popover.querySelector('.popover-content');
    
    if (content.error) {
        popoverContent.innerHTML = `
            <div class="popover-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${content.error}
            </div>
        `;
    } else {
        popoverContent.innerHTML = `
            <div class="popover-text">
                <div class="popover-boundary">
                    Preview excerpt
                </div>
                <div class="popover-excerpt">
                    ${content.text}
                </div>
            </div>
        `;
    }
}
```

## Styling

**Location**: `assets/style.css` (lines 468-598)

### Key Style Classes:
- `.link-popover` - Main popover container with fade-in animation
- `.popover-content` - Content wrapper with padding
- `.popover-loading` - Loading state with spinner
- `.popover-error` - Error state styling
- `.popover-boundary` - Header showing extraction pattern
- `.popover-excerpt` - Main content area with scrollbar
- `a[data-has-popover]` - Enhanced link styling with dotted underline

### Mobile Responsiveness:
- Smaller popover width (280px vs 300px)
- Reduced padding and font sizes
- Touch-friendly hover interactions

## Usage Patterns

### Basic Syntax:
```markdown
[Link Text](https://example.com) ![startWord..endWord](../1x2.png)
[Link Text](https://example.com) ![startWord...endWord](../1x2.png)
```

### Examples:
```markdown
[Example Website](https://example.com) ![title..content](../1x2.png)
[MDN Docs](https://developer.mozilla.org) ![Resources...Developers](../1x2.png)
[GitHub](https://github.com) ![GitHub..code](../1x2.png)
```

## Technical Features

### Detection Rules:
1. Link must be immediately followed by an `<img>` element
2. Image `src` must contain `1x2.png` or end with `1x2`
3. Image `alt` text must contain `..` or `...` separator
4. Boundary words must be non-empty after splitting

### CORS Handling:
- Uses `api.allorigins.win` as proxy service
- Graceful fallback for blocked requests
- Informative error messages for users

### Performance Optimizations:
- **Caching**: Results cached by URL + boundary word combination
- **Debounced Interactions**: 300ms show delay, 200ms hide delay
- **Smart Positioning**: Automatic viewport boundary detection
- **Content Limits**: Text excerpts limited to 500 characters

### Error Handling:
- Network failures and CORS restrictions
- Missing boundary words in target content
- Invalid or changed webpage structure
- User-friendly error messages with actionable guidance

## Integration Points

- **Markdown Rendering**: Triggered after HTML rendering in `renderCurrentView()`
- **Image Hiding**: Marker images automatically hidden via CSS and JavaScript
- **Link Enhancement**: Visual indicators added to enhanced links
- **Cache Management**: Global `popoverCache` Map for performance

## Extension Points

- **Proxy Services**: Replace `api.allorigins.win` with custom proxy
- **Text Extraction**: Enhance algorithm for better content detection
- **UI Customization**: Modify popover appearance and animations
- **Caching Strategy**: Implement persistent cache or cache expiration
- **Mobile Interactions**: Add touch-based popover triggers
- **Content Formatting**: Add rich text rendering for extracted content
