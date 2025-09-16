// Flashka – 4 unique images, 8 cards total, 7-attempt rule, SMS on win + Google Sheets tracking

const MAX_ATTEMPTS = 6;      // total TURNS allowed (each turn = 2 flips)
const TOTAL_PAIRS  = 4;      // 4 pairs = 8 cards total

// Persistent (local) play counter only – no lock
const PLAY_COUNT_KEY = "flashka_plays";

// DOM refs
const boardEl        = document.getElementById("game-board");
const attemptsEl     = document.getElementById("attempts");
const attemptsLeftEl = document.getElementById("attempts-left");
const resultEl       = document.getElementById("result");
const resultMsgEl    = document.getElementById("result-message");
const timesPlayedEl  = document.getElementById("times-played");
const shareBtn       = document.getElementById("share-btn");
const gameOverBox    = document.getElementById("game-over-box");

// Modal refs
const welcomeModal   = document.getElementById("welcome-modal");
const modalClose     = document.getElementById("modal-close");
const sponsorLogo    = document.getElementById("sponsor-logo");

// State
let attempts = 0;          // increments once per TURN (on the 2nd flip)
let matchedPairs = 0;
let lockBoard = false;
let firstCard = null;
let secondCard = null;

// Modal functions
function showWelcomeModal() {
  welcomeModal.classList.remove("hidden");
}

function hideWelcomeModal() {
  welcomeModal.classList.add("hidden");
}

// Close modal when X is clicked
modalClose.addEventListener("click", hideWelcomeModal);

// Close modal when clicking outside content
welcomeModal.addEventListener("click", (e) => {
  if (e.target === welcomeModal) {
    hideWelcomeModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !welcomeModal.classList.contains("hidden")) {
    hideWelcomeModal();
  }
});

// Helpers
const getPlayCount = () => Number(localStorage.getItem(PLAY_COUNT_KEY) || 0);
const incrementPlayCount = () => {
  const n = getPlayCount() + 1;
  localStorage.setItem(PLAY_COUNT_KEY, String(n));
  return n;
};

function updateAttemptsUI() {
  attemptsEl.textContent = String(attempts);
  attemptsLeftEl.textContent = String(Math.max(0, MAX_ATTEMPTS - attempts));
}

function buildDeck() {
  // Create 4 unique image IDs: [1, 2, 3, 4]
  const ids = Array.from({ length: TOTAL_PAIRS }, (_, i) => i + 1);
  
  // Create pairs: [1, 2, 3, 4, 1, 2, 3, 4] = 8 cards total
  const deck = [...ids, ...ids];
  
  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  console.log(`Deck created: ${deck.length} cards for ${TOTAL_PAIRS} pairs`);
  return deck;
}

function makeCard(id, idx) {
  const btn = document.createElement("button");
  btn.className = "card";
  btn.setAttribute("data-id", String(id));
  btn.setAttribute("data-idx", String(idx));
  btn.setAttribute("aria-label", "Flashka card");

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const front = document.createElement("div");
  front.className = "card-face card-front"; // CSS shows logo

  const back = document.createElement("div");
  back.className = `card-face card-back image-${id}`; // CSS maps to image 1-4

  inner.appendChild(front);
  inner.appendChild(back);
  btn.appendChild(inner);

  btn.addEventListener("click", () => onCardClick(btn));
  return btn;
}

function onCardClick(card) {
  if (lockBoard) return;
  if (card === firstCard) return; // same card double-click
  if (attempts >= MAX_ATTEMPTS && matchedPairs < TOTAL_PAIRS) return; // no moves left

  flip(card);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  // second selection
  secondCard = card;
  attempts += 1; // count one TURN
  updateAttemptsUI();

  const isMatch = firstCard.dataset.id === secondCard.dataset.id;

  if (isMatch) {
    keepMatched(firstCard, secondCard);
    matchedPairs += 1;
    resetPick();
    checkEnd();
  } else {
    lockBoard = true;
    setTimeout(() => {
      unflip(firstCard);
      unflip(secondCard);
      resetPick();
      lockBoard = false;
      checkEnd();
    }, 700);
  }
}

function flip(card) {
  card.classList.add("flipped");
}
function unflip(card) {
  card.classList.remove("flipped");
}
function keepMatched(a, b) {
  a.classList.add("matched");
  b.classList.add("matched");
  a.disabled = true;
  b.disabled = true;
}
function resetPick() {
  firstCard = null;
  secondCard = null;
}

function checkEnd() {
  const solved = matchedPairs === TOTAL_PAIRS;
  const outOfAttempts = attempts >= MAX_ATTEMPTS;

  if (solved) {
    showResult(true);
  } else if (outOfAttempts) {
    showResult(false);
  }
}

