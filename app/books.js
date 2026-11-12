// app/books.js — מנוע הספרים: תנ״ך, החסידישע פרשה, משניות, שולחן ערוך הרב, עין יעקב, סידור ותהלים
// כל ספר — רשומה ב-BOOKS (app/data.js): קבוצות, ובכל קבוצה פריטים, ולכל פריט קטעי עמודים.
// קטע — [תיקייה, עמוד, הלבנות] לעמוד אחד, או [תיקייה, מעמוד, עד עמוד] לטווח שלם בלי הלבנה.
import { esc, openModal, toast } from '../core/ui.js';
import { hebDate, hebGematria, hebIsLeap, hebMonthNames, hebToGreg, hebYearLabelFull } from '../core/hebrew.js';
import { MSG_TH_PEOPLE_TITLE, MSG_TH_PEOPLE_ADD, MSG_TH_PEOPLE_NAME, MSG_TH_PEOPLE_DATE, MSG_TH_DAY, MSG_TH_MONTH, MSG_TH_YEAR, MSG_TH_PEOPLE_NONE, MSG_TH_PEOPLE_DEL, MSG_TH_PEOPLE_SAVE, MSG_TH_PEOPLE_OPEN, MSG_PEREK, KEY_TH_PEOPLE } from './constants.js';

import { tehillimAddThirty } from './calendar.js';
import { el, readBarHTML, sPick, sPickRawAny, sPickSet, sQ, scanSheet, ttSheets } from './domain.js';
import { icon } from './icons.js';
import { BOOKS, BOOK_SCAN, SCAN, TH_CHAPTERS } from './data.js';

// ── מרשם ──
function bookOf(screen) { var k = String(screen || '').replace(/^bk-/, ''); return BOOKS[k] || null; }
function bookKey(b) { return 'bk_' + b.k; }

// הפריטים בשורה אחת — המקום של כל פריט הוא הבחירה שנשמרת.
function bookItems(b) {
  if (b._items) return b._items;
  var out = [];
  b.groups.forEach(function (g) { g[1].forEach(function (it) { out.push({ g: g[0], lab: it[0], segs: it[1], fix: it[2] }); }); });
  b._items = out;
  return out;
}

function bookCur(b) { return sPick(bookKey(b), bookItems(b).length); }

function bookGroups(b) {
  var i = 0;
  return b.groups.map(function (g) {
    // 'daf' — הש״ס: הדף במקום המספר («ב»), והעמוד בשם («ע״א»), כמו מספר השיעור ושמו ברמב״ם.
    return { title: g[0], items: g[1].map(function (it, j) {
      if (b.num === 'daf') { var d = it[0].split(' '); return { i: i++, num: d[0], name: d.slice(1).join(' ') }; }
      return { i: i++, num: b.num === 'none' ? '' : hebGematria(j + 1, ''), name: b.split ? it[0].split(' · ')[1] : it[0] };
    }) };
  });
}

function bookLabel(b, i) {
  var it = bookItems(b)[i];
  return it ? (b.solo ? it.lab : it.g + ' · ' + it.lab) : '';
}

// ── העמודים ──
function bookRatio(dir, p) {
  var hs = BOOK_SCAN[dir] || SCAN[dir] || [];
  return hs[p - 1] ? 1600 / hs[p - 1] : 0.64;
}

function segSheets(segs, shade) {
  var out = [];
  (segs || []).forEach(function (s) {
    if (typeof s[2] === 'number') {
      for (var p = s[1]; p <= s[2]; p++) out.push.apply(out, ttSheets(s[0], p, bookRatio(s[0], p), shade));
    } else out.push(scanSheet(s[0] + '/' + s[1] + '.png', bookRatio(s[0], s[1]), s[2], shade));
  });
  return out;
}

