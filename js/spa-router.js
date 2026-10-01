/**
 * SPA Router for Single Page Application navigation
 * Keeps audio playback and 3D iPod state persistent across all views.
 */

export function initSpaRouter() {
  const spaContainer = document.getElementById('spaMain');
  if (!spaContainer) {
    // Non-SPA page (e.g. standalone gallery.html) - do not intercept navigation
    return;
  }

  const routes = ['overview', 'projects', 'experience', 'credentials', 'skills', 'contact'];
  const defaultRoute = 'overview';

  function getRouteFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (routes.includes(hash)) {
      return hash;
    }
    return defaultRoute;
  }

  function setActiveView(route) {
    const validRoute = routes.includes(route) ? route : defaultRoute;

    // 1. Toggle view panels
    const views = document.querySelectorAll('.spa-view');
    views.forEach(view => {
      const viewRoute = view.getAttribute('data-route');
      if (viewRoute === validRoute) {
        view.classList.add('is-active');
        view.removeAttribute('hidden');
      } else {
        view.classList.remove('is-active');
        view.setAttribute('hidden', '');
      }
    });

    // 2. Update navbar active indicators
    const navLinks = document.querySelectorAll('.comic-navbar a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkRoute = link.getAttribute('data-route') || href.replace(/^#\/?/, '').toLowerCase();
      
      if (linkRoute === validRoute) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      } else if (routes.includes(linkRoute) || linkRoute === 'index') {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      }
    });

    // 3. Scroll to top instantly
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // 4. Notify any listeners (e.g. scroll damping, WebGL pause/resume)
    window.dispatchEvent(new CustomEvent('spa:routechange', { detail: { route: validRoute } }));
  }

  // Intercept clicks on internal SPA links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // If clicking on gallery.html or external links, let browser navigate normally
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.includes('.pdf') ||
      href.includes('gallery.html')
    ) {
      return;
    }

    let targetRoute = null;

    if (href.startsWith('#')) {
      targetRoute = href.replace(/^#\/?/, '').trim().toLowerCase();
    } else if (href.includes('#')) {
      const [path, hash] = href.split('#');
      const page = path.split('/').pop().replace(/\.html$/, '').toLowerCase();
      if (!page || page === 'index') {
        targetRoute = (hash || '').trim().toLowerCase();
      }
    } else if (href.endsWith('.html')) {
      const page = href.split('/').pop().replace(/\.html$/, '').toLowerCase();
      if (routes.includes(page)) {
        targetRoute = page;
      } else if (page === 'index') {
        targetRoute = defaultRoute;
      }
    } else if (href === '/' || href === './') {
      targetRoute = defaultRoute;
    }

    if (targetRoute && routes.includes(targetRoute)) {
      e.preventDefault();
      const currentHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      const newHash = targetRoute === defaultRoute ? '' : `#${targetRoute}`;
      if (currentHash !== targetRoute) {
        history.pushState(null, '', newHash || window.location.pathname);
      }
      setActiveView(targetRoute);
    }
  });

  // Listen to browser Back / Forward buttons
  window.addEventListener('popstate', () => {
    const route = getRouteFromHash();
    setActiveView(route);
  });

  // Listen to hash changes (fallback/compatibility)
  window.addEventListener('hashchange', () => {
    const route = getRouteFromHash();
    setActiveView(route);
  });

  // Initial view activation
  const initialRoute = getRouteFromHash();
  setActiveView(initialRoute);
}
