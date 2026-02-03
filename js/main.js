document.addEventListener('DOMContentLoaded', () => {
    // --- Scroll Animations ---
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- Navbar Scroll Effect ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // --- Theme Management ---
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const icon = themeToggle.querySelector('i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
            localStorage.setItem('sun-theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
        });
    }

    // Load saved theme
    if (localStorage.getItem('sun-theme') === 'light') {
        document.body.classList.add('light-mode');
        const icon = themeToggle?.querySelector('i');
        if (icon) { icon.classList.replace('fa-moon', 'fa-sun'); }
    }

    // --- Personalization Options ---
    const accentColors = document.querySelectorAll('.accent-picker');
    accentColors.forEach(picker => {
        picker.addEventListener('click', () => {
            const theme = picker.dataset.theme;
            document.body.classList.remove('theme-blue', 'theme-emerald', 'theme-rose');
            if (theme !== 'gold') document.body.classList.add(`theme-${theme}`);
            localStorage.setItem('sun-accent', theme);
        });
    });

    const savedAccent = localStorage.getItem('sun-accent');
    if (savedAccent && savedAccent !== 'gold') {
        document.body.classList.add(`theme-${savedAccent}`);
    }
});
