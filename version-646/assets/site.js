(function () {
  var menuButton = document.querySelector("[data-menu-toggle]");
  var mobilePanel = document.querySelector("[data-mobile-panel]");

  if (menuButton && mobilePanel) {
    menuButton.addEventListener("click", function () {
      mobilePanel.classList.toggle("open");
    });
  }

  var hero = document.querySelector("[data-hero]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var current = 0;

    function showHero(index) {
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
        showHero(Number(dot.getAttribute("data-hero-dot")) || 0);
      });
    });

    if (slides.length > 1) {
      setInterval(function () {
        showHero(current + 1);
      }, 5600);
    }
  }

  var filterForm = document.querySelector("[data-local-filter]");

  if (filterForm) {
    var input = filterForm.querySelector("[data-filter-input]");
    var select = filterForm.querySelector("[data-filter-select]");
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-list] .movie-card"));
    var emptyTip = document.querySelector("[data-empty-tip]");

    function applyFilter() {
      var keyword = input.value.trim().toLowerCase();
      var type = select.value.trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var text = [
          card.getAttribute("data-title") || "",
          card.getAttribute("data-region") || "",
          card.getAttribute("data-type") || "",
          card.getAttribute("data-genre") || ""
        ].join(" ").toLowerCase();
        var passKeyword = !keyword || text.indexOf(keyword) !== -1;
        var passType = !type || text.indexOf(type) !== -1;
        var matched = passKeyword && passType;
        card.style.display = matched ? "" : "none";
        if (matched) {
          visible += 1;
        }
      });

      if (emptyTip) {
        emptyTip.classList.toggle("show", visible === 0);
      }
    }

    input.addEventListener("input", applyFilter);
    select.addEventListener("change", applyFilter);
    filterForm.addEventListener("submit", function (event) {
      event.preventDefault();
      applyFilter();
    });
  }

  var player = document.querySelector("[data-player]");

  if (player) {
    var video = player.querySelector("video");
    var cover = player.querySelector("[data-player-cover]");
    var button = player.querySelector("[data-play-button]");
    var stream = video ? video.getAttribute("data-stream") : "";
    var attached = false;

    function attachStream() {
      if (!video || !stream || attached) {
        return;
      }

      attached = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
      } else if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(stream);
        hls.attachMedia(video);
      } else {
        video.src = stream;
      }
    }

    function startPlayer() {
      attachStream();

      if (cover) {
        cover.classList.add("is-hidden");
      }

      if (video) {
        video.controls = true;
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      }
    }

    if (cover) {
      cover.addEventListener("click", startPlayer);
    }

    if (button) {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        startPlayer();
      });
    }

    if (video) {
      video.addEventListener("click", function () {
        if (!attached) {
          startPlayer();
        }
      });
    }
  }

  if (window.SEARCH_MOVIES) {
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || "").trim();
    var input = document.querySelector("[data-search-page-input]");
    var title = document.querySelector("[data-search-title]");
    var results = document.querySelector("[data-search-results]");
    var empty = document.querySelector("[data-search-empty]");

    if (input) {
      input.value = query;
    }

    function renderCards(items) {
      if (!results) {
        return;
      }

      results.innerHTML = items.map(function (movie) {
        var tags = movie.tags.slice(0, 3).map(function (tag) {
          return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");

        return [
          "<a class=\"movie-card compact\" href=\"" + movie.file + "\" data-title=\"" + escapeHtml(movie.title) + "\" data-region=\"" + escapeHtml(movie.region) + "\" data-type=\"" + escapeHtml(movie.type) + "\" data-genre=\"" + escapeHtml(movie.genre) + "\">",
          "<div class=\"poster-wrap\"><img src=\"" + movie.cover + "\" alt=\"" + escapeHtml(movie.title) + "\" loading=\"lazy\" onerror=\"this.style.display='none';this.parentElement.classList.add('no-image')\"><span class=\"poster-type\">" + escapeHtml(movie.type) + "</span></div>",
          "<div class=\"movie-card-body\"><h3>" + escapeHtml(movie.title) + "</h3><p>" + escapeHtml(movie.oneLine) + "</p><div class=\"movie-meta\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.year) + "</span></div><div class=\"tag-row\">" + tags + "</div></div>",
          "</a>"
        ].join("");
      }).join("");

      if (empty) {
        empty.classList.toggle("show", items.length === 0);
      }
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>\"]/g, function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "\"": "&quot;"
        }[character];
      });
    }

    if (query) {
      var lower = query.toLowerCase();
      var matched = window.SEARCH_MOVIES.filter(function (movie) {
        return [movie.title, movie.region, movie.type, movie.genre, movie.tags.join(" "), movie.oneLine].join(" ").toLowerCase().indexOf(lower) !== -1;
      }).slice(0, 120);

      if (title) {
        title.textContent = "搜索结果";
      }

      renderCards(matched);
    }
  }
})();
