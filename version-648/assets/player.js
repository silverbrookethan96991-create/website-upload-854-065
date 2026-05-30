(function () {
  function initMoviePlayer(source) {
    var video = document.getElementById("moviePlayer");
    var cover = document.getElementById("playerCover");
    var button = document.getElementById("startPlayer");
    var ready = false;
    var hls = null;

    if (!video || !source) {
      return;
    }

    function prepare() {
      if (ready) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }

      ready = true;
    }

    function start() {
      prepare();

      if (cover) {
        cover.classList.add("is-hidden");
      }

      var playPromise = video.play();

      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    }

    if (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        start();
      });
    }

    if (cover) {
      cover.addEventListener("click", function () {
        start();
      });
    }

    video.addEventListener("click", function () {
      if (!ready) {
        start();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
  }

  window.initMoviePlayer = initMoviePlayer;
}());
