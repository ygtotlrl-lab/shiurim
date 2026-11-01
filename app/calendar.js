// app/calendar.js — הלוח: פרשת השבוע (בארץ ישראל) והשיעור של היום בכל לימוד
// הפרשה נגזרת מהשבתות שבין שמחת תורה לשמחת תורה, בשלושה קטעים שגבולותיהם קבועים —
// צו (במעוברת: מצורע) בשבת שלפני פסח · ואתחנן בשבת שאחרי תשעה באב · האזינו לפני הסוכות —
// ובכל קטע מחוברות הפרשיות שבסדר המחוברות, עד שמספרן כמספר השבתות.
import { hebDate, hebIsLeap, hebToGreg } from '../core/hebrew.js';
import { HY_MONTHS, TY, TY_MONTHS } from './constants.js';

var DAY = 864e5;
function noon(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12); }
function addDays(d, n) { var x = noon(d); x.setDate(x.getDate() + n); return x; }
function satOnOrAfter(d) { return addDays(d, (6 - noon(d).getDay() + 7) % 7); }

// מספר החודש בשנה (מתשרי) — אדר ב׳ וניסן זזים בשנה מעוברת.
function mIdx(hy, name) {
  var L = hebIsLeap(hy), M = { tishri: 0, nisan: L ? 7 : 6, sivan: L ? 9 : 8, av: L ? 11 : 10 };
  return M[name];
}
function hd(hy, m, day) { return hebToGreg(hy, mIdx(hy, m), day); }

// השבתות שאין בהן פרשה בארץ ישראל — ראש השנה, יום הכיפורים, סוכות ושמיני עצרת, פסח ושבועות.
function holy(d) {
  var h = hebDate(d), L = hebIsLeap(h.year), mi = h.monthIndex, day = h.day;
  if (mi === 0) return day <= 2 || day === 10 || (day >= 15 && day <= 22);
  if (mi === (L ? 7 : 6)) return day >= 15 && day <= 21;
  if (mi === (L ? 9 : 8)) return day === 6;
  return false;
}

// המחוברות, לפי הסדר שבו הן מתחברות כשחסרה שבת.
var PAIRS_A = [[21, 22], [26, 27]];
var PAIRS_B = { R: [[26, 27], [28, 29], [41, 42], [31, 32], [38, 39]], L: [[41, 42], [31, 32], [28, 29], [26, 27], [38, 39]] };
var PAIRS_C = [[50, 51]];

// השבתות של המחזור שמתחיל בשמחת תורה של שנה hy — [שבת, פרשיות], לפי הסדר.
var cycles = {};
function cycle(hy) {
  if (cycles[hy]) return cycles[hy];
  var start = satOnOrAfter(addDays(hd(hy, 'tishri', 22), 1)), end = hd(hy + 1, 'tishri', 22);
  // פסח ותשעה באב של המחזור — באותה שנה עברית, שמתחילה בתשרי.
  var py = hy, leap = hebIsLeap(py);
  var pesach = hd(py, 'nisan', 15), nachamu = satOnOrAfter(addDays(hd(py, 'av', 9), 1));
  var sats = [];
  for (var s = start; s < end; s = addDays(s, 7)) sats.push(s);
  var reg = sats.filter(function (s) { return !holy(s); });
  var A = reg.filter(function (s) { return s < pesach; });
  var B = reg.filter(function (s) { return s > pesach && s <= nachamu; });
  var C = reg.filter(function (s) { return s > nachamu; });
  // לפני פסח: צו, ובמעוברת — מצורע, ואחרי מות כשראש השנה חל ביום חמישי.
  var anchorA = leap ? (hd(py, 'tishri', 1).getDay() === 4 ? 28 : 27) : 24;
  function seg(from, to, n, pairs) {
    var list = [], need = (to - from + 1) - n, join = {};
    pairs.forEach(function (p) { if (need > 0 && p[0] >= from && p[1] <= to) { join[p[0]] = true; need--; } });
    for (var i = from; i <= to; i++) { if (join[i]) { list.push([i, i + 1]); i++; } else list.push([i]); }
    return list;
  }
  var pa = seg(0, anchorA, A.length, PAIRS_A);
  var pb = seg(anchorA + 1, 44, B.length, leap ? PAIRS_B.L : PAIRS_B.R);
  var pc = seg(45, 52, C.length, PAIRS_C);
  var all = pa.concat(pb, pc), out = [];
  reg.forEach(function (s, i) { out.push([s, all[i] || null]); });
  cycles[hy] = out;
  return out;
}

// פרשת השבוע — הפרשה (או שתיים) שקוראים בשבת הקרובה, ובשבת של חג — זו שאחריה.
function parashaOf(d) {
  d = noon(d || new Date());
  var h = hebDate(d), hy = h.year;
  // המחזור שהתחיל בשמחת תורה האחרונה.
  var st = hd(hy, 'tishri', 22);
  if (d <= st) hy--;
  var c = cycle(hy).concat(cycle(hy + 1));
  for (var i = 0; i < c.length; i++) if (c[i][0] >= d && c[i][1]) return c[i][1];
  return [0];
}

