Have your own Markdown rendering app? If you’d like to add mind map functionality to your own app, below are self-contained prompts distilled from this codebase that you can apply directly.

## Mindmap

1. 
Add mindmap to your app - Prompt:
```
Add mindmap generation capability into our existing Markdown reader or renderer application. The implementation automatically detects specially formatted lists in Markdown content and generates interactive mindmaps using Mermaid.js with multiple layout options, zoom controls, and fullscreen viewing.

## Core Features to Implement

### 1. Automatic Mindmap Detection
- Scans rendered Markdown for lists containing placeholder images (`1x1.png`)
- Shows mindmap button only when relevant content is detected
- Supports nested list structures with unlimited depth

### 2. Multiple Layout Types
- **Spider/Radial**: Central root with radial branches (default)
- **Tree Top-Down**: Hierarchical tree flowing downward
- **Tree Left-Right**: Hierarchical tree flowing left to right
- Configurable via JSON configuration

### 3. Interactive Controls
- Zoom in/out with smooth scaling
- Pan/drag when zoomed
- Reset zoom to fit view
- Fullscreen modal for detailed viewing

## Required Dependencies

Add these CDN links to your HTML `<head>`:

"""
<!-- Mermaid.js for diagram rendering -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
<!-- Font Awesome for UI icons -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
"""

## Implementation Code

### 1. HTML Structure

Add these elements to your existing HTML:

"""
<!-- Mindmap Button (shows only when mindmap content detected) -->
<button id="mindmap-button" class="mindmap-button" title="Mindmap" style="display: none;">
    <i class="fas fa-project-diagram"></i>
</button>

<!-- Mindmap Panel -->
<div id="mindmap-panel" class="mindmap-panel">
    <div class="mindmap-header">
        <h3>Mindmap</h3>
        <div class="mindmap-controls">
            <button id="mindmap-zoom-out" class="mindmap-control-btn" title="Zoom Out">
                <i class="fas fa-search-minus"></i>
            </button>
            <button id="mindmap-zoom-reset" class="mindmap-control-btn" title="Reset Zoom">
                <i class="fas fa-compress"></i>
            </button>
            <button id="mindmap-zoom-in" class="mindmap-control-btn" title="Zoom In">
                <i class="fas fa-search-plus"></i>
            </button>
            <div class="mindmap-divider"></div>
            <button id="mindmap-fullscreen" class="mindmap-control-btn" title="Fullscreen">
                <i class="fas fa-expand"></i>
            </button>
        </div>
        <button id="mindmap-close" class="mindmap-close">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div id="mindmap-content" class="mindmap-content">
        <div class="mindmap-empty">No mindmap available for this document.</div>
    </div>
</div>

<!-- Fullscreen Modal -->
<div id="mindmap-fullscreen-modal" class="mindmap-fullscreen-modal">
    <div class="mindmap-fullscreen-header">
        <h3>Mindmap - Fullscreen</h3>
        <div class="mindmap-fullscreen-controls">
            <button id="mindmap-fullscreen-zoom-out" class="mindmap-control-btn" title="Zoom Out">
                <i class="fas fa-search-minus"></i>
            </button>
            <button id="mindmap-fullscreen-zoom-reset" class="mindmap-control-btn" title="Reset Zoom">
                <i class="fas fa-compress"></i>
            </button>
            <button id="mindmap-fullscreen-zoom-in" class="mindmap-control-btn" title="Zoom In">
                <i class="fas fa-search-plus"></i>
            </button>
        </div>
        <button id="mindmap-fullscreen-close" class="mindmap-fullscreen-close">
            <i class="fas fa-times"></i>
        </button>
    </div>
    <div id="mindmap-fullscreen-content" class="mindmap-fullscreen-content">
        <div class="mindmap-empty">No mindmap available for this document.</div>
    </div>
</div>
"""

### 2. CSS Styling

"""
/* Mindmap Button */
.mindmap-button {
    position: fixed;
    top: 20px;
    right: 80px;
    background: #48bb78;
    color: white;
    border: none;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-size: 1.2rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    transition: all 0.3s ease;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mindmap-button:hover {
    background: #38a169;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(72, 187, 120, 0.4);
}

/* Mindmap Panel */
.mindmap-panel {
    position: fixed;
    top: 80px;
    right: 20px;
    width: 80vw;
    max-width: 900px;
    max-height: 80vh;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    z-index: 999;
    transform: translateX(100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    border: 1px solid #e1e5e9;
}

.mindmap-panel.visible {
    transform: translateX(0);
    opacity: 1;
    visibility: visible;
}

.mindmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e1e5e9;
    background: #f8f9fa;
    border-radius: 12px 12px 0 0;
}

.mindmap-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
}

.mindmap-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.mindmap-control-btn {
    background: none;
    border: 1px solid #ddd;
    color: #666;
    font-size: 0.9rem;
    cursor: pointer;
    padding: 6px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
}

.mindmap-control-btn:hover {
    background: #e9ecef;
    color: #333;
    border-color: #bbb;
}

.mindmap-divider {
    width: 1px;
    height: 20px;
    background: #ddd;
    margin: 0 8px;
}

.mindmap-close {
    background: none;
    border: none;
    color: #666;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
}

.mindmap-close:hover {
    background: #e9ecef;
    color: #333;
}

.mindmap-content {
    padding: 1rem;
    max-height: calc(80vh - 80px);
    overflow: auto;
}

.mindmap-empty {
    color: #666;
    font-style: italic;
    text-align: center;
    margin: 2rem 0;
}

.mindmap-diagram {
    width: 100%;
    height: auto;
    min-height: 400px;
    transition: transform 0.3s ease;
    transform-origin: center center;
}

.mindmap-diagram.zoomed {
    cursor: grab;
}

.mindmap-diagram.zoomed:active {
    cursor: grabbing;
}

/* Hide mindmap placeholder images */
img[src*="1x1"], img[src$="1x1.png"] {
    display: none;
}

/* Mindmap text styling */
.mindmap-diagram svg text {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    text-anchor: middle !important;
    dominant-baseline: central !important;
}

/* Mindmap node backgrounds */
.mindmap-diagram svg .mindmap-node path,
.mindmap-diagram svg g[class*="section-"] path {
    fill: #e6f0ff !important;
    stroke: #667eea !important;
    stroke-width: 2px !important;
}

/* Fullscreen Modal */
.mindmap-fullscreen-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(255, 255, 255, 0.96)
    z-index: 9999;
    display: none;
    flex-direction: column;
}

.mindmap-fullscreen-modal.visible {
    display: flex;
}

.mindmap-fullscreen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.mindmap-fullscreen-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #333;
}

.mindmap-fullscreen-controls {
    display: flex;
    align-items: center;
    gap: 8px;
}

.mindmap-fullscreen-close {
    background: none;
    border: none;
    color: #666;
    font-size: 1.4rem;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
}

.mindmap-fullscreen-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #333;
}

.mindmap-fullscreen-content {
    flex: 1;
    padding: 2rem;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mindmap-fullscreen-content .mindmap-diagram {
    width: 100%;
    height: 100%;
    min-height: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
    .mindmap-button {
        top: 15px;
        right: 70px;
        width: 45px;
        height: 45px;
        font-size: 1.1rem;
    }

    .mindmap-panel {
        top: 70px;
        right: 15px;
        left: 15px;
        width: auto;
        max-width: none;
        max-height: 70vh;
    }

    .mindmap-controls {
        gap: 4px;
    }

    .mindmap-control-btn {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }

    .mindmap-fullscreen-header {
        padding: 0.8rem 1rem;
    }

    .mindmap-fullscreen-content {
        padding: 1rem;
    }
}
"""

### 3. JavaScript Implementation

"""
// Mindmap Configuration
let mindmapConfig = {
    type: 'spider' // 'spider', 'tree', 'tree-down', 'tree-right'
};

// Mindmap State Variables
let currentMindmapData = null;
let currentZoomLevel = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let translateX = 0;
let translateY = 0;

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#333',
        primaryBorderColor: '#667eea',
        lineColor: '#667eea',
        secondaryColor: '#f8f9fa',
        tertiaryColor: '#e6f0ff'
    }
});

// 1. Mindmap Detection
function detectMindmapContent() {
    // Replace 'your-markdown-container' with your actual markdown content container ID
    const contentEl = document.getElementById('your-markdown-container');
    if (!contentEl) {
        return false;
    }
    
    // Look for images with src containing "1x1.png" or ending with "1x1.png"
    const mindmapImages = contentEl.querySelectorAll('img[src*="1x1.png"], img[src$="1x1.png"]');
    return mindmapImages.length > 0;
}

// 2. List Parsing Functions
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

function getRootNodeText() {
    // Replace 'your-markdown-container' with your actual markdown content container ID
    const contentEl = document.getElementById('your-markdown-container');
    if (contentEl) {
        const h1 = contentEl.querySelector('h1');
        if (h1) {
            let h1Text = h1.textContent.trim();
            // Clean text for Mermaid compatibility
            h1Text = h1Text
                .replace(/[()[\]{}#]/g, '')
                .replace(/"/g, '')
                .replace(/'/g, '')
                .replace(/&/g, 'and')
                .replace(/\s+/g, ' ')
                .trim();
            
            if (h1Text && h1Text.length > 0) {
                if (h1Text.length > 30) {
                    h1Text = h1Text.substring(0, 27) + '...';
                }
                return h1Text;
            }
        }
    }
    return 'Mindmap';
}

// 3. Mermaid Generation Functions
function generateSpiderMermaid(mindmapTree) {
    const rootText = getRootNodeText();
    let mermaid = `mindmap\n  root)${rootText}(\n`;
    
    for (const node of mindmapTree) {
        mermaid += treeToMermaid(node, 2);
    }
    
    return mermaid;
}

function generateTreeMermaid(mindmapTree, direction = 'TD') {
    let mermaid = `flowchart ${direction}\n`;
    let nodeId = 0;
    let connections = [];
    let rootNodeId = null;
    
    function addNode(node, parentId = null) {
        const currentId = `N${nodeId++}`;
        let cleanLabel = node.label
            .replace(/[()[\]{}#]/g, '')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(/&/g, 'and')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (!cleanLabel || cleanLabel.length === 0) {
            cleanLabel = 'Node';
        }
        
        if (cleanLabel.length > 30) {
            cleanLabel = cleanLabel.substring(0, 27) + '...';
        }
        
        if (parentId === null && rootNodeId === null) {
            rootNodeId = currentId;
        }
        
        mermaid += `    ${currentId}[${cleanLabel}]\n`;
        
        if (parentId !== null) {
            connections.push(`    ${parentId} --> ${currentId}\n`);
        }
        
        for (const child of node.children) {
            addNode(child, currentId);
        }
        
        return currentId;
    }
    
    // Create a virtual root if multiple top-level nodes
    if (mindmapTree.length > 1) {
        const virtualRootId = `N${nodeId++}`;
        rootNodeId = virtualRootId;
        const rootText = getRootNodeText();
        mermaid += `    ${virtualRootId}[${rootText}]\n`;
        
        for (const node of mindmapTree) {
            addNode(node, virtualRootId);
        }
    } else if (mindmapTree.length === 1) {
        addNode(mindmapTree[0]);
    }
    
    // Add all connections
    for (const connection of connections) {
        mermaid += connection;
    }
    
    // Add styling
    mermaid += `\n    classDef default fill:#ffffff,stroke:#667eea,stroke-width:2px,color:#333333\n`;
    mermaid += `    classDef rootStyle fill:#667eea,stroke:#4c63d2,stroke-width:3px,color:#ffffff\n`;
    
    if (rootNodeId) {
        mermaid += `    class ${rootNodeId} rootStyle\n`;
    }
    
    return mermaid;
}

