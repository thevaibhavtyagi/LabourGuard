/**
 * LabourGuard - Landing Page
 * Handles landing page interactions and animations
 */

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;

const handleScroll = () => {
  const currentScroll = window.scrollY;
  
  if (currentScroll > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
  
  lastScroll = currentScroll;
};

window.addEventListener('scroll', handleScroll);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navbarNav = document.querySelector('.navbar-nav');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    navbarNav.classList.toggle('active');
  });
}

// Intersection Observer for fade-in animations
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const fadeInObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Apply fade-in to cards
document.querySelectorAll('.card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  fadeInObserver.observe(card);
});

// Log for development
console.log('LabourGuard Landing Page Loaded');
