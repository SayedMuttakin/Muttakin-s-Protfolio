const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:5000/api`
    : '/api';


document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Fetch & Render Settings
    try {
        const settingsRes = await fetch(`${API_URL}/settings`);
        const settings = await settingsRes.json();
        
        const emailBtn = document.getElementById('dynamic-email');
        const waBtn = document.getElementById('dynamic-whatsapp');
        
        if (emailBtn && settings.email) {
            emailBtn.href = `mailto:${settings.email}`;
        }
        if (waBtn && settings.whatsapp) {
            waBtn.href = settings.whatsapp;
        }
    } catch (e) { console.error('Settings fetch error:', e); }

    // 2. Fetch & Render Slider Images
    try {
        const sliderRes = await fetch(`${API_URL}/slider-images`);
        const sliderImages = await sliderRes.json();
        
        if (sliderImages.length > 0) {
            const marquee1 = document.getElementById('marquee-content-1');
            const marquee2 = document.getElementById('marquee-content-2');
            
            let html = '';
            sliderImages.forEach(img => {
                html += `<img src="${img.imageUrl}" alt="${img.altText}" loading="lazy">`;
            });
            
            if (marquee1) {
                marquee1.innerHTML = html;
                marquee1.nextElementSibling.innerHTML = html; // duplicate for seamless scroll
            }
            if (marquee2) {
                marquee2.innerHTML = html;
                marquee2.nextElementSibling.innerHTML = html; // duplicate for seamless scroll
            }
        }
    } catch (e) { console.error('Slider fetch error:', e); }

    // 3. Fetch & Render Highlights
    try {
        const projectsRes = await fetch(`${API_URL}/projects`);
        const projects = await projectsRes.json();
        
        const highlightsContainer = document.getElementById('dynamic-highlights');
        if (highlightsContainer && projects.length > 0) {
            let html = '';
            projects.slice(0, 4).forEach(p => { // Show top 4
                html += `
                    <a href="${p.projectUrl}" target="_blank" class="highlight-card reveal active" style="text-decoration: none;">
                        <div class="highlight-image-wrapper">
                            <img src="${p.imageUrl}" alt="${p.title}" loading="lazy">
                        </div>
                        <div class="highlight-content">
                            <h3 class="highlight-title">${p.title}</h3>
                            <div class="highlight-tags">
                                ${p.tags.map(t => `<span class="highlight-tag">${t}</span>`).join('')}
                            </div>
                        </div>
                    </a>
                `;
            });
            highlightsContainer.innerHTML = html;
        }
    } catch (e) { console.error('Projects fetch error:', e); }

    // 4. Fetch & Render Testimonials (Dynamic from API)
    try {
        const testContainer = document.getElementById('dynamic-testimonials');

        // Show loading state immediately (replace static HTML)
        if (testContainer) {
            testContainer.innerHTML = `
                <div class="testimonial-slider-track" style="display:flex;align-items:center;justify-content:center;min-height:300px;">
                    <p style="color:rgba(255,255,255,0.3);font-size:14px;">Loading reviews...</p>
                </div>`;
        }

        const testRes = await fetch(`${API_URL}/testimonials`);
        const testimonials = await testRes.json();

        if (testContainer && testimonials.length > 0) {
            let html = '';
            testimonials.forEach((t) => {
                html += `
                    <div class="testimonial-slide">
                        <img src="${t.imageUrl}" alt="5-star review screenshot" loading="lazy">
                    </div>
                `;
            });
            testContainer.innerHTML = `<div class="testimonial-slider-track">${html}</div>`;

            const track = testContainer.querySelector('.testimonial-slider-track');
            const slides = track.querySelectorAll('.testimonial-slide');
            const prevBtn = document.querySelector('.testimonials-nav .prev-btn');
            const nextBtn = document.querySelector('.testimonials-nav .next-btn');

            let currentIndex = 0;
            let autoSlideInterval;

            function updateSlider() {
                slides.forEach((s, idx) => {
                    s.classList.remove('active', 'prev', 'next');
                    if (idx === currentIndex) {
                        s.classList.add('active');
                    } else if (idx === (currentIndex - 1 + slides.length) % slides.length) {
                        s.classList.add('prev');
                    } else if (idx === (currentIndex + 1) % slides.length) {
                        s.classList.add('next');
                    }
                });
            }

            function goToSlide(index) {
                currentIndex = (index + slides.length) % slides.length;
                updateSlider();
            }

            function startAutoSlide() {
                clearInterval(autoSlideInterval);
                autoSlideInterval = setInterval(() => goToSlide(currentIndex + 1), 4000);
            }

            updateSlider();

            if (prevBtn) prevBtn.onclick = () => { goToSlide(currentIndex - 1); startAutoSlide(); };
            if (nextBtn) nextBtn.onclick = () => { goToSlide(currentIndex + 1); startAutoSlide(); };

            slides.forEach(s => {
                s.addEventListener('click', () => {
                    if (s.classList.contains('prev')) { goToSlide(currentIndex - 1); startAutoSlide(); }
                    else if (s.classList.contains('next')) { goToSlide(currentIndex + 1); startAutoSlide(); }
                });
            });

            startAutoSlide();
            track.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
            track.addEventListener('mouseleave', startAutoSlide);

        } else if (testContainer && testimonials.length === 0) {
            // No testimonials yet — restore static placeholder slides
            testContainer.innerHTML = `
                <div class="testimonial-slider-track">
                    <div class="testimonial-slide active">
                        <img src="images/review1.png" alt="5-star review" loading="lazy">
                    </div>
                    <div class="testimonial-slide next">
                        <img src="images/review2.png" alt="5-star review" loading="lazy">
                    </div>
                    <div class="testimonial-slide prev">
                        <img src="images/review3.png" alt="5-star review" loading="lazy">
                    </div>
                </div>`;
        }
    } catch (e) {
        console.error('Testimonials fetch error:', e);
        // On error — restore static slides so section doesn't look empty
        const testContainer = document.getElementById('dynamic-testimonials');
        if (testContainer) {
            testContainer.innerHTML = `
                <div class="testimonial-slider-track">
                    <div class="testimonial-slide active">
                        <img src="images/review1.png" alt="5-star review" loading="lazy">
                    </div>
                    <div class="testimonial-slide next">
                        <img src="images/review2.png" alt="5-star review" loading="lazy">
                    </div>
                    <div class="testimonial-slide prev">
                        <img src="images/review3.png" alt="5-star review" loading="lazy">
                    </div>
                </div>`;
        }
    }

    // 5. Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Sending...';
            
            const formData = new FormData(contactForm);
            const payload = {
                fullName: formData.get('full_name'),
                email: formData.get('email'),
                whatsapp: formData.get('whatsapp'),
                interestedIn: document.getElementById('interestedIn').value,
                budget: document.getElementById('budgetInput').value,
                projectDetails: formData.get('project_details')
            };

            try {
                const res = await fetch(`${API_URL}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                const msgBox = document.getElementById('formMessage');
                msgBox.style.display = 'block';
                
                if (data.success) {
                    msgBox.className = 'form-message success text-green-500 mb-4';
                    msgBox.textContent = 'Message sent successfully!';
                    contactForm.reset();
                    // Reset pills
                    document.querySelectorAll('.selection-pills button').forEach(b => b.classList.remove('active'));
                    document.getElementById('interestedIn').value = '';
                    document.getElementById('budgetInput').value = '';
                } else {
                    msgBox.className = 'form-message error text-red-500 mb-4';
                    msgBox.textContent = data.message || 'Error sending message.';
                }
            } catch (err) {
                const msgBox = document.getElementById('formMessage');
                msgBox.style.display = 'block';
                msgBox.className = 'form-message error text-red-500 mb-4';
                msgBox.textContent = 'Failed to connect to server.';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Start Your Project';
                setTimeout(() => {
                    const msgBox = document.getElementById('formMessage');
                    if(msgBox) msgBox.style.display = 'none';
                }, 5000);
            }
        });
    }

});
