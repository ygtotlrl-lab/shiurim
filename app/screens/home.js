// app/screens/home.js — מדף הספרים שממנו נכנסים לכל שיעור
import { esc, openModal } from '../../core/ui.js';
import { HEB_DOW, hebDate } from '../../core/hebrew.js';
import { lsGet, lsSet } from '../../core/storage.js';
import { LESSONS, LINKS, MSG_BOOKS_TITLE, MSG_DND, MSG_DND_OFF, MSG_DND_ON, MSG_HOME_TITLE, MSG_SOON } from '../constants.js';
import { lessonAppHref, lessonOpen } from '../domain.js';

// ── המדף ──
// שתי קומות: בעליונה השיעורים הראשונים של LESSONS, ובתחתונה השאר ואחריהם הקישורים — הסדר מימין לשמאל.
var TOP_N = 7;

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
  spFit();
}

// שם הספר על השדרה — תמיד בשורה אחת: הגופן קטן מגודל הבסיס (13px, ובמסך נמוך 11px — מה-CSS) עד שהשם נכנס לגובה השדרה,
// וכך גם במסך קטן. מתעדכן בשינוי גודל ואחרי טעינת הגופנים.
var SP_MIN = 7;
function spFit() {
  document.querySelectorAll('.sp-t').forEach(function (t) {
    t.style.fontSize = '';
    var f = parseFloat(getComputedStyle(t).fontSize) || 13;
    while (f > SP_MIN && t.scrollHeight > t.clientHeight + 1) {
      f -= 0.5;
      t.style.fontSize = f + 'px';
    }
  });
}
addEventListener('resize', spFit);
try { document.fonts.ready.then(spFit); } catch (e) {}

// התאריך העברי של היום — מתחת לכותרת: היום בשבוע, התאריך והשנה.
// התאריך הוא של היום האזרחי — אינו מתחלף בשקיעה.
function todayHTML() {
  var d = new Date(), h = hebDate(d);
  if (!h.ok) return '';
  return '<div class="shelf-date">' + esc('יום ' + HEB_DOW[d.getDay()] + ' · ' + h.dayLabel + ' ' + h.monthName + ' · ' + h.yearLabelFull) + '</div>';
}

// השתקת התראות בזמן לימוד — רק באפליקציה המותקנת: המעטפת קולטת את הקישור ומדליקה «נא לא להפריע» כשהיא בחזית.
// הבחירה נזכרת גם כאן, כדי שהמתג יציג אותה.
var DND_KEY = 's_dnd';
function dndHTML() {
  if (!/\bwv\b/.test(navigator.userAgent)) return '';
  var on = lsGet(DND_KEY, '') === '1';
  return '<a class="shelf-dnd" role="switch" aria-checked="' + on + '" title="' + esc(on ? MSG_DND_ON : MSG_DND_OFF) + '" href="app-dnd:' + (on ? 'off' : 'on') + '">' +
    '<span>' + esc(MSG_DND) + '</span><span class="dnd-sw" aria-hidden="true"></span></a>';
}
// המתג מתהפך במקום — הקישור כבר עבר למעטפת, וכאן מתעדכנים רק מצבו והקישור הבא.
function dndToggle(el) {
  var on = lsGet(DND_KEY, '') !== '1';
  lsSet(DND_KEY, on ? '1' : '');
  if (!el) return;
  el.setAttribute('aria-checked', String(on));
  el.title = on ? MSG_DND_ON : MSG_DND_OFF;
  el.setAttribute('href', 'app-dnd:' + (on ? 'off' : 'on'));
}

function homeScreenHTML() {
  return '<section class="shelf-pg"><header class="shelf-hd"><h1>' + esc(MSG_HOME_TITLE) + '</h1>' + todayHTML() + '</header>' + shelvesHTML() + dndHTML() + '</section>';
}

// ── הספר יוצא מהמדף ──
// הספר נבנה פעם אחת, בגודל ובמקום שלו במרכז, והתנועה כולה transform ו-opacity (Web Animations) — ממלבן השדרה אליו (FLIP):
// הרמה · יציאה למרכז · המתנה · הכריכה נפתחת לימין ונמוגה · הדף מתפרש עד שורת הניווט; והחזרה — אותה תנועה בדיוק, הפוך.
// כשמבקשים להפחית תנועה — בלי תנועה כלל. שיעור בעל חלקים עוצר במרכז, ובחירת החלק בגיליון ממשיכה את הפתיחה.
var T_LIFT = 130, T_FLY = 380, T_LBL_AT = 110, T_LBL = 140, T_HOLD = 110, T_OPEN = 340, T_LBL_OUT = 120, T_FULL = 260, T_FADE = 140;
var E_FLY = 'cubic-bezier(.2,.8,.2,1)', E_OPEN = 'cubic-bezier(.5,.1,.4,1)', E_FULL = 'cubic-bezier(.3,.7,.2,1)';
var DIM = 0.32;
var bk = null; // הספר שבדרך: { l, sp, ov, held, going }

