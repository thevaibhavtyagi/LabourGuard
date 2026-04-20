/**
 * ═══════════════════════════════════════════════════════════════
 * LabourGuard - Landing Page Engineering (Master Edition)
 * Core Interactivity, Animations, and 3D Data Ocean Rendering
 * ═══════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initPremiumDataWave();
  initTimelineAnimation();
  console.log('LabourGuard Master Engine: Online');
});

/**
 * 1. Floating Pill Navbar & Mobile Menu Logic
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
  
  updateHeaderState();

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

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        if (nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          nav.style.display = 'none';
          if (navbarActions) navbarActions.style.display = 'none';
        }
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });
}

/**
 * 2. Enterprise Scroll Reveal Animations
 */
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  const revealOptions = { root: null, rootMargin: '0px 0px -50px 0px', threshold: 0.1 };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  }, revealOptions);

  reveals.forEach(reveal => revealObserver.observe(reveal));
}

/**
 * 3. High-Fidelity 3D "Data Ocean" Background
 */
function initPremiumDataWave() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width, height;
  let time = 0;
  const cols = 45;
  const rows = 25;
  const spacing = 50;
  
  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, width, height);
    time += 0.015;
    const yOffset = height * 0.55;
    ctx.fillStyle = 'rgba(79, 70, 229, 0.6)';

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing - (cols * spacing) / 2;
        const z = j * spacing;
        const y = Math.sin(i * 0.3 + time) * 25 + Math.sin(j * 0.2 + time) * 25;
        const fov = 400;
        const scale = fov / (fov + z);
        const screenX = width / 2 + x * scale;
        const screenY = yOffset + y * scale + (z * 0.4);

        if (screenY > 0 && screenY < height && screenX > 0 && screenX < width) {
          const radius = Math.max(0.5, 2.5 * scale);
          ctx.beginPath();
          ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

/**
 * 4. Master Timeline Animation
 * Smooth scroll tracking for progress bar and node activation
 */
function initTimelineAnimation() {
  const fill = document.querySelector('.timeline-progress-fill');
  const items = document.querySelectorAll('.timeline-item');
  const wrapper = document.querySelector('.timeline-grid');
  
  if (!fill || !wrapper) return;

  let ticking = false;

  function updateTimeline() {
    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const triggerPoint = viewportHeight * 0.75;
    
    // Map vertical scroll distance to horizontal progress
    let progress = ((triggerPoint - rect.top) / rect.height) * 100;
    progress = Math.min(100, Math.max(0, progress));
    
    fill.style.width = `${progress}%`;
    
    items.forEach((item, index) => {
       // Precise grid placements: ~16%, 50%, 83%
       const trigger = index === 0 ? 16 : (index === 1 ? 50 : 83);
       if (progress >= trigger) {
          item.classList.add('is-active');
       } else {
          item.classList.remove('is-active');
       }
    });
    
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateTimeline);
      ticking = true;
    }
  }, { passive: true });
  
  // Initial run
  updateTimeline();
}