// Flashka WinFX: non-invasive winner overlay (balloons + sound).
// Triggers when #result becomes visible and all cards are matched.
// No changes to your game logic required.

(() => {
  const AUDIO_SRC = '/audio/winner.mp3';    // put your mp3 here: public/audio/winner.mp3
  const BALLOONS = 36;
  const DURATION_MS = 7000;

  let shown = false;

  function ensureOverlayRoot() {
    let root = document.getElementById('winfx-overlay');
    if (!root) {
      root = document.createElement('div');
      root.id = 'winfx-overlay';
      document.body.appendChild(root);
    }
    return root;
  }

  function randomColor() {
    const palette = ['#ff6b6b','#ffd93d','#6bcB77','#4d96ff','#f473b9','#ffa07a','#b28dff','#00d1b2'];
    return palette[Math.floor(Math.random()*palette.length)];
  }

  function showWinFX() {
    if (shown) return;
    shown = true;

    const root = ensureOverlayRoot();
    root.innerHTML = ''; // reset

    // Balloons
    for (let i = 0; i < BALLOONS; i++) {
      const b = document.createElement('div');
      b.className = 'balloon';
      b.style.left = Math.random() * 100 + 'vw';
      b.style.setProperty('--size', (34 + Math.random()*46) + 'px');
      b.style.setProperty('--dur', (6 + Math.random()*4) + 's');
      b.style.setProperty('--delay', (Math.random()*0.8) + 's');
      b.style.setProperty('--drift', (Math.random() > .5 ? 1 : -1) * (12 + Math.random()*48) + 'px');
      const c = randomColor();
      b.style.background = `radial-gradient(circle at 30% 30%, #ffffff66, ${c})`;
      root.appendChild(b);
    }

    // Message with BRIGHT GREEN background
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.style.backgroundColor = '#28a745';  // Bright green background
    msg.style.color = 'white';              // White text
    msg.style.padding = '20px';
    msg.style.borderRadius = '10px';
    msg.style.border = '3px solid #1e7e34';
    msg.style.fontWeight = 'bold';
    msg.innerHTML = `<h2 style="color: white; margin: 0 0 10px 0;">WINNER!</h2><p style="color: white; margin: 0;">Show this screen at the counter to collect your CHOCCY!</p>`;
    root.appendChild(msg);

    // Sound
    const audio = document.createElement('audio');
    audio.src = AUDIO_SRC;
    audio.preload = 'auto';
    // Try to play immediately (may be blocked on iOS until a tap)
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

  // Watch DOM and trigger on win (zero-touch integration)
  const obs = new MutationObserver(() => {
    if (!shown && resultVisible() && isAllMatched()) {
      showWinFX();
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style','class'] });

  // Also check on load (just in case)
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!shown && resultVisible() && isAllMatched()) showWinFX();
    }, 50);
  });
})();