function still() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
}
function later(ms, f) { setTimeout(f, ms); }
function lessonByK(k) { return LESSONS.filter(function (l) { return l.k === k; })[0] || null; }

function boxOf(r) { return { l: r.left, t: r.top, w: r.width, h: r.height }; }
// הגובה שמעל שורת הניווט — הדף מתפרש עד אליה, והספר מתמרכז בו.
function areaH() {
  var bb = document.getElementById('botbar'), t = bb && bb.getBoundingClientRect().top;
  return t > 0 && t <= innerHeight ? t : innerHeight;
}
// גודל הספר במרכז — רוחב min(230px, 56% מהמסך) וגובה פי 1.45, ולא יותר מ-64% מגובה המסך.
function midBox() {
  var vw = innerWidth, vh = innerHeight, w = Math.min(230, vw * 0.56), h = w * 1.45;
  if (h > vh * 0.64) { h = vh * 0.64; w = h / 1.45; }
  return { l: (vw - w) / 2, t: (areaH() - h) / 2, w: w, h: h };
}
function fullBox() { return { l: 0, t: 0, w: innerWidth, h: areaH() }; }
// המעבר מהמלבן של הספר במרכז (m) אל מלבן אחר (b) — הזזה והגדלה בלבד.
function flip(b, m, rest) {
  return 'translate(' + (b.l - m.l) + 'px,' + (b.t - m.t) + 'px) scale(' + (b.w / m.w) + ',' + (b.h / m.h) + ')' + (rest ? ' ' + rest : '');
}
function anim(el, kf, ms, ease, delay) {
  return el.animate(kf, { duration: ms, easing: ease || 'linear', delay: delay || 0, fill: 'both' });
}
function done(a, f) { a.onfinish = f; }

function ovMake(l) {
  var ov = document.createElement('div'), m = midBox();
  ov.className = 'bk3';
  ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<div class="bk3-dim"></div><div class="bk3-in" style="left:' + m.l + 'px;top:' + m.t + 'px;width:' + m.w + 'px;height:' + m.h + 'px">' +
    '<div class="bk3-rot"><div class="bk3-shade"></div><div class="bk3-pages"></div><div class="bk3-cover cv-' + esc(l.cover) + '">' +
    '<div class="bk3-lbl"><span class="bk3-frame"></span><h2>' + esc(l.lab) + '</h2></div></div></div></div>';
  document.body.appendChild(ov);
  return { el: ov, m: m, dim: ov.querySelector('.bk3-dim'), box: ov.querySelector('.bk3-in'), rot: ov.querySelector('.bk3-rot'),
    shade: ov.querySelector('.bk3-shade'), cover: ov.querySelector('.bk3-cover'), lbl: ov.querySelector('.bk3-lbl') };
}

// השלבים — כל אחד הפוך לעצמו (back), כך שהחזרה היא אותה תנועה.
// יציאה: מהשדרה אל המרכז, עם נטייה עדינה ב-75% מהדרך; הרקע מתכהה, והשם והמסגרת עולים כשהספר עוד בדרך.
function stFly(o, sp, back, f) {
  var s = flip(boxOf(sp.getBoundingClientRect()), o.m), z = 'translate(0px,0px) scale(1,1)';
  var pos = back ? [{ transform: z }, { transform: s }] : [{ transform: s }, { transform: z }];
  var a = anim(o.box, pos, T_FLY, E_FLY);
  anim(o.rot, [{ transform: 'perspective(900px) rotateY(0deg)' }, { transform: 'perspective(900px) rotateY(-10deg)', offset: back ? 0.25 : 0.75 }, { transform: 'perspective(900px) rotateY(0deg)' }], T_FLY, E_FLY);
  anim(o.dim, back ? [{ opacity: DIM }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: DIM }], T_FLY, 'ease');
  if (back) anim(o.shade, [{ opacity: 1 }, { opacity: 0 }], 80, 'ease');
  else {
    anim(o.lbl, [{ opacity: 0 }, { opacity: 1 }], T_LBL, 'ease', T_LBL_AT);
    anim(o.shade, [{ opacity: 0 }, { opacity: 1 }], 120, 'ease', T_FLY - 120);
  }
  done(a, f);
}
// הכריכה נפתחת לימין (הציר בצד ימין) ונמוגה; השם והמסגרת נמוגים בהתחלה. ובסגירה — הפוך, והם עולים בסופה.
function stCover(o, back, f) {
  var kf = [{ transform: 'perspective(1100px) rotateY(0deg)', opacity: 1 }, { transform: 'perspective(1100px) rotateY(70deg)', opacity: 0.4, offset: 0.55 },
    { transform: 'perspective(1100px) rotateY(115deg)', opacity: 0 }];
  if (back) { kf = kf.slice().reverse(); kf[1] = { transform: kf[1].transform, opacity: kf[1].opacity, offset: 0.45 }; }
  var a = anim(o.cover, kf, T_OPEN, E_OPEN);
  if (back) anim(o.lbl, [{ opacity: 0 }, { opacity: 1 }], T_LBL_OUT, 'ease', T_OPEN - T_LBL_OUT);
  else anim(o.lbl, [{ opacity: 1 }, { opacity: 0 }], T_LBL_OUT, 'ease');
  done(a, f);
}
// הדף מתפרש עד כל המסך שמעל שורת הניווט — לבן ובלי צל; ובקיפול — חוזר לגודל הספר.
function stFull(o, back, f) {
  var s = flip(fullBox(), o.m), z = 'translate(0px,0px) scale(1,1)';
  var a = anim(o.box, back ? [{ transform: s }, { transform: z }] : [{ transform: z }, { transform: s }], T_FULL, E_FULL);
  anim(o.shade, back ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }], 120, 'ease', back ? T_FULL - 120 : 0);
  done(a, f);
}
// הספר נחת בשדרה — היא נגלית מורמת, ויורדת למקומה ונוטה שוב.
function land(o, sp) {
  sp.classList.remove('gone');
  o.el.remove();
  next(function () { sp.classList.remove('up'); });
}
// מעבר בין שני מצבים מתחיל רק אחרי שהדפדפן צייר את הראשון.
function next(f) { requestAnimationFrame(function () { requestAnimationFrame(f); }); }

