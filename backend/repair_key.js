const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
const rawContent = fs.readFileSync(keyPath, 'utf8');

try {
    // 1. Force remove all literal newlines from the whole file first
    const flattened = rawContent.replace(/\r?\n/g, '');
    
    // 2. Parse it
    const json = JSON.parse(flattened);
    
    // 3. Clean the private_key specifically
    if (json.private_key) {
        // Remove any double-escaped newlines or other junk
        // The private_key should be: "-----BEGIN PRIVATE KEY-----\nBASE64\n-----END PRIVATE KEY-----"
        // If it has literal newlines, JSON.parse already handled them if they were escaped.
        // If they weren't escaped, flattened handled them.
    }

    // 4. Write back as MINIFIED JSON (one single line)
    fs.writeFileSync(keyPath, JSON.stringify(json));
    console.log('Minified Repair successful.');
} catch (e) {
    console.error('Minified Repair failed:', e.message);
}
