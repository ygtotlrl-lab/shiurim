// app/books.js — מנוע הספרים: תנ״ך, החסידישע פרשה, משניות, שולחן ערוך הרב, עין יעקב, סידור ותהלים
// כל ספר — רשומה ב-BOOKS (bookdata.js): קבוצות, ובכל קבוצה פריטים, ולכל פריט קטעי עמודים.
// קטע — [תיקייה, עמוד, הלבנות] לעמוד אחד, או [תיקייה, מעמוד, עד עמוד] לטווח שלם בלי הלבנה.
import { esc, openModal, toast } from '../core/ui.js';
import { hebDate, hebGematria, hebIsLeap, hebToGreg } from '../core/hebrew.js';
import { BOOKS, BOOK_SCAN, MSG_TH_PEOPLE_TITLE, MSG_TH_PEOPLE_ADD, MSG_TH_PEOPLE_NAME, MSG_TH_PEOPLE_DATE, MSG_TH_PEOPLE_NIGHT,
         MSG_TH_PEOPLE_NONE, MSG_TH_PEOPLE_DEL, MSG_TH_PEOPLE_SAVE, MSG_TH_PEOPLE_OPEN, MSG_PEREK, KEY_TH_PEOPLE, TH_CHAPTERS } from './bookdata.js';
import { SCAN } from './constants.js';
import { el, readBarHTML, sPick, sPickRawAny, sPickSet, sQ, scanSheet } from './domain.js';

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
    return { title: g[0], items: g[1].map(function (it, j) { return { i: i++, num: b.num === 'none' ? '' : hebGematria(j + 1, ''), name: b.split ? it[0].split(' · ')[1] : it[0] }; }) };
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
      for (var p = s[1]; p <= s[2]; p++) out.push(scanSheet(s[0] + '/' + p + '.png', bookRatio(s[0], p), null, shade));
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
  var io = new IntersectionObserver(function (es) {
    if (!es.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    empty.forEach(function (m, i) { setTimeout(function () { toast(m, 5000); }, i * 1200); });
  });
  io.observe(end);
}

// ── תהלים — פרקים אישיים ──
// לכל אדם — שם ויום לידה לועזי, ו«אחרי השקיעה» מעביר ליום העברי הבא. הפרק — מספר השנים שמלאו ועוד אחד,
// והוא מתחלף ביום ההולדת העברי; סדר האנשים — כפי שנגרר בהגדרה.
function thPeople() {
  var v = sPickRawAny(KEY_TH_PEOPLE);
  return Array.isArray(v) ? v.filter(function (p) { return p && p.d; }) : [];
}

function thHebBirth(p) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.d || '');
  if (!m) return null;
  var d = new Date(+m[1], +m[2] - 1, +m[3], 12);
  if (p.night) d.setDate(d.getDate() + 1);
  var h = hebDate(d);
  return h.ok ? { y: h.year, mi: h.monthIndex, day: h.day, leap: hebIsLeap(h.year) } : null;
}

// החודש של יום ההולדת בשנה נתונה — אדר בשנה רגילה הוא אדר ב׳ בשנה מעוברת, ואדר א׳ וב׳ — אדר בשנה רגילה.
function thMonthIn(b, hy) {
  var leapNow = hebIsLeap(hy), mi = b.mi;
  if (b.leap && !leapNow) return mi >= 6 ? mi - 1 : mi;
  if (!b.leap && leapNow) return mi >= 5 ? mi + 1 : mi;
  return mi;
}

function thChapterOf(p, today) {
  var b = thHebBirth(p), t = hebDate(today || new Date());
  if (!b || !t.ok) return null;
  var years = t.year - b.y;
  var bd = hebToGreg(t.year, thMonthIn(b, t.year), b.day);
  var now = new Date(today || new Date()); now.setHours(12, 0, 0, 0);
  if (bd && now < bd) years--;
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

// הגדרת האנשים — גיליון: שורה לכל אדם עם ידית גרירה, ושורה להוספה בתחתית.
function thRowHTML(p, i) {
  return '<div class="thp-row" data-i="' + i + '"><span class="thp-grip" aria-hidden="true">⋮⋮</span>' +
    '<input class="thp-n" data-f="n" value="' + esc(p.n || '') + '" placeholder="' + esc(MSG_TH_PEOPLE_NAME) + '">' +
    '<input class="thp-d" data-f="d" type="date" value="' + esc(p.d || '') + '" aria-label="' + esc(MSG_TH_PEOPLE_DATE) + '">' +
    '<label class="thp-night"><input type="checkbox" data-f="night"' + (p.night ? ' checked' : '') + '>' + esc(MSG_TH_PEOPLE_NIGHT) + '</label>' +
    '<button class="x-btn" data-act="th-people-del" data-id="' + i + '" aria-label="' + esc(MSG_TH_PEOPLE_DEL) + '">✕</button></div>';
}

function thPeopleOpen() {
  var ps = thPeople();
  if (!ps.length) ps = [{ n: '', d: '', night: false }];
  openModal(MSG_TH_PEOPLE_TITLE, '<div class="thp-list" id="thp-list">' + ps.map(thRowHTML).join('') + '</div>' +
    '<button class="btn ghost" data-act="th-people-add">' + esc(MSG_TH_PEOPLE_ADD) + '</button>',
    '<button class="btn" data-act="th-people-save">' + esc(MSG_TH_PEOPLE_SAVE) + '</button>');
  thDragWire();
}

function thPeopleRead() {
  var out = [];
  document.querySelectorAll('#thp-list .thp-row').forEach(function (r) {
    var p = { n: r.querySelector('[data-f=n]').value.trim(), d: r.querySelector('[data-f=d]').value, night: r.querySelector('[data-f=night]').checked };
    if (p.d) out.push(p);
  });
  return out;
}

function thPeopleAdd() {
  var l = sQ('#thp-list');
  if (!l) return;
  l.insertAdjacentHTML('beforeend', thRowHTML({ n: '', d: '', night: false }, l.children.length));
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