// 4. Main Mindmap Generation Function
function generateMindmapFromLists() {
    // Replace 'your-markdown-container' with your actual markdown content container ID
    const contentEl = document.getElementById('your-markdown-container');
    if (!contentEl) {
        return null;
    }
    
    let mindmapTree = [];
    
    // Parse content sequentially to maintain order and handle headings + lists
    const allElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6, ul');
    let currentHeadingNode = null;
    let headingLevel = 0;
    let headingStack = [];
    
    for (const element of allElements) {
        if (element.tagName.match(/^H[1-6]$/)) {
            const level = parseInt(element.tagName.charAt(1));
            const headingImg = element.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
            
            if (headingImg) {
                const headingText = headingImg.alt.trim();
                if (headingText) {
                    const headingNode = { label: headingText, children: [] };
                    
                    // Clear stack of headings at same or deeper level
                    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                        headingStack.pop();
                    }
                    
                    if (headingStack.length === 0) {
                        mindmapTree.push(headingNode);
                    } else {
                        headingStack[headingStack.length - 1].node.children.push(headingNode);
                    }
                    
                    headingStack.push({ level: level, node: headingNode });
                    currentHeadingNode = headingNode;
                    headingLevel = level;
                }
            } else {
                currentHeadingNode = null;
                headingLevel = 0;
            }
        } else if (element.tagName === 'UL') {
            const hasImages = element.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0;
            
            if (hasImages) {
                const parentUl = element.closest('ul:not(:scope)');
                const parentHasImages = parentUl ? parentUl.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0 : false;
                
                if (!parentHasImages) {
                    const listNodes = traverseList(element);
                    
                    if (currentHeadingNode && headingLevel > 0) {
                        currentHeadingNode.children.push(...listNodes);
                    } else {
                        mindmapTree.push(...listNodes);
                    }
                }
            }
        }
    }
    
    if (mindmapTree.length === 0) {
        return null;
    }
    
    // Generate based on configuration
    const mindmapType = mindmapConfig.type || 'spider';
    
    if (mindmapType === 'tree' || mindmapType === 'tree-down') {
        return generateTreeMermaid(mindmapTree, 'TD');
    } else if (mindmapType === 'tree-right') {
        return generateTreeMermaid(mindmapTree, 'LR');
    } else {
        return generateSpiderMermaid(mindmapTree);
    }
}

