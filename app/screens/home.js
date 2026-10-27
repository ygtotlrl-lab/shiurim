// app/screens/home.js — סדר הלימוד: השער שממנו נכנסים לכל שיעור
import { esc } from '../../core/ui.js';
import { hebGematria, hebrewDate } from '../../core/hebrew.js';
import { MSG_HOME_TITLE, PARSHIOT, TABS } from '../constants.js';
import { rambamCur, rambamLabel, tanyaChapName, tanyaCur } from '../domain.js';
import { icon } from '../icons.js';

// השורה של כל שיעור — שמו בסרגל, והשיעור שעומדים בו.
function homeNow(k) {
  if (k === 'rambam') return rambamLabel(rambamCur());
  var c = tanyaCur();
  return PARSHIOT[c] + ' — ' + tanyaChapName(c);
}

function homeScreenHTML() {
  return '<section class="toc"><div class="toc-orn" aria-hidden="true">✦ ✦ ✦</div>' +
    '<h1>' + esc(MSG_HOME_TITLE) + '</h1><p class="toc-date">' + esc(hebrewDate(new Date())) + '</p>' +
    '<div class="toc-rule"></div>' + TABS.map(function (t, i) {
      return '<button class="toc-row" data-act="tab-go" data-id="' + esc(t.k) + '">' +
        '<span class="toc-n">' + esc(hebGematria(i + 1, '')) + '</span>' +
        '<span class="toc-t"><b>' + esc(t.lab) + '</b><span>' + esc(homeNow(t.k)) + '</span></span>' +
        '<span class="toc-go">' + icon('down') + '</span></button>';
    }).join('') + '</section>';
}

export { homeScreenHTML };
