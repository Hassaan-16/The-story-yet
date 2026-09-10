import { initScrollDamping } from './scroll-damping.js';
import { getTechIcon } from './icons.js';

(function () {
  'use strict';

  const ARCHIVES = window.MHS_ARCHIVES;

  function renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!container || !ARCHIVES || !ARCHIVES.treatises) return;

    container.innerHTML = ARCHIVES.treatises.map((t) => {
      const techItems = t.tech.map((techName) => `
        <li class="comic-tech-tag">
          ${getTechIcon(techName)}
          <span>${techName}</span>
        </li>
      `).join('');

      return `
        <article class="comic-card">
          <div>
            <div class="comic-card-head">
              <span class="comic-category-badge">${t.category}</span>
              <div class="comic-metric-stamp">${t.metric}</div>
            </div>

            <h3 class="comic-card-title">${t.title}</h3>
            <p class="comic-card-subtitle">${t.subtitle}</p>
            <p class="comic-card-abstract">${t.abstract}</p>
          </div>

          <div>
            <ul class="comic-tech-list">
              ${techItems}
            </ul>

            <div class="comic-card-footer">
              <span class="comic-card-year">${t.year}</span>
              <a href="${t.repo}" target="_blank" rel="noopener" class="comic-card-link">
                <span>INSPECT REPO</span>
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderExperience() {
    const container = document.getElementById('experienceContainer');
    if (!container || !ARCHIVES || !ARCHIVES.annals) return;

    container.innerHTML = ARCHIVES.annals.map((a) => {
      return `
        <article class="comic-annal-item">
          <div class="annal-badge-box">${a.numeral}</div>
          <div class="annal-body-panel">
            <div class="annal-top-row">
              <div>
                <h3 class="annal-role-title">${a.role}</h3>
                <span class="annal-org">${a.institution}</span>
              </div>
              <span class="annal-meta-date">${a.period} &middot; ${a.location}</span>
            </div>

            <p class="annal-narrative">${a.treatise}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderAcademies() {
    const container = document.getElementById('academiesContainer');
    if (!container || !ARCHIVES || !ARCHIVES.academies) return;

    container.innerHTML = ARCHIVES.academies.map((ac) => {
      return `
        <div class="comic-diploma-card">
          <div class="diploma-top-row">
            <div>
              <h4 class="diploma-name">${ac.credential}</h4>
              <span class="diploma-source">${ac.institution}</span>
            </div>
            <span class="diploma-pill">${ac.badge}</span>
          </div>

          <p class="diploma-summary">${ac.domain}</p>
          <span class="diploma-date-tag">${ac.date}</span>
        </div>
      `;
    }).join('');
  }

  function renderSkills() {
    const container = document.getElementById('skillsContainer');
    if (!container || !ARCHIVES || !ARCHIVES.compendium) return;

    const sections = [
      {
        key: 'languages',
        title: 'Core Programming Languages & Systems',
        icon: '⚡'
      },
      {
        key: 'frameworks',
        title: 'Frameworks, Machine Learning & Analytics',
        icon: '✦'
      },
      {
        key: 'infrastructure',
        title: 'Infrastructure, DevOps & Cloud Systems',
        icon: '⚙'
      }
    ];

    container.innerHTML = sections.map((sec) => {
      const chips = ARCHIVES.compendium[sec.key].map((item) => `
        <div class="comic-skill-chip">
          ${getTechIcon(item.name)}
          <div class="skill-meta-wrap">
            <span class="skill-chip-name">${item.name}</span>
            <span class="skill-chip-level">${item.proficiency}</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="comic-skill-group">
          <div class="skill-group-head">
            <span class="skill-group-icon" aria-hidden="true">${sec.icon}</span>
            <h3 class="skill-group-title">${sec.title}</h3>
          </div>

          <div class="comic-skill-tags-grid">
            ${chips}
          </div>
        </div>
      `;
    }).join('');
  }

  function initNavigation() {
    const navLinks = document.getElementById('navLinks');
    const mobileToggle = document.getElementById('mobileNavToggle');

    if (mobileToggle && navLinks) {
      mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('is-open');
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('is-open');
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    renderExperience();
    renderAcademies();
    renderSkills();

    initNavigation();

    initScrollDamping();
  });
})();
