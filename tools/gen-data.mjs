#!/usr/bin/env node
// tools/gen-data.mjs — הנתונים שנגזרו מהסריקות: מהמקור ב-tools/data/ אל app/data.js
// כל גוש נשמר כמקור קריא, קובץ JSON לכל גוש; ממנו בלבד נוצר app/data.js. תיקון — במקור, ואז הרצה.
// ללא דגל — כותב; --check — מפיל כשמקור אינו בצורתו הקנונית, כשהפניה לעמוד אינה במרשם הסריקות,
// או כש-app/data.js נבדל ממה שהמקור יוצר.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'tools/data';
const OUT = 'app/data.js';
const MARK = 'נוצר מ-tools/data/ ב-node tools/gen-data.mjs: אין לערוך ביד — מתקנים במקור ומריצים';

// הגושים, בסדר שבו הם נכתבים — שם הקובץ במקור · שם המשתנה · התיעוד שנכתב מעליו.
export const BLOCKS = [
  ['scan', 'SCAN', [
    'גובה כל עמוד סרוק (ברוחב SCAN_W) לכל תיקייה — נכתב מההמרה, והגובה נשמר לפני שהתמונה מגיעה; 0 — עמוד שאינו בסריקה.']],
  ['scan-sub', 'SCAN_SUB', [
    'קובץ של תורה תמימה שאינו עמוד אחד בסדרו: «תיקייה/עמוד» ⟵ העמודים שמוצגים במקומו, [תיקייה, עמוד, הלבנות%].',
    'tt4s/ — הסריקות הכפולות של במדבר, מפוצלות ובשם העמוד המודפס, בסדר הקריאה, שני עמודים לכל קובץ;',
    'tt4g/ — מקראות גדולות במדבר (ירושלים תרצ״א), במספור ה-PDF: 278 — כא, יד–יח, 280 — כא, יח–כג, במקום הכפילים 270 ו-272.']],
  ['rambam-lessons', 'RAMBAM_LESSONS', [
    'לכל שיעור רמב״ם — שמו במורה השיעור ומספר העמודים שלו ברמב״ם לעם.']],
  ['rambam-map', 'RAMBAM_MAP', [
    'RAMBAM_MAP[שיעור] — קטעים: [כרך (מספר ב-RAMBAM_VOLS) או תיקייה, מעמוד, עד עמוד] לעמודים שלמים,',
    'או [כרך, עמוד, הלבנות] לעמוד שחלקו של השיעור הסמוך (הלבנה — [מעל%, עד%] או [מעל%, עד%, מימין%, רוחב%]);',
    'laam7l/114 — עמוד רלה בהלכות תרומות, החסר בסריקה, מדפוס וילנא (vil6, עמוד 114).',
    'נגזר מהשוואת השיעורים הישנים לעמודי הספרים.']],
  ['vilna', 'VILNA', [
    'VILNA[שיעור] — קטעי דפוס וילנא: [כרך 1–12 (התיקייה vilN), מעמוד, עד עמוד].']],
  ['tanya-chapters', 'TANYA_CHAPTERS', [
    'פרק תניא לכל פרשה, ברצף: הקדמת המלקט לבראשית, פרק א לנח, וכן הלאה.',
    'לכל פרק — עמודי הספר, לוח התיקון והערות ותיקונים; w — רצועות ההלבנה באחוזי העמוד: [מעלה, מטה] או [מעלה, מטה, ימין, רוחב].',
    'has — יש בעמוד תיקון של הפרק; בלעדיו נשארת הכותרת בלבד. עמוד — מספר בתיקייה tny, או נתיב בתיקיית השלמה:',
    'tnyt/120 ו-tnyt/121 — דף ס ע״ב וסא ע״א מתר״ס.']],
  ['tanya-ratio', 'TANYA_RATIO', [
    'יחס גובה לרוחב של כל עמוד תניא — המקום נשמר לפני שהתמונה נטענה, והגלילה אינה קופצת.']],
  ['ty', 'TY', [
    'TY[R|L][יום] — [היום בחודש, החודש (TY_MONTHS), עמודים [עמוד, הלבנות], פרקי לקוטי אמרים שבשיעור (0 — הקדמה),',
    'ושורות השיעור בלוח התיקון ובהערות ותיקונים משאר החלקים — [[עמוד, הלבנות]…] לכל אחד, כשיש].',
    'נגזר ממורה השיעור של אדמו״ר הריי״צ שבטקסט ספריא (סימני מ׳ ופ׳), שאותר בעמודי הדפוס לפי זיהוי הטקסט.']],
  ['sbt-ch', 'SBT_CH', [
    'שיעורים בספר התניא — לכל פרק בלקוטי אמרים (לפי TANYA_CHAPTERS: 0 — הקדמת המלקט) [מעמוד, עד עמוד] בתיקייה sbt1;',
    'מעמודי הכותרת «פרק …» שבספר.']],
  ['sbt-day', 'SBT_DAY', [
    'שיעורים בספר התניא — לכל שיעור בתניא היומי (SBT_DAY.R · SBT_DAY.L, לפי TY) קטעים [תיקייה, מעמוד, עד עמוד];',
    'מהתאמת המילים מהתניא שמצוטטות בכל עמוד לטקסט של עמודי התניא (תשט״ז), והגבולות — בעמודי הכותרת של הפרקים.']],
  ['hy', 'HY', [
    'היום יום — yi: לכל יום (התיקייה hyy) עמוד × 10 + מקומו בעמוד; seps: לכל עמוד באידיש, הקווים בין הימים,',
    'שמונה רצועות לרוחב העמוד (הסריקה עקומה); he: לכל יום (התיקייה hyh) [עמוד, ראש היום ב-%], ו-heEnd — סוף היום האחרון.']],
  ['ch', 'CH', [
    'לכל פרשה שבע עליות, בסדר PARSHIOT, לפי החלוקה שמודפסת בתורה תמימה (מנהג חב״ד) — [חומש, מעמוד, עד עמוד]',
    '(החומש N — התיקייה ttN, `ttDir`); העמודים שלמים, בלי הלבנה, ועמוד שהעלייה מתחילה או נגמרת באמצעו נכלל —',
    'המיפוי מקריאת הפסוק שבראש כל עמוד, וכל ספק נבדק בעין; וגם העמוד שרש״י או תורה תמימה של הפסוק האחרון בעלייה',
    'נמשכים אליו, והעמודים שהערת שוליים של תורה תמימה על אחד מפסוקי העלייה נמשכת אליהם עד סופה;',
    'והעלייה מתחילה בעמוד שבו מודפס שמה. חוץ מחקת ה׳: הערה יא (כא, ט) נגמרת בעמוד שחסר בסריקה,',
    'ובמקומו מקראות גדולות (4/270) בלי הערות — העלייה אינה נמשכת אליו.']],
  ['ch-chabad', 'CH_CHABAD', [
    'העליות שתחילתן או סופן שונים מהחלוקה הרווחת (ויגש ג–ה · תרומה ב–ג · נשא א–ב, ו–ז · מסעי א–ג · דברים א–ב); בפתיחתן — טוסט.']],
  ['haftarot', 'HAFTAROT', [
    'ההפטרה לפי מנהג חב״ד (ספר המנהגים, «סדר ההפטרות שיש בהם חלוקי מנהגים»), מעמודי ההפטרות שבסוף הכרכים,',
    'וקטע שאינו במנהג — מולבן. P[פרשה] — קטעים [תיקייה, עמוד, הלבנות%]; S — הפטרות מיוחדות [שם, קטעים], בסדר השנה;',
    'mnh/ — שני עמודי ספר המנהגים (עמ׳ 82–83).']],
  ['book-scan', 'BOOK_SCAN', [
    'מנוע הספרים — גובה כל עמוד (ברוחב 1600) לכל תיקייה.']],
  ['book-url', 'BOOK_URL', [
    'מנוע הספרים — המאגר של כל תיקייה.']],
  ['books', 'BOOKS', [
    'לכל ספר: קבוצות, ובכל קבוצה פריטים [תווית, קטעים]; קטע — [תיקייה, עמוד, הלבנות%] או [תיקייה, מעמוד, עד עמוד].']],
  ['th-chapters', 'TH_CHAPTERS', [
    'תהלים — לכל פרק (1–150) הקטעים שלו בסידור: [תיקייה, עמוד, הלבנות%].']]
];

