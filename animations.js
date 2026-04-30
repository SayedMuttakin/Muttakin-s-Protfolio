document.addEventListener('DOMContentLoaded', () => {
    const revealElements = document.querySelectorAll('.reveal');

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Get delay from data attribute if exists
                const delay = entry.target.getAttribute('data-delay') || '0s';
                entry.target.style.transitionDelay = delay;

                entry.target.classList.add('active');
                // Once active, we can unobserve if we don't want it to re-animate
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        observer.observe(el);
    });

    // Special handling for elements that should animate immediately on load
    // (like hero section text) if they are already in view.
    // The observer usually handles this, but sometimes a small timeout helps
    // to ensure transitions are visible.
    setTimeout(() => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const delay = el.getAttribute('data-delay') || '0s';
                el.style.transitionDelay = delay;
                el.classList.add('active');
            }
        });
    }, 100);

    // =========================================
    // CUSTOM CURSOR LOGIC (Desktop only)
    // =========================================
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth <= 768;

    const cursor = document.querySelector('.custom-cursor');
    const dot = document.querySelector('.custom-cursor-dot');

    if (cursor && dot && !isTouchDevice && !isSmallScreen) {
        let mouseX = 0;
        let mouseY = 0;
        let cursorX = 0;
        let cursorY = 0;
        let dotX = 0;
        let dotY = 0;

        // Mouse move listener
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            // Show cursor on first movement
            cursor.style.display = 'block';
            dot.style.display = 'block';
        });

        const animateCursor = () => {
            // Smooth interpolation for the outer circle
            cursorX += (mouseX - cursorX) * 0.3;
            cursorY += (mouseY - cursorY) * 0.3;

            // Dot follows exactly
            dotX = mouseX;
            dotY = mouseY;

            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;

            dot.style.left = `${dotX}px`;
            dot.style.top = `${dotY}px`;

            requestAnimationFrame(animateCursor);
        };

        animateCursor();

        // Hover effect for interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .service-card, .testimonial-card, .idea-card, .highlight-card, .nav-item, .submit-btn');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.classList.add('cursor-hover');
            });
            el.addEventListener('mouseleave', () => {
                cursor.classList.remove('cursor-hover');
            });
        });
    } else if (cursor && dot) {
        // Hide custom cursor on mobile/touch
        cursor.style.display = 'none';
        dot.style.display = 'none';
    }
});