// הפרשה שלומדים בה השבוע — כמו פרשת השבוע, ובימים שבין שבת האזינו לשמחת תורה — וזאת הברכה.
function weekParasha(d) {
  d = noon(d || new Date());
  var p = parashaOf(d), h = hebDate(d);
  if (p[0] === 0 && h.monthIndex === 0 && h.day < 22) return [53];
  return p;
}

// הפרשה שמחוברת לזו בשבוע הנוכחי, או null.
function partnerOf(p, d) {
  var w = weekParasha(d);
  return w.length === 2 && w[0] === p ? w[1] : null;
}

// ── השיעור של היום ──
// חומש — עליית היום בפרשת השבוע: ראשון ביום ראשון ושביעי בשבת.
function todayChumash(d) { d = noon(d || new Date()); return weekParasha(d)[0] * 7 + d.getDay(); }
function todayShnayim(d) { return weekParasha(d)[0]; }
// פרק תניא שבועי — בפרשיות מחוברות: עד יום שלישי הפרק של הראשונה, ומיום רביעי — של השנייה.
function todayTanyaWeek(d) { d = noon(d || new Date()); var w = weekParasha(d); return w.length === 2 && d.getDay() >= 3 ? w[1] : w[0]; }

// רמב״ם, שלושה פרקים ליום — המחזור התחיל בכ״ז ניסן תשמ״ד (29.4.1984), ו-339 שיעורים בכל מחזור.
var RAMBAM_START = new Date(1984, 3, 29, 12);
function todayRambam(d) { return ((Math.round((noon(d || new Date()) - RAMBAM_START) / DAY) % 339) + 339) % 339; }

function tyMonthOf(h) {
  var n = h.monthName === 'מנחם אב' ? 'אב' : h.monthName;
  return TY_MONTHS.indexOf(n);
}
function tyNum(t) { var G = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ל': 30 }, n = 0; for (var k = 0; k < t.length; k++) n += G[t[k]] || 0; return n; }
// תניא יומי — החלוקה לפי השנה שבה התחיל המחזור בי״ט כסלו; יום שאינו בחלוקה (ל׳ בחודש חסר) — היום שלפניו.
function todayTanyaDay(d) {
  var h = hebDate(noon(d || new Date())), y = h.year;
  if (h.monthIndex < 2 || (h.monthIndex === 2 && h.day < 19)) y--;
  var leap = hebIsLeap(y), L = leap ? TY.L : TY.R, mi = tyMonthOf(h);
  for (var day = h.day; day > 0; day--) {
    for (var i = 0; i < L.length; i++) if (L[i][1] === mi && tyNum(L[i][0]) === day) return (leap ? 1000 : 0) + i;
  }
  return leap ? 1000 : 0;
}

// היום יום — החודש בשמו בספר; בשנה רגילה כל יום באדר כולל את שני החודשים — אדר א׳ ואחריו אדר ב׳.
var HY_CODE = { 'תשרי': 'tishri', 'חשון': 'heshvan', 'כסלו': 'kislev', 'טבת': 'tevet', 'שבט': 'shevat', 'אדר': 'adar1', 'אדר א׳': 'adar1', 'אדר ב׳': 'adar2',
  'ניסן': 'nisan', 'אייר': 'iyar', 'סיון': 'sivan', 'תמוז': 'tamuz', 'מנחם אב': 'av', 'אלול': 'elul' };
var hyAt = null, hyOf = null;
function hyMap() {
  if (hyAt) return;
  hyAt = {}; hyOf = [];
  var i = 0;
  HY_MONTHS.forEach(function (m) { for (var x = m[1]; x <= m[2]; x++) { hyAt[m[0] + '-' + x] = i; hyOf[i] = [m[0], x]; i++; } });
}
// הרשומה של אדר ב׳ שנלמדת עם רשומת אדר א׳ בשנה רגילה, או null.
function hayomAdarTwin(i, d) {
  hyMap();
  var x = hyOf[i];
  if (!x || x[0] !== 'adar1' || hebIsLeap(hebDate(noon(d || new Date())).year)) return null;
  var j = hyAt['adar2-' + x[1]];
  return j === undefined ? null : j;
}
function todayHayom(d) {
  hyMap();
  var h = hebDate(noon(d || new Date())), c = HY_CODE[h.monthName];
  for (var day = h.day; day > 0; day--) if (hyAt[c + '-' + day] !== undefined) return hyAt[c + '-' + day];
  return 0;
}

// תהלים יומי — היום בחודש; בכ״ט בחודש חסר — גם הפרקים של ל׳.
function todayTehillimDay(d) { return hebDate(noon(d || new Date())).day - 1; }
function tehillimAddThirty(d) {
  d = noon(d || new Date());
  var h = hebDate(d);
  return h.day === 29 && hebDate(addDays(d, 1)).day === 1;
}
function todayDow(d) { return noon(d || new Date()).getDay(); }
// קריאת התורה — של השבת הקרובה, ובשבת עצמה (במנחה) — של השבוע הבא.
function todayKria(d) { d = noon(d || new Date()); return parashaOf(d.getDay() === 6 ? addDays(d, 1) : d)[0]; }

export { cycle, hayomAdarTwin, parashaOf, partnerOf, tehillimAddThirty, todayChumash, todayDow, todayHayom, todayKria, todayRambam, todayShnayim, todayTanyaDay,
  todayTanyaWeek, todayTehillimDay, weekParasha };
