const MovieSite = (function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function createPetals() {
    const layer = document.querySelector(".petal-layer");
    if (!layer) {
      return;
    }
    for (let index = 0; index < 18; index += 1) {
      const petal = document.createElement("span");
      petal.className = "cherry-blossom";
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.animationDuration = `${8 + Math.random() * 8}s`;
      petal.style.animationDelay = `${Math.random() * 8}s`;
      petal.style.transform = `scale(${0.7 + Math.random() * 0.8})`;
      layer.appendChild(petal);
    }
  }

  function initMenu() {
    const button = document.querySelector("[data-menu-button]");
    const panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
    });
  }

  function initHero() {
    const root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    const slides = Array.from(root.querySelectorAll(".hero-slide"));
    const dots = Array.from(root.querySelectorAll("[data-hero-dot]"));
    if (slides.length === 0) {
      return;
    }
    let current = 0;
    let timer = null;

    function activate(next) {
      current = (next + slides.length) % slides.length;
      slides.forEach(function (slide, index) {
        slide.classList.toggle("is-active", index === current);
      });
      dots.forEach(function (dot, index) {
        dot.classList.toggle("is-active", index === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        activate(current + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        if (timer) {
          window.clearInterval(timer);
        }
        activate(index);
        start();
      });
    });

    activate(0);
    start();
  }

  function initCardFilters() {
    document.querySelectorAll("[data-filter-form]").forEach(function (form) {
      const input = form.querySelector("[data-card-search]");
      const select = form.querySelector("[data-year-filter]");
      const list = form.nextElementSibling;
      const cards = list ? Array.from(list.querySelectorAll("[data-card]")) : [];

      function apply() {
        const keyword = input ? input.value.trim().toLowerCase() : "";
        const year = select ? select.value : "";
        cards.forEach(function (card) {
          const text = [
            card.dataset.title,
            card.dataset.tags,
            card.dataset.region,
            card.dataset.type,
            card.dataset.genre,
            card.dataset.year
          ].join(" ").toLowerCase();
          const matchKeyword = keyword === "" || text.includes(keyword);
          const matchYear = year === "" || card.dataset.year === year;
          card.classList.toggle("hidden-card", !(matchKeyword && matchYear));
        });
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      if (select) {
        select.addEventListener("change", apply);
      }
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderSearchCard(movie) {
    const genre = escapeHtml(movie.genre || "综合");
    const title = escapeHtml(movie.title);
    const oneLine = escapeHtml(movie.one_line);
    const region = escapeHtml(movie.region);
    const year = escapeHtml(movie.year || "热映");
    return `
<article class="movie-card card-hover">
  <a class="poster-link" href="./${movie.file}" aria-label="${title}">
    <img src="${movie.cover}" alt="${title}" loading="lazy">
    <span class="poster-shade"></span>
    <span class="play-pill">▶</span>
  </a>
  <div class="movie-card-body">
    <div class="movie-card-tags"><span>${genre}</span></div>
    <h2><a href="./${movie.file}">${title}</a></h2>
    <p>${oneLine}</p>
    <div class="movie-meta"><span>${year}</span><span>${region}</span></div>
  </div>
</article>`;
  }

  function initSearchPage() {
    const form = document.querySelector("[data-search-page-form]");
    const results = document.querySelector("[data-search-results]");
    const heading = document.querySelector("[data-search-heading]");
    if (!form || !results || typeof MOVIES === "undefined") {
      return;
    }
    const input = form.querySelector("input[name='q']");
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("q") || "";
    if (input) {
      input.value = initial;
    }

    function search(keyword) {
      const query = keyword.trim().toLowerCase();
      if (!query) {
        return MOVIES.slice(0, 60);
      }
      return MOVIES.filter(function (movie) {
        return [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags, movie.one_line]
          .join(" ")
          .toLowerCase()
          .includes(query);
      }).slice(0, 120);
    }

    function render(keyword) {
      const items = search(keyword);
      if (heading) {
        heading.textContent = keyword.trim() ? `“${keyword.trim()}”相关影片` : "热门推荐";
      }
      results.innerHTML = items.length
        ? items.map(renderSearchCard).join("")
        : "<div class=\"detail-content glass-effect\"><h2>未找到相关影片</h2><p>可以尝试更换片名、地区、年份或题材关键词。</p></div>";
    }

    render(initial);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const keyword = input ? input.value : "";
      const url = new URL(window.location.href);
      if (keyword.trim()) {
        url.searchParams.set("q", keyword.trim());
      } else {
        url.searchParams.delete("q");
      }
      window.history.replaceState({}, "", url.toString());
      render(keyword);
    });
  }

  function mountPlayer(playlistUrl) {
    const root = document.querySelector("[data-player]");
    if (!root) {
      return;
    }
    const video = root.querySelector("video");
    const button = root.querySelector("[data-play]");
    if (!video || !button) {
      return;
    }
    let prepared = false;
    let hls = null;

    function prepare() {
      if (prepared) {
        return;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = playlistUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(playlistUrl);
        hls.attachMedia(video);
      } else {
        video.src = playlistUrl;
      }
      prepared = true;
    }

    function play() {
      prepare();
      root.classList.add("is-playing");
      const action = video.play();
      if (action && typeof action.catch === "function") {
        action.catch(function () {
          root.classList.remove("is-playing");
        });
      }
    }

    button.addEventListener("click", play);
    video.addEventListener("click", function () {
      if (video.paused) {
        play();
      }
    });
    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
      }
    });
  }

  ready(function () {
    createPetals();
    initMenu();
    initHero();
    initCardFilters();
    initSearchPage();
  });

  return {
    mountPlayer: mountPlayer
  };
}());
