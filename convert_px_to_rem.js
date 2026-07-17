const fs = require('fs');
const path = 'c:/Users/Manh/.gemini/antigravity-ide/scratch/webopoly/client/src/ui/PropertyModal.tsx';
let content = fs.readFileSync(path, 'utf8');

function pxToRem(pxStr) {
  const px = parseFloat(pxStr);
  if (isNaN(px)) return pxStr;
  const rem = px / 15; // Based on index.css base 15px
  return `${Number(rem.toFixed(4))}rem`;
}

// Matches arbitrary pixel values like [16px], [10px_16px], [12px_24px_16px]
// But ignores non-pixel things inside brackets
content = content.replace(/\[([^\]]+)\]/g, (match, inner) => {
  // If it's something like 'rgba(...)', don't touch
  if (inner.includes('rgba') || inner.includes('#') || inner.includes('vh') || inner.includes('vw') || inner.includes('inset')) {
    return match;
  }
  
  // Replace all occurrences of Npx with Mrem
  const converted = inner.replace(/(\d+(?:\.\d+)?)px/g, (m, pxVal) => pxToRem(pxVal));
  return `[${converted}]`;
});

fs.writeFileSync(path, content);
console.log('Converted px to rem in PropertyModal.tsx');
