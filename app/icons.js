// app/icons.js — סט האייקונים של הממשק: קו אחד, פינות מעוגלות, בצבע הטקסט
// כולם באותה רשת (24) ובאותו עובי קו — אמוג׳י מתחלף בין מערכות ההפעלה ואינו נשמע לצבע.
import { iconSet, shellIcon } from '../core/icons.js';
var PATHS = {
  // אייקוני המצב — טוסט · כותרת · כפתור עסוק · סרגל הסנכרון (stIcon בליבה)
  good:     '<circle cx="12" cy="12" r="9"/><path d="M8 12.4l2.8 2.8L16.2 9.6"/>',
  bad:      '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6"/>',
  warn:     '<path d="M10.3 4.4L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4.5M12 17.4v.1"/>',
  off:      '<path d="M3 3l18 18"/><path d="M8.6 16.3a5 5 0 0 1 6.8 0"/><path d="M5.2 12.8a10 10 0 0 1 4-2.3M18.8 12.8a10 10 0 0 0-2.4-1.7"/><path d="M2 9.2a15 15 0 0 1 4.3-2.6M22 9.2a15 15 0 0 0-10.6-4"/><path d="M12 19.8v.1"/>',
  wait:     '<path d="M7 3h10M7 21h10"/><path d="M8 3v3.2a4 4 0 0 0 1.4 3L12 12l2.6-2.8A4 4 0 0 0 16 6.2V3"/><path d="M8 21v-3.2a4 4 0 0 1 1.4-3L12 12l2.6 2.8a4 4 0 0 1 1.4 3V21"/>',
  refresh:  '<path d="M20 12a8 8 0 1 1-2.34-5.66L20 8.5"/><path d="M20 3.5v5h-5"/>',
  scroll: '<path d="M7 4h11v14a2 2 0 0 1-2 2H6"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2"/><path d="M10 9h5M10 13h5"/>',
  home:   '<path d="M4 11l8-7 8 7"/><path d="M7 10v10h10V10"/>',
  back:   '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  exit:   '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 8l-4 4 4 4"/><path d="M10 12h10"/>',
  down:   '<path d="M6 9l6 6 6-6"/>',
  out:    '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="M15.6 15.6l4.6 4.6"/>',
  close:  '<path d="M6 6l12 12M18 6L6 18"/>',
  share:  '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/>',
  books:  '<path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M15.5 5.5l3.6-.9 3 14.6-3.6.9z"/>',
  book:   '<path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5"/><path d="M12 6c2-1.5 5-2 8-1.5V19c-3-.5-6 0-8 1.5"/><path d="M12 6v14.5"/>'
};

// הצייר — core/icons.js, גוף אחד בכולן; כאן רק הסט.
var icon = iconSet(PATHS);
shellIcon('close', icon('close')); // ✕ של המעטפת והליבה — מהסט של האפליקציה
shellIcon('refresh', icon('refresh')); // באנר העדכון
['good', 'bad', 'warn', 'off', 'wait'].forEach(function (n) { shellIcon(n, icon(n)); }); // אייקוני המצב

export { icon };
