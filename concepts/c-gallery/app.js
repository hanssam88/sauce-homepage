const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;
root.dataset.motion = reduceMotion ? "reduced" : "full";
root.classList.add("js");

const cards = [...document.querySelectorAll("[data-gallery-card]")];

if (reduceMotion) {
  cards.forEach((card) => card.classList.add("is-visible"));
} else {
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        cardObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  cards.forEach((card) => cardObserver.observe(card));
}
