/**
 * Personal Portfolio - Main Script
 * Vanilla JavaScript implementation for interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation state and smooth scrolling
    initNavigation();
    
    // 2. Scroll reveal animations
    initScrollReveal();
    
    // 3. Form validation
    initContactForm();
    
    // 4. Back to top button
    initBackToTop();
});

/**
 * Initialize Navigation behaviors
 */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    
    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Active section indicator
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            // Add offset for sticky header
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Mobile menu toggle
    mobileToggle.addEventListener('click', () => {
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
        navLinksContainer.classList.toggle('active');
        
        // Animate hamburger icon
        const bars = mobileToggle.querySelectorAll('.bar');
        if (!isExpanded) {
            bars[0].style.transform = 'translateY(7px) rotate(45deg)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    });
    
    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinksContainer.classList.contains('active')) {
                mobileToggle.click(); // Trigger close
            }
        });
    });
}

/**
 * Initialize Scroll Reveal Animations
 */
function initScrollReveal() {
    // Add reveal class to sections/elements we want to animate
    const revealElements = [
        '.section-header', 
        '.about-text', 
        '.about-meta',
        '.skill-category',
        '.project-card',
        '.timeline-item',
        '.cert-card',
        '.edu-card',
        '.contact-info',
        '.contact-form-container'
    ];
    
    const elementsToReveal = document.querySelectorAll(revealElements.join(', '));
    elementsToReveal.forEach(el => el.classList.add('reveal'));
    
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, revealOptions);
    
    elementsToReveal.forEach(el => revealObserver.observe(el));
}

/**
 * Initialize Contact Form Validation
 */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    
    const formStatus = document.getElementById('formStatus');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        
        // Simple validation
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        
        // Name validation
        if (!nameInput.value.trim()) {
            setFormError(nameInput, true);
            isValid = false;
        } else {
            setFormError(nameInput, false);
        }
        
        // Email validation (basic regex)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value.trim())) {
            setFormError(emailInput, true);
            isValid = false;
        } else {
            setFormError(emailInput, false);
        }
        
        // Message validation
        if (!messageInput.value.trim()) {
            setFormError(messageInput, true);
            isValid = false;
        } else {
            setFormError(messageInput, false);
        }
        
        if (isValid) {
            // Simulate form submission since we have no backend
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                formStatus.textContent = "Thank you! Your message has been received (simulated).";
                formStatus.className = 'form-status success';
                form.reset();
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
                
                // Hide status message after 5 seconds
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            }, 1000);
        }
    });
    
    // Clear error on input
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            setFormError(input, false);
        });
    });
}

function setFormError(inputElement, isError) {
    const formGroup = inputElement.closest('.form-group');
    if (isError) {
        formGroup.classList.add('error');
    } else {
        formGroup.classList.remove('error');
    }
}

/**
 * Initialize Back to Top Button
 */
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
