// app/domain.js — הבחירה, הסנכרון, ותצוגת העמודים ששני המסכים משתמשים בה
import { kvParse, netTimeout } from '../core/util.js';
import { ctxEpoch, ctxStale, idEq, mergeCore, pendHas, pendMark, pushDirty,
         schedulePush } from '../core/sync.js';
import { MIRROR, mirrorSave } from '../core/mirror.js';
import { logAction } from '../core/backup.js';
import { esc, openModal, pullRender, toast, uiNoDialog } from '../core/ui.js';
import { hebDayLabel, hebGematria } from '../core/hebrew.js';
import { ALIYOT, CH, CH_URL, HAFTAROT, KEY_CHUMASH, KEY_SHNAYIM, MSG_PICK_ALIYAH_TITLE, HY, HY_MONTHS, HY_NAMES, HY_URL, KEY_HAYOM, KEY_RAMBAM, KEY_TANYA, MSG_PICK_DAY_TITLE, KV_TABLE, MSG_HAKDAMA, MSG_LOAD_FAIL,
         MSG_MINHAG_OPEN, MSG_MOREH_CLOSE, MSG_MOREH_OPEN, MSG_PEREK, MSG_SPECIAL_OPEN, MSG_PICK_CUR, MSG_PICK_NONE, MSG_PICK_PARASHA_TITLE, MSG_PICK_SEARCH,
         MSG_PICK_TITLE, MSG_RAMBAM_OPENING, PARSHIOT, PUSH_TABLES, MT_URL, RAMBAM_LESSONS, RAMBAM_MAP, RAMBAM_VOLS, RAMBAM_X, SCAN, SCAN_W, TABLES,
         LESSONS, MSG_SOON, TANYA_BOOKS, TANYA_CHAPTERS, TANYA_RATIO, TANYA_URL } from './constants.js';
import { S, shell } from './state.js';
import { icon } from './icons.js';

// ── מטא ──
function sTableMeta(t) {
  var i;
  for (i = 0; i < TABLES.length; i++) if (TABLES[i].t === t) return TABLES[i];
  return { t: t, key: 'client_id' };
}

// המפתח נגזר מהמטא — טבלת ההגדרות ממופתחת ב-key, ומפתח מוקלד היה מסמן שורה שהמיזוג אינו מוצא.
function sPendKey(t, r) { return sPendKeyOf(t, r && r[sTableMeta(t).key]); }

// ההגדרות מסומנות setting:<מפתח> בלי שם הטבלה — זה הסימון המשותף, ולא מה שנבדל.
function sPendKeyOf(t, k) { return (t === KV_TABLE ? 'setting' : t) + ':' + k; }

function sStripRows(t, rows) { return rows; }

function sLive(rows) { return (rows || []).filter(function (r) { return !r.deleted; }); }

// ── משיכה, מיזוג ודחיפה ──
// כשל מחזיר «אין ראיה» — מיזוג מול מערך ריק מוחק את מה שלא הספיק לעלות.
function pullTable(t) {
  return netTimeout(S.sb.from(t).select('*')).then(function (r) {
    if (!r || r.error || !Array.isArray(r.data)) return { ok: false, rows: [] };
    return { ok: true, rows: r.data };
  }, function () { return { ok: false, rows: [] }; });
}

function mergeTable(t, remote) {
  var m = sTableMeta(t);
  var merged = mergeCore(MIRROR[t] || [], remote, { key: m.key, isPending: function (k) {
    return pendHas(sPendKeyOf(t, k));
  } });
  MIRROR[t] = merged;
  mirrorSave(t);
  return merged;
}

function sSyncPull() {
  if (!S.sb) return Promise.resolve(false);
  if (S._syncBusy) return Promise.resolve(false);
  S._syncBusy = true;
  var ep = ctxEpoch();
  return Promise.all(PUSH_TABLES.map(pullTable)).then(function (res) {
    if (ctxStale(ep)) return false;
    var any = false, i;
    for (i = 0; i < PUSH_TABLES.length; i++) {
      if (!res[i].ok) continue;
      any = true;
      mergeTable(PUSH_TABLES[i], res[i].rows);
    }
    if (any && !S._sPullLogged) { S._sPullLogged = true; sSyncLog('pull', null, null); }
    return any;
  }).then(function (any) {
    S._syncBusy = false;
    if (any) pullRender(shell.sRender);
    return any;
  }, function (e) {
    S._syncBusy = false;
    console.error('[sync] משיכה נכשלה', e);
    return false;
  });
}

