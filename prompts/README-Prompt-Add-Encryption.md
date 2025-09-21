
This is only for decryption because it's assumed on Obsidian you authored and locked the document using a plugin like Age Encrypt.


Based on the AGE encryption system, here's a comprehensive prompt for implementing password encryption/decryption in any Markdown reader app:


Have your own Markdown rendering app? If you’d like to add password protected documents, this is a prompt to add that feature. There is no need to implement encryption because it's assumed you authored and then encrypted the md file on Obsidian using a plugin like Age Encrypt. Then you present the md documents on your markdown reader app.

Prompt:
```
The codebase is a markdown md reader. Some markdowns are encrypted with AGE. We need a GUI for unlocking the document by entering a password. There is no need to implement encryption because it's assumed the user authored and then encrypted the md file on Obsidian using a plugin like Age Encrypt. Then the presents the md documents on their markdown reader app.


This feature should:

1. **Detect AGE encrypted content** in markdown files automatically
2. **Show a password visual component** when encrypted content is found
3. **Decrypt content seamlessly** and render it as normal markdown
4. **Support both age binary and Node.js fallback** for maximum compatibility
5. **Cache decrypted content** for the session to avoid repeated prompts
6. **Handle errors gracefully** with user-friendly messages

### Implementation Approach

- `decrypt-age.php`: Handles AGE decryption and re-encryption for JavaScript. First contact point when user clicks Decrypt then types in the password.
- `decrypt-age-node.js`: Node.js fallback using age-encryption npm package
- **Primary**: Tries `age` binary first
- **Fallback**: Automatically uses Node.js script when binary fails or isn't available (especially for nginx/PHP-FPM servers)
- Re-encrypts with AES-256-GCM for client-side handling. Javascript is not good at AGE encryption, so we decrypted and re-encrypted it from AGE into AES in the backend before handling it to the frontend. The frontend then deals with AES instead of AGE.

### Backend Implementation (PHP/Node.js/Python)

#### 1. AGE Content Detection
"""php
function isAgeEncrypted($content) {
    return strpos($content, '-----BEGIN AGE ENCRYPTED FILE-----') !== false &&
           strpos($content, '-----END AGE ENCRYPTED FILE-----') !== false;
}

function extractAgeBlock($content) {
    $pattern = '/"""age\s*([\s\S]*?)"""/';
    if (preg_match($pattern, $content, $matches)) {
        return trim($matches[1]);
    }
    return null;
}
"""

#### 2. Dual Decryption System (Age Binary + Node.js Fallback)
"""php
function decryptAgeContent($ageContent, $password) {
    // Try age binary first
    if (isAgeBinaryAvailable()) {
        try {
            return decryptWithAgeBinary($ageContent, $password);
        } catch (Exception $e) {
            error_log("Age binary failed, falling back to Node.js: " . $e->getMessage());
        }
    }
    
    // Fallback to Node.js
    return decryptWithNodeJS($ageContent, $password);
}

function decryptWithAgeBinary($content, $password) {
    $tempFile = tempnam(sys_get_temp_dir(), 'age_decrypt_');
    file_put_contents($tempFile, $content);
    
    $cmd = "age -d -i " . escapeshellarg($password) . " " . escapeshellarg($tempFile) . " 2>&1";
    $output = shell_exec($cmd);
    unlink($tempFile);
    
    if (empty($output)) {
        throw new Exception("Age binary decryption failed");
    }
    
    return $output;
}

function decryptWithNodeJS($content, $password) {
    $nodeScript = __DIR__ . '/decrypt-age-node.js';
    $input = json_encode(['content' => $content, 'password' => $password]);
    
    $cmd = "node " . escapeshellarg($nodeScript) . " 2>&1";
    $process = proc_open($cmd, [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ], $pipes);
    
    fwrite($pipes[0], $input);
    fclose($pipes[0]);
    
    $output = stream_get_contents($pipes[1]);
    $errors = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    
    proc_close($process);
    
    $result = json_decode($output, true);
    if (!$result || !$result['success']) {
        throw new Exception($result['error'] ?? 'Node.js decryption failed');
    }
    
    return $result['content'];
}
"""

#### 3. Node.js Decryption Script (decrypt-age-node.js)
"""javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

async function decryptAgeArmored(armored, password) {
    try {
        // Try dynamic import for Node.js v14+
        const age = await import('age-encryption');
        const decrypter = new age.Decrypter();
        decrypter.addPassphrase(password);
        
        // Handle both armored and unarmored content
        let binaryData;
        if (armored.includes('-----BEGIN AGE ENCRYPTED FILE-----')) {
            binaryData = age.armor.decode(armored);
        } else {
            // Handle unarmored content
            const cleanPayload = armored.replace(/\s+/g, '');
            const binaryString = Buffer.from(cleanPayload, 'base64');
            binaryData = new Uint8Array(binaryString);
        }
        
        const decrypted = await decrypter.decrypt(binaryData, "text");
        return decrypted;
    } catch (error) {
        throw new Error(`AGE decryption failed: ${error.message}`);
    }
}

async function main() {
    try {
        let input = '';
        process.stdin.setEncoding('utf8');
        
        for await (const chunk of process.stdin) {
            input += chunk;
        }
        
        const data = JSON.parse(input);
        const decrypted = await decryptAgeArmored(data.content, data.password);
        
        console.log(JSON.stringify({
            success: true,
            content: decrypted
        }));
    } catch (error) {
        console.log(JSON.stringify({
            success: false,
            error: error.message
        }));
    }
}

main();
"""

#### 4. Re-encryption with AES for Client-Side
"""php
function reencryptForClient($decryptedContent, $password) {
    $key = hash_pbkdf2('sha256', $password, 'age_aes_salt', 10000, 32, true);
    $iv = random_bytes(16);
    $encrypted = openssl_encrypt($decryptedContent, 'aes-256-cbc', $key, 0, $iv);
    
    return base64_encode($iv . $encrypted);
}
"""

### Frontend Implementation (JavaScript)

#### 1. Encryption Detection and UI
"""javascript
class AgeDecryption {
    constructor() {
        this.cache = new Map();
        this.init();
    }
    
    init() {
        // Scan for AGE encrypted content
        this.scanForEncryptedContent();
        
        // Listen for dynamic content changes
        const observer = new MutationObserver(() => {
            this.scanForEncryptedContent();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    scanForEncryptedContent() {
        const encryptedBlocks = document.querySelectorAll('pre code');
        encryptedBlocks.forEach(block => {
            if (this.isAgeEncrypted(block.textContent)) {
                this.replaceWithDecryptionUI(block);
            }
        });
    }
    
    isAgeEncrypted(content) {
        return content.includes('-----BEGIN AGE ENCRYPTED FILE-----') &&
               content.includes('-----END AGE ENCRYPTED FILE-----');
    }
    
    replaceWithDecryptionUI(block) {
        const container = block.closest('pre');
        const wrapper = document.createElement('div');
        wrapper.className = 'age-encrypted-content';
        wrapper.innerHTML = `
            <div class="age-prompt">
                <h4>🔒 Encrypted Content</h4>
                <p>This content is password protected. Enter the password to decrypt:</p>
                <input type="password" placeholder="Enter password" class="age-password-input">
                <button class="age-decrypt-btn">Decrypt</button>
                <div class="age-error" style="display: none;"></div>
            </div>
            <div class="age-content" style="display: none;"></div>
        `;
        
        container.parentNode.replaceChild(wrapper, container);
        
        // Add event listeners
        const decryptBtn = wrapper.querySelector('.age-decrypt-btn');
        const passwordInput = wrapper.querySelector('.age-password-input');
        const errorDiv = wrapper.querySelector('.age-error');
        const contentDiv = wrapper.querySelector('.age-content');
        
        decryptBtn.addEventListener('click', () => {
            this.decryptContent(wrapper, passwordInput.value, errorDiv, contentDiv);
        });
        
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.decryptContent(wrapper, passwordInput.value, errorDiv, contentDiv);
            }
        });
    }
    
    async decryptContent(wrapper, password, errorDiv, contentDiv) {
        if (!password) {
            this.showError(errorDiv, 'Please enter a password');
            return;
        }
        
        const originalContent = wrapper.dataset.originalContent || 
            wrapper.querySelector('pre code')?.textContent;
        
        if (!originalContent) {
            this.showError(errorDiv, 'No encrypted content found');
            return;
        }
        
        try {
            // Check cache first
            const cacheKey = this.getCacheKey(originalContent, password);
            if (this.cache.has(cacheKey)) {
                this.showDecryptedContent(contentDiv, this.cache.get(cacheKey));
                return;
            }
            
            // Decrypt via backend
            const response = await fetch('/decrypt-age.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: originalContent,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Cache the result
                this.cache.set(cacheKey, result.content);
                
                // Show decrypted content
                this.showDecryptedContent(contentDiv, result.content);
                
                // Log decryption method used
                if (result.decryption_method) {
                    console.log(`🔧 AGE Decryption: Using ${result.decryption_method}`);
                }
            } else {
                this.showError(errorDiv, result.error || 'Decryption failed');
            }
        } catch (error) {
            this.showError(errorDiv, 'Network error: ' + error.message);
        }
    }
    
    showDecryptedContent(contentDiv, content) {
        // Render markdown content
        contentDiv.innerHTML = this.renderMarkdown(content);
        contentDiv.style.display = 'block';
        
        // Hide the prompt
        contentDiv.previousElementSibling.style.display = 'none';
    }
    
    showError(errorDiv, message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    getCacheKey(content, password) {
        return btoa(content + '|' + password);
    }
    
    renderMarkdown(content) {
        // Use your existing markdown renderer
        // This is a placeholder - replace with your markdown library
        return content.replace(/\n/g, '<br>');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AgeDecryption();
});
"""

#### 2. Client-Side AES Decryption
"""javascript
async function decryptAESContent(encryptedContent, password) {
    try {
        // Derive key using PBKDF2
        const key = await crypto.subtle.importKey(
            'raw',
            await crypto.subtle.digest('SHA-256', 
                new TextEncoder().encode(password + 'age_aes_salt')
            ),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        const derivedKey = await crypto.subtle.deriveBits({
            name: 'PBKDF2',
            salt: new TextEncoder().encode('age_aes_salt'),
            iterations: 10000,
            hash: 'SHA-256'
        }, key, 256);
        
        // Import the derived key for AES
        const aesKey = await crypto.subtle.importKey(
            'raw',
            derivedKey,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );
        
        // Decode the encrypted content
        const encryptedData = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));
        const iv = encryptedData.slice(0, 16);
        const ciphertext = encryptedData.slice(16);
        
        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-CBC', iv: iv },
            aesKey,
            ciphertext
        );
        
        return new TextDecoder().decode(decrypted);
    } catch (error) {
        throw new Error('AES decryption failed: ' + error.message);
    }
}
"""

### CSS Styling
"""css
.age-encrypted-content {
    border: 2px dashed #e74c3c;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
    background: #fdf2f2;
}

.age-prompt h4 {
    color: #e74c3c;
    margin: 0 0 10px 0;
}

.age-password-input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin: 10px 0;
}

.age-decrypt-btn {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
}

.age-decrypt-btn:hover {
    background: #c0392b;
}

.age-error {
    color: #e74c3c;
    margin-top: 10px;
    font-weight: bold;
}

.age-content {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin-top: 15px;
}
"""

### Configuration (config.json)
"""json
{
  "age": {
    "appendSystemPath": [
      "/usr/local/bin",
      "/opt/homebrew/bin",
      "/usr/bin",
      "/bin"
    ],
    "bypassAgeBinary": false
  },
  "nodejs": {
    "appendSystemPath": [
      "/usr/local/bin",
      "/opt/homebrew/bin",
      "/usr/bin",
      "/bin"
    ]
  }
}
"""

### Package Dependencies
"""json
{
  "dependencies": {
    "age-encryption": "^0.2.4"
  }
}
"""

### Usage in Markdown
"""markdown
# My Document

This is regular content.

"""age
-----BEGIN AGE ENCRYPTED FILE-----
YWdlLWVuY3J5cHRpb24ub3JnL3YxCi0+IHNjcnlwdCBhYmNkZWYgMTI4
Ci0+IGFnZS1lbmNyeXB0aW9uLm9yZy92MQp0ZXN0IGVuY3J5cHRlZCBj
b250ZW50IGhlcmUK-----END AGE ENCRYPTED FILE-----
"""

More regular content.
"""

This implementation provides:
- **Automatic detection** of AGE encrypted content
- **Dual decryption methods** (age binary + Node.js fallback)
- **Session caching** to avoid repeated password prompts
- **Graceful error handling** with user-friendly messages
- **Portable Node.js support** with nvm compatibility
- **Self-contained code** that can be adapted to any markdown reader

The system is designed to be robust, user-friendly, and compatible across different server environments.
```

