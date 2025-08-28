// Flashka — One-play-only lock, 16-attempt rule, SMS on win
// Card fronts/back images are controlled by CSS (Dexter set).

const MAX_ATTEMPTS = 16;      // total TURNS allowed (each turn = 2 flips)
const TOTAL_PAIRS  = 10;      // 10 pairs => 20 cards

// Persistent keys
const LOCK_KEY      = "flashka_locked";          // '1' once a game has completed
const PLAY_COUNT_KEY= "flashka_plays";           // device counter

// DOM refs
const boardEl        = document.getElementById("game-board");
const attemptsEl     = document.getElementById("attempts");
const attemptsLeftEl = document.getElementById("attempts-left");
const resultEl       = document.getElementById("result");
const resultMsgEl    = document.getElementById("result-message");
const timesPlayedEl  = document.getElementById("times-played");
const shareBtn       = document.getElementById("share-btn");
const gameOverBox    = document.getElementById("game-over-box");

// State
let attempts = 0;          // increments once per TURN (on the 2nd flip)
let matchedPairs = 0;
let lockBoard = false;
let firstCard = null;
let secondCard = null;

// Helpers
const getPlayCount = () => Number(localStorage.getItem(PLAY_COUNT_KEY) || 0);
const incrementPlayCount = () => {
  const n = getPlayCount() + 1;
  localStorage.setItem(PLAY_COUNT_KEY, String(n));
  return n;
};
const isLocked = () => localStorage.getItem(LOCK_KEY) === "1";
const setLocked = () => localStorage.setItem(LOCK_KEY, "1");

function updateAttemptsUI() {
  attemptsEl.textContent = String(attempts);
  attemptsLeftEl.textContent = String(Math.max(0, MAX_ATTEMPTS - attempts));
}

function buildDeck() {
  const ids = Array.from({ length: TOTAL_PAIRS }, (_, i) => i + 1); // 1..10
  const deck = [...ids, ...ids]; // pairs
  // Fisher–Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
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
  front.className = "card-face card-front"; // CSS shows Dexter logo

  const back = document.createElement("div");
  back.className = `card-face card-back image-${id}`; // CSS maps to Dexter# image

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
  // LOCK the device immediately (prevents refresh/new game)
  setLocked();

  resultEl.style.display = "block";
  gameOverBox.innerHTML = "";

  if (didWin) {
    resultMsgEl.textContent =
      "Woohoo. You won a choccy surprise. Just show this screen when you're called that your coffee is ready & collect your treat!";

    // Show SMS button only on a win
    shareBtn.style.display = "inline-block";
    shareBtn.textContent = "Send SMS";
    const smsBody =
      "hey I just won a choccy surprise at Le Cafe Ashgrove for solving flashka in 16 moves!!";
    shareBtn.onclick = () => {
      window.location.href = `sms:?&body=${encodeURIComponent(smsBody)}`;
    };

    gameOverBox.innerHTML =
      "<div class='prize-message'>One play per purchase. To play again, buy another coffee and scan the new QR.</div>";
  } else {
    resultMsgEl.textContent =
      "Oh shucks! Just missed it! One play per purchase. To try again, buy another coffee and scan the new QR.";
    shareBtn.style.display = "none";
    shareBtn.onclick = null;
  }

  const plays = incrementPlayCount();
  timesPlayedEl.textContent = `Times played on this device: ${plays}`;
}

function renderLockedScreen() {
  // Hide board, show lock message
  boardEl.innerHTML = "";
  resultEl.style.display = "block";
  shareBtn.style.display = "none";
  resultMsgEl.textContent =
    "This device has already played. One play per purchase.";
  gameOverBox.innerHTML =
    "<div>To play again, buy another coffee and scan the new QR code.</div>";
  // Make the counters look final/locked
  attemptsEl.textContent = "-";
  attemptsLeftEl.textContent = "0";
}

function startGame() {
  // If already locked, show lock screen and stop.
  if (isLocked()) {
    renderLockedScreen();
    return;
  }

  // Reset state for the current (first and only) run
  attempts = 0;
  matchedPairs = 0;
  lockBoard = false;
  firstCard = null;
  secondCard = null;

  // Reset UI
  updateAttemptsUI();
  resultEl.style.display = "none";
  resultMsgEl.textContent = "";
  shareBtn.style.display = "none";
  boardEl.innerHTML = "";

  // Build & render
  const deck = buildDeck();
  deck.forEach((id, idx) => boardEl.appendChild(makeCard(id, idx)));
}

// Boot
document.addEventListener("DOMContentLoaded", startGame);
