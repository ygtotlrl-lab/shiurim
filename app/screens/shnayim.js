// app/screens/shnayim.js — שניים מקרא: הפרשה מראשון עד שביעי, ובסופה ההפטרה לפי מנהג חב״ד
import { esc, openModal } from '../../core/ui.js';
import { MSG_HAFTARA, MSG_MINHAG_TITLE, MSG_NEXT_PARASHA, MSG_NO_HAFTARA, MSG_PREV_PARASHA, MSG_SHNAYIM, MSG_SPECIAL_TITLE, PARSHIOT } from '../constants.js';
import { partnerOf } from '../calendar.js';
import { el, haftaraOf, haftaraSheets, readBarHTML, scanInto, shnayimCur, shnayimSheets, sQ, topSecHTML } from '../domain.js';
import { HAFTAROT } from '../data.js';

// בראש השיעור — מנהגי חב״ד בהפטרות וההפטרה המיוחדת, נפתחים מתחתית הבורר ונסגרים ב-✕.
// פרשיות מחוברות בשבוע הזה — שתיהן ברצף, וההפטרות אחריהן; «הבאה» — שאחרי השנייה.
function shnayimScreenHTML() {
  var c = shnayimCur(), b = partnerOf(c), last = b === null ? c : b;
  return readBarHTML('shnayim', MSG_SHNAYIM, '<span class="ps">' + esc(PARSHIOT[c] + (b === null ? '' : '–' + PARSHIOT[b])) + '</span>') +
    topSecHTML('minhag', MSG_MINHAG_TITLE) + topSecHTML('special', MSG_SPECIAL_TITLE) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end">' +
    (c > 0 ? '<button class="btn ghost" data-act="shnayim-next" data-id="' + (c - 1) + '">' +
      esc('› ' + MSG_PREV_PARASHA + PARSHIOT[c - 1]) + '</button>' : '') +
    (last + 1 < PARSHIOT.length ? '<button class="btn" data-act="shnayim-next" data-id="' + (last + 1) + '">' +
      esc(MSG_NEXT_PARASHA + PARSHIOT[last + 1] + ' ‹') + '</button>' : '') +
    '</div>';
}

function sectEl(title, note) {
  var hd = el('div', 'sect');
  hd.appendChild(el('h3', null, title));
  if (note) hd.appendChild(el('span', null, note));
  return hd;
}

// הפרשה, ואחריה ההפטרה.
function shnayimFill(box) {
  var c = +box.dataset.id, b = partnerOf(c), ps = b === null ? [c] : [c, b], pages = el('div', 'pages');
  ps.forEach(function (p, k) {
    if (k) pages.appendChild(sectEl(PARSHIOT[p], ''));
    shnayimSheets(p).forEach(function (f) { pages.appendChild(f); });
  });
  ps.forEach(function (p) {
    var h = haftaraOf(p);
    pages.appendChild(sectEl(MSG_HAFTARA + PARSHIOT[p], h ? '' : MSG_NO_HAFTARA));
    haftaraSheets(h).forEach(function (f) { pages.appendChild(f); });
  });
  box.appendChild(pages);
}

function shnayimMount() {
  var now = sQ('#now-body');
  if (now) shnayimFill(now);
}

// ספר המנהגים, «סדר ההפטרות שיש בהם חלוקי מנהגים» — שני עמודים שלמים.
function minhagFill(box) { scanInto(box, 'mnh'); }

function specialPick() {
  openModal(MSG_SPECIAL_TITLE, '<div class="pk-list">' + HAFTAROT.S.map(function (s, i) {
    return '<button class="pk-it" data-act="special-go" data-id="' + i + '"><span class="pk-t">' + esc(s[0]) + '</span></button>';
  }).join('') + '</div>', '');
}

// ההפטרה המיוחדת — הכותרת ועמודיה, במקום הקודמת.
function specialFill(i) {
  var s = HAFTAROT.S[i], t = sQ('#special-t'), box = sQ('#special-pages');
  if (!s || !box) return false;
  if (t) t.textContent = MSG_HAFTARA + s[0];
  box.textContent = '';
  haftaraSheets(s[1]).forEach(function (f) { box.appendChild(f); });
  return true;
}

export { minhagFill, shnayimMount, shnayimScreenHTML, specialFill, specialPick };