// ── הצורה הקנונית של המקור ──
// מיכל שצורתו הדחוסה ארוכה מ-WRAP נפרש, איבר לשורה, ומה שקצר ממנו — בשורה אחת: diff קריא, וצורה אחת.
const WRAP = 160;
export function fmt(v, ind = '') {
  const flat = JSON.stringify(v);
  if (v === null || typeof v !== 'object' || flat.length <= WRAP) return flat;
  const next = ind + '  ';
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    return '[\n' + v.map(x => next + fmt(x, next)).join(',\n') + '\n' + ind + ']';
  }
  const ks = Object.keys(v);
  if (!ks.length) return '{}';
  return '{\n' + ks.map(k => next + JSON.stringify(k) + ': ' + fmt(v[k], next)).join(',\n') + '\n' + ind + '}';
}

function load() {
  const data = {};
  for (const [file, name] of BLOCKS) {
    const p = join(ROOT, SRC, file + '.json');
    if (!existsSync(p)) throw new Error(`${SRC}/${file}.json — חסר`);
    try { data[name] = JSON.parse(readFileSync(p, 'utf8')); }
    catch (e) { throw new Error(`${SRC}/${file}.json — ${e.message}`); }
  }
  return data;
}

// ── הפניות לעמודים ──
// כל [תיקייה, עמוד, …] — התיקייה במרשם, והעמוד (ועד העמוד, כשיש) בתחומה; ומפתח «תיקייה/עמוד» — כנ״ל.
function checkRefs(d) {
  const reg = Object.assign({}, d.SCAN, d.BOOK_SCAN), errs = [];
  let n = 0;
  const page = (dir, p, where) => {
    n++;
    const len = reg[dir].length;
    if (!Number.isInteger(p) || p < 1 || p > len) errs.push(`${where} — ${dir}/${p} מחוץ לתיקייה (1–${len})`);
  };
  const walk = (v, where) => {
    if (!Array.isArray(v)) { if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], where); return; }
    if (typeof v[0] === 'string' && reg[v[0]] && Number.isInteger(v[1])) {
      page(v[0], v[1], where);
      if (Number.isInteger(v[2])) { page(v[0], v[2], where); if (v[2] < v[1]) errs.push(`${where} — ${v[0]} ${v[1]}–${v[2]}: הטווח הפוך`); }
      return;
    }
    for (const x of v) walk(x, where);
  };
  for (const [, name] of BLOCKS) if (name !== 'SCAN' && name !== 'BOOK_SCAN') walk(d[name], name);
  for (const k of Object.keys(d.SCAN_SUB)) { const [dir, p] = k.split('/'); if (reg[dir]) page(dir, +p, 'SCAN_SUB'); else errs.push(`SCAN_SUB — ${dir} אינה במרשם`); }
  for (const dir of Object.keys(d.BOOK_SCAN)) if (!d.BOOK_URL[dir]) errs.push(`BOOK_URL — אין מאגר לתיקייה ${dir}`);
  return { errs, n };
}

