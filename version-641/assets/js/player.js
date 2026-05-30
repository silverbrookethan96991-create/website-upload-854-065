import { H as Hls } from "./hls-vendor-dru42stk.js";

var players = new WeakMap();

function attachVideo(video, source) {
  if (!video || !source) {
    return;
  }

  var previous = players.get(video);
  if (previous) {
    previous.destroy();
    players.delete(video);
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    if (video.getAttribute("src") !== source) {
      video.setAttribute("src", source);
    }
    return;
  }

  if (Hls && Hls.isSupported()) {
    var hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });
    hls.loadSource(source);
    hls.attachMedia(video);
    players.set(video, hls);
  }
}

function startPlayer(shell) {
  var video = shell.querySelector("video");
  var button = shell.querySelector("[data-play-button]");
  var source = button ? button.getAttribute("data-src") : "";
  attachVideo(video, source);
  shell.classList.add("playing");
  if (video) {
    var result = video.play();
    if (result && typeof result.catch === "function") {
      result.catch(function () {});
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var shells = Array.prototype.slice.call(document.querySelectorAll("[data-player]"));
  shells.forEach(function (shell) {
    var button = shell.querySelector("[data-play-button]");
    if (button) {
      button.addEventListener("click", function () {
        startPlayer(shell);
      });
    }
    shell.addEventListener("click", function (event) {
      if (event.target.tagName && event.target.tagName.toLowerCase() === "video") {
        return;
      }
      if (!shell.classList.contains("playing")) {
        startPlayer(shell);
      }
    });
  });
});
