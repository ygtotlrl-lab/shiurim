// app/domain.js — הבחירה, הסנכרון, ותצוגת העמודים ששני המסכים משתמשים בה
import { kvParse, netTimeout } from '../core/util.js';
import { ctxEpoch, ctxStale, idEq, mergeCore, pendHas, pendMark, pushDirty,
         schedulePush } from '../core/sync.js';
import { MIRROR, mirrorSave } from '../core/mirror.js';
import { logAction } from '../core/backup.js';
import { pullRender, toast } from '../core/ui.js';
import { hebGematria } from '../core/hebrew.js';
import { FILES_URL, KV_TABLE, RAMBAM_URL, MSG_HAKDAMA, MSG_LOADING, MSG_LOAD_FAIL, MSG_PEREK, PARSHIOT, PDFJS_WORKER_URL,
         PUSH_TABLES, RAMBAM_LESSONS, TABLES, TANYA_CHAPTERS, TANYA_RATIO } from './constants.js';
import { S, shell } from './state.js';

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

// ── תוויות ──
function rambamLabel(i) { return hebGematria(i + 1, '') + '. ' + RAMBAM_LESSONS[i][0]; }

function tanyaChapName(c) { return c === 0 ? MSG_HAKDAMA : MSG_PEREK + hebGematria(c, ''); }

function tanyaLabel(c) { return PARSHIOT[c] + ' — ' + tanyaChapName(c); }

// ── הקבצים ──
// r/ ו-v/ — מאגר הרמב״ם; כל השאר — מאגר הקבצים.
function fileUrl(path) { return (/^[rv]\//.test(path) ? RAMBAM_URL : FILES_URL) + path; }

function rambamFile(i) { return 'r/' + String(i + 1).padStart(3, '0') + '.pdf'; }

// ── pdf.js ──
var pdfjsP = null;

// הספרייה נטענת בתג שבראש המסמך, והעובד נבנה מ-blob — עובד ממקור זר נחסם בדפדפן.
function pdfjs() {
  if (pdfjsP) return pdfjsP;
  var lib = window.pdfjsLib;
  if (!lib) return Promise.reject(new Error('pdfjsLib חסר'));
  pdfjsP = fetch(PDFJS_WORKER_URL).then(function (r) { return r.text(); }).then(function (t) {
    lib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([t], { type: 'text/javascript' }));
    return lib;
  });
  pdfjsP.catch(function () { pdfjsP = null; });
  return pdfjsP;
}

var docCache = {};

function pdfDoc(path) {
  if (!docCache[path]) {
    docCache[path] = pdfjs().then(function (lib) { return lib.getDocument({ url: fileUrl(path) }).promise; });
    docCache[path].catch(function () { delete docCache[path]; });
  }
  return docCache[path];
}

// עמוד מצויר רק כשהוא מתקרב למסך — שיעור של עשרות עמודים אינו מצויר כולו בפתיחה.
var drawObs = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (!e.isIntersecting) return;
    drawObs.unobserve(e.target);
    if (e.target._draw) e.target._draw();
  });
}, { rootMargin: '600px 0px' }) : null;

function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// ── גיליון ──
function sheetEl(ratio, zoom) {
  var f = el('figure', 'pg' + (zoom ? ' pg-zoom' : ''));
  var s = el('div', 'leaf');
  // היחס נגזר מהעמוד בזמן ריצה — משתנה CSS, וכלל ה-.sheet הוא שקורא אותו.
  s.style.setProperty('--ratio', String(ratio));
  if (zoom) f.setAttribute('data-act', 'page-zoom');
  f.appendChild(s);
  return { fig: f, sheet: s };
}

// כל עמודי קובץ PDF אחד, או טווח ממנו — מצוירים לתוך box.
function pdfInto(box, path, from, to, minW, zoom) {
  var ld = el('div', 'loading', MSG_LOADING);
  box.appendChild(ld);
  return pdfDoc(path).then(function (doc) {
    ld.remove();
    var a = from || 1, b = Math.min(to || doc.numPages, doc.numPages), chain = Promise.resolve();
    function one(k) {
      return doc.getPage(k).then(function (pg) {
        var vp = pg.getViewport({ scale: 1 });
        var sh = sheetEl(vp.width / vp.height, zoom);
        box.appendChild(sh.fig);
        sh.sheet._draw = function () {
          var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
          var w = Math.max((sh.sheet.clientWidth || 600) * dpr, minW || 0);
          var v = pg.getViewport({ scale: w / vp.width });
          var c = document.createElement('canvas');
          c.width = Math.round(v.width); c.height = Math.round(v.height);
          return pg.render({ canvasContext: c.getContext('2d'), viewport: v }).promise
            .then(function () { sh.sheet.appendChild(c); });
        };
        if (drawObs) drawObs.observe(sh.sheet); else sh.sheet._draw();
      });
    }
    for (var k = a; k <= b; k++) chain = chain.then(one.bind(null, k));
    return chain;
  }).catch(function (e) {
    console.error('[pdf] ' + path, e);
    ld.textContent = MSG_LOAD_FAIL;
    toast(MSG_LOAD_FAIL, null, 'bad');
  });
}

// עמוד תניא — תמונה, ועליה רצועות ההלבנה של מה שאינו שייך לפרק.
function tanyaSheet(item) {
  var sh = sheetEl(1 / (TANYA_RATIO[item.p] || 1.25), false);
  var im = new Image();
  im.loading = 'lazy'; im.decoding = 'async'; im.alt = '';
  im.src = fileUrl('p/' + item.p + '.png');
  sh.sheet.appendChild(im);
  item.w.forEach(function (r) {
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

function tanyaChapter(c) { return TANYA_CHAPTERS[c]; }

export { el, fileUrl, localPut, pdfInto, pushSoon, rambamFile, rambamLabel,
         sLive, sPendKey, sPendKeyOf, sPick, sPickSet, sQ, sStripRows, sSyncNow, sSyncPull,
         sTableMeta, tanyaChapName, tanyaChapter, tanyaLabel, tanyaSheet };
