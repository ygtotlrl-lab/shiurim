// app/screens/home.js — השער שממנו נכנסים לכל שיעור
import { esc } from '../../core/ui.js';
import { LESSONS, MSG_HOME_TITLE, MSG_SOON } from '../constants.js';
import { lessonAppHref, lessonOpen } from '../domain.js';
import { icon } from '../icons.js';

// שורה לכל שיעור: שיעור בעל חלקים פותח בחירה, שיעור עם מסך נפתח, אפליקציה אחרת — קישור, ושיעור בלי תוכן — באפור.
function homeRowHTML(l) {
  if (!lessonOpen(l)) {
    return '<div class="toc-row off" aria-disabled="true"><span class="toc-t">' + esc(l.lab) + '</span>' +
      '<span class="toc-soon">' + esc(MSG_SOON) + '</span></div>';
  }
  if (l.app) {
    return '<a class="toc-row" href="' + esc(lessonAppHref(l)) + '"><span class="toc-t">' + esc(l.lab) + '</span>' +
      '<span class="toc-go toc-out">' + icon('out') + '</span></a>';
  }
  var act = l.subs ? 'lesson-pick' : 'tab-go', id = l.subs ? l.k : l.screen;
  return '<button class="toc-row" data-act="' + act + '" data-id="' + esc(id) + '">' +
    '<span class="toc-t">' + esc(l.lab) + '</span><span class="toc-go">' + icon('down') + '</span></button>';
}

function homeScreenHTML() {
  return '<section class="toc"><h1>' + esc(MSG_HOME_TITLE) + '</h1><div class="toc-rule"></div>' +
    LESSONS.map(homeRowHTML).join('') + '</section>';
}

export { homeScreenHTML };
