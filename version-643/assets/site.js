(function () {
  var mobileButton = document.querySelector(".mobile-menu-button");
  var mobileNav = document.querySelector(".mobile-nav");

  if (mobileButton && mobileNav) {
    mobileButton.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
      mobileButton.textContent = mobileNav.classList.contains("is-open") ? "×" : "☰";
    });
  }

  var slider = document.querySelector("[data-hero-slider]");

  if (slider) {
    var slides = Array.prototype.slice.call(slider.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(slider.querySelectorAll(".hero-dot"));
    var prev = slider.querySelector(".hero-prev");
    var next = slider.querySelector(".hero-next");
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === index);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === index);
      });
    }

    function startTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        showSlide(Number(dot.getAttribute("data-hero-dot")) || 0);
        startTimer();
      });
    });

    if (prev) {
      prev.addEventListener("click", function () {
        showSlide(index - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        showSlide(index + 1);
        startTimer();
      });
    }

    startTimer();
  }

  var filterGrid = document.querySelector(".filterable-grid");

  if (filterGrid) {
    var cards = Array.prototype.slice.call(filterGrid.querySelectorAll(".movie-card"));
    var input = document.querySelector(".page-search-input");
    var type = document.querySelector(".page-type-filter");
    var sort = document.querySelector(".page-sort-filter");

    function cardText(card) {
      return [
        card.getAttribute("data-title"),
        card.getAttribute("data-region"),
        card.getAttribute("data-type"),
        card.getAttribute("data-genre"),
        card.getAttribute("data-tags")
      ].join(" ").toLowerCase();
    }

    function applyFilter() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var typeValue = type ? type.value.trim().toLowerCase() : "";

      cards.forEach(function (card) {
        var text = cardText(card);
        var typeText = (card.getAttribute("data-type") || "").toLowerCase();
        var matchedQuery = !query || text.indexOf(query) !== -1;
        var matchedType = !typeValue || typeText.indexOf(typeValue) !== -1;
        card.classList.toggle("is-hidden", !(matchedQuery && matchedType));
      });
    }

    function applySort() {
      var sortValue = sort ? sort.value : "rating";
      var sorted = cards.slice().sort(function (a, b) {
        if (sortValue === "year") {
          return Number(b.getAttribute("data-year")) - Number(a.getAttribute("data-year"));
        }

        if (sortValue === "title") {
          return (a.getAttribute("data-title") || "").localeCompare(b.getAttribute("data-title") || "", "zh-CN");
        }

        return Number(b.getAttribute("data-rating")) - Number(a.getAttribute("data-rating"));
      });

      sorted.forEach(function (card) {
        filterGrid.appendChild(card);
      });

      cards = sorted;
      applyFilter();
    }

    if (input) {
      input.addEventListener("input", applyFilter);
    }

    if (type) {
      type.addEventListener("change", applyFilter);
    }

    if (sort) {
      sort.addEventListener("change", applySort);
    }
  }

  var searchResults = document.getElementById("search-results");
  var searchTitle = document.getElementById("search-result-title");
  var searchSubtitle = document.getElementById("search-result-subtitle");
  var searchInput = document.getElementById("search-page-input");

  if (searchResults && typeof SEARCH_DATA !== "undefined") {
    var params = new URLSearchParams(window.location.search);
    var q = (params.get("q") || "").trim();

    if (searchInput) {
      searchInput.value = q;
    }

    if (q) {
      var lower = q.toLowerCase();
      var matched = SEARCH_DATA.filter(function (item) {
        return [item.title, item.region, item.type, item.genre, item.category, item.tags, item.oneLine].join(" ").toLowerCase().indexOf(lower) !== -1;
      }).slice(0, 120);

      if (searchTitle) {
        searchTitle.textContent = "搜索结果";
      }

      if (searchSubtitle) {
        searchSubtitle.textContent = matched.length ? "为你找到相关影片" : "暂无完全匹配内容，可尝试更换关键词";
      }

      searchResults.innerHTML = matched.map(renderSearchCard).join("");
    }
  }

  function safeText(value) {
    return String(value || "").replace(/[&<>"']/g, function (match) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[match];
    });
  }

  function renderSearchCard(item) {
    var tags = String(item.tags || "").split(" ").filter(Boolean).slice(0, 3).map(function (tag) {
      return "<span>" + safeText(tag) + "</span>";
    }).join("");

    return "<a class=\"movie-card\" href=\"" + safeText(item.url) + "\" data-rating=\"" + safeText(item.rating) + "\">" +
      "<div class=\"movie-cover\">" +
      "<img src=\"" + safeText(item.cover) + "\" alt=\"" + safeText(item.title) + "\" loading=\"lazy\">" +
      "<div class=\"movie-cover-layer\"><span class=\"play-circle\">▶</span></div>" +
      "<span class=\"category-chip\">" + safeText(item.category) + "</span>" +
      "<span class=\"duration-chip\">" + safeText(item.duration) + "</span>" +
      "</div>" +
      "<div class=\"movie-info\">" +
      "<h3>" + safeText(item.title) + "</h3>" +
      "<p>" + safeText(item.oneLine) + "</p>" +
      "<div class=\"movie-meta\"><span>⭐ " + safeText(item.rating) + "</span><span>" + safeText(item.year) + "</span><span>" + safeText(item.type) + "</span></div>" +
      "<div class=\"tag-row\">" + tags + "</div>" +
      "</div>" +
      "</a>";
  }
})();

function initMoviePlayer(source) {
  var video = document.getElementById("movie-video");
  var overlay = document.getElementById("player-overlay");
  var hls = null;
  var ready = false;

  if (!video || !overlay || !source) {
    return;
  }

  function prepare() {
    if (ready) {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(source);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = source;
    }

    ready = true;
  }

  function start() {
    prepare();
    overlay.classList.add("is-hidden");
    video.play().catch(function () {});
  }

  overlay.addEventListener("click", start);

  video.addEventListener("click", function () {
    if (video.paused) {
      start();
    } else {
      video.pause();
    }
  });

  video.addEventListener("play", function () {
    overlay.classList.add("is-hidden");
  });

  video.addEventListener("ended", function () {
    overlay.classList.remove("is-hidden");
  });

  window.addEventListener("beforeunload", function () {
    if (hls) {
      hls.destroy();
    }
  });
}
