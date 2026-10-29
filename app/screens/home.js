// app/screens/home.js — מדף הכריכות שממנו נכנסים לכל שיעור
import { esc, openModal } from '../../core/ui.js';
import { HEB_DOW, hebDate } from '../../core/hebrew.js';
import { LESSONS, MSG_BOOKS_TITLE, MSG_HOME_TITLE, MSG_SOON } from '../constants.js';
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

// הלוגו הוא הנכס שהמחולל מייצר — ציור שני של המאסטר היה מקור אמת שני.
function homeScreenHTML() {
  return '<section class="shelf-pg"><header class="shelf-hd"><img src="icons/icon-192.b6655e27.png" alt="" width="42" height="42">' +
    '<h1>' + esc(MSG_HOME_TITLE) + '</h1>' + todayHTML() + '</header><div class="covers">' + LESSONS.map(function (l) { return coverHTML(l); }).join('') + '</div></section>';
}

export { booksPick, homeScreenHTML };
