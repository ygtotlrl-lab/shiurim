// app/screens/home.js — מדף הספרים שממנו נכנסים לכל שיעור
import { esc, openModal } from '../../core/ui.js';
import { HEB_DOW, hebDate } from '../../core/hebrew.js';
import { lsGet, lsSet } from '../../core/storage.js';
import { LESSONS, LINKS, MSG_BOOKS_TITLE, MSG_DND, MSG_DND_OFF, MSG_DND_ON, MSG_HOME_TITLE, MSG_SOON } from '../constants.js';
import { lessonAppHref, lessonOpen } from '../domain.js';

// ── המדף ──
// שתי קומות: בעליונה השיעורים הראשונים של LESSONS, ובתחתונה השאר ואחריהם הקישורים — הסדר מימין לשמאל.
var TOP_N = 6;

// שדרה לכל ספר: עור בצבעו והטבעת זהב כשהוא פתוח, ובד בהיר ו«בקרוב» כשאין לו תוכן.
// שיעור עם מסך או עם חלקים יוצא מהמדף, ואפליקציה אחרת או אתר — קישור.
// cur — המסך הפתוח, כשהמדף בגיליון «החלפת ספר»: הספר שלו בטבעת זהב, והלחיצה עוברת ישר — בלי היציאה מהמדף.
function spineHTML(l, lean, cur) {
  var st = ' style="--w:' + l.sp[0] + 'px;--h:' + l.sp[1] + '%"';
  var t = '<span class="sp-band"></span><span class="sp-t">' + esc(l.lab) + '</span>';
  var cls = 'spine' + (lean ? ' lean' : '');
  if (!lessonOpen(l) && !l.url) {
    return '<div class="' + cls + ' off" aria-disabled="true"' + st + '>' + t + '<span class="sp-m">' + esc(MSG_SOON) + '</span><span class="sp-band bot"></span></div>';
  }
  cls += ' cv-' + l.cover + (cur && lessonHas(l, cur) ? ' cur' : '');
  var end = '<span class="sp-band bot"></span>';
  if (l.app || l.url) {
    return '<a class="' + cls + '" href="' + esc(l.app ? lessonAppHref(l) : l.url) + '"' + st + '>' + t + end + '</a>';
  }
  var act = !cur ? 'shelf-open' : l.subs ? 'lesson-pick' : 'tab-go', id = !cur || l.subs ? l.k : l.screen;
  return '<button class="' + cls + '" data-act="' + act + '" data-id="' + esc(id) + '"' + st + '>' + t + end + '</button>';
}

function shelfHTML(list, lean, cur) {
  return '<div class="shelf-unit"><div class="cubby">' + list.map(function (l, i) { return spineHTML(l, lean && i === list.length - 1, cur); }).join('') +
    '</div><div class="plank"></div></div>';
}
// שתי הקומות — בבית ובגיליון «החלפת ספר» אחת הן.
function shelvesHTML(cur) {
  var all = LESSONS.concat(LINKS);
  return '<div class="shelves' + (cur ? ' in-sheet' : '') + '">' + shelfHTML(all.slice(0, TOP_N), true, cur) + shelfHTML(all.slice(TOP_N), false, cur) + '</div>';
}

// ── החלפת ספר מתוך שיעור ──
// אותו מדף בשתי קומות, בגיליון מלמטה, והספר הפתוח בטבעת זהב.
function lessonHas(l, screen) {
  return l.screen === screen || (l.subs || []).some(function (s) { return s.screen === screen; });
}
function booksPick(screen) {
  openModal(MSG_BOOKS_TITLE, shelvesHTML(screen || 'home'), '');
}

// התאריך העברי של היום — מתחת לכותרת: היום בשבוע, התאריך והשנה.
// התאריך הוא של היום האזרחי — אינו מתחלף בשקיעה.
function todayHTML() {
  var d = new Date(), h = hebDate(d);
  if (!h.ok) return '';
  return '<div class="shelf-date">' + esc('יום ' + HEB_DOW[d.getDay()] + ' · ' + h.dayLabel + ' ' + h.monthName + ' · ') + '<b>' + esc(h.yearLabelFull) + '</b></div>';
}

// השתקת התראות בזמן לימוד — רק באפליקציה המותקנת: המעטפת קולטת את הקישור ומדליקה «נא לא להפריע» כשהיא בחזית.
// הבחירה נזכרת גם כאן, כדי שהמתג יציג אותה.
var DND_KEY = 's_dnd';
function dndHTML() {
  if (!/\bwv\b/.test(navigator.userAgent)) return '';
  var on = lsGet(DND_KEY, '') === '1';
  return '<a class="shelf-dnd" href="app-dnd:' + (on ? 'off' : 'on') + '">' + esc(MSG_DND) + ' · <b>' + esc(on ? MSG_DND_ON : MSG_DND_OFF) + '</b></a>';
}
function dndToggle() { lsSet(DND_KEY, lsGet(DND_KEY, '') === '1' ? '' : '1'); }

// הלוגו הוא הנכס שהמחולל מייצר — ציור שני של המאסטר היה מקור אמת שני.
function homeScreenHTML() {
  return '<section class="shelf-pg"><header class="shelf-hd"><div class="shelf-tl"><img src="icons/icon-192.361ec026.png" alt="" width="36" height="36">' +
    '<h1>' + esc(MSG_HOME_TITLE) + '</h1></div>' + todayHTML() + '</header>' + shelvesHTML() + dndHTML() + '</section>';
}

