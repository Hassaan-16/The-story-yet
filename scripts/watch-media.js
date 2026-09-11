/**
 * Media Directory Watcher
 * Watches assets/audio/ and assets/gallery/ for additions, renames, and removals.
 * Automatically runs sync-media.js with debouncing.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'assets', 'audio');
const GALLERY_DIR = path.join(ROOT, 'assets', 'gallery');

let debounceTimer = null;

function triggerSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      console.log('\n👀 Change detected in media directories! Re-syncing...');
      execSync('node scripts/sync-media.js', { cwd: ROOT, stdio: 'inherit' });
    } catch (err) {
      console.error('❌ Error executing sync-media.js:', err);
    }
  }, 350);
}

// Ensure directories exist
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });

// Initial sync
try {
  execSync('node scripts/sync-media.js', { cwd: ROOT, stdio: 'inherit' });
} catch (err) {}

console.log(`\n🎧 Watching for media changes:`);
console.log(`   - Audio drop folder: ${path.relative(ROOT, AUDIO_DIR)}/`);
console.log(`   - Gallery drop folder: ${path.relative(ROOT, GALLERY_DIR)}/`);
console.log('Drop any .mp3 or photo files into these folders to automatically update the website!\n');

fs.watch(AUDIO_DIR, { recursive: true }, (event, filename) => {
  if (filename && !filename.endsWith('.json')) {
    triggerSync();
  }
});

fs.watch(GALLERY_DIR, { recursive: true }, (event, filename) => {
  if (filename && !filename.endsWith('.json')) {
    triggerSync();
  }
});
