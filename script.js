const WEBHOOK_URL =
  "https://discord.com/api/webhooks/1558681690455412766/K0JxP4cnRwidjmOUa9HdBsvYCvBP15m4WCDlLtJT2trGNKCX9Jid5gOST6zwFhAXMBvP";

/* Quote form → Discord webhook */

const form = document.getElementById("quote-form");
const status = document.getElementById("form-status");

function neutralize(text) {
  return String(text).replace(/@/g, "@\u200b").trim();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = neutralize(data.get("name"));
  const email = neutralize(data.get("email"));
  const message = neutralize(data.get("message"));

  if (!name || !email || !message) {
    status.textContent = "Please fill in name, email, and what you need.";
    status.className = "form-status error";
    return;
  }

  status.textContent = "Sending…";
  status.className = "form-status";
  const button = form.querySelector("button");
  button.disabled = true;

  const lines = [
    "**New quote request**",
    `**Name:** ${name}`,
    `**Email:** ${email}`,
    `**Need:** ${message}`,
  ];

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: lines.join("\n") }),
    });

    if (!res.ok) throw new Error(res.status);

    status.textContent = "Sent. We reply within two business days.";
    status.className = "form-status success";
    form.reset();
  } catch {
    status.textContent = "Could not send. Email hello@acewebsites.com instead.";
    status.className = "form-status error";
  } finally {
    button.disabled = false;
  }
});

/* Reveal on scroll */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -32px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
}

/* FAQ: only one open at a time */

const faqs = document.querySelectorAll(".faq details");
faqs.forEach((d) => {
  d.addEventListener("toggle", () => {
    if (!d.open) return;
    faqs.forEach((other) => {
      if (other !== d) other.open = false;
    });
  });
});
