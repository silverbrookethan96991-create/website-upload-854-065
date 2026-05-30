const Hls = window.Hls;

const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function initMobileNav() {
    const button = select(".mobile-toggle");
    const panel = select(".mobile-panel");
    if (!button || !panel) {
        return;
    }
    button.addEventListener("click", () => {
        const opened = panel.classList.toggle("is-open");
        button.setAttribute("aria-expanded", opened ? "true" : "false");
    });
}

function initHero() {
    const slides = selectAll(".hero-slide");
    const dots = selectAll(".hero-dot");
    if (!slides.length) {
        return;
    }
    let current = 0;
    let timer = null;
    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-active", slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === current);
        });
    };
    const start = () => {
        timer = window.setInterval(() => show(current + 1), 5200);
    };
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            if (timer) {
                window.clearInterval(timer);
            }
            show(index);
            start();
        });
    });
    show(0);
    start();
}

function initSearchFilters() {
    const input = select("#movieSearchInput");
    const cards = selectAll(".searchable-grid .movie-card");
    if (!input || !cards.length) {
        return;
    }
    const typeFilter = select("#typeFilter");
    const regionFilter = select("#regionFilter");
    const categoryFilter = select("#categoryFilter");
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q");
    if (query) {
        input.value = query;
    }
    const apply = () => {
        const text = input.value.trim().toLowerCase();
        const type = typeFilter ? typeFilter.value : "";
        const region = regionFilter ? regionFilter.value : "";
        const category = categoryFilter ? categoryFilter.value : "";
        cards.forEach((card) => {
            const haystack = (card.dataset.search || "").toLowerCase();
            const matchedText = !text || haystack.includes(text);
            const matchedType = !type || card.dataset.type === type;
            const matchedRegion = !region || card.dataset.region === region;
            const matchedCategory = !category || card.dataset.category === category;
            card.classList.toggle("is-hidden", !(matchedText && matchedType && matchedRegion && matchedCategory));
        });
    };
    [input, typeFilter, regionFilter, categoryFilter].forEach((item) => {
        if (item) {
            item.addEventListener("input", apply);
            item.addEventListener("change", apply);
        }
    });
    apply();
}

function attachStream(video) {
    const stream = video.dataset.stream;
    if (!stream || video.dataset.ready === "1") {
        return;
    }
    if (Hls && Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
        video.hlsInstance = hls;
    } else {
        video.src = stream;
    }
    video.dataset.ready = "1";
}

function initPlayers() {
    selectAll(".player-box").forEach((box) => {
        const video = select("video[data-stream]", box);
        const button = select(".player-trigger", box);
        if (!video || !button) {
            return;
        }
        const play = () => {
            attachStream(video);
            button.classList.add("is-hidden");
            video.play().catch(() => {});
        };
        button.addEventListener("click", play);
        video.addEventListener("click", () => {
            if (video.paused) {
                play();
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    initHero();
    initSearchFilters();
    initPlayers();
});
