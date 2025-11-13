const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Build Python scripts into standalone executables using PyInstaller
 * This script is run during the build process to bundle Python with the Electron app
 */

const pythonDir = path.join(__dirname, '../../Python');
const distDir = path.join(pythonDir, 'dist');

console.log('🐍 Building Python executables with PyInstaller...');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Check if PyInstaller is installed
try {
  execSync('pyinstaller --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ PyInstaller is not installed!');
  console.error('Please install PyInstaller: pip install pyinstaller');
  process.exit(1);
}

// Check if requirements are installed
console.log('📦 Installing Python dependencies...');
try {
  execSync('pip install -r requirements.txt', {
    cwd: pythonDir,
    stdio: 'inherit',
  });
} catch (error) {
  console.error('❌ Failed to install Python dependencies');
  process.exit(1);
}

// Build Python scripts
const scripts = [
  'createSummaryDocuments.spec',
  'createConfirmationDocuments.spec',
];

scripts.forEach((specFile) => {
  console.log(`\n🔨 Building ${specFile}...`);
  try {
    execSync(`pyinstaller ${specFile} --clean --noconfirm`, {
      cwd: pythonDir,
      stdio: 'inherit',
    });
    console.log(`✅ Successfully built ${specFile}`);
  } catch (error) {
    console.error(`❌ Failed to build ${specFile}`);
    process.exit(1);
  }
});

console.log('\n✅ All Python executables built successfully!');
console.log(`📂 Output directory: ${distDir}`);
