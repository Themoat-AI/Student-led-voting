import {
  initializeApp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQ11xqFkG-gOlA2ZlNrDmMZJ8OugIBNOA",
  authDomain: "student-voting-bd329.firebaseapp.com",
  projectId: "student-voting-bd329",
  storageBucket: "student-voting-bd329.firebasestorage.app",
  messagingSenderId: "875267736003",
  appId: "1:875267736003:web:6e9b85a7578cc76cb8fd76",
  measurementId: "G-KY7DM7PMVM",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById("idea-form");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const ideasContainer = document.getElementById("ideas");
const ideaCount = document.getElementById("idea-count");
const formMessage = document.getElementById("form-message");

const browserStorageKey = "student-voting-browser-id";
const ideasRef = collection(db, "ideas");
const ideasQuery = query(ideasRef, orderBy("voteTotal", "desc"));

function getBrowserId() {
  let browserId = localStorage.getItem(browserStorageKey);

  if (!browserId) {
    browserId = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `browser-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(browserStorageKey, browserId);
  }

  return browserId;
}

const browserId = getBrowserId();

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "#ff8d8d" : "#9fe4ff";
}

async function addIdea(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const category = categoryInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!title || !category || !description) {
    showMessage("Please fill in all fields before posting.", true);
    return;
  }

  try {
    await addDoc(ideasRef, {
      title,
      category,
      description,
      voteTotal: 0,
      userVotes: {},
      createdAt: serverTimestamp(),
    });

    form.reset();
    showMessage("Your idea was added successfully!");
  } catch (error) {
    console.error("Failed to add idea:", error);
    showMessage("Something went wrong. Try again in a moment.", true);
  }
}

function getVoteTotal(idea) {
  return Number(idea.voteTotal ?? idea.votes ?? 0);
}

function getUserVote(idea) {
  const userVotes = idea.userVotes || {};
  return Number(userVotes[browserId] || 0);
}

async function voteOnIdea(id, nextVote) {
  const ideaRef = doc(db, "ideas", id);

  try {
    const snapshot = await getDoc(ideaRef);

    if (!snapshot.exists()) {
      showMessage("That idea is no longer available.", true);
      return;
    }

    const idea = snapshot.data();
    const userVotes = idea.userVotes || {};
    const currentVote = Number(userVotes[browserId] || 0);

    if (currentVote === nextVote) {
      showMessage("You have already voted this way for this idea.", false);
      return;
    }

    const delta = nextVote - currentVote;
    const updatedVotes = {
      ...userVotes,
      [browserId]: nextVote,
    };

    await updateDoc(ideaRef, {
      voteTotal: increment(delta),
      userVotes: updatedVotes,
    });

    showMessage(
      nextVote === 1
        ? "Your vote was updated to support this idea."
        : "Your vote was updated to oppose this idea.",
      false
    );
  } catch (error) {
    console.error("Failed to vote:", error);
    showMessage("The vote did not go through. Please try again.", true);
  }
}

function formatDate(timestamp) {
  if (!timestamp) {
    return "just now";
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderIdeas(ideas) {
  ideaCount.textContent = `${ideas.length} ${ideas.length === 1 ? "idea" : "ideas"}`;

  if (!ideas.length) {
    ideasContainer.innerHTML = `
      <div class="empty-state">
        No ideas yet. Be the first to post one.
      </div>
    `;
    return;
  }

  ideasContainer.innerHTML = ideas
    .map((idea) => {
      const votes = getVoteTotal(idea);
      const userVote = getUserVote(idea);
      const hasVoted = userVote !== 0;
      const isUpSelected = userVote === 1;
      const isDownSelected = userVote === -1;
      const safeTitle = escapeHtml(idea.title);
      const safeCategory = escapeHtml(idea.category);
      const safeDescription = escapeHtml(idea.description);

      return `
        <article class="idea-card">
          <div class="idea-top">
            <h3 class="idea-title">${safeTitle}</h3>
            <span class="tag-pill">${safeCategory}</span>
          </div>

          <p class="idea-body">${safeDescription}</p>

          <div class="idea-meta">
            <div class="idea-meta-left">
              <span>Posted ${formatDate(idea.createdAt)}</span>
              <span class="vote-status ${hasVoted ? "active" : ""}">
                ${hasVoted ? (userVote === 1 ? "You voted for this" : "You voted against this") : "Vote once per idea"}
              </span>
            </div>

            <div class="vote-box">
              <button
                type="button"
                class="vote-btn up ${isUpSelected ? "selected" : ""}"
                data-id="${idea.id}"
                data-vote="1"
                aria-label="Vote up for ${safeTitle}"
              >
                ▲
              </button>

              <span class="vote-count">${votes}</span>

              <button
                type="button"
                class="vote-btn down ${isDownSelected ? "selected" : ""}"
                data-id="${idea.id}"
                data-vote="-1"
                aria-label="Vote down for ${safeTitle}"
              >
                ▼
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

form.addEventListener("submit", addIdea);

document.addEventListener("click", async (event) => {
  const voteButton = event.target.closest(".vote-btn");

  if (!voteButton) {
    return;
  }

  const id = voteButton.dataset.id;
  const nextVote = Number(voteButton.dataset.vote);

  if (!id || Number.isNaN(nextVote)) {
    return;
  }

  await voteOnIdea(id, nextVote);
});

onSnapshot(
  ideasQuery,
  (snapshot) => {
    const ideas = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    renderIdeas(ideas);
  },
  (error) => {
    console.error("Snapshot error:", error);
    ideasContainer.innerHTML = `
      <div class="empty-state">
        The ideas list could not load right now. Please refresh the page.
      </div>
    `;
  }
);
