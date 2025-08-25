const fs = require('fs');
const path = require('path');

// Fix ajv-keywords
const ajvKeywordsPath = path.join(__dirname, 'node_modules', 'ajv-keywords', 'dist', 'index.js');

if (fs.existsSync(ajvKeywordsPath)) {
  let content = fs.readFileSync(ajvKeywordsPath, 'utf8');
  
  // Replace the error throwing line
  content = content.replace(
    'throw new Error("Unknown keyword " + keyword);',
    'console.warn("Skipping unknown keyword:", keyword); return () => {};'
  );
  
  fs.writeFileSync(ajvKeywordsPath, content, 'utf8');
  console.log('Fixed ajv-keywords issue');
} else {
  console.log('ajv-keywords not found');
}
