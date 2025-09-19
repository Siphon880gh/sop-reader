// Initialize markdown-it with options
const md = window.markdownit({
    html: true,        // Enable HTML tags in source
    xhtmlOut: false,   // Use '/' to close single tags (<br />)
    breaks: false,     // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-',  // CSS language prefix for fenced blocks
    linkify: true,     // Autoconvert URL-like text to links
    typographer: true  // Enable some language-neutral replacement + quotes beautification
});

// Global variables
let markdownFiles = [];
let currentMarkdownText = '';
let isMarkdownView = false;
let currentTocData = [];
let appConfig = null;
let popoverCache = new Map(); // Cache for fetched content

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        // Only set background colors, let CSS handle text colors and styling
        cScale0: '#e6f0ff',  // Light blue background for all nodes
        cScale1: '#e6f0ff',
        cScale2: '#e6f0ff',
        cScale3: '#e6f0ff',
        cScale4: '#e6f0ff',
        cScale5: '#e6f0ff',
        cScale6: '#e6f0ff',
        cScale7: '#e6f0ff'
    }
});



async function loadConfig() {
    try {
        const response = await fetch('config.json');
        if (response.ok) {
            appConfig = await response.json();
            console.log('Config loaded:', appConfig);
        } else {
            console.log('No config.json found, using defaults');
            appConfig = { mindmap: { type: 'spider' } };
        }
    } catch (error) {
        console.log('Error loading config, using defaults:', error);
        appConfig = { mindmap: { type: 'spider' } };
    }
}