// 5. Color Styling Function
function colorMindmapBranches(container) {
    const root = container ? document.querySelector(container) : document.getElementById(container);
    if (!root) {
        console.warn('colorMindmapBranches: container not found:', container);
        return;
    }

    const svg = root.querySelector('svg[id$="-svg"]');
    if (!svg) {
        console.warn('colorMindmapBranches: mindmap SVG not found in container');
        return;
    }

    const sectionNums = new Set();
    svg.querySelectorAll('.mindmap-node').forEach(g => {
        for (const c of g.classList) {
            const m = c.match(/^section-(\d+)$/);
            if (m) sectionNums.add(Number(m[1]));
        }
    });

    const rules = [];
    sectionNums.forEach(n => {
        // Golden-angle palette for good color separation
        const hue = (n * 137.508) % 360;
        const lightness = 34 + ((n * 9) % 12);
        const color = `hsl(${hue} 72% ${lightness}%)`;
        
        rules.push(`#${CSS.escape(svg.id)} .section-${n} text { fill: ${color} !important; }`);
        rules.push(`#${CSS.escape(svg.id)} .section-${n} tspan { fill: ${color} !important; }`);
    });

    // Remove any existing branch colorizer styles
    const oldTag = svg.querySelector('style[data-branch-colorizer]');
    if (oldTag) oldTag.remove();

    // Inject new styles
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-branch-colorizer', 'true');
    styleTag.textContent = rules.join('\n');
    svg.appendChild(styleTag);

    console.log('Branch colors applied to sections:', Array.from(sectionNums).sort((a,b)=>a-b));
}

