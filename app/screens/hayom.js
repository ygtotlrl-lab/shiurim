// app/screens/hayom.js — היום יום: הרשומה של התאריך, באידיש ואחריה בעברית
import { esc } from '../../core/ui.js';
import { hebDate } from '../../core/hebrew.js';
import { MSG_HAYOM_YOM, MSG_NEXT_DAY, MSG_PREV_DAY } from '../constants.js';
import { el, hyDays, hyHeSheets, hyYiSheet, readBarHTML, sQ } from '../domain.js';

// התאריך נקבע מהשעון, וההזזה ליום אחר — במסך בלבד, ואינה נשמרת.
function hayomScreenHTML(date) {
  var h = hebDate(date);
  return readBarHTML(null, MSG_HAYOM_YOM, esc(h.ok ? h.dayLabel + ' ' + h.monthName : '')) +
    '<div class="lesson read" id="now-body" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="hy-day" data-id="-1">' + esc(MSG_PREV_DAY) + '</button>' +
    '<button class="btn" data-act="hy-day" data-id="1">' + esc(MSG_NEXT_DAY) + '</button></div>';
}

function hayomMount(date) {
  var now = sQ('#now-body');
  if (!now) return;
  var pages = el('div', 'pages');
  hyDays(date).forEach(function (i) {
    pages.appendChild(hyYiSheet(i));
    hyHeSheets(i).forEach(function (f) { pages.appendChild(f); });
  });
  now.appendChild(pages);
}

export { hayomMount, hayomScreenHTML };
