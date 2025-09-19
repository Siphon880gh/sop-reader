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
let currentMindmapData = null;

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#333',
        primaryBorderColor: '#667eea',
        lineColor: '#666'
    }
});

// Mindmap detection and parsing functions
function detectMindmapContent() {
    const contentEl = document.getElementById('markdown-content');
    if (!contentEl || isMarkdownView) {
        return false;
    }
    
    // Look for images with src containing "1x1.png" or ending with "1x1.png"
    const mindmapImages = contentEl.querySelectorAll('img[src*="1x1.png"], img[src$="1x1.png"]');
    return mindmapImages.length > 0;
}

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

function treeToMermaid(node, indent = 1) {
    // Escape special characters in labels for Mermaid
    const escapedLabel = node.label.replace(/[()]/g, '');
    let s = '  '.repeat(indent) + escapedLabel + '\n';
    
    for (const child of node.children) {
        s += treeToMermaid(child, indent + 1);
    }
    
    return s;
}

function generateMindmapFromLists() {
    const contentEl = document.getElementById('markdown-content');
    if (!contentEl || isMarkdownView) {
        return null;
    }
    
    // Find all ul elements that contain mindmap images
    const allLists = contentEl.querySelectorAll('ul');
    let mindmapTree = [];
    
    for (const ul of allLists) {
        // Check if this ul or its descendants contain mindmap images
        const hasImages = ul.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0;
        
        if (hasImages) {
            // Check if this ul is not nested inside another ul with mindmap images
            const parentUl = ul.closest('ul:not(:scope)');
            const parentHasImages = parentUl ? parentUl.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0 : false;
            
            if (!parentHasImages) {
                // This is a root-level mindmap list
                const nodes = traverseList(ul);
                mindmapTree.push(...nodes);
            }
        }
    }
    
    if (mindmapTree.length === 0) {
        return null;
    }
    
    // Generate Mermaid mindmap syntax
    let mermaid = "mindmap\n  root)Mindmap(\n";
    
    for (const node of mindmapTree) {
        mermaid += treeToMermaid(node, 2);
    }
    
    return mermaid;
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
        currentMindmapData = null;
        updateMindmapButton();
        return;
    }
    
    if (isMarkdownView) {
        // Show raw markdown
        contentEl.className = 'raw-markdown';
        contentEl.textContent = currentMarkdownText;
        // Clear TOC and mindmap for raw markdown view
        currentTocData = [];
        currentMindmapData = null;
        updateTableOfContents();
        updateMindmapButton();
    } else {
        // Show rendered HTML
        contentEl.className = '';
        const html = md.render(currentMarkdownText);
        contentEl.innerHTML = html;
        
        // Generate table of contents after rendering
        generateTableOfContents();
        
        // Clear previous mindmap data and update button visibility
        currentMindmapData = null;
        updateMindmapButton();
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

// Mindmap panel management functions
function updateMindmapButton() {
    const mindmapButton = document.getElementById('mindmap-button');
    const hasMindmap = detectMindmapContent();
    
    if (hasMindmap && !isMarkdownView) {
        mindmapButton.style.display = 'flex';
    } else {
        mindmapButton.style.display = 'none';
        // Close mindmap panel if open
        closeMindmapPanel();
    }
}

function generateMindmap() {
    const mindmapData = generateMindmapFromLists();
    currentMindmapData = mindmapData;
    updateMindmapDisplay();
}

async function updateMindmapDisplay() {
    const mindmapContent = document.getElementById('mindmap-content');
    
    if (!currentMindmapData) {
        mindmapContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        return;
    }
    
    try {
        // Create a unique ID for this mindmap
        const mindmapId = 'mindmap-' + Date.now();
        
        // Create container for the mindmap
        mindmapContent.innerHTML = `<div id="${mindmapId}" class="mindmap-diagram"></div>`;
        
        // Render the mindmap using Mermaid
        const { svg } = await mermaid.render(mindmapId + '-svg', currentMindmapData);
        document.getElementById(mindmapId).innerHTML = svg;
        
    } catch (error) {
        console.error('Error rendering mindmap:', error);
        mindmapContent.innerHTML = `
            <div class="mindmap-empty">
                Error rendering mindmap: ${error.message}
                <br><br>
                <details>
                    <summary>Debug Info</summary>
                    <pre>${currentMindmapData}</pre>
                </details>
            </div>
        `;
    }
}

// Toggle mindmap panel visibility
function toggleMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    const isVisible = mindmapPanel.classList.contains('visible');
    
    if (!isVisible && !currentMindmapData) {
        // Generate mindmap if not already generated
        generateMindmap();
    }
    
    mindmapPanel.classList.toggle('visible');
}

// Close mindmap panel
function closeMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    mindmapPanel.classList.remove('visible');
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
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
    
    mindmapButton.addEventListener('click', toggleMindmapPanel);
    mindmapCloseButton.addEventListener('click', closeMindmapPanel);
    
    // Close panels when clicking outside
    document.addEventListener('click', function(e) {
        if (!tocPanel.contains(e.target) && !tocButton.contains(e.target)) {
            closeTocPanel();
        }
        if (!mindmapPanel.contains(e.target) && !mindmapButton.contains(e.target)) {
            closeMindmapPanel();
        }
    });
    
    // Close panels on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeTocPanel();
            closeMindmapPanel();
        }
    });
});
