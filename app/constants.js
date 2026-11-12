// app/constants.js — הנתונים: שמות הטבלאות, המחרוזות, הקבועים ומפת השיעורים
import { appConfigure } from '../core/util.js';

// ── מסירת התצורה ──
// כאן הנתונים שהליבה קוראת, והחיווט — ב-main.js; הקובץ הזה נטען ראשון, לפני כל קריאה לליבה.
// העידן עולה בשינוי צורת רשומה או מפתחה, ושינוי שם טבלה הוא שינוי כזה — המראה ממופתחת בשם.
var DATA_ERA = 1;

appConfigure({ DATA_ERA: DATA_ERA });

var SUPABASE_URL = self.APP.supabase.url;

var SUPABASE_ANON_KEY = self.APP.supabase.key;

// הסריקות יושבות במאגר קבצים לכל לימוד, באותו origin — נפחן עובר את תקרת האתר ב-GitHub Pages, 1GB.
var MT_URL = 'https://ygtotlrl-lab.github.io/shiurim-mishneh-torah/';

var TANYA_URL = 'https://ygtotlrl-lab.github.io/shiurim-tanya/';
// שיעורים בספר התניא (וינברג, יידיש) — מאגר משלו: sbt1 לקוטי אמרים · sbt3 שער היחוד והאמונה ואגרת התשובה · sbt4 אגרת הקודש וקונטרס אחרון
var SBT_URL = 'https://ygtotlrl-lab.github.io/shiurim-shiurim-besefer-hatanya/';

var HY_URL = 'https://ygtotlrl-lab.github.io/shiurim-hayom-yom/';

var CH_URL = 'https://ygtotlrl-lab.github.io/shiurim-chumash/';

// ── הודעות ──
var MSG_RAMBAM = 'רמב״ם';

var MSG_TANYA_WEEK = 'פרק תניא שבועי';

var MSG_HAYOM_YOM = 'היום יום';

var MSG_NEXT_DAY = 'ליום הבא ‹';

var MSG_PREV_DAY = '› ליום הקודם';

var MSG_PICK_DAY_TITLE = 'בחירת יום';

var MSG_CHUMASH = 'חומש יומי';

var MSG_PICK_ALIYAH_TITLE = 'בחירת עלייה';

var MSG_NEXT_ALIYAH = 'לעלייה הבאה ‹';

var MSG_PREV_ALIYAH = '› לעלייה הקודמת';

var ALIYOT = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];

var MSG_SOON = 'בקרוב';

var MSG_NEXT_LESSON = 'לשיעור הבא ‹';

var MSG_NEXT_PARASHA = 'לפרשה הבאה: ';

var MSG_PREV_LESSON = '› לשיעור הקודם';

var MSG_PREV_PARASHA = 'לפרשה הקודמת: ';

var MSG_MOREH = 'מורה שיעור שנתי';

var MSG_MOREH_OPEN = 'פתיחת מורה שיעור שנתי';

var MSG_VIL_OPEN = 'פתיחת מהדורת וילנא';
var MSG_SBT_OPEN = 'פתיחת שיעורים בספר התניא';
var MSG_SBT_CLOSE = 'סגירת שיעורים בספר התניא';

var MSG_VIL_CLOSE = 'סגירת מהדורת וילנא';

var MSG_HOME_TITLE = 'שיעורים';
var MSG_BOOKS_TITLE = 'החלפת ספר';
// שיתוף השיעור — עמודיו כתמונות, כמו שהם מוצגים
var MSG_SHARE_TITLE = 'שיתוף השיעור';
var MSG_SHARE_PREP = 'מכין את עמודי השיעור…';
var MSG_SHARE_NONE = 'אין עמודים לשיתוף';
var MSG_SHARE_FAIL = 'השיתוף לא הצליח — ';
var MSG_ALT_PAGE = 'העמוד לא נמצא בסריקות';
var MSG_CH_CHABAD = 'החלוקה לפי מנהג חב״ד';

var MSG_NAV_BACK = 'חזור';

var MSG_NAV_HOME = 'בית';

var MSG_NAV_EXIT = 'יציאה';

var MSG_PICK_TITLE = 'בחירת שיעור';

var MSG_PICK_PARASHA_TITLE = 'בחירת פרשה';

var MSG_PICK_SEARCH = 'חיפוש — שם או מספר';

var MSG_PICK_NONE = 'לא נמצא שיעור כזה';

var MSG_PICK_CUR = 'הנוכחי';

