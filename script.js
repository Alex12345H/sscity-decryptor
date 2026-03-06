// ── Constants ──────────────────────────────────────────────
const COINS_TAG  = -633437229;
const KEYS_TAG   = -1085419483;
const REVIVE_TAG = 1669706535;
const BOARDTOKENS_TAG = -1509662453;
const CHARTOKENS_TAG  = -1878560402;
const TICKETS_TAG = 449284577;

const BOARD_NAMES = {
  "857306595":   "Home Runner",    "821107692":   "Trasher",
  "1016074756":  "Peace Of Grind", "797961277":   "Naughty & Nice",
  "1346993456":  "Globetrotter",   "-2027086747": "Grandmaster",
  "-2028224723": "Djinn's Fortune","-1569537423": "Honeycomb",
  "-282672473":  "Flame Tamer",    "-573684740":  "Wakizashi",
  "463203314":   "Knockout",       "-2089484430": "Spaced Invader",
  "1092080220":  "Pawsome",        "-875752536":  "Dog City",
  "-1017845163": "Sub Surf Classic","-1886993925":"Vaunted",
  "-425685755":  "Zephyr Cruiser", "-1101319815": "Eye Of The Viper",
  "-1995581156": "Day Of The Shred","-487324792": "Sweet Street",
  "-1946062440": "G-Tiger",        "-2014824727": "Cy-Board",
  "369661746":   "Cobweb",         "1389875337":  "Super Hooper",
  "-268124908":  "H4X0R",          "-762458939":  "Pouncer",
  "-1702093280": "Aquiline",
};

const ALL_BOARD_IDS = [
  857306595, 821107692, 1016074756, 797961277, 1346993456,
  -2027086747, -2028224723, -1569537423, -282672473, -573684740,
  463203314, -2089484430, 1092080220, -875752536, -1017845163,
  -1886993925, -425685755, -1101319815, -1995581156, -487324792,
  -1946062440, -2014824727, 369661746, 1389875337, -268124908,
  -762458939, -1702093280
];

const SURFER_NAMES = {
  "-1836944478":"Jake",     "1900660162":"Tricky",
  "2129411796":"Fresh",     "1936280213":"Prince K",
  "1614866432":"Miss Maia", "135046766":"Monique",
  "1663244716":"Yutani",    "823378763":"Harini",
  "1804257387":"Ninja One", "-502265868":"Noon",
  "1363767693":"Jenny",     "-518167090":"Wei",
  "849273384":"Spike",      "1200047034":"Ella",
  "1120354844":"Jay",       "581326566":"Billy",
  "-1505268145":"Rosalita", "299562833":"Tasha",
  "-1733051898":"Jaewoo",   "1887684367":"Tagbot",
  "852717139":"Lucy",       "-2125407733":"Georgie",
  "-1534276928":"V3ctor",   "-2075784936":"Zara",
  "-2116248615":"Lilah",    "966716028":"Ash",
};

// ── Language ───────────────────────────────────────────────
let lang = 'de';
const T = {
  de: {
    filePrompt:    "Tippe hier um die profile Datei zu laden",
    loaded:        "Datei geladen!",
    unlocked:      "Freigeschaltet",
    level:         "Level (max 20)",
    highscore:     "Highscore",
    allUnlocked:   "Alle freigeschaltet!",
    spActive:      "Season Pass: AKTIV ✓",
    spInactive:    "Season Pass: INAKTIV",
    spUnlock:      "Season Pass freischalten",
    spLock:        "Season Pass sperren",
    spPoints:      "Punkte gesetzt: ",
    spActivated:   "Season Pass freigeschaltet!",
    spDeactivated: "Season Pass gesperrt!",
    saved:         'Gespeichert! Kopiere "profile" in den enc/ Ordner.',
    error:         "Fehler: ",
  },
  en: {
    filePrompt:    "Tap here to load the profile file",
    loaded:        "File loaded!",
    unlocked:      "Unlocked",
    level:         "Level (max 20)",
    highscore:     "High Score",
    allUnlocked:   "All unlocked!",
    spActive:      "Season Pass: ACTIVE ✓",
    spInactive:    "Season Pass: INACTIVE",
    spUnlock:      "Unlock Season Pass",
    spLock:        "Lock Season Pass",
    spPoints:      "Points set: ",
    spActivated:   "Season Pass unlocked!",
    spDeactivated: "Season Pass locked!",
    saved:         'Saved! Copy "profile" back to the enc/ folder.',
    error:         "Error: ",
  }
};