async function loadFileList() {
    const fileSelect = document.getElementById('file-select');
    
    try {
        // Fetch the generated file list
        const response = await fetch('markdownFiles.json');
        
        if (!response.ok) {
            throw new Error(`Failed to load file list: ${response.status}`);
        }
        
        const fileData = await response.json();
        markdownFiles = fileData.files;
        
        // Clear loading option
        fileSelect.innerHTML = '';
        
        if (markdownFiles.length === 0) {
            fileSelect.innerHTML = '<option value="">No markdown files found</option>';
            return;
        }
        
        // Add default option
        fileSelect.innerHTML = '<option value="">Select a file...</option>';
        
        // Add each markdown file as an option
        markdownFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.filename;
            option.textContent = `${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
            fileSelect.appendChild(option);
        });
        
        // Enable the select and select the first file by default
        fileSelect.disabled = false;
        if (markdownFiles.length > 0) {
            fileSelect.value = markdownFiles[0].filename;
            loadMarkdownFile(markdownFiles[0].filename);
        }
        
    } catch (error) {
        console.error('Error loading file list:', error);
        fileSelect.innerHTML = '<option value="">Error loading file list</option>';
        
        // Show error in the content area
        const errorEl = document.getElementById('error');
        const loadingEl = document.getElementById('loading');
        
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.innerHTML = `
            <strong>Error loading file list:</strong> ${error.message}<br>
            <small>Make sure to run 'npm run build' to generate the file list.</small>
        `;
    }
}

async function loadMarkdownFile(filename) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const contentEl = document.getElementById('markdown-content');

    if (!filename) {
        contentEl.innerHTML = '';
        loadingEl.style.display = 'block';
        loadingEl.textContent = 'Please select a markdown file to view.';
        errorEl.style.display = 'none';
        return;
    }

    loadingEl.style.display = 'block';
    loadingEl.textContent = `Loading ${filename}...`;
    errorEl.style.display = 'none';
    contentEl.innerHTML = '';

    try {
        // Fetch the markdown file from the documents folder
        const response = await fetch(`documents/${filename}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const markdownText = await response.text();
        
        // Store the raw markdown text
        currentMarkdownText = markdownText;
        
        // Reset to Rendered HTML when loading a new file
        isMarkdownView = false;
        updateToggleButton();
        
        // Display the content based on current view mode
        renderCurrentView();
        loadingEl.style.display = 'none';
        
    } catch (error) {
        console.error('Error loading markdown file:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.innerHTML = `
            <strong>Error loading document:</strong> ${error.message}<br>
            <small>Make sure ${filename} exists in the documents/ folder.</small>
        `;
    }
}

// Handle file selection changes
function handleFileSelection() {
    const fileSelect = document.getElementById('file-select');
    const selectedFile = fileSelect.value;
    loadMarkdownFile(selectedFile);
}

// Toggle between HTML and markdown views
function toggleView() {
    if (!currentMarkdownText) {
        return; // No content loaded
    }
    
    isMarkdownView = !isMarkdownView;
    updateToggleButton();
    renderCurrentView();
}

// Update the toggle button appearance and text
function updateToggleButton() {
    const toggleButton = document.getElementById('view-toggle');
    
    if (isMarkdownView) {
        toggleButton.textContent = '📝 Markdown Code';
        toggleButton.className = 'toggle-button markdown-mode';
        toggleButton.title = 'Currently showing raw markdown. Click to switch to Rendered HTML.';
    } else {
        toggleButton.textContent = '📄 Rendered HTML';
        toggleButton.className = 'toggle-button';
        toggleButton.title = 'Currently showing rendered HTML. Click to switch to raw markdown.';
    }
}

// Render content based on current view mode
function renderCurrentView() {
    const contentEl = document.getElementById('markdown-content');
    
    if (!currentMarkdownText) {
        contentEl.innerHTML = '';
        clearMindmapData();
        updateMindmapButton();
        return;
    }
    
    if (isMarkdownView) {
        // Show raw markdown
        contentEl.className = 'raw-markdown';
        contentEl.textContent = currentMarkdownText;
        // Generate TOC from markdown text
        generateTableOfContentsFromMarkdown();
        // Clear mindmap for raw markdown view
        clearMindmapData();
        updateMindmapButton();
    } else {
        // Show rendered HTML
        contentEl.className = '';
        const html = md.render(currentMarkdownText);
        contentEl.innerHTML = html;
        
        // Generate table of contents after rendering
        generateTableOfContents();
        
        // Clear previous mindmap data and prerendered content
        clearMindmapData();
        updateMindmapButton();
        
        // Prerender mindmap if detected for instant loading
        prerenderMindmapIfDetected();
        
        // Enhance links with popover functionality
        enhanceLinksWithPopovers();
    }
}

// Popover functionality for link previews
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

// Parse headings from rendered HTML to generate table of contents
function generateTableOfContents() {
    const contentEl = document.getElementById('markdown-content');
    const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    currentTocData = [];
    
    headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1)); // Extract number from h1, h2, etc.
        const text = heading.textContent.trim();
        const id = `heading-${index}`;
        
        // Add ID to heading for navigation
        heading.id = id;
        
        currentTocData.push({
            level,
            text,
            id,
            element: heading
        });
    });
    
    updateTableOfContents();
}

// Parse headings from raw markdown text to generate table of contents
function generateTableOfContentsFromMarkdown() {
    if (!currentMarkdownText) {
        currentTocData = [];
        updateTableOfContents();
        return;
    }
    
    currentTocData = [];
    const lines = currentMarkdownText.split('\n');
    
    lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        
        // Match markdown headings (# ## ### etc.)
        const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length; // Number of # characters
            const text = headingMatch[2].trim();
            
            // Skip headings that contain mindmap image syntax (ending with 1x1.png) or 1x1))
            if (text.includes('1x1.png)') || text.includes('1x1)')) {
                return; // Skip this heading
            }
            
            const id = `markdown-heading-${lineIndex}`;
            
            currentTocData.push({
                level,
                text,
                id,
                lineNumber: lineIndex + 1, // Store line number for scrolling
                element: null // No DOM element in markdown view
            });
        }
    });
    
    updateTableOfContents();
}

// Update the table of contents display
function updateTableOfContents() {
    const tocContent = document.getElementById('toc-content');
    
    if (currentTocData.length === 0) {
        tocContent.innerHTML = `
            <div class="toc-empty">
                <p>No table of contents available for this document.</p>
                <br/>
                <p>Questions to ask:</p>
                - Is it rendered HTML yet?<br/>
                - Does it have headings?
            </div>
        `;
        return;
    }
    
    const tocList = document.createElement('ul');
    tocList.className = 'toc-list';
    
    currentTocData.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'toc-item';
        
        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.className = `toc-link level-${item.level}`;
        link.textContent = item.text;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            scrollToHeading(item.id);
            // Close TOC panel on mobile after clicking
            if (window.innerWidth <= 768) {
                toggleTocPanel();
            }
        });
        
        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });
    
    tocContent.innerHTML = '';
    tocContent.appendChild(tocList);
}

// Scroll to a specific heading
function scrollToHeading(headingId) {
    if (isMarkdownView) {
        // In markdown view, scroll to line number
        const tocItem = currentTocData.find(item => item.id === headingId);
        if (tocItem && tocItem.lineNumber) {
            scrollToMarkdownLine(tocItem.lineNumber);
            updateActiveTocItem(headingId);
        }
    } else {
        // In HTML view, scroll to DOM element
        const heading = document.getElementById(headingId);
        if (heading) {
            heading.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update active state
            updateActiveTocItem(headingId);
        }
    }
}

// Scroll to a specific line in markdown view
function scrollToMarkdownLine(lineNumber) {
    const contentEl = document.getElementById('markdown-content');
    if (!contentEl || !isMarkdownView) return;
    
    // Calculate approximate position based on line number
    const lines = currentMarkdownText.split('\n');
    if (lineNumber > lines.length) return;
    
    // Get the text content and split by lines to calculate position
    const textUpToLine = lines.slice(0, lineNumber - 1).join('\n');
    const totalText = contentEl.textContent;
    
    // Calculate the percentage position
    const position = textUpToLine.length / totalText.length;
    
    // Scroll to that position
    const scrollTop = contentEl.scrollHeight * position;
    contentEl.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
    });
}

// Update active TOC item based on current scroll position
function updateActiveTocItem(activeId = null) {
    const tocLinks = document.querySelectorAll('.toc-link');
    
    tocLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    if (activeId) {
        const activeLink = document.querySelector(`a[href="#${activeId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}

// Toggle table of contents panel visibility
function toggleTocPanel() {
    const tocPanel = document.getElementById('toc-panel');
    tocPanel.classList.toggle('visible');
}

// Close table of contents panel
function closeTocPanel() {
    const tocPanel = document.getElementById('toc-panel');
    tocPanel.classList.remove('visible');
}


// Cycle through mindmap types
function cycleMindmapType() {
    if (!appConfig) {
        appConfig = { mindmap: { type: 'spider' } };
    }
    
    const currentType = appConfig.mindmap.type || 'spider';
    const types = ['spider', 'tree-down', 'tree-right'];
    const currentIndex = types.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % types.length;
    const nextType = types[nextIndex];
    
    // Update config
    appConfig.mindmap.type = nextType;
    
    // Update button tooltip to show current type
    updateCycleButtonTooltips(nextType);
    
    // Regenerate and update mindmap display
    if (currentMindmapData || detectMindmapContent()) {
        // Clear current mindmap data to force regeneration
        clearMindmapData();
        
        // Generate new mindmap with updated type
        generateMindmap();
        
        // Also update fullscreen if it's open
        const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
        if (fullScreenModal.classList.contains('visible')) {
            // Update fullscreen content
            const fullScreenContent = document.getElementById('mindmap-fullscreen-content');
            const currentMindmapContent = document.getElementById('mindmap-content');
            const mindmapDiagram = currentMindmapContent.querySelector('.mindmap-diagram');
            
            if (mindmapDiagram) {
                const clonedDiagram = mindmapDiagram.cloneNode(true);
                clonedDiagram.style.transform = ''; // Reset any zoom/transform
                fullScreenContent.innerHTML = '';
                fullScreenContent.appendChild(clonedDiagram);
            }
        }
    }
}

// Update cycle button tooltips to show current type
function updateCycleButtonTooltips(currentType) {
    const typeDisplayNames = {
        'spider': 'Spider',
        'tree-down': 'Tree Down',
        'tree-right': 'Tree Right'
    };
    
    const displayName = typeDisplayNames[currentType] || currentType;
    const tooltip = `Cycle Layout Type (Current: ${displayName})`;
    
    const cycleButton = document.getElementById('mindmap-cycle-type');
    
    if (cycleButton) {
        cycleButton.title = tooltip;
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    await loadConfig();
    
    // Initialize cycle button tooltips
    const currentType = appConfig?.mindmap?.type || 'spider';
    updateCycleButtonTooltips(currentType);
    
    loadFileList();
    
    // Add event listener for file selection
    const fileSelect = document.getElementById('file-select');
    fileSelect.addEventListener('change', handleFileSelection);
    
    // Add event listener for view toggle
    const toggleButton = document.getElementById('view-toggle');
    toggleButton.addEventListener('click', toggleView);
    
    // Add event listeners for table of contents
    const tocButton = document.getElementById('toc-button');
    const tocCloseButton = document.getElementById('toc-close');
    const tocPanel = document.getElementById('toc-panel');
    
    tocButton.addEventListener('click', toggleTocPanel);
    tocCloseButton.addEventListener('click', closeTocPanel);
    
    // Add event listeners for mindmap
    const mindmapButton = document.getElementById('mindmap-button');
    const mindmapCloseButton = document.getElementById('mindmap-close');
    const mindmapPanel = document.getElementById('mindmap-panel');
    
    // Mindmap panel controls
    const mindmapCycleType = document.getElementById('mindmap-cycle-type');
    const mindmapZoomIn = document.getElementById('mindmap-zoom-in');
    const mindmapZoomOut = document.getElementById('mindmap-zoom-out');
    const mindmapZoomReset = document.getElementById('mindmap-zoom-reset');
    const mindmapFullscreen = document.getElementById('mindmap-fullscreen');
    
    // Full screen modal controls
    const mindmapFullscreenModal = document.getElementById('mindmap-fullscreen-modal');
    const mindmapFullscreenClose = document.getElementById('mindmap-fullscreen-close');
    const mindmapFullscreenZoomIn = document.getElementById('mindmap-fullscreen-zoom-in');
    const mindmapFullscreenZoomOut = document.getElementById('mindmap-fullscreen-zoom-out');
    const mindmapFullscreenZoomReset = document.getElementById('mindmap-fullscreen-zoom-reset');
    
    mindmapButton.addEventListener('click', toggleMindmapPanel);
    mindmapCloseButton.addEventListener('click', closeMindmapPanel);
    
    // Mindmap panel controls
    mindmapCycleType.addEventListener('click', cycleMindmapType);
    mindmapZoomIn.addEventListener('click', () => zoomIn(mindmapPanel));
    mindmapZoomOut.addEventListener('click', () => zoomOut(mindmapPanel));
    mindmapZoomReset.addEventListener('click', () => resetZoom(mindmapPanel));
    mindmapFullscreen.addEventListener('click', openFullScreenMindmap);
    
    // Full screen modal controls
    mindmapFullscreenClose.addEventListener('click', closeFullScreenMindmap);
    mindmapFullscreenZoomIn.addEventListener('click', () => zoomIn(mindmapFullscreenModal));
    mindmapFullscreenZoomOut.addEventListener('click', () => zoomOut(mindmapFullscreenModal));
    mindmapFullscreenZoomReset.addEventListener('click', () => resetZoom(mindmapFullscreenModal));
    
    // Close panels when clicking outside
    document.addEventListener('click', function(e) {
        if (!tocPanel.contains(e.target) && !tocButton.contains(e.target)) {
            closeTocPanel();
        }
        if (!mindmapPanel.contains(e.target) && !mindmapButton.contains(e.target)) {
            closeMindmapPanel();
        }
        // Close full screen modal when clicking on the backdrop
        if (mindmapFullscreenModal.classList.contains('visible') && e.target === mindmapFullscreenModal) {
            closeFullScreenMindmap();
        }
    });
    
    // Close panels on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTocPanel();
            closeMindmapPanel();
            closeFullScreenMindmap();
        }
    });
});
