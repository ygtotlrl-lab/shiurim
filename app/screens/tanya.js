// app/screens/tanya.js — פרק תניא לפני התפילה, לפי פרשת השבוע
import { esc } from '../../core/ui.js';
import { MSG_LUACH, MSG_NEXT_PARASHA, MSG_NOTES, MSG_NO_FIXES, MSG_TANYA_TAB, PARSHIOT } from '../constants.js';
import { el, readBarHTML, sQ, tanyaChapName, tanyaChapter, tanyaCur, tanyaSheet } from '../domain.js';

function tanyaTitleHTML(c) {
  return '<span class="ps">' + esc(PARSHIOT[c]) + '</span><span class="sep">·</span>' + esc(tanyaChapName(c));
}

function tanyaScreenHTML() {
  var c = tanyaCur();
  return readBarHTML('tanya', MSG_TANYA_TAB, tanyaTitleHTML(c)) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    (c + 1 < PARSHIOT.length
      ? '<div class="read-end"><button class="btn" data-act="tanya-next" data-id="' + (c + 1) + '">' +
        esc(MSG_NEXT_PARASHA + PARSHIOT[c + 1] + ' ‹') + '</button></div>'
      : '');
}

// עמודי הפרק, ואחריהם לוח התיקון והערות ותיקונים — רק שורות הפרק גלויות.
function tanyaFill(box) {
  var C = tanyaChapter(+box.dataset.id);
  var pages = el('div', 'pages');
  C.pages.forEach(function (x) { pages.appendChild(tanyaSheet(x)); });
  [[MSG_LUACH, C.luach], [MSG_NOTES, C.notes]].forEach(function (sec) {
    var hd = el('div', 'sect');
    hd.appendChild(el('h3', null, sec[0]));
    if (!sec[1].some(function (x) { return x.has; })) hd.appendChild(el('span', null, MSG_NO_FIXES));
    pages.appendChild(hd);
    sec[1].forEach(function (x) { pages.appendChild(tanyaSheet(x)); });
  });
  box.appendChild(pages);
}

function tanyaMount() {
  var now = sQ('#now-body');
  if (now) tanyaFill(now);
}

export { tanyaFill, tanyaMount, tanyaScreenHTML };
