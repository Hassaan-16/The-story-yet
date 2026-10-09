import { initScrollDamping } from './scroll-damping.js';
import { getTechIcon } from './icons.js';
import { initSpaRouter } from './spa-router.js';

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
      // Multi-position organization (e.g. NUCES FinTech Society, GDSC)
      if (a.positions && a.positions.length > 0) {
        const positionsHtml = a.positions.map((p, idx) => {
          const bulletsHtml = p.bullets && p.bullets.length > 0
            ? `<ul class="annal-bullets-list">${p.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
            : (p.treatise ? `<p class="annal-narrative">${p.treatise}</p>` : '');

          const metaParts = [p.period, p.duration, p.employmentType, p.location].filter(Boolean);
          const metaString = metaParts.join(' &middot; ');

          return `
            <div class="annal-nested-role ${idx < a.positions.length - 1 ? 'has-subsequent' : ''}">
              <div class="nested-role-spine">
                <span class="nested-role-dot" aria-hidden="true"></span>
              </div>
              <div class="nested-role-details">
                <div class="nested-role-top">
                  <h4 class="nested-role-name">${p.role}</h4>
                  <span class="annal-meta-date">${metaString}</span>
                </div>
                ${bulletsHtml}
              </div>
            </div>
          `;
        }).join('');

        const orgMetaParts = [a.employmentType, a.location].filter(Boolean);
        const orgMetaString = orgMetaParts.join(' &middot; ');

        return `
          <article class="comic-annal-item">
            <div class="annal-badge-box">${a.numeral}</div>
            <div class="annal-body-panel">
              <div class="annal-top-row">
                <div>
                  <h3 class="annal-role-title">${a.institution}</h3>
                  ${a.totalTenure ? `<span class="annal-tenure-tag">${a.totalTenure}</span>` : ''}
                </div>
                ${orgMetaString ? `<span class="annal-meta-date">${orgMetaString}</span>` : ''}
              </div>
              <div class="annal-nested-roles-container">
                ${positionsHtml}
              </div>
            </div>
          </article>
        `;
      }

      // Single position
      const bulletsHtml = a.bullets && a.bullets.length > 0
        ? `<ul class="annal-bullets-list">${a.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
        : (a.treatise ? `<p class="annal-narrative">${a.treatise}</p>` : '');

      const metaParts = [a.period, a.duration, a.employmentType, a.location].filter(Boolean);
      const metaString = metaParts.join(' &middot; ');

      return `
        <article class="comic-annal-item">
          <div class="annal-badge-box">${a.numeral}</div>
          <div class="annal-body-panel">
            <div class="annal-top-row">
              <div>
                <h3 class="annal-role-title">${a.role}</h3>
                <span class="annal-org">${a.institution}</span>
              </div>
              <span class="annal-meta-date">${metaString}</span>
            </div>

            ${bulletsHtml}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderAcademies() {
    const container = document.getElementById('academiesContainer');
    if (!container || !ARCHIVES || !ARCHIVES.academies) return;

    container.innerHTML = ARCHIVES.academies.map((ac) => {
      const courseBadgeHtml = ac.coursesCount
        ? `<span class="diploma-course-count-badge">★ ${ac.coursesCount}</span>`
        : '';

      const domainsHtml = ac.domains && ac.domains.length > 0
        ? `
          <div class="diploma-domains-block">
            <span class="diploma-domains-label">5 Core Exam Domains:</span>
            <ul class="diploma-domains-list">
              ${ac.domains.map(d => `<li><span class="domain-bullet">▸</span> <span>${d}</span></li>`).join('')}
            </ul>
          </div>
        `
        : '';

      const bulletsHtml = ac.bullets && ac.bullets.length > 0
        ? `
          <div class="diploma-domains-block">
            <span class="diploma-domains-label">Key Deliverables &amp; Simulation Scope:</span>
            <ul class="diploma-domains-list">
              ${ac.bullets.map(b => `<li><span class="domain-bullet">▸</span> <span>${b}</span></li>`).join('')}
            </ul>
          </div>
        `
        : '';

      return `
        <div class="comic-diploma-card">
          <div class="diploma-top-row">
            <div>
              <div class="diploma-title-row">
                <h4 class="diploma-name">${ac.credential}</h4>
                ${courseBadgeHtml}
              </div>
              <span class="diploma-source">${ac.institution}</span>
            </div>
            <span class="diploma-pill">${ac.badge}</span>
          </div>

          <p class="diploma-summary">${ac.domain}</p>
          ${domainsHtml}
          ${bulletsHtml}
          <span class="diploma-date-tag">${ac.date}</span>
        </div>
      `;
    }).join('');
  }

  function renderSkills() {
    const container = document.getElementById('skillsContainer');
    if (!container || !ARCHIVES || !ARCHIVES.compendium) return;

    const sections = [
      { key: 'languages', title: 'Programming Languages', icon: '⚡' },
      { key: 'frameworks', title: 'Frameworks & Libraries', icon: '✦' },
      { key: 'databases', title: 'Databases & Storage', icon: '🗄' },
      { key: 'infrastructure', title: 'DevOps & Infrastructure', icon: '⚙' },
      { key: 'cloud_ai', title: 'Cloud & AI Platforms', icon: '☁' },
      { key: 'observability', title: 'Observability & Monitoring', icon: '📊' },
      { key: 'security', title: 'Security & Threat Mitigation', icon: '🛡' },
      { key: 'networking', title: 'Networking & Systems', icon: '🌐' },
      { key: 'tools_agile', title: 'Tools & Agile Methodologies', icon: '📋' },
      { key: 'soft_skills', title: 'Leadership & Soft Skills', icon: '🤝' }
    ];

    container.innerHTML = sections.map((sec) => {
      const items = ARCHIVES.compendium[sec.key];
      if (!items || items.length === 0) return '';

      const chips = items.map((item) => `
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
    }).filter(Boolean).join('');
  }

  function renderContactServices() {
    const container = document.getElementById('contactServicesContainer');
    if (!container || !ARCHIVES || !ARCHIVES.compendium || !ARCHIVES.compendium.services) return;

    container.innerHTML = ARCHIVES.compendium.services.map((item) => `
      <div class="service-card-chip">
        ${getTechIcon(item.name)}
        <div class="service-chip-content">
          <span class="service-chip-name">${item.name}</span>
          <span class="service-chip-desc">${item.proficiency}</span>
        </div>
      </div>
    `).join('');
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

    if (navLinks) {
      const pathname = window.location.pathname;
      const rawPage = pathname.split('/').pop().replace(/\.html$/, '');
      const pageName = (!rawPage || rawPage === 'index') ? 'index' : rawPage;

      navLinks.querySelectorAll('a').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        const linkPage = href.split('#')[0].split('/').pop().replace(/\.html$/, '');
        const isMatch = (pageName === 'index' && (linkPage === 'index' || linkPage === '')) ||
                        (pageName !== 'index' && linkPage === pageName);

        if (isMatch) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        } else if (pageName !== '') {
          // ensure only matching page is active if route changed
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    renderExperience();
    renderAcademies();
    renderSkills();
    renderContactServices();

    initNavigation();
    initSpaRouter();

    initScrollDamping();
  });
})();
