/**
 * ═══════════════════════════════════════════════════════════════
 * LabourGuard - Methodology/Privacy Page Engineering
 * Handles scroll animations and floating navigation logic
 * ═══════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  console.log('LabourGuard Methodology Engine: Online');
});

/**
 * Floating Pill Navbar Logic
 * Identical to landing page for absolute consistency across platform.
 */
function initNavbar() {
  const header = document.getElementById('navbar');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const nav = document.querySelector('.navbar-nav');
  const navbarActions = document.querySelector('.navbar-actions');
  
  let ticking = false;

  function updateHeaderState() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  }, { passive: true });
  
  // Trigger immediately on load in case user is already scrolled down
  updateHeaderState();

  // Mobile menu toggle logic
  if (mobileBtn && nav) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.contains('is-open');
      
      if (isOpen) {
        nav.classList.remove('is-open');
        nav.style.display = 'none';
        if (navbarActions) navbarActions.style.display = 'none';
      } else {
        nav.classList.add('is-open');
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.width = '100%';
        nav.style.background = 'var(--color-white)';
        nav.style.padding = 'var(--space-6)';
        nav.style.borderRadius = 'var(--radius-xl)';
        nav.style.boxShadow = 'var(--shadow-xl)';
        nav.style.marginTop = 'var(--space-2)';
        
        if (navbarActions) {
          navbarActions.style.display = 'flex';
          navbarActions.style.flexDirection = 'column';
          navbarActions.style.width = '100%';
        }
      }
    });
  }
}

/**
 * High-Fidelity Scroll Reveal Animations
 * Uses Intersection Observer to trigger `.stagger-enter` elements
 */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.stagger-enter');
  
  // Automatically trigger elements that are visible on load
  setTimeout(() => {
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add('show');
      }
    });
  }, 100);

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target); // Only animate once
      }
    });
  }, observerOptions);

  elements.forEach(el => observer.observe(el));
}