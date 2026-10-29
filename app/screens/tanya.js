// app/screens/tanya.js — פרק תניא לפני התפילה, לפי פרשת השבוע
import { esc } from '../../core/ui.js';
import { MSG_LUACH, MSG_NEXT_PARASHA, MSG_NOTES, MSG_PREV_PARASHA, MSG_NO_LUACH_CH, MSG_NO_NOTES_CH, MSG_TANYA_WEEK, PARSHIOT } from '../constants.js';
import { el, fixSections, readBarHTML, sQ, tanyaChapName, tanyaChapter, tanyaCur, tanyaSheet } from '../domain.js';

function tanyaTitleHTML(c) {
  return '<span class="ps">' + esc(PARSHIOT[c]) + '</span><span class="sep">·</span>' + esc(tanyaChapName(c));
}

function tanyaScreenHTML() {
  var c = tanyaCur();
  return readBarHTML('tanya', MSG_TANYA_WEEK, tanyaTitleHTML(c)) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end">' +
    (c > 0 ? '<button class="btn ghost" data-act="tanya-next" data-id="' + (c - 1) + '">' +
      esc('› ' + MSG_PREV_PARASHA + PARSHIOT[c - 1]) + '</button>' : '') +
    (c + 1 < PARSHIOT.length ? '<button class="btn" data-act="tanya-next" data-id="' + (c + 1) + '">' +
      esc(MSG_NEXT_PARASHA + PARSHIOT[c + 1] + ' ‹') + '</button>' : '') +
    '</div>';
}

// עמודי הפרק, ואחריהם לוח התיקון והערות ותיקונים — רק שורות הפרק גלויות, ובלי שורות — טוסט.
function tanyaFill(box) {
  var C = tanyaChapter(+box.dataset.id);
  var pages = el('div', 'pages');
  C.pages.forEach(function (x) { pages.appendChild(tanyaSheet(x)); });
  fixSections(pages, [[MSG_LUACH, C.luach, MSG_NO_LUACH_CH], [MSG_NOTES, C.notes, MSG_NO_NOTES_CH]]);
  box.appendChild(pages);
}

function tanyaMount() {
  var now = sQ('#now-body');
  if (now) tanyaFill(now);
}

export { tanyaFill, tanyaMount, tanyaScreenHTML };
