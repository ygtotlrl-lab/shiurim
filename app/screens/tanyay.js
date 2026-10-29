// app/screens/tanyay.js — תניא יומי: השיעור של היום לפי מורה השיעור, ואחריו לוח התיקון והערות ותיקונים
import { esc } from '../../core/ui.js';
import { MSG_LUACH, MSG_NEXT_DAY, MSG_NOTES, MSG_NO_FIXES, MSG_PREV_DAY, MSG_TANYA_DAY, MSG_YEAR_LEAP, MSG_YEAR_REG } from '../constants.js';
import { el, readBarHTML, sQ, tanyaChapter, tanyaSheet, tyCur, tyDay, tyLabel, tyStep } from '../domain.js';

function tanyayScreenHTML() {
  var c = tyCur();
  return readBarHTML('tanyay', MSG_TANYA_DAY, esc(tyLabel(c)) + '<span class="sep">·</span><span class="ps">' +
      esc(c >= 1000 ? MSG_YEAR_LEAP : MSG_YEAR_REG) + '</span>') +
    '<div class="lesson read" id="now-body" data-id="' + c + '" data-act="read-toggle"></div>' +
    '<div class="read-end"><button class="btn ghost" data-act="tanyay-next" data-id="' + tyStep(c, -1) + '">' + esc(MSG_PREV_DAY) + '</button>' +
    '<button class="btn" data-act="tanyay-next" data-id="' + tyStep(c, 1) + '">' + esc(MSG_NEXT_DAY) + '</button></div>';
}

// עמודי השיעור, ומה שלפניו ואחריו מולבן; ואחריהם — לכל פרק של לקוטי אמרים שבשיעור — שורותיו בלוח התיקון ובהערות ותיקונים.
function tanyayFill(box) {
  var x = tyDay(+box.dataset.id), pages = el('div', 'pages');
  x[2].forEach(function (pg) { pages.appendChild(tanyaSheet({ p: pg[0], w: pg[1] })); });
  if (x[3].length) {
    [[MSG_LUACH, 'luach'], [MSG_NOTES, 'notes']].forEach(function (sec) {
      var items = [];
      x[3].forEach(function (ch) { items = items.concat(tanyaChapter(ch)[sec[1]]); });
      var hd = el('div', 'sect');
      hd.appendChild(el('h3', null, sec[0]));
      if (!items.some(function (it) { return it.has; })) hd.appendChild(el('span', null, MSG_NO_FIXES));
      pages.appendChild(hd);
      items.forEach(function (it) { pages.appendChild(tanyaSheet(it)); });
    });
  }
  box.appendChild(pages);
}

function tanyayMount() {
  var now = sQ('#now-body');
  if (now) tanyayFill(now);
}

export { tanyayMount, tanyayScreenHTML };
