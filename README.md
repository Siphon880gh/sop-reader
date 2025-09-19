# Markdown Mind Map Viewer

**A dynamic markdown document viewer that automatically discovers and renders markdown files with zero configuration.** Drop `.md` files in the `documents/` folder and they instantly appear in a web dropdown selector. Built with vanilla JavaScript and markdown-it for fast, static hosting compatibility. Features dual-mode viewing (rendered HTML + raw markdown), modern responsive UI, and build system with file watching for seamless development workflow.

*For detailed technical context and AI-friendly documentation, see [`context.md`](context.md)*

---

## Features

- 📄 **Dynamic File Discovery**: Automatically scans the `documents/` folder for markdown files
- 🔄 **Build System**: Uses npm scripts to generate file listings with metadata
- 👀 **File Watching**: Development mode with automatic rebuilds
- 🎨 **Dual-Mode Viewing**: Toggle between rendered HTML and raw markdown
- 🎨 **Modern UI**: Clean, responsive design with gradient styling
- ⚡ **Fast Rendering**: Powered by markdown-it with full feature support

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Add your markdown files** to the `documents/` folder

3. **Build the file list**:
   ```bash
   npm run build
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** to `http://127.0.0.1:8000`

## Available Scripts

- `npm run build` - Generate `markdownFiles.json` from files in `documents/`
- `npm run dev` - Build and start development server
- `npm run serve` - Start server without building
- `npm run watch` - Watch `documents/` folder and auto-rebuild on changes

## Project Structure

```
mdmindmap/
├── documents/           # Place your .md files here
│   ├── doc.md
│   └── sample.md
├── scripts/
│   ├── generateFileList.js  # Build script
│   └── watch.js            # File watcher
├── index.html          # Main viewer
├── markdownFiles.json  # Generated file list (auto-generated)
└── package.json        # Build configuration
```

## Development Workflow

1. **Add new markdown files** to `documents/` folder
2. **Run `npm run build`** to update the file list
3. **Refresh your browser** to see the new files in the dropdown

For continuous development, use `npm run watch` to automatically rebuild when files change.

## How It Works

1. The build script (`scripts/generateFileList.js`) scans the `documents/` folder
2. It generates `markdownFiles.json` with metadata about each markdown file
3. The HTML page fetches this JSON and populates the dropdown dynamically
4. When you select a file, it's loaded from the `documents/` folder and rendered

This approach eliminates the need to hardcode file lists while maintaining compatibility with static hosting.
