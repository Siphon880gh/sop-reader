// Mindmap-related variables
let currentMindmapData = null;
let currentZoomLevel = 1;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let translateX = 0;
let translateY = 0;

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

function getRootNodeText() {
    // Extract H1 heading from rendered markdown content, fallback to 'Mindmap'
    const contentEl = document.getElementById('markdown-content');
    if (contentEl && !isMarkdownView) {
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
            
            // Ensure we have some text and it's not too long
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

/**
 * Color each branch's text in a Mermaid mindmap SVG using CSS injection.
 * Branch = any .section-N group (N >= 0). Root (.section-root / .section--1) is ignored.
 */
function colorMindmapBranches({
    container = null,
    colorFor = (n) => {
        // Golden-angle palette for good separation with improved contrast
        const hue = (n * 137.508) % 360;
        const lightness = 34 + ((n * 9) % 12); // Vary lightness slightly
        return `hsl(${hue} 72% ${lightness}%)`;
    }
} = {}) {
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
        const color = colorFor(n);
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
    return { sections: Array.from(sectionNums).sort((a,b)=>a-b) };
}

/**
 * Apply basic styling to mindmap (placeholder for future enhancements)
 */
function applyMindmapTypography({
    container = null
} = {}) {
    const root = container ? document.querySelector(container) : document.getElementById(container);
    if (!root) {
        console.warn('applyMindmapTypography: container not found:', container);
        return;
    }

    const svg = root.querySelector('svg[id$="-svg"]');
    if (!svg) {
        console.warn('applyMindmapTypography: mindmap SVG not found in container');
        return;
    }

    console.log('Basic mindmap styling applied');
}

/**
 * Apply both color and typography styling to a mindmap
 */
function applyMindmapTextStyling(mindmapId) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
        const mindmapContainer = document.getElementById(mindmapId);
        if (!mindmapContainer) {
            console.log('No mindmap container found with ID:', mindmapId);
            return;
        }
        
        console.log('Applying CSS-based mindmap styling to:', mindmapId);
        
        // Apply colors using golden-angle palette
        colorMindmapBranches({
            container: `#${mindmapId}`,
            colorFor: (n) => {
                const hue = (n * 137.508) % 360;
                const lightness = 34 + ((n * 9) % 12);
                return `hsl(${hue} 72% ${lightness}%)`;
            }
        });
        
        // Apply stroke-based hierarchy styling
        applyMindmapTypography({
            container: `#${mindmapId}`
        });
        
        console.log('Mindmap styling complete for:', mindmapId);
    }, 100);
}

