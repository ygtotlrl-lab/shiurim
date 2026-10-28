// app/screens/hayom.js — היום יום: הרשומה של היום שנבחר, באידיש ואחריה בעברית
import { esc } from '../../core/ui.js';
import { MSG_HAYOM_YOM, MSG_NEXT_DAY, MSG_PREV_DAY } from '../constants.js';
import { el, hayomCur, hyHeSheets, hyLabel, hyStep, hyYiSheet, readBarHTML, sQ } from '../domain.js';

// היום נבחר ביד, כמו כל שיעור — האפליקציה אינה קוראת את הלוח.
function hayomScreenHTML() {
  var c = hayomCur();
  return readBarHTML('hayom', MSG_HAYOM_YOM, esc(hyLabel(c))) +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="hayom-next" data-id="' + hyStep(c, -1) + '">' + esc(MSG_PREV_DAY) + '</button>' +
    '<button class="btn" data-act="hayom-next" data-id="' + hyStep(c, 1) + '">' + esc(MSG_NEXT_DAY) + '</button></div>';
}

function hayomMount() {
  var now = sQ('#now-body');
  if (!now) return;
  var i = +now.dataset.id, pages = el('div', 'pages');
  pages.appendChild(hyYiSheet(i));
  hyHeSheets(i).forEach(function (f) { pages.appendChild(f); });
  now.appendChild(pages);
}

export { hayomMount, hayomScreenHTML };
