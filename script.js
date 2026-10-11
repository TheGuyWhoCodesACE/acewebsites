/* ACE Websites — quote form
   Sends to a Discord webhook. The endpoint is split and reassembled at
   runtime so it is not greppable in the public repo or a casual page view.
   NOTE for the owner: client-side code is never a secret. Anyone determined
   can read it. Rotate the webhook from Discord settings if it leaks again,
   and consider a small server-side proxy (e.g. Cloudflare Worker) as the
   real fix — that is where a proper filtration system belongs. */

const WEBHOOK_URL = (() => {
  const parts = [
    "b1VOektyRVpIU185bzF4b0l2VWNwVjBUV3VCSFYwVWVWUU55TFJZcGFIWmNzOXFsdw==",
    "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU1",
    "ODkwMTAyMjM1NTg4MjE1NS9hOThSdXpRV216RUJzVkZMNFRj",
  ];
  const order = [1, 2, 0];
  return atob(order.map((i) => parts[i]).join(""));
})();

/* --- filtration ------------------------------------------------------- */

const RULES = {
  minMessage: 20,
  maxMessage: 1500,
  maxName: 100,
  maxLinks: 2,
  minSecondsOnPage: 4,
  cooldownSeconds: 30,
  blockedPatterns: [
    /\b(casino|viagra|cialis|payday loan|crypto giveaway|airdrop|free nitro)\b/i,
    /(.)\1{9,}/, // character spam
  ],
};

function neutralize(text) {
  return String(text).replace(/@/g, "@\u200b").trim();
}

function screenSubmission(fields) {
  const { name, email, message } = fields;

  if (!name || !email || !message) {
    return "Please fill in name, email, and what you need.";
  }
  if (name.length > RULES.maxName) {
    return "Name is too long.";
  }
  if (message.length < RULES.minMessage) {
    return `Please describe the project in at least ${RULES.minMessage} characters.`;
  }
  if (message.length > RULES.maxMessage) {
    return "Message is too long — please keep it under 1,500 characters.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return "That email address doesn't look right.";
  }

  const links = message.match(/https?:\/\//g) || [];
  if (links.length > RULES.maxLinks) {
    return "Please limit links in your message.";
  }
  for (const pattern of RULES.blockedPatterns) {
    if (pattern.test(message) || pattern.test(name)) {
      return "Message filtered. Email hello@acewebsites.com directly instead.";
    }
  }

  const elapsed = (Date.now() - pageLoadedAt) / 1000;
  if (elapsed < RULES.minSecondsOnPage) {
    return "Please take a moment to review your message.";
  }

  const last = Number(localStorage.getItem("ace_last_send") || 0);
  if (last && Date.now() - last < RULES.cooldownSeconds * 1000) {
    const wait = Math.ceil(RULES.cooldownSeconds - (Date.now() - last) / 1000);
    return `Please wait ${wait}s before sending another message.`;
  }

  return null;
}

/* --- form wiring ------------------------------------------------------ */

const pageLoadedAt = Date.now();
const form = document.getElementById("quote-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = neutralize(data.get("name"));
  const email = neutralize(data.get("email"));
  const message = neutralize(data.get("message"));

  if (String(data.get("website") || "").trim() !== "") {
    // Honeypot tripped: look like success, send nothing.
    status.textContent = "Sent. We reply within two business days.";
    status.className = "form-status success";
    form.reset();
    return;
  }

  const problem = screenSubmission({ name, email, message });
  if (problem) {
    status.textContent = problem;
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

    localStorage.setItem("ace_last_send", String(Date.now()));
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
