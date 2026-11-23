/* ============================================================
   研词 YANCI — 应用逻辑
   纯静态、离线可用；学习状态保存在 localStorage。
   ============================================================ */
(function () {
  'use strict';

  const DATA = window.YANCI_DATA;
  if (!DATA) {
    document.body.innerHTML = '<p style="padding:40px;font-family:sans-serif">词库数据加载失败，请确认 assets/data.js 存在。</p>';
    return;
  }

  function slugify(word, fallback) {
    const slug = String(word || '').toLowerCase().normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || fallback;
  }

  function makeBasicWord(row, i, idPrefix, theme, level, freq, flag) {
    const word = row && row[0] ? String(row[0]).trim() : '';
    if (!word) return null;
    const out = {
      id: idPrefix + slugify(word, 'word-' + i),
      word: word,
      phonetic: row[3] || '',
      pos: row[1] || '',
      meaning: row[2] || '',
      en: '',
      freq: freq,
      level: level,
      theme: theme,
      affixIds: [],
      root: null,
      morph: [],
      rootNote: '',
      example: '',
      exampleZh: '',
      collocations: [],
      synonyms: [],
      confusables: []
    };
    out[flag] = true;
    return out;
  }

  const syllabusRows = Array.isArray(window.YANCI_SYLLABUS) ? window.YANCI_SYLLABUS : [];
  const SYLLABUS_WORDS = syllabusRows.map(function (row, i) {
    return makeBasicWord(row, i, 'syl-', 'syllabus', '大纲', 2, '_syllabus');
  }).filter(Boolean);
  const supplementRows = Array.isArray(window.YANCI_SUPPLEMENT) ? window.YANCI_SUPPLEMENT : [];
  const SUPPLEMENT_WORDS = supplementRows.map(function (row, i) {
    return makeBasicWord(row, i, 'sup-', 'syllabus', '大纲', 2, '_syllabus');
  }).filter(Boolean);
  const WORDS = DATA.words.concat(SYLLABUS_WORDS, SUPPLEMENT_WORDS);
  const BY_ID = new Map(WORDS.map(function (w) { return [w.id, w]; }));
  const THEME_LIST = Object.values(DATA.themes);
  const TOTAL = WORDS.length;
  const SYLLABUS_TOTAL = SYLLABUS_WORDS.length;
  const SUPPLEMENT_TOTAL = SUPPLEMENT_WORDS.length;
  const STORAGE_KEY = 'yanci.study.v1';
  const MAX_SELECTED = 30;
  const MIN_SELECTED = 3;
  const PAGE_SIZE = 60;
  const DAILY_SIZE = 20;
  const DAILY_INTERVALS = [1, 2, 4, 7, 15, 30];
  const DEFAULT_DAILY_SETTINGS = { mode: 'auto', newCount: 10, reviewCount: 10 };

  function themeLabel(w) {
    const theme = DATA.themes[w.theme];
    if (theme) return theme.label;
    if (w.theme === 'syllabus' || w._syllabus) return '大纲';
    if (w.theme === 'extra' || w._extra) return '增补';
    return '其他';
  }
  function themeEnglish(w) {
    const theme = DATA.themes[w.theme];
    if (theme) return theme.en;
    if (w.theme === 'extra' || w._extra) return 'EXTRA';
    return 'SYLLABUS';
  }
  function posText(w) {
    let pos = String(w.pos || '').replace(/\s+/g, ' ').trim();
    if (!pos || pos === '—' || pos === '-') return '';
    pos = pos.replace(/(^|[\s/])a\./g, '$1adj.').replace(/(^|[\s/])ad\./g, '$1adv.');
    pos = pos.replace(/\s*\/\s*/g, ' / ').replace(/\s*&\s*/g, ' & ');
    return pos;
  }
  function meaningWithPos(w) {
    const pos = posText(w);
    const meaning = String(w.meaning || '释义待补充').trim();
    const token = '(?:n|v|vt|vi|a|ad|adj|adv|prep|conj|pron|num|art|int|interj|aux)\\.';
    const markerRe = new RegExp('(^|[\\s；;，,、])(' + token + '(?:\\s*[&/]\\s*' + token + ')*)\\s*', 'gi');
    if (!markerRe.test(meaning)) return pos ? pos + ' ' + meaning : meaning;
    markerRe.lastIndex = 0;
    const marked = meaning.replace(markerRe, function (_, sep, label) {
      return '\u0001' + label + '\u0002';
    });
    const chunks = marked.split('\u0001');
    const parts = [];
    const clean = function (s) { return String(s || '').replace(/^[\s；;，,、]+|[\s；;，,、]+$/g, ''); };
    const firstText = clean(chunks[0]);
    if (firstText && pos) parts.push(pos + ' ' + firstText);
    for (let i = 1; i < chunks.length; i++) {
      const pair = chunks[i].split('\u0002');
      const label = posText({ pos: pair[0] });
      const text = clean(pair.slice(1).join('\u0002'));
      if (text) parts.push((label ? label + ' ' : '') + text);
    }
    return parts.length ? parts.join('；') : (pos ? pos + ' ' + meaning : meaning);
  }

  /* ------------------------------------------------ morphology & semantics */
  function normalizeMorphRows(rows, type) {
    return (Array.isArray(rows) ? rows : []).map(function (row) {
      if (!row) return null;
      if (Array.isArray(row)) {
        return { id: row[0], label: row[1], variants: row[2] || [row[0]], meaning: row[3] || '', note: row[4] || '', type: type };
      }
      return {
        id: row.id, label: row.label, variants: row.variants || [row.id],
        meaning: row.meaning || '', note: row.note || '', type: type
      };
    }).filter(Boolean);
  }

  const morphSource = window.YANCI_MORPH || {};
  const prefixRows = normalizeMorphRows((morphSource.prefixes || []).concat(window.YANCI_MORPH_EXTRA || []), 'prefix');
  const suffixRows = normalizeMorphRows(morphSource.suffixes, 'suffix');
  const rootRows = normalizeMorphRows(morphSource.roots, 'root');
  const legacyAffixes = new Map(DATA.affixes.map(function (a) { return [a.id, a]; }));
  const legacyRoots = new Map(DATA.roots.map(function (r) { return [r.id, r]; }));
  const MORPH_GROUPS = [];
  const MORPH_BY_KEY = new Map();

  function addMorphGroup(row) {
    const legacy = row.type === 'root' ? legacyRoots.get(row.id) : legacyAffixes.get(row.id);
    const group = {
      id: row.id,
      type: row.type,
      key: row.type + ':' + row.id,
      label: row.label || (legacy && legacy.label) || row.id,
      variants: (row.variants && row.variants.length ? row.variants : [row.id]).map(function (v) { return String(v).toLowerCase(); }),
      meaning: row.meaning || (legacy && legacy.meaning) || '',
      note: row.note || (legacy && legacy.note) || '',
      words: []
    };
    group.label = (legacy && legacy.label) || group.label;
    group.meaning = (legacy && legacy.meaning) || group.meaning;
    group.note = (legacy && legacy.note) || group.note;
    MORPH_GROUPS.push(group);
    MORPH_BY_KEY.set(group.key, group);
  }
  prefixRows.forEach(addMorphGroup);
  suffixRows.forEach(addMorphGroup);
  rootRows.forEach(addMorphGroup);

  const MORPH_EXCLUDE = {
    abs: ['absence', 'absent', 'absolute', 'absurd'],
    dem: ['demand', 'demonstrate', 'demonstration'],
    vir: ['virgin', 'virtual', 'virtually', 'virtue', 'virus'],
    patr: ['part', 'partial', 'participant', 'participate', 'participle', 'particle', 'particular', 'particularly', 'partly', 'partner', 'partnership', 'party'],
    matr: ['material', 'materialism', 'metropolitan'],
    mini: ['minister', 'ministry'],
    meta: ['metal', 'metallic'],
    suc: ['such', 'suck'],
    twi: ['twinkle', 'twist', 'twisted'],
    with: ['with', 'within', 'without'],
    step: ['step'],
    ante: ['antenna'],
    endo: ['endow'],
    sex: ['sex'],
    vice: ['vice'],
    bene: ['beneath'],
    dia: ['diamond', 'diary'],
    milli: ['million', 'millionaire']
  };

  function morphMatch(word, group) {
    const lower = word.toLowerCase();
    if (!/^[a-z][a-z'-]*$/.test(lower)) return false;
    const excluded = MORPH_EXCLUDE[group.id];
    if (excluded && excluded.indexOf(lower) !== -1) return false;
    return group.variants.some(function (v) {
      if (!v) return false;
      if (group.type === 'prefix') return lower.indexOf(v) === 0 && lower.length >= v.length + 3;
      if (group.type === 'suffix') return lower.length >= v.length + 4 && lower.slice(-v.length) === v;
      return lower.length >= v.length + 3 && lower.indexOf(v) !== -1;
    });
  }

  const ACTIVE_MORPH = [];
  WORDS.forEach(function (w) {
    w._morphGroups = [];
    w._morphKeys = [];
    MORPH_GROUPS.forEach(function (g) {
      if (!morphMatch(w.word, g)) return;
      if (w._morphKeys.indexOf(g.key) === -1) {
        w._morphKeys.push(g.key);
        w._morphGroups.push(g);
        g.words.push(w);
      }
    });
    w._affixGroups = w._morphGroups.filter(function (g) { return g.type !== 'root'; });
    w._rootGroups = w._morphGroups.filter(function (g) { return g.type === 'root'; });
  });
  MORPH_GROUPS.forEach(function (g) {
    if (g.words.length >= 1) {
      g.count = g.words.length;
      g.examples = g.words.slice(0, 6).map(function (w) { return w.word; });
      ACTIVE_MORPH.push(g);
    }
  });
  ACTIVE_MORPH.sort(function (a, b) { return b.count - a.count || a.label.localeCompare(b.label); });
  const ACTIVE_MORPH_BY_KEY = new Map(ACTIVE_MORPH.map(function (g) { return [g.key, g]; }));
  const AFFIX_GROUPS = ACTIVE_MORPH.filter(function (g) { return g.type !== 'root'; });
  const ROOT_GROUPS = ACTIVE_MORPH.filter(function (g) { return g.type === 'root'; });
  const PINNED_MORPH_KEYS = [
    'prefix:pre', 'prefix:re', 'prefix:un', 'prefix:in', 'prefix:dis', 'prefix:con', 'prefix:ex', 'prefix:trans',
    'suffix:ion', 'suffix:able', 'suffix:ment', 'suffix:ive', 'suffix:ous', 'suffix:ly'
  ];
  const TOP_MORPH_FILTERS = PINNED_MORPH_KEYS.map(function (key) { return MORPH_BY_KEY.get(key); })
    .filter(function (g) { return g && g.count >= 2; });
  const PREFIX_GROUPS = AFFIX_GROUPS.filter(function (g) { return g.type === 'prefix'; });
  const SUFFIX_GROUPS = AFFIX_GROUPS.filter(function (g) { return g.type === 'suffix'; });

  const semanticRows = (Array.isArray(window.YANCI_SEMANTIC) ? window.YANCI_SEMANTIC : [])
    .concat(Array.isArray(window.YANCI_SEMANTIC_EXTRA) ? window.YANCI_SEMANTIC_EXTRA : []);
  const SEMANTIC_GROUPS = [];
  const SEMANTIC_BY_WORD = new Map();
  semanticRows.forEach(function (row) {
    if (!row || !row.id || !Array.isArray(row.members)) return;
    const group = { id: row.id, label: row.label || row.id, note: row.note || '', members: row.members.map(function (m) { return String(m).toLowerCase(); }), words: [] };
    SEMANTIC_GROUPS.push(group);
    group.members.forEach(function (word) {
      if (!SEMANTIC_BY_WORD.has(word)) SEMANTIC_BY_WORD.set(word, []);
      SEMANTIC_BY_WORD.get(word).push(group);
    });
  });
  WORDS.forEach(function (w) {
    w._semanticGroups = SEMANTIC_BY_WORD.get(w.word.toLowerCase()) || [];
  });
  SEMANTIC_GROUPS.forEach(function (g) {
    WORDS.forEach(function (w) {
      if (w._semanticGroups.indexOf(g) !== -1) g.words.push(w);
    });
  });
  const ACTIVE_SEMANTIC = SEMANTIC_GROUPS.filter(function (g) { return g.words.length >= 2; });
  ACTIVE_SEMANTIC.sort(function (a, b) { return b.words.length - a.words.length || a.label.localeCompare(b.label); });
  const SEMANTIC_BY_ID = new Map(ACTIVE_SEMANTIC.map(function (g) { return [g.id, g]; }));
  const SEMANTIC_PINNED = ['smart', 'foolish', 'travel', 'law', 'economy', 'environment', 'health', 'show'];
  const TOP_SEMANTIC_FILTERS = [];
  ACTIVE_SEMANTIC.slice(0, 10).concat(SEMANTIC_PINNED.map(function (id) { return SEMANTIC_BY_ID.get(id); })).forEach(function (g) {
    if (g && TOP_SEMANTIC_FILTERS.indexOf(g) === -1) TOP_SEMANTIC_FILTERS.push(g);
  });

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------- storage */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        favorites: Array.from(state.favorites),
        masteredAt: state.masteredAt,
        selected: Array.from(state.selected),
        notes: state.notes,
        composerTheme: state.composerTheme,
        length: state.length,
        layout: state.layout,
        article: state.article,
        history: state.history.slice(0, 8),
        daily: state.daily,
        dailyLog: state.dailyLog,
        dailySettings: state.dailySettings,
        dailyMemory: state.dailyMemory,
        sprintMode: state.sprintMode,
        sprintFast: state.sprintFast,
        sprintLog: state.sprintLog
      }));
    } catch (e) { /* 隐私模式下静默失败，应用仍可正常使用 */ }
  }

  const saved = loadStore();
  function normalizeDailySettings(raw) {
    const value = raw && typeof raw === 'object' ? raw : {};
    return {
      mode: value.mode === 'manual' ? 'manual' : 'auto',
      newCount: Math.max(0, Math.min(30, Number(value.newCount) || 10)),
      reviewCount: Math.max(0, Math.min(30, Number(value.reviewCount) || 10))
    };
  }
  function normalizeDailyMemory(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
    Object.keys(raw).forEach(function (id) {
      const item = raw[id];
      if (!BY_ID.has(id) || !item || typeof item !== 'object') return;
      const stage = Math.max(1, Math.min(6, Number(item.stage) || 1));
      out[id] = {
        stage: stage,
        last: typeof item.last === 'string' ? item.last : '',
        next: typeof item.next === 'string' ? item.next : '',
        seen: Math.max(1, Number(item.seen) || 1)
      };
    });
    return out;
  }
  const validIds = function (ids) {
    return (Array.isArray(ids) ? ids : []).filter(function (id) { return BY_ID.has(id); });
  };
  function newSprintFast() {
    return {
      date: todayKey(),
      seed: Math.floor(Math.random() * 1000000000),
      index: 0,
      round: 1,
      revealed: {},
      seen: {},
      elapsedMs: 0,
      resumedAt: Date.now(),
      checkedIn: false,
      summary: false
    };
  }
  function normalizeSprintFast(raw, log) {
    if (!raw || raw.date !== todayKey()) return newSprintFast();
    const revealed = {};
    const seen = {};
    if (raw.revealed && typeof raw.revealed === 'object') {
      Object.keys(raw.revealed).forEach(function (id) { if (BY_ID.has(id) && raw.revealed[id]) revealed[id] = true; });
    }
    if (raw.seen && typeof raw.seen === 'object') {
      Object.keys(raw.seen).forEach(function (id) { if (BY_ID.has(id) && raw.seen[id]) seen[id] = true; });
    }
    const index = Math.max(0, Math.min(WORDS.length - 1, Math.floor((Number(raw.index) || 0) / 7) * 7));
    const entry = log && log[todayKey()];
    return {
      date: raw.date,
      seed: Number(raw.seed) || Math.floor(Math.random() * 1000000000),
      index: index,
      round: Math.max(1, Number(raw.round) || 1),
      revealed: revealed,
      seen: seen,
      elapsedMs: Math.max(0, Number(raw.elapsedMs) || 0),
      resumedAt: Date.now(),
      checkedIn: Boolean(raw.checkedIn || entry),
      summary: Boolean(raw.summary)
    };
  }

  const state = {
    view: 'library',
    libraryMode: 'words',
    morphDetailKey: null,
    query: '',
    status: 'all',
    theme: null,
    limit: PAGE_SIZE,
    affix: null,
    semantic: null,
    sort: 'frequency',
    layout: saved.layout === 'list' ? 'list' : 'grid',
    revealed: new Set(),
    favorites: new Set(validIds(saved.favorites)),
    masteredAt: saved.masteredAt && typeof saved.masteredAt === 'object' ? saved.masteredAt : {},
    notes: saved.notes && typeof saved.notes === 'object' && !Array.isArray(saved.notes) ? saved.notes : {},
    noteEditing: null,
    noteSource: 'drawer',
    selected: new Set(validIds(saved.selected)),
    composerTheme: saved.composerTheme || 'auto',
    length: saved.length || 'standard',
    article: saved.article && saved.article.paragraphs ? saved.article : null,
    history: Array.isArray(saved.history) ? saved.history.filter(function (a) { return a && a.paragraphs; }).slice(0, 8) : [],
    articleView: 'en',
    savedTab: 'favorite',
    affixTab: 'prefix',
    currentWord: null,
    drawerReturnFocus: null,
    daily: saved.daily && typeof saved.daily === 'object' ? saved.daily : null,
    dailyLog: saved.dailyLog && typeof saved.dailyLog === 'object' ? saved.dailyLog : {},
    dailySettings: normalizeDailySettings(saved.dailySettings),
    dailyMemory: normalizeDailyMemory(saved.dailyMemory),
    dailyRevealed: null,
    sprintRevealed: new Set(),
    sprintRendered: false,
    sprintMode: saved.sprintMode === 'fast' ? 'fast' : 'board',
    sprintLog: saved.sprintLog && typeof saved.sprintLog === 'object' ? saved.sprintLog : {},
    sprintFast: normalizeSprintFast(saved.sprintFast, saved.sprintLog)
  };

  /* ---------------------------------------------------------- search index */
  WORDS.forEach(function (w) {
    w._noteText = noteText(w.id).toLowerCase();
    const morphText = (w._morphGroups || []).map(function (g) { return g.label + ' ' + g.meaning; }).join(' ');
    const semanticText = (w._semanticGroups || []).map(function (g) { return g.label + ' ' + g.note; }).join(' ');
    w._search = [
      w.word, w.phonetic, w.pos, w.meaning, w.en, w.level,
      w.theme, themeLabel(w),
      w.root ? w.root.label + ' ' + w.root.meaning : '',
      morphText, semanticText,
      (w.collocations || []).join(' '),
      (w.synonyms || []).map(function (s) { return s.word + ' ' + s.note; }).join(' '),
      (w.confusables || []).map(function (c) { return c.word + ' ' + c.note; }).join(' '),
      w.example, w.exampleZh
    ].join(' ').toLowerCase();
  });

  /* ---------------------------------------------------------- helpers */
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function lowerFirst(str) {
    if (!str) return str;
    if (str.length > 1 && str[1] === str[1].toUpperCase() && /[A-Z]/.test(str[1])) return str;
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function formatDate(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d.getTime())) return '—';
    return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
  }
  function isMastered(id) { return Boolean(state.masteredAt[id]); }
  function getNote(id) {
    const raw = state.notes[id];
    if (!raw) return null;
    if (typeof raw === 'string') return raw.trim() ? { text: raw, updatedAt: null } : null;
    if (typeof raw === 'object' && typeof raw.text === 'string' && raw.text.trim()) {
      return { text: raw.text, updatedAt: raw.updatedAt || null };
    }
    return null;
  }
  function noteText(id) {
    const note = getNote(id);
    return note ? note.text : '';
  }
  function noteCount() {
    return Object.keys(state.notes).filter(function (id) { return BY_ID.has(id) && getNote(id); }).length;
  }
  function noteExcerpt(text, max) {
    const flat = String(text || '').replace(/\s+/g, ' ').trim();
    return flat.length > max ? flat.slice(0, max - 1) + '…' : flat;
  }
  function noteTimestamp(note) {
    if (!note.updatedAt) return '较早记录';
    const d = new Date(note.updatedAt);
    if (isNaN(d.getTime())) return '较早记录';
    return formatDate(note.updatedAt) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function refreshSearchForNote(id) {
    const w = BY_ID.get(id);
    if (!w) return;
    w._noteText = noteText(id).toLowerCase();
  }
  function masteredCount() { return Object.keys(state.masteredAt).filter(function (id) { return BY_ID.has(id); }).length; }
  function todayMasteredCount() {
    const key = todayKey();
    return Object.keys(state.masteredAt).filter(function (id) {
      if (!BY_ID.has(id)) return false;
      const d = new Date(state.masteredAt[id]);
      return !isNaN(d.getTime()) && d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') === key;
    }).length;
  }
  /* ---------------------------------------------------------- daily study */
  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function shiftDateKey(key, delta) {
    const parts = key.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + delta);
    return dateKey(d);
  }
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function dailyEntryComplete(entry) {
    return Boolean(entry && entry.total > 0 && entry.done >= entry.total);
  }
  function dailyEntryChecked(entry) {
    if (!entry) return false;
    if (entry.checkedIn === true) return true;
    return entry.checkedIn === undefined && dailyEntryComplete(entry);
  }
  function dailyStreak() {
    let cursor = new Date();
    let key = dateKey(cursor);
    let streak = 0;
    if (!dailyEntryChecked(state.dailyLog[key])) cursor.setDate(cursor.getDate() - 1);
    for (let i = 0; i < 366; i++) {
      key = dateKey(cursor);
      if (!dailyEntryChecked(state.dailyLog[key])) break;
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }
  function dailyCheckinTotal() {
    return Object.keys(state.dailyLog || {}).filter(function (key) {
      return dailyEntryChecked(state.dailyLog[key]);
    }).length;
  }
  function shuffledDailyPool(pool, today) {
    const seed = hashString(today);
    return pool.slice().sort(function (a, b) {
      return b.freq - a.freq
        || (hashString(seed + a.id) - hashString(seed + b.id))
        || a.word.localeCompare(b.word);
    });
  }
  function dailyPlanPool() {
    const today = todayKey();
    const recent = new Set();
    Object.keys(state.dailyLog || {}).filter(function (k) { return k < today; }).sort().slice(-6).forEach(function (k) {
      (state.dailyLog[k].ids || []).forEach(function (id) { recent.add(id); });
    });
    const due = [];
    const fresh = [];
    WORDS.forEach(function (w) {
      if (isMastered(w.id)) return;
      const memory = state.dailyMemory[w.id];
      if (memory) {
        if (memory.next && memory.next <= today) due.push(w);
      } else if (!recent.has(w.id)) {
        fresh.push(w);
      }
    });
    due.sort(function (a, b) {
      const ma = state.dailyMemory[a.id] || {};
      const mb = state.dailyMemory[b.id] || {};
      return String(ma.next || '').localeCompare(String(mb.next || ''))
        || (ma.stage || 1) - (mb.stage || 1)
        || b.freq - a.freq
        || a.word.localeCompare(b.word);
    });
    return { due: due, fresh: shuffledDailyPool(fresh, today) };
  }
  function buildDailyPlan(settings) {
    const config = normalizeDailySettings(settings || state.dailySettings);
    const pool = dailyPlanPool();
    let reviewCount;
    let newCount;
    if (config.mode === 'auto') {
      reviewCount = Math.min(pool.due.length, 10);
      newCount = Math.min(pool.fresh.length, Math.max(0, DAILY_SIZE - reviewCount));
    } else {
      reviewCount = Math.min(pool.due.length, config.reviewCount);
      newCount = Math.min(pool.fresh.length, config.newCount);
    }
    if (!reviewCount && !newCount) {
      reviewCount = Math.min(pool.due.length, DAILY_SIZE);
      newCount = Math.min(pool.fresh.length, DAILY_SIZE - reviewCount);
    }
    if (!reviewCount && !newCount) {
      newCount = Math.min(WORDS.length, DAILY_SIZE);
      const fallback = shuffledDailyPool(WORDS.filter(function (w) { return !isMastered(w.id); }), todayKey());
      return {
        ids: fallback.slice(0, newCount).map(function (w) { return w.id; }),
        newIds: fallback.slice(0, newCount).map(function (w) { return w.id; }),
        reviewIds: []
      };
    }
    const pickedReview = pool.due.slice(0, reviewCount);
    const pickedNew = pool.fresh.slice(0, newCount);
    // 交错排列，避免先背完所有新词再复习。
    const ids = [];
    const newIds = [];
    const reviewIds = [];
    const max = Math.max(pickedNew.length, pickedReview.length);
    for (let i = 0; i < max; i++) {
      if (pickedNew[i]) {
        newIds.push(pickedNew[i].id);
        ids.push(pickedNew[i].id);
      }
      if (pickedReview[i]) {
        reviewIds.push(pickedReview[i].id);
        ids.push(pickedReview[i].id);
      }
    }
    return { ids: ids, newIds: newIds, reviewIds: reviewIds };
  }
  function initDaily() {
    const today = todayKey();
    const old = state.daily;
    if (old && old.date === today && Array.isArray(old.ids) && old.ids.length > 0) {
      const ids = validIds(old.ids);
      const done = {};
      const sourceDone = old.done && typeof old.done === 'object' ? old.done : {};
      ids.forEach(function (id) {
        if (sourceDone[id] === 'known' || sourceDone[id] === 'review') done[id] = sourceDone[id];
      });
      const newIds = Array.isArray(old.newIds) ? old.newIds.filter(function (id) { return ids.indexOf(id) !== -1; }) : ids.slice();
      const reviewIds = Array.isArray(old.reviewIds) ? old.reviewIds.filter(function (id) { return ids.indexOf(id) !== -1; }) : [];
      state.daily = {
        date: today,
        ids: ids,
        newIds: newIds,
        reviewIds: reviewIds,
        done: done,
        current: ids.indexOf(old.current) !== -1 ? old.current : null,
        checkedIn: Boolean(old.checkedIn)
      };
    } else {
      const plan = buildDailyPlan(state.dailySettings);
      state.daily = {
        date: today,
        ids: plan.ids,
        newIds: plan.newIds,
        reviewIds: plan.reviewIds,
        done: {},
        current: null,
        checkedIn: false
      };
    }
    state.dailyRevealed = null;
    state.dailyLog[today] = {
      total: state.daily.ids.length,
      done: Object.keys(state.daily.done).length,
      ids: state.daily.ids.slice(),
      newCount: state.daily.newIds.length,
      reviewCount: state.daily.reviewIds.length,
      checkedIn: state.daily.checkedIn
    };
    const dates = Object.keys(state.dailyLog).sort();
    if (dates.length > 120) dates.slice(0, dates.length - 120).forEach(function (k) { delete state.dailyLog[k]; });
    saveStore();
  }
  function addSelectedQuiet(id) {
    if (!BY_ID.has(id)) return 'invalid';
    if (state.selected.has(id)) return 'exists';
    if (state.selected.size >= MAX_SELECTED) return 'full';
    state.selected.add(id);
    saveStore();
    renderComposer();
    return 'added';
  }
  function currentDailyId() {
    if (!state.daily) return null;
    const ids = state.daily.ids;
    const done = state.daily.done;
    let id = state.daily.current;
    if (id && ids.indexOf(id) !== -1 && !done[id]) return id;
    id = ids.find(function (x) { return !done[x]; }) || null;
    state.daily.current = id;
    return id;
  }
  function dailyTags(w) {
    const tags = [];
    if (w._rootGroups && w._rootGroups[0]) tags.push('词根 ' + w._rootGroups[0].label);
    (w._affixGroups || []).slice(0, 2).forEach(function (g) { tags.push(g.label); });
    (w._semanticGroups || []).slice(0, 2).forEach(function (g) { tags.push(g.label); });
    return tags.slice(0, 5);
  }
  function dailyWeekHTML() {
    const today = new Date();
    const cells = [];
    for (let offset = -6; offset <= 0; offset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + offset);
      const key = dateKey(d);
      const entry = state.dailyLog[key];
      const checked = dailyEntryChecked(entry);
      const complete = dailyEntryComplete(entry);
      const cls = checked ? 'is-checked' : complete ? 'is-complete' : key === dateKey(today) ? 'is-today' : '';
      cells.push('<div class="daily-day ' + cls + '">' +
        '<span>' + '日一二三四五六'[d.getDay()] + '</span>' +
        '<b>' + d.getDate() + '</b>' +
        '<i>' + (checked ? '✓' : complete ? '·' : '') + '</i>' +
      '</div>');
    }
    return cells.join('');
  }
  function dailyNoteHTML(w) {
    const note = getNote(w.id);
    const editing = state.noteEditing === w.id;
    if (editing) {
      return '<div class="daily-note">' +
        '<div class="daily-note-head"><span>我的笔记</span><span class="note-edit-hint">与单词详情共用同一条笔记</span></div>' +
        '<textarea id="daily-note-input" maxlength="1200" placeholder="记下搭配、例句，或只属于你的记忆线索…">' + escapeHtml(note ? noteText(w.id) : '') + '</textarea>' +
        '<div class="daily-note-foot"><span id="daily-note-count">' + (note ? noteText(w.id).length : 0) + ' / 1200</span>' +
          '<span class="note-shortcut">Ctrl / ⌘ + Enter 保存 · Esc 取消</span>' +
          '<button class="text-btn muted" data-action="cancel-note" data-id="' + w.id + '">取消</button>' +
          '<button class="btn btn-primary btn-small" data-action="save-note" data-id="' + w.id + '">保存笔记</button>' +
        '</div>' +
      '</div>';
    }
    if (note) {
      return '<div class="daily-note">' +
        '<div class="daily-note-head"><span>我的笔记</span><span class="note-meta">' + escapeHtml(noteTimestamp(note)) + '</span></div>' +
        '<p class="daily-note-text">' + escapeHtml(noteText(w.id)) + '</p>' +
        '<div class="daily-note-actions"><button class="text-btn" data-action="daily-edit-note" data-id="' + w.id + '">编辑笔记</button>' +
          '<button class="text-btn muted" data-action="delete-note" data-id="' + w.id + '">删除</button></div>' +
      '</div>';
    }
    return '<button class="daily-note-add" data-action="daily-edit-note" data-id="' + w.id + '">' +
      '<svg class="icon"><use href="#i-pen"></use></svg><span>写一条单词笔记</span><small>和详情页共用同一条笔记</small></button>';
  }
  function updateDailyPlanUI() {
    const settings = state.dailySettings;
    const auto = settings.mode === 'auto';
    $$('input[name="daily-plan-mode"]').forEach(function (input) { input.checked = input.value === settings.mode; });
    const newInput = $('#daily-new-count');
    const reviewInput = $('#daily-review-count');
    if (newInput && reviewInput) {
      newInput.disabled = auto;
      reviewInput.disabled = auto;
      if (auto && state.daily) {
        newInput.value = state.daily.newIds.length;
        reviewInput.value = state.daily.reviewIds.length;
      } else {
        newInput.value = settings.newCount;
        reviewInput.value = settings.reviewCount;
      }
    }
    const note = $('#daily-plan-note');
    if (note) {
      if (auto) {
        const due = state.daily ? state.daily.reviewIds.length : 0;
        const fresh = state.daily ? state.daily.newIds.length : 0;
        note.textContent = '记忆曲线自动安排：' + fresh + ' 个新词 + ' + due + ' 个到期复习。';
      } else {
        const actualNew = state.daily ? state.daily.newIds.length : settings.newCount;
        const actualReview = state.daily ? state.daily.reviewIds.length : settings.reviewCount;
        const short = state.daily && actualReview < settings.reviewCount ? '（到期复习词不足）' : '';
        note.textContent = '自主调配：今日 ' + actualNew + ' 个新词 + ' + actualReview + ' 个复习' + short + '。';
      }
    }
    const btn = $('#daily-checkin-btn');
    if (btn && state.daily) {
      const doneCount = state.daily.ids.filter(function (id) { return Boolean(state.daily.done[id]); }).length;
      if (state.daily.checkedIn) {
        btn.textContent = '已打卡 ✓';
        btn.disabled = true;
      } else if (doneCount >= state.daily.ids.length && state.daily.ids.length > 0) {
        btn.textContent = '今日打卡';
        btn.disabled = false;
      } else {
        btn.textContent = '完成词单后打卡';
        btn.disabled = true;
      }
    }
    const week = $('#daily-week');
    if (week) week.innerHTML = dailyWeekHTML();
    const total = $('#daily-total-checkins');
    if (total) total.textContent = dailyCheckinTotal();
  }
  function renderDaily() {
    if (!state.daily) return;
    const goalChip = $('#goal-chip');
    if (goalChip) goalChip.title = '今日计划 ' + state.daily.ids.length + ' 词';
    const ids = state.daily.ids;
    const done = state.daily.done;
    const total = ids.length;
    const doneCount = ids.filter(function (id) { return Boolean(done[id]); }).length;
    const knownCount = ids.filter(function (id) { return done[id] === 'known'; }).length;
    const reviewCount = ids.filter(function (id) { return done[id] === 'review'; }).length;
    const selectedCount = ids.filter(function (id) { return state.selected.has(id); }).length;
    const remaining = Math.max(0, total - doneCount);
    $('#nav-daily-count').textContent = remaining ? remaining : '✓';
    $('#daily-list-count').textContent = doneCount;
    $('#daily-list-total').textContent = total;
    $('#daily-known-count').textContent = knownCount;
    if ($('#today-count')) $('#today-count').textContent = doneCount;
    if ($('#today-goal')) $('#today-goal').textContent = total;
    $('#daily-streak').textContent = dailyStreak();
    updateDailyPlanUI();

    const currentId = currentDailyId();
    const stage = $('#daily-stage');
    if (!total) {
      stage.innerHTML = '<div class="daily-complete"><div class="daily-complete-seal">词</div><h3>还没有可用词条</h3><p>请先检查词库数据是否加载。</p></div>';
    } else if (!currentId) {
      stage.innerHTML = '' +
        '<div class="daily-complete">' +
          '<div class="daily-complete-seal">✓</div>' +
          '<div class="daily-complete-kicker">DAILY COMPLETE · ' + formatDate(new Date().toISOString()) + '</div>' +
          '<h3>今天的 ' + total + ' 个词，已经过完一遍。</h3>' +
          '<p>' + knownCount + ' 个记住了，' + reviewCount + ' 个留待复习。' +
            (selectedCount ? '<br>其中 ' + selectedCount + ' 个已自动加入选词成文。' : '') + '</p>' +
          '<div class="daily-complete-actions">' +
            '<button class="btn btn-primary" data-action="daily-compose"><svg class="icon"><use href="#i-pen"></use></svg>用今日单词写文章</button>' +
            '<button class="btn btn-ghost" data-action="daily-reset"><svg class="icon"><use href="#i-refresh"></use></svg>再复习一遍</button>' +
          '</div>' +
        '</div>';
    } else {
      const w = BY_ID.get(currentId);
      const idx = ids.indexOf(currentId) + 1;
      const revealed = state.dailyRevealed === currentId;
      const tags = revealed ? dailyTags(w) : [];
      const isReview = state.daily.reviewIds.indexOf(currentId) !== -1;
      const kind = isReview ? '复习' : '新词';
      stage.innerHTML = '' +
        '<div class="daily-progress-card">' +
          '<div class="daily-progress-top"><span>今日进度</span><b>' + doneCount + ' / ' + total + '</b></div>' +
          '<div class="daily-progress-track"><span style="width:' + (doneCount / total * 100) + '%"></span></div>' +
          '<div class="daily-progress-foot"><span>' + formatDate(state.daily.date) + '</span><span>已自动入文 ' + selectedCount + ' 个</span></div>' +
        '</div>' +
        '<div class="daily-card' + (revealed ? ' is-revealed' : '') + '" data-action="daily-reveal" role="button" tabindex="0" aria-expanded="' + (revealed ? 'true' : 'false') + '">' +
          '<div class="daily-card-top"><span>WORD ' + String(idx).padStart(2, '0') + ' / ' + total + '<em class="daily-kind ' + (isReview ? 'is-review' : '') + '">' + kind + '</em></span><span class="daily-card-date">' + formatDate(state.daily.date) + '</span></div>' +
          '<div class="daily-word">' + escapeHtml(w.word) + '</div>' +
          '<div class="daily-pron"><span>' + (w.phonetic ? escapeHtml(w.phonetic) : '基础词') + '</span>' +
            '<button class="daily-sound" data-action="speak" data-word="' + escapeHtml(w.word) + '" aria-label="朗读 ' + escapeHtml(w.word) + '"><svg class="icon"><use href="#i-sound"></use></svg></button>' +
          '</div>' +
          '<div class="daily-meaning' + (revealed ? ' is-visible' : '') + '">' +
            (revealed ? escapeHtml(meaningWithPos(w)) : '<span>先回忆，再展开中文</span>') +
          '</div>' +
          (tags.length ? '<div class="daily-tags">' + tags.map(function (t) { return '<span>' + escapeHtml(t) + '</span>'; }).join('') + '</div>' : '') +
          '<div class="daily-hint">' + (revealed ? '点击卡片可隐藏释义' : '点击卡片显示中文') + '</div>' +
        '</div>' +
        '<div class="daily-actions">' +
          (!revealed
            ? '<button class="btn btn-primary btn-wide" data-action="daily-reveal">显示中文</button>'
            : '<button class="btn btn-ghost" data-action="daily-mark" data-id="' + currentId + '" data-result="review">还要复习</button>' +
              '<button class="btn btn-primary" data-action="daily-mark" data-id="' + currentId + '" data-result="known">记住了</button>') +
        '</div>' +
        (revealed ? dailyNoteHTML(w) : '') +
        '<p class="daily-auto-note">背完当前词，会自动加入选词成文（最多 ' + MAX_SELECTED + ' 个）。</p>';
    }

    const list = $('#daily-word-list');
    list.innerHTML = ids.map(function (id, i) {
      const w = BY_ID.get(id);
      if (!w) return '';
      const status = done[id];
      const inComposer = state.selected.has(id);
      const isReview = state.daily.reviewIds.indexOf(id) !== -1;
      return '<button class="daily-row ' + (status ? 'is-' + status : '') + (id === currentId ? ' is-current' : '') + '" data-action="open-detail" data-id="' + id + '">' +
        '<span class="daily-row-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="daily-row-word">' + escapeHtml(w.word) + '<em class="daily-row-kind">' + (isReview ? '复' : '新') + '</em></span>' +
        '<span class="daily-row-mark">' + (status === 'known' ? '✓ 记住' : status === 'review' ? '↺ 复习' : inComposer ? '＋ 已入文' : '') + '</span>' +
      '</button>';
    }).join('');
    const composeBtn = $('[data-action="daily-compose"]');
    if (composeBtn) composeBtn.disabled = !total;
  }
  function markDaily(id, result) {
    if (!state.daily || state.daily.ids.indexOf(id) === -1) return;
    if (state.daily.done[id]) return;
    const today = state.daily.date || todayKey();
    const previous = state.dailyMemory[id];
    let stage = previous ? previous.stage : 0;
    if (result === 'known') stage = Math.min(6, stage + 1);
    else stage = Math.max(1, stage - 1);
    const interval = DAILY_INTERVALS[Math.min(DAILY_INTERVALS.length - 1, stage - 1)];
    state.dailyMemory[id] = {
      stage: stage,
      last: today,
      next: shiftDateKey(today, interval),
      seen: (previous ? previous.seen : 0) + 1
    };
    state.daily.done[id] = result === 'review' ? 'review' : 'known';
    state.daily.current = null;
    state.dailyRevealed = null;
    state.noteEditing = null;
    const doneCount = Object.keys(state.daily.done).length;
    const justCompleted = doneCount >= state.daily.ids.length;
    state.dailyLog[state.daily.date] = {
      total: state.daily.ids.length,
      done: doneCount,
      ids: state.daily.ids.slice(),
      newCount: state.daily.newIds.length,
      reviewCount: state.daily.reviewIds.length,
      checkedIn: state.daily.checkedIn
    };
    const addResult = addSelectedQuiet(id);
    saveStore();
    renderDaily();
    if (justCompleted) {
      toast('今日词单完成 · 记得打卡');
    } else if (addResult === 'added') {
      toast((result === 'known' ? '记住了 · ' : '已标记复习 · ') + '自动加入选词（' + state.selected.size + '）');
    } else if (addResult === 'full') {
      toast((result === 'known' ? '记住了 · ' : '已标记复习 · ') + '选词已满 ' + MAX_SELECTED + ' 个');
    } else {
      toast(result === 'known' ? '记住了' : '已标记复习');
    }
  }
  function checkinDaily() {
    if (!state.daily) return;
    const total = state.daily.ids.length;
    const done = state.daily.ids.filter(function (id) { return Boolean(state.daily.done[id]); }).length;
    if (!total || done < total) {
      toast('完成今日词单后即可打卡');
      return;
    }
    state.daily.checkedIn = true;
    state.dailyLog[state.daily.date] = {
      total: total,
      done: done,
      ids: state.daily.ids.slice(),
      newCount: state.daily.newIds.length,
      reviewCount: state.daily.reviewIds.length,
      checkedIn: true
    };
    saveStore();
    renderDaily();
    toast('打卡成功 · 连续 ' + dailyStreak() + ' 天');
  }
  function applyDailyPlan() {
    if (!state.daily) return;
    const modeInput = $('input[name="daily-plan-mode"]:checked');
    const mode = modeInput && modeInput.value === 'manual' ? 'manual' : 'auto';
    const newCount = Math.max(0, Math.min(30, Number($('#daily-new-count').value) || 0));
    const reviewCount = Math.max(0, Math.min(30, Number($('#daily-review-count').value) || 0));
    if (mode === 'manual' && newCount + reviewCount === 0) {
      toast('新词和复习至少各设一个数量');
      return;
    }
    const done = Object.keys(state.daily.done).length;
    if (done > 0 && !window.confirm('重新生成会清空今日已背进度，继续吗？')) return;
    const wasChecked = Boolean(state.daily.checkedIn);
    state.dailySettings = normalizeDailySettings({ mode: mode, newCount: newCount, reviewCount: reviewCount });
    const plan = buildDailyPlan(state.dailySettings);
    state.daily = {
      date: todayKey(),
      ids: plan.ids,
      newIds: plan.newIds,
      reviewIds: plan.reviewIds,
      done: {},
      current: null,
      checkedIn: wasChecked
    };
    state.dailyRevealed = null;
    state.noteEditing = null;
    state.dailyLog[state.daily.date] = {
      total: plan.ids.length,
      done: 0,
      ids: plan.ids.slice(),
      newCount: plan.newIds.length,
      reviewCount: plan.reviewIds.length,
      checkedIn: wasChecked
    };
    saveStore();
    renderDaily();
    toast('今日计划已更新：' + plan.newIds.length + ' 新词 + ' + plan.reviewIds.length + ' 复习');
  }
  function startDailyNoteEdit(id) {
    if (!BY_ID.has(id)) return;
    state.noteEditing = id;
    state.noteSource = 'daily';
    renderDaily();
    requestAnimationFrame(function () {
      const input = $('#daily-note-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }
  function takeDailyToComposer() {
    if (!state.daily || !state.daily.ids.length) return;
    let added = 0;
    let full = false;
    state.daily.ids.forEach(function (id) {
      if (state.selected.has(id)) return;
      if (state.selected.size >= MAX_SELECTED) { full = true; return; }
      state.selected.add(id);
      added++;
    });
    saveStore();
    renderComposer();
    renderDaily();
    setView('composer');
    toast(full ? '今日词已接入，选词上限 ' + MAX_SELECTED + ' 个' : '今日 ' + state.daily.ids.length + ' 个词已接入选词');
  }
  function resetDaily() {
    if (!state.daily) return;
    const wasChecked = Boolean(state.daily.checkedIn);
    state.daily.done = {};
    state.daily.current = null;
    state.daily.checkedIn = wasChecked;
    state.dailyRevealed = null;
    state.noteEditing = null;
    state.dailyLog[state.daily.date] = {
      total: state.daily.ids.length,
      done: 0,
      ids: state.daily.ids.slice(),
      newCount: state.daily.newIds.length,
      reviewCount: state.daily.reviewIds.length,
      checkedIn: wasChecked
    };
    saveStore();
    renderDaily();
    toast('已重置今日背诵');
  }

  let toastTimer = null;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  function hideWordPop() {
    const pop = $('#word-pop');
    if (pop) pop.hidden = true;
  }
  function showWordPop(w, anchor) {
    const pop = $('#word-pop');
    if (!pop || !w) return;
    const root = (w._rootGroups && w._rootGroups[0]) ? w._rootGroups[0].label : '';
    const affix = (w._affixGroups || []).slice(0, 3).map(function (g) { return g.label; }).join(' · ');
    const semantic = (w._semanticGroups || []).slice(0, 3).map(function (g) { return g.label; }).join(' · ');
    pop.innerHTML = '' +
      '<div class="pop-kicker">' + escapeHtml(themeEnglish(w)) + '</div>' +
      '<div class="pop-head"><strong>' + escapeHtml(w.word) + '</strong><span>' + escapeHtml(w.phonetic || '') + '</span></div>' +
      '<p class="pop-meaning">' + escapeHtml(meaningWithPos(w)) + '</p>' +
      '<div class="pop-tags">' +
        (root ? '<span class="mini-tag root">' + escapeHtml(root) + '</span>' : '') +
        (affix ? '<span class="mini-tag">' + escapeHtml(affix) + '</span>' : '') +
        (semantic ? '<span class="mini-tag semantic">' + escapeHtml(semantic) + '</span>' : '') +
      '</div>' +
      '<div class="pop-actions">' +
        '<button class="text-btn" data-action="add-selected" data-id="' + w.id + '">' +
          (state.selected.has(w.id) ? '已在选词中' : '加入选词') +
        '</button>' +
        '<button class="text-btn muted" data-action="open-detail" data-id="' + w.id + '">完整详情</button>' +
      '</div>';
    pop.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(310, window.innerWidth - 24);
    pop.style.width = width + 'px';
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
    let top = rect.bottom + 8;
    const height = pop.offsetHeight;
    if (top + height > window.innerHeight - 12) top = rect.top - height - 8;
    pop.style.left = left + 'px';
    pop.style.top = Math.max(12, top) + 'px';
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function wordForms(word) {
    const w = String(word).toLowerCase();
    const forms = [w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w + 'ly'];
    if (/e$/.test(w)) forms.push(w.slice(0, -1) + 'ing');
    if (/y$/.test(w)) forms.push(w.slice(0, -1) + 'ies', w.slice(0, -1) + 'ied');
    return Array.from(new Set(forms));
  }
  function countOccurrences(text, word) {
    const forms = wordForms(word).map(escapeRegExp).join('|');
    const re = new RegExp('\\b(?:' + forms + ')\\b', 'gi');
    const m = text.match(re);
    return m ? m.length : 0;
  }
  function highlightWords(text, words) {
    const map = new Map();
    words.forEach(function (w) {
      wordForms(w.word).forEach(function (f) { map.set(f, w); });
    });
    const keys = Array.from(map.keys()).sort(function (a, b) { return b.length - a.length; });
    if (!keys.length) return escapeHtml(text);
    const re = new RegExp('\\b(' + keys.map(escapeRegExp).join('|') + ')\\b', 'gi');
    return escapeHtml(text).replace(re, function (match) {
      const w = map.get(match.toLowerCase());
      if (!w) return match;
      return '<span class="target-word" data-word-id="' + w.id + '" tabindex="0" role="button" title="' + escapeHtml(meaningWithPos(w)) + '">' + match + '</span>';
    });
  }
  let ARTICLE_INDEX = null;
  function getArticleIndex() {
    if (ARTICLE_INDEX) return ARTICLE_INDEX;
    const exact = new Map();
    const forms = new Map();
    WORDS.forEach(function (w) {
      const key = String(w.word).toLowerCase();
      if (!exact.has(key)) exact.set(key, w);
      wordForms(w.word).forEach(function (f) {
        if (f !== key && !forms.has(f)) forms.set(f, w);
      });
    });
    ARTICLE_INDEX = { exact: exact, forms: forms };
    return ARTICLE_INDEX;
  }
  function linkArticleText(text, targetWords, mode) {
    const targetMap = new Map();
    (targetWords || []).forEach(function (w) {
      wordForms(w.word).forEach(function (f) { targetMap.set(f, w); });
    });
    const index = getArticleIndex();
    const className = mode === 'example' ? 'example-word' : 'article-word';
    const re = /[A-Za-z]+(?:[’'][A-Za-z]+)*/g;
    let out = '';
    let last = 0;
    let match;
    while ((match = re.exec(text))) {
      out += escapeHtml(text.slice(last, match.index));
      const raw = match[0];
      const base = raw.replace(/[’']s$/i, '');
      const key = base.toLowerCase();
      const w = targetMap.get(key) || index.exact.get(key) || index.forms.get(key);
      if (w) {
        const isTarget = targetMap.get(key) === w;
        const cls = (isTarget ? 'target-word ' : '') + className;
        const attrs = isTarget ? ' tabindex="0" role="button"' : '';
        out += '<span class="' + cls + '" data-word-id="' + w.id + '"' + attrs + ' title="' + escapeHtml(meaningWithPos(w)) + '">' + escapeHtml(raw) + '</span>';
      } else {
        out += escapeHtml(raw);
      }
      last = match.index + raw.length;
    }
    out += escapeHtml(text.slice(last));
    return out;
  }
  function splitBalanced(items, parts) {
    const result = [];
    const n = Math.ceil(items.length / parts);
    for (let i = 0; i < items.length; i += n) result.push(items.slice(i, i + n));
    return result;
  }
  function splitEnglishSentences(text) {
    const s = String(text || '').trim();
    if (!s) return [];
    return (s.match(/[^.!?]+[.!?]+["']?/g) || [s]).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function splitChineseSentences(text) {
    const s = String(text || '').trim();
    if (!s) return [];
    return (s.match(/[^。！？；]+[。！？；]?/g) || [s]).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function paragraphSentences(p) {
    if (Array.isArray(p.sentences) && p.sentences.length) return p.sentences;
    const en = splitEnglishSentences(p.en);
    const zh = splitChineseSentences(p.zh);
    return en.map(function (sentence, i) {
      return { en: sentence, zh: zh[i] || p.zh };
    });
  }

  /* ---------------------------------------------------------- topic packs */
  const PACKS = {
    society: {
      label: '社会议题',
      titles: ['The Invisible Architecture of Public Life', 'Living Together in an Age of Change', 'What Holds a Society Together'],
      intro: [
        { en: 'A society is held together by more than laws and institutions. It is also sustained by the assumptions people make about one another and by the choices they treat as normal.', zh: '维系一个社会的，不只是法律和制度，还有人们对彼此的假设，以及他们视为理所当然的选择。' },
        { en: 'When those assumptions begin to shift, familiar problems take on a new shape. The observations below trace some of the pressures that define contemporary public life.', zh: '当这些假设开始松动，熟悉的问题便呈现出新的形态。以下观察勾勒出当代公共生活中的一些压力。' }
      ],
      leads: [
        { en: 'These pressures appear in several overlapping areas.', zh: '这些压力出现在几个相互重叠的领域。' },
        { en: 'A second pattern is less visible but no less consequential.', zh: '第二种模式不那么显眼，却同样影响深远。' },
        { en: 'A final set of tensions concerns the boundary between individual freedom and collective responsibility.', zh: '最后一组紧张关系，涉及个人自由与集体责任之间的边界。' }
      ],
      conclusion: [
        { en: 'None of these problems has a simple solution, and pretending otherwise is part of the problem. What matters is the quality of public reasoning: whether citizens can name a tension clearly, weigh competing goods, and accept that trade-offs are real.', zh: '这些问题都没有简单的解决办法，假装有，本身就是问题的一部分。真正重要的是公共推理的质量：公民能否清楚地说出一种紧张关系，权衡相互竞争的善，并承认取舍是真实存在的。' },
        { en: 'A society that can do this is not free of conflict, but it is capable of learning. That capacity, more than any single policy, allows a community to adapt without losing its sense of direction.', zh: '能做到这一点的社会并非没有冲突，但它拥有学习能力。正是这种能力，而非任何单一政策，使一个共同体能够在适应变化的同时不迷失方向。' }
      ]
    },
    technology: {
      label: '科技议题',
      titles: ['The Human Shape of Technological Change', 'Innovation and Its Discontents', 'Living with Machines That Learn'],
      intro: [
        { en: 'Technology is often described as a force that arrives from outside society and reshapes it without warning. In practice, tools and institutions shape one another: every new capability invites new rules, habits, and expectations.', zh: '人们常把技术描述成一种从社会外部降临、毫无预警地重塑社会的力量。实际上，工具与制度相互塑造：每一种新能力都会带来新的规则、习惯与期待。' },
        { en: 'The question is therefore not simply what technology can do, but what kind of life it makes easier to imagine. The observations below examine that question from several angles.', zh: '因此问题不只是技术能做什么，而是它让什么样的生活更容易被想象。以下观察从几个角度审视这一问题。' }
      ],
      leads: [
        { en: 'The first effects are usually economic, but they rarely stop there.', zh: '最初的影响通常出现在经济层面，但很少止步于此。' },
        { en: 'A second set of questions concerns power and access.', zh: '第二组问题关乎权力与可及性。' },
        { en: 'The deepest uncertainty, however, concerns human judgment itself.', zh: '然而最深的不确定性，关乎人类判断力本身。' }
      ],
      conclusion: [
        { en: 'The lesson is not that innovation should be slowed, but that it should be accompanied by institutions capable of learning at a similar speed. Regulation, education, and public debate are not obstacles to progress; they are how progress becomes durable.', zh: '教训并不是应当放慢创新，而是应当有能够以相似速度学习的制度与之相伴。监管、教育与公共讨论不是进步的障碍，而是进步得以持续的方式。' },
        { en: 'A society that treats technology as fate will be shaped by it. A society that treats it as a choice can still decide what it is for.', zh: '把技术当作命运的社会，会被技术塑造；把技术当作选择的社会，则仍能决定它为谁服务。' }
      ]
    },
    education: {
      label: '教育议题',
      titles: ['What Education Is Really For', 'Learning in an Age of Information', 'The Quiet Work of Becoming Educated'],
      intro: [
        { en: 'Education is sometimes reduced to the transfer of information or the pursuit of credentials. Yet its deeper purpose is to help people think for themselves when the available answers are incomplete or conflicting.', zh: '教育有时被简化为传递信息或追逐文凭。然而它更深层的目的，是帮助人们在现有答案不完整或相互冲突时，仍能独立思考。' },
        { en: 'That purpose becomes harder to pursue as information multiplies and attention fragments. The observations below consider what learning demands in such conditions.', zh: '随着信息激增、注意力碎片化，这一目的变得更难实现。以下观察思考在这样的条件下，学习究竟要求什么。' }
      ],
      leads: [
        { en: 'The first challenge is structural rather than personal.', zh: '第一个挑战是结构性的，而非个人层面的。' },
        { en: 'A second challenge concerns the relationship between knowledge and judgment.', zh: '第二个挑战关乎知识与判断力之间的关系。' },
        { en: 'A final challenge is to keep education open to those who need it most.', zh: '最后一个挑战，是让教育向最需要它的人保持开放。' }
      ],
      conclusion: [
        { en: 'Education cannot promise certainty, and it should not try. What it can offer is a disciplined way of living with uncertainty: the habit of asking better questions, testing one’s own assumptions, and changing one’s mind when the evidence demands it.', zh: '教育无法承诺确定性，也不应如此承诺。它能提供的，是一种与不确定性共处的训练有素的方式：提出更好的问题、检验自己的假设，并在证据要求时改变想法。' },
        { en: 'That is a slower kind of progress than headlines suggest, but it is the kind that lasts.', zh: '这种进步比新闻标题所暗示的更缓慢，却也是能够持续的那一种。' }
      ]
    },
    environment: {
      label: '环境议题',
      titles: ['Growth, Limits, and the Long View', 'The Cost of Convenience', 'Learning to Live Within Limits'],
      intro: [
        { en: 'Environmental problems are often framed as a conflict between prosperity and protection. In reality, the choice is rarely so clean: the same systems that create convenience also create exposure, and the costs are distributed unevenly.', zh: '环境问题常被框定为繁荣与保护之间的冲突。现实中，这种选择很少如此泾渭分明：带来便利的同一套系统也带来风险，而代价的分配并不均衡。' },
        { en: 'The observations below examine how habits, incentives, and public decisions shape the environment — and who bears the consequences.', zh: '以下观察审视习惯、激励与公共决策如何塑造环境，以及由谁承担后果。' }
      ],
      leads: [
        { en: 'The first difficulty is that environmental costs are often delayed and dispersed.', zh: '第一个困难在于，环境代价往往滞后且分散。' },
        { en: 'A second difficulty is distributive: those who benefit least often bear the most risk.', zh: '第二个困难是分配性的：受益最少的人，往往承担最大风险。' },
        { en: 'A third difficulty is political: the long view is hard to sustain in short political cycles.', zh: '第三个困难是政治性的：在短政治周期中，长期视角难以维持。' }
      ],
      conclusion: [
        { en: 'A serious environmental policy does not rely on individual virtue alone. It changes the default: how energy is priced, how cities are built, and how products are designed. Personal responsibility matters, but it works best when the surrounding system makes the better choice the easier one.', zh: '严肃的环境政策不能只依赖个人美德，而要改变默认选项：能源如何定价、城市如何建设、产品如何设计。个人责任固然重要，但当周围系统让更好的选择更容易时，它才最有效。' },
        { en: 'The longer we postpone that redesign, the fewer options remain. That is the real meaning of a deadline.', zh: '我们越晚开始这种重新设计，剩余的选择就越少。这才是“期限”的真正含义。' }
      ]
    },
    culture: {
      label: '文化议题',
      titles: ['The Stories We Inherit', 'Culture, Memory, and Change', 'Who Gets to Speak'],
      intro: [
        { en: 'Culture is not a fixed inheritance passed down intact from one generation to the next. It is a continuing argument about what should be remembered, what should be revised, and who has the authority to decide.', zh: '文化并非一代代原样传下的固定遗产。它是一场持续的争论：什么应当被记住，什么应当被修订，以及谁有权力作出决定。' },
        { en: 'The observations below explore how memory, expression, and power interact in that argument.', zh: '以下观察探讨记忆、表达与权力在这场争论中如何相互作用。' }
      ],
      leads: [
        { en: 'The first tension concerns preservation and change.', zh: '第一重紧张关系关乎保存与变化。' },
        { en: 'A second tension concerns who is heard and who is edited out.', zh: '第二重紧张关系关乎谁被听见、谁被删去。' },
        { en: 'A third tension concerns the difference between access and genuine participation.', zh: '第三重紧张关系，涉及“接触”与“真正参与”之间的差别。' }
      ],
      conclusion: [
        { en: 'A living culture does not protect itself by refusing to change. It protects itself by keeping the argument open — by allowing inherited forms to be questioned without pretending that nothing is at stake.', zh: '有生命力的文化不会靠拒绝变化来自保，而是靠保持争论的开放：允许既有的形式受到质疑，同时不假装一切都无所谓。' },
        { en: 'The alternative is not stability but silence, and silence is rarely neutral.', zh: '替代方案不是稳定，而是沉默；而沉默很少是中立的。' }
      ]
    },
    self: {
      label: '个人成长',
      titles: ['The Architecture of a Good Habit', 'Choosing a Life Among Many Options', 'The Long Work of Becoming Yourself'],
      intro: [
        { en: 'Personal change is often imagined as a single decisive moment. More often it is the slow accumulation of small choices, repeated until they become the background against which larger decisions are made.', zh: '人们常把个人改变想象成一个决定性的瞬间。它更常常是小选择的缓慢累积，反复到足以成为背景，支撑更大的决定。' },
        { en: 'The observations below consider how attention, habit, and social context shape the person one becomes.', zh: '以下观察思考注意力、习惯与社会环境如何塑造一个人最终成为的样子。' }
      ],
      leads: [
        { en: 'The first constraint is attention.', zh: '第一个约束是注意力。' },
        { en: 'A second constraint is the story one tells about failure.', zh: '第二个约束是人如何讲述失败。' },
        { en: 'A third constraint is the company one keeps.', zh: '第三个约束是身边交往的人。' }
      ],
      conclusion: [
        { en: 'None of this requires a dramatic reinvention. It requires a clearer view of what one actually does, rather than what one intends. Intention is cheap; repetition is expensive, and it is repetition that builds a life.', zh: '这一切都不需要戏剧性的自我重塑，而需要更清楚地看见自己实际做了什么，而非打算做什么。意图是廉价的，重复是昂贵的，而正是重复在建造一种生活。' },
        { en: 'The comfort, and the difficulty, is that the process is always unfinished.', zh: '令人安心也令人为难的是：这个过程永远不会完成。' }
      ]
    },
    syllabus: {
      label: '综合学术',
      titles: ['The Vocabulary of a Changing World', 'Learning to Think Across Boundaries', 'What Our Words Make Visible'],
      intro: [
        { en: 'The words we use do not simply label an already finished world. They draw attention to some distinctions and leave others in the background, and in doing so they shape what we are able to notice.', zh: '我们使用的词语并不只是给一个已经完成的世界贴标签。它们把注意力引向某些区分，同时让另一些退到背景里，由此塑造我们能够看见什么。' },
        { en: 'The observations below bring together terms from different fields. Read together, they suggest that clear thinking depends less on finding a single definition than on seeing how a word behaves in different contexts.', zh: '以下观察汇集了来自不同领域的词。放在一起读，它们说明：清晰的思考与其说取决于找到唯一定义，不如说取决于看见一个词在不同语境中如何运作。' }
      ],
      leads: [
        { en: 'The first pattern concerns the way language gives shape to experience.', zh: '第一种模式关乎语言如何赋予经验以形状。' },
        { en: 'A second pattern concerns the tension between individual judgment and collective systems.', zh: '第二种模式关乎个人判断与集体制度之间的张力。' },
        { en: 'A third pattern concerns the limits of any single perspective.', zh: '第三种模式关乎任何单一视角的局限。' }
      ],
      conclusion: [
        { en: 'None of these terms offers a complete picture on its own. Their value lies in the connections they make visible, and in the questions they allow us to ask more precisely.', zh: '这些词没有哪一个能单独提供完整的图景。它们的价值在于让某些联系变得可见，也在于让我们能把问题问得更精确。' },
        { en: 'That is a modest ambition, but it is the kind of ambition that survives contact with a complicated world.', zh: '这是一种谦逊的野心，却也是能够经受复杂世界考验的野心。' }
      ]
    }
  };

  const EN_CONNECTORS = [
    ['To begin with', 'More specifically', 'At the same time', 'In practical terms', 'More concretely'],
    ['Equally important', 'Beyond that', 'For example', 'In a different sphere', 'Seen from another angle'],
    ['Another dimension', 'In this respect', 'Equally revealing', 'At a practical level', 'Seen closely'],
    ['The pattern continues', 'Beyond this', 'A related point', 'In institutional terms', 'Looked at another way'],
    ['A further consideration', 'More broadly', 'At a deeper level', 'In social terms', 'Read together'],
    ['Finally', 'More fundamentally', 'At the deepest level', 'Taken together', 'In the end']
  ];
  const ZH_CONNECTORS = [
    ['首先，', '具体而言，', '与此同时，', '在实际层面，', '细看之下，'],
    ['同样重要的是，', '此外，', '再举一例，', '在另一个领域，', '换一个角度看，'],
    ['另一个维度是，', '在这方面，', '同样有启发性的是，', '在实际层面，', '细看之下，'],
    ['这一模式仍在延续，', '除此之外，', '一个相关的点是，', '在制度层面，', '换一种看法，'],
    ['还有一点值得考虑，', '更宽泛地说，', '在更深层面上，', '在社会层面，', '合起来看，'],
    ['最后，', '更根本地说，', '在最深层次上，', '综合来看，', '归根结底，']
  ];

  /* ---------------------------------------------------------- theme/filter nav */
  function renderThemeNav() {
    const wrap = $('#theme-nav');
    wrap.innerHTML = '<button data-theme-nav="all" class="is-active"><span class="dot"></span>全部词汇<span class="theme-count">' + TOTAL + '</span></button>';
  }

  function renderFilterChips() {
    const semanticWrap = $('#semantic-filter-chips');
    if (semanticWrap) {
      const allSemantic = '<button class="chip ' + (!state.semantic ? 'is-active' : '') + '" data-semantic-filter="all">全部</button>';
      semanticWrap.innerHTML = allSemantic + TOP_SEMANTIC_FILTERS.map(function (g) {
        return '<button class="chip ' + (state.semantic === g.id ? 'is-active' : '') + '" data-semantic-filter="' + g.id + '">' + escapeHtml(g.label) + '<span class="chip-count">' + g.words.length + '</span></button>';
      }).join('');
    }
  }

  /* ---------------------------------------------------------- library */
  function getFilteredWords() {
    const q = state.query.trim().toLowerCase();
    let list = WORDS.filter(function (w) {
      if (state.theme && w.theme !== state.theme) return false;
      if (state.affix && (w._morphKeys || []).indexOf(state.affix) === -1) return false;
      if (state.semantic) {
        const group = SEMANTIC_BY_ID.get(state.semantic);
        if (!group || group.words.indexOf(w) === -1) return false;
      }
      if (state.status === 'favorite' && !state.favorites.has(w.id)) return false;
      if (state.status === 'mastered' && !isMastered(w.id)) return false;
      if (state.status === 'new' && isMastered(w.id)) return false;
      if (q && w._search.indexOf(q) === -1 && (w._noteText || '').indexOf(q) === -1) return false;
      return true;
    });
    if (q) {
      const rank = function (w) {
        const word = w.word.toLowerCase();
        if (word === q) return 0;
        if (word.indexOf(q) === 0) return 1;
        if (word.indexOf(q) !== -1) return 2;
        return 3;
      };
      list.sort(function (a, b) {
        return rank(a) - rank(b) || b.freq - a.freq || a.word.localeCompare(b.word);
      });
      return list;
    }
    if (state.sort === 'alpha') list.sort(function (a, b) { return a.word.localeCompare(b.word); });
    else if (state.sort === 'affix') list.sort(function (a, b) {
      const ar = (a._rootGroups && a._rootGroups[0]) ? a._rootGroups[0].label : 'zzz';
      const br = (b._rootGroups && b._rootGroups[0]) ? b._rootGroups[0].label : 'zzz';
      return ar.localeCompare(br) || b.freq - a.freq;
    });
    else list.sort(function (a, b) { return b.freq - a.freq || a.word.localeCompare(b.word); });
    return list;
  }

  function freqBars(level) {
    let html = '<span class="freq" title="考频 ' + level + '/5">';
    for (let i = 1; i <= 5; i++) html += '<i class="' + (i <= level ? 'on' : '') + '"></i>';
    return html + '</span>';
  }

  function wordCard(w) {
    const isBasic = Boolean(w._syllabus || w._extra);
    const phonetic = w.phonetic || (isBasic ? '—' : '');
    const meaning = meaningWithPos(w);
    const note = getNote(w.id);
    const revealed = state.revealed.has(w.id);
    const shownMeaning = revealed
      ? escapeHtml(meaning)
      : '<span class="wc-hidden-cn">中文已隐藏 · 点击词条显示</span>';
    return '' +
      '<article class="word-card is-total' + (isBasic ? ' is-basic' : '') + (revealed ? ' is-revealed' : '') + '" data-word-id="' + w.id + '" tabindex="0" aria-expanded="' + (revealed ? 'true' : 'false') + '" aria-label="' + escapeHtml(w.word) + '，点击' + (revealed ? '隐藏' : '显示') + '中文释义">' +
        '<div class="wc-main">' +
          '<div class="wc-line">' +
            '<h3 class="wc-word">' + escapeHtml(w.word) + (note ? '<span class="wc-note-mark" title="有单词笔记" aria-label="有单词笔记">✎</span>' : '') + '</h3>' +
            (phonetic ? '<span class="wc-phonetic">' + escapeHtml(phonetic) + '</span>' : '') +
            '<button class="wc-sound" data-action="speak" data-word="' + escapeHtml(w.word) + '" title="朗读 ' + escapeHtml(w.word) + '" aria-label="朗读 ' + escapeHtml(w.word) + '">' +
              '<svg class="icon"><use href="#i-sound"></use></svg></button>' +
          '</div>' +
          '<div class="wc-meaning">' + shownMeaning + '</div>' +
        '</div>' +
        '<div class="wc-actions">' +
          '<button class="wc-add ' + (state.selected.has(w.id) ? 'is-on' : '') + '" data-action="add-selected" data-id="' + w.id + '" title="加入选词" aria-label="加入选词">' +
            '<svg class="icon"><use href="#i-plus"></use></svg></button>' +
          '<button class="wc-detail" data-action="open-detail" data-id="' + w.id + '" title="查看详情" aria-label="查看详情">' +
            '<svg class="icon"><use href="#i-chevron"></use></svg></button>' +
        '</div>' +
      '</article>';
  }

  function activeFilterHint(count) {
    const parts = [];
    if (state.query.trim()) parts.push('“' + state.query.trim() + '”');
    if (state.affix) {
      const g = MORPH_BY_KEY.get(state.affix);
      if (g) parts.push(g.label);
    }
    if (state.semantic) {
      const g = SEMANTIC_BY_ID.get(state.semantic);
      if (g) parts.push('近义：' + g.label);
    }
    if (state.theme) {
      const t = DATA.themes[state.theme];
      parts.push(t ? t.label : state.theme === 'syllabus' ? '大纲' : state.theme === 'extra' ? '增补' : state.theme);
    }
    if (state.status !== 'all') {
      parts.push(state.status === 'favorite' ? '收藏' : state.status === 'mastered' ? '已掌握' : '未掌握');
    }
    return parts.length ? parts.join(' · ') : '';
  }

  function renderLibrary() {
    const list = getFilteredWords();
    const total = list.length;
    const grid = $('#word-grid');
    grid.className = 'word-grid';
    grid.innerHTML = list.map(wordCard).join('');
    $('#result-count').textContent = total + ' 个词条';
    const hint = activeFilterHint();
    const hintEl = $('#result-hint');
    if (state.affix) {
      const group = ACTIVE_MORPH_BY_KEY.get(state.affix);
      hintEl.innerHTML = '构词：' + escapeHtml(group ? group.label : state.affix) +
        ' <button class="text-btn hint-clear" data-action="clear-morph">清除 <svg class="icon"><use href="#i-close"></use></svg></button>';
    } else {
      hintEl.textContent = hint ? hint : '点击词条显示中文，点箭头看详情';
    }
    $('#library-empty').hidden = total > 0;
    const loadMore = $('#load-more-wrap');
    if (loadMore) loadMore.hidden = true;

    const searchInput = $('#library-search');
    if (searchInput.value !== state.query) searchInput.value = state.query;
    $('#library-search-wrap').classList.toggle('has-value', Boolean(state.query));

    $$('#status-filter button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.status === state.status); });
    $$('.view-toggle button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.layout === state.layout); });
    $('#sort-select').value = state.sort;
    $$('#theme-nav button').forEach(function (b) {
      const key = b.dataset.themeNav;
      b.classList.toggle('is-active', key === 'all' ? !state.theme : state.theme === key);
    });
  }

  /* ---------------------------------------------------------- sprint */
  const FAST_SIZE = 7;
  let sprintOrderCacheSeed = null;
  let sprintOrderCache = null;
  let fastScrollTimer = null;

  function sprintOrderedWords() {
    const seed = state.sprintFast.seed;
    if (sprintOrderCacheSeed === seed && sprintOrderCache) return sprintOrderCache;
    sprintOrderCacheSeed = seed;
    sprintOrderCache = WORDS.slice().sort(function (a, b) {
      return hashString(a.id + '|' + seed) - hashString(b.id + '|' + seed) || a.word.localeCompare(b.word);
    });
    return sprintOrderCache;
  }
  function updateSprintMeta() {
    const total = WORDS.length;
    const revealed = state.sprintRevealed.size;
    if ($('#sprint-total')) $('#sprint-total').textContent = total;
    if ($('#sprint-revealed')) $('#sprint-revealed').textContent = revealed;
    if ($('#sprint-progress')) $('#sprint-progress').style.width = (total ? revealed / total * 100 : 0) + '%';
  }
  function sprintTile(w) {
    const revealed = state.sprintRevealed.has(w.id);
    return '<button class="sprint-tile' + (revealed ? ' is-revealed' : '') + '" data-sprint-id="' + w.id + '" aria-expanded="' + (revealed ? 'true' : 'false') + '">' +
      '<span class="sprint-word">' + escapeHtml(w.word) + '</span>' +
      (w.phonetic ? '<span class="sprint-phonetic">' + escapeHtml(w.phonetic) + '</span>' : '') +
      '<span class="sprint-meaning">' + (revealed ? escapeHtml(meaningWithPos(w)) : '') + '</span>' +
    '</button>';
  }
  function renderSprintBoard() {
    const grid = $('#sprint-grid');
    if (!grid) return;
    const list = WORDS.slice().sort(function (a, b) { return a.word.localeCompare(b.word); });
    grid.innerHTML = list.map(sprintTile).join('');
    state.sprintRendered = true;
    updateSprintMeta();
  }
  function toggleSprintTile(id, tile) {
    const w = BY_ID.get(id);
    if (!w || !tile) return;
    const shown = !state.sprintRevealed.has(id);
    if (shown) state.sprintRevealed.add(id); else state.sprintRevealed.delete(id);
    speak(w.word);
    tile.classList.toggle('is-revealed', shown);
    tile.setAttribute('aria-expanded', shown ? 'true' : 'false');
    const meaning = tile.querySelector('.sprint-meaning');
    if (meaning) meaning.textContent = shown ? meaningWithPos(w) : '';
    updateSprintMeta();
  }
  function setAllSprint(open) {
    const grid = $('#sprint-grid');
    if (!grid) return;
    if (open) WORDS.forEach(function (w) { state.sprintRevealed.add(w.id); });
    else state.sprintRevealed.clear();
    Array.prototype.forEach.call(grid.children, function (tile) {
      const id = tile.dataset.sprintId;
      const w = BY_ID.get(id);
      tile.classList.toggle('is-revealed', open);
      tile.setAttribute('aria-expanded', open ? 'true' : 'false');
      const meaning = tile.querySelector('.sprint-meaning');
      if (meaning) meaning.textContent = open && w ? meaningWithPos(w) : '';
    });
    updateSprintMeta();
  }

  function fastGroupWords() {
    const order = sprintOrderedWords();
    return order.slice(state.sprintFast.index, state.sprintFast.index + FAST_SIZE);
  }
  function fastSeenCount() {
    return Object.keys(state.sprintFast.seen).filter(function (id) { return BY_ID.has(id); }).length;
  }
  function markFastSeen(words) {
    let changed = false;
    words.forEach(function (w) {
      if (!state.sprintFast.seen[w.id]) { state.sprintFast.seen[w.id] = true; changed = true; }
    });
    if (changed) saveStore();
  }
  function fastRow(w, i) {
    const shown = Boolean(state.sprintFast.revealed[w.id]);
    return '<button class="fast-row' + (shown ? ' is-revealed' : '') + '" data-fast-id="' + w.id + '" aria-expanded="' + (shown ? 'true' : 'false') + '">' +
      '<span class="fast-index">' + (i + 1) + '</span>' +
      '<span class="fast-main"><span class="fast-word">' + escapeHtml(w.word) + '</span>' +
        (w.phonetic ? '<span class="fast-phonetic">' + escapeHtml(w.phonetic) + '</span>' : '') +
      '</span>' +
      '<span class="fast-reveal">' + (shown ? escapeHtml(meaningWithPos(w)) : '点击显示') + '</span>' +
      '<span class="fast-arrow"><svg class="icon"><use href="#i-chevron"></use></svg></span>' +
    '</button>';
  }
  function renderFast() {
    const list = $('#fast-list');
    if (!list) return;
    const words = fastGroupWords();
    markFastSeen(words);
    list.innerHTML = words.map(fastRow).join('');
    const total = WORDS.length;
    if ($('#fast-total')) $('#fast-total').textContent = total;
    if ($('#fast-group')) $('#fast-group').textContent = Math.floor(state.sprintFast.index / FAST_SIZE) + 1;
    if ($('#fast-range')) $('#fast-range').textContent = (state.sprintFast.index + 1) + '–' + Math.min(total, state.sprintFast.index + words.length);
  }
  function scrollFastTop() {
    const pane = $('#sprint-fast-pane');
    if (!pane) return;
    const top = pane.getBoundingClientRect().top + window.scrollY - 82;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }
  function toggleFastWord(id, tile) {
    const w = BY_ID.get(id);
    if (!w || !tile) return;
    const shown = !state.sprintFast.revealed[id];
    if (shown) state.sprintFast.revealed[id] = true; else delete state.sprintFast.revealed[id];
    state.sprintFast.seen[id] = true;
    speak(w.word);
    tile.classList.toggle('is-revealed', shown);
    tile.setAttribute('aria-expanded', shown ? 'true' : 'false');
    const reveal = tile.querySelector('.fast-reveal');
    if (reveal) reveal.textContent = shown ? meaningWithPos(w) : '点击显示';
    saveStore();
  }
  function fastAdvance(delta) {
    const total = WORDS.length;
    let index = state.sprintFast.index + delta * FAST_SIZE;
    if (index >= total) {
      index = 0;
      state.sprintFast.round += 1;
    } else if (index < 0) {
      index = Math.floor((total - 1) / FAST_SIZE) * FAST_SIZE;
    }
    state.sprintFast.index = index;
    state.sprintFast.summary = false;
  }
  function fastNext() {
    fastAdvance(1);
    saveStore();
    renderSprint();
    scrollFastTop();
  }
  function fastPrev() {
    fastAdvance(-1);
    saveStore();
    renderSprint();
    scrollFastTop();
  }
  function fastSummary() {
    if (!state.sprintFast.summary) {
      state.sprintFast.elapsedMs += Math.max(0, Date.now() - state.sprintFast.resumedAt);
      state.sprintFast.summary = true;
    }
    saveStore();
    renderSprint();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function fastContinue() {
    state.sprintFast.summary = false;
    state.sprintFast.resumedAt = Date.now();
    fastAdvance(1);
    saveStore();
    renderSprint();
    scrollFastTop();
  }
  function fastCheckin() {
    const count = fastSeenCount();
    if (state.sprintFast.checkedIn) { toast('今日已打卡'); return; }
    if (count < 30) { toast('再刷 ' + (30 - count) + ' 个单词即可打卡'); return; }
    state.sprintLog[todayKey()] = { count: count, at: new Date().toISOString() };
    state.sprintFast.checkedIn = true;
    saveStore();
    renderSprint();
    toast('打卡成功 · 本次刷词 ' + count + ' 个');
  }
  function renderFastSummary() {
    const count = fastSeenCount();
    const minutes = Math.floor(state.sprintFast.elapsedMs / 60000);
    if ($('#summary-date')) $('#summary-date').textContent = state.sprintFast.date.split('-').join('.');
    if ($('#summary-count')) $('#summary-count').textContent = count;
    if ($('#summary-minutes')) $('#summary-minutes').textContent = minutes;
    if ($('#summary-round')) $('#summary-round').textContent = state.sprintFast.round;
    const ids = Object.keys(state.sprintFast.seen).filter(function (id) { return BY_ID.has(id); });
    const shown = ids.slice(0, 80);
    const list = $('#summary-list');
    if (list) {
      list.innerHTML = shown.map(function (id, i) {
        const w = BY_ID.get(id);
        return '<div class="summary-word" data-summary-id="' + id + '" role="button" tabindex="0">' +
          '<span class="summary-word-index">' + (i + 1) + '</span>' +
          '<strong>' + escapeHtml(w.word) + '</strong>' +
          '<em>' + escapeHtml(meaningWithPos(w)) + '</em>' +
        '</div>';
      }).join('') + (ids.length > 80 ? '<div class="summary-word"><span class="summary-word-index">…</span><strong>还有 ' + (ids.length - 80) + ' 个</strong><em>继续刷词后会在下一次小结中更新</em></div>' : '');
    }
    const btn = $('#fast-checkin-btn');
    const note = $('#fast-checkin-note');
    if (btn) {
      btn.disabled = count < 30 || state.sprintFast.checkedIn;
      btn.textContent = state.sprintFast.checkedIn ? '已打卡' : '打卡';
    }
    if (note) {
      note.classList.toggle('is-ok', state.sprintFast.checkedIn || count >= 30);
      if (state.sprintFast.checkedIn) note.textContent = '今日刷词打卡已完成 · 本次 ' + count + ' 个';
      else if (count >= 30) note.textContent = '已刷 ' + count + ' 个，可以打卡';
      else note.textContent = '再刷 ' + (30 - count) + ' 个单词即可打卡';
    }
  }
  function renderSprint() {
    const fast = state.sprintMode === 'fast';
    const summary = fast && state.sprintFast.summary;
    const modebar = document.querySelector('#view-sprint .sprint-modebar');
    const head = document.querySelector('#view-sprint .sprint-head');
    const board = $('#sprint-board-pane');
    const meter = $('#sprint-meter');
    const fastPane = $('#sprint-fast-pane');
    const summaryPane = $('#sprint-summary');
    $$('.sprint-mode').forEach(function (b) { b.classList.toggle('is-active', b.dataset.sprintMode === state.sprintMode); });
    const sprintView = $('#view-sprint');
    if (sprintView) sprintView.classList.toggle('is-fast', fast && !summary);
    if (modebar) modebar.hidden = summary;
    if (head) head.hidden = summary;
    if (board) board.hidden = fast;
    if (meter) meter.hidden = fast;
    if (fastPane) fastPane.hidden = !fast || summary;
    if (summaryPane) summaryPane.hidden = !summary;
    if (!fast) {
      if ($('#sprint-title')) $('#sprint-title').innerHTML = '一眼扫过，<br>连续点开。';
      if ($('#sprint-desc')) $('#sprint-desc').textContent = '全部 ' + TOTAL + ' 个词浓缩在一张刷词板上，不翻页。点一下看中文，再点一下收起，适合快速过词。';
      if (!state.sprintRendered) renderSprintBoard();
      return;
    }
    if ($('#sprint-title')) $('#sprint-title').innerHTML = '七词一组，<br>连续过词。';
    if ($('#sprint-desc')) $('#sprint-desc').textContent = '每次只过 7 个词。先看英文回忆，再点“点击显示”核对中文；上一组、下一组自由切换，位置自动保存。';
    if (summary) { renderFastSummary(); return; }
    renderFast();
  }
  function setSprintMode(mode) {
    if (mode !== 'board' && mode !== 'fast') return;
    state.sprintMode = mode;
    if (mode === 'fast' && !state.sprintFast.summary) state.sprintFast.resumedAt = Date.now();
    saveStore();
    renderSprint();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function openSummaryWord(id) {
    if (BY_ID.has(id)) openWord(id);
  }

  /* ---------------------------------------------------------- stats */
  function renderStats() {
    const mc = masteredCount();
    const pct = Math.round(mc / TOTAL * 100);
    $('#nav-word-count').textContent = TOTAL;
    if ($('#nav-sprint-count')) $('#nav-sprint-count').textContent = TOTAL;
    $('#nav-selected-count').textContent = state.selected.size;
    $('#nav-saved-count').textContent = state.favorites.size;
    $('#mastery-pct').textContent = pct + '%';
    $('#mastery-bar').style.width = pct + '%';
    $('#mastered-count').textContent = mc;
    $('#total-count').textContent = TOTAL;
    if ($('#today-count') && state.daily) {
      $('#today-count').textContent = state.daily.ids.filter(function (id) { return Boolean(state.daily.done[id]); }).length;
      if ($('#today-goal')) $('#today-goal').textContent = state.daily.ids.length;
    }
    $('#hero-total').textContent = TOTAL;
    $('#hero-affix').textContent = ACTIVE_MORPH.length;
    $('#hero-syn').textContent = ACTIVE_SEMANTIC.length;
    if ($('#library-words-count')) $('#library-words-count').textContent = TOTAL;
    if ($('#library-morph-count')) $('#library-morph-count').textContent = ACTIVE_MORPH.length;
    if ($('#morph-total-count')) $('#morph-total-count').textContent = ACTIVE_MORPH.length;
    $('#saved-fav-count').textContent = state.favorites.size;
    $('#saved-mastered-count').textContent = mc;
    $('#saved-note-count').textContent = noteCount();
    $('#saved-article-count').textContent = state.history.length;
    $('#tab-fav-count').textContent = state.favorites.size;
    $('#tab-mastered-count').textContent = mc;
    $('#tab-note-count').textContent = noteCount();
    $('#tab-article-count').textContent = state.history.length;
  }

  /* ---------------------------------------------------------- affixes */
  function renderAffixes() {
    const type = state.affixTab;
    $$('#affix-tabs button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.affixType === type); });
    $('#prefix-tab-count').textContent = PREFIX_GROUPS.length;
    $('#suffix-tab-count').textContent = SUFFIX_GROUPS.length;
    $('#root-tab-count').textContent = ROOT_GROUPS.length;

    const items = type === 'root' ? ROOT_GROUPS : type === 'suffix' ? SUFFIX_GROUPS : PREFIX_GROUPS;
    if ($('#morph-total-count')) $('#morph-total-count').textContent = ACTIVE_MORPH.length;
    if (state.libraryMode !== 'morph') return;
    if (state.morphDetailKey) renderMorphDetail(state.morphDetailKey);

    $('#affix-grid').innerHTML = items.map(function (item) {
      const kind = item.type === 'prefix' ? 'PREFIX' : item.type === 'suffix' ? 'SUFFIX' : 'ROOT';
      return '' +
        '<article class="affix-card" data-morph-key="' + item.key + '" tabindex="0">' +
          '<div class="affix-card-top">' +
            '<span class="affix-label">' + escapeHtml(item.label) + '</span>' +
            '<span class="affix-kind">' + kind + '</span>' +
          '</div>' +
          '<p class="affix-meaning">' + escapeHtml(item.meaning || '构词成分') + '</p>' +
          '<p class="affix-note">' + escapeHtml(item.note || '') + '</p>' +
          '<div class="affix-examples">' + (item.examples || []).slice(0, 4).map(function (w) { return '<span>' + escapeHtml(w) + '</span>'; }).join('') + '</div>' +
          '<span class="affix-count">' + item.count + ' 个词</span>' +
          '<svg class="icon affix-arrow"><use href="#i-arrow"></use></svg>' +
        '</article>';
    }).join('');
  }

  function morphKindLabel(type) {
    return type === 'prefix' ? 'PREFIX · 前缀' : type === 'suffix' ? 'SUFFIX · 后缀' : 'ROOT · 词根';
  }

  function renderMorphDetail(key) {
    const box = $('#morph-detail');
    const grid = $('#affix-grid');
    if (!box) return;
    const g = ACTIVE_MORPH_BY_KEY.get(key);
    if (!g) {
      box.hidden = true;
      box.innerHTML = '';
      state.morphDetailKey = null;
      if (grid) grid.hidden = false;
      return;
    }
    state.morphDetailKey = key;
    const words = g.words.slice().sort(function (a, b) { return a.word.localeCompare(b.word); });
    box.hidden = false;
    if (grid) grid.hidden = true;
    box.innerHTML = '' +
      '<div class="morph-detail-head">' +
        '<div><span class="morph-detail-kind">' + morphKindLabel(g.type) + '</span>' +
          '<h4>' + escapeHtml(g.label) + '</h4>' +
          '<p>' + escapeHtml(g.meaning || '构词成分') + '</p></div>' +
        '<div class="morph-detail-actions"><span class="morph-detail-count">' + g.count + ' 个词</span>' +
          '<button class="icon-btn" data-action="close-morph-detail" aria-label="收起构词解释"><svg class="icon"><use href="#i-close"></use></svg></button></div>' +
      '</div>' +
      (g.note ? '<p class="morph-detail-note">' + escapeHtml(g.note) + '</p>' : '') +
      '<div class="morph-detail-sub"><span>词库中的同族词</span><button class="text-btn" data-action="filter-morph" data-morph-key="' + g.key + '">在词库中筛出这些词 <svg class="icon"><use href="#i-arrow"></use></svg></button></div>' +
      '<div class="morph-word-chips">' + words.map(function (w) {
        return '<button class="morph-word-chip" data-word-link="' + w.id + '"><b>' + escapeHtml(w.word) + '</b><span>' + escapeHtml(w.pos || '') + '</span><em>' + escapeHtml(w.meaning || '') + '</em></button>';
      }).join('') + '</div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setLibraryMode(mode) {
    state.libraryMode = mode === 'morph' ? 'morph' : 'words';
    if (mode === 'morph') state.morphDetailKey = null;
    const wordsPane = $('#library-words-pane');
    const morphPane = $('#library-morph-pane');
    if (wordsPane) wordsPane.hidden = state.libraryMode !== 'words';
    if (morphPane) morphPane.hidden = state.libraryMode !== 'morph';
    $$('.library-mode-switch button').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.libraryMode === state.libraryMode);
    });
    if (state.libraryMode === 'morph') renderAffixes();
    else renderLibrary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function filterByMorph(key) {
    state.affix = key;
    state.theme = null;
    state.semantic = null;
    state.query = '';
    state.libraryMode = 'words';
    const wordsPane = $('#library-words-pane');
    const morphPane = $('#library-morph-pane');
    if (wordsPane) wordsPane.hidden = false;
    if (morphPane) morphPane.hidden = true;
    $$('.library-mode-switch button').forEach(function (b) {
      b.classList.toggle('is-active', b.dataset.libraryMode === 'words');
    });
    renderLibrary();
    const target = $('#word-grid');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------------------------------------------------- drawer */
  function renderDrawer() {
    const w = BY_ID.get(state.currentWord);
    if (!w) return;
    const isBasic = Boolean(w._syllabus || w._extra);
    const selected = state.selected.has(w.id);
    const fav = state.favorites.has(w.id);
    const mastered = isMastered(w.id);
    const morph = (w.morph || []).map(function (m) {
      return '<span class="morph-part"><b>' + escapeHtml(m.text) + '</b><span>' + escapeHtml(m.gloss) + '</span></span>';
    }).join('<span class="morph-plus">+</span>');

    const synonyms = (w.synonyms || []).map(function (s) {
      return '<div class="rel-item"><span class="rel-word">' + escapeHtml(s.word) + '</span><p>' + escapeHtml(s.note) + '</p></div>';
    }).join('');

    const confusables = (w.confusables || []).map(function (c) {
      const linked = BY_ID.has(c.word);
      return '<div class="rel-item"><span class="rel-word ' + (linked ? 'link' : '') + '" ' + (linked ? 'data-word-link="' + c.word + '"' : '') + '>' + escapeHtml(c.word) + '</span><p>' + escapeHtml(c.note) + '</p></div>';
    }).join('');

    const affixTags = (w._affixGroups || []).slice(0, 6).map(function (g) {
      return '<span class="mini-tag">' + escapeHtml(g.label) + ' · ' + escapeHtml(g.meaning || '构词成分') + '</span>';
    }).join('');
    const rootTags = (w._rootGroups || []).slice(0, 4).map(function (g) {
      return '<span class="mini-tag root">' + escapeHtml(g.label) + ' · ' + escapeHtml(g.meaning || '词根') + '</span>';
    }).join('');
    const semanticBlocks = (w._semanticGroups || []).slice(0, 4).map(function (g) {
      return '<div class="semantic-block"><div class="semantic-head"><b>' + escapeHtml(g.label) + '</b><span>' + escapeHtml(g.note || '近义语义') + '</span></div>' +
        '<div class="colloc-list">' + g.words.slice(0, 12).map(function (sw) {
          return '<span class="' + (sw.id === w.id ? 'semantic-self' : 'link') + '" data-word-link="' + escapeHtml(sw.word) + '">' + escapeHtml(sw.word) + '</span>';
        }).join('') + '</div></div>';
    }).join('');
    const hasMorph = Boolean(morph || w.rootNote || affixTags || rootTags);
    const hasRelations = Boolean(synonyms || confusables);

    const note = getNote(w.id);
    const editingNote = state.noteEditing === w.id;
    let noteBody = '';
    if (editingNote) {
      const draft = note ? note.text : '';
      noteBody = '<div class="note-editor">' +
        '<textarea id="note-input" maxlength="1200" placeholder="记下辨析、搭配、例句或你自己的记忆线索……">' + escapeHtml(draft) + '</textarea>' +
        '<div class="note-edit-foot"><span id="note-count">' + draft.length + ' / 1200</span>' +
          '<div class="note-edit-actions">' +
            '<button class="btn btn-ghost note-cancel" data-action="cancel-note">取消</button>' +
            '<button class="btn btn-primary note-save" data-action="save-note" data-id="' + w.id + '">保存笔记</button>' +
          '</div>' +
        '</div>' +
        '<p class="note-shortcut">Ctrl / ⌘ + Enter 保存 · Esc 取消</p>' +
      '</div>';
    } else if (note) {
      noteBody = '<div class="note-card">' +
        '<p class="note-text">' + escapeHtml(note.text).replace(/\n/g, '<br>') + '</p>' +
        '<div class="note-meta"><span>' + escapeHtml(noteTimestamp(note)) + '</span>' +
          '<span class="note-tools"><button class="text-btn" data-action="edit-note" data-id="' + w.id + '">编辑</button>' +
          '<button class="text-btn note-delete" data-action="delete-note" data-id="' + w.id + '">删除</button></span>' +
        '</div>' +
      '</div>';
    } else {
      noteBody = '<button class="note-empty" data-action="edit-note" data-id="' + w.id + '">' +
        '<span class="note-empty-mark">✎</span>' +
        '<span><b>给这个词写一条笔记</b><small>辨析、搭配、例句，或只属于你的记忆线索</small></span>' +
        '<span class="note-empty-arrow">→</span>' +
      '</button>';
    }
    const noteSection = '<section class="d-section note-section"><div class="d-label">我的笔记' +
      (note ? '<span class="note-count">已记录</span>' : '') + '</div>' + noteBody + '</section>';

    const rootFamilies = (w._rootGroups || []).filter(function (g) { return g.words.length >= 2; })
      .sort(function (a, b) { return b.words.length - a.words.length; })
      .slice(0, 2).map(function (g) {
        return '<div class="root-family"><div class="root-family-head"><b>' + escapeHtml(g.label) + '</b>' +
          '<span>' + escapeHtml(g.meaning || '词根') + '</span><em>' + g.words.length + ' 词</em></div>' +
          '<div class="root-family-words">' + g.words.slice(0, 8).map(function (sw) {
            return '<span class="' + (sw.id === w.id ? 'semantic-self' : 'link') + '" data-word-link="' + escapeHtml(sw.word) + '">' + escapeHtml(sw.word) + '</span>';
          }).join('') + '</div></div>';
      }).join('');

    const pager = '<div class="drawer-pager">' +
      '<button class="icon-btn" data-action="prev-word" title="上一个词" aria-label="上一个词"><svg class="icon prev"><use href="#i-chevron"></use></svg></button>' +
      '<button class="icon-btn" data-action="next-word" title="下一个词" aria-label="下一个词"><svg class="icon"><use href="#i-chevron"></use></svg></button>' +
    '</div>';

    const sections = [];
    sections.push(noteSection);
    if (w.en) {
      sections.push('<section class="d-section"><div class="d-label">ENGLISH DEFINITION</div><p class="d-def">' + escapeHtml(w.en) + '</p></section>');
    }
    if (hasMorph) {
      sections.push('<section class="d-section"><div class="d-label">构词拆解</div>' +
        (morph ? '<div class="morph-line">' + morph + '</div>' : '') +
        (w.rootNote ? '<p class="root-note">' + escapeHtml(w.rootNote) + '</p>' : '') +
        ((affixTags || rootTags) ? '<div class="colloc-list" style="margin-top:9px">' + affixTags + rootTags + '</div>' : '') +
      '</section>');
    }
    if (rootFamilies) {
      sections.push('<section class="d-section"><div class="d-label">智慧词根</div>' + rootFamilies + '</section>');
    }
    if (w.example) {
      sections.push('<section class="d-section"><div class="d-label">语境例句</div>' +
        '<div class="example-block"><p>' + linkArticleText(w.example, [w], 'example') + '</p><p class="ex-zh">' + escapeHtml(w.exampleZh) + '</p></div>' +
      '</section>');
    }
    if (semanticBlocks) {
      sections.push('<section class="d-section"><div class="d-label">近义标签</div>' + semanticBlocks + '</section>');
    }
    if ((w.collocations || []).length) {
      sections.push('<section class="d-section"><div class="d-label">常见搭配</div><div class="colloc-list">' + w.collocations.map(function (c) { return '<span>' + escapeHtml(c) + '</span>'; }).join('') + '</div></section>');
    }
    if (hasRelations) {
      sections.push('<section class="d-section"><div class="d-label">同义词辨析</div><div class="rel-list">' + (synonyms || '<p class="d-def">暂无同义辨析。</p>') + '</div></section>');
      sections.push('<section class="d-section"><div class="d-label">形近易混</div><div class="rel-list">' + (confusables || '<p class="d-def">暂无容易混淆的词。</p>') + '</div></section>');
    }
    if (isBasic) {
      sections.push('<section class="d-section"><div class="d-label">词条说明</div><p class="d-note">这个词来自' + (w._extra ? '增补' : '大纲') + '词库，目前提供词性与核心释义；词根词缀与近义标签由全库词形和语义自动匹配。</p></section>');
    }

    $('#drawer-inner').innerHTML = '' +
      '<div class="drawer-head">' +
        pager +
        '<button class="drawer-close icon-btn" data-action="close-drawer" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button>' +
        '<div class="drawer-kicker"><span>' + themeEnglish(w) + '</span></div>' +
        '<h2 class="drawer-word">' + escapeHtml(w.word) + '</h2>' +
        '<div class="drawer-pron"><span>' + (w.phonetic ? escapeHtml(w.phonetic) : '基础词') + '</span><button data-action="speak" data-word="' + escapeHtml(w.word) + '" aria-label="朗读"><svg class="icon"><use href="#i-sound"></use></svg></button></div>' +
        '<div class="drawer-meaning">' + escapeHtml(meaningWithPos(w)) + '<span>' + (isBasic ? themeLabel(w) + ' · 基础释义' : themeLabel(w) + ' · 考频 ' + w.freq + '/5') + '</span></div>' +
      '</div>' +
      '<div class="drawer-body">' + sections.join('') + '</div>' +
      '<div class="drawer-actions">' +
        '<button class="btn btn-ghost btn-icon-only ' + (fav ? 'is-on' : '') + '" data-action="toggle-fav" data-id="' + w.id + '" title="收藏" aria-label="收藏"><svg class="icon"><use href="#i-bookmark"></use></svg></button>' +
        '<button class="btn btn-ghost btn-icon-only ' + (mastered ? 'is-on' : '') + '" data-action="toggle-mastered" data-id="' + w.id + '" title="已掌握" aria-label="已掌握"><svg class="icon"><use href="#i-check"></use></svg></button>' +
        '<button class="btn ' + (selected ? 'btn-ghost' : 'btn-primary') + '" data-action="' + (selected ? 'remove-selected' : 'add-selected') + '" data-id="' + w.id + '">' +
          (selected ? '移出选词' : '加入选词') +
        '</button>' +
      '</div>';
  }

  function openWord(id) {
    if (!BY_ID.has(id)) return;
    if (state.currentWord !== id) state.noteEditing = null;
    state.currentWord = id;
    state.drawerReturnFocus = document.activeElement;
    renderDrawer();
    document.body.classList.add('drawer-open');
    $('#word-drawer').setAttribute('aria-hidden', 'false');
    $('#word-drawer').scrollTop = 0;
    setTimeout(function () { const close = $('.drawer-close'); if (close) close.focus(); }, 40);
  }
  function closeDrawer() {
    document.body.classList.remove('drawer-open');
    $('#word-drawer').setAttribute('aria-hidden', 'true');
    if (state.drawerReturnFocus && state.drawerReturnFocus.focus) state.drawerReturnFocus.focus();
    state.currentWord = null;
    state.noteEditing = null;
  }

  /* ---------------------------------------------------------- composer */
  function renderComposer() {
    $('#selected-count').textContent = state.selected.size;
    $('#generate-count').textContent = state.selected.size + ' 词';
    $('#generate-btn').disabled = state.selected.size < MIN_SELECTED;
    $('#nav-selected-count').textContent = state.selected.size;

    const chips = $('#selected-chips');
    const selectedWords = Array.from(state.selected).map(function (id) { return BY_ID.get(id); }).filter(Boolean);
    if (!selectedWords.length) {
      chips.innerHTML = '<p class="selected-empty">还没有选词。可在全词库搜索添加，或点击“智能补足 10 词”快速开始。</p>';
    } else {
      chips.innerHTML = selectedWords.map(function (w) {
        return '<span class="selected-chip">' + escapeHtml(w.word) + '<button data-action="remove-selected" data-id="' + w.id + '" aria-label="移除 ' + escapeHtml(w.word) + '">×</button></span>';
      }).join('');
    }

    $$('#length-picker button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.length === state.length); });
    const notes = {
      short: '短篇从 2 段起；选词超过 10 个时自动扩段，所有目标词都会进入文章。',
      standard: '标准篇从 2 段起；每段最多 5 个目标词，选词越多，段落自动增加。',
      long: '长文在标准结构上增加收束段；所有目标词都会保留。'
    };
    $('#length-note').textContent = notes[state.length] || notes.standard;

    renderSelectedChipsMeta();
  }

  function renderSelectedChipsMeta() {
    $('#selected-count').textContent = state.selected.size;
    $('#generate-count').textContent = state.selected.size + ' 词';
    $('#generate-btn').disabled = state.selected.size < MIN_SELECTED;
    $('#nav-selected-count').textContent = state.selected.size;
  }

  function renderSuggestions() {
    const wrap = $('#composer-suggestions');
    const input = $('#composer-search');
    const q = input.value.trim().toLowerCase();
    let list = WORDS.filter(function (w) { return !state.selected.has(w.id); });
    if (q) {
      list = list.filter(function (w) { return w._search.indexOf(q) !== -1; });
      // 精确词形优先，其次词头匹配；避免搜 assumption 时同义词 prejudice 排在前面。
      list.sort(function (a, b) {
        const aw = a.word.toLowerCase();
        const bw = b.word.toLowerCase();
        const rank = function (word) {
          if (word === q) return 0;
          if (word.indexOf(q) === 0) return 1;
          return 2;
        };
        return rank(aw) - rank(bw) || b.freq - a.freq || a.word.localeCompare(b.word);
      });
    } else {
      // 不按文章主题给选词加权：全词库统一按考频与字母序展示。
      list.sort(function (a, b) { return b.freq - a.freq || a.word.localeCompare(b.word); });
    }
    list = list.slice(0, q ? 8 : 7);
    if (!list.length) {
      wrap.innerHTML = '<div class="suggestion-empty">没有可添加的词，换个关键词试试。</div>';
      wrap.classList.add('is-open');
      return;
    }
    wrap.innerHTML = list.map(function (w) {
      return '<button class="suggestion-item" data-action="add-selected" data-id="' + w.id + '">' +
        '<strong>' + escapeHtml(w.word) + '</strong>' +
        '<span>' + escapeHtml(meaningWithPos(w)) + '</span>' +
        '<em>' + escapeHtml(themeLabel(w)) + '</em>' +
      '</button>';
    }).join('');
    wrap.classList.add('is-open');
  }

  function addSelected(id) {
    if (!BY_ID.has(id)) return;
    if (state.selected.has(id)) { toast('这个词已经在选词里了'); return; }
    if (state.selected.size >= MAX_SELECTED) { toast('最多选择 ' + MAX_SELECTED + ' 个词'); return; }
    state.selected.add(id);
    saveStore();
    renderComposer();
    renderSuggestions();
    if (state.currentWord === id) renderDrawer();
    toast('已加入选词（' + state.selected.size + '）');
  }
  function removeSelected(id) {
    if (!state.selected.has(id)) return;
    state.selected.delete(id);
    saveStore();
    renderComposer();
    renderSuggestions();
    if (state.currentWord === id) renderDrawer();
  }
  function clearSelection() {
    if (!state.selected.size) return;
    state.selected.clear();
    saveStore();
    renderComposer();
    renderSuggestions();
    toast('已清空选词');
  }
  function autoSelect() {
    if (state.selected.size >= 10) { toast('已经选够 10 个词了'); return; }
    // 从全词库按考频补足，不按文章主题或词库标签偏置。
    const pool = WORDS.filter(function (w) { return !state.selected.has(w.id); }).sort(function (a, b) {
      return b.freq - a.freq || a.word.localeCompare(b.word);
    });
    for (let i = 0; i < pool.length && state.selected.size < 10; i++) state.selected.add(pool[i].id);
    saveStore();
    renderComposer();
    renderSuggestions();
    toast('已补足到 ' + state.selected.size + ' 个词');
  }

  /* ---------------------------------------------------------- article generation */
  function dominantTheme(words) {
    const counts = {};
    words.forEach(function (w) { counts[w.theme] = (counts[w.theme] || 0) + 1; });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; })[0] || 'society';
  }

  function exampleSentence(w, index) {
    if (w.example) return w.example;
    const word = w.word;
    const pos = String(w.pos || '').toLowerCase().replace(/[^a-z]/g, '');
    const quoteFrames = [
      'the word "' + word + '" does its quiet work beneath the surface of the sentence',
      'a closer look at "' + word + '" reveals how much depends on context',
      '"' + word + '" is easy to overlook, yet it shapes the relations between ideas'
    ];
    if (/^(be|am|is|are|was|were|been|being|have|has|had|do|does|did|can|could|may|might|must|shall|should|will|would|the|a|an|and|or|but|if|of|to|in|on|at|by|for|with|from|as|that|this|these|those)$/.test(word.toLowerCase())) {
      return quoteFrames[index % quoteFrames.length];
    }
    if (pos.indexOf('n') === 0 && pos.indexOf('num') !== 0) {
      const frames = [
        'the question of ' + word + ' is rarely settled by definition alone',
        word + ' becomes more visible when examined through ordinary experience',
        'the meaning of ' + word + ' depends on the company it keeps',
        'few ideas are as easily taken for granted as ' + word,
        'any discussion of ' + word + ' eventually returns to the same tension'
      ];
      return frames[index % frames.length];
    }
    if (/^v/.test(pos)) {
      const frames = [
        'to ' + word + ' is one thing; to understand why it matters is another',
        'the decision to ' + word + ' is never entirely neutral',
        'what it means to ' + word + ' changes with context',
        word + ' is an action whose consequences are easy to overlook',
        'the willingness to ' + word + ' depends on what one expects in return'
      ];
      return frames[index % frames.length];
    }
    if (/^ad/.test(pos) || pos.indexOf('adv') === 0) {
      const adverbFrames = [
        'the word "' + word + '" shifts the emphasis rather than the subject',
        'what "' + word + '" adds is a matter of degree, not direction',
        'the argument turns on "' + word + '" more than it first appears'
      ];
      return adverbFrames[index % adverbFrames.length];
    }
    if (pos === 'a' || pos.indexOf('adj') === 0) {
      const frames = [
        'what looks ' + word + ' from one angle may look different from another',
        word + ' is a judgment as much as a description',
        'the question of what counts as ' + word + ' is never purely technical',
        'few qualities are more context-dependent than ' + word,
        'to call something ' + word + ' is already to make a claim'
      ];
      return frames[index % frames.length];
    }
    return quoteFrames[index % quoteFrames.length];
  }

  function exampleSentenceZh(w) {
    if (w.exampleZh) return w.exampleZh;
    const gloss = String(w.meaning || '').replace(/[。；;]\s*$/, '');
    return '“' + w.word + '”在这里表示“' + gloss + '”。';
  }
  function closeSentence(text) {
    const s = String(text).trim();
    return /[.!?]$/.test(s) ? s : s + '.';
  }
  function closeSentenceZh(text) {
    const s = String(text).trim();
    return /[。！？]$/.test(s) ? s : s + '。';
  }

  const EXTRA_LEADS = [
    { en: 'A related tension runs through the examples.', zh: '这些例子中贯穿着一种相关的张力。' },
    { en: 'The same question returns here in a different form.', zh: '同一个问题在这里以不同的形式再次出现。' },
    { en: 'Taken together, these observations point to a larger question.', zh: '综合来看，这些观察指向一个更大的问题。' }
  ];

  function paragraphLead(pack, ci, total) {
    if (ci < pack.leads.length) return pack.leads[ci];
    if (ci === total - 1) return EXTRA_LEADS[EXTRA_LEADS.length - 1];
    return EXTRA_LEADS[(ci - pack.leads.length) % (EXTRA_LEADS.length - 1)];
  }

  function buildArticle(words, themeKey, length) {
    let theme = PACKS[themeKey] ? themeKey : dominantTheme(words);
    if (!PACKS[theme]) theme = 'syllabus';
    const pack = PACKS[theme];
    // 所有选中的词都必须进入文章；篇幅只调整段落结构与引语数量。
    const bodyWords = words.slice();

    // 同一主题的词放在一起，读起来更像一篇文章，而不是随机词表。
    bodyWords.sort(function (a, b) {
      const ap = a.theme === theme ? 0 : 1;
      const bp = b.theme === theme ? 0 : 1;
      return ap - bp || b.freq - a.freq || a.word.localeCompare(b.word);
    });

    const introCount = length === 'short' ? 1 : 2;
    const conclusionCount = length === 'short' ? 1 : 2;
    const intro = pack.intro.slice(0, introCount);
    const conclusion = pack.conclusion.slice(0, conclusionCount);

    let chunkCount = bodyWords.length <= 4 ? 1 : length === 'short' ? (bodyWords.length > 7 ? 2 : 1) : length === 'long' ? 3 : 2;
    // 每段最多 5 句，避免连接词在同一段里重复。
    chunkCount = Math.max(chunkCount, Math.ceil(bodyWords.length / 5));
    chunkCount = Math.min(chunkCount, bodyWords.length);
    const chunks = splitBalanced(bodyWords, chunkCount);

    const paragraphs = [];
    paragraphs.push({
      en: intro.map(function (x) { return x.en; }).join(' '),
      zh: intro.map(function (x) { return x.zh; }).join(''),
      sentences: intro.map(function (x) { return { en: x.en, zh: x.zh }; }),
      lead: true
    });

    chunks.forEach(function (chunk, ci) {
      const lead = paragraphLead(pack, ci, chunks.length);
      // 首段用第一组，末段用收束组，中间段落按顺序取，避免六段文章反复说 Finally。
      const setIndex = chunks.length === 1 ? 0 : ci === chunks.length - 1 ? 5 : Math.min(ci, 4);
      const enSet = EN_CONNECTORS[setIndex];
      const zhSet = ZH_CONNECTORS[setIndex];
      const sentences = chunk.map(function (w, i) {
        return enSet[i % enSet.length] + ', ' + closeSentence(lowerFirst(exampleSentence(w, i)));
      });
      const zhSentences = chunk.map(function (w, i) {
        return zhSet[i % zhSet.length] + closeSentenceZh(exampleSentenceZh(w));
      });
      paragraphs.push({
        en: lead.en + ' ' + sentences.join(' '),
        zh: lead.zh + zhSentences.join(''),
        sentences: [{ en: lead.en, zh: lead.zh }].concat(sentences.map(function (sentence, i) {
          return { en: sentence, zh: zhSentences[i] };
        })),
        lead: false
      });
    });

    paragraphs.push({
      en: conclusion.map(function (x) { return x.en; }).join(' '),
      zh: conclusion.map(function (x) { return x.zh; }).join(''),
      sentences: conclusion.map(function (x) { return { en: x.en, zh: x.zh }; }),
      lead: false
    });

    const fullText = paragraphs.map(function (p) { return p.en; }).join(' ');
    const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;
    const articleWords = bodyWords.map(function (w) {
      return { id: w.id, word: w.word, meaning: meaningWithPos(w), pos: w.pos, root: w.root ? w.root.label : '', count: countOccurrences(fullText, w.word) };
    });

    return {
      id: 'art-' + Date.now(),
      title: pick(pack.titles),
      subtitle: pack.label + ' · 由 ' + bodyWords.length + ' 个目标词编排的语境文章',
      theme: theme,
      themeLabel: pack.label,
      length: length,
      paragraphs: paragraphs,
      words: articleWords,
      wordCount: wordCount,
      targetCount: bodyWords.length,
      createdAt: new Date().toISOString()
    };
  }

  function generateArticle() {
    const selectedWords = Array.from(state.selected).map(function (id) { return BY_ID.get(id); }).filter(Boolean);
    if (selectedWords.length < MIN_SELECTED) {
      toast('至少选择 ' + MIN_SELECTED + ' 个词再生成');
      return;
    }
    const article = buildArticle(selectedWords, 'syllabus', state.length);
    state.article = article;
    state.articleView = 'en';
    state.history = [article].concat(state.history.filter(function (a) { return a.id !== article.id; })).slice(0, 8);
    saveStore();
    renderArticle();
    renderStats();
    renderSaved();
    toast('文章已生成：' + article.wordCount + ' 词 · ' + article.targetCount + ' 个目标词');
    if (window.innerWidth <= 1040) {
      setTimeout(function () {
        const paper = $('#article-paper');
        const top = paper.getBoundingClientRect().top + window.scrollY - 84;
        const html = document.documentElement;
        const previous = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        window.scrollTo(0, top);
        html.style.scrollBehavior = previous;
      }, 120);
    }
  }

  function renderArticle() {
    const paper = $('#article-paper');
    const empty = $('#article-empty');
    const article = state.article;
    if (!article) {
      paper.hidden = true;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    paper.hidden = false;
    $('#paper-title').textContent = article.title;
    $('#paper-subtitle').textContent = article.subtitle;
    $('#paper-meta').textContent = formatDate(article.createdAt) + ' · ' + article.wordCount + ' WORDS · ' + article.targetCount + ' TARGET WORDS';
    const covered = article.words.filter(function (w) { return w.count > 0; }).length;
    $('#paper-coverage').textContent = covered + ' / ' + article.targetCount + ' 目标词已覆盖';
    $$('#article-view-tabs button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.articleView === state.articleView); });
    renderArticleBody();
  }

  function renderArticleBody() {
    const article = state.article;
    if (!article) return;
    const box = $('#paper-body');
    if (state.articleView === 'words') {
      box.innerHTML = '' +
        '<table class="word-table"><thead><tr><th>WORD</th><th>释义</th><th>词根</th><th>出现</th></tr></thead><tbody>' +
        article.words.map(function (w) {
          return '<tr><td>' + escapeHtml(w.word) + '</td><td>' + escapeHtml(meaningWithPos(w)) + '</td><td>' + escapeHtml(w.root || '—') + '</td><td>' + w.count + '×</td></tr>';
        }).join('') +
        '</tbody></table>';
      return;
    }
    const words = article.words.map(function (w) { return BY_ID.get(w.id); }).filter(Boolean);
    box.innerHTML = article.paragraphs.map(function (p, i) {
      const sentences = paragraphSentences(p);
      const en = '<p class="' + (i === 0 ? 'lead' : '') + '">' + sentences.map(function (s, si) {
        return '<span class="sentence" data-p="' + i + '" data-s="' + si + '">' + linkArticleText(s.en, words) + '<button class="sentence-translate" type="button" title="显示本句翻译" aria-label="显示本句翻译">译</button></span>';
      }).join(' ') + '</p>';
      if (state.articleView === 'bi') {
        return en + '<p class="zh">' + escapeHtml(p.zh) + '</p>';
      }
      return en + '<div class="sentence-zh" data-translation="' + i + '" hidden></div>';
    }).join('');
  }

  function articleToText(article) {
    const lines = [];
    lines.push(article.title);
    lines.push(article.subtitle);
    lines.push('');
    article.paragraphs.forEach(function (p) {
      lines.push(p.en);
      lines.push(p.zh);
      lines.push('');
    });
    lines.push('--- 目标词表 ---');
    article.words.forEach(function (w) {
      lines.push(w.word + '\t' + meaningWithPos(w) + '\t' + (w.root || '') + '\t' + w.count + '×');
    });
    lines.push('');
    lines.push('Generated by 研词 YANCI · ' + formatDate(article.createdAt));
    return lines.join('\n');
  }

  async function copyArticle() {
    if (!state.article) return;
    const text = articleToText(state.article);
    try {
      await navigator.clipboard.writeText(text);
      toast('文章已复制到剪贴板');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('文章已复制到剪贴板'); }
      catch (err) { toast('复制失败，请手动选择文本'); }
      document.body.removeChild(ta);
    }
  }

  function downloadArticle() {
    if (!state.article) return;
    const blob = new Blob([articleToText(state.article)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yanci-' + formatDate(state.article.createdAt).replace(/\./g, '') + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    toast('TXT 已下载');
  }

  /* ---------------------------------------------------------- saved */
  function renderSaved() {
    $$('#saved-tabs button').forEach(function (b) { b.classList.toggle('is-active', b.dataset.savedTab === state.savedTab); });
    const box = $('#saved-content');
    if (state.savedTab === 'notes') {
      const entries = Object.keys(state.notes).map(function (id) {
        return { w: BY_ID.get(id), note: getNote(id) };
      }).filter(function (item) { return item.w && item.note; })
        .sort(function (a, b) { return new Date(b.note.updatedAt || 0) - new Date(a.note.updatedAt || 0); });
      if (!entries.length) {
        box.innerHTML = '<div class="saved-empty"><h3>还没有单词笔记</h3><p>打开任意一个词，在详情里记下辨析、搭配或你的记忆线索。</p><button class="btn btn-primary" data-action="go-library">去词库看看</button></div>';
        return;
      }
      box.innerHTML = '<div class="saved-list note-list">' + entries.map(function (item, i) {
        const w = item.w;
        return '<div class="saved-row note-row">' +
          '<span class="saved-index">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="saved-word" data-word-link="' + w.id + '">' + escapeHtml(w.word) + '</span>' +
          '<span class="note-preview">' + escapeHtml(noteExcerpt(item.note.text, 90)) + '</span>' +
          '<span class="saved-tag">' + escapeHtml(noteTimestamp(item.note)) + '</span>' +
          '<div class="saved-actions">' +
            '<button class="icon-btn" data-action="add-selected" data-id="' + w.id + '" title="加入选词"><svg class="icon"><use href="#i-plus"></use></svg></button>' +
            '<button class="icon-btn" data-action="edit-note" data-id="' + w.id + '" title="编辑笔记"><svg class="icon"><use href="#i-pen"></use></svg></button>' +
            '<button class="icon-btn" data-action="open-detail" data-id="' + w.id + '" title="打开词条"><svg class="icon"><use href="#i-chevron"></use></svg></button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
      return;
    }
    if (state.savedTab === 'articles') {
      if (!state.history.length) {
        box.innerHTML = '<div class="saved-empty"><h3>还没有生成过文章</h3><p>选几个词，试着把它们编成一篇语境文章。</p><button class="btn btn-primary" data-action="start-compose">去选词成文</button></div>';
        return;
      }
      box.innerHTML = '<div class="article-history">' + state.history.map(function (a) {
        return '<article class="history-card" data-history-id="' + a.id + '">' +
          '<div class="history-top"><span>' + escapeHtml(a.themeLabel || '') + '</span><span>' + formatDate(a.createdAt) + '</span></div>' +
          '<h4>' + escapeHtml(a.title) + '</h4>' +
          '<p>' + a.wordCount + ' words · ' + a.targetCount + ' target words</p>' +
          '<div class="history-words">' + a.words.slice(0, 7).map(function (w) { return '<span>' + escapeHtml(w.word) + '</span>'; }).join('') + '</div>' +
        '</article>';
      }).join('') + '</div>';
      return;
    }

    const ids = state.savedTab === 'mastered'
      ? Object.keys(state.masteredAt).filter(function (id) { return BY_ID.has(id); }).sort(function (a, b) { return new Date(state.masteredAt[b]) - new Date(state.masteredAt[a]); })
      : Array.from(state.favorites);
    if (!ids.length) {
      const isFav = state.savedTab === 'favorite';
      box.innerHTML = '<div class="saved-empty"><h3>' + (isFav ? '还没有收藏单词' : '还没有标记已掌握') + '</h3><p>' + (isFav ? '在词库里点书签图标，把需要反复看的词收进来。' : '遇到已经吃透的词，点一下对勾，掌握进度就会更新。') + '</p><button class="btn btn-primary" data-action="go-library">去词库看看</button></div>';
      return;
    }
    box.innerHTML = '<div class="saved-list">' + ids.map(function (id, i) {
      const w = BY_ID.get(id);
      return '<div class="saved-row">' +
        '<span class="saved-index">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="saved-word" data-word-link="' + w.id + '">' + escapeHtml(w.word) + '</span>' +
        '<span class="saved-meaning">' + escapeHtml(meaningWithPos(w)) + '</span>' +
        '<span class="saved-tag">' + escapeHtml(themeLabel(w)) + '</span>' +
        '<div class="saved-actions">' +
          '<button class="icon-btn" data-action="add-selected" data-id="' + w.id + '" title="加入选词"><svg class="icon"><use href="#i-plus"></use></svg></button>' +
          '<button class="icon-btn" data-action="' + (state.savedTab === 'favorite' ? 'remove-favorite' : 'toggle-mastered') + '" data-id="' + w.id + '" title="' + (state.savedTab === 'favorite' ? '取消收藏' : '取消已掌握') + '">' +
            '<svg class="icon"><use href="#' + (state.savedTab === 'favorite' ? 'i-close' : 'i-check') + '"></use></svg></button>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  /* ---------------------------------------------------------- view switching */
  const VIEW_META = {
    library: ['VOCABULARY LIBRARY', '词库'],
    sprint: ['SPEED REVIEW', '极速刷词'],
    daily: ['DAILY RECALL', '每日背诵'],
    composer: ['CONTEXT COMPOSER', '选词成文'],
    saved: ['MY COLLECTION', '我的词单']
  };
  function setView(view) {
    if (!VIEW_META[view]) return;
    state.view = view;
    $$('.nav-item').forEach(function (b) { b.classList.toggle('is-active', b.dataset.view === view); });
    $$('.view').forEach(function (v) { v.classList.toggle('is-active', v.dataset.viewPanel === view); });
    $('#view-eyebrow').textContent = VIEW_META[view][0];
    $('#view-title').textContent = VIEW_META[view][1];
    document.body.classList.remove('sidebar-open');
    if (view === 'library') { if (state.libraryMode === 'morph') renderAffixes(); else renderLibrary(); }
    if (view === 'sprint') renderSprint();
    if (view === 'daily') renderDaily();
    if (view === 'composer') { renderComposer(); renderArticle(); }
    if (view === 'saved') renderSaved();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------------------------------------------------- actions */
  function toggleReveal(id, card) {
    const w = BY_ID.get(id);
    if (!w || !card) return;
    const shown = !state.revealed.has(id);
    if (shown) state.revealed.add(id); else state.revealed.delete(id);
    card.classList.toggle('is-revealed', shown);
    card.setAttribute('aria-expanded', shown ? 'true' : 'false');
    speak(w.word);
    const meaning = card.querySelector('.wc-meaning');
    if (meaning) {
      if (shown) {
        meaning.textContent = meaningWithPos(w);
      } else {
        meaning.innerHTML = '<span class="wc-hidden-cn">中文已隐藏 · 点击词条显示</span>';
      }
    }
  }
  function startNoteEdit(id) {
    if (!BY_ID.has(id)) return;
    if (state.currentWord !== id || !document.body.classList.contains('drawer-open')) openWord(id);
    state.noteEditing = id;
    state.noteSource = 'drawer';
    renderDrawer();
    requestAnimationFrame(function () {
      const input = $('#note-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });
  }
  function cancelNoteEdit() {
    const source = state.noteSource;
    state.noteEditing = null;
    if (source === 'daily') renderDaily();
    else renderDrawer();
  }
  function refreshNoteMark(id) {
    const card = document.querySelector('.word-card[data-word-id="' + id + '"]');
    if (!card) return;
    const word = card.querySelector('.wc-word');
    if (!word) return;
    let mark = word.querySelector('.wc-note-mark');
    const note = getNote(id);
    if (note && !mark) {
      mark = document.createElement('span');
      mark.className = 'wc-note-mark';
      mark.title = '有单词笔记';
      mark.setAttribute('aria-label', '有单词笔记');
      mark.textContent = '✎';
      word.appendChild(mark);
    } else if (!note && mark) {
      mark.remove();
    }
  }
  function afterNoteChange(id) {
    refreshSearchForNote(id);
    saveStore();
    renderStats();
    refreshNoteMark(id);
    if (state.view === 'saved') renderSaved();
    if (state.view === 'daily') renderDaily();
    if (state.noteSource !== 'daily' && document.body.classList.contains('drawer-open')) renderDrawer();
  }
  function saveNote(id) {
    if (!BY_ID.has(id)) return;
    const input = state.noteSource === 'daily' ? $('#daily-note-input') : $('#note-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
      delete state.notes[id];
    } else {
      state.notes[id] = { text: text, updatedAt: new Date().toISOString() };
    }
    state.noteEditing = null;
    afterNoteChange(id);
    toast(text ? '笔记已保存' : '空笔记已移除');
  }
  function deleteNote(id) {
    if (!state.notes[id]) return;
    delete state.notes[id];
    state.noteEditing = null;
    afterNoteChange(id);
    toast('笔记已删除');
  }
  function navigateWord(step) {
    const list = getFilteredWords();
    if (!list.length) return;
    const current = list.findIndex(function (w) { return w.id === state.currentWord; });
    const next = current === -1 ? 0 : (current + step + list.length) % list.length;
    openWord(list[next].id);
  }
  function toggleFavorite(id) {
    if (!BY_ID.has(id)) return;
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
      toast('已取消收藏');
    } else {
      state.favorites.add(id);
      toast('已收藏，稍后可在“我的词单”复习');
    }
    saveStore();
    renderStats();
    renderLibrary();
    renderSaved();
    if (state.currentWord === id) renderDrawer();
  }
  function toggleMastered(id) {
    if (!BY_ID.has(id)) return;
    if (isMastered(id)) {
      delete state.masteredAt[id];
      toast('已取消“已掌握”标记');
    } else {
      state.masteredAt[id] = new Date().toISOString();
      toast('已标记掌握，今日进度 +1');
    }
    saveStore();
    renderStats();
    renderLibrary();
    renderSaved();
    if (state.currentWord === id) renderDrawer();
  }
  function speak(word) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持朗读'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
  function resetFilters() {
    state.query = '';
    state.status = 'all';
    state.theme = null;
    state.affix = null;
    state.semantic = null;
    state.sort = 'frequency';
    state.limit = PAGE_SIZE;
    renderFilterChips();
    renderLibrary();
    $('#library-search').value = '';
  }

  /* ---------------------------------------------------------- event bindings */
  function bindEvents() {
    // main nav
    $$('.nav-item').forEach(function (b) {
      b.addEventListener('click', function () { setView(b.dataset.view); });
    });
    $('#mobile-menu').addEventListener('click', function () { document.body.classList.add('sidebar-open'); });
    $('#mobile-scrim').addEventListener('click', function () { document.body.classList.remove('sidebar-open'); });
    const sprintGrid = $('#sprint-grid');
    if (sprintGrid) {
      sprintGrid.addEventListener('click', function (e) {
        const tile = e.target.closest('.sprint-tile');
        if (tile) toggleSprintTile(tile.dataset.sprintId, tile);
      });
    }

    const sprintModebar = document.querySelector('#view-sprint .sprint-modebar');
    if (sprintModebar) {
      sprintModebar.addEventListener('click', function (e) {
        const b = e.target.closest('[data-sprint-mode]');
        if (b) setSprintMode(b.dataset.sprintMode);
      });
    }
    const fastList = $('#fast-list');
    if (fastList) {
      fastList.addEventListener('click', function (e) {
        const row = e.target.closest('.fast-row');
        if (row) toggleFastWord(row.dataset.fastId, row);
      });
    }
    const sprintSummary = $('#sprint-summary');
    if (sprintSummary) {
      sprintSummary.addEventListener('click', function (e) {
        const row = e.target.closest('[data-summary-id]');
        if (row) openSummaryWord(row.dataset.summaryId);
      });
    }

    // sidebar theme nav
    $('#theme-nav').addEventListener('click', function (e) {
      const b = e.target.closest('[data-theme-nav]');
      if (!b) return;
      const key = b.dataset.themeNav;
      state.theme = key === 'all' ? null : key;
      state.affix = null;
      state.semantic = null;
      state.limit = PAGE_SIZE;
      renderFilterChips();
      setView('library');
    });

    // library search
    const searchInput = $('#library-search');
    searchInput.addEventListener('input', function () {
      state.query = searchInput.value;
      state.limit = PAGE_SIZE;
      renderLibrary();
    });
    $('#clear-search').addEventListener('click', function () {
      state.query = '';
      state.limit = PAGE_SIZE;
      searchInput.value = '';
      searchInput.focus();
      renderLibrary();
    });
    $('#search-trigger').addEventListener('click', function () {
      setView('library');
      setTimeout(function () { searchInput.focus(); searchInput.select(); }, 120);
    });

    // status / sort / layout
    $('#status-filter').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-status]');
      if (!b) return;
      state.status = b.dataset.status;
      state.limit = PAGE_SIZE;
      renderLibrary();
    });
    $('#sort-select').addEventListener('change', function (e) {
      state.sort = e.target.value;
      state.limit = PAGE_SIZE;
      renderLibrary();
    });
    $('.view-toggle').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-layout]');
      if (!b) return;
      state.layout = b.dataset.layout;
      saveStore();
      renderLibrary();
    });

    // filter chips
    $('#filter-row').addEventListener('click', function (e) {
      const a = e.target.closest('[data-affix-filter]');
      if (a) {
        const key = a.dataset.affixFilter;
        state.affix = key === 'all' ? null : key;
        state.limit = PAGE_SIZE;
        renderFilterChips();
        renderLibrary();
        return;
      }
      const t = e.target.closest('[data-theme-filter]');
      if (t) {
        const key = t.dataset.themeFilter;
        state.theme = key === 'all' ? null : key;
        state.limit = PAGE_SIZE;
        renderFilterChips();
        renderLibrary();
        return;
      }
      const s = e.target.closest('[data-semantic-filter]');
      if (s) {
        const key = s.dataset.semanticFilter;
        state.semantic = key === 'all' ? null : key;
        state.limit = PAGE_SIZE;
        renderFilterChips();
        renderLibrary();
      }
    });

    // word cards
    $('#word-grid').addEventListener('click', function (e) {
      const action = e.target.closest('[data-action]');
      if (action) {
        e.stopPropagation();
        const id = action.dataset.id;
        if (action.dataset.action === 'add-selected') addSelected(id);
        if (action.dataset.action === 'open-detail') openWord(id);
        if (action.dataset.action === 'speak') speak(action.dataset.word);
        return;
      }
      const card = e.target.closest('.word-card');
      if (card) toggleReveal(card.dataset.wordId, card);
    });
    $('#word-grid').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('[data-action]')) return;
      const card = e.target.closest('.word-card');
      if (card) { e.preventDefault(); toggleReveal(card.dataset.wordId, card); }
    });
    $('#daily-stage').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('[data-action]')) return;
      const card = e.target.closest('.daily-card');
      if (!card) return;
      e.preventDefault();
      state.dailyRevealed = state.dailyRevealed === state.daily.current ? null : state.daily.current;
      const dailyWord = BY_ID.get(state.daily.current);
      if (dailyWord) speak(dailyWord.word);
      renderDaily();
    });

    // library word / morphology mode
    $('.library-mode-switch').addEventListener('click', function (e) {
      const b = e.target.closest('[data-library-mode]');
      if (!b) return;
      setLibraryMode(b.dataset.libraryMode);
    });
    $('#affix-tabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-affix-type]');
      if (!b) return;
      state.affixTab = b.dataset.affixType;
      state.morphDetailKey = null;
      const detail = $('#morph-detail');
      if (detail) { detail.hidden = true; detail.innerHTML = ''; }
      const grid = $('#affix-grid');
      if (grid) grid.hidden = false;
      renderAffixes();
    });
    $('#affix-grid').addEventListener('click', function (e) {
      const card = e.target.closest('.affix-card');
      if (!card || !card.dataset.morphKey) return;
      renderMorphDetail(card.dataset.morphKey);
    });
    $('#affix-grid').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.affix-card');
      if (!card) return;
      e.preventDefault();
      renderMorphDetail(card.dataset.morphKey);
    });
    $('#morph-detail').addEventListener('click', function (e) {
      if (e.target.closest('[data-action="close-morph-detail"]')) {
        state.morphDetailKey = null;
        $('#morph-detail').hidden = true;
        $('#morph-detail').innerHTML = '';
        $('#affix-grid').hidden = false;
        return;
      }
      const filter = e.target.closest('[data-action="filter-morph"]');
      if (filter) filterByMorph(filter.dataset.morphKey);
    });

    // composer
    $('#composer-search').addEventListener('focus', function () { renderSuggestions(); });
    $('#composer-search').addEventListener('input', function () { renderSuggestions(); });
    $('#composer-suggestions').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="add-selected"]');
      if (!b) return;
      addSelected(b.dataset.id);
      $('#composer-search').value = '';
      renderSuggestions();
    });
    $('#selected-chips').addEventListener('click', function (e) {
      const b = e.target.closest('[data-action="remove-selected"]');
      if (b) removeSelected(b.dataset.id);
    });
    $('#length-picker').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-length]');
      if (!b) return;
      state.length = b.dataset.length;
      saveStore();
      renderComposer();
    });
    $('#generate-btn').addEventListener('click', generateArticle);
    $('[data-action="auto-select"]').addEventListener('click', autoSelect);
    $('[data-action="clear-selection"]').addEventListener('click', clearSelection);

    // article tabs/tools
    $('#article-view-tabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-article-view]');
      if (!b) return;
      state.articleView = b.dataset.articleView;
      hideWordPop();
      $$('#article-view-tabs button').forEach(function (x) { x.classList.toggle('is-active', x === b); });
      renderArticleBody();
    });

    // article reading: target word popover + sentence translation
    $('#paper-body').addEventListener('click', function (e) {
      const target = e.target.closest('.article-word');
      if (target) {
        e.preventDefault();
        e.stopPropagation();
        const w = BY_ID.get(target.dataset.wordId);
        if (w) { speak(w.word); showWordPop(w, target); }
        return;
      }
      const sentence = e.target.closest('.sentence');
      if (!sentence) return;
      const p = Number(sentence.dataset.p);
      const si = Number(sentence.dataset.s);
      const paragraph = state.article && state.article.paragraphs[p];
      if (!paragraph) return;
      const parts = paragraphSentences(paragraph);
      const part = parts[si];
      if (!part) return;
      const translation = $('.sentence-zh[data-translation="' + p + '"]');
      const already = sentence.classList.contains('is-open');
      $$('.sentence.is-open').forEach(function (x) { x.classList.remove('is-open'); });
      $$('.sentence-zh').forEach(function (x) { x.hidden = true; });
      if (!already && translation) {
        sentence.classList.add('is-open');
        translation.textContent = part.zh;
        translation.hidden = false;
      }
    });
    $('#paper-body').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target.closest('.article-word');
      if (!target) return;
      e.preventDefault();
      const w = BY_ID.get(target.dataset.wordId);
      if (w) { speak(w.word); showWordPop(w, target); }
    });

    // saved tabs
    $('#saved-tabs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-saved-tab]');
      if (!b) return;
      state.savedTab = b.dataset.savedTab;
      renderSaved();
    });
    $('#saved-content').addEventListener('click', function (e) {
      const h = e.target.closest('[data-history-id]');
      if (h) {
        const article = state.history.find(function (a) { return a.id === h.dataset.historyId; });
        if (article) {
          state.article = article;
          state.selected = new Set(article.words.map(function (w) { return w.id; }).filter(function (id) { return BY_ID.has(id); }));
          state.articleView = 'en';
          saveStore();
          renderComposer();
          setView('composer');
          renderArticle();
          toast('已载入历史文章');
        }
        return;
      }
      const link = e.target.closest('[data-word-link]');
      if (link) openWord(link.dataset.wordLink);
    });

    // generic actions
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#word-pop') && !e.target.closest('.target-word')) hideWordPop();
      const action = e.target.closest('[data-action]');
      if (!action) {
        if (!e.target.closest('.composer-search') && !e.target.closest('#composer-suggestions')) {
          $('#composer-suggestions').classList.remove('is-open');
        }
        return;
      }
      if (action.closest('#composer-suggestions') || action.closest('#word-grid') || action.closest('#selected-chips')) return;
      const id = action.dataset.id;
      switch (action.dataset.action) {
        case 'toggle-fav': toggleFavorite(id); break;
        case 'toggle-mastered': toggleMastered(id); break;
        case 'add-selected': addSelected(id); hideWordPop(); break;
        case 'remove-selected': removeSelected(id); break;
        case 'load-more': state.limit += PAGE_SIZE; renderLibrary(); break;
        case 'sprint-expand': setAllSprint(true); break;
        case 'sprint-collapse': setAllSprint(false); break;
        case 'fast-prev': fastPrev(); break;
        case 'fast-next': fastNext(); break;
        case 'fast-summary': fastSummary(); break;
        case 'fast-continue': fastContinue(); break;
        case 'fast-checkin': fastCheckin(); break;
        case 'open-detail': openWord(id); hideWordPop(); break;
        case 'close-drawer': closeDrawer(); break;
        case 'speak': speak(action.dataset.word || (BY_ID.get(state.currentWord) || {}).word); break;
        case 'start-compose': setView('composer'); break;
        case 'go-library': setView('library'); break;
        case 'random-word':
          openWord(WORDS[Math.floor(Math.random() * WORDS.length)].id);
          break;
        case 'reset-filters': resetFilters(); break;
        case 'clear-morph': state.affix = null; renderFilterChips(); renderLibrary(); break;
        case 'copy-article': copyArticle(); break;
        case 'download-article': downloadArticle(); break;
        case 'print-article': window.print(); break;
        case 'regenerate': generateArticle(); break;
        case 'remove-favorite': toggleFavorite(id); break;
        case 'edit-note': startNoteEdit(id); break;
        case 'cancel-note': cancelNoteEdit(); break;
        case 'save-note': saveNote(id); break;
        case 'delete-note': deleteNote(id); break;
        case 'prev-word': navigateWord(-1); break;
        case 'next-word': navigateWord(1); break;
        case 'daily-reveal': {
          const dailyWord = BY_ID.get(state.daily.current);
          state.dailyRevealed = state.dailyRevealed === state.daily.current ? null : state.daily.current;
          if (dailyWord) speak(dailyWord.word);
          renderDaily();
          break;
        }
        case 'daily-mark': markDaily(id, action.dataset.result); break;
        case 'daily-compose': takeDailyToComposer(); break;
        case 'daily-reset': resetDaily(); break;
        case 'daily-checkin': checkinDaily(); break;
        case 'daily-edit-note': startDailyNoteEdit(id); break;
        case 'apply-daily-plan': applyDailyPlan(); break;
      }
    });

    // word links in drawer / saved
    document.addEventListener('click', function (e) {
      const link = e.target.closest('[data-word-link]');
      if (link && !link.closest('#saved-content')) openWord(link.dataset.wordLink);
    });

    // overlay close
    $('#drawer-scrim').addEventListener('click', closeDrawer);

    // note editor
    $('#word-drawer').addEventListener('click', function (e) {
      const exampleWord = e.target.closest('.example-word');
      if (exampleWord && exampleWord.dataset.wordId) {
        e.preventDefault();
        e.stopPropagation();
        const w = BY_ID.get(exampleWord.dataset.wordId);
        if (w) { openWord(w.id); speak(w.word); }
        return;
      }
      if (e.target.closest('.drawer-word') && state.currentWord) {
        const w = BY_ID.get(state.currentWord);
        if (w) speak(w.word);
      }
    });
    $('#word-drawer').addEventListener('input', function (e) {
      if (e.target.id === 'note-input') {
        const counter = $('#note-count');
        if (counter) counter.textContent = e.target.value.length + ' / 1200';
      }
    });
    $('#view-daily').addEventListener('input', function (e) {
      if (e.target.id === 'daily-note-input') {
        const counter = $('#daily-note-count');
        if (counter) counter.textContent = e.target.value.length + ' / 1200';
      }
    });
    $('#daily-planbar').addEventListener('change', function (e) {
      if (e.target.name !== 'daily-plan-mode') return;
      const auto = e.target.value === 'auto';
      const newInput = $('#daily-new-count');
      const reviewInput = $('#daily-review-count');
      newInput.disabled = auto;
      reviewInput.disabled = auto;
      if (auto && state.daily) {
        newInput.value = state.daily.newIds.length;
        reviewInput.value = state.daily.reviewIds.length;
      } else if (!auto) {
        newInput.value = state.dailySettings.newCount;
        reviewInput.value = state.dailySettings.reviewCount;
      }
      const note = $('#daily-plan-note');
      if (note) {
        if (auto) note.textContent = '记忆曲线会根据到期复习和掌握情况自动安排；点“应用并重新生成”生效。';
        else note.textContent = '自主调配：设置 ' + newInput.value + ' 个新词 + ' + reviewInput.value + ' 个复习；点“应用并重新生成”生效。';
      }
    });

    // keyboard
    document.addEventListener('keydown', function (e) {
      if ((e.target.id === 'note-input' || e.target.id === 'daily-note-input') && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        saveNote(state.noteEditing);
        return;
      }
      if (e.key === 'Escape') {
        const pop = $('#word-pop');
        if (pop && !pop.hidden) { hideWordPop(); return; }
        if (state.noteEditing) { cancelNoteEdit(); return; }
        if (document.body.classList.contains('drawer-open')) closeDrawer();
        else document.body.classList.remove('sidebar-open');
        return;
      }
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if (!typing && state.view === 'sprint' && state.sprintMode === 'fast' && !document.body.classList.contains('drawer-open')) {
        if (state.sprintFast.summary) {
          if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); fastContinue(); }
          return;
        }
        if (e.key === 'ArrowRight') { e.preventDefault(); fastNext(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); fastPrev(); return; }
        if (e.key === ' ') {
          const hiddenRow = document.querySelector('#fast-list .fast-row:not(.is-revealed)');
          if (hiddenRow) { e.preventDefault(); toggleFastWord(hiddenRow.dataset.fastId, hiddenRow); }
          return;
        }
      }
      if (e.key === '/' && !typing) {
        e.preventDefault();
        setView('library');
        setTimeout(function () { const input = $('#library-search'); input.focus(); input.select(); }, 80);
      }
    });
  }

  /* ---------------------------------------------------------- init */
  function init() {
    $('#total-count').textContent = TOTAL;
    $('#hero-total').textContent = TOTAL;
    initDaily();
    renderThemeNav();
    renderFilterChips();
    bindEvents();
    renderStats();
    renderLibrary();
    renderAffixes();
    renderComposer();
    renderSuggestions();
    renderSaved();
    renderArticle();
    renderDaily();
    setView('library');
  }

  init();
})();
