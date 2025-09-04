<script>
(function () {
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  const set = (name, url) => root.style.setProperty(name, `url('${url}')`);

  // Map weekday (Brisbane) Mon..Sun -> 1..7
  const weekday = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane', weekday: 'short'
  }).format(new Date());
  const dowMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:7 };

  // Your real filenames per folder
  const PACKS = {
    // ad1 missing in your commit; alias to ad2 (Remy) for now
    ad1: { base: '/ad2', logo: 'Remy_logo.png', mk: i => `Remy${i}.png` },

    ad2: { base: '/ad2', logo: 'Remy_logo.png',
      mk: i => `Remy${i}.png`
    },
    ad3: { base: '/ad3', logo: 'MAFS_logo.png',
      mk: i => `MAFS${i}.png`
    },
    ad4: { base: '/ad4', logo: 'Agentw_logo.png',
      mk: i => `Agentw${i}.png`
    },
    ad5: { base: '/ad5', logo: 'Dexter_logo.png',
      mk: i => i === 8 ? `Dexter8.jpg` : `Dexter${i}.png` // #8 is .jpg
    },
    ad6: { base: '/ad6', logo: 'MAFS_logo.png',
      mk: i => `MAFS${i}.png`
    },
    ad7: { base: '/ad7', logo: 'Agentw_logo.png',
      mk: i => `Agentw${i}.png`
    }
  };

  function chooseKey() {
    // Allow ?ad=1..7 or ?pack=ad3 for testing
    const ad = params.get('ad');
    if (ad && /^[1-7]$/.test(ad)) return `ad${ad}`;
    const pack = params.get('pack');
    if (pack && /^ad[1-7]$/i.test(pack)) return pack.toLowerCase();
    // Default rotation by weekday
    const n = dowMap[weekday] || 1;
    return `ad${n}`;
  }

  const key = chooseKey();
  const cfg = PACKS[key] || PACKS.ad2; // safe fallback
  const base = cfg.base.replace(/\/$/, ''); // '/ad3'

  // Set CSS variables to actual files
  set('--front', `${base}/${cfg.logo}`);
  for (let i = 1; i <= 10; i++) {
    set(`--img${i}`, `${base}/${cfg.mk(i)}`);
  }

  // For debugging: see which pack was chosen
  document.documentElement.setAttribute('data-adpack', key);
})();
</script>
