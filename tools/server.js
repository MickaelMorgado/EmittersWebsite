const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Serve from multiple root directories
const rootDirs = [
  __dirname,                    // tools/
  path.join(__dirname, '..'),   // parent (EmittersWebsite/)
];

const server = http.createServer((req, res) => {
  let filePath = req.url.split('?')[0];

  // Remove leading slash for path joining
  if (filePath.startsWith('/')) {
    filePath = filePath.substring(1);
  }

  let content = null;
  let found = false;

  // Try each root directory
  for (const rootDir of rootDirs) {
    const fullPath = path.join(rootDir, filePath);
    try {
      if (fs.existsSync(fullPath)) {
        content = fs.readFileSync(fullPath);
        found = true;
        break;
      }
    } catch (e) {
      // Continue to next dir
    }
  }

  if (!found) {
    res.writeHead(404);
    res.end('File not found: ' + req.url);
    return;
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Serving from: ${rootDirs.join(', ')}`);
});