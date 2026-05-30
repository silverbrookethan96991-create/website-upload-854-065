(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".menu-toggle");

    if (header && toggle) {
      toggle.addEventListener("click", function () {
        var opened = header.classList.toggle("open");
        toggle.setAttribute("aria-expanded", opened ? "true" : "false");
      });
    }

    var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
    var current = 0;

    function setSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        setSlide(Number(dot.getAttribute("data-slide")) || 0);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        setSlide(current + 1);
      }, 5200);
    }

    var searchBox = document.querySelector("[data-card-search]");
    var filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-card-filter]"));
    var cards = Array.prototype.slice.call(document.querySelectorAll(".card-results .movie-card"));
    var empty = document.querySelector(".empty-state");
    var filterValue = "all";

    function normalize(text) {
      return String(text || "").toLowerCase().trim();
    }

    function applyCardFilters() {
      if (!cards.length) {
        return;
      }
      var keyword = normalize(searchBox ? searchBox.value : "");
      var visible = 0;

      cards.forEach(function (card) {
        var haystack = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-year"),
          card.getAttribute("data-genre")
        ].join(" "));
        var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var matchesFilter = filterValue === "all" || haystack.indexOf(normalize(filterValue)) !== -1;
        var show = matchesKeyword && matchesFilter;
        card.hidden = !show;
        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    if (searchBox) {
      searchBox.addEventListener("input", applyCardFilters);
    }

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        filterValue = button.getAttribute("data-card-filter") || "all";
        filterButtons.forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        applyCardFilters();
      });
    });

    renderSearchResults();
  });

  function buildCard(movie) {
    return [
      '<a class="movie-card grid-card" href="' + escapeHtml(movie.url) + '">',
      '  <span class="thumb poster-thumb">',
      '    <img src="' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '    <span class="poster-overlay"><span class="center-play">▶</span></span>',
      '    <span class="hd-badge">HD</span>',
      '    <span class="score">★ ' + escapeHtml(movie.rating) + '</span>',
      '  </span>',
      '  <span class="card-body">',
      '    <strong>' + escapeHtml(movie.title) + '</strong>',
      '    <span class="card-meta"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.year) + '</span></span>',
      '    <span class="card-tags">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.genre) + '</span>',
      '  </span>',
      '</a>'
    ].join("");
  }

  function renderSearchResults() {
    var results = document.getElementById("searchResults");
    var empty = document.getElementById("searchEmpty");

    if (!results || !window.SEARCH_MOVIES) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = String(params.get("q") || "").trim();
    var field = document.querySelector('.big-search input[name="q"]');

    if (field) {
      field.value = query;
    }

    if (!query) {
      results.innerHTML = "";
      if (empty) {
        empty.hidden = false;
      }
      return;
    }

    var keyword = query.toLowerCase();
    var matched = window.SEARCH_MOVIES.filter(function (movie) {
      return [movie.title, movie.region, movie.year, movie.genre, movie.category, movie.description]
        .join(" ")
        .toLowerCase()
        .indexOf(keyword) !== -1;
    }).slice(0, 180);

    results.innerHTML = matched.map(buildCard).join("");

    if (empty) {
      empty.hidden = matched.length !== 0;
      empty.textContent = matched.length ? "" : "未找到匹配影片";
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.initializePlayer = function (streamUrl) {
    ready(function () {
      var shell = document.querySelector(".player-shell");
      var video = document.querySelector(".player-video");
      var cover = document.querySelector(".player-cover");
      var playButton = document.querySelector(".player-play");
      var muteButton = document.querySelector(".player-mute");
      var fullButton = document.querySelector(".player-full");
      var message = document.querySelector(".player-message");
      var hlsInstance = null;
      var initialized = false;

      if (!video || !streamUrl) {
        return;
      }

      function showMessage(text) {
        if (message) {
          message.hidden = false;
          message.textContent = text;
        }
      }

      function setupStream() {
        if (initialized) {
          return;
        }
        initialized = true;

        if (window.Hls && window.Hls.isSupported()) {
          hlsInstance = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
            if (data && data.fatal) {
              showMessage("视频加载失败，请刷新页面重试");
              if (hlsInstance) {
                hlsInstance.destroy();
              }
            }
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
          video.addEventListener("error", function () {
            showMessage("视频加载失败，请刷新页面重试");
          });
        } else {
          showMessage("视频加载失败，请刷新页面重试");
        }
      }

      function play() {
        setupStream();
        if (cover) {
          cover.classList.add("hidden");
        }
        if (shell) {
          shell.classList.add("playing");
        }
        var action = video.play();
        if (action && typeof action.catch === "function") {
          action.catch(function () {
            if (cover) {
              cover.classList.remove("hidden");
            }
          });
        }
      }

      function togglePlay() {
        if (video.paused) {
          play();
        } else {
          video.pause();
          if (playButton) {
            playButton.textContent = "▶";
          }
        }
      }

      if (cover) {
        cover.addEventListener("click", play);
      }
      if (playButton) {
        playButton.addEventListener("click", togglePlay);
      }
      video.addEventListener("click", togglePlay);
      video.addEventListener("play", function () {
        if (playButton) {
          playButton.textContent = "Ⅱ";
        }
      });
      video.addEventListener("pause", function () {
        if (playButton) {
          playButton.textContent = "▶";
        }
      });
      if (muteButton) {
        muteButton.addEventListener("click", function () {
          video.muted = !video.muted;
          muteButton.textContent = video.muted ? "静音" : "音量";
        });
      }
      if (fullButton) {
        fullButton.addEventListener("click", function () {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (shell && shell.requestFullscreen) {
            shell.requestFullscreen();
          }
        });
      }
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  };
})();