// ── המסך ──
function bookScreenHTML(screen) {
  var b = bookOf(screen);
  if (b.people) return thPeopleScreenHTML(b);
  var c = bookCur(b), n = bookItems(b).length;
  return readBarHTML(screen, b.title, esc(bookLabel(b, c))) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="bk-next" data-k="' + screen + '" data-id="' + ((c + n - 1) % n) + '">' + esc(b.prev) + '</button>' +
    '<button class="btn" data-act="bk-next" data-k="' + screen + '" data-id="' + ((c + 1) % n) + '">' + esc(b.next) + '</button></div>';
}

function bookMount(screen) {
  var b = bookOf(screen), now = sQ('#now-body');
  if (!now) return;
  if (b.people) { thPeopleMount(b, now); return; }
  var it = bookItems(b)[+now.dataset.id], pages = el('div', 'pages');
  segSheets(it.segs, b.shade).forEach(function (f) { pages.appendChild(f); });
  // תהלים יומי — בכ״ט בחודש חסר אומרים גם את הפרקים של ל׳.
  if (b.k === 'thd' && +now.dataset.id === 28 && tehillimAddThirty()) {
    var t = bookItems(b)[29], hd = el('div', 'sect');
    hd.appendChild(el('h3', null, t.lab.split(' · ')[0]));
    pages.appendChild(hd);
    segSheets(t.segs, b.shade).forEach(function (f) { pages.appendChild(f); });
  }
  now.appendChild(pages);
  if (b.fixT && it.fix) bookFix(b, it.fix, pages);
}

// לוח התיקון והערות ותיקונים — כמו בתניא: כותרת ועמודים רק כשיש שורות למאמר, ובלעדיהן טוסט כשסוף המאמר נכנס למסך.
function bookFix(b, fix, pages) {
  var empty = [];
  b.fixT.forEach(function (t) {
    var segs = fix[t[1]] || [];
    if (!segs.length) { empty.push(t[2]); return; }
    var hd = el('div', 'sect');
    hd.appendChild(el('h3', null, t[0]));
    pages.appendChild(hd);
    segSheets(segs, false).forEach(function (f) { pages.appendChild(f); });
  });
  var end = sQ('.read-end');
  if (!empty.length || !end || !('IntersectionObserver' in window)) return;
  // חצי לפחות — כמו ב-fixSections: העמוד הסמוך ברצועה נוגע במסך בשבר פיקסל.
  var io = new IntersectionObserver(function (es) {
    if (!es.some(function (e) { return e.isIntersecting && e.intersectionRatio >= 0.5; })) return;
    io.disconnect();
    empty.forEach(function (m, i) { setTimeout(function () { toast(m, 5000); }, i * 1200); });
  }, { threshold: 0.5 });
  io.observe(end);
}

// ── תהלים — פרקים אישיים ──
// לכל אדם — שם ותאריך לידה עברי (יום · חודש · שנה). הפרק — מספר השנים שמלאו ועוד אחד, והוא מתחלף
// ביום ההולדת העברי, עם השקיעה שלפניו; סדר האנשים — כפי שנגרר בהגדרה.
// החודשים בשם ולא במספר — מספר החודש תלוי בשנה (אדר א׳ וב׳); אדר של שנה רגילה — אדר ב׳ בשנה מעוברת.
var TH_MONTHS = ['תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א׳', 'אדר ב׳', 'ניסן', 'אייר', 'סיון', 'תמוז', 'מנחם אב', 'אלול'];

function thMonthIndex(name, hy) {
  var names = hebMonthNames(hy);
  if (hebIsLeap(hy)) { if (name === 'אדר') name = 'אדר ב׳'; }
  else if (name === 'אדר א׳' || name === 'אדר ב׳') name = 'אדר';
  return names.indexOf(name);
}

// רשומה ישנה — יום לידה לועזי ו«אחרי השקיעה» — מומרת לתאריך העברי שלה.
function thFromGreg(p) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.d || '');
  if (!m) return null;
  var d = new Date(+m[1], +m[2] - 1, +m[3], 12);
  if (p.night) d.setDate(d.getDate() + 1);
  var h = hebDate(d);
  return h.ok ? { n: p.n || '', hy: h.year, hm: h.monthName, hd: h.day } : null;
}

