/**
 * Media Synchronization Pipeline
 * Automatically scans assets/audio/ and assets/gallery/
 * Generates assets/audio/playlist.json, assets/gallery/manifest.json, and js/media-manifest.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'assets', 'audio');
const GALLERY_DIR = path.join(ROOT, 'assets', 'gallery');
const HIGHLIGHTS_DIR = path.join(ROOT, 'assets', 'highlights');

// Ensure directories exist
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
if (!fs.existsSync(GALLERY_DIR)) fs.mkdirSync(GALLERY_DIR, { recursive: true });
if (!fs.existsSync(HIGHLIGHTS_DIR)) fs.mkdirSync(HIGHLIGHTS_DIR, { recursive: true });

// Supported extensions
const AUDIO_EXTS = new Set(['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac']);
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif']);

/**
 * Parses artist and title from audio filename
 * e.g. "The Stranglers - Golden Brown.mp3" -> { artist: "The Stranglers", title: "Golden Brown" }
 * e.g. "Charlie Puth - Attention [Official Video].mp3" -> { artist: "Charlie Puth", title: "Attention" }
 */
function parseAudioFilename(filename) {
  const base = path.basename(filename, path.extname(filename));
  // Remove trailing bracketed info like [Official Video], (Audio), etc.
  const cleaned = base.replace(/\[.*?\]|\(.*?\)/g, '').trim();

  let artist = 'Unknown Artist';
  let title = cleaned;

  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  } else if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    artist = parts[0].trim();
    title = parts.slice(1).join('-').trim();
  }

  return { artist, title };
}

/**
 * Formats a photo filename into a clean title
 * e.g. "analog_film_study.jpg" -> "Analog Film Study"
 * e.g. "LRM_20240212_214123.jpg" -> "Optics Capture · Feb 12, 2024"
 * e.g. "20260127_172214 (1).jpg" -> "Field Highlight · Jan 27, 2026"
 */
function formatPhotoTitle(filename, categoryPrefix = 'Optics') {
  const base = path.basename(filename, path.extname(filename));

  // 1. Date format: LRM_YYYYMMDD_HHMMSS or YYYYMMDD_HHMMSS
  const dateMatch = base.match(/(?:LRM_|IMG[-_])?(\d{4})(\d{2})(\d{2})(?:[_-]\w+)?/i);
  if (dateMatch) {
    const [_, y, m, d] = dateMatch;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    const dayNum = parseInt(d, 10);
    return `${categoryPrefix} · ${monthName} ${dayNum}, ${y}`;
  }

  // 2. Clean custom name
  const cleaned = base.replace(/\s*\(\d+\)\s*$/, '');
  return cleaned
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function syncAudio() {
  const files = fs.readdirSync(AUDIO_DIR).filter(f => AUDIO_EXTS.has(path.extname(f).toLowerCase()));

  const tracks = files.map(file => {
    const { artist, title } = parseAudioFilename(file);
    const encodedName = encodeURIComponent(file);
    return {
      title,
      artist,
      album: 'Dossier Audio Archive',
      filename: file,
      src: `assets/audio/${encodedName}`
    };
  });

  // Sort tracks so that "Golden Brown" is always Track #1
  tracks.sort((a, b) => {
    const aIsGolden = (a.title + ' ' + a.filename).toLowerCase().includes('golden brown');
    const bIsGolden = (b.title + ' ' + b.filename).toLowerCase().includes('golden brown');

    if (aIsGolden && !bIsGolden) return -1;
    if (!aIsGolden && bIsGolden) return 1;
    return a.title.localeCompare(b.title);
  });

  return tracks;
}

function syncGallery() {
  const files = fs.readdirSync(GALLERY_DIR).filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()));

  const photos = files.map((file, idx) => {
    const title = formatPhotoTitle(file, 'Frame');
    const encodedName = encodeURIComponent(file);
    return {
      id: `photo-${idx + 1}`,
      title,
      location: 'Curated Optics Archive',
      specs: '35mm Optics · Raw Capture',
      image: `assets/gallery/${encodedName}`,
      placeholder: 'assets/banana_hero.jpg'
    };
  });

  return photos;
}