function t(key) { return T[lang][key] || key; }

function setLang(l) {
  lang = l;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.textContent.toLowerCase() === l));
  document.querySelectorAll('[data-de]').forEach(el => {
    if (el.tagName === 'BUTTON') el.innerHTML = el.getAttribute('data-' + l);
    else el.textContent = el.getAttribute('data-' + l);
  });
  document.querySelectorAll('[data-placeholder-' + l + ']').forEach(el => {
    el.placeholder = el.getAttribute('data-placeholder-' + l);
  });
  // fileInput doesn't support placeholder reliably; keep for compatibility
  try { document.getElementById('fileInput').placeholder = t('filePrompt'); } catch(e){}
  if (fileLoaded) showMsg('msg-load', t('loaded'), 'ok');
  updateSpUI();
  if (inner) repopulateSurferLabels();
}

function repopulateSurferLabels() {
  document.querySelectorAll('.s-unlock-label').forEach(el => el.textContent = t('unlocked'));
  document.querySelectorAll('.s-level-label').forEach(el => el.textContent = t('level'));
  document.querySelectorAll('.s-hs-label').forEach(el => el.textContent = t('highscore'));
}

// ── State ──────────────────────────────────────────────────
let ctrBytes, keyBytes, outer, inner, fileLoaded = false;

// ── Helpers ─────────────────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'msg ' + type;
  el.textContent = text;
}
function getW(tag) { return (inner && inner.wallet ? inner.wallet : []).find(w => w.dataTag === tag); }

// ── File load ─────────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const raw = new Uint8Array(e.target.result);
      if (raw.length < 32) throw new Error('File too small or invalid format');
      ctrBytes = raw.slice(0, 16);
      keyBytes = raw.slice(16, 32);
      const enc = raw.slice(32);
      const ck = await crypto.subtle.importKey('raw', keyBytes, {name:'AES-CTR'}, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({name:'AES-CTR', counter:ctrBytes, length:64}, ck, enc);
      outer = JSON.parse(new TextDecoder().decode(plain));
      // outer.profile may be already a stringified JSON
      inner = typeof outer.profile === 'string' ? JSON.parse(outer.profile) : outer.profile;
      populate();
      document.getElementById('main').style.display = 'block';
      fileLoaded = true;
      showMsg('msg-load', t('loaded'), 'ok');
    } catch(e) {
      console.error('File load error:', e);
      showMsg('msg-load', t('error') + (e.message || e), 'err');
    }
  };
  reader.readAsArrayBuffer(file);
});