var MSG_RAMBAM_OPENING = 'פתיחה';

var MSG_MOREH_CLOSE = 'סגירה';

var MSG_LOAD_FAIL = 'העמודים לא נטענו — נסו לרענן';

var MSG_LUACH = 'לוח התיקון';

var MSG_NOTES = 'הערות ותיקונים';

// אין שורות לשיעור — טוסט כשסוף השיעור נכנס למסך, ולא עמוד ריק.
var MSG_NO_LUACH_DAY = 'אין תיקונים ביום זה';
var MSG_NO_NOTES_DAY = 'אין הערות ותיקונים ביום זה';
var MSG_NO_LUACH_CH = 'אין תיקונים בפרק זה';
var MSG_NO_NOTES_CH = 'אין הערות ותיקונים בפרק זה';

var MSG_HAKDAMA = 'הקדמת המלקט';

var MSG_PEREK = 'פרק ';

// ── תצורה ──
// טבלה שנכתבת מקומית ואינה ב-PUSH_TABLES — שורותיה אינן עולות לעולם.
var KV_TABLE = 's_settings';

var PUSH_TABLES = [KV_TABLE];

// ── מטא-הטבלאות ──
// שם, מפתח ועמודת התנגשות במקום אחד — שם שנכתב פעמיים מתפצל ביום שאחד האתרים נערך.
var TABLES = [
  { t: KV_TABLE, key: 'key' }
];

// הבחירה בכל שיעור — מפתח אחד, משותף לכל המכשירים.
var KEY_RAMBAM = 'rambam_lesson';

var KEY_TANYA = 'tanya_parasha';
// תניא יומי — הבחירה מספר אחד: היום בשנה רגילה, או 1000 ומעלה — היום בשנה מעוברת.
var KEY_TANYA_DAY = 'tanya_day';
var MSG_TANYA_DAY = 'תניא יומי';
var MSG_YEAR_REG = 'שנה רגילה';
var MSG_YEAR_LEAP = 'שנה מעוברת';
var TY_MONTHS = ['תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר', 'אדר א׳', 'אדר ב׳', 'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול'];

var KEY_HAYOM = 'hayom_day';

var KEY_CHUMASH = 'chumash_aliyah';
var MSG_SHNAYIM = 'שניים מקרא';

// תחילת כל חומש ברשימת הפרשות — כותרות הקבוצות בבחירת הפרשה.
var TANYA_BOOKS = [['בראשית', 0], ['שמות', 12], ['ויקרא', 23], ['במדבר', 33], ['דברים', 43]];

// מרשם השיעורים, בסדר שבמסך הראשי — screen הוא המסך שהשיעור פותח, ובלעדיו השיעור «בקרוב».
// cover — צבע הכריכה, sp — שדרת הספר במדף [רוחב בפיקסלים, גובה באחוזים מהקומה], ו-wide — כריכה לרוחב גיליון החלפת הספר; שיעור עם subs פותח בחירה בין חלקיו, ושיעור עם app פותח אפליקציה אחרת — החבילה מהתצורה, `android.launch`.
var LESSONS = [
  { k: 'siddur', lab: 'סידור', cover: 'green', sp: [52, 84], subs: [
    { k: 'siddur-tefilot', lab: 'תפילות', screen: 'bk-sid' },
    { k: 'siddur-kria', lab: 'קריאת התורה', screen: 'bk-sidk' }
  ] },
  { k: 'chumash', lab: 'חומש', cover: 'brown', sp: [56, 92], subs: [
    { k: 'chumash-yomi', lab: MSG_CHUMASH, screen: 'chumash' },
    { k: 'shnayim-mikra', lab: MSG_SHNAYIM, screen: 'shnayim' },
    { k: 'tanach', lab: 'תנ״ך', screen: 'bk-tanach' }
  ] },
  { k: 'tehillim', lab: 'תהלים', cover: 'green', sp: [48, 78], subs: [
    { k: 'tehillim-yomi', lab: 'תהלים יומי', screen: 'bk-thd' },
    { k: 'tehillim-people', lab: 'פרקים אישיים', screen: 'bk-thp' },
    { k: 'tehillim-week', lab: 'תהלים ימי השבוע', screen: 'bk-thw' }
  ] },
  { k: 'tanya', lab: 'תניא', cover: 'bord', sp: [50, 82], subs: [
    { k: 'tanya-yomi', lab: MSG_TANYA_DAY, screen: 'tanyay' },
    { k: 'tanya-week', lab: MSG_TANYA_WEEK, screen: 'tanya' }
  ] },
  { k: 'rambam', lab: MSG_RAMBAM, cover: 'navy', sp: [54, 89], screen: 'rambam' },
  { k: 'hayom-yom', lab: MSG_HAYOM_YOM, cover: 'navy', sp: [44, 81], screen: 'hayom' },
  { k: 'chassidishe-parsha', lab: 'החסידישע פרשה', cover: 'bord', sp: [48, 85], screen: 'bk-chassidus' },
  { k: 'shulchan-aruch', lab: 'שולחן ערוך הרב', cover: 'brown', sp: [50, 92], screen: 'bk-sa' },
  { k: 'ein-yaakov', lab: 'עין יעקב', cover: 'green', sp: [46, 87], screen: 'bk-ey' },
  { k: 'mishnayot', lab: 'משניות', cover: 'brown', sp: [44, 83], screen: 'bk-mishnayot' },
  { k: 'shas', lab: 'ש״ס', cover: 'bord', sp: [46, 90], subs: [
    { k: 'shas-bavli', lab: 'תלמוד בבלי', screen: 'bk-bavli' },
    { k: 'shas-yerushalmi', lab: 'תלמוד ירושלמי', screen: 'bk-yer' }
  ] }
];

