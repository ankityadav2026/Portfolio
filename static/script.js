
/* =========================================
   ANKIT® — CINEMATIC INTERACTIONS
   JAVASCRIPT / VERSION 01
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    /* =====================================
       1. LOADER
    ===================================== */

    const loader = document.getElementById("loader");

    function hideLoader() {
        if (loader) {
            loader.classList.add("hide");
        }
    }

    window.addEventListener("load", hideLoader, { once: true });

    // Fallback in case the load event has already happened.
    if (document.readyState === "complete") {
        hideLoader();
    }

    /* =====================================
       2. CUSTOM CURSOR
    ===================================== */

    const cursor = document.querySelector(".custom-cursor");
    const follower = document.querySelector(".cursor-follower");

    const hasFinePointer = window.matchMedia(
        "(pointer: fine)"
    ).matches;

    if (cursor && follower && hasFinePointer && !prefersReducedMotion) {

        let mouseX = 0;
        let mouseY = 0;
        let followerX = 0;
        let followerY = 0;

        cursor.style.opacity = "1";
        follower.style.opacity = "1";

        document.addEventListener("mousemove", (event) => {
            mouseX = event.clientX;
            mouseY = event.clientY;

            cursor.style.left = mouseX + "px";
            cursor.style.top = mouseY + "px";
        });

        function animateFollower() {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;

            follower.style.left = followerX + "px";
            follower.style.top = followerY + "px";

            requestAnimationFrame(animateFollower);
        }

        animateFollower();

        document.querySelectorAll(
            "a, button, input, textarea, .photo, .hero-portrait"
        ).forEach((element) => {

            element.addEventListener("mouseenter", () => {
                follower.classList.add("active");
            });

            element.addEventListener("mouseleave", () => {
                follower.classList.remove("active");
            });

        });

        document.addEventListener("mouseleave", () => {
            cursor.style.opacity = "0";
            follower.style.opacity = "0";
        });

        document.addEventListener("mouseenter", () => {
            cursor.style.opacity = "1";
            follower.style.opacity = "1";
        });
    }

    /* =====================================
       3. MOBILE NAVIGATION
    ===================================== */

    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector(".navigation");

    if (menuButton && navigation) {

        menuButton.addEventListener("click", () => {

            const isOpen = navigation.classList.toggle("open");

            menuButton.textContent = isOpen ? "✕" : "☰";
            menuButton.setAttribute("aria-expanded", String(isOpen));

        });

        navigation.querySelectorAll("a").forEach((link) => {

            link.addEventListener("click", () => {
                navigation.classList.remove("open");
                menuButton.textContent = "☰";
                menuButton.setAttribute("aria-expanded", "false");
            });

        });

        document.addEventListener("click", (event) => {

            if (
                !navigation.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                navigation.classList.remove("open");
                menuButton.textContent = "☰";
                menuButton.setAttribute("aria-expanded", "false");
            }

        });
    }

    /* =====================================
       4. SCROLL REVEAL
    ===================================== */

    const revealElements = document.querySelectorAll(
        ".section-index, " +
        ".about-section h2, " +
        ".about-content, " +
        ".gallery-heading, " +
        ".photo, " +
        ".film-section > h2, " +
        ".film-container, " +
        ".work-section > h2, " +
        ".work-item, " +
        ".social-section > h2, " +
        ".social-links, " +
        ".contact-section > h2, " +
        ".contact-form, " +
        ".feedback-section > h2, " +
        ".feedback-form"
    );

    if ("IntersectionObserver" in window && !prefersReducedMotion) {

        const revealObserver = new IntersectionObserver(
            (entries, observer) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("visible");

                        observer.unobserve(entry.target);
                    }

                });

            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealElements.forEach((element) => {
            element.classList.add("reveal");
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach((element) => {
            element.classList.add("visible");
        });

    }

    /* =====================================
       5. IMAGE FALLBACK
    ===================================== */

    document.querySelectorAll(
        ".photo img, .about-photo img"
    ).forEach((img) => {

        img.addEventListener("error", () => {
            img.style.display = "none";
        });

    });

    /* =====================================
       6. FULLSCREEN IMAGE VIEWER
    ===================================== */

    const galleryImages = document.querySelectorAll(
        ".photo img, .hero-portrait img, .about-photo img"
    );

    const lightbox = document.createElement("div");

    lightbox.className = "lightbox";

    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Close image viewer">
            ✕
        </button>
        <img class="lightbox-image" src="" alt="Expanded photograph">
        <div class="lightbox-caption">ANKIT® — VISUAL DIARY</div>
    `;

    document.body.appendChild(lightbox);

    const lightboxImage = lightbox.querySelector(".lightbox-image");
    const closeButton = lightbox.querySelector(".lightbox-close");

    function openLightbox(src, alt) {

        if (!src) return;

        lightboxImage.src = src;
        lightboxImage.alt = alt || "Personal photograph";

        lightbox.classList.add("active");
        document.body.classList.add("lightbox-open");

        closeButton.focus();

    }

    function closeLightbox() {

        lightbox.classList.remove("active");
        document.body.classList.remove("lightbox-open");

        lightboxImage.src = "";

    }

    galleryImages.forEach((img) => {

        img.style.cursor = "zoom-in";

        img.addEventListener("click", () => {
            if (img.complete && img.naturalWidth > 0) {
                openLightbox(img.currentSrc || img.src, img.alt);
            }
        });

    });

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", (event) => {

        if (event.target === lightbox) {
            closeLightbox();
        }

    });

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeLightbox();
        }

    });

    /* =====================================
       7. IMAGE PARALLAX
    ===================================== */

    const heroImage = document.querySelector(".hero-portrait img");

    if (heroImage && !prefersReducedMotion && hasFinePointer) {

        const hero = document.querySelector(".hero");

        hero.addEventListener("mousemove", (event) => {

            const rect = hero.getBoundingClientRect();

            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            heroImage.style.transform =
                `scale(1.04) translate(${x * -12}px, ${y * -12}px)`;

        });

        hero.addEventListener("mouseleave", () => {
            heroImage.style.transform = "";
        });

    }

    /* =====================================
       8. FORM FEEDBACK
    ===================================== */

    document.querySelectorAll(
        ".contact-form, .feedback-form"
    ).forEach((form) => {

        form.addEventListener("submit", () => {

            const button = form.querySelector("button[type='submit']");

            if (button) {
                button.disabled = true;
                button.textContent = "SENDING...";
            }

        });

    });

    /* =====================================
       9. SMOOTH ANCHOR NAVIGATION
    ===================================== */

    document.querySelectorAll('a[href^="#"]').forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId = link.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = document.querySelector(targetId);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "start"
            });

        });

    });

    /* =====================================
       10. CONSOLE IDENTITY
    ===================================== */

    console.log(
        "%c ANKIT® ",
        "background:#d6ff00;color:#080808;font-size:22px;font-weight:900;padding:10px;"
    );

    console.log(
        "Welcome to my world. Keep creating."
    );

});

/* =====================================
   SCROLL PROGRESS
===================================== */

const progressBar = document.createElement("div");
progressBar.className = "scroll-progress";
document.body.appendChild(progressBar);

function updateScrollProgress() {

    const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

    const progress = scrollableHeight > 0
        ? (window.scrollY / scrollableHeight) * 100
        : 0;

    progressBar.style.width = progress + "%";
}

window.addEventListener("scroll", updateScrollProgress, {
    passive: true
});

updateScrollProgress();
