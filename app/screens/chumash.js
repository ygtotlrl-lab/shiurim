// app/screens/chumash.js — חומש עם תורה תמימה: עלייה אחת, נבחרת ביד
import { esc } from '../../core/ui.js';
import { CH, MSG_CHUMASH, MSG_NEXT_ALIYAH, MSG_PREV_ALIYAH } from '../constants.js';
import { chLabel, chSheets, chumashCur, el, readBarHTML, sQ } from '../domain.js';

// אחרי השביעי של וזאת הברכה חוזרים לראשון של בראשית.
function chumashScreenHTML() {
  var c = chumashCur(), n = CH.length;
  return readBarHTML('chumash', MSG_CHUMASH, esc(chLabel(c))) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="chumash-next" data-id="' + ((c + n - 1) % n) + '">' + esc(MSG_PREV_ALIYAH) + '</button>' +
    '<button class="btn" data-act="chumash-next" data-id="' + ((c + 1) % n) + '">' + esc(MSG_NEXT_ALIYAH) + '</button></div>';
}

function chumashMount() {
  var now = sQ('#now-body');
  if (!now) return;
  var pages = el('div', 'pages');
  chSheets(+now.dataset.id).forEach(function (f) { pages.appendChild(f); });
  now.appendChild(pages);
}

export { chumashMount, chumashScreenHTML };
