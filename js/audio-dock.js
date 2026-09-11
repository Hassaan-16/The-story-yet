/**
 * Overview Page Bottom Audio Dock Controller
 * Controls the ultra-compact playback dock that appears when a song plays.
 */
(function () {
  'use strict';

  function initAudioDock() {
    const dock = document.getElementById('audioMiniDock');
    if (!dock) return;

    const trackNameEl = document.getElementById('dockTrackName');
    const playBtn = document.getElementById('dockPlayBtn');
    const prevBtn = document.getElementById('dockPrevBtn');
    const nextBtn = document.getElementById('dockNextBtn');

    function updateDockUI(detail) {
      if (!detail) {
        if (window.iPodAudio) {
          const track = window.iPodAudio.getCurrentTrack();
          const playing = window.iPodAudio.isPlaying();
          detail = { track, isPlaying: playing };
        } else {
          return;
        }
      }

      const { track, isPlaying } = detail;

      // Update track title
      if (track && trackNameEl) {
        trackNameEl.textContent = `${track.title} · ${track.artist}`;
        trackNameEl.title = `${track.title} by ${track.artist}`;
      }

      // Update play/pause icon
      if (playBtn) {
        playBtn.textContent = isPlaying ? '⏸' : '▶';
        playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
      }

      // Show dock when active
      if (isPlaying) {
        dock.classList.add('is-active');
      }
    }

    // Button interactions
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.iPodAudio) {
          window.iPodAudio.togglePlay();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.iPodAudio) {
          window.iPodAudio.prevTrack();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.iPodAudio) {
          window.iPodAudio.nextTrack();
        }
      });
    }

    // Listen to iPod player events
    window.addEventListener('ipod:play', (e) => {
      updateDockUI(e.detail);
      dock.classList.add('is-active');
    });

    window.addEventListener('ipod:pause', (e) => {
      updateDockUI(e.detail);
    });

    window.addEventListener('ipod:trackchange', (e) => {
      updateDockUI(e.detail);
    });

    window.addEventListener('ipod:statechange', (e) => {
      updateDockUI(e.detail);
    });

    // Check initial state after initialization
    setTimeout(() => {
      updateDockUI();
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAudioDock);
  } else {
    initAudioDock();
  }
})();
