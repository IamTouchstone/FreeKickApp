const fs = require('fs');
const path = require('path');

// Ensure assets dir exists
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Minimal 1x1 transparent/colored PNG buffer
const minimalPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSAhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const assetNames = ['icon.png', 'splash-icon.png', 'adaptive-icon.png', 'favicon.png'];
assetNames.forEach(file => {
  const filePath = path.join(assetsDir, file);
  fs.writeFileSync(filePath, minimalPngBuffer);
  console.log(`Created placeholder asset: ${file}`);
});
