export async function initScrollDamping() {
  let lenisInstance = null;

  try {

    const { default: Lenis } = await import('lenis');

    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.25,
      infinite: false
    });

    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    window.lenis = lenisInstance;

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const hash = anchor.getAttribute('href');
        if (hash && hash.length > 1) {
          const target = document.querySelector(hash);
          if (target) {
            e.preventDefault();
            lenisInstance.scrollTo(target, {
              offset: -65,
              duration: 1.3,
              easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
            });

            history.pushState(null, '', hash);
          }
        }
      });
    });

    return lenisInstance;
  } catch (err) {
    console.warn('[Scroll Damping] Lenis ESM unavailable, engaging native momentum dampener:', err);
    initNativeScrollDampener();
  }
}

function initNativeScrollDampener() {
  let currentY = window.scrollY;
  let targetY = window.scrollY;
  let isDamping = false;
  const dampingFactor = 0.085;

  window.addEventListener('wheel', (e) => {

    if (e.ctrlKey) return;

    e.preventDefault();
    targetY = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        targetY + e.deltaY * 0.95
      )
    );

    if (!isDamping) {
      isDamping = true;
      requestAnimationFrame(updateScroll);
    }
  }, { passive: false });

  function updateScroll() {
    const diff = targetY - currentY;
    currentY += diff * dampingFactor;

    window.scrollTo(0, Math.round(currentY));

    if (Math.abs(diff) > 0.5) {
      requestAnimationFrame(updateScroll);
    } else {
      currentY = targetY;
      window.scrollTo(0, targetY);
      isDamping = false;
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const hash = anchor.getAttribute('href');
      if (hash && hash.length > 1) {
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          targetY = target.getBoundingClientRect().top + window.scrollY - 65;
          if (!isDamping) {
            isDamping = true;
            requestAnimationFrame(updateScroll);
          }
          history.pushState(null, '', hash);
        }
      }
    });
  });
}
