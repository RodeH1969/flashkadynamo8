// Flashka Game Script – 8 pairs, 17 attempts

const totalPairs = 8;        // 8 pairs (16 cards)
const maxAttempts = 17;      // attempts allowed

let attempts = 0;
let attemptsLeft = maxAttempts;
let matches = 0;
let flippedCards = [];
let lockBoard = false;

const gameBoard = document.getElementById("game-board");
const attemptsEl = document.getElementById("attempts");
const attemptsLeftEl = document.getElementById("attempts-left");
const resultBox = document.getElementById("result");
const resultMsg = document.getElementById("result-message");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function createBoard() {
  const cards = [];
  for (let i = 1; i <= totalPairs; i++) {
    cards.push(i, i);
  }
  shuffle(cards);

  gameBoard.innerHTML = "";
  cards.forEach((num) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.card = num;

    const inner = document.createElement("div");
    inner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("card-front");

    const back = document.createElement("div");
    back.classList.add("card-back");

    inner.appendChild(front);
    inner.appendChild(back);
    card.appendChild(inner);
    gameBoard.appendChild(card);

    card.addEventListener("click", flipCard);
  });
}

function flipCard() {
  if (lockBoard) return;
  if (this.classList.contains("flipped")) return;

  this.classList.add("flipped");
  flippedCards.push(this);

  if (flippedCards.length === 2) {
    lockBoard = true;
    attempts++;
    attemptsLeft = maxAttempts - attempts;
    attemptsEl.textContent = attempts;
    attemptsLeftEl.textContent = attemptsLeft;

    checkForMatch();
  }
}

function checkForMatch() {
  const [card1, card2] = flippedCards;
  const isMatch = card1.dataset.card === card2.dataset.card;

  if (isMatch) {
    matches++;
    card1.classList.add("matched");
    card2.classList.add("matched");
    resetTurn();

    if (matches === totalPairs) {
      endGame(true);
    }
  } else {
    setTimeout(() => {
      card1.classList.remove("flipped");
      card2.classList.remove("flipped");
      resetTurn();
    }, 1000);
  }

  if (attempts >= maxAttempts && matches < totalPairs) {
    endGame(false);
  }
}

function resetTurn() {
  flippedCards = [];
  lockBoard = false;
}

function endGame(won) {
  resultBox.style.display = "block";
  if (won) {
    resultMsg.textContent = "Congratulations! You won a choccy!";
    document.getElementById("share-btn").style.display = "inline-block";
  } else {
    resultMsg.textContent = "Oh shucks! Out of attempts. Try again tomorrow!";
  }
  gameBoard.style.pointerEvents = "none";
}

// Start game
createBoard();
