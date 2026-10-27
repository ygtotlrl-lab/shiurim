// app/screens/home.js — מדף הכריכות שממנו נכנסים לכל שיעור
import { esc } from '../../core/ui.js';
import { LESSONS, MSG_HOME_TITLE, MSG_SOON } from '../constants.js';
import { lessonAppHref, lessonOpen } from '../domain.js';
import { icon } from '../icons.js';

// כריכה לכל שיעור: עור בצבעו כשהוא פתוח, ובד בהיר ו«בקרוב» כשאין לו תוכן.
// שיעור בעל חלקים פותח בחירה, שיעור עם מסך נפתח, ואפליקציה אחרת — קישור.
function coverHTML(l) {
  var cls = 'cover' + (l.wide ? ' wide' : '');
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

// הלוגו הוא הנכס שהמחולל מייצר — ציור שני של המאסטר היה מקור אמת שני.
function homeScreenHTML() {
  return '<section class="shelf-pg"><header class="shelf-hd"><img src="icons/icon-192.b6655e27.png" alt="" width="42" height="42">' +
    '<h1>' + esc(MSG_HOME_TITLE) + '</h1></header><div class="covers">' + LESSONS.map(coverHTML).join('') + '</div></section>';
}

export { homeScreenHTML };