// הספרים שבסוף המדף שהם קישורים — app: אפליקציה אחרת מהתצורה, url: אתר.
var LINKS = [
  { k: 'mafteach', lab: 'מפתח', cover: 'brown', sp: [38, 76], app: self.APP.android.launch.mafteach },
  { k: 'igrot', lab: 'אגרות קודש', cover: 'navy', sp: [48, 86], url: 'https://www.igrot.com/ikf.php' }
];
var MSG_DND = 'השתקת התראות בזמן לימוד';
var MSG_DND_ON = 'פעיל';
var MSG_DND_OFF = 'כבוי';

// ── שניים מקרא ── (ההפטרות — HAFTAROT ב-app/data.js)
var KEY_SHNAYIM = 'shnayim_parasha';
var MSG_HAFTARA = 'הפטרת ';
var MSG_NO_HAFTARA = 'ההפטרה אינה בסריקה';
var MSG_MINHAG_OPEN = 'פתיחת מנהגי חב״ד בהפטרות';
var MSG_MINHAG_TITLE = 'מנהגי חב״ד בהפטרות';
var MSG_SPECIAL_OPEN = 'פתיחת הפטרות מיוחדות';
var MSG_SPECIAL_TITLE = 'הפטרות מיוחדות';

// ── מפת השיעורים ──
var PARSHIOT = ['בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי',
  'שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי',
  'ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי',
  'במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חוקת', 'בלק', 'פינחס', 'מטות', 'מסעי',
  'דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'];

// ── היום יום ──
// הספר שנה אחת, מי״ט כסלו תש״ג עד י״ח כסלו תש״ד — יום לכל רשומה, בסדר הספר; החודשים בסדר הזה, [חודש, מיום, עד יום].
// הבחירה שומרת את מקום היום בספר, והבורר מסדר מתשרי עד אלול.
var HY_MONTHS = [['kislev', 19, 29], ['tevet', 1, 29], ['shevat', 1, 30], ['adar1', 1, 30], ['adar2', 1, 29], ['nisan', 1, 30],
  ['iyar', 1, 29], ['sivan', 1, 30], ['tamuz', 1, 29], ['av', 1, 30], ['elul', 1, 29], ['tishri', 1, 30], ['heshvan', 1, 29], ['kislev', 1, 18]];

var HY_NAMES = { tishri: 'תשרי', heshvan: 'חשון', kislev: 'כסלו', tevet: 'טבת', shevat: 'שבט', adar1: 'אדר א', adar2: 'אדר ב',
  nisan: 'ניסן', iyar: 'אייר', sivan: 'סיון', tamuz: 'תמוז', av: 'מנחם אב', elul: 'אלול' };

// רוחב כל עמוד סרוק; הגבהים — SCAN ב-app/data.js.
var SCAN_W = 1600;

// רמב״ם — מאגר משנה תורה: laam1–laam14, hkd ו-mzv (רמב״ם לעם), mrh (מורה השיעור) ו-vil1–vil12 (דפוס וילנא), הספרים השלמים, עמוד לכל קובץ.
// RAMBAM_VOLS — תיקיות רמב״ם לעם לפי המספר שבמפה (RAMBAM_MAP ב-app/data.js).
var RAMBAM_VOLS = ["hkd","mzv","laam1","laam2","laam3","laam4","laam5","laam6","laam7","laam8","laam9","laam10","laam11","laam12","laam13","laam14"];

