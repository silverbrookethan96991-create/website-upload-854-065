(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
            return;
        }
        callback();
    }

    function normalize(value) {
        return String(value || "").toLowerCase().trim();
    }

    function initMobileNavigation() {
        var toggle = document.querySelector("[data-menu-toggle]");
        var nav = document.querySelector("[data-mobile-nav]");
        if (!toggle || !nav) {
            return;
        }

        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
    }

    function initHeroCarousel() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var current = 0;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener("click", function () {
                show(index);
            });
        });

        if (slides.length > 1) {
            window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }
    }

    function initLocalFilter() {
        var shell = document.querySelector("[data-local-filter]");
        if (!shell) {
            return;
        }

        var input = shell.querySelector("input");
        var counter = shell.querySelector("[data-filter-count]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));

        function apply() {
            var keyword = normalize(input.value);
            var visibleCount = 0;

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.dataset.title,
                    card.dataset.region,
                    card.dataset.type,
                    card.dataset.genre,
                    card.dataset.year
                ].join(" "));
                var visible = !keyword || haystack.indexOf(keyword) !== -1;
                card.style.display = visible ? "" : "none";
                if (visible) {
                    visibleCount += 1;
                }
            });

            if (counter) {
                counter.textContent = visibleCount + " 部影片";
            }
        }

        input.addEventListener("input", apply);
        apply();
    }

    function uniqueSorted(items, key) {
        var seen = Object.create(null);
        var values = [];
        items.forEach(function (item) {
            var value = item[key];
            if (value && !seen[value]) {
                seen[value] = true;
                values.push(value);
            }
        });
        return values.sort(function (a, b) {
            return String(b).localeCompare(String(a), "zh-Hans-CN");
        });
    }

    function fillSelect(select, values) {
        if (!select) {
            return;
        }
        values.forEach(function (value) {
            var option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    function cardTemplate(movie) {
        return [
            "<article class="movie-card" data-movie-card>",
            "  <a class="poster-link" href="" + movie.file + "" aria-label="观看 " + escapeHtml(movie.title) + "">",
            "    <span class="category-pill">" + escapeHtml(movie.primary_genre) + "</span>",
            "    <img src="" + movie.cover + "" alt="" + escapeHtml(movie.title) + "" loading="lazy">",
            "    <span class="poster-shade"></span>",
            "    <span class="play-hover">▶</span>",
            "    <span class="duration-pill">" + escapeHtml(movie.duration) + "</span>",
            "  </a>",
            "  <div class="card-body">",
            "    <h3><a href="" + movie.file + "">" + escapeHtml(movie.title) + "</a></h3>",
            "    <p>" + escapeHtml(movie.one_line) + "</p>",
            "    <div class="meta-row"><span>" + escapeHtml(movie.year) + "</span><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
            "  </div>",
            "</article>"
        ].join("");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initSearchPage() {
        var form = document.querySelector("[data-search-page-form]");
        var results = document.querySelector("[data-search-results]");
        var count = document.querySelector("[data-search-count]");
        var title = document.querySelector("[data-search-title]");
        var data = window.MOVIE_SEARCH_INDEX || [];

        if (!form || !results || !data.length) {
            return;
        }

        var keywordInput = form.querySelector("input[name='q']");
        var typeSelect = form.querySelector("select[name='type']");
        var regionSelect = form.querySelector("select[name='region']");
        var yearSelect = form.querySelector("select[name='year']");

        fillSelect(typeSelect, uniqueSorted(data, "type"));
        fillSelect(regionSelect, uniqueSorted(data, "region").slice(0, 80));
        fillSelect(yearSelect, uniqueSorted(data, "year"));

        var params = new URLSearchParams(window.location.search);
        keywordInput.value = params.get("q") || "";
        typeSelect.value = params.get("type") || "";
        regionSelect.value = params.get("region") || "";
        yearSelect.value = params.get("year") || "";

        function applySearch(updateUrl) {
            var keyword = normalize(keywordInput.value);
            var type = typeSelect.value;
            var region = regionSelect.value;
            var year = yearSelect.value;

            var matched = data.filter(function (movie) {
                var haystack = normalize([
                    movie.title,
                    movie.region,
                    movie.type,
                    movie.genre,
                    movie.tags,
                    movie.one_line,
                    movie.year
                ].join(" "));
                return (!keyword || haystack.indexOf(keyword) !== -1)
                    && (!type || movie.type === type)
                    && (!region || movie.region === region)
                    && (!year || movie.year === year);
            });

            results.innerHTML = matched.slice(0, 300).map(cardTemplate).join("");
            count.textContent = "找到 " + matched.length + " 部影片";
            title.textContent = keyword ? "搜索结果：" + keyword : "筛选结果";

            if (updateUrl) {
                var nextParams = new URLSearchParams();
                if (keywordInput.value.trim()) {
                    nextParams.set("q", keywordInput.value.trim());
                }
                if (type) {
                    nextParams.set("type", type);
                }
                if (region) {
                    nextParams.set("region", region);
                }
                if (year) {
                    nextParams.set("year", year);
                }
                var nextUrl = window.location.pathname + (nextParams.toString() ? "?" + nextParams.toString() : "");
                window.history.replaceState(null, "", nextUrl);
            }
        }

        form.addEventListener("submit", function (event) {
            event.preventDefault();
            applySearch(true);
        });

        [keywordInput, typeSelect, regionSelect, yearSelect].forEach(function (control) {
            control.addEventListener("input", function () {
                applySearch(true);
            });
            control.addEventListener("change", function () {
                applySearch(true);
            });
        });

        applySearch(false);
    }

    ready(function () {
        initMobileNavigation();
        initHeroCarousel();
        initLocalFilter();
        initSearchPage();
    });
})();
