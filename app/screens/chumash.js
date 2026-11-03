// app/screens/chumash.js — חומש עם תורה תמימה: עלייה אחת, נבחרת ביד
import { esc, toast } from '../../core/ui.js';
import { ALIYOT, CH, CH_CHABAD, MSG_CH_CHABAD, MSG_CHUMASH, MSG_NEXT_ALIYAH, MSG_PREV_ALIYAH, PARSHIOT } from '../constants.js';
import { partnerOf } from '../calendar.js';
import { TOAST_MS, chLabel, chSheets, chumashCur, el, readBarHTML, sQ } from '../domain.js';

// פרשיות מחוברות בשבוע הזה — עליית היום של השנייה ממשיכה מיד אחרי זו של הראשונה.
function chPartner(c) { return partnerOf(Math.floor(c / 7)); }

// אחרי השביעי של וזאת הברכה חוזרים לראשון של בראשית.
function chumashScreenHTML() {
  var c = chumashCur(), n = CH.length, b = chPartner(c);
  var lab = b === null ? chLabel(c) : PARSHIOT[Math.floor(c / 7)] + '–' + PARSHIOT[b] + ' · ' + ALIYOT[c % 7];
  return readBarHTML('chumash', MSG_CHUMASH, esc(lab)) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="chumash-next" data-id="' + ((c + n - 1) % n) + '">' + esc(MSG_PREV_ALIYAH) + '</button>' +
    '<button class="btn" data-act="chumash-next" data-id="' + ((c + 1) % n) + '">' + esc(MSG_NEXT_ALIYAH) + '</button></div>';
}

function chumashMount() {
  var now = sQ('#now-body');
  if (!now) return;
  var pages = el('div', 'pages');
  var c = +now.dataset.id, b = chPartner(c);
  chSheets(c).forEach(function (f) { pages.appendChild(f); });
  if (b !== null) {
    var hd = el('div', 'sect');
    hd.appendChild(el('h3', null, PARSHIOT[b] + ' · ' + ALIYOT[c % 7]));
    pages.appendChild(hd);
    chSheets(b * 7 + c % 7).forEach(function (f) { pages.appendChild(f); });
  }
  now.appendChild(pages);
  // עלייה שהחלוקה בה לפי מנהג חב״ד שונה מהרווחת — טוסט בפתיחה.
  if (CH_CHABAD.indexOf(c) >= 0 || (b !== null && CH_CHABAD.indexOf(b * 7 + c % 7) >= 0)) toast(MSG_CH_CHABAD, TOAST_MS);
}

export { chumashMount, chumashScreenHTML };
