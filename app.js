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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
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

const ideasRef = collection(db, "ideas");
const ideasQuery = query(ideasRef, orderBy("createdAt", "desc"));

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "#c24f4f" : "#2d5a9d";
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
      votes: 1,
      createdAt: serverTimestamp(),
    });

    form.reset();
    showMessage("Your idea was added!");
  } catch (error) {
    console.error("Failed to add idea:", error);
    showMessage("Something went wrong. Try again in a moment.", true);
  }
}

async function voteOnIdea(id, change) {
  const ideaRef = doc(db, "ideas", id);

  try {
    await updateDoc(ideaRef, {
      votes: increment(change),
    });
  } catch (error) {
    console.error("Failed to vote:", error);
    showMessage("The vote did not go through.", true);
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
      const votes = Number(idea.votes || 0);
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
            <span>Posted ${formatDate(idea.createdAt)}</span>

            <div class="vote-box">
              <button
                type="button"
                class="vote-btn up"
                data-id="${idea.id}"
                data-vote="1"
                aria-label="Vote up for ${safeTitle}"
              >
                ▲
              </button>

              <span class="vote-count">${votes}</span>

              <button
                type="button"
                class="vote-btn down"
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
  const change = Number(voteButton.dataset.vote);

  if (!id || Number.isNaN(change)) {
    return;
  }

  await voteOnIdea(id, change);
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