// אין לרשום כל מחזור סנכרון — הבדיקה המחזורית רצה כל שלוש שניות, ו-sh_sync_log היא insert בלבד.
// אין כניסה — user_name נרשם null, והמכשיר הוא שמזהה את הרישום.
function sSyncLog(action, key, recordCount, details) {
  try { logAction(action, key, recordCount, details); } catch (e) { }
}

function sSyncNow() {
  return sSyncPull().then(function () { return pushDirty(); })
    .then(function (r) { if (r && r.n) sSyncLog('push', null, r.n); return r; });
}

function pushSoon() { schedulePush(); }

var sQ = function (s) { return document.querySelector(s); };

// ── הכתיבה ──
function localPut(table, row) {
  var l = MIRROR[table], k = sTableMeta(table).key, i;
  for (i = 0; i < l.length; i++) if (idEq(l[i][k], row[k])) { l[i] = row; break; }
  if (i === l.length) l.push(row);
  mirrorSave(table);
  pendMark(sPendKey(table, row));
}

// ── הבחירה ──
// מספר בטווח, או ברירת המחדל — ערך שאינו בטווח נקרא כבחירה שלא נעשתה.
function sPick(key, max) {
  var rows = sLive(MIRROR[KV_TABLE]), i, v;
  for (i = 0; i < rows.length; i++) {
    if (rows[i].key !== key) continue;
    v = kvParse(key, rows[i].value).value;
    return (typeof v === 'number' && v >= 0 && v < max) ? v : 0;
  }
  return 0;
}

function sPickSet(key, v) {
  var rows = MIRROR[KV_TABLE], row = null, i;
  for (i = 0; i < rows.length; i++) if (rows[i].key === key) { row = rows[i]; break; }
  if (!row) row = { key: key, client_id: null, deleted: false, deleted_at: null, deleted_by: null };
  row.value = JSON.stringify(v);
  row.updated_at = Date.now();
  localPut(KV_TABLE, row);
  pushSoon();
}

// השיעור שנבחר בכל לימוד — הסדר הראשי והמסך של הלימוד קוראים אותו.
function rambamCur() { return sPick(KEY_RAMBAM, RAMBAM_LESSONS.length); }

function tanyaCur() { return sPick(KEY_TANYA, PARSHIOT.length); }

// ── תוויות ──
function rambamLabel(i) { return hebGematria(i + 1, '') + '. ' + RAMBAM_LESSONS[i][0]; }

function tanyaChapName(c) { return c === 0 ? MSG_HAKDAMA : MSG_PEREK + hebGematria(c, ''); }

function tanyaLabel(c) { return PARSHIOT[c] + ' — ' + tanyaChapName(c); }

// סרגל הקריאה — שם השיעור, באמצע, ופותח את הבחירה; הניווט — בשורה התחתונה.
function readBarHTML(kind, kicker, title) {
  return '<div class="readbar" id="readbar"><div class="in">' +
    '<button class="rb-pick" data-act="pick-open" data-k="' + kind + '"><span class="rb-k">' + esc(kicker) + '</span>' +
    '<b>' + title + '</b>' + icon('down') + '</button></div></div>';
}

