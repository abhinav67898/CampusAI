// Clarivo beginner-friendly JavaScript

let selectedRole = "Student";
let isSignUp = false;
let currentQuestion = "When is the AI workshop be conducted?";
let currentAnswer = "AI workshop will begin from Monday, 4 November, 2026.";
let currentSource = "The AI club is organizing the workshop for students.";

// Student or Teacher selection
const roleButtons = document.querySelectorAll(".role-button");

roleButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    selectedRole = button.dataset.role;

    roleButtons.forEach(function(item) {
      item.classList.remove("active");
    });

    button.classList.add("active");
  });
});

// Login and Sign-up button
const authTitle = document.getElementById("authTitle");
const loginButton = document.getElementById("loginButton");
const signupButton = document.getElementById("signupButton");
const authMessage = document.getElementById("authMessage");

signupButton.addEventListener("click", function() {
  isSignUp = !isSignUp;

  if (isSignUp) {
    authTitle.textContent = "Create your account";
    loginButton.textContent = "Create account >";
    signupButton.textContent = "Back to log in";
    authMessage.textContent =
      "Demo sign-up: enter your college ID and password.";
  } else {
    authTitle.textContent = "Welcome back!";
    loginButton.textContent = "Log in >";
    signupButton.textContent = "Sign up >";
    authMessage.textContent = "";
  }
});

// Login form
const authForm = document.getElementById("authForm");
const authPage = document.getElementById("authPage");
const dashboard = document.getElementById("dashboard");

authForm.addEventListener("submit", function(event) {
  event.preventDefault();

  const collegeId = document.getElementById("collegeId").value.trim();

  if (collegeId === "") {
    authMessage.textContent = "Please enter your college ID.";
    return;
  }

  authPage.classList.add("hidden");
  dashboard.classList.remove("hidden");

  const name = collegeId.includes("@")
    ? collegeId.split("@")[0]
    : selectedRole;

  document.getElementById("profileName").textContent = name;
  document.getElementById("profileCourse").textContent =
    selectedRole + " • KIET";

  document.getElementById("profileAvatar").textContent =
    selectedRole === "Teacher" ? "TC" : "ST";

  document.getElementById("questionAvatar").textContent =
    selectedRole === "Teacher" ? "TC" : "ST";
});

// Logout
document.getElementById("logoutButton").addEventListener("click", function() {
  dashboard.classList.add("hidden");
  authPage.classList.remove("hidden");

  document.getElementById("authMessage").textContent =
    "You have returned to the login screen.";
});

// Display answers to questions
function showAnswer(question) {
  currentQuestion = question;

  const lowerQuestion = question.toLowerCase();

  currentAnswer =
    "I couldn't find a matching notice in this demo. Please check the official KIET portal or contact your department.";

  currentSource =
    "No matching official notice is connected to this demo yet.";

  if (lowerQuestion.includes("workshop") ||
      lowerQuestion.includes("ai club")) {

    currentAnswer =
      "The AI workshop is listed as starting on Monday, 4 November, 2026, in this sample demo.";

    currentSource =
      "The AI club is organizing the workshop for students.";

  } else if (lowerQuestion.includes("exam") ||
             lowerQuestion.includes("timetable")) {

    currentAnswer =
      "Please check the latest official examination timetable for the confirmed date and time.";

    currentSource =
      "Examination dates should be confirmed from the official KIET notice.";

  } else if (lowerQuestion.includes("syllabus")) {

    currentAnswer =
      "Please open the latest syllabus shared by your department before preparing for your subjects.";

    currentSource =
      "Syllabus updates should be confirmed from the official department notice.";

  } else if (lowerQuestion.includes("assignment")) {

    currentAnswer =
      "Check your subject teacher's latest assignment notice for questions and submission deadlines.";

    currentSource =
      "Assignment details should be confirmed by the subject teacher.";

  } else if (lowerQuestion.includes("scholarship")) {

    currentAnswer =
      "Check the current scholarship notice for eligibility, documents, and the final application date.";

    currentSource =
      "Scholarship eligibility depends on the current official notice.";

  } else if (lowerQuestion.includes("hostel") ||
             lowerQuestion.includes("fee")) {

    currentAnswer =
      "Check the official fee notice or student portal for payment details and deadlines.";

    currentSource =
      "Confirm fee details through the official student portal.";

  } else if (lowerQuestion.includes("internship")) {

    currentAnswer =
      "Review the internship notice carefully and confirm the company, eligibility, deadline, and application link.";

    currentSource =
      "Confirm opportunities with the official placement cell.";

  } else if (lowerQuestion.includes("hackathon") ||
             lowerQuestion.includes("registration")) {

    currentAnswer =
      "The sample notice says registration closes on 5 November. Confirm the date with the official event notice.";

    currentSource =
      "Sample hackathon registration deadline: 5 November.";
  }

  document.getElementById("displayQuestion").textContent = question;
  document.getElementById("answerText").textContent = currentAnswer;
  document.getElementById("sourceText").textContent = currentSource;

  document.getElementById("sourceCount").textContent =
    currentSource.startsWith("No matching")
      ? "No trusted source connected"
      : "Demo answer • verify with official source";

  document.getElementById("dashboardMessage").textContent =
    "This is a sample prototype. Answers are not connected to a live college database.";
}