function shelfOpen(el, onOut) {
  var l = lessonByK(el.dataset.id);
  if (!l || bk) return;
  bk = { l: l, sp: el, ov: null, held: false, going: false };
  if (still() || !el.animate) { bk.held = true; onOut(l); return; }
  el.classList.add('up');
  later(T_LIFT, function () {
    var o = ovMake(l);
    bk.ov = o;
    el.classList.add('gone');
    stFly(o, el, false, function () { bk.held = true; onOut(l); });
  });
}

// המתנה קצרה במרכז, הכריכה נפתחת והדף מתפרש — ובסופו המסך של השיעור נצבע מתחת, והספר נמוג.
function shelfIn(go) {
  if (!bk) { go(); return; }
  var b = bk;
  b.going = true;
  if (still() || !b.ov) { bk = null; go(); return; }
  var o = b.ov;
  later(T_HOLD, function () {
    o.el.classList.add('open');
    stCover(o, false, function () {
      stFull(o, false, function () {
        go();
        bk = null;
        done(anim(o.el, [{ opacity: 1 }, { opacity: 0 }], T_FADE, 'ease'), function () { o.el.remove(); });
      });
    });
  });
}

// הגיליון נסגר בלי בחירה — השם והמסגרת נמוגים, והספר עף בחזרה אל השדרה.
function shelfBack() {
  var b = bk;
  if (!b || b.going) return;
  bk = null;
  if (!b.ov) { b.sp.classList.remove('up', 'gone'); return; }
  var o = b.ov;
  done(anim(o.lbl, [{ opacity: 1 }, { opacity: 0 }], T_LBL_OUT, 'ease'), function () {
    stFly(o, b.sp, true, function () { land(o, b.sp); });
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

// חזרה לבית משיעור (from — המסך שעזבו) — אותה תנועה הפוכה: הדף מתקפל, הכריכה נסגרת, השם והמסגרת עולים לרגע ונמוגים,
// והספר עף בחזרה אל השדרה; רק אחרי שנחת הוא יורד למקומו ונוטה שוב.
function shelfReturn(from) {
  if (!from || still()) return;
  var l = LESSONS.filter(function (x) { return lessonHas(x, from); })[0];
  var sp = l && document.querySelector('.spine[data-id="' + l.k + '"]');
  if (!l || !sp || !sp.animate) return;
  var o = ovMake(l);
  sp.classList.add('up', 'gone');
  o.el.classList.add('open');
  anim(o.box, [{ transform: flip(fullBox(), o.m) }], 1);
  anim(o.cover, [{ transform: 'perspective(1100px) rotateY(115deg)', opacity: 0 }], 1);
  anim(o.shade, [{ opacity: 0 }], 1);
  anim(o.dim, [{ opacity: 0 }, { opacity: DIM }], T_FULL, 'ease');
  stFull(o, true, function () {
    stCover(o, true, function () {
      later(T_HOLD, function () {
        o.el.classList.remove('open');
        done(anim(o.lbl, [{ opacity: 1 }, { opacity: 0 }], T_LBL_OUT, 'ease'), function () {
          stFly(o, sp, true, function () { land(o, sp); });
        });
      });
    });
  });
}

export { DND_KEY, booksPick, spFit, dndToggle, homeScreenHTML, shelfBack, shelfHeld, shelfIn, shelfOpen, shelfReturn, shelfWatch };