function thPeople() {
  var v = sPickRawAny(KEY_TH_PEOPLE);
  if (!Array.isArray(v)) return [];
  return v.map(function (p) { return p && p.hy ? p : (p && p.d ? thFromGreg(p) : null); })
    .filter(function (p) { return p && p.hy && p.hm && p.hd; });
}

// השקיעה בירושלים (NOAA, מקורב לדקות) — היום העברי מתחלף בה.
function thSunset(d) {
  var lat = 31.78 * Math.PI / 180, lon = 35.22;
  var start = Date.UTC(d.getFullYear(), 0, 0), doy = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 864e5);
  var g = 2 * Math.PI / 365 * (doy - 1 + 0.5);
  var eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  var dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  var ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec)) * 180 / Math.PI;
  var utcMin = 720 - 4 * (lon - ha) - eq;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + utcMin * 6e4);
}

// היום העברי עכשיו — אחרי השקיעה כבר היום הבא.
function thHebNow(now) {
  now = now || new Date();
  var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (now >= thSunset(now)) d.setDate(d.getDate() + 1);
  return d;
}

function thChapterOf(p, now) {
  var day = thHebNow(now), t = hebDate(day);
  if (!t.ok) return null;
  var years = t.year - p.hy, mi = thMonthIndex(p.hm, t.year);
  var bd = mi >= 0 ? hebToGreg(t.year, mi, p.hd) : null;
  if (bd && day < bd) years--;
  var ch = years + 1;
  return ch >= 1 && ch <= 150 ? ch : null;
}

function thPeopleScreenHTML(b) {
  return readBarHTML('bk-' + b.k, b.title, esc(b.label)) +
    '<div class="lesson read" id="now-body" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn" data-act="th-people-open">' + esc(MSG_TH_PEOPLE_OPEN) + '</button></div>';
}

function thPeopleMount(b, now) {
  var ps = thPeople(), pages = el('div', 'pages');
  if (!ps.length) { now.appendChild(el('p', 'th-none', MSG_TH_PEOPLE_NONE)); return; }
  ps.forEach(function (p) {
    var ch = thChapterOf(p);
    if (!ch) return;
    var hd = el('div', 'sect');
    hd.appendChild(el('h3', null, (p.n ? p.n + ' — ' : '') + MSG_PEREK + hebGematria(ch, '')));
    pages.appendChild(hd);
    segSheets(TH_CHAPTERS[ch - 1], false).forEach(function (f) { pages.appendChild(f); });
  });
  now.appendChild(pages);
}

// הגדרת האנשים — גיליון: שורה לכל אדם עם ידית גרירה — שם, ותאריך לידה עברי בשלוש בחירות; שורה להוספה בתחתית.
function thOpts(vals, labs, cur) {
  return vals.map(function (v, i) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(labs[i]) + '</option>'; }).join('');
}

function thRowHTML(p, i) {
  var days = [], years = [], thisY = hebDate(new Date()).year || 5787;
  for (var d = 1; d <= 30; d++) days.push(d);
  for (var y = thisY; y >= 5640; y--) years.push(y);
  return '<div class="thp-row" data-i="' + i + '"><span class="thp-grip" aria-hidden="true">⋮⋮</span>' +
    '<input class="thp-n" data-f="n" value="' + esc(p.n || '') + '" placeholder="' + esc(MSG_TH_PEOPLE_NAME) + '">' +
    '<div class="thp-d" role="group" aria-label="' + esc(MSG_TH_PEOPLE_DATE) + '">' +
    '<select data-f="hd">' + '<option value="">' + esc(MSG_TH_DAY) + '</option>' + thOpts(days, days.map(function (x) { return hebGematria(x); }), p.hd) + '</select>' +
    '<select data-f="hm">' + '<option value="">' + esc(MSG_TH_MONTH) + '</option>' + thOpts(TH_MONTHS, TH_MONTHS, p.hm) + '</select>' +
    '<select data-f="hy">' + '<option value="">' + esc(MSG_TH_YEAR) + '</option>' + thOpts(years, years.map(hebYearLabelFull), p.hy) + '</select></div>' +
    '<button class="x-btn" data-act="th-people-del" data-id="' + i + '" aria-label="' + esc(MSG_TH_PEOPLE_DEL) + '">' + icon('close') + '</button></div>';
}