// 6. UI Management Functions
function updateMindmapButton() {
    const mindmapButton = document.getElementById('mindmap-button');
    const hasMindmap = detectMindmapContent();
    
    if (hasMindmap) {
        mindmapButton.style.display = 'flex';
    } else {
        mindmapButton.style.display = 'none';
        closeMindmapPanel();
    }
}

async function updateMindmapDisplay() {
    const mindmapContent = document.getElementById('mindmap-content');
    
    if (!currentMindmapData) {
        mindmapContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        return;
    }
    
    try {
        const mindmapId = 'mindmap-' + Date.now();
        mindmapContent.innerHTML = `<div id="${mindmapId}" class="mindmap-diagram"></div>`;
        
        console.log('Generated Mermaid syntax:', currentMindmapData);
        
        const { svg } = await mermaid.render(mindmapId + '-svg', currentMindmapData);
        document.getElementById(mindmapId).innerHTML = svg;
        
        // Apply color styling for spider mindmaps
        if (mindmapConfig.type === 'spider') {
            setTimeout(() => {
                colorMindmapBranches(`#${mindmapId}`);
            }, 100);
        }
        
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

function generateMindmap() {
    const mindmapData = generateMindmapFromLists();
    currentMindmapData = mindmapData;
    updateMindmapDisplay();
}

function toggleMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    const isVisible = mindmapPanel.classList.contains('visible');
    
    if (!isVisible && !currentMindmapData) {
        generateMindmap();
    } else if (!isVisible && currentMindmapData) {
        updateMindmapDisplay();
    }
    
    mindmapPanel.classList.toggle('visible');
}

function closeMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    mindmapPanel.classList.remove('visible');
}

