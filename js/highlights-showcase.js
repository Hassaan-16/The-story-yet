/**
 * Highlights Showcase Component (Single Featured Portrait)
 * Displays the single highlight image: 20260213_122049.jpg
 * Located alongside the biography description in the Overview section of index.html
 */

import { HIGHLIGHTS_PHOTOS } from './media-manifest.js';

(function () {
  'use strict';

  const TARGET_IMAGE_SRC = 'assets/highlights/20260213_122049.jpg';
  const TARGET_TITLE = 'M. Hassaan Bin Saqib';
  const TARGET_SPECS = 'Field Archive · Optics 35mm';

  function initSingleHighlight() {
    const pane = document.getElementById('overviewHighlights');
    if (!pane) return;

    const featuredImg = document.getElementById('hlFeaturedImg');
    const titleEl = document.getElementById('hlTitle');
    const specsEl = document.getElementById('hlSpecs');
    const photoWindow = document.getElementById('hlPhotoWindow');

    // Find metadata from manifest if present, else fallback
    let itemData = null;
    const items = Array.isArray(HIGHLIGHTS_PHOTOS) ? HIGHLIGHTS_PHOTOS : (window.__HIGHLIGHTS_PHOTOS__ || []);
    if (items.length > 0) {
      itemData = items.find(it => (it.src && it.src.includes('20260213_122049')) || (it.image && it.image.includes('20260213_122049')));
    }

    const imgSrc = (itemData && (itemData.src || itemData.image)) ? (itemData.src || itemData.image) : TARGET_IMAGE_SRC;
    const imgTitle = (itemData && itemData.title) ? itemData.title : TARGET_TITLE;
    const imgSpecs = (itemData && itemData.specs) ? itemData.specs : TARGET_SPECS;

    if (featuredImg) {
      featuredImg.src = imgSrc;
      featuredImg.alt = imgTitle;
    }
    if (titleEl) {
      titleEl.textContent = TARGET_TITLE;
    }
    if (specsEl) {
      specsEl.textContent = TARGET_SPECS;
    }

    // Fullscreen Lightbox Modal for the single highlight image
    const modal = document.getElementById('overviewLightbox');
    const modalImg = document.getElementById('overviewLightboxImg');
    const modalTitle = document.getElementById('overviewLightboxTitle');
    const modalSpecs = document.getElementById('overviewLightboxSpecs');
    const modalClose = document.getElementById('overviewLightboxClose');

    function openLightbox() {
      if (!modal || !modalImg) return;
      modalImg.src = imgSrc;
      modalImg.alt = imgTitle;
      if (modalTitle) modalTitle.textContent = TARGET_TITLE;
      if (modalSpecs) modalSpecs.textContent = TARGET_SPECS;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      if (!modal) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (photoWindow) {
      photoWindow.addEventListener('click', openLightbox);
      photoWindow.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox();
        }
      });
    }

    if (modalClose) {
      modalClose.addEventListener('click', closeLightbox);
    }
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLightbox();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (modal && modal.classList.contains('is-open') && e.key === 'Escape') {
        closeLightbox();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSingleHighlight);
  } else {
    initSingleHighlight();
  }
})();