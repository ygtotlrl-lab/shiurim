// app/screens/rambam.js — רמב״ם: שלושה פרקים ליום, לפי מורה השיעור
import { esc } from '../../core/ui.js';
import { MSG_MOREH_CLOSE, MSG_MOREH_OPEN, MSG_NEXT_LESSON, MSG_RAMBAM, MSG_VIL_OPEN,
         MSG_VIL_SUB, RAMBAM_LESSONS, VILNA } from '../constants.js';
import { el, pdfInto, rambamCur, rambamFile, rambamLabel, readBarHTML, sQ } from '../domain.js';

function rambamScreenHTML() {
  var c = rambamCur();
  return readBarHTML('rambam', MSG_RAMBAM, esc(rambamLabel(c))) +
    '<section id="moreh" class="moreh read hidden" data-act="read-toggle"><div class="moreh-hd"><h2>' + esc(MSG_MOREH_OPEN) + '</h2>' +
    '<button class="btn ghost" data-act="moreh-close">' + esc(MSG_MOREH_CLOSE) + '</button></div>' +
    '<div class="pages" id="moreh-pages"></div></section>' +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    (c + 1 < RAMBAM_LESSONS.length
      ? '<div class="read-end"><button class="btn" data-act="rambam-next" data-id="' + (c + 1) + '">' + esc(MSG_NEXT_LESSON) + '</button></div>'
      : '');
}

// גוף השיעור — עמודי רמב״ם לעם, וכפתור מהדורת וילנא שנפתח בתוך השיעור.
function rambamFill(box) {
  var i = +box.dataset.id;
  var pages = el('div', 'pages');
  box.appendChild(pages);
  pdfInto(pages, rambamFile(i), 0, 0, 0);
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
  var pages = el('div', 'pages');
  vs.appendChild(pages);
  var chain = Promise.resolve();
  (VILNA.L[i] || []).forEach(function (seg) {
    chain = chain.then(function () { return pdfInto(pages, 'v/' + VILNA.c[seg[0]][0] + '.pdf', seg[1], seg[2], 1800); });
  });
}

function rambamMorehFill(box) { pdfInto(box, 'r/moreh-shiur.pdf', 0, 0, 3000); }

export { rambamFill, rambamMorehFill, rambamMount, rambamScreenHTML, rambamVilnaFill };