function showResult(didWin) {
  resultEl.style.display = "block";
  gameOverBox.innerHTML = "";

  if (didWin) {
    // WINNER - Bright green background
    resultMsgEl.style.backgroundColor = "#28a745";
    resultMsgEl.style.color = "white";
    resultMsgEl.style.padding = "15px";
    resultMsgEl.style.borderRadius = "8px";
    resultMsgEl.style.fontWeight = "bold";
    resultMsgEl.style.margin = "10px 0";
    
    gameOverBox.style.backgroundColor = "#28a745";
    gameOverBox.style.color = "white";
    gameOverBox.style.border = "2px solid #1e7e34";
    
    resultMsgEl.textContent =
      "Woohoo!! You won! Show this screen at the counter to collect your CHOCCY!";

    // Send win data to kiosk server (silent - no alerts)
    fetch('https://flashkakiosk16.onrender.com/api/win', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      if (response.ok) {
        console.log('Win recorded successfully');
      }
    }).catch(err => console.log('Win tracking failed:', err));

    // Hide SMS button on win
    shareBtn.style.display = "none";
    shareBtn.onclick = null;
  } else {
    // LOSER - Bright red background
    resultMsgEl.style.backgroundColor = "#dc3545";
    resultMsgEl.style.color = "white";
    resultMsgEl.style.padding = "15px";
    resultMsgEl.style.borderRadius = "8px";
    resultMsgEl.style.fontWeight = "bold";
    resultMsgEl.style.margin = "10px 0";
    
    gameOverBox.style.backgroundColor = "#dc3545";
    gameOverBox.style.color = "white";
    gameOverBox.style.border = "2px solid #c82333";
    
    resultMsgEl.textContent =
      "Oh shucks! Just missed it! Thanks for playing. On your next visit scan the QR code to play again.";
    shareBtn.style.display = "none";
    shareBtn.onclick = null;
  }

  const plays = incrementPlayCount();
  timesPlayedEl.textContent = `Times played on this device: ${plays}`;
}

function startGame() {
  // Reset state for a run
  attempts = 0;
  matchedPairs = 0;
  lockBoard = false;
  firstCard = null;
  secondCard = null;

  // Send play data to kiosk server (silent - no alerts)
  fetch('https://flashkakiosk16.onrender.com/api/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).then(response => {
    if (response.ok) {
      console.log('Game play recorded successfully');
    }
  }).catch(err => console.log('Play tracking failed:', err));

  // Reset UI
  updateAttemptsUI();
  resultEl.style.display = "none";
  resultMsgEl.textContent = "";
  shareBtn.style.display = "none";
  boardEl.innerHTML = "";

  // Reset styling
  resultMsgEl.style.backgroundColor = "";
  resultMsgEl.style.color = "";
  resultMsgEl.style.padding = "";
  resultMsgEl.style.borderRadius = "";
  resultMsgEl.style.fontWeight = "";
  resultMsgEl.style.margin = "";
  gameOverBox.style.backgroundColor = "";
  gameOverBox.style.color = "";
  gameOverBox.style.border = "";

  // Build & render 8 cards (4 pairs)
  const deck = buildDeck();
  deck.forEach((id, idx) => boardEl.appendChild(makeCard(id, idx)));
}

function setSponsorTagline() {
  // Find the ticker text element
  const tickerEl = document.querySelector(".ticker-text");
  
  if (!tickerEl) {
    console.error("ticker-text element not found!");
    return;
  }
  
  // Get current ad pack from URL or default to ad2
  const urlParams = new URLSearchParams(window.location.search);
  let pack = urlParams.get('pack') || urlParams.get('ad') || 'ad2';
  
  // Normalize pack name - UPDATED TO SUPPORT ad8
  if (/^[1-8]$/.test(pack)) pack = 'ad' + pack;
  
  // Tagline messages for each ad pack - ADDED ad8
  const taglines = {
    'ad1': "The sleeper hit show streaming now on Paramount Plus.",
    'ad2': "Remy Durieux; Carina's favourite real estate agent!",
    'ad3': "Married at First Sight favourites!",
    'ad4': "Save up to 30% on real estate agent's commission!",
    'ad5': "The sleeper hit show streaming now on Paramount Plus.",
    'ad7': "Save up to 30% on real estate agent's commission!",
    'ad8': "Yellow Utes: Instant Ute Rental Anywhere in Brisbane!"
  };
  
  const selectedTagline = taglines[pack] || taglines['ad2'];
  
  // Set the ticker text
  tickerEl.textContent = selectedTagline;
  
  console.log(`Ticker set: ${pack} -> ${selectedTagline}`);
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, starting game...");
  startGame();
  
  // Set sponsor tagline
  setTimeout(() => {
    setSponsorTagline();
  }, 100);
  
  // Show welcome modal on page load
  setTimeout(() => {
    showWelcomeModal();
  }, 500); // Small delay for smoother experience
});