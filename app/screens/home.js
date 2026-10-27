// app/screens/home.js — השער שממנו נכנסים לכל שיעור
import { esc } from '../../core/ui.js';
import { MSG_HOME_TITLE, TABS } from '../constants.js';
import { icon } from '../icons.js';

function homeScreenHTML() {
  return '<section class="toc"><h1>' + esc(MSG_HOME_TITLE) + '</h1><div class="toc-rule"></div>' +
    TABS.map(function (t) {
      return '<button class="toc-row" data-act="tab-go" data-id="' + esc(t.k) + '">' +
        '<span class="toc-t">' + esc(t.lab) + '</span>' +
        '<span class="toc-go">' + icon('down') + '</span></button>';
    }).join('') + '</section>';
}

export { homeScreenHTML };
