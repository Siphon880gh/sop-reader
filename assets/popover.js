// Popover functionality for link previews
// Provides hover-based content previews for external links with boundary word extraction

// Global popover cache for performance
let popoverCache = new Map();

// Main function to enhance links with popover functionality
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
                    // Parse the boundary words from alt text (A..B or A...B pattern)
                    const separator = altText.includes('...') ? '...' : '..';
                    const [startWord, endWord] = altText.split(separator).map(word => word.trim());
                    if (startWord && endWord) {
                        // Hide the 1x2 image since it's just a marker
                        nextElement.style.display = 'none';
                        
                        // Add visual indicator for links with popovers
                        link.setAttribute('data-has-popover', 'true');
                        
                        // Add popover functionality to the link
                        setupPopoverForLink(link, startWord, endWord);
                    }
                }
            }
        }
    });
}

function setupPopoverForLink(link, startWord, endWord) {
    let popover = null;
    let hoverTimeout = null;
    let hideTimeout = null;
    
    // Add hover event listeners
    link.addEventListener('mouseenter', (e) => {
        clearTimeout(hideTimeout);
        
        // Show popover after a short delay
        hoverTimeout = setTimeout(() => {
            showPopover(link, startWord, endWord, e);
        }, 300);
    });
    
    link.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        
        // Hide popover after a short delay
        hideTimeout = setTimeout(() => {
            hidePopover();
        }, 200);
    });
    
    // Keep popover visible when hovering over it
    const keepPopoverVisible = () => {
        if (popover) {
            popover.addEventListener('mouseenter', () => {
                clearTimeout(hideTimeout);
            });
            
            popover.addEventListener('mouseleave', () => {
                hideTimeout = setTimeout(() => {
                    hidePopover();
                }, 200);
            });
        }
    };
    
    function showPopover(linkElement, start, end, event) {
        // Remove any existing popover
        hidePopover();
        
        // Create popover element
        popover = document.createElement('div');
        popover.className = 'link-popover';
        popover.innerHTML = `
            <div class="popover-content">
                <div class="popover-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    Loading preview...
                </div>
            </div>
        `;
        
        // Position popover
        document.body.appendChild(popover);
        positionPopover(popover, linkElement);
        
        // Keep popover visible when hovering
        keepPopoverVisible();
        
        // Fetch and display content
        fetchPopoverContent(linkElement.href, start, end, popover);
    }
    
    function hidePopover() {
        if (popover && popover.parentNode) {
            popover.parentNode.removeChild(popover);
            popover = null;
        }
    }
}

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

async function fetchPopoverContent(url, startWord, endWord, popover) {
    // Check cache first
    const cacheKey = `${url}:${startWord}:${endWord}`;
    if (popoverCache.has(cacheKey)) {
        displayPopoverContent(popover, popoverCache.get(cacheKey));
        return;
    }
    
    try {
        // Use a CORS proxy for cross-origin requests
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const htmlContent = data.contents;
        
        // Extract text content between boundary words
        const extractedText = extractTextBetweenWords(htmlContent, startWord, endWord);
        
        // Cache the result
        popoverCache.set(cacheKey, extractedText);
        
        // Display the content
        displayPopoverContent(popover, extractedText);
        
    } catch (error) {
        console.error('Error fetching popover content:', error);
        const errorMessage = 'Failed to load preview. This may be due to CORS restrictions.';
        popoverCache.set(cacheKey, { error: errorMessage });
        displayPopoverContent(popover, { error: errorMessage });
    }
}

function extractTextBetweenWords(htmlContent, startWord, endWord) {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Get text content and search for boundary words
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Find start and end positions (case-insensitive)
    const startIndex = textContent.toLowerCase().indexOf(startWord.toLowerCase());
    const endIndex = textContent.toLowerCase().indexOf(endWord.toLowerCase());
    
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
        return {
            error: `Could not load preview because text matching no longer valid. Website changed content. Notify the author to update their excerpt selection. Code: Failed "${startWord}".."${endWord}"`
        };
    }
    
    // Extract text between the boundary words
    const extractedText = textContent.substring(startIndex, endIndex + endWord.length);
    
    // Clean up the text (remove excessive whitespace, limit length)
    const cleanedText = extractedText
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 500); // Limit to 500 characters
    
    return {
        text: cleanedText,
        startWord,
        endWord
    };
}

function displayPopoverContent(popover, content) {
    if (!popover || !popover.parentNode) return;
    
    const popoverContent = popover.querySelector('.popover-content');
    
    if (content.error) {
        popoverContent.innerHTML = `
            <div class="popover-error">
                <i class="fas fa-exclamation-triangle"></i>
                ${content.error}
            </div>
        `;
    } else {
        // Show the boundary words?
        // `<strong>${content.startWord}</strong> ... <strong>${content.endWord}</strong>`
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
