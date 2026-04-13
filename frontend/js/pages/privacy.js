/**
 * LabourGuard - Privacy Page
 * Handles navigation highlighting, scroll spy, and navbar behavior
 */

// ══════════════════════════════════════════════════════════════════
// DOM Elements
// ══════════════════════════════════════════════════════════════════

const navbar = document.getElementById('navbar');
const tocLinks = document.querySelectorAll('.privacy-toc-list a');
const sections = document.querySelectorAll('.privacy-section');

// ══════════════════════════════════════════════════════════════════
// Navbar Scroll Effect
// ══════════════════════════════════════════════════════════════════

const handleScroll = () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  
  // Update active TOC link based on scroll position
  updateActiveTocLink();
};

// ══════════════════════════════════════════════════════════════════
// Scroll Spy for Table of Contents
// ══════════════════════════════════════════════════════════════════

const updateActiveTocLink = () => {
  const scrollPosition = window.scrollY + 150;
  
  let currentSection = '';
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSection = section.getAttribute('id');
    }
  });
  
  tocLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentSection}`) {
      link.classList.add('active');
    }
  });
};

// ══════════════════════════════════════════════════════════════════
// Smooth Scroll for TOC Links
// ══════════════════════════════════════════════════════════════════

tocLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('href').substring(1);
    const targetSection = document.getElementById(targetId);
    
    if (targetSection) {
      const offsetTop = targetSection.offsetTop - 100;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ══════════════════════════════════════════════════════════════════
// Mobile Menu
// ══════════════════════════════════════════════════════════════════

const mobileMenuBtn = document.getElementById('mobile-menu-btn');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    // Mobile menu functionality can be expanded here
    // For now, navigate to main page
    window.location.href = 'index.html';
  });
}

// ══════════════════════════════════════════════════════════════════
// Initialize
// ══════════════════════════════════════════════════════════════════

window.addEventListener('scroll', handleScroll);
handleScroll();

// Set first TOC link as active on load if at top
if (window.scrollY < 100 && tocLinks.length > 0) {
  tocLinks[0].classList.add('active');
}