// Search form
document.getElementById("searchForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const question = document.getElementById("questionInput").value.trim();

  if (question !== "") {
    showAnswer(question);
    addRecentChat(question);

    document.getElementById("questionInput").value = "";
  }
});

// Suggested questions
document.querySelectorAll("[data-prompt]").forEach(function(button) {
  button.addEventListener("click", function() {
    showAnswer(button.dataset.prompt);
    addRecentChat(button.dataset.prompt);
  });
});

// Existing recent chats
document.querySelectorAll(".chat-item").forEach(function(button) {
  button.addEventListener("click", function() {
    showAnswer(button.dataset.question);
  });
});

// Add a question to recent chats
function addRecentChat(question) {
  const chatList = document.getElementById("chatList");

  const newItem = document.createElement("button");
  newItem.className = "chat-item";
  newItem.dataset.question = question;

  newItem.innerHTML = "◯ <span></span><small>Now</small>";

  newItem.querySelector("span").textContent = question;

  newItem.addEventListener("click", function() {
    showAnswer(question);
  });

  chatList.prepend(newItem);
}

// New conversation
document.getElementById("newChatButton").addEventListener("click", function() {
  document.getElementById("displayQuestion").textContent =
    "What would you like to know?";

  document.getElementById("answerText").textContent =
    "Ask a question about college notices, exams, fees, scholarships, or events.";

  document.getElementById("sourceText").textContent =
    "No source selected yet. Ask a question to see a sample response.";

  document.getElementById("sourceCount").textContent =
    "Waiting for your question";

  document.getElementById("dashboardMessage").textContent = "";

  document.getElementById("questionInput").focus();
});

// View all conversations
document.getElementById("viewChatsButton").addEventListener("click", function() {
  document.getElementById("dashboardMessage").textContent =
    "Your recent demo conversations are listed in the left panel.";
});

// Copy answer
document.getElementById("copyButton").addEventListener("click", function() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(currentAnswer);

    document.getElementById("dashboardMessage").textContent =
      "Answer copied, if clipboard permission is available.";
  } else {
    document.getElementById("dashboardMessage").textContent =
      "Clipboard is not available in this browser.";
  }
});

// Original notice button
document.getElementById("sourceButton").addEventListener("click", function() {
  document.getElementById("dashboardMessage").textContent =
    "Demo only: connect this button to the real official notice URL when available.";
});

// Helpful feedback buttons
document.querySelectorAll("[data-feedback]").forEach(function(button) {
  button.addEventListener("click", function() {
    document.getElementById("dashboardMessage").textContent =
      "Thanks for your feedback: " + button.dataset.feedback + ".";
  });
});

// Open email checker
const emailModal = document.getElementById("emailModal");

function openEmailModal() {
  emailModal.classList.remove("hidden");
  document.getElementById("emailContent").focus();
}

document.getElementById("verifyEmailButton").addEventListener("click", openEmailModal);
document.getElementById("verifyEmailTop").addEventListener("click", openEmailModal);

// Close email checker
document.getElementById("closeModal").addEventListener("click", function() {
  emailModal.classList.add("hidden");
});

emailModal.addEventListener("click", function(event) {
  if (event.target === emailModal) {
    emailModal.classList.add("hidden");
  }
});

// Check an email for common warning words
document.getElementById("checkEmailButton").addEventListener("click", function() {
  const content = document.getElementById("emailContent").value.trim().toLowerCase();
  const result = document.getElementById("emailResult");

  if (content === "") {
    result.className = "email-result warning";
    result.textContent = "Please paste an email message or link first.";
    return;
  }

  const warningWords = [
    "urgent",
    "password",
    "pay now",
    "registration fee",
    "limited time",
    "click here",
    "verify your account",
    "otp",
    "bank details",
    "guaranteed internship"
  ];

  let foundWarning = false;

  for (let i = 0; i < warningWords.length; i++) {
    if (content.includes(warningWords[i])) {
      foundWarning = true;
    }
  }

  if (foundWarning) {
    result.className = "email-result warning";

    result.textContent =
      "Warning signs found: this message contains wording often used in suspicious messages. Do not click links or pay until you independently verify the sender through an official channel.";

  } else {
    result.className = "email-result neutral";

    result.textContent =
      "No listed warning words were found, but that does not prove the message is genuine. Check the sender address and confirm links through an official source.";
  }
});

// Help centre
document.getElementById("helpButton").addEventListener("click", function() {
  document.getElementById("dashboardMessage").textContent =
    "Help: enter a question in the search bar, choose a sample prompt, or use Verify an email.";
});