function syncHighlights() {
  if (!fs.existsSync(HIGHLIGHTS_DIR)) return [];

  const files = fs.readdirSync(HIGHLIGHTS_DIR).filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()));

  // Sort highlights chronologically / stable
  files.sort();

  const highlights = files.map((file, idx) => {
    const title = formatPhotoTitle(file, 'Dispatch Highlight');
    const encodedName = encodeURIComponent(file);
    return {
      id: `highlight-${idx + 1}`,
      title,
      tag: `LOG #${String(idx + 1).padStart(2, '0')}`,
      specs: 'Field Archive · High-Res 35mm',
      src: `assets/highlights/${encodedName}`,
      image: `assets/highlights/${encodedName}`,
      filename: file
    };
  });

  return highlights;
}

function main() {
  console.log('🔄 Synchronizing media assets...');

  const playlist = syncAudio();
  const gallery = syncGallery();
  const highlights = syncHighlights();

  // 1. Write assets/audio/playlist.json
  const audioManifestPath = path.join(AUDIO_DIR, 'playlist.json');
  fs.writeFileSync(audioManifestPath, JSON.stringify(playlist, null, 2), 'utf8');
  console.log(`✅ Audio playlist written (${playlist.length} tracks): ${path.relative(ROOT, audioManifestPath)}`);
  if (playlist.length > 0) {
    console.log(`   🎵 Track #1 (Default): "${playlist[0].title}" by ${playlist[0].artist}`);
  }

  // 2. Write assets/gallery/manifest.json
  const galleryManifestPath = path.join(GALLERY_DIR, 'manifest.json');
  fs.writeFileSync(galleryManifestPath, JSON.stringify(gallery, null, 2), 'utf8');
  console.log(`✅ Gallery manifest written (${gallery.length} photos): ${path.relative(ROOT, galleryManifestPath)}`);

  // 3. Write assets/highlights/manifest.json
  const highlightsManifestPath = path.join(HIGHLIGHTS_DIR, 'manifest.json');
  fs.writeFileSync(highlightsManifestPath, JSON.stringify(highlights, null, 2), 'utf8');
  console.log(`✅ Highlights manifest written (${highlights.length} photos): ${path.relative(ROOT, highlightsManifestPath)}`);

  // 4. Write js/media-manifest.js (ES Module and global window support for zero-latency loading)
  const mediaManifestPath = path.join(ROOT, 'js', 'media-manifest.js');
  const jsContent = `/**
 * Auto-generated Media Manifest
 * Generated by scripts/sync-media.js at ${new Date().toISOString()}
 * DO NOT EDIT DIRECTLY - Drop files into assets/audio/, assets/gallery/, or assets/highlights/ and run "npm run sync"
 */

export const AUDIO_PLAYLIST = ${JSON.stringify(playlist, null, 2)};

export const GALLERY_PHOTOS = ${JSON.stringify(gallery, null, 2)};

export const HIGHLIGHTS_PHOTOS = ${JSON.stringify(highlights, null, 2)};

// Also attach to window for non-module script access
if (typeof window !== 'undefined') {
  window.__AUDIO_PLAYLIST__ = AUDIO_PLAYLIST;
  window.__GALLERY_PHOTOS__ = GALLERY_PHOTOS;
  window.__HIGHLIGHTS_PHOTOS__ = HIGHLIGHTS_PHOTOS;
}
`;

  fs.writeFileSync(mediaManifestPath, jsContent, 'utf8');
  console.log(`✅ Media manifest module written: ${path.relative(ROOT, mediaManifestPath)}`);
  console.log('✨ Media pipeline synchronized successfully!');
}

main();
