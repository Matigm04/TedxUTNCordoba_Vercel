// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Sponsors Carousel Functionality
let currentSponsorIndex = 0;
let sponsorInterval;
let isTransitioning = false;
const sponsorItems = document.querySelectorAll('.sponsor-item');
const sponsorDots = document.querySelectorAll('.sponsor-dot');
const sponsorPrevBtn = document.getElementById('sponsorsPrev');
const sponsorNextBtn = document.getElementById('sponsorsNext');
const TRANSITION_DURATION = 2000; // 2000ms (2 seconds) for all transitions
const AUTO_ADVANCE_DELAY = 4000; // 4 seconds between auto advances (2s transition + 2s pause)

if (sponsorItems.length > 0) {
    function showSponsor(newIndex, direction = 'next') {
        if (isTransitioning) return; // Prevent overlapping transitions
        
        isTransitioning = true;
        const currentItem = sponsorItems[currentSponsorIndex];
        const newItem = sponsorItems[newIndex];
        
        // Prepare the new item for smooth entrance
        newItem.style.position = 'absolute';
        newItem.style.top = '0';
        newItem.style.left = '0';
        newItem.style.width = '100%';
        newItem.style.zIndex = '1';
        
        if (direction === 'next') {
            newItem.style.transform = 'translateX(100%)';
        } else {
            newItem.style.transform = 'translateX(-100%)';
        }
        newItem.style.opacity = '1';
        
        // Smooth transition without class jumping
        requestAnimationFrame(() => {
            currentItem.style.transition = 'transform 2s ease-in-out, opacity 2s ease-in-out';
            newItem.style.transition = 'transform 2s ease-in-out, opacity 2s ease-in-out';
            
            // Animate out current item
            if (direction === 'next') {
                currentItem.style.transform = 'translateX(-100%)';
            } else {
                currentItem.style.transform = 'translateX(100%)';
            }
            currentItem.style.opacity = '0';
            
            // Animate in new item
            newItem.style.transform = 'translateX(0)';
            newItem.style.opacity = '1';
        });
        
        // Update dots smoothly
        sponsorDots.forEach(dot => dot.classList.remove('active'));
        if (sponsorDots[newIndex]) {
            sponsorDots[newIndex].classList.add('active');
        }
        
        // Update current index
        currentSponsorIndex = newIndex;
        
        // Clean up after transition
        setTimeout(() => {
            isTransitioning = false;
            
            // Reset all items to default state
            sponsorItems.forEach((item, index) => {
                if (index === currentSponsorIndex) {
                    // Active item
                    item.classList.add('active');
                    item.style.position = 'relative';
                    item.style.transform = '';
                    item.style.opacity = '';
                    item.style.transition = '';
                    item.style.zIndex = '';
                } else {
                    // Inactive items
                    item.classList.remove('active');
                    item.style.position = 'absolute';
                    item.style.transform = 'translateX(100%)';
                    item.style.opacity = '0';
                    item.style.transition = '';
                    item.style.zIndex = '';
                }
            });
        }, TRANSITION_DURATION);
    }

    function nextSponsor() {
        if (isTransitioning) return;
        const newIndex = (currentSponsorIndex + 1) % sponsorItems.length;
        showSponsor(newIndex, 'next');
    }

    function prevSponsor() {
        if (isTransitioning) return;
        const newIndex = (currentSponsorIndex - 1 + sponsorItems.length) % sponsorItems.length;
        showSponsor(newIndex, 'prev');
    }

    function goToSponsor(index) {
        if (isTransitioning || index === currentSponsorIndex) return;
        
        // Stop current timer immediately
        clearInterval(sponsorInterval);
        
        const direction = index > currentSponsorIndex ? 'next' : 'prev';
        showSponsor(index, direction);
        
        // Restart timer after the manual interaction
        resetSponsorInterval();
    }

    function resetSponsorInterval() {
        clearInterval(sponsorInterval);
        // Wait for current transition to complete before starting new timer
        setTimeout(() => {
            if (!isTransitioning) {
                sponsorInterval = setInterval(nextSponsor, AUTO_ADVANCE_DELAY);
            } else {
                // If still transitioning, wait and try again
                setTimeout(() => {
                    sponsorInterval = setInterval(nextSponsor, AUTO_ADVANCE_DELAY);
                }, TRANSITION_DURATION);
            }
        }, 100);
    }

    // Event listeners
    if (sponsorNextBtn) {
        sponsorNextBtn.addEventListener('click', () => {
            if (!isTransitioning) {
                clearInterval(sponsorInterval); // Stop immediately
                nextSponsor();
                resetSponsorInterval(); // Restart timer after interaction
            }
        });
    }

    if (sponsorPrevBtn) {
        sponsorPrevBtn.addEventListener('click', () => {
            if (!isTransitioning) {
                clearInterval(sponsorInterval); // Stop immediately
                prevSponsor();
                resetSponsorInterval(); // Restart timer after interaction
            }
        });
    }

    sponsorDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (!isTransitioning && index !== currentSponsorIndex) {
                clearInterval(sponsorInterval); // Stop immediately
                goToSponsor(index);
                // goToSponsor already calls resetSponsorInterval internally
            }
        });
    });

    // Initialize carousel with smooth setup
    sponsorItems.forEach((item, index) => {
        if (index === 0) {
            item.classList.add('active');
            item.style.position = 'relative';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        } else {
            item.classList.remove('active');
            item.style.position = 'absolute';
            item.style.opacity = '0';
            item.style.transform = 'translateX(100%)';
        }
    });
    
    if (sponsorDots[0]) {
        sponsorDots[0].classList.add('active');
    }
    
    sponsorInterval = setInterval(nextSponsor, AUTO_ADVANCE_DELAY);

    // Pause auto-play on hover
    const sponsorCarousel = document.querySelector('.sponsors-carousel');
    if (sponsorCarousel) {
        sponsorCarousel.addEventListener('mouseenter', () => {
            clearInterval(sponsorInterval);
        });

        sponsorCarousel.addEventListener('mouseleave', () => {
            // Always restart the timer when mouse leaves, regardless of transition state
            clearInterval(sponsorInterval);
            setTimeout(() => {
                sponsorInterval = setInterval(nextSponsor, AUTO_ADVANCE_DELAY);
            }, 100);
        });
    }
}

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar background on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
    }
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-card, .about-text, .about-image').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// Form validation for inscriptions page
function validateForm() {
    const form = document.getElementById('inscriptionForm');
    if (!form) return true;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else {
            field.classList.remove('error');
        }
    });
    
    // Email validation
    const email = form.querySelector('input[type="email"]');
    if (email && email.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            email.classList.add('error');
            isValid = false;
        }
    }
    
    return isValid;
}

// Accordion Functionality
document.addEventListener('DOMContentLoaded', function() {
    const accordionButtons = document.querySelectorAll('.accordion-btn');
    
    accordionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const icon = this.querySelector('i:last-child');
            
            // Toggle active state
            this.classList.toggle('active');
            content.classList.toggle('active');
            
            // Update button text
            const span = this.querySelector('.btn-content span');
            if (this.classList.contains('active')) {
                if (targetId.includes('oradores')) {
                    span.textContent = 'Ocultar Oradores';
                } else if (targetId.includes('sponsors')) {
                    span.textContent = 'Ocultar Sponsors';
                }
            } else {
                if (targetId.includes('oradores')) {
                    span.textContent = 'Ver Oradores';
                } else if (targetId.includes('sponsors')) {
                    span.textContent = 'Ver Sponsors';
                }
            }
        });
    });
});