// ── Tabs ───────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const panel = document.getElementById('tab-' + name);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Populate ───────────────────────────────────────────────
function populate() {
  if (!inner) return;
  if (!inner.wallet) inner.wallet = [];

  const coins = getW(COINS_TAG), keys = getW(KEYS_TAG), revives = getW(REVIVE_TAG);
  const boardTokens = getW(BOARDTOKENS_TAG), charTokens = getW(CHARTOKENS_TAG), tickets = getW(TICKETS_TAG);

  const setInputSafe = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };

  setInputSafe('coins', coins ? coins.count : 0);
  setInputSafe('keys', keys ? keys.count : 0);
  setInputSafe('revives', revives ? revives.count : 0);
  setInputSafe('boardtokens', boardTokens ? boardTokens.count : 0);
  setInputSafe('chartokens', charTokens ? charTokens.count : 0);
  setInputSafe('tickets', tickets ? tickets.count : 0);

  setInputSafe('level', inner.level || 0);
  setInputSafe('xp', inner.xp || 0);

  // Surfers list
  const sl = document.getElementById('surfer-list');
  if (sl) {
    sl.innerHTML = '';
    (inner.surferProfiles || []).forEach((s, i) => {
      const name = SURFER_NAMES[String(s.id)] || 'Unknown';
      sl.innerHTML += `<div class="s-item">
        <div class="s-name">${name}</div>
        <div class="s-row">
          <input type="checkbox" id="su${i}" ${s.isUnlocked ? 'checked' : ''}>
          <label class="s-unlock-label" for="su${i}">${t('unlocked')}</label>
        </div>
        <div class="s-fields">
          <div><label class="s-level-label">${t('level')}</label><input type="number" id="sl${i}" value="${s.level||1}" min="1" max="20"></div>
          <div><label class="s-hs-label">${t('highscore')}</label><input type="number" id="hs${i}" value="${s.highScore||0}" min="0"></div>
        </div>
      </div>`;
    });
  }

  // Boards list - ensure known boards exist
  const FILTERED = ALL_BOARD_IDS.filter(id => id !== -1398156391);
  FILTERED.forEach(id => {
    if (!(inner.boardProfiles||[]).find(b => b.id === id)) {
      if (!inner.boardProfiles) inner.boardProfiles = [];
      inner.boardProfiles.push({ id, level:1, isUnlocked:false, wasSeen:false });
    }
  });
  inner.boardProfiles = (inner.boardProfiles || []).filter(b => b.id !== -1398156391);
  inner.boardProfiles.sort((a,b) => FILTERED.indexOf(a.id) - FILTERED.indexOf(b.id));

  const bl = document.getElementById('board-list');
  if (bl) {
    bl.innerHTML = '';
    (inner.boardProfiles || []).forEach((b,i) => {
      const name = BOARD_NAMES[String(b.id)] || 'Board #'+i;
      bl.innerHTML += `<div class="s-item">
        <div class="s-name">${name}</div>
        <div class="s-row">
          <input type="checkbox" id="bu${i}" ${b.isUnlocked ? 'checked' : ''}>
          <label class="s-unlock-label" for="bu${i}">${t('unlocked')}</label>
        </div>
        <div class="s-fields">
          <div><label class="s-level-label">${t('level')}</label><input type="number" id="bl${i}" value="${b.level||1}" min="1" max="20"></div>
        </div>
      </div>`;
    });
  }

  updateSpUI();
}

// ── Bulk actions ───────────────────────────────────────────
function unlockAllSurfers() { (inner.surferProfiles||[]).forEach((_,i) => { const el = document.getElementById('su'+i); if(el) el.checked=true; }); showMsg('msg-save', t('allUnlocked'), 'info'); }
function unlockAllBoards()  { (inner.boardProfiles||[]).forEach((_,i)  => { const el = document.getElementById('bu'+i); if(el) el.checked=true; }); showMsg('msg-save', t('allUnlocked'), 'info'); }
function setAllSurferLevels() { const v = Math.min(parseInt(document.getElementById('all-slevel').value)||1, 20); (inner.surferProfiles||[]).forEach((_,i)=>{ const el = document.getElementById('sl'+i); if(el) el.value = v; }); }
function setAllBoardLevels()  { const v = Math.min(parseInt(document.getElementById('all-blevel').value)||1, 20); (inner.boardProfiles||[]).forEach((_,i) =>{ const el = document.getElementById('bl'+i); if(el) el.value = v; }); }
function setAllHighscores()   { const v = parseInt(document.getElementById('all-hs').value)||0; (inner.surferProfiles||[]).forEach((_,i)=>{ const el = document.getElementById('hs'+i); if(el) el.value = v; }); }

// ── Season Pass ────────────────────────────────────────────
function updateSpUI() {
  if (!inner) return;
  const active = inner.seasonPassPurchased;
  const statusEl = document.getElementById('sp-status');
  const btnEl    = document.getElementById('sp-btn');
  if (statusEl) statusEl.textContent = active ? t('spActive') : t('spInactive');
  if (statusEl) statusEl.className   = 'sp-status ' + (active ? 'sp-on' : 'sp-off');
  if (btnEl) btnEl.textContent    = active ? t('spLock') : t('spUnlock');
  if (btnEl) btnEl.className      = active ? 'btn-red' : 'btn-orange';
  const spPointsSection = document.getElementById('sp-points-section');
  if (spPointsSection) spPointsSection.style.display = active ? 'block' : 'none';
  if (active && document.getElementById('sp-points-val')) document.getElementById('sp-points-val').value = inner.seasonPassPoints || 0;
}
function toggleSeasonPass() {
  if (!inner) return;
  inner.seasonPassPurchased = !inner.seasonPassPurchased;
  updateSpUI();
  showMsg('msg-sp', inner.seasonPassPurchased ? t('spActivated') : t('spDeactivated'), inner.seasonPassPurchased ? 'ok' : 'info');
}
function applySpPoints() {
  if (!inner) return;
  inner.seasonPassPoints = parseInt(document.getElementById('sp-points-val').value)||0;
  showMsg('msg-sp', t('spPoints') + inner.seasonPassPoints, 'ok');
}