function thPeopleOpen() {
  var ps = thPeople();
  if (!ps.length) ps = [{ n: '', hy: '', hm: '', hd: '' }];
  openModal(MSG_TH_PEOPLE_TITLE, '<div class="thp-wrap"><div class="thp-list" id="thp-list">' + ps.map(thRowHTML).join('') + '</div>' +
    '<button class="btn ghost" data-act="th-people-add">' + esc(MSG_TH_PEOPLE_ADD) + '</button></div>',
    '<button class="btn" data-act="th-people-save">' + esc(MSG_TH_PEOPLE_SAVE) + '</button>');
  thDragWire();
}

function thPeopleRead() {
  var out = [];
  document.querySelectorAll('#thp-list .thp-row').forEach(function (r) {
    var f = function (k) { return r.querySelector('[data-f=' + k + ']').value; };
    var p = { n: f('n').trim(), hy: +f('hy') || 0, hm: f('hm'), hd: +f('hd') || 0 };
    if (p.hy && p.hm && p.hd) out.push(p);
  });
  return out;
}

function thPeopleAdd() {
  var l = sQ('#thp-list');
  if (!l) return;
  l.insertAdjacentHTML('beforeend', thRowHTML({ n: '', hy: '', hm: '', hd: '' }, l.children.length));
  l.lastElementChild.scrollIntoView({ block: 'nearest' });
  thDragWire();
}

function thPeopleDel(i) {
  var r = sQ('#thp-list .thp-row[data-i="' + i + '"]');
  if (r) r.remove();
}

function thPeopleSave() { sPickSet(KEY_TH_PEOPLE, thPeopleRead()); }

// גרירה מהידית — בעכבר ובמגע; הסדר נקרא מה-DOM בשמירה.
function thDragWire() {
  var l = sQ('#thp-list');
  if (!l || l.dataset.wired) return;
  l.dataset.wired = '1';
  var drag = null;
  // הגרירה ב-Pointer Events, מהידית בלבד; הסדר נגזר מה-DOM הסופי בשמירה.
  l.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('.thp-grip')) return;
    drag = e.target.closest('.thp-row');
    if (!drag) return;
    drag.classList.add('drag');
    e.target.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  l.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var over = document.elementFromPoint(e.clientX, e.clientY);
    over = over && over.closest('.thp-row');
    if (!over || over === drag || over.parentNode !== l) return;
    var r = over.getBoundingClientRect();
    l.insertBefore(drag, e.clientY > r.top + r.height / 2 ? over.nextSibling : over);
  });
  function end() { if (drag) drag.classList.remove('drag'); drag = null; }
  l.addEventListener('pointerup', end);
  l.addEventListener('pointercancel', end);
}

// ── הבוררים ──
function bookPickers() {
  var out = {};
  Object.keys(BOOKS).forEach(function (k) {
    var b = BOOKS[k];
    if (b.people) return;
    out['bk-' + k] = { key: bookKey(b), cur: function () { return bookCur(b); }, groups: function () { return bookGroups(b); }, title: b.pick };
  });
  return out;
}

export { bookCur, bookMount, bookOf, bookPickers, bookScreenHTML, thChapterOf, thPeopleAdd, thPeopleDel, thPeopleOpen, thPeopleSave };
