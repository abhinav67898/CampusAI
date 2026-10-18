
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const sampleNotices = [
  {
    id: 1,
    title: "Semester Examination Preparation",
    category: "Academic",
    date: "",
    description: "Check the official college portal for examination schedules, instructions and updates.",
    demo: true
  },
  {
    id: 2,
    title: "Upcoming Campus Activities",
    category: "Events",
    date: "",
    description: "Keep an eye on verified campus channels for event registration and participation details.",
    demo: true
  },
  {
    id: 3,
    title: "Internship Verification Reminder",
    category: "Career",
    date: "",
    description: "Verify internship opportunities through official company websites and trusted college channels.",
    demo: true
  }
];

let notices = [...sampleNotices];
let nextId = 4;
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function navigateTo(pageId) {
  const target = document.getElementById(pageId);
  if (!target) return;

  $$(".page").forEach(page => page.classList.remove("active"));
  target.classList.add("active");

  $$(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  $("#navigation").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (pageId === "dashboard") renderDashboard();
  if (pageId === "notices") renderNotices();
  if (pageId === "home") renderHomeNotices();
}

document.addEventListener("click", event => {
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    navigateTo(pageButton.dataset.page);
  }
});

$("#menuToggle").addEventListener("click", () => {
  $("#navigation").classList.toggle("open");
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(date) {
  if (!date) return "No deadline specified";
  const parsed = new Date(date + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function noticeHTML(notice, allowDelete = false) {
  const icons = {
    Academic: "▤",
    Events: "✦",
    Career: "↗",
    General: "◉"
  };

  return `
    <article class="notice-item">
      <div class="notice-marker">${icons[notice.category] || "▤"}</div>
      <div class="notice-body">
        <h3>${escapeHTML(notice.title)}</h3>
        <p>${escapeHTML(notice.description)}</p>
        <div class="notice-meta">
          <span class="tag">${escapeHTML(notice.category)}</span>
          <span>${escapeHTML(formatDate(notice.date))}</span>
          ${notice.demo ? "<span>Sample content</span>" : "<span>Session-only entry</span>"}
        </div>
      </div>
      ${allowDelete ? `<button class="delete-button" data-delete="${notice.id}" type="button">Delete</button>` : ""}
    </article>
  `;
}

function renderHomeNotices() {
  $("#homeNotices").innerHTML = notices.slice(0, 3).map(n => noticeHTML(n)).join("");
}

function renderNotices() {
  const search = ($("#noticeSearch").value || "").trim().toLowerCase();
  const category = $("#noticeFilter").value;

  const filtered = notices.filter(notice => {
    const matchesSearch = `${notice.title} ${notice.description} ${notice.category}`
      .toLowerCase().includes(search);
    const matchesCategory = category === "all" || notice.category === category;
    return matchesSearch && matchesCategory;
  });

  $("#allNotices").innerHTML = filtered.length
    ? filtered.map(n => noticeHTML(n)).join("")
    : `<div class="form-card"><p>No matching notices found. Try another search.</p></div>`;
}

$("#noticeSearch").addEventListener("input", renderNotices);
$("#noticeFilter").addEventListener("change", renderNotices);

function renderDashboard() {
  $("#statTotal").textContent = notices.length;
  $("#statAcademic").textContent = notices.filter(n => n.category === "Academic").length;
  $("#statCareer").textContent = notices.filter(n => n.category === "Career").length;

  $("#dashboardNotices").innerHTML = notices.length
    ? notices.map(n => noticeHTML(n, true)).join("")
    : "<p class='muted'>No notices yet. Add one using the form.</p>";
}

$("#noticeForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("#newTitle").value.trim();
  const category = $("#newCategory").value;
  const date = $("#newDate").value;
  const description = $("#newDescription").value.trim();

  if (!title || !description) {
    showToast("Please fill in the required fields.");
    return;
  }

  notices.unshift({
    id: nextId++,
    title,
    category,
    date,
    description,
    demo: false
  });

  event.target.reset();
  renderDashboard();
  renderHomeNotices();
  renderNotices();
  showToast("Demo notice added for this session.");
});

document.addEventListener("click", event => {
  const deleteButton = event.target.closest("[data-delete]");
  if (!deleteButton) return;

  const id = Number(deleteButton.dataset.delete);
  const notice = notices.find(n => n.id === id);

  if (!notice || notice.demo) {
    showToast("Sample notices cannot be deleted.");
    return;
  }

  notices = notices.filter(n => n.id !== id);
  renderDashboard();
  renderHomeNotices();
  renderNotices();
  showToast("Demo notice deleted.");
});

// Prototype assistant: responses are predefined, not generated by a real AI.
function getDemoAnswer(question) {
  const q = question.toLowerCase();

  if (q.includes("notice") || q.includes("deadline") || q.includes("exam")) {
    return {
      answer: "Open the Notices section and use the search box or category filter to explore the sample announcements. For real dates and examination instructions, check the official college portal.",
      source: "Suggested source to verify: official college notices or academic portal."
    };
  }

  if (q.includes("internship") || q.includes("opportunity") ||
      q.includes("scam") || q.includes("verify")) {
    return {
      answer: "Check the sender's email domain, visit the company's official careers page independently, verify the role and recruiter, and be cautious about registration fees or requests for OTPs and passwords. A text check alone cannot confirm whether an offer is genuine.",
      source: "Suggested source to verify: the company's official careers website and verified college placement channels."
    };
  }

  if (q.includes("upload") || q.includes("faculty") ||
      q.includes("teacher") || q.includes("dashboard")) {
    return {
      answer: "Open Teacher Dashboard, enter a notice title, choose a category, optionally add a deadline, write its description, and select Add demo notice. This prototype does not upload PDFs or publish notices to a real server.",
      source: "Source: Clarivo frontend prototype instructions."
    };
  }

  if (q.includes("attendance")) {
    return {
      answer: "Attendance requirements can depend on the applicable college and university rules. Check the current official academic regulations or ask your department before making decisions.",
      source: "Suggested source to verify: official academic regulations."
    };
  }

  if (q.includes("contact") || q.includes("help") || q.includes("support")) {
    return {
      answer: "For official academic help, contact the relevant department or college office using contact details published on the official college website.",
      source: "Suggested source to verify: official college website."
    };
  }

  return {
    answer: "I can help you explore notices, understand opportunity-verification checks, or use the teacher dashboard. Try asking about notices, internships, deadlines, or uploading a notice. This demo cannot retrieve official KIET documents yet.",
    source: "Source: Clarivo demo guidance. No live college database is connected."
  };
}

function addMessage(text, type, source = "") {
  const message = document.createElement("div");
  message.className = `message ${type === "user" ? "user-message" : "assistant-message"}`;

  const body = document.createElement("p");
  body.textContent = text;
  message.appendChild(body);

  if (source) {
    const note = document.createElement("small");
    note.textContent = source;
    message.appendChild(note);
  }

  $("#chatMessages").appendChild(message);
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
}

function askAssistant(question) {
  const cleaned = question.trim();
  if (!cleaned) return;

  addMessage(cleaned, "user");
  const response = getDemoAnswer(cleaned);
  addMessage(response.answer, "assistant", response.source);
}

$("#chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = $("#chatInput");
  askAssistant(input.value);
  input.value = "";
});

$$(".suggestion").forEach(button => {
  button.addEventListener("click", () => askAssistant(button.textContent));
});

// Basic warning-sign review. It does not establish whether an offer is genuine.
$("#verifyForm").addEventListener("submit", event => {
  event.preventDefault();

  const title = $("#offerTitle").value.trim();
  const sender = $("#offerSender").value.trim();
  const message = `${title} ${sender} ${$("#offerText").value}`.toLowerCase();

  const checks = [
    {
      label: "Payment or registration fee",
      pattern: /\b(registration fee|processing fee|pay now|payment required|security deposit|training fee)\b/i
    },
    {
      label: "Urgent pressure",
      pattern: /\b(urgent|immediately|act now|limited time|last chance|within \d+ hours)\b/i
    },
    {
      label: "Sensitive information request",
      pattern: /\b(otp|one time password|share your password|bank pin|upi pin|account password)\b/i
    },
    {
      label: "Unusually strong promises",
      pattern: /\b(guaranteed job|guaranteed placement|earn \₹?\s*\d+|100% guaranteed)\b/i
    }
  ];

  const flagged = checks.filter(check => check.pattern.test(message));
  const result = $("#verifyResult");
  result.classList.remove("hidden");

  let heading;
  let explanation;

  if (flagged.length >= 2) {
    heading = "Several warning signs found";
    explanation = "This text contains multiple patterns that deserve careful verification. Do not pay or share sensitive information until you independently verify the offer.";
  } else if (flagged.length === 1) {
    heading = "A warning sign needs review";
    explanation = "One potentially concerning pattern was detected. Investigate it carefully before taking action.";
  } else {
    heading = "No listed warning patterns detected";
    explanation = "This does not mean the opportunity is genuine. Scams can use convincing language and avoid obvious warning signs.";
  }

  result.innerHTML = `
    <span class="eyebrow">TEXT-BASED DEMO CHECK</span>
    <h2>${escapeHTML(heading)}</h2>
    <p>${escapeHTML(explanation)}</p>
    <h3>Review results</h3>
    <ul>
      ${flagged.length
        ? flagged.map(item => `<li>${escapeHTML(item.label)}</li>`).join("")
        : "<li>No matching patterns from this basic checklist.</li>"}
    </ul>
    <p><b>Next steps:</b> Find the organization's official website independently, confirm the vacancy there, verify the sender's domain, and contact a trusted college placement representative if uncertain.</p>
    <p class="small">This is a simple rule-based demo, not a verified fraud detector. It does not check links, email headers, company records or official databases.</p>
  `;

  result.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#reminderToggle").addEventListener("change", event => {
  showToast(event.target.checked
    ? "Reminder demo messages are enabled."
    : "Reminder demo messages are disabled.");
});

// Initial page rendering.
renderHomeNotices();
renderNotices();
renderDashboard();