export function build(d) {
  let s = `// app/data.js — ${MARK}\n`;
  for (const [file, name, doc] of BLOCKS)
    s += `\n// ── ${name} — ${SRC}/${file}.json ──\n` + doc.map(l => '// ' + l + '\n').join('') + `var ${name} = ${JSON.stringify(d[name])};\n`;
  return s + `\nexport { ${BLOCKS.map(b => b[1]).join(', ')} };\n`;
}

function main(argv) {
  const check = argv[0] === '--check';
  const d = load(), fails = [];
  for (const [file, name] of BLOCKS) {
    const p = join(ROOT, SRC, file + '.json'), want = fmt(d[name]) + '\n';
    if (readFileSync(p, 'utf8') === want) continue;
    if (check) fails.push(`${SRC}/${file}.json — אינו בצורתו הקנונית`);
    else writeFileSync(p, want);
  }
  const r = checkRefs(d);
  fails.push(...r.errs);
  const out = join(ROOT, OUT), want = build(d);
  const same = existsSync(out) && readFileSync(out, 'utf8') === want;
  if (!same) { if (check) fails.push(`${OUT} — אינו מה שהמקור יוצר`); else writeFileSync(out, want); }
  if (fails.length) { for (const f of fails) console.error('❌ ' + f); process.exit(1); }
  console.log(`gen-data — ${BLOCKS.length} גושים · ${r.n} הפניות לעמודים · ${OUT} ${same ? 'תואם' : 'נכתב'}`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { main(process.argv.slice(2)); } catch (e) { console.error('❌ ' + (e && e.message || e)); process.exit(1); }
}
