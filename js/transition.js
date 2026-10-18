document.addEventListener("DOMContentLoaded", () => {
    const curtain = document.getElementById('curtain');
    if (!curtain) return;

    // Reveal page on load: slide curtain DOWN and OUT (100%)
    gsap.set(curtain, { yPercent: 0 });
    gsap.to(curtain, {
        yPercent: 100,
        duration: 0.65,
        ease: "power3.inOut"
    });

    // Intercept navigation clicks
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetUrl = link.getAttribute('href');
            
            // Ignore links that don't go anywhere
            if (!targetUrl || targetUrl === '#' || link.target === '_blank') return;
            
            // If already on the page, don't transition
            if (targetUrl === window.location.pathname.split('/').pop() || (targetUrl === 'index.html' && window.location.pathname.endsWith('/'))) {
                return;
            }

            e.preventDefault();

            // Slide curtain DOWN from top (-100% to 0%) to cover screen
            gsap.set(curtain, { yPercent: -100 });
            gsap.to(curtain, {
                yPercent: 0,
                duration: 0.65,
                ease: "power3.inOut",
                onComplete: () => {
                    window.location.href = targetUrl;
                }
            });
        });
    });
});
