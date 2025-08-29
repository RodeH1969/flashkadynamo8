// Flashka LoseFX: non-invasive loser overlay (sad emoji rain + sound).
// Triggers when #result is visible AND the board is not fully matched.
// Does NOT modify game logic and can be removed any time without side effects.

(() => {
  const AUDIO_SRC = '/audio/loser.mp3';   // your file in public/audio/
  const EMOJIS = ['😢','😭','😞','☹️','💔'];
  const COUNT = 80;                       // "lots" of emojis
  const DURATION_MS = 6500;

  let shown = false;

  function ensureOverlayRoot() {
    let root = document.getElementById('losefx-overlay');
    if (!root) {
      root = document.createElement('div');
      root.id = 'losefx-overlay';
      document.body.appendChild(root);
    }
    return root;
  }

  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  function showLoseFX() {
    if (shown) return;
    shown = true;

    const root = ensureOverlayRoot();
    root.innerHTML = '';

    // Sad emoji rain
    for (let i = 0; i < COUNT; i++) {
      const e = document.createElement('div');
      e.className = 'emoji';
      e.textContent = pick(EMOJIS);
      e.style.left = Math.random() * 100 + 'vw';
      e.style.setProperty('--size', (22 + Math.random()*30) + 'px');
      e.style.setProperty('--dur',  (5.5 + Math.random()*3.5) + 's');
      e.style.setProperty('--delay',(Math.random()*0.9) + 's');
      e.style.setProperty('--drift', (Math.random() > .5 ? 1 : -1) * (10 + Math.random()*60) + 'px');
      e.style.setProperty('--rot', (Math.random()*120 - 60) + 'deg');
      root.appendChild(e);
    }

    // Message (your requested copy)
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.innerHTML = `<h2>Unlucky!</h2><p>Thanks for playing Flashka! — scan the QR code again when you buy your next coffee for another attempt at cracking Flashka!!</p>`;
    root.appendChild(msg);

    // Sound (with iOS-friendly fallback)
    const audio = document.createElement('audio');
    audio.src = AUDIO_SRC;
    audio.preload = 'auto';
    audio.play().catch(() => {
      const resume = () => {
        audio.play().catch(()=>{});
        window.removeEventListener('touchend', resume, { once:true });
        window.removeEventListener('click', resume, { once:true });
      };
      window.addEventListener('touchend', resume, { once:true });
      window.addEventListener('click', resume, { once:true });
    });

    // Show & cleanup
    root.classList.add('show');
    setTimeout(() => {
      root.classList.remove('show');
      root.innerHTML = '';
      shown = false;
    }, DURATION_MS);
  }

  function resultVisible() {
    const res = document.getElementById('result');
    if (!res) return false;
    const st = getComputedStyle(res);
    return st.display !== 'none' && st.visibility !== 'hidden';
  }

  function isAllMatched() {
    const cards = document.querySelectorAll('.card');
    if (!cards.length) return false;
    const matched = document.querySelectorAll('.card.matched').length;
    return matched === cards.length;
  }

  function isLoss() {
    // Result is shown by the game, but not all cards are matched.
    // (Winner FX handles the win case when all cards matched.)
    return resultVisible() && !isAllMatched();
  }

  // Watch DOM and trigger on loss (zero-touch integration)
  const obs = new MutationObserver(() => {
    if (!shown && isLoss()) showLoseFX();
  });
  obs.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style','class']
  });

  // Also check shortly after load
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { if (!shown && isLoss()) showLoseFX(); }, 50);
  });
})();
