// ── Constants ──────────────────────────────────────────────
const COINS_TAG  = -633437229;
const KEYS_TAG   = -1085419483;
const REVIVE_TAG = 1669706535;

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
  document.getElementById('fileInput').placeholder = t('filePrompt');
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

// ── File load ─────────────────────────────────────────────
document.getElementById('fileInput').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const raw = new Uint8Array(e.target.result);
      ctrBytes = raw.slice(0, 16);
      keyBytes = raw.slice(16, 32);
      const enc = raw.slice(32);
      const ck = await crypto.subtle.importKey('raw', keyBytes, {name:'AES-CTR'}, false, ['decrypt']);
      const plain = await crypto.subtle.decrypt({name:'AES-CTR', counter:ctrBytes, length:64}, ck, enc);
      outer = JSON.parse(new TextDecoder().decode(plain));
      inner = JSON.parse(outer.profile);
      populate();
      document.getElementById('main').style.display = 'block';
      fileLoaded = true; showMsg('msg-load', t('loaded'), 'ok');
    } catch(e) { showMsg('msg-load', t('error') + e.message, 'err'); }
  };
  reader.readAsArrayBuffer(file);
});

// ── Tabs ───────────────────────────────────────────────────
function switchTab(name, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

// ── Populate ───────────────────────────────────────────────
function getW(tag) { return (inner.wallet||[]).find(w => w.dataTag === tag); }

function populate() {
  const coins = getW(COINS_TAG), keys = getW(KEYS_TAG), revives = getW(REVIVE_TAG);
  document.getElementById('coins').value   = coins   ? coins.count   : 0;
  document.getElementById('keys').value    = keys    ? keys.count    : 0;
  document.getElementById('revives').value = revives ? revives.count : 0;
  document.getElementById('level').value   = inner.level || 0;
  document.getElementById('xp').value      = inner.xp    || 0;

  // Surfers
  const sl = document.getElementById('surfer-list');
  sl.innerHTML = '';
  (inner.surferProfiles||[]).forEach((s,i) => {
    const name = SURFER_NAMES[String(s.id)] || 'Unknown';
    sl.innerHTML += `<div class="s-item">
      <div class="s-name">${name}</div>
      <div class="s-row">
        <input type="checkbox" id="su${i}" ${s.isUnlocked?'checked':''}>
        <label class="s-unlock-label" for="su${i}">${t('unlocked')}</label>
      </div>
      <div class="s-fields">
        <div><label class="s-level-label">${t('level')}</label><input type="number" id="sl${i}" value="${s.level||1}" min="1" max="20"></div>
        <div><label class="s-hs-label">${t('highscore')}</label><input type="number" id="hs${i}" value="${s.highScore||0}" min="0"></div>
      </div>
    </div>`;
  });

  // Boards
  const FILTERED = ALL_BOARD_IDS.filter(id => id !== -1398156391);
  FILTERED.forEach(id => {
    if (!(inner.boardProfiles||[]).find(b => b.id === id)) {
      if (!inner.boardProfiles) inner.boardProfiles = [];
      inner.boardProfiles.push({ id, level:1, isUnlocked:false, wasSeen:false });
    }
  });
  inner.boardProfiles = inner.boardProfiles.filter(b => b.id !== -1398156391);
  inner.boardProfiles.sort((a,b) => FILTERED.indexOf(a.id) - FILTERED.indexOf(b.id));

  const bl = document.getElementById('board-list');
  bl.innerHTML = '';
  (inner.boardProfiles||[]).forEach((b,i) => {
    const name = BOARD_NAMES[String(b.id)] || 'Board #'+i;
    bl.innerHTML += `<div class="s-item">
      <div class="s-name">${name}</div>
      <div class="s-row">
        <input type="checkbox" id="bu${i}" ${b.isUnlocked?'checked':''}>
        <label class="s-unlock-label" for="bu${i}">${t('unlocked')}</label>
      </div>
      <div class="s-fields">
        <div><label class="s-level-label">${t('level')}</label><input type="number" id="bl${i}" value="${b.level||1}" min="1" max="20"></div>
      </div>
    </div>`;
  });

  updateSpUI();
}

// ── Bulk actions ───────────────────────────────────────────
function unlockAllSurfers() { (inner.surferProfiles||[]).forEach((_,i) => { document.getElementById('su'+i).checked=true; }); showMsg('msg-save', t('allUnlocked'), 'info'); }
function unlockAllBoards()  { (inner.boardProfiles||[]).forEach((_,i)  => { document.getElementById('bu'+i).checked=true; }); showMsg('msg-save', t('allUnlocked'), 'info'); }
function setAllSurferLevels() { const v=Math.min(parseInt(document.getElementById('all-slevel').value)||1,20); (inner.surferProfiles||[]).forEach((_,i)=>{ document.getElementById('sl'+i).value=v; }); }
function setAllBoardLevels()  { const v=Math.min(parseInt(document.getElementById('all-blevel').value)||1,20); (inner.boardProfiles||[]).forEach((_,i) =>{ document.getElementById('bl'+i).value=v; }); }
function setAllHighscores()   { const v=parseInt(document.getElementById('all-hs').value)||0; (inner.surferProfiles||[]).forEach((_,i)=>{ document.getElementById('hs'+i).value=v; }); }

// ── Season Pass ────────────────────────────────────────────
function updateSpUI() {
  if (!inner) return;
  const active = inner.seasonPassPurchased;
  const statusEl = document.getElementById('sp-status');
  const btnEl    = document.getElementById('sp-btn');
  statusEl.textContent = active ? t('spActive') : t('spInactive');
  statusEl.className   = 'sp-status ' + (active ? 'sp-on' : 'sp-off');
  btnEl.textContent    = active ? t('spLock') : t('spUnlock');
  btnEl.className      = active ? 'btn-red' : 'btn-orange';
  document.getElementById('sp-points-section').style.display = active ? 'block' : 'none';
  if (active) document.getElementById('sp-points-val').value = inner.seasonPassPoints || 0;
}
function toggleSeasonPass() {
  inner.seasonPassPurchased = !inner.seasonPassPurchased;
  updateSpUI();
  showMsg('msg-sp', inner.seasonPassPurchased ? t('spActivated') : t('spDeactivated'), inner.seasonPassPurchased ? 'ok' : 'info');
}
function applySpPoints() {
  inner.seasonPassPoints = parseInt(document.getElementById('sp-points-val').value)||0;
  showMsg('msg-sp', t('spPoints') + inner.seasonPassPoints, 'ok');
}

// ── Save ───────────────────────────────────────────────────
async function saveFile() {
  try {
    const setW = (tag, val) => { 
      let i=getW(tag); 
      if(i) i.count=val; 
      else inner.wallet.push({dataTag:tag,count:val}); 
    };
    setW(COINS_TAG,  parseInt(document.getElementById('coins').value)  ||0);
    setW(KEYS_TAG,   parseInt(document.getElementById('keys').value)   ||0);
    setW(REVIVE_TAG, parseInt(document.getElementById('revives').value)||0);
    inner.level = parseInt(document.getElementById('level').value)||0;
    inner.xp    = parseInt(document.getElementById('xp').value)   ||0;
    (inner.surferProfiles||[]).forEach((s,i) => {
      s.isUnlocked = document.getElementById('su'+i).checked;
      s.wasSeen    = s.isUnlocked;
      s.level      = Math.min(parseInt(document.getElementById('sl'+i).value)||1, 20);
      s.highScore  = parseInt(document.getElementById('hs'+i).value)||0;
    });
    (inner.boardProfiles||[]).forEach((b,i) => {
      b.isUnlocked = document.getElementById('bu'+i).checked;
      b.wasSeen    = b.isUnlocked;
      b.level      = Math.min(parseInt(document.getElementById('bl'+i).value)||1, 20);
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
  } catch(e) { showMsg('msg-save', t('error') + e.message, 'err'); }
}

// ── Helpers ────────────────────────────────────────────────
function showMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'msg ' + type;
  el.textContent = text;
}
// ── Export decrypted ─────────────────────────────────────
function exportDecrypted() {
  if (!inner) return showMsg('msg-save', t('error') + 'No file loaded', 'err');
  const blob = new Blob([JSON.stringify(inner, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'profile_decrypted.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  showMsg('msg-save', 'Decrypted export ready', 'ok');
}

// ── Copy to clipboard ───────────────────────────────────
function copyToClipboard() {
  if (!inner) return showMsg('msg-save', t('error') + 'No file loaded', 'err');
  navigator.clipboard.writeText(JSON.stringify(inner, null, 2))
    .then(()=>showMsg('msg-save','Copied to clipboard','ok'))
    .catch(e=>showMsg('msg-save', t('error')+e.message,'err'));
}

// ── RAW EDITOR ─────────────────────────────────────────────
const rawContainer = document.createElement('div');
rawContainer.id = 'raw-editor-container';
document.getElementById('tab-save').appendChild(rawContainer);

// Buttons
const rawButtons = document.createElement('div');
rawButtons.id = 'raw-editor-buttons';

const copyBtn = document.createElement('button');
copyBtn.textContent = 'Copy';
copyBtn.className = 'btn-blue';
copyBtn.onclick = () => navigator.clipboard.writeText(rawArea.value);

const exportBtn = document.createElement('button');
exportBtn.textContent = 'Export Decrypted';
exportBtn.className = 'btn-green';
exportBtn.onclick = () => {
  const blob = new Blob([rawArea.value], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'profile_decrypted.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

rawButtons.appendChild(copyBtn);
rawButtons.appendChild(exportBtn);
rawContainer.appendChild(rawButtons);

// Textarea
const rawArea = document.createElement('textarea');
rawArea.id = 'raw-editor';
rawContainer.appendChild(rawArea);

// ── Populate RAW ───────────────────────────────────────────
function updateRawEditor() {
  if(inner) rawArea.value = JSON.stringify(inner, null, 2);
}

// Listen for changes in RAW editor
rawArea.addEventListener('input', () => {
  try {
    const parsed = JSON.parse(rawArea.value);
    inner = parsed;      // Update inner object
    populate();          // Refresh UI fields
  } catch(e) {
    // Ignore parse errors while typing
  }
});

// Call this after file load or populate
function initRawEditor() {
  updateRawEditor();
}
