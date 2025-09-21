Have your own Markdown rendering app? If you’d like to add link preview functionality to your own app, below is a self-contained prompt distilled from this codebase that you can apply directly.

## Link Preview

1. 
Add link preview with selected excerpt (A..B) to your app - Prompt:
```
Add **link popover previews** to our Markdown reader app. This feature should:

### Core Requirements:
1. **Detection**: Automatically detect links followed by images with filenames ending in `1x2.png` or `1x2`
2. **Boundary Word Parsing**: Parse the image's alt text using pattern `startWord..endWord` or `startWord...endWord` to define text extraction boundaries
3. **Content Fetching**: Fetch the target webpage and extract text between the specified boundary words
4. **Popover Display**: Show extracted content in a styled popover tooltip on hover
5. **Performance**: Include caching to avoid repeated requests
6. **Error Handling**: Graceful handling of CORS restrictions and missing content

### Syntax Example:
"""
[Example Website](https://example.com) ![title..content](../1x2.png)
[MDN Docs](https://developer.mozilla.org) ![Resources...Developers](../1x2.png)
"""

### Technical Specifications:

**Hover Behavior:**
- 300ms delay before showing popover
- 200ms delay before hiding popover  
- Popover remains visible when hovering over it
- Smart positioning to stay within viewport bounds

**Visual Styling:**
- Enhanced link styling with dotted underline that becomes solid on hover
- Fade-in animation for smooth appearance
- Loading spinner while fetching content
- Error states with informative messages
- Mobile-responsive design

**CORS Handling:**
- Use `https://api.allorigins.win/get?url=${encodeURIComponent(url)}` as proxy service
- Graceful fallback for blocked requests with user-friendly error messages

**Content Processing:**
- Extract text content from HTML (no iframe usage)
- Case-insensitive boundary word matching
- Clean extracted text (remove excessive whitespace)
- Limit excerpts to 500 characters
- Cache results by URL + boundary word combination

### Required Output:

Please provide **complete, self-contained code** including:

1. **JavaScript Implementation** (`<script>` block):
   - Link detection and enhancement function
   - Hover interaction management
   - Content fetching with CORS proxy
   - Text extraction between boundary words
   - Popover positioning and display logic
   - Caching system for performance

2. **CSS Styling** (`<style>` block):
   - Popover container with fade-in animation
   - Loading and error state styling
   - Enhanced link indicators
   - Mobile responsive adjustments
   - Hide marker images (1x2.png files)

3. **Integration Instructions**:
   - How to add the code to existing Markdown reader
   - Where to call the enhancement function
   - Dependencies (Font Awesome for icons)
   - Testing steps with example markdown

4. **HTML Integration Example**:
   - Show exactly where to place the `<script>` and `<style>` blocks
   - Demonstrate the function call after markdown rendering

### Important Notes:
- The solution must be **vanilla JavaScript** (no framework dependencies)
- Code should be **portable** and easy to integrate
- Include comprehensive **error handling**
- Provide **clear integration steps** for testing
- Make the marker images (1x2.png) hidden automatically via CSS

Generate complete, production-ready code that I can copy-paste into my Markdown reader app.

---

## Expected AI Response Structure

The AI should provide:

1. **Complete JavaScript code block** with all functionality
2. **Complete CSS code block** with all styling  
3. **Step-by-step integration guide**
4. **HTML example** showing proper placement
5. **Testing instructions** with sample markdown
6. **Troubleshooting section** for common issues
```


---

Then let's add the ability to just add popover to any text:

1. Prompt to add the feature:
```
For the link preview in a popup, lets add a new feature that lets user define a preview on top of any text. If it an image ends in 1x2.png or 1x2, then if the alt tag has ##, what's left of ## is a link / anchor text and what's to the right will be the preview text. Clicking link should go nowhere (goes to #).

In addition, create or update a popover-test.md to test this new feature. And update Readme.md about this feature.
```

2. Prompt (subsequently in the same chat thread) to stylize these types of hint links:
```
Awesome. For those links created by the ## should have a class .no-link. We should style it to look different from oher links

Here are some ideas you can choose to follow for styling Custom Preview Links (.no-link):
- Color: Purple
- Border: Dashed
- Background: Light purple
- Cursor: Help
- Hover Effect: Lift + shadow + color change
- Font Weight: Medium (500)
- Padding: 1px 4px
```