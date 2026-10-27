// app/domain.js — הבחירה, הסנכרון, ותצוגת העמודים ששני המסכים משתמשים בה
import { kvParse, netTimeout } from '../core/util.js';
import { ctxEpoch, ctxStale, idEq, mergeCore, pendHas, pendMark, pushDirty,
         schedulePush } from '../core/sync.js';
import { MIRROR, mirrorSave } from '../core/mirror.js';
import { logAction } from '../core/backup.js';
import { esc, openModal, pullRender, toast, uiNoDialog } from '../core/ui.js';
import { hebGematria } from '../core/hebrew.js';
import { KEY_RAMBAM, KEY_TANYA, KV_TABLE, MSG_HAKDAMA, MSG_LOAD_FAIL,
         MSG_HOME_BACK, MSG_MOREH_OPEN, MSG_PEREK, MSG_PICK_CUR, MSG_PICK_NONE, MSG_PICK_PARASHA_TITLE, MSG_PICK_SEARCH,
         MSG_PICK_TITLE, MSG_RAMBAM_OPENING, PARSHIOT, PUSH_TABLES, RAMBAM_LESSONS, RAMBAM_URL, SCAN, SCAN_W, TABLES,
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

// סרגל הקריאה — חזרה לסדר הלימוד, ושם השיעור שפותח את הבחירה.
function readBarHTML(kind, kicker, title) {
  return '<div class="readbar" id="readbar"><div class="in">' +
    '<button class="rb-home" data-act="go-home" aria-label="' + esc(MSG_HOME_BACK) + '">' + icon('home') + '</button>' +
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

function pickerOpen(kind) {
  var isR = kind === 'rambam';
  var cur = isR ? rambamCur() : tanyaCur();
  var h = '<label class="pk-search">' + icon('search') + '<input type="search" data-inp="pick-q" aria-label="' +
          esc(MSG_PICK_SEARCH) + '" placeholder="' + esc(MSG_PICK_SEARCH) + '"></label><div class="pk-list" id="pk-list">';
  (isR ? rambamGroups() : tanyaGroups()).forEach(function (g) {
    h += '<div class="pk-grp"><div class="pk-gt">' + esc(g.title) + '</div>' + g.items.map(function (it) {
      var on = it.i === cur;
      return '<button class="pk-it' + (on ? ' on' : '') + '" data-act="pick-go" data-k="' + kind + '" data-id="' + it.i +
             '" data-q="' + esc(g.title + ' ' + it.num + ' ' + it.name + ' ' + (it.i + 1)) + '">' +
             '<span class="pk-n">' + esc(it.num) + '</span><span class="pk-t">' + esc(it.name) +
             (on ? ' · ' + esc(MSG_PICK_CUR) : '') + '</span></button>';
    }).join('') + '</div>';
  });
  h += '<p class="pk-none hidden" id="pk-none">' + esc(MSG_PICK_NONE) + '</p></div>';
  openModal(isR ? MSG_PICK_TITLE : MSG_PICK_PARASHA_TITLE, h,
            isR ? '<button class="btn ghost" data-act="moreh-open">' + esc(MSG_MOREH_OPEN) + '</button>' : '');
  var on = sQ('#pk-list .pk-it.on');
  if (on) on.scrollIntoView({ block: 'center' });
}

// החיפוש מסתיר במקום — כותרת שכל שיעוריה הוסתרו יורדת איתם.
function pickerFilter(q) {
  q = String(q || '').trim();
  var any = false;
  document.querySelectorAll('#pk-list .pk-grp').forEach(function (g) {
    var shown = 0;
    g.querySelectorAll('.pk-it').forEach(function (b) {
      var hit = !q || b.dataset.q.indexOf(q) >= 0;
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
        '<span class="toc-soon">' + esc(MSG_SOON) + '</span></div>';
    }
    return '<button class="lp-it" data-act="lesson-go" data-id="' + esc(s.screen) + '"><span class="lp-t">' + esc(s.lab) +
      '</span><span class="toc-go">' + icon('down') + '</span></button>';
  }).join('') + '</div>', '');
}

// ── הסריקות ──
// כל הסריקות בתקן אחד — תמונה מוכנה לכל עמוד, ולא קובץ שהמכשיר מפענח.
// p/ — מאגר התניא; כל השאר — מאגר הרמב״ם.
function fileUrl(path) { return (/^p\//.test(path) ? TANYA_URL : RAMBAM_URL) + path; }

function rambamDir(i) { return 'r/' + String(i + 1).padStart(3, '0'); }

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

export { el, fileUrl, lessonAppHref, lessonOpen, lessonPickOpen, localPut, pickerFilter, pinchEnd, pinchMove, pinchReset, pinchStart, pickerOpen, pushSoon, rambamCur, rambamDir, rambamLabel, readBarHTML,
         sLive, sPendKey, sPendKeyOf, sPick, sPickSet, sQ, sStripRows, sSyncNow, sSyncPull,
         scanInto, sTableMeta, tanyaChapName, tanyaChapter, tanyaCur, tanyaLabel, tanyaSheet };
