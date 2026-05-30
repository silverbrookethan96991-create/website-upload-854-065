(function () {
  function each(list, callback) {
    Array.prototype.forEach.call(list, callback);
  }

  var toggle = document.querySelector(".mobile-toggle");
  var mobileNav = document.querySelector(".mobile-nav");

  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = mobileNav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "×" : "☰";
    });
  }

  each(document.querySelectorAll("[data-hero-slider]"), function (slider) {
    var slides = slider.querySelectorAll(".hero-slide");
    var dots = slider.querySelectorAll(".hero-dot");
    var next = slider.querySelector("[data-hero-next]");
    var prev = slider.querySelector("[data-hero-prev]");
    var index = 0;
    var timer = null;

    function show(target) {
      index = (target + slides.length) % slides.length;
      each(slides, function (slide, i) {
        slide.classList.toggle("active", i === index);
      });
      each(dots, function (dot, i) {
        dot.classList.toggle("active", i === index);
      });
    }

    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (slides.length > 1) {
      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          play();
        });
      }
      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          play();
        });
      }
      each(dots, function (dot, i) {
        dot.addEventListener("click", function () {
          show(i);
          play();
        });
      });
      play();
    }
  });

  each(document.querySelectorAll("[data-search-scope]"), function (scope) {
    var input = scope.querySelector("[data-card-search]");
    var clear = scope.querySelector("[data-clear-search]");
    var chips = scope.querySelectorAll("[data-filter-value]");
    var activeFilter = "all";

    function normalize(value) {
      return (value || "").toString().trim().toLowerCase();
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : "");
      var cards = scope.querySelectorAll(".movie-card");
      each(cards, function (card) {
        var text = normalize(card.getAttribute("data-search-text"));
        var type = normalize(card.getAttribute("data-type"));
        var region = normalize(card.getAttribute("data-region"));
        var category = normalize(card.getAttribute("data-category"));
        var matchesKeyword = !keyword || text.indexOf(keyword) !== -1;
        var filter = normalize(activeFilter);
        var matchesFilter = filter === "all" || text.indexOf(filter) !== -1 || type === filter || region === filter || category === filter;
        card.classList.toggle("is-hidden", !(matchesKeyword && matchesFilter));
      });
    }

    if (input) {
      input.addEventListener("input", applyFilter);
    }

    if (clear) {
      clear.addEventListener("click", function () {
        if (input) {
          input.value = "";
        }
        activeFilter = "all";
        each(chips, function (chip) {
          chip.classList.toggle("active", chip.getAttribute("data-filter-value") === "all");
        });
        applyFilter();
      });
    }

    each(chips, function (chip) {
      chip.addEventListener("click", function () {
        activeFilter = chip.getAttribute("data-filter-value") || "all";
        each(chips, function (item) {
          item.classList.toggle("active", item === chip);
        });
        applyFilter();
      });
    });
  });

  each(document.querySelectorAll(".player-shell"), function (player) {
    var video = player.querySelector("video");
    var overlay = player.querySelector(".play-overlay");
    var stream = player.getAttribute("data-stream");
    var hlsInstance = null;
    var started = false;

    function requestPlay() {
      var result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }

    function start() {
      if (!video || !stream) {
        return;
      }

      if (overlay) {
        overlay.classList.add("is-hidden");
      }

      video.setAttribute("controls", "controls");

      if (started) {
        requestPlay();
        return;
      }

      started = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        requestPlay();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          requestPlay();
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal && hlsInstance) {
            if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
              hlsInstance.startLoad();
            } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hlsInstance.recoverMediaError();
            } else {
              hlsInstance.destroy();
            }
          }
        });
      }
    }

    if (overlay) {
      overlay.addEventListener("click", start);
    }

    if (video) {
      video.addEventListener("click", function () {
        if (!started || video.paused) {
          start();
        }
      });
    }
  });
})();
