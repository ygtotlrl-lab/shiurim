// app/screens/rambam.js — רמב״ם: שלושה פרקים ליום, לפי מורה השיעור
import { esc } from '../../core/ui.js';
import { KEY_RAMBAM, MSG_CUR_LESSON, MSG_MOREH_OPEN, MSG_NEXT_LESSON, MSG_PAGES, MSG_PICK_LESSON,
         MSG_RAMBAM, MSG_REST_LESSONS, MSG_VIL_OPEN, MSG_VIL_SUB, MSG_ZOOM_SUB, RAMBAM_LESSONS,
         VILNA } from '../constants.js';
import { el, pdfInto, rambamFile, rambamLabel, sPick, sQ } from '../domain.js';

function rambamCur() { return sPick(KEY_RAMBAM, RAMBAM_LESSONS.length); }

function rambamScreenHTML() {
  var c = rambamCur(), h = '';
  h += '<header class="top"><h1>' + esc(MSG_RAMBAM) + '</h1></header>';
  h += '<div class="toolbar"><button class="btn ghost" data-act="moreh-toggle">' + esc(MSG_MOREH_OPEN) + '</button></div>';
  h += '<section id="moreh" class="moreh hidden"><p class="sub">' + esc(MSG_ZOOM_SUB) + '</p><div class="pages" id="moreh-pages"></div></section>';
  h += '<div class="picker"><label for="pick-rambam">' + esc(MSG_PICK_LESSON) + '</label>' +
       '<select id="pick-rambam" data-chg="rambam-pick">' + RAMBAM_LESSONS.map(function (x, i) {
         return '<option value="' + i + '"' + (i === c ? ' selected' : '') + '>' + esc(rambamLabel(i)) + '</option>';
       }).join('') + '</select></div>';
  h += '<section class="now"><span class="tag">' + esc(MSG_CUR_LESSON) + '</span>' +
       '<h2 class="chap-title">' + esc(rambamLabel(c)) + '</h2>' +
       '<div class="lesson" id="now-body" data-id="' + c + '"></div>' +
       (c + 1 < RAMBAM_LESSONS.length
         ? '<div class="nextrow"><button class="btn" data-act="rambam-next" data-id="' + (c + 1) + '">' + esc(MSG_NEXT_LESSON) + '</button></div>'
         : '') + '</section>';
  h += '<div class="divider">' + esc(MSG_REST_LESSONS) + '</div><div class="rest">';
  RAMBAM_LESSONS.forEach(function (x, i) {
    if (i === c) return;
    h += '<div class="ch"><button class="ch-hd" data-act="rambam-row" data-id="' + i + '" aria-expanded="false">' +
         '<span class="cn">' + esc(rambamLabel(i)) + '</span><span class="meta">' + x[1] + esc(MSG_PAGES) + '</span></button>' +
         '<div class="ch-bd lesson hidden" data-id="' + i + '"></div></div>';
  });
  return h + '</div>';
}

// גוף השיעור — עמודי רמב״ם לעם, וכפתור מהדורת וילנא שנפתח בתוך השיעור.
function rambamFill(box) {
  var i = +box.dataset.id;
  var pages = el('div', 'pages');
  box.appendChild(pages);
  pdfInto(pages, rambamFile(i), 0, 0, 0, false);
  var row = el('div', 'nextrow');
  var b = el('button', 'btn ghost', MSG_VIL_OPEN);
  b.setAttribute('data-act', 'vilna-toggle');
  b.setAttribute('data-id', String(i));
  row.appendChild(b);
  box.appendChild(row);
  var vs = el('section', 'vil hidden');
  vs.setAttribute('data-vil', String(i));
  box.appendChild(vs);
}

function rambamMount() {
  var now = sQ('#now-body');
  if (now) rambamFill(now);
}

function rambamVilnaFill(vs, i) {
  vs.appendChild(el('p', 'vsub', MSG_VIL_SUB));
  var pages = el('div', 'pages vpages');
  vs.appendChild(pages);
  var chain = Promise.resolve();
  (VILNA.L[i] || []).forEach(function (seg) {
    chain = chain.then(function () { return pdfInto(pages, 'v/' + VILNA.c[seg[0]][0] + '.pdf', seg[1], seg[2], 1800, true); });
  });
}

function rambamMorehFill(box) { pdfInto(box, 'r/moreh-shiur.pdf', 0, 0, 3000, true); }

export { rambamCur, rambamFill, rambamMorehFill, rambamMount, rambamScreenHTML, rambamVilnaFill };
