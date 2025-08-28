<script>
(() => {
  // --- inject fonts once ---
  const addFont = (href) => {
    if (![...document.styleSheets].some(s => (s.ownerNode?.href||'').includes(href))) {
      const l1 = document.createElement('link'); l1.rel='preconnect'; l1.href='https://fonts.googleapis.com';
      const l2 = document.createElement('link'); l2.rel='preconnect'; l2.href='https://fonts.gstatic.com'; l2.crossOrigin='';
      const l3 = document.createElement('link'); l3.rel='stylesheet'; l3.href=href;
      document.head.appendChild(l1); document.head.appendChild(l2); document.head.appendChild(l3);
    }
  };
  addFont('https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Inter:wght@600&display=swap');

  // --- inject CSS once ---
  const STYLE_ID = 'flashka-overlay-style';
  if (!document.getElementById(STYLE_ID)) {
    const css = `
#flashka-result-overlay{position:fixed;inset:0;display:grid;place-items:center;z-index:9999;pointer-events:none;opacity:0;transition:opacity .25s ease}
#flashka-result-overlay.fko-show{opacity:1;pointer-events:auto}
#flashka-result-overlay .fko-backdrop{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,.45),rgba(0,0,0,.6));backdrop-filter:blur(2px)}
#flashka-result-overlay .fko-box{position:relative;max-width:min(520px,92vw);padding:22px 20px 18px;border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.35);border:3px solid rgba(255,255,255,.65);text-align:center;background:linear-gradient(180deg,#fff,#f7f7f7);transform:translateY(8px) scale(.98);transition:transform .25s ease}
#flashka-result-overlay.fko-show .fko-box{transform:translateY(0) scale(1)}
#flashka-result-overlay .fko-title{font-family:"Luckiest Guy",system-ui,sans-serif;letter-spacing:.5px;font-size:clamp(28px,6vw,44px);line-height:1.05;margin:0 0 6px;text-shadow:0 2px 0 rgba(0,0,0,.15)}
#flashka-result-overlay .fko-title.fko-win{color:#0bb22e}
#flashka-result-overlay .fko-title.fko-lose{color:#e02b2b}
#flashka-result-overlay .fko-msg{font-family:Inter,system-ui,sans-serif;font-size:clamp(15px,2.6vw,18px);color:#303030;margin-bottom:6px}
#flashka-result-overlay .fko-subtle{font-family:Inter,system-ui,sans-serif;font-size:12px;color:#666}
#flashka-result-overlay .fko-confetti{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.fko-piece{position:absolute;font-size:24px;will-change:transform,opacity;user-select:none;-webkit-user-select:none}
@keyframes fko-float{0%{transform:translateY(8vh) translateX(var(--xJitter,0)) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(-110vh) translateX(calc(var(--xJitter,0) * -1)) rotate(360deg);opacity:0}}
@keyframes fko-fall{0%{transform:translateY(-20vh) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(120vh) rotate(540deg);opacity:0}}
.fko-btn{margin-top:10px;padding:10px 16px;border-radius:12px;border:0;background:#111;color:#fff;font-weight:600;cursor:pointer}
@media (max-width:390px){#flashka-result-overlay .fko-box{padding:18px 16px 14px;border-width:2px}}
    `.trim();
    const styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
  }

  // --- inject markup once ---
  let overlay = document.getElementById('flashka-result-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'flashka-result-overlay';
    overlay.setAttribute('aria-live','assertive');
    overlay.setAttribute('role','dialog');
    overlay.setAttribute('aria-modal','true');
    overlay.innerHTML = `
      <div class="fko-backdrop"></div>
      <div class="fko-box">
        <div class="fko-title" id="fko-title"></div>
        <div class="fko-msg" id="fko-msg"></div>
        <div class="fko-subtle">tap anywhere to continue</div>
        <div class="fko-confetti" id="fko-confetti"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const titleEl = overlay.querySelector('#fko-title');
  const msgEl   = overlay.querySelector('#fko-msg');
  const confetti = overlay.querySelector('#fko-confetti');

  let hideTimer = null;
  const clearConfetti = () => { while (confetti.firstChild) confetti.removeChild(confetti.firstChild); };

  function spawnPieces(type) {
    clearConfetti();
    const count = 26;
    for (let i=0; i<count; i++) {
      const span = document.createElement('span');
      span.className = 'fko-piece';
      const left = Math.random()*100;
      const delay = Math.random()*0.8;
      const duration = 2.3 + Math.random()*1.8;
      const xJitter = Math.round((Math.random()-0.5)*60);

      span.style.left = left + 'vw';
      span.style.setProperty('--xJitter', xJitter + 'px');
      span.style.animationDelay = delay + 's';
      span.style.animationDuration = duration + 's';

      if (type === 'win') {
        span.textContent = Math.random() < 0.55 ? '🎈' : '🍫';
        span.style.animationName = 'fko-float';
        span.style.bottom = '-8vh';
        span.style.fontSize = (22 + Math.random()*10) + 'px';
      } else {
        span.textContent = Math.random() < 0.7 ? '🧱' : '💢';
        span.style.animationName = 'fko-fall';
        span.style.top = '-10vh';
        span.style.fontSize = (18 + Math.random()*12) + 'px';
      }
      confetti.appendChild(span);
    }
  }

  function setText(mode, message) {
    const isWin = mode === 'win';
    titleEl.classList.toggle('fko-win', isWin);
    titleEl.classList.toggle('fko-lose', !isWin);
    titleEl.textContent = isWin ? 'WINNER!' : 'BETTER LUCK NEXT TIME';
    msgEl.textContent = message || (isWin ? 'You crushed it 🎉' : 'Give it another go!');
  }

  function show() {
    overlay.classList.add('fko-show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideResultOverlay, 4000); // auto-hide after 4s
  }

  function hideResultOverlay() {
    overlay.classList.remove('fko-show');
    clearConfetti();
  }

  overlay.addEventListener('click', hideResultOverlay);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideResultOverlay(); });

  // Public API
  window.showResultOverlay = function(mode /* 'win' | 'lose' */, message) {
    setText(mode, message);
    spawnPieces(mode === 'win' ? 'win' : 'lose');
    show();
  };
  window.hideResultOverlay = hideResultOverlay;
})();
</script>