function generateTreeMermaid(mindmapTree) {
    // Generate Mermaid tree syntax (flowchart TD)
    let mermaid = "flowchart TD\n";
    let nodeId = 0;
    const nodeMap = new Map();
    let connections = [];
    let rootNodeId = null;
    
    function addNode(node, parentId = null) {
        const currentId = `N${nodeId++}`;
        // Clean label for Mermaid compatibility
        let cleanLabel = node.label
            .replace(/[()[\]{}#]/g, '')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(/&/g, 'and')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Ensure we have some text
        if (!cleanLabel || cleanLabel.length === 0) {
            cleanLabel = 'Node';
        }
        
        // Truncate very long labels
        if (cleanLabel.length > 30) {
            cleanLabel = cleanLabel.substring(0, 27) + '...';
        }
        
        nodeMap.set(currentId, cleanLabel);
        
        // Store root node ID for styling
        if (parentId === null && rootNodeId === null) {
            rootNodeId = currentId;
        }
        
        // Add node definition - use simple rectangle format
        mermaid += `    ${currentId}[${cleanLabel}]\n`;
        
        // Store connection for later
        if (parentId !== null) {
            connections.push(`    ${parentId} --> ${currentId}\n`);
        }
        
        // Process children
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
    
    // Add styling with explicit node targeting
    mermaid += `\n    classDef default fill:#ffffff,stroke:#667eea,stroke-width:2px,color:#333333\n`;
    mermaid += `    classDef rootStyle fill:#667eea,stroke:#4c63d2,stroke-width:3px,color:#ffffff\n`;
    
    if (rootNodeId) {
        mermaid += `    class ${rootNodeId} rootStyle\n`;
    }
    
    return mermaid;
}

function generateTreeRightMermaid(mindmapTree) {
    // Generate Mermaid tree syntax with left-to-right flow (flowchart LR)
    let mermaid = "flowchart LR\n";
    let nodeId = 0;
    const nodeMap = new Map();
    let connections = [];
    let rootNodeId = null;
    
    function addNode(node, parentId = null) {
        const currentId = `N${nodeId++}`;
        // Clean label for Mermaid compatibility
        let cleanLabel = node.label
            .replace(/[()[\]{}#]/g, '')
            .replace(/"/g, '')
            .replace(/'/g, '')
            .replace(/&/g, 'and')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Ensure we have some text
        if (!cleanLabel || cleanLabel.length === 0) {
            cleanLabel = 'Node';
        }
        
        // Truncate very long labels
        if (cleanLabel.length > 30) {
            cleanLabel = cleanLabel.substring(0, 27) + '...';
        }
        
        nodeMap.set(currentId, cleanLabel);
        
        // Store root node ID for styling
        if (parentId === null && rootNodeId === null) {
            rootNodeId = currentId;
        }
        
        // Add node definition - use simple rectangle format
        mermaid += `    ${currentId}[${cleanLabel}]\n`;
        
        // Store connection for later
        if (parentId !== null) {
            connections.push(`    ${parentId} --> ${currentId}\n`);
        }
        
        // Process children
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
    
    // Add styling with explicit node targeting
    mermaid += `\n    classDef default fill:#ffffff,stroke:#667eea,stroke-width:2px,color:#333333\n`;
    mermaid += `    classDef rootStyle fill:#667eea,stroke:#4c63d2,stroke-width:3px,color:#ffffff\n`;
    
    if (rootNodeId) {
        mermaid += `    class ${rootNodeId} rootStyle\n`;
    }
    
    return mermaid;
}

function generateMindmapFromLists() {
    const contentEl = document.getElementById('markdown-content');
    if (!contentEl || isMarkdownView) {
        return null;
    }
    
    let mindmapTree = [];
    
    // Parse content sequentially to maintain order and handle headings + lists
    const allElements = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6, ul');
    let currentHeadingNode = null;
    let headingLevel = 0;
    let headingStack = []; // Stack to track heading hierarchy
    
    for (const element of allElements) {
        if (element.tagName.match(/^H[1-6]$/)) {
            // This is a heading element
            const level = parseInt(element.tagName.charAt(1));
            const headingImg = element.querySelector('img[src*="1x1"], img[src$="1x1.png"]');
            
            if (headingImg) {
                // This heading has a mindmap image
                const headingText = headingImg.alt.trim();
                if (headingText) {
                    const headingNode = { label: headingText, children: [] };
                    
                    // Clear stack of headings at same or deeper level
                    while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
                        headingStack.pop();
                    }
                    
                    if (headingStack.length === 0) {
                        // This is a root-level heading
                        mindmapTree.push(headingNode);
                    } else {
                        // This is a sub-heading, add it to the parent heading
                        headingStack[headingStack.length - 1].node.children.push(headingNode);
                    }
                    
                    // Add this heading to the stack
                    headingStack.push({ level: level, node: headingNode });
                    currentHeadingNode = headingNode;
                    headingLevel = level;
                }
            } else {
                // Heading without mindmap image, reset current context
                currentHeadingNode = null;
                headingLevel = 0;
            }
        } else if (element.tagName === 'UL') {
            // This is a list element
            const hasImages = element.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0;
            
            if (hasImages) {
                // Check if this ul is not nested inside another ul with mindmap images
                const parentUl = element.closest('ul:not(:scope)');
                const parentHasImages = parentUl ? parentUl.querySelectorAll('img[src*="1x1"], img[src$="1x1.png"]').length > 0 : false;
                
                if (!parentHasImages) {
                    // This is a root-level mindmap list
                    const listNodes = traverseList(element);
                    
                    if (currentHeadingNode && headingLevel > 0) {
                        // Add list nodes to the current heading
                        currentHeadingNode.children.push(...listNodes);
                    } else {
                        // Add as root-level nodes
                        mindmapTree.push(...listNodes);
                    }
                }
            }
        }
    }
    
    if (mindmapTree.length === 0) {
        return null;
    }
    
    // Check config for mindmap type, default to spider if not loaded
    const mindmapType = appConfig?.mindmap?.type || 'spider';
    
    if (mindmapType === 'tree' || mindmapType === 'tree-down') {
        return generateTreeMermaid(mindmapTree);
    } else if (mindmapType === 'tree-right') {
        return generateTreeRightMermaid(mindmapTree);
    } else {
        // Generate Mermaid spider mindmap syntax (default)
        const rootText = getRootNodeText();
        let mermaid = `mindmap\n  root)${rootText}(\n`;
        
        for (const node of mindmapTree) {
            mermaid += treeToMermaid(node, 2);
        }
        
        return mermaid;
    }
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

// Prerender mindmap if detected to make loading instant
function prerenderMindmapIfDetected() {
    // Only prerender if we have HTML content and mindmap is detected
    if (!isMarkdownView && detectMindmapContent()) {
        console.log('Mindmap detected - prerendering for instant loading...');
        
        // Add subtle loading indicator to mindmap button
        const mindmapButton = document.getElementById('mindmap-button');
        if (mindmapButton) {
            mindmapButton.classList.add('prerendering');
            mindmapButton.title = 'Mindmap (prerendering for instant access...)';
        }
        
        const mindmapData = generateMindmapFromLists();
        if (mindmapData) {
            currentMindmapData = mindmapData;
            console.log('Mindmap prerendered successfully');
            
            // Optional: Pre-render the visual display as well for even faster loading
            // This renders the Mermaid diagram in the background
            prerenderMindmapDisplay().finally(() => {
                // Remove loading indicator when prerendering is complete
                if (mindmapButton) {
                    mindmapButton.classList.remove('prerendering');
                    mindmapButton.title = 'Mindmap';
                }
            });
        }
    }
}

// Pre-render the Mermaid diagram in the background for instant display
async function prerenderMindmapDisplay() {
    if (!currentMindmapData) {
        return;
    }
    
    try {
        // Create a unique ID for this prerendered mindmap
        const mindmapId = 'prerendered-mindmap-' + Date.now();
        
        // Pre-render the SVG in memory
        console.log('Pre-rendering Mermaid diagram...');
        const { svg } = await mermaid.render(mindmapId + '-svg', currentMindmapData);
        
        // Store the pre-rendered SVG for instant display
        window.prerenderedMindmapSVG = svg;
        window.prerenderedMindmapId = mindmapId;
        
        console.log('Mermaid diagram pre-rendered successfully');
        
    } catch (error) {
        console.warn('Error pre-rendering mindmap (will generate on-demand):', error);
        // Don't store anything if pre-rendering fails - fallback to on-demand generation
        window.prerenderedMindmapSVG = null;
        window.prerenderedMindmapId = null;
    }
}

async function updateMindmapDisplay() {
    const mindmapContent = document.getElementById('mindmap-content');
    
    if (!currentMindmapData) {
        mindmapContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        return;
    }
    
    try {
        // Check if we have a prerendered SVG available for instant display
        if (window.prerenderedMindmapSVG && window.prerenderedMindmapId) {
            console.log('Using prerendered mindmap for instant display');
            
            // Create container for the prerendered mindmap
            const mindmapId = window.prerenderedMindmapId;
            mindmapContent.innerHTML = `<div id="${mindmapId}" class="mindmap-diagram"></div>`;
            
            // Use the prerendered SVG instantly
            document.getElementById(mindmapId).innerHTML = window.prerenderedMindmapSVG;
            
            // Apply styling to the prerendered mindmap
            applyMindmapTextStyling(mindmapId);
            
            // Enable dragging for the prerendered mindmap
            const prerenderedDiagram = document.getElementById(mindmapId);
            if (prerenderedDiagram) {
                prerenderedDiagram.classList.add('draggable');
                enableDragging(prerenderedDiagram);
            }
            
            return; // Exit early since we used prerendered content
        }
        
        // Fallback: Generate mindmap on-demand if no prerendered version available
        console.log('No prerendered mindmap available, generating on-demand...');
        
        // Create a unique ID for this mindmap
        const mindmapId = 'mindmap-' + Date.now();
        
        // Create container for the mindmap
        mindmapContent.innerHTML = `<div id="${mindmapId}" class="mindmap-diagram"></div>`;
        
        // Debug: Log the Mermaid syntax
        console.log('Generated Mermaid syntax:', currentMindmapData);
        
        // Render the mindmap using Mermaid
        const { svg } = await mermaid.render(mindmapId + '-svg', currentMindmapData);
        document.getElementById(mindmapId).innerHTML = svg;
        
        // FORCE text color changes after Mermaid renders
        applyMindmapTextStyling(mindmapId);
        
        // Enable dragging for the newly created mindmap
        const newMindmapDiagram = document.getElementById(mindmapId);
        if (newMindmapDiagram) {
            newMindmapDiagram.classList.add('draggable');
            enableDragging(newMindmapDiagram);
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

// Toggle mindmap panel visibility
function toggleMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    const isVisible = mindmapPanel.classList.contains('visible');
    
    if (!isVisible && !currentMindmapData) {
        // Generate mindmap if not already prerendered
        generateMindmap();
    } else if (!isVisible && currentMindmapData) {
        // If we have mindmap data (prerendered or otherwise), update display
        updateMindmapDisplay();
    }
    
    mindmapPanel.classList.toggle('visible');
}

// Close mindmap panel
function closeMindmapPanel() {
    const mindmapPanel = document.getElementById('mindmap-panel');
    mindmapPanel.classList.remove('visible');
}

// Clear mindmap data (to be called from script.js when needed)
function clearMindmapData() {
    currentMindmapData = null;
    window.prerenderedMindmapSVG = null;
    window.prerenderedMindmapId = null;
    resetZoom();
}

// Zoom functionality
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
        
        // Enable dragging for all mindmaps (not just zoomed ones)
        mindmapDiagram.classList.add('draggable');
        enableDragging(mindmapDiagram);
        
        // Add zoomed class for additional styling when zoomed
        if (currentZoomLevel > 1) {
            mindmapDiagram.classList.add('zoomed');
        } else {
            mindmapDiagram.classList.remove('zoomed');
        }
    }
}

// Dragging functionality for mindmaps
function enableDragging(element) {
    // Remove existing listeners to prevent duplicates
    disableDragging(element);
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('mousemove', drag);
    element.addEventListener('mouseup', endDrag);
    element.addEventListener('mouseleave', endDrag);
    
    // Add touch support for mobile devices
    element.addEventListener('touchstart', startDragTouch);
    element.addEventListener('touchmove', dragTouch);
    element.addEventListener('touchend', endDrag);
}

function disableDragging(element) {
    element.removeEventListener('mousedown', startDrag);
    element.removeEventListener('mousemove', drag);
    element.removeEventListener('mouseup', endDrag);
    element.removeEventListener('mouseleave', endDrag);
    
    // Remove touch listeners
    element.removeEventListener('touchstart', startDragTouch);
    element.removeEventListener('touchmove', dragTouch);
    element.removeEventListener('touchend', endDrag);
}

function startDrag(e) {
    // Enable dragging at all zoom levels
    isDragging = true;
    dragStartX = e.clientX - translateX;
    dragStartY = e.clientY - translateY;
    
    // Add visual feedback
    e.target.closest('.mindmap-diagram').classList.add('dragging');
    
    e.preventDefault();
    e.stopPropagation();
}

function drag(e) {
    if (isDragging) {
        translateX = e.clientX - dragStartX;
        translateY = e.clientY - dragStartY;
        applyZoom();
        e.preventDefault();
        e.stopPropagation();
    }
}

function endDrag(e) {
    if (isDragging) {
        isDragging = false;
        
        // Remove visual feedback
        const diagram = e.target.closest('.mindmap-diagram');
        if (diagram) {
            diagram.classList.remove('dragging');
        }
    }
}

// Touch support for mobile devices
function startDragTouch(e) {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        isDragging = true;
        dragStartX = touch.clientX - translateX;
        dragStartY = touch.clientY - translateY;
        
        // Add visual feedback
        e.target.closest('.mindmap-diagram').classList.add('dragging');
        
        e.preventDefault();
    }
}

function dragTouch(e) {
    if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        translateX = touch.clientX - dragStartX;
        translateY = touch.clientY - dragStartY;
        applyZoom();
        e.preventDefault();
    }
}

// Full screen modal functions
function openFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    const fullScreenContent = document.getElementById('mindmap-fullscreen-content');
    
    if (!currentMindmapData) {
        fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
    } else {
        // Copy the current mindmap to full screen
        const currentMindmapContent = document.getElementById('mindmap-content');
        const mindmapDiagram = currentMindmapContent.querySelector('.mindmap-diagram');
        
        if (mindmapDiagram) {
            // Clone the mindmap diagram for full screen
            const clonedDiagram = mindmapDiagram.cloneNode(true);
            clonedDiagram.style.transform = ''; // Reset any zoom/transform
            fullScreenContent.innerHTML = '';
            fullScreenContent.appendChild(clonedDiagram);
            
            // Enable dragging for the fullscreen mindmap
            clonedDiagram.classList.add('draggable');
            enableDragging(clonedDiagram);
            
            // Reset zoom for full screen
            currentZoomLevel = 1;
            translateX = 0;
            translateY = 0;
        } else {
            fullScreenContent.innerHTML = '<div class="mindmap-empty">No mindmap available for this document.</div>';
        }
    }
    
    fullScreenModal.classList.add('visible');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeFullScreenMindmap() {
    const fullScreenModal = document.getElementById('mindmap-fullscreen-modal');
    fullScreenModal.classList.remove('visible');
    document.body.style.overflow = ''; // Restore background scrolling
    
    // Reset zoom state
    currentZoomLevel = 1;
    translateX = 0;
    translateY = 0;
}