// 7. Zoom and Pan Functions
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
    const mindmapDiagram = container ? container.querySelector('.mindmap-diagram') : 
                          document.querySelector('.mindmap-panel.visible .mindmap-diagram') ||
                          document.querySelector('.mindmap-fullscreen-modal.visible .mindmap-diagram');
    
    if (mindmapDiagram) {
        const transform = `translate(${translateX}px, ${translateY}px) scale(${currentZoomLevel})`;
        mindmapDiagram.style.transform = transform;
        
        if (currentZoomLevel > 1) {
            mindmapDiagram.classList.add('zoomed');
            enableDragging(mindmapDiagram);
        } else {
            mindmapDiagram.classList.remove('zoomed');
            disableDragging(mindmapDiagram);
        }
    }
}

// 8. Drag Functions
function enableDragging(element) {
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);
}

function disableDragging(element) {
    element.removeEventListener('mousedown', startDrag);
    element.removeEventListener('mousemove', drag);
    element.removeEventListener('mouseup', endDrag);
    element.removeEventListener('mouseleave', endDrag);
}

function startDrag(e) {
    if (currentZoomLevel > 1) {
        isDragging = true;
        dragStartX = e.clientX - translateX;
        dragStartY = e.clientY - translateY;
        e.preventDefault();
    }
}

function drag(e) {
    if (isDragging && currentZoomLevel > 1) {
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        applyZoom();
        e.preventDefault();
    }
}

function endDrag() {
    isDragging = false;
}

// 9. Fullscreen Functions
function openFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    const fullScreenContent = document.getElementById('mindmap-fullscreen-content');
    
    if (!currentMindmapData) {
        fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
    } else {
        const currentMindmapContent = document.getElementById('mindmap-content');
        const mindmapDiagram = currentMindmapContent.querySelector('.mindmap-diagram');
        
        if (mindmapDiagram) {
            const clonedDiagram = mindmapDiagram.cloneNode(true);
            clonedDiagram.style.transform = '';
            fullScreenContent.innerHTML = '';
            fullScreenContent.appendChild(clonedDiagram);
            
            currentZoomLevel = 1;
            translateX = 0;
            translateY = 0;
        } else {
            fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        }
    }
    
    fullScreenModal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    fullScreenModal.classList.remove('visible');
    document.body.style.overflow = '';
    
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
}

// 10. Event Listeners Setup
function setupMindmapEventListeners() {
    // Mindmap button
    document.getElementById('mindmap-button').addEventListener('click', toggleMindmapPanel);
    
    // Panel controls
    document.getElementById('mindmap-close').addEventListener('click', closeMindmapPanel);
    document.getElementById('mindmap-zoom-in').addEventListener('click', () => zoomIn());
    document.getElementById('mindmap-zoom-out').addEventListener('click', () => zoomOut());
    document.getElementById('mindmap-zoom-reset').addEventListener('click', () => resetZoom());
    document.getElementById('mindmap-fullscreen').addEventListener('click', openFullScreenMindmap);
    
    // Fullscreen controls
    document.getElementById('mindmap-fullscreen-close').addEventListener('click', closeFullScreenMindmap);
    document.getElementById('mindmap-fullscreen-zoom-in').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible');
        zoomIn(container);
    });
    document.getElementById('mindmap-fullscreen-zoom-out').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible');
        zoomOut(container);
    });
    document.getElementById('mindmap-fullscreen-zoom-reset').addEventListener('click', () => {
        const container = document.querySelector('.mindmap-fullscreen-modal.visible');
        resetZoom(container);
    });
    
    // Close panels when clicking outside
    document.addEventListener('click', (e) => {
        const mindmapPanel = document.getElementById('mindmap-panel');
        const mindmapButton = document.getElementById('mindmap-button');
        
        if (mindmapPanel.classList.contains('visible') && 
            !mindmapPanel.contains(e.target) && 
            !mindmapButton.contains(e.target)) {
            closeMindmapPanel();
        }
    });
    
    // ESC key to close panels
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
            if (fullScreenModal.classList.contains('visible')) {
                closeFullScreenMindmap();
            } else {
                closeMindmapPanel();
            }
        }
    });
}