// ── הספר יוצא מהמדף ──
// השדרה מתרוממת, הספר יוצא למרכז המסך, הכריכה נפתחת והדף מתפרש על כל המסך — פחות משנייה בסך הכל;
// וכשמבקשים להפחית תנועה — בלי תנועה כלל. שיעור בעל חלקים עוצר במרכז, ובחירת החלק בגיליון ממשיכה את הפתיחה.
var T_LIFT = 110, T_FLY = 280, T_OPEN = 280, T_FULL = 220, T_FADE = 160;
var bk = null; // הספר שבדרך: { l, sp, ov, held, going }

function still() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function later(ms, f) { setTimeout(f, ms); }
function lessonByK(k) { return LESSONS.filter(function (l) { return l.k === k; })[0] || null; }

function boxOf(r) { return { l: r.left, t: r.top, w: r.width, h: r.height }; }
function midBox() {
  var vw = innerWidth, vh = innerHeight, w = Math.min(262, Math.round(vw * 0.67)), h = Math.round(w * 1.49);
  return { l: (vw - w) / 2, t: (vh - h) / 2, w: w, h: h };
}
function fullBox() { return { l: 0, t: 0, w: innerWidth, h: innerHeight }; }
function place(ov, b, tf) {
  var s = ov.firstChild.style;
  s.left = b.l + 'px'; s.top = b.t + 'px'; s.width = b.w + 'px'; s.height = b.h + 'px';
  s.transform = tf;
}
var TF_SPINE = 'rotateY(-78deg)', TF_MID = 'rotateY(-12deg) rotateX(3deg)', TF_FLAT = 'none';

function ovMake(l) {
  var ov = document.createElement('div');
  ov.className = 'bk3';
  ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<div class="bk3-in cv-' + esc(l.cover) + '"><div class="bk3-pages"></div><div class="bk3-cover"><div class="bk3-front">' +
    '<span class="bk3-frame"></span><h2>' + esc(l.lab) + '</h2></div><div class="bk3-inner"></div></div></div>';
  document.body.appendChild(ov);
  return ov;
}
// מעבר בין שני מצבים מתחיל רק אחרי שהדפדפן צייר את הראשון.
function next(f) { requestAnimationFrame(function () { requestAnimationFrame(f); }); }

function shelfOpen(el, onOut) {
  var l = lessonByK(el.dataset.id);
  if (!l || bk) return;
  bk = { l: l, sp: el, ov: null, held: false, going: false };
  if (still()) { bk.held = true; onOut(l); return; }
  el.classList.add('up');
  later(T_LIFT, function () {
    var ov = ovMake(l);
    bk.ov = ov;
    place(ov, boxOf(el.getBoundingClientRect()), TF_SPINE);
    next(function () {
      el.classList.add('gone');
      ov.classList.add('dim');
      place(ov, midBox(), TF_MID);
      later(T_FLY, function () { ov.classList.add('lbl'); bk.held = true; onOut(l); });
    });
  });
}

// שם הספר על הכריכה — רק כשהספר במרכז (lbl), ולא בדרך מהמדף ואליו.
// הכריכה נפתחת והדף מתפרש — ובסופו המסך של השיעור נצבע מתחת, והספר נעלם.
function shelfIn(go) {
  if (!bk) { go(); return; }
  var b = bk;
  b.going = true;
  if (still() || !b.ov) { bk = null; go(); return; }
  b.ov.classList.add('open');
  later(T_OPEN, function () {
    b.ov.classList.add('full');
    place(b.ov, fullBox(), TF_FLAT);
    later(T_FULL, function () {
      go();
      b.ov.classList.add('out');
      later(T_FADE, function () { b.ov.remove(); });
      bk = null;
    });
  });
}

// הגיליון נסגר בלי בחירה — הספר חוזר למקומו במדף.
function shelfBack() {
  var b = bk;
  if (!b || b.going) return;
  bk = null;
  if (!b.ov) { b.sp.classList.remove('up', 'gone'); return; }
  b.ov.classList.remove('dim', 'lbl');
  place(b.ov, boxOf(b.sp.getBoundingClientRect()), TF_SPINE);
  later(T_FLY, function () {
    b.sp.classList.remove('gone', 'up');
    b.ov.remove();
  });
}
function shelfHeld() { return !!(bk && bk.held && !bk.going); }

// הגיליון נסגר — בבחירה (הפתיחה כבר ממשיכה) או בלעדיה.
function shelfWatch() {
  var m = document.getElementById('modal');
  if (!m || !window.MutationObserver) return;
  var mo = new MutationObserver(function () {
    if (m.classList.contains('open')) return;
    mo.disconnect();
    if (shelfHeld()) shelfBack();
  });
  mo.observe(m, { attributes: true, attributeFilter: ['class'] });
}

// חזרה לבית משיעור (from — המסך שעזבו): הדף מתקפל לספר, הכריכה נסגרת והספר חוזר למקומו במדף.
function shelfReturn(from) {
  if (!from || still()) return;
  var l = LESSONS.filter(function (x) { return lessonHas(x, from); })[0];
  var sp = l && document.querySelector('.spine[data-id="' + l.k + '"]');
  if (!l || !sp) return;
  var ov = ovMake(l);
  ov.classList.add('dim', 'open', 'full', 'lbl');
  place(ov, fullBox(), TF_FLAT);
  sp.classList.add('gone');
  next(function () {
    ov.classList.remove('full');
    place(ov, midBox(), TF_MID);
    later(T_FULL, function () {
      ov.classList.remove('open');
      later(T_OPEN, function () {
        ov.classList.remove('dim', 'lbl');
        place(ov, boxOf(sp.getBoundingClientRect()), TF_SPINE);
        later(T_FLY, function () { sp.classList.remove('gone'); ov.remove(); });
      });
    });
  });
}

export { DND_KEY, booksPick, dndToggle, homeScreenHTML, shelfBack, shelfHeld, shelfIn, shelfOpen, shelfReturn, shelfWatch };
