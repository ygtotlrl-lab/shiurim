// app/screens/shnayim.js — שניים מקרא: הפרשה מראשון עד שביעי, ובסופה ההפטרה לפי מנהג חב״ד
import { esc, openModal } from '../../core/ui.js';
import { HAFTAROT, MSG_HAFTARA, MSG_MINHAG_OPEN, MSG_NEXT_PARASHA, MSG_NO_HAFTARA, MSG_PREV_PARASHA, MSG_SHNAYIM,
         MSG_SPECIAL_OPEN, MSG_SPECIAL_TITLE, PARSHIOT } from '../constants.js';
import { el, haftaraOf, haftaraSheets, readBarHTML, scanInto, shnayimCur, shnayimSheets, sQ } from '../domain.js';

function shnayimScreenHTML() {
  var c = shnayimCur();
  return readBarHTML('shnayim', MSG_SHNAYIM, '<span class="ps">' + esc(PARSHIOT[c]) + '</span>') +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end">' +
    (c > 0 ? '<button class="btn ghost" data-act="shnayim-next" data-id="' + (c - 1) + '">' +
      esc('› ' + MSG_PREV_PARASHA + PARSHIOT[c - 1]) + '</button>' : '') +
    (c + 1 < PARSHIOT.length ? '<button class="btn" data-act="shnayim-next" data-id="' + (c + 1) + '">' +
      esc(MSG_NEXT_PARASHA + PARSHIOT[c + 1] + ' ‹') + '</button>' : '') +
    '</div>';
}

function sectEl(title, note) {
  var hd = el('div', 'sect');
  hd.appendChild(el('h3', null, title));
  if (note) hd.appendChild(el('span', null, note));
  return hd;
}

// הפרשה, ההפטרה, ושני כפתורי «פתיחת…»: ספר המנהגים, וההפטרות המיוחדות — כל אחד נפתח בתוך השיעור.
function shnayimFill(box) {
  var c = +box.dataset.id, pages = el('div', 'pages'), h = haftaraOf(c);
  shnayimSheets(c).forEach(function (f) { pages.appendChild(f); });
  pages.appendChild(sectEl(MSG_HAFTARA + PARSHIOT[c], h ? '' : MSG_NO_HAFTARA));
  haftaraSheets(h).forEach(function (f) { pages.appendChild(f); });
  box.appendChild(pages);
  var row = el('div', 'nextrow opens');
  [['minhag-toggle', MSG_MINHAG_OPEN], ['special-open', MSG_SPECIAL_OPEN]].forEach(function (b) {
    var x = el('button', 'btn ghost', b[1]);
    x.setAttribute('data-act', b[0]);
    row.appendChild(x);
  });
  box.appendChild(row);
  var mn = el('section', 'vil hidden'); mn.setAttribute('data-minhag', ''); box.appendChild(mn);
  var sp = el('section', 'vil hidden'); sp.setAttribute('data-special', ''); box.appendChild(sp);
}

function shnayimMount() {
  var now = sQ('#now-body');
  if (now) shnayimFill(now);
}

// ספר המנהגים, «סדר ההפטרות שיש בהם חלוקי מנהגים» — שני עמודים שלמים.
function minhagFill(sec) {
  var pages = el('div', 'pages');
  scanInto(pages, 'm');
  sec.appendChild(pages);
}

function specialPick() {
  openModal(MSG_SPECIAL_TITLE, '<div class="pk-list">' + HAFTAROT.S.map(function (s, i) {
    return '<button class="pk-it" data-act="special-go" data-id="' + i + '"><span class="pk-t">' + esc(s[0]) + '</span></button>';
  }).join('') + '</div>', '');
}

function specialFill(sec, i) {
  var s = HAFTAROT.S[i];
  sec.textContent = '';
  var pages = el('div', 'pages');
  pages.appendChild(sectEl(MSG_HAFTARA + s[0]));
  haftaraSheets(s[1]).forEach(function (f) { pages.appendChild(f); });
  sec.appendChild(pages);
}

export { minhagFill, shnayimMount, shnayimScreenHTML, specialFill, specialPick };
