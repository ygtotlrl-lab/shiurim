// app/screens/tanyay.js — תניא יומי: השיעור של היום לפי מורה השיעור, ואחריו לוח התיקון והערות ותיקונים
import { esc } from '../../core/ui.js';
import { MSG_LUACH, MSG_NEXT_DAY, MSG_NOTES, MSG_NO_LUACH_DAY, MSG_NO_NOTES_DAY, MSG_PREV_DAY, MSG_TANYA_DAY, MSG_YEAR_LEAP, MSG_YEAR_REG } from '../constants.js';
import { el, fixSections, readBarHTML, sQ, tanyaChapter, tanyaSheet, tyCur, tyDay, tyLabel, tyStep } from '../domain.js';

function tanyayScreenHTML() {
  var c = tyCur();
  return readBarHTML('tanyay', MSG_TANYA_DAY, esc(tyLabel(c)) + '<span class="sep">·</span><span class="ps">' +
      esc(c >= 1000 ? MSG_YEAR_LEAP : MSG_YEAR_REG) + '</span>') +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="tanyay-next" data-id="' + tyStep(c, -1) + '">' + esc(MSG_PREV_DAY) + '</button>' +
    '<button class="btn" data-act="tanyay-next" data-id="' + tyStep(c, 1) + '">' + esc(MSG_NEXT_DAY) + '</button></div>';
}

// עמודי השיעור, ומה שלפניו ואחריו מולבן; ואחריהם — לוח התיקון והערות ותיקונים: לכל פרק של לקוטי אמרים שבשיעור — שורותיו,
// ומשאר החלקים — שורות השיעור עצמו (x[4]); בלי שורות — טוסט. עמוד שמופיע פעמיים — בהלבנה המשותפת.
function tanyayFill(box) {
  var x = tyDay(+box.dataset.id), pages = el('div', 'pages'), own = x[4] || [[], []];
  x[2].forEach(function (pg) { pages.appendChild(tanyaSheet({ p: pg[0], w: pg[1] })); });
  var secs = [[MSG_LUACH, 'luach', own[0], MSG_NO_LUACH_DAY], [MSG_NOTES, 'notes', own[1], MSG_NO_NOTES_DAY]].map(function (sec) {
    var items = [];
    x[3].forEach(function (ch) { items = items.concat(tanyaChapter(ch)[sec[1]]); });
    sec[2].forEach(function (it) { items.push({ p: it[0], w: it[1], has: true }); });
    return [sec[0], tyMerge(items.filter(function (it) { return it.has; })), sec[3]];
  });
  fixSections(pages, secs);
  box.appendChild(pages);
}

// עמוד שחוזר — פעם אחת: מולבן רק מה שמולבן בכולם (הלבנות לרוחב העמוד; הלבנה חלקית נשארת בעמוד נפרד).
function tyMerge(items) {
  var out = [];
  items.forEach(function (it) {
    var o = out.find(function (a) { return a.p === it.p && a.has && it.has; });
    var full = function (w) { return w.every(function (r) { return r.length === 2; }); };
    if (!o || !full(o.w) || !full(it.w)) { out.push({ p: it.p, w: it.w, has: it.has }); return; }
    var w = [];
    o.w.forEach(function (a) { it.w.forEach(function (b) { var s = Math.max(a[0], b[0]), e = Math.min(a[1], b[1]); if (e > s) w.push([s, e]); }); });
    o.w = w;
  });
  return out;
}

function tanyayMount() {
  var now = sQ('#now-body');
  if (now) tanyayFill(now);
}

export { tanyayMount, tanyayScreenHTML };