// ── תהלים — פרקים אישיים ──
var KEY_TH_PEOPLE = 'tehillim_people';
var MSG_TH_PEOPLE_TITLE = 'פרקים אישיים';
var MSG_TH_PEOPLE_OPEN = 'הגדרת הפרקים האישיים';
var MSG_TH_PEOPLE_ADD = '+ הוספת אדם';
var MSG_TH_PEOPLE_NAME = 'שם';
var MSG_TH_PEOPLE_DATE = 'תאריך לידה';
var MSG_TH_DAY = 'יום';
var MSG_TH_MONTH = 'חודש';
var MSG_TH_YEAR = 'שנה';
var MSG_TH_PEOPLE_NONE = 'עוד לא הוגדרו פרקים אישיים — «הגדרת הפרקים האישיים» למטה.';
var MSG_TH_PEOPLE_DEL = 'הסרה';
var MSG_TH_PEOPLE_SAVE = 'שמירה';

// החומש N בתורה תמימה — התיקייה ttN.
function ttDir(v) { return 'tt' + v; }

export { KEY_TH_PEOPLE, MSG_TH_PEOPLE_TITLE, MSG_TH_PEOPLE_OPEN, MSG_TH_PEOPLE_ADD, MSG_TH_PEOPLE_NAME, MSG_TH_PEOPLE_DATE, MSG_TH_DAY, MSG_TH_MONTH, MSG_TH_YEAR, MSG_TH_PEOPLE_NONE, MSG_TH_PEOPLE_DEL, MSG_TH_PEOPLE_SAVE, SBT_URL, MSG_SBT_CLOSE, MSG_SBT_OPEN, ttDir, LINKS, MSG_DND, MSG_DND_OFF, MSG_DND_ON, MSG_NO_LUACH_DAY, MSG_NO_NOTES_DAY, MSG_NO_LUACH_CH, MSG_NO_NOTES_CH, KEY_TANYA_DAY, MSG_TANYA_DAY, MSG_YEAR_LEAP, MSG_YEAR_REG, TY_MONTHS, MSG_ALT_PAGE, MSG_BOOKS_TITLE, MSG_SHARE_FAIL, MSG_SHARE_NONE, MSG_SHARE_PREP, MSG_SHARE_TITLE, KEY_SHNAYIM, MSG_HAFTARA, MSG_MINHAG_OPEN, MSG_MINHAG_TITLE, MSG_NO_HAFTARA, MSG_SHNAYIM, MSG_SPECIAL_OPEN, MSG_SPECIAL_TITLE, ALIYOT, CH_URL, MSG_CH_CHABAD, KEY_CHUMASH, MSG_CHUMASH, MSG_NEXT_ALIYAH, MSG_PICK_ALIYAH_TITLE, MSG_PREV_ALIYAH, HY_MONTHS, HY_NAMES, HY_URL, MSG_HAYOM_YOM, MSG_NEXT_DAY, MSG_PICK_DAY_TITLE, MSG_PREV_DAY, KEY_HAYOM, KEY_RAMBAM, KEY_TANYA, KV_TABLE, MSG_HAKDAMA, MSG_NAV_BACK, MSG_NAV_EXIT, MSG_NAV_HOME, MSG_HOME_TITLE, MSG_LOAD_FAIL, MSG_LUACH, MSG_MOREH, MSG_MOREH_CLOSE, MSG_MOREH_OPEN, MSG_NEXT_LESSON, MSG_NEXT_PARASHA, MSG_PREV_LESSON, MSG_PREV_PARASHA, MSG_NOTES, MSG_PEREK, MSG_PICK_CUR, MSG_PICK_NONE, MSG_PICK_PARASHA_TITLE, MSG_PICK_SEARCH, MSG_PICK_TITLE, MSG_RAMBAM, MSG_RAMBAM_OPENING, MSG_SOON, MSG_TANYA_WEEK, MSG_VIL_CLOSE, MSG_VIL_OPEN, PARSHIOT, PUSH_TABLES, MT_URL, RAMBAM_VOLS, SCAN_W, SUPABASE_ANON_KEY, SUPABASE_URL, LESSONS, TABLES, TANYA_BOOKS, TANYA_URL };
