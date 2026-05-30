(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-main-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    slides[index].classList.add("active");
    window.setInterval(function () {
      slides[index].classList.remove("active");
      index = (index + 1) % slides.length;
      slides[index].classList.add("active");
    }, 5600);
  }

  function setupCatalogFilters() {
    var root = document.querySelector("[data-filter-root]");
    if (!root) {
      return;
    }
    var input = root.querySelector("[data-filter-input]");
    var genre = root.querySelector("[data-filter-genre]");
    var year = root.querySelector("[data-filter-year]");
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-card]"));

    function normalized(value) {
      return String(value || "").toLowerCase().trim();
    }

    function applyFilters() {
      var keyword = normalized(input && input.value);
      var genreValue = normalized(genre && genre.value);
      var yearValue = normalized(year && year.value);
      cards.forEach(function (card) {
        var title = normalized(card.getAttribute("data-title"));
        var genres = normalized(card.getAttribute("data-genre"));
        var cardYear = normalized(card.getAttribute("data-year"));
        var region = normalized(card.getAttribute("data-region"));
        var textMatch = !keyword || title.indexOf(keyword) !== -1 || genres.indexOf(keyword) !== -1 || region.indexOf(keyword) !== -1;
        var genreMatch = !genreValue || genres.indexOf(genreValue) !== -1;
        var yearMatch = !yearValue || cardYear === yearValue;
        card.style.display = textMatch && genreMatch && yearMatch ? "" : "none";
      });
    }

    [input, genre, year].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilters);
        control.addEventListener("change", applyFilters);
      }
    });
  }

  function setupHeroSearch() {
    var input = document.querySelector("[data-hero-search]");
    var link = document.querySelector("[data-hero-search-link]");
    if (!input || !link) {
      return;
    }
    function updateLink() {
      var query = encodeURIComponent(input.value.trim());
      link.href = query ? "movies.html?search=" + query : "movies.html";
    }
    input.addEventListener("input", updateLink);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        updateLink();
        window.location.href = link.href;
      }
    });
  }

  function applySearchFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var search = params.get("search");
    if (!search) {
      return;
    }
    var input = document.querySelector("[data-filter-input]");
    if (input) {
      input.value = search;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupCatalogFilters();
    setupHeroSearch();
    applySearchFromQuery();
  });
}());
