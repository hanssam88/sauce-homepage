const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.dataset.motion = reduceMotion ? "reduced" : "full";
root.classList.add("js");

const chapters = [...document.querySelectorAll("[data-chapter]")];

if (!reduceMotion) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  chapters.forEach((chapter) => revealObserver.observe(chapter));
} else {
  chapters.forEach((chapter) => chapter.classList.add("is-visible"));
}