// 11. Configuration Function
function setMindmapConfig(config) {
    mindmapConfig = { ...mindmapConfig, ...config };
    // Regenerate mindmap if currently displayed
    if (currentMindmapData) {
        generateMindmap();
    }
}

// 12. Public API Functions
function initializeMindmapFeature() {
    setupMindmapEventListeners();
    updateMindmapButton();
}

// Call this function after your markdown content is rendered
function onMarkdownContentUpdated() {
    updateMindmapButton();
    // Clear previous mindmap data
    currentMindmapData = null;
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
}
"""

## Integration Steps

### 1. **Add Dependencies**
Include Mermaid.js and Font Awesome CDN links in your HTML head.

### 2. **Add HTML Elements**
Copy the mindmap button, panel, and fullscreen modal HTML to your page.

### 3. **Add CSS Styles**
Include the provided CSS for mindmap styling and responsiveness.

### 4. **Add JavaScript**
Include the JavaScript code in your application.

### 5. **Update Container Reference**
Replace `'your-markdown-container'` with your actual markdown content container ID in the JavaScript code.

### 6. **Initialize**
Call `initializeMindmapFeature()` when your page loads.

### 7. **Update on Content Change**
Call `onMarkdownContentUpdated()` whenever you render new markdown content.

## Markdown Usage

Create mindmaps by using lists with placeholder images:

"""
# My Project ![Project](img/1x1.png)

- Frontend Development ![Frontend](img/1x1.png)
  - React Components ![Components](img/1x1.png)
  - State Management ![State](img/1x1.png)
  - Styling ![Styles](img/1x1.png)
- Backend Development ![Backend](img/1x1.png)
  - API Design ![API](img/1x1.png)
  - Database ![Database](img/1x1.png)
  - Authentication ![Auth](img/1x1.png)
"""

## Configuration Options

Change mindmap layout types:

"""
// Set spider/radial layout (default)
setMindmapConfig({ type: 'spider' });

// Set hierarchical tree (top-down)
setMindmapConfig({ type: 'tree' });

// Set hierarchical tree (left-right)
setMindmapConfig({ type: 'tree-right' });
"""

## Integration Notes

### Common Integration Issues and Solutions:

1. **Container ID Issue**: 
   - **Problem**: Mindmap not detecting content
   - **Solution**: Replace `'your-markdown-container'` with your actual container ID

2. **CSS Conflicts**:
   - **Problem**: Styling conflicts with existing styles
   - **Solution**: Increase CSS specificity or use `!important` for critical styles

3. **Z-index Issues**:
   - **Problem**: Mindmap panels appearing behind other elements
   - **Solution**: Adjust z-index values in CSS (mindmap panel: 999, fullscreen: 9999)

4. **Mermaid Initialization**:
   - **Problem**: Mermaid not rendering correctly
   - **Solution**: Ensure Mermaid is loaded before initialization and use `startOnLoad: false`

5. **Event Conflicts**:
   - **Problem**: Event listeners conflicting with existing functionality
   - **Solution**: Use event delegation or namespace your events

6. **Image Path Issues**:
   - **Problem**: 1x1.png images not being detected
   - **Solution**: Ensure image paths are correct and accessible

### Testing Your Integration:

1. Create a test markdown file with mindmap syntax
2. Verify the mindmap button appears when content is detected
3. Test all zoom and pan controls
4. Verify fullscreen functionality
5. Test responsive behavior on mobile devices
6. Confirm different layout types work correctly

### Performance Considerations:

- The mindmap detection runs on content updates - optimize for large documents
- Consider debouncing the detection function for frequently changing content
- Mermaid rendering can be CPU intensive for complex diagrams
- Use prerendering techniques for better user experience
```

2.
After generating into your app, add a button to cycle through the different mindmap types - Prompt:
```
At the mindmap top right panel and full screen modal, add cycle type button left of the zoom buttons. Separate with a vertical line with spacing on the left and right like done elsewhere.

The cycle type button should reender the mindmap in the different types:
- spider
- tree-down
- tree-right
```

3.
Add panning ability on mind map - Prompt:
```
Lets add ability to drag and pan around the mindmap whether it's at the top right panel or the full screen modal.
```