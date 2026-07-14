const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/favicon.svg');

async function generate() {
  try {
    console.log('Generating assets from SVG:', svgPath);
    
    // Ensure directories exist
    const publicIconsDir = path.join(__dirname, '../public/icons');
    if (!fs.existsSync(publicIconsDir)) {
      fs.mkdirSync(publicIconsDir, { recursive: true });
    }
    
    const appDir = path.join(__dirname, '../app');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Generate public/icons/nenez-icon-192.png
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, '../public/icons/nenez-icon-192.png'));
    console.log('Generated: public/icons/nenez-icon-192.png');

    // Generate public/icons/nenez-icon-512.png
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, '../public/icons/nenez-icon-512.png'));
    console.log('Generated: public/icons/nenez-icon-512.png');

    // Generate app/icon.png
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, '../app/icon.png'));
    console.log('Generated: app/icon.png');

    // Generate app/apple-icon.png
    await sharp(svgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../app/apple-icon.png'));
    console.log('Generated: app/apple-icon.png');

    // Generate app/favicon.ico
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../app/favicon.ico'));
    console.log('Generated: app/favicon.ico');

    // Generate public/favicon.ico
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    console.log('Generated: public/favicon.ico');

    // Generate public/icon.png
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, '../public/icon.png'));
    console.log('Generated: public/icon.png');

    // Generate public/apple-icon.png
    await sharp(svgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '../public/apple-icon.png'));
    console.log('Generated: public/apple-icon.png');

    // Copy SVG to public/icons/icon-192.svg and icon-512.svg to be safe
    fs.copyFileSync(svgPath, path.join(__dirname, '../public/icons/icon-192.svg'));
    console.log('Copied: public/icons/icon-192.svg');
    fs.copyFileSync(svgPath, path.join(__dirname, '../public/icons/icon-512.svg'));
    console.log('Copied: public/icons/icon-512.svg');

    console.log('All assets generated successfully!');
  } catch (err) {
    console.error('Error generating assets:', err);
    process.exit(1);
  }
}

generate();
