// app/icons.js — סט האייקונים של הממשק: קו אחד, פינות מעוגלות, בצבע הטקסט
// כולם באותה רשת (24) ובאותו עובי קו — אמוג׳י מתחלף בין מערכות ההפעלה ואינו נשמע לצבע.
var PATHS = {
  scroll: '<path d="M7 4h11v14a2 2 0 0 1-2 2H6"/><path d="M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2"/><path d="M10 9h5M10 13h5"/>',
  home:   '<path d="M4 11l8-7 8 7"/><path d="M7 10v10h10V10"/>',
  back:   '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  exit:   '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 8l-4 4 4 4"/><path d="M10 12h10"/>',
  down:   '<path d="M6 9l6 6 6-6"/>',
  out:    '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="M15.6 15.6l4.6 4.6"/>',
  close:  '<path d="M6 6l12 12M18 6L6 18"/>',
  books:  '<path d="M4 4h4v16H4z"/><path d="M10 4h4v16h-4z"/><path d="M15.5 5.5l3.6-.9 3 14.6-3.6.9z"/>',
  book:   '<path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5"/><path d="M12 6c2-1.5 5-2 8-1.5V19c-3-.5-6 0-8 1.5"/><path d="M12 6v14.5"/>'
};

function icon(name) {
  return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round">' + (PATHS[name] || '') + '</svg>';
}

export { icon };