// ── בחירת שיעור — גיליון מלמטה ──
// קבוצה לכל הלכות ברמב״ם ולכל חומש בתניא; שיעור שחוצה שתי הלכות נכנס לקבוצה של הראשונה.
function rambamGroups() {
  var out = [], last = null;
  RAMBAM_LESSONS.forEach(function (x, i) {
    var m = /^(הל' .+?) (פרק .+)$/.exec(x[0].split(' · ')[0]);
    var g = m ? m[1] : MSG_RAMBAM_OPENING;
    if (!last || last.title !== g) { last = { title: g, items: [] }; out.push(last); }
    last.items.push({ i: i, num: hebGematria(i + 1, ''), name: m ? x[0].slice(m[1].length + 1) : x[0] });
  });
  return out;
}

function tanyaGroups() {
  return TANYA_BOOKS.map(function (b, k) {
    var end = k + 1 < TANYA_BOOKS.length ? TANYA_BOOKS[k + 1][1] : PARSHIOT.length, items = [];
    for (var i = b[1]; i < end; i++) items.push({ i: i, num: PARSHIOT[i], name: tanyaChapName(i) });
    return { title: b[0], items: items };
  });
}

// לכל לימוד — מפתח הבחירה, הנוכחי, הקבוצות וכותרת הגיליון.
var PICKERS = {
  rambam: { key: KEY_RAMBAM, cur: rambamCur, groups: rambamGroups, title: MSG_PICK_TITLE },
  tanya: { key: KEY_TANYA, cur: tanyaCur, groups: tanyaGroups, title: MSG_PICK_PARASHA_TITLE },
  hayom: { key: KEY_HAYOM, cur: hayomCur, groups: hayomGroups, title: MSG_PICK_DAY_TITLE },
  chumash: { key: KEY_CHUMASH, cur: chumashCur, groups: chumashGroups, title: MSG_PICK_ALIYAH_TITLE },
  shnayim: { key: KEY_SHNAYIM, cur: shnayimCur, groups: shnayimGroups, title: MSG_PICK_PARASHA_TITLE }
};

function pickerOpen(kind) {
  var P = PICKERS[kind], isR = kind === 'rambam';
  if (!P) { uiNoDialog('pickerOpen', kind); return; }
  var cur = P.cur();
  var h = '<label class="pk-search">' + icon('search') + '<input type="search" data-inp="pick-q" aria-label="' +
          esc(MSG_PICK_SEARCH) + '" placeholder="' + esc(MSG_PICK_SEARCH) + '"></label><div class="pk-list" id="pk-list">';
  P.groups().forEach(function (g) {
    h += '<div class="pk-grp"><div class="pk-gt">' + esc(g.title) + '</div>' + g.items.map(function (it) {
      var on = it.i === cur;
      return '<button class="pk-it' + (on ? ' on' : '') + '" data-act="pick-go" data-k="' + kind + '" data-id="' + it.i +
             '" data-q="' + esc(pickNorm(g.title + ' ' + it.num + ' ' + it.name + ' ' + (it.i + 1))) + '">' +
             '<span class="pk-n">' + esc(it.num) + '</span><span class="pk-t">' + esc(it.name) +
             (on ? ' · ' + esc(MSG_PICK_CUR) : '') + '</span></button>';
    }).join('') + '</div>';
  });
  h += '<p class="pk-none hidden" id="pk-none">' + esc(MSG_PICK_NONE) + '</p></div>';
  var foot = isR ? '<button class="btn ghost" data-act="moreh-open">' + esc(MSG_MOREH_OPEN) + '</button>'
    : kind === 'shnayim' ? '<button class="btn ghost" data-act="minhag-open">' + esc(MSG_MINHAG_OPEN) + '</button>' +
      '<button class="btn ghost" data-act="special-open">' + esc(MSG_SPECIAL_OPEN) + '</button>' : '';
  openModal(P.title, h, foot);
  var on = sQ('#pk-list .pk-it.on');
  if (on) on.scrollIntoView({ block: 'center' });
}

// החיפוש מסתיר במקום — כותרת שכל שיעוריה הוסתרו יורדת איתם.
// גרש וגרשיים אינם חלק מההשוואה — «יט» מוצא את «י״ט»; כל מילה בחיפוש נמצאת, בכל סדר.
function pickNorm(t) { return String(t || '').replace(/[״׳"']/g, ''); }

function pickerFilter(q) {
  var ws = pickNorm(q).trim().split(/\s+/).filter(Boolean);
  var any = false;
  document.querySelectorAll('#pk-list .pk-grp').forEach(function (g) {
    var shown = 0;
    g.querySelectorAll('.pk-it').forEach(function (b) {
      var hit = ws.every(function (w) { return b.dataset.q.indexOf(w) >= 0; });
      b.classList.toggle('hidden', !hit);
      if (hit) shown++;
    });
    g.classList.toggle('hidden', !shown);
    if (shown) any = true;
  });
  var none = sQ('#pk-none');
  if (none) none.classList.toggle('hidden', any);
}

// ── השיעורים ──
// שיעור פתוח כשיש לו מסך או אפליקציה, או כשאחד מחלקיו פתוח.
function lessonOpen(l) {
  return l.subs ? l.subs.some(lessonOpen) : !!(l.screen || l.app);
}

// קישור שהמעטפת פותחת כאפליקציה אחרת — ובדפדפן באנדרואיד, כרום פותח אותו בעצמו.
function lessonAppHref(l) { return 'intent://launch#Intent;package=' + l.app + ';end'; }

// בחירה בין חלקי השיעור — גיליון מלמטה; חלק בלי תוכן מוצג באפור ואינו נלחץ.
function lessonPickOpen(k) {
  var l = LESSONS.filter(function (x) { return x.k === k; })[0];
  if (!l || !l.subs) { uiNoDialog('lessonPickOpen', k); return; }
  openModal(l.lab, '<div class="lp-list">' + l.subs.map(function (s) {
    if (!s.screen) {
      return '<div class="lp-it off" aria-disabled="true"><span class="lp-t">' + esc(s.lab) + '</span>' +
        '<span class="lp-soon">' + esc(MSG_SOON) + '</span></div>';
    }
    return '<button class="lp-it" data-act="lesson-go" data-id="' + esc(s.screen) + '"><span class="lp-t">' + esc(s.lab) +
      '</span><span class="lp-go">' + icon('down') + '</span></button>';
  }).join('') + '</div>', '');
}

// ── תוספת בראש השיעור ──
// מורה השיעור, מנהגי חב״ד בהפטרות וההפטרה המיוחדת — נפתחים מתחתית הבורר, בראש המסך, ונסגרים ב-✕.
function topSecHTML(id, title) {
  return '<section id="' + id + '" class="moreh read hidden" data-act="read-toggle"><div class="moreh-hd"><h2 id="' + id + '-t">' + esc(title) + '</h2>' +
    '<button class="x-btn" data-act="sec-close" data-id="' + id + '" aria-label="' + esc(MSG_MOREH_CLOSE) + '">' + icon('close') + '</button></div>' +
    '<div class="pages" id="' + id + '-pages"></div></section>';
}

// ── הסריקות ──
// כל הסריקות בתקן אחד — תמונה מוכנה לכל עמוד, ולא קובץ שהמכשיר מפענח.
// p/ — מאגר התניא; yi/ he/ — היום יום; 1/–5/ ו-m/ — החומש וספר המנהגים; laam/ vilna/ — מאגר משנה תורה.
function fileUrl(path) {
  return (/^p\//.test(path) ? TANYA_URL : /^(yi|he)\//.test(path) ? HY_URL : /^([1-5]|m)\//.test(path) ? CH_URL : MT_URL) + path;
}

// שיעור רמב״ם — העמודים מהספרים השלמים של רמב״ם לעם, וההלבנה של השיעור הסמוך מעליהם (RAMBAM_MAP).
function rambamInto(box, i) {
  (RAMBAM_MAP[i] || []).forEach(function (seg) {
    var dir = 'laam/' + RAMBAM_VOLS[seg[0]];
    if (Array.isArray(seg[2]) || typeof seg[1] === 'string') {
      var key = RAMBAM_VOLS[seg[0]] + '/' + seg[1];
      var h = RAMBAM_X[key] || (SCAN[dir] || [])[seg[1] - 1];
      box.appendChild(scanSheet(dir + '/' + seg[1] + '.png', h ? SCAN_W / h : 0.64, seg[2]));
    } else scanInto(box, dir, seg[1], seg[2]);
  });
}

// היחס של כל עמוד בתיקייה — מהמרשם שההמרה כותבת.
function scanRatios(dir) {
  return (SCAN[dir] || []).map(function (h) { return SCAN_W / h; });
}

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// ── גיליון ──
function sheetEl(ratio) {
  var f = el('figure', 'pg');
  var s = el('div', 'leaf');
  // היחס נגזר מהעמוד בזמן ריצה — משתנה CSS, וכלל ה-.sheet הוא שקורא אותו.
  s.style.setProperty('--ratio', String(ratio));
  f.appendChild(s);
  return { fig: f, sheet: s };
}

// תמונה שלא הגיעה — הודעה אחת, ולא אחת לכל עמוד.
var failAt = 0;
function scanFail() {
  if (Date.now() - failAt < 5000) return;
  failAt = Date.now();
  toast(MSG_LOAD_FAIL, null, 'bad');
}

// עמוד סרוק — נטען רק כשהוא מתקרב למסך, ועליו רצועות ההלבנה של מה שאינו שייך לשיעור.
function scanSheet(path, ratio, whites) {
  var sh = sheetEl(ratio);
  var im = new Image();
  im.loading = 'lazy'; im.decoding = 'async'; im.alt = '';
  im.onerror = scanFail;
  im.src = fileUrl(path);
  sh.sheet.appendChild(im);
  (whites || []).forEach(function (r) {
    var w = el('div', 'wh');
    w.style.setProperty('--top', r[0] + '%');
    w.style.setProperty('--h', (r[1] - r[0]) + '%');
    if (r.length > 2) {
      w.style.setProperty('--left', r[2] + '%');
      w.style.setProperty('--w', r[3] + '%');
    }
    sh.sheet.appendChild(w);
  });
  return sh.fig;
}

// כל עמודי תיקייה, או טווח ממנה.
function scanInto(box, dir, from, to) {
  var rs = scanRatios(dir), a = from || 1, b = Math.min(to || rs.length, rs.length);
  for (var k = a; k <= b; k++) box.appendChild(scanSheet(dir + '/' + k + '.png', rs[k - 1]));
}

function tanyaSheet(item) { return scanSheet('p/' + item.p + '.png', 1 / (TANYA_RATIO[item.p] || 1.25), item.w); }

// ── היום יום ──
// הבחירה — מקום היום בספר; הסדר מתשרי עד אלול, וכסלו אחד (א–יח מתש״ד, יט–כט מתש״ג).
var HY_STRIP = 12.5, HY_GAP = 0.6, HY_FOOT = 96.8;
var hyList = null;
function hyOrder() {
  if (hyList) return hyList;
  var at = {}, i = 0;
  HY_MONTHS.forEach(function (m) { for (var d = m[1]; d <= m[2]; d++) at[m[0] + '-' + d] = i++; });
  hyList = [];
  Object.keys(HY_NAMES).forEach(function (m) {
    for (var d = 1; d <= 30; d++) if (at[m + '-' + d] !== undefined) hyList.push({ i: at[m + '-' + d], m: m, d: d });
  });
  return hyList;
}

// ── חומש ──
function chumashCur() { return sPick(KEY_CHUMASH, CH.length); }

function chLabel(i) { return PARSHIOT[Math.floor(i / 7)] + ' · ' + ALIYOT[i % 7]; }

function chumashGroups() {
  return PARSHIOT.map(function (name, k) {
    return { title: name, items: ALIYOT.map(function (a, j) { return { i: k * 7 + j, num: a, name: name }; }) };
  });
}

// עמודי העלייה, שלמים.
function chSheets(i) {
  var r = CH[i], rs = scanRatios(String(r[0])), out = [];
  for (var p = r[1]; p <= r[2]; p++) out.push(scanSheet(r[0] + '/' + p + '.png', rs[p - 1]));
  return out;
}

// ── שניים מקרא ──
function shnayimCur() { return sPick(KEY_SHNAYIM, PARSHIOT.length); }

function shnayimGroups() {
  return TANYA_BOOKS.map(function (b, k) {
    var end = k + 1 < TANYA_BOOKS.length ? TANYA_BOOKS[k + 1][1] : PARSHIOT.length, items = [];
    for (var i = b[1]; i < end; i++) items.push({ i: i, num: String(i + 1), name: PARSHIOT[i] });
    return { title: b[0], items: items };
  });
}

// הפרשה — מתחילת הראשון ועד סוף השביעי, עמודים שלמים.
function shnayimSheets(c) {
  var a = CH[c * 7], b = CH[c * 7 + 6], rs = scanRatios(String(a[0])), out = [];
  for (var p = a[1]; p <= b[2]; p++) out.push(scanSheet(a[0] + '/' + p + '.png', rs[p - 1]));
  return out;
}

// הפטרה — קטעי עמודים, וההלבנה של מה שאינו במנהג.
function haftaraSheets(segs) {
  return (segs || []).map(function (s) {
    var rs = scanRatios(String(s[0]));
    return scanSheet(s[0] + '/' + s[1] + '.png', rs[s[1] - 1], s[2]);
  });
}

function haftaraOf(c) { return HAFTAROT.P[c]; }

function hayomCur() { return sPick(KEY_HAYOM, HY.yi.length); }

function hyPos(i) { return hyOrder().map(function (x) { return x.i; }).indexOf(i); }

function hyLabel(i) { var x = hyOrder()[hyPos(i)]; return hebDayLabel(x.d) + ' ' + HY_NAMES[x.m]; }

// הקודם והבא בסדר השנה — אחרי כ״ט אלול חוזרים לא׳ תשרי.
function hyStep(i, k) { var L = hyOrder(); return L[(hyPos(i) + k + L.length) % L.length].i; }

function hayomGroups() {
  var out = [], last = null;
  hyOrder().forEach(function (x) {
    if (!last || last.m !== x.m) { last = { m: x.m, title: HY_NAMES[x.m], items: [] }; out.push(last); }
    last.items.push({ i: x.i, num: hebDayLabel(x.d), name: HY_NAMES[x.m] });
  });
  return out;
}

// אידיש — עמוד אחד ליום, והימים האחרים מולבנים ברצועות לרוחב העמוד, כי הקווים בסריקה עקומים.
function hyYiSheet(i) {
  var v = HY.yi[i], p = Math.floor(v / 10), slot = v % 10, seps = HY.seps[p] || [], w = [];
  if (slot > 0) seps[slot - 1].forEach(function (y, k) { w.push([0, y, k * HY_STRIP, HY_STRIP]); });
  if (slot < seps.length) seps[slot].forEach(function (y, k) { w.push([y, 100, k * HY_STRIP, HY_STRIP]); });
  return scanSheet('yi/' + p + '.png', scanRatios('yi')[p - 1], w);
}

// עברית — מראש היום עד ראש הבא, גם על פני עמודים; שורת אוצר החכמה שבתחתית מולבנת.
function hyHeSheets(i) {
  var a = HY.he[i], b = HY.he[i + 1] || HY.heEnd, last = b[1] <= 9 ? b[0] - 1 : b[0], out = [];
  for (var p = a[0]; p <= last; p++) {
    var w = [];
    if (p === a[0]) w.push([0, a[1] - HY_GAP]);
    w.push(p === b[0] ? [b[1] - HY_GAP, 100] : [HY_FOOT, 100]);
    out.push(scanSheet('he/' + p + '.png', scanRatios('he')[p - 1], w));
  }
  return out;
}

// ── הגדלה בשתי אצבעות ──
// בזמן הצביטה — transform בלבד, חלק; בסופה הרוחב נקבע, והגלילה מיושרת לנקודת המגע.
var PZ_MAX = 4;
var pz = null;
function pzDist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
function pinchStart(e) {
  if (e.touches.length !== 2) return;
  var box = e.target.closest && e.target.closest('.read .pages');
  if (!box) return;
  var r = box.getBoundingClientRect(), t = e.touches;
  var cx = (t[0].clientX + t[1].clientX) / 2, cy = (t[0].clientY + t[1].clientY) / 2;
  pz = { box: box, d0: pzDist(t), z0: +box.dataset.z || 1, s: 1, cx: cx - r.left, ox: cx - r.left + box.scrollLeft, oy: cy - r.top };
  box.style.transformOrigin = pz.ox + 'px ' + pz.oy + 'px';
}
function pinchMove(e) {
  if (!pz || e.touches.length !== 2) return;
  e.preventDefault();
  var z = Math.min(PZ_MAX, Math.max(1, pz.z0 * pzDist(e.touches) / pz.d0));
  pz.s = z / pz.z0;
  pz.box.style.transform = 'scale(' + pz.s + ')';
}
function pinchEnd() {
  if (!pz) return;
  var p = pz, box = p.box, z = p.z0 * p.s;
  pz = null;
  box.style.transform = '';
  if (Math.abs(p.s - 1) < 0.02) return;
  if (z < 1.05) z = 1;
  box.dataset.z = String(z);
  box.style.setProperty('--z', String(z));
  box.classList.toggle('zoomed', z > 1);
  box.scrollLeft = p.ox * p.s - p.cx;
  window.scrollBy(0, p.oy * (p.s - 1));
}

// הקשה על דף מוגדל מחזירה את כל העמודים לגודלם — ההגדלה נשארת עד צביטה חזרה או עד הקשה.
function pinchReset() {
  var zs = document.querySelectorAll('.read .pages.zoomed');
  zs.forEach(function (box) {
    box.classList.remove('zoomed');
    box.style.removeProperty('--z');
    delete box.dataset.z;
  });
  return zs.length > 0;
}

function tanyaChapter(c) { return TANYA_CHAPTERS[c]; }

export { PICKERS, topSecHTML, haftaraOf, haftaraSheets, shnayimCur, shnayimSheets, chLabel, chSheets, chumashCur, el, fileUrl, hayomCur, hyHeSheets, hyLabel, hyStep, hyYiSheet, lessonAppHref, lessonOpen, lessonPickOpen, localPut, pickerFilter, pinchEnd, pinchMove, pinchReset, pinchStart, pickerOpen, pushSoon, rambamCur, rambamInto, rambamLabel, readBarHTML,
         sLive, sPendKey, sPendKeyOf, sPick, sPickSet, sQ, sStripRows, sSyncNow, sSyncPull,
         scanInto, sTableMeta, tanyaChapName, tanyaChapter, tanyaCur, tanyaLabel, tanyaSheet };
