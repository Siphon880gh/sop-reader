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
        return;
    }
    
    if (isMarkdownView) {
        // Show raw markdown
        contentEl.className = 'raw-markdown';
        contentEl.textContent = currentMarkdownText;
    } else {
        // Show rendered HTML
        contentEl.className = '';
        const html = md.render(currentMarkdownText);
        contentEl.innerHTML = html;
    }
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
});
