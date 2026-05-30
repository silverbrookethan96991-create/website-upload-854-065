(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initSearchPage();
  });

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll(".hero-dot"));
    if (!slides.length) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, itemIndex) {
        slide.classList.toggle("is-active", itemIndex === index);
      });
      dots.forEach(function (dot, itemIndex) {
        dot.classList.toggle("is-active", itemIndex === index);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    dots.forEach(function (dot, itemIndex) {
      dot.addEventListener("click", function () {
        window.clearInterval(timer);
        show(itemIndex);
        start();
      });
    });

    show(0);
    start();
  }

  function initFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector("[data-card-search]");
      var buttons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-value]"));
      var cards = Array.prototype.slice.call(document.querySelectorAll(".movie-card"));
      var empty = document.querySelector("[data-empty-state]");
      var activeValue = "全部";

      function apply() {
        var keyword = input ? input.value.trim().toLowerCase() : "";
        var visible = 0;
        cards.forEach(function (card) {
          var haystack = (card.getAttribute("data-text") || "").toLowerCase();
          var genre = card.getAttribute("data-genre") || "";
          var title = card.getAttribute("data-title") || "";
          var typeText = haystack + " " + genre + " " + title;
          var matchKeyword = !keyword || typeText.toLowerCase().indexOf(keyword) !== -1;
          var matchFilter = activeValue === "全部" || typeText.indexOf(activeValue) !== -1;
          var matched = matchKeyword && matchFilter;
          card.classList.toggle("is-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          activeValue = button.getAttribute("data-filter-value") || "全部";
          buttons.forEach(function (item) {
            item.classList.toggle("is-active", item === button);
          });
          apply();
        });
      });
      apply();
    });
  }

  function initSearchPage() {
    var page = document.querySelector("[data-search-page]");
    if (!page) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var query = params.get("q") || "";
    var input = document.querySelector("[data-card-search]");
    if (input && query) {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  window.initMoviePlayer = function (url) {
    var box = document.querySelector("[data-player]");
    var video = document.getElementById("movie-video");
    var overlay = document.querySelector("[data-player-overlay]");
    var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-start-play]"));
    var loaded = false;
    var instance = null;

    if (!box || !video || !url) {
      return;
    }

    function load() {
      if (loaded) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        instance = new window.Hls({ enableWorker: true });
        instance.loadSource(url);
        instance.attachMedia(video);
      } else {
        video.src = url;
      }
      loaded = true;
    }

    function start() {
      load();
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      video.controls = true;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {});
      }
    }

    buttons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        start();
      });
    });

    if (overlay) {
      overlay.addEventListener("click", start);
    }

    box.addEventListener("click", function () {
      if (!loaded) {
        start();
      }
    });

    window.addEventListener("beforeunload", function () {
      if (instance && typeof instance.destroy === "function") {
        instance.destroy();
      }
    });
  };
})();
