import { H as LocalHls } from "./video-player-dru42stk.js";

(function () {
    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
            return;
        }
        callback();
    }

    function setStatus(player, message) {
        var status = player.querySelector("[data-player-status]");
        if (status) {
            status.textContent = message;
        }
    }

    function initPlayer(player) {
        var video = player.querySelector("video[data-video-src]");
        var toggles = player.querySelectorAll("[data-player-toggle]");
        var muteButton = player.querySelector("[data-player-mute]");
        var fullscreenButton = player.querySelector("[data-player-fullscreen]");
        var source = video ? video.dataset.videoSrc : "";
        var hls = null;

        if (!video || !source) {
            setStatus(player, "未找到播放源");
            return;
        }

        function markPlaying(isPlaying) {
            var center = player.querySelector(".center-play");
            if (center) {
                center.classList.toggle("is-hidden", isPlaying);
            }
        }

        function attachSource() {
            if (LocalHls && LocalHls.isSupported()) {
                hls = new LocalHls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(source);
                hls.attachMedia(video);
                hls.on(LocalHls.Events.MANIFEST_PARSED, function () {
                    setStatus(player, "播放源加载完成，点击播放");
                });
                hls.on(LocalHls.Events.ERROR, function (eventName, data) {
                    if (!data || !data.fatal) {
                        return;
                    }
                    if (data.type === LocalHls.ErrorTypes.NETWORK_ERROR) {
                        setStatus(player, "网络波动，正在重新加载");
                        hls.startLoad();
                    } else if (data.type === LocalHls.ErrorTypes.MEDIA_ERROR) {
                        setStatus(player, "媒体错误，正在恢复播放");
                        hls.recoverMediaError();
                    } else {
                        setStatus(player, "播放源暂时无法加载");
                        hls.destroy();
                    }
                });
                return;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                setStatus(player, "播放源加载完成，点击播放");
                return;
            }

            video.src = source;
            setStatus(player, "当前浏览器将尝试直接播放 HLS 源");
        }

        function togglePlay() {
            if (video.paused) {
                var playPromise = video.play();
                if (playPromise && typeof playPromise.catch === "function") {
                    playPromise.catch(function () {
                        setStatus(player, "浏览器阻止自动播放，请再次点击播放");
                    });
                }
            } else {
                video.pause();
            }
        }

        toggles.forEach(function (button) {
            button.addEventListener("click", togglePlay);
        });

        video.addEventListener("click", togglePlay);
        video.addEventListener("play", function () {
            markPlaying(true);
            setStatus(player, "正在播放");
        });
        video.addEventListener("pause", function () {
            markPlaying(false);
            setStatus(player, "已暂停");
        });
        video.addEventListener("ended", function () {
            markPlaying(false);
            setStatus(player, "播放结束");
        });

        if (muteButton) {
            muteButton.addEventListener("click", function () {
                video.muted = !video.muted;
                muteButton.textContent = video.muted ? "取消静音" : "静音";
            });
        }

        if (fullscreenButton) {
            fullscreenButton.addEventListener("click", function () {
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                    return;
                }
                player.requestFullscreen();
            });
        }

        window.addEventListener("beforeunload", function () {
            if (hls) {
                hls.destroy();
            }
        });

        attachSource();
    }

    ready(function () {
        document.querySelectorAll("[data-player]").forEach(initPlayer);
    });
})();
