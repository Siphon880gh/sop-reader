#!/usr/bin/env node

const chokidar = require('chokidar');
const generateFileList = require('./generateFileList');
const path = require('path');

/**
 * Watch the documents/ folder for changes and automatically regenerate markdownFiles.json
 */
function startWatcher() {
    const documentsDir = path.join(__dirname, '..', 'documents');
    
    console.log('👀 Watching documents/ folder for changes...');
    console.log(`📁 Watching: ${documentsDir}`);
    
    // Initial generation
    generateFileList();
    
    // Watch for changes in the documents directory
    const watcher = chokidar.watch(documentsDir, {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true,
        ignoreInitial: true
    });
    
    watcher
        .on('add', (filePath) => {
            if (isMarkdownFile(filePath)) {
                console.log(`📄 Added: ${path.basename(filePath)}`);
                generateFileList();
            }
        })
        .on('unlink', (filePath) => {
            if (isMarkdownFile(filePath)) {
                console.log(`🗑️  Removed: ${path.basename(filePath)}`);
                generateFileList();
            }
        })
        .on('change', (filePath) => {
            if (isMarkdownFile(filePath)) {
                console.log(`✏️  Modified: ${path.basename(filePath)}`);
                generateFileList();
            }
        })
        .on('error', (error) => {
            console.error('❌ Watcher error:', error);
        });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Stopping watcher...');
        watcher.close();
        process.exit(0);
    });
}

function isMarkdownFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.md' || ext === '.markdown';
}

// Run the watcher
if (require.main === module) {
    startWatcher();
}

module.exports = startWatcher;
