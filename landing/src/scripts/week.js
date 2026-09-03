// Sticky phone mirrors whichever day card is in view. Progressive: without JS the phone shows Sunday.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const phone = document.querySelector("[data-week-phone]");
const cards = document.querySelectorAll("[data-day]");
if (phone && cards.length) {
  const dayEl = phone.querySelector("[data-phone-day]");
  const actionEl = phone.querySelector("[data-phone-action]");
  const dots = phone.querySelectorAll("[data-phone-dots] i");
  const choices = phone.querySelectorAll("[data-phone-choice]");

  const apply = (card) => {
    const { day, action, dots: dotState = "", pick = "" } = card.dataset;
    if (dayEl) dayEl.textContent = day;
    if (actionEl && action) actionEl.textContent = action;
    const states = dotState.split("");
    dots.forEach((d, i) => {
      d.className = { y: "", n: "miss", p: "part" }[states[i]] ?? "none";
    });
    choices.forEach((c) => c.classList.toggle("picked", c.dataset.phoneChoice === pick));
  };

  cards.forEach((card) => {
    ScrollTrigger.create({
      trigger: card,
      start: "top 55%",
      end: "bottom 55%",
      onEnter: () => apply(card),
      onEnterBack: () => apply(card),
    });
  });
}