// ── Save ───────────────────────────────────────────────────
async function saveFile() {
  try {
    if (!inner) return showMsg('msg-save', t('error') + ' no profile loaded', 'err');

    if (!inner.wallet) inner.wallet = [];

    const setW = (tag, val) => {
      let i = getW(tag);
      if (i) i.count = val;
      else {
        // ensure wallet exists
        if (!inner.wallet) inner.wallet = [];
        inner.wallet.push({ dataTag: tag, count: val });
      }
    };

    setW(COINS_TAG,  parseInt(document.getElementById('coins').value)  || 0);
    setW(KEYS_TAG,   parseInt(document.getElementById('keys').value)   || 0);
    setW(BOARDTOKENS_TAG, parseInt(document.getElementById('boardtokens').value) || 0);
    setW(CHARTOKENS_TAG,  parseInt(document.getElementById('chartokens').value)  || 0);
    setW(TICKETS_TAG,     parseInt(document.getElementById('tickets').value)     || 0);
    setW(REVIVE_TAG, parseInt(document.getElementById('revives').value) || 0);

    inner.level = parseInt(document.getElementById('level').value) || 0;
    inner.xp    = parseInt(document.getElementById('xp').value) || 0;

    (inner.surferProfiles||[]).forEach((s,i) => {
      const elSu = document.getElementById('su'+i);
      const elSl = document.getElementById('sl'+i);
      const elHs = document.getElementById('hs'+i);
      s.isUnlocked = elSu ? elSu.checked : !!s.isUnlocked;
      s.wasSeen    = s.isUnlocked;
      s.level      = elSl ? Math.min(parseInt(elSl.value)||1, 20) : (s.level || 1);
      s.highScore  = elHs ? parseInt(elHs.value)||0 : (s.highScore || 0);
    });

    (inner.boardProfiles||[]).forEach((b,i) => {
      const elBu = document.getElementById('bu'+i);
      const elBl = document.getElementById('bl'+i);
      b.isUnlocked = elBu ? elBu.checked : !!b.isUnlocked;
      b.wasSeen    = b.isUnlocked;
      b.level      = elBl ? Math.min(parseInt(elBl.value)||1, 20) : (b.level || 1);
    });

    outer.profile = JSON.stringify(inner);
    const plain = new TextEncoder().encode(JSON.stringify(outer));
    const ck = await crypto.subtle.importKey('raw', keyBytes, {name:'AES-CTR'}, false, ['encrypt']);
    const enc = await crypto.subtle.encrypt({name:'AES-CTR', counter:ctrBytes, length:64}, ck, plain);
    const result = new Uint8Array(32 + enc.byteLength);
    result.set(ctrBytes,0); result.set(keyBytes,16); result.set(new Uint8Array(enc),32);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([result]));
    a.download = 'profile';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showMsg('msg-save', t('saved'), 'ok');
  } catch(e) {
    console.error('saveFile error:', e);
    showMsg('msg-save', t('error') + (e.message || e), 'err');
  }
}

// ── Export decrypted ─────────────────────────────────────
function exportDecrypted() {
  try {
    if (!inner) return showMsg('msg-save', t('error') + ' no file loaded', 'err');
    const blob = new Blob([JSON.stringify(inner, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'profile_decrypted.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showMsg('msg-save', 'Decrypted export ready', 'ok');
  } catch (e) {
    console.error('exportDecrypted error:', e);
    showMsg('msg-save', t('error') + (e.message || e), 'err');
  }
}

// ── Copy to clipboard ───────────────────────────────────
function copyToClipboard() {
  if (!inner) return showMsg('msg-save', t('error') + ' no file loaded', 'err');
  try {
    navigator.clipboard.writeText(JSON.stringify(inner, null, 2))
      .then(()=>showMsg('msg-save','Copied to clipboard','ok'))
      .catch(e=>{ console.error('clipboard write error:', e); showMsg('msg-save', t('error')+ (e.message || e), 'err'); });
  } catch(e) {
    console.error('copyToClipboard error:', e);
    showMsg('msg-save', t('error') + (e.message || e), 'err');
  }
}
