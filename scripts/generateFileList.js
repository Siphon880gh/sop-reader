#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate a JSON file containing the list of markdown files in the documents/ folder
 */
function generateMarkdownFileList() {
    const documentsDir = path.join(__dirname, '..', 'documents');
    const outputFile = path.join(__dirname, '..', 'markdownFiles.json');
    
    try {
        // Check if documents directory exists
        if (!fs.existsSync(documentsDir)) {
            console.error('❌ Documents directory not found:', documentsDir);
            process.exit(1);
        }
        
        // Read all files in the documents directory
        const files = fs.readdirSync(documentsDir);
        
        // Filter for markdown files (.md extension)
        const markdownFiles = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ext === '.md' || ext === '.markdown';
            })
            .sort(); // Sort alphabetically for consistent ordering
        
        // Generate metadata for each file
        const fileList = markdownFiles.map(filename => {
            const filePath = path.join(documentsDir, filename);
            const stats = fs.statSync(filePath);
            
            return {
                filename: filename,
                name: path.basename(filename, path.extname(filename)), // Display name without extension
                size: stats.size,
                modified: stats.mtime.toISOString()
            };
        });
        
        // Create the output object
        const output = {
            generated: new Date().toISOString(),
            count: fileList.length,
            files: fileList
        };
        
        // Write the JSON file
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        
        console.log(`✅ Generated markdownFiles.json with ${fileList.length} files:`);
        fileList.forEach(file => {
            console.log(`   - ${file.filename} (${(file.size / 1024).toFixed(1)}KB)`);
        });
        
    } catch (error) {
        console.error('❌ Error generating file list:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    generateMarkdownFileList();
}

module.exports = generateMarkdownFileList;
