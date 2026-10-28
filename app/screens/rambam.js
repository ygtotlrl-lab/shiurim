// app/screens/rambam.js — רמב״ם: שלושה פרקים ליום, לפי מורה השיעור
import { esc } from '../../core/ui.js';
import { MSG_MOREH, MSG_MOREH_CLOSE, MSG_NEXT_LESSON, MSG_PREV_LESSON, MSG_RAMBAM, MSG_VIL_OPEN,
         RAMBAM_LESSONS, VILNA } from '../constants.js';
import { el, rambamCur, rambamDir, rambamLabel, readBarHTML, scanInto, sQ } from '../domain.js';

function rambamScreenHTML() {
  var c = rambamCur();
  return readBarHTML('rambam', MSG_RAMBAM, esc(rambamLabel(c))) +
    '<section id="moreh" class="moreh read hidden" data-act="read-toggle"><div class="moreh-hd"><h2>' + esc(MSG_MOREH) + '</h2>' +
    '<button class="btn ghost" data-act="moreh-close">' + esc(MSG_MOREH_CLOSE) + '</button></div>' +
    '<div class="pages" id="moreh-pages"></div></section>' +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end">' +
    (c > 0 ? '<button class="btn ghost" data-act="rambam-next" data-id="' + (c - 1) + '">' + esc(MSG_PREV_LESSON) + '</button>' : '') +
    (c + 1 < RAMBAM_LESSONS.length ? '<button class="btn" data-act="rambam-next" data-id="' + (c + 1) + '">' + esc(MSG_NEXT_LESSON) + '</button>' : '') +
    '</div>';
}

// גוף השיעור — עמודי רמב״ם לעם, וכפתור מהדורת וילנא שנפתח בתוך השיעור.
function rambamFill(box) {
  var i = +box.dataset.id;
  var pages = el('div', 'pages');
  box.appendChild(pages);
  scanInto(pages, rambamDir(i));
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
  var pages = el('div', 'pages');
  vs.appendChild(pages);
  (VILNA.L[i] || []).forEach(function (seg) { scanInto(pages, 'v/' + VILNA.c[seg[0]][0], seg[1], seg[2]); });
}

function rambamMorehFill(box) { scanInto(box, 'r/moreh-shiur'); }

export { rambamFill, rambamMorehFill, rambamMount, rambamScreenHTML, rambamVilnaFill };
