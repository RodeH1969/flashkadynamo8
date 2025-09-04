<!-- /public/js/adpack.js -->
<script>
(function () {
  // --- Helpers ---
  const params = new URLSearchParams(location.search);
  const root = document.documentElement;
  const set = (name, url) => root.style.setProperty(name, `url('${url}')`);

  // Get weekday in Brisbane (Mon, Tue, …)
  const weekdayShort = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    weekday: 'short'
  }).format(new Date()); // e.g. "Mon"

  // Map Mon..Sun -> 1..7
  const map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

  // Query param overrides:
  //   ?ad=5            -> /ad5
  //   ?pack=ad3        -> /ad3
  //   ?pack=ads/remy   -> /ads/remy  (custom folder support if you need it)
  function chooseBase() {
    // ?ad=#
    const adNum = params.get('ad');
    if (adNum && /^[1-7]$/.test(adNum)) return `/ad${adNum}`;

    // ?pack=
    const pack = params.get('pack');
    if (pack) {
      if (/^ad[1-7]$/i.test(pack)) return `/${pack.toLowerCase()}`;
      return `/${pack.replace(/^\//, '')}`; // allow custom paths like ads/remy
    }

    // Default: day-of-week rotation in Brisbane
    const n = map[weekdayShort] || 1; // fallback to ad1
    return `/ad${n}`;
  }

  const base = chooseBase();

  // Special-case: if today maps to /ad1 and your legacy set has image 8 as .jpg,
  // we set .jpg for #8 ONLY in ad1. For all other packs we expect .png for 1..10.
  const ext8 = base === '/ad1' ? '.jpg' : '.png';

  // Expect uniform naming inside each adX folder:
  //   logo.png
  //   1.png … 10.png   (except ad1’s 8.jpg handled above)
  set('--front', `${base}/logo.png`);
  for (let i = 1; i <= 10; i++) {
    const ext = (i === 8) ? ext8 : '.png';
    set(`--img${i}`, `${base}/${i}${ext}`);
  }
})();
</script>
