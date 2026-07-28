const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.dataset.motion = reduceMotion ? "reduced" : "full";
root.classList.add("js");

const scenes = [...document.querySelectorAll("[data-scene]")];

function setVideoState(video, active) {
  if (!video) return;

  video.dataset.playing = active ? "true" : "false";
  if (!active) {
    video.pause();
    return;
  }

  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      video.dataset.playing = "false";
    });
  }
}

if (reduceMotion) {
  scenes.forEach((scene) => setVideoState(scene.querySelector("video"), false));
} else {
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-active", entry.isIntersecting);
      setVideoState(entry.target.querySelector("video"), entry.isIntersecting);
    });
  }, { threshold: 0.55 });

  scenes.forEach((scene) => sceneObserver.observe(scene));
}
