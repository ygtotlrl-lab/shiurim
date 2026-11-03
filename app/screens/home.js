// app/screens/home.js — מדף הכריכות שממנו נכנסים לכל שיעור
import { esc, openModal } from '../../core/ui.js';
import { HEB_DOW, hebDate } from '../../core/hebrew.js';
import { lsGet, lsSet } from '../../core/storage.js';
import { LESSONS, LINKS, MSG_BOOKS_TITLE, MSG_DND, MSG_DND_OFF, MSG_DND_ON, MSG_HOME_TITLE, MSG_SOON } from '../constants.js';
import { lessonAppHref, lessonOpen } from '../domain.js';
import { icon } from '../icons.js';

// כריכה לכל שיעור: עור בצבעו כשהוא פתוח, ובד בהיר ו«בקרוב» כשאין לו תוכן.
// שיעור בעל חלקים פותח בחירה, שיעור עם מסך נפתח, ואפליקציה אחרת — קישור.
function coverHTML(l, cur) {
  var cls = 'cover' + (l.wide ? ' wide' : '') + (cur && lessonHas(l, cur) ? ' cur' : '');
  var t = '<span class="cv-t">' + esc(l.lab) + '</span>';
  if (!lessonOpen(l)) {
    return '<div class="' + cls + ' off" aria-disabled="true">' + t + '<span class="cv-m">' + esc(MSG_SOON) + '</span></div>';
  }
  cls += ' cv-' + l.cover;
  if (l.app) {
    return '<a class="' + cls + '" href="' + esc(lessonAppHref(l)) + '">' + t + '<span class="cv-m">' + icon('out') + '</span></a>';
  }
  var act = l.subs ? 'lesson-pick' : 'tab-go', id = l.subs ? l.k : l.screen;
  return '<button class="' + cls + '" data-act="' + act + '" data-id="' + esc(id) + '">' + t + '</button>';
}

function lessonHas(l, screen) {
  return l.screen === screen || (l.subs || []).some(function (s) { return s.screen === screen; });
}

// החלפת ספר מתוך שיעור — אותן כריכות בצבעיהן, בגיליון מלמטה, והספר הפתוח מסומן בזהב.
function booksPick(screen) {
  openModal(MSG_BOOKS_TITLE, '<div class="covers mini">' + LESSONS.map(function (l) { return coverHTML(l, screen); }).join('') + '</div>', '');
}

// התאריך העברי של היום — בקצה השמאלי של הכותרת: היום בשבוע והתאריך, ומתחתיהם השנה.
// התאריך הוא של היום האזרחי — אינו מתחלף בשקיעה.
function todayHTML() {
  var d = new Date(), h = hebDate(d);
  if (!h.ok) return '';
  return '<div class="shelf-date"><b>' + esc('יום ' + HEB_DOW[d.getDay()] + ' · ' + h.dayLabel + ' ' + h.monthName) + '</b>' +
    '<span>' + esc(h.yearLabelFull) + '</span></div>';
}

// קישורים בתחתית המדף — אפליקציה אחרת (מהתצורה, `android.launch`) או אתר.
function linksHTML() {
  return '<nav class="shelf-links">' + LINKS.map(function (k) {
    var href = k.app ? lessonAppHref(k) : k.url;
    return '<a class="shelf-link" href="' + esc(href) + '">' + esc(k.lab) + icon('out') + '</a>';
  }).join('') + '</nav>';
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
  return '<section class="shelf-pg"><header class="shelf-hd"><img src="icons/icon-192.3db7e6a8.png" alt="" width="42" height="42">' +
    '<h1>' + esc(MSG_HOME_TITLE) + '</h1>' + todayHTML() + '</header><div class="covers">' + LESSONS.map(function (l) { return coverHTML(l); }).join('') + '</div>' +
    linksHTML() + dndHTML() + '</section>';
}

export { DND_KEY, booksPick, dndToggle, homeScreenHTML };
