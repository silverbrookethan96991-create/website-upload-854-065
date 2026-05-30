(function () {
  var mobileButton = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobileNav");

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("is-open");
      mobileButton.setAttribute("aria-expanded", String(open));
    });
  }

  var petalLayer = document.querySelector(".petal-layer");

  if (petalLayer) {
    for (var i = 0; i < 22; i += 1) {
      var petal = document.createElement("span");
      petal.className = "cherry-blossom";
      petal.style.left = Math.random() * 100 + "%";
      petal.style.animationDelay = Math.random() * 8 + "s";
      petal.style.animationDuration = 10 + Math.random() * 12 + "s";
      petalLayer.appendChild(petal);
    }
  }

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    var prev = hero.querySelector("[data-hero-prev]");
    var next = hero.querySelector("[data-hero-next]");
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === index);
        dot.setAttribute("aria-selected", String(itemIndex === index));
      });
    }

    function autoPlay() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(index - 1);
        autoPlay();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(index + 1);
        autoPlay();
      });
    }

    dots.forEach(function (dot, itemIndex) {
      dot.addEventListener("click", function () {
        showSlide(itemIndex);
        autoPlay();
      });
    });

    showSlide(0);
    autoPlay();
  }

  var searchInput = document.querySelector("[data-search-input]");
  var searchCards = Array.prototype.slice.call(document.querySelectorAll("[data-movie-card]"));
  var emptyState = document.querySelector("[data-empty-state]");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-search-filter]"));
  var currentFilter = "all";

  function setInitialSearch() {
    if (!searchInput) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get("q") || "";
    searchInput.value = q;
  }

  function runSearch() {
    if (!searchCards.length) {
      return;
    }

    var query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    var visible = 0;

    searchCards.forEach(function (card) {
      var text = (card.getAttribute("data-title") || "").toLowerCase();
      var category = card.getAttribute("data-category") || "";
      var matchText = !query || text.indexOf(query) !== -1;
      var matchFilter = currentFilter === "all" || category === currentFilter;
      var show = matchText && matchFilter;
      card.style.display = show ? "" : "none";

      if (show) {
        visible += 1;
      }
    });

    if (emptyState) {
      emptyState.classList.toggle("is-visible", visible === 0);
    }
  }

  if (searchInput) {
    setInitialSearch();
    searchInput.addEventListener("input", runSearch);
    runSearch();
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      currentFilter = button.getAttribute("data-search-filter") || "all";
      filterButtons.forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      runSearch();
    });
  });
}());
