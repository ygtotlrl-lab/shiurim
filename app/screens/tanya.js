// app/screens/tanya.js — פרק תניא לפני התפילה, לפי פרשת השבוע
import { esc } from '../../core/ui.js';
import { KEY_TANYA, MSG_CUR_WEEK, MSG_LUACH, MSG_NEXT_PARASHA, MSG_NOTES, MSG_NO_FIXES, MSG_PAGES,
         MSG_PICK_PARASHA, MSG_REST_CHAPTERS, MSG_TANYA, PARSHIOT, TANYA_CHAPTERS } from '../constants.js';
import { el, sPick, sQ, tanyaChapName, tanyaChapter, tanyaLabel, tanyaSheet } from '../domain.js';

function tanyaCur() { return sPick(KEY_TANYA, PARSHIOT.length); }

function tanyaTitleHTML(c) {
  return '<span class="ps">' + esc(PARSHIOT[c]) + '</span><span class="sep">·</span>' + esc(tanyaChapName(c));
}

function tanyaScreenHTML() {
  var c = tanyaCur(), h = '';
  h += '<header class="top"><h1>' + esc(MSG_TANYA) + '</h1></header>';
  h += '<div class="picker"><label for="pick-tanya">' + esc(MSG_PICK_PARASHA) + '</label>' +
       '<select id="pick-tanya" data-chg="tanya-pick">' + PARSHIOT.map(function (p, i) {
         return '<option value="' + i + '"' + (i === c ? ' selected' : '') + '>' + esc(tanyaLabel(i)) + '</option>';
       }).join('') + '</select></div>';
  h += '<section class="now"><span class="tag">' + esc(MSG_CUR_WEEK) + '</span>' +
       '<h2 class="chap-title">' + tanyaTitleHTML(c) + '</h2>' +
       '<div class="lesson" id="now-body" data-id="' + c + '"></div>' +
       (c + 1 < PARSHIOT.length
         ? '<div class="nextrow"><button class="btn" data-act="tanya-next" data-id="' + (c + 1) + '">' +
           esc(MSG_NEXT_PARASHA + PARSHIOT[c + 1] + ' ‹') + '</button></div>'
         : '') + '</section>';
  h += '<div class="divider">' + esc(MSG_REST_CHAPTERS) + '</div><div class="rest">';
  TANYA_CHAPTERS.forEach(function (ch, i) {
    if (i === c) return;
    h += '<div class="ch"><button class="ch-hd" data-act="tanya-row" data-id="' + i + '" aria-expanded="false">' +
         '<span class="ps">' + esc(PARSHIOT[i]) + '</span><span class="cn">' + esc(tanyaChapName(i)) + '</span>' +
         '<span class="meta">' + ch.pages.length + esc(MSG_PAGES) + '</span></button>' +
         '<div class="ch-bd lesson hidden" data-id="' + i + '"></div></div>';
  });
  return h + '</div>';
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

export { tanyaCur, tanyaFill, tanyaMount, tanyaScreenHTML };
