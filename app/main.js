// app/main.js — העלייה, מפת הפעולות והניווט
import { appConfigure, getDeviceId, netTimeout } from '../core/util.js';
import { eraKeys, pendAlertDismiss, pendCount, sbWatch } from '../core/sync.js';
import { lsOpen } from '../core/storage.js';
import { MIRROR, mirrorKey, mirrorTables } from '../core/mirror.js';
import { logAwait } from '../core/backup.js';
import { bootRun } from '../core/boot-run.js';
import { actWire, closeAsk, closeModal, esc, shellBare, swApply, swHideUpdate, uiNoDialog } from '../core/ui.js';
import { KEY_CHUMASH, KEY_HAYOM, KEY_RAMBAM, KEY_TANYA, KV_TABLE, MSG_NAV_BACK, MSG_NAV_EXIT, MSG_NAV_HOME, MSG_VIL_CLOSE, MSG_VIL_OPEN, PUSH_TABLES, SUPABASE_ANON_KEY,
         SUPABASE_URL, TABLES } from './constants.js';
import { S, shell, view } from './state.js';
import { PICKERS, chumashCur, hayomCur, lessonPickOpen, pickerFilter, pickerOpen, pinchEnd, pinchMove, pinchReset, pinchStart, rambamCur, sPendKey, sPendKeyOf, sPickSet, sQ, sStripRows, sSyncNow, sSyncPull,
         sTableMeta, tanyaCur } from './domain.js';
import { homeScreenHTML } from './screens/home.js';
import { rambamMorehFill, rambamMount, rambamScreenHTML, rambamVilnaFill } from './screens/rambam.js';
import { chumashMount, chumashScreenHTML } from './screens/chumash.js';
import { hayomMount, hayomScreenHTML } from './screens/hayom.js';
import { tanyaMount, tanyaScreenHTML } from './screens/tanya.js';
import { icon } from './icons.js';

// ── החיווט ──
// החיווט נמסר בשומרי קריאה — ה-CFG מוגדרים בהמשך, והשומר קורא אותם בזמן הקריאה ולא בזמן המסירה.
appConfigure({
  get BK_CFG() { return BK_CFG; },
  get DEV_CFG() { return DEV_CFG; },
  get DOM_ACTIONS() { return DOM_ACTIONS; },
  get ERA_CFG() { return ERA_CFG; },
  get LS_CFG() { return LS_CFG; },
  get MIRROR_CFG() { return MIRROR_CFG; },
  get PEND_CFG() { return PEND_CFG; },
  get PL_CFG() { return PL_CFG; },
  get PUSH_CFG() { return PUSH_CFG; },
  get RTY_CFG() { return RTY_CFG; },
  get saveRefresh() { return saveRefresh; }
});

var MIRROR_CFG = {
  prefix: self.APP.prefix + 'mirror_',
  tables: function () { return TABLES.map(function (m) { return m.t; }); },
  // ריק ומוצהר — שדה חסר נקרא «לא נשאל», וריק נקרא «נמדד ואין».
  noPush: [],
  empty:  function () { return []; },
  clean:  function (t, rows) { return sStripRows(t, rows); },
  fail:   function (where, e) { console.error('[mirror] ' + where, e); },
};

var LS_CFG = {
  cachePrefix: self.APP.id + '-',
  logKey: 's_ls_log',
  dismissKey: 's_sw_dismissed',
  // מפתח שאינו במרשם נמחק בעלייה.
  keys: function () {
    return [LS_CFG.logKey, LS_CFG.dismissKey, DEV_CFG.key, PEND_CFG.key,
            BK_CFG.flagKey, BK_CFG.logQueueKey]
      .concat(eraKeys(), mirrorTables().map(mirrorKey));
  }
};

var DEV_CFG = { key: 's_device_id' };

var BK_CFG = {
  client: function () { return S.sb; },
  flagKey: 's_last_backup',
  logQueueKey: 's_log_queue',
  prefix: '',
  device: function () { try { return getDeviceId(); } catch (e) { return null; } },
  // אין כניסה ולכן אין שם משתמש — המכשיר הוא הזהות היחידה, ושדה מומצא היה עדות שאיש לא מסר.
  user: function () { return null; },
  secrets: [],
  sources: function () {
    return [
      { name: KV_TABLE, order: 'key', ts: 'updated_at' }
    ];
  }
};

var PEND_CFG = {
  key: 's_pending',
  // סימון שקידומתו אינה כאן יורד בעלייה — אין לו כותב ואין שורה שתידחף ותוריד אותו.
  marks: function () { return PUSH_TABLES.map(function (t) { return sPendKeyOf(t, ''); }); },
  redraw: function () { }
};

var RTY_CFG = {
  flush:   function () { return sSyncNow(); },
  pending: function () { try { return pendCount() > 0; } catch (e) { return false; } },
};

var PL_CFG = {
  every:  3000,
  // אין כניסה — הבדיקה המחזורית פעילה כל עוד הלשונית גלויה.
  active: function () { return document.visibilityState !== 'hidden'; },
  seen:   function () { return S._sSeenTs; },
  note:   function (ts) { S._sSeenTs = ts; },
  ok:     function () { S._lastSeenOk = Date.now(); },
  pull:   function () { return sSyncNow(); },
  client: function () { return S.sb; },
  table:  function () { return KV_TABLE; },
};

var PUSH_CFG = {
  tables: PUSH_TABLES,
  chunk:  500,
  delay:  400,
  rows:   function (t) { return MIRROR[t] || []; },
  key:    function (t, row) { return sPendKey(t, row); },
  send:   function (t, rows) {
    var m = sTableMeta(t);
    return netTimeout(S.sb.from(t).upsert(rows, { onConflict: m.key }));
  },
  run:    function () { sSyncNow(); },
};

var ERA_CFG = {
  prefix: self.APP.prefix,
  client: function () { return S.sb; },
  table:  function () { return KV_TABLE; },
  refresh: function () { return sSyncNow(); },
  log:    function (action, entries) { return logAwait(action, entries); }
};

function saveRefresh() { sRender(); }

document.title = self.APP.name;

// ── הרינדור ──
// הבחירה שמצוירת כבר אינה מצוירת מחדש — משיכה מהענן אינה מוחקת עמודים שנטענו ולוחות שנפתחו.
// ברשימת השיעורים — מדף הכריכות; בשיעור — הדף על כל המסך, וסרגל הקריאה נאסף בגלילה.
function sRender() {
  var root = sQ('#view');
  if (!root) { uiNoDialog('sRender', 'view'); return; }
  var home = view.screen === 'home';
  var cur = home ? (rambamCur() + ':' + tanyaCur()) : view.screen === 'tanya' ? tanyaCur()
    : view.screen === 'hayom' ? hayomCur() : view.screen === 'chumash' ? chumashCur() : rambamCur();
  if (view.shown[view.screen] !== cur || !root.firstChild || root.dataset.screen !== view.screen) {
    root.dataset.screen = view.screen;
    if (home) root.innerHTML = homeScreenHTML();
    else if (view.screen === 'tanya') { root.innerHTML = tanyaScreenHTML(); tanyaMount(); }
    else if (view.screen === 'hayom') { root.innerHTML = hayomScreenHTML(); hayomMount(); }
    else if (view.screen === 'chumash') { root.innerHTML = chumashScreenHTML(); chumashMount(); }
    else { root.innerHTML = rambamScreenHTML(); rambamMount(); }
    view.shown = { home: null, rambam: null, tanya: null, hayom: null, chumash: null };
    view.shown[view.screen] = cur;
  }
  document.body.classList.toggle('reading', !home);
  document.body.classList.toggle('shelf', home);
  if (home) document.body.classList.remove('calm');
  shellBare(false);
}

// ── ההיסטוריה ──
// כל מעבר — מסך או בחירה — רשומה בהיסטוריה של הדפדפן; «חזור» וכפתור החזרה של הטלפון חוזרים אליה.
// d — עומק הרשומה: בראשונה אין לאן לחזור, ו«חזור» הולך לבית.
function navState(d) {
  var P = PICKERS[view.screen];
  return { screen: view.screen, v: P ? P.cur() : null, d: d };
}
// הדפדפן אינו משחזר גלילה בחזרה — המסך שחוזרים אליו עולה לראשו, כמו בכל מעבר.
try { history.scrollRestoration = 'manual'; } catch (e) { /* דפדפן ישן */ }
function navDepth() { return (history.state && history.state.d) || 0; }
function navPush() { try { history.pushState(navState(navDepth() + 1), ''); } catch (e) { /* בלי היסטוריה — הניווט עובד בלעדיה */ } }
window.addEventListener('popstate', function (e) {
  var st = e.state;
  view.screen = st && st.screen ? st.screen : 'home';
  var P = PICKERS[view.screen];
  if (P && st && typeof st.v === 'number' && st.v !== P.cur()) sPickSet(P.key, st.v);
  sRender();
  navTop();
});
function navBack() { if (navDepth() > 0) history.back(); else go('home'); }

// מסך חדש עולה לראשו, והשורות גלויות.
function navTop() {
  document.body.classList.remove('calm');
  window.scrollTo({ top: 0 });
}

function go(screen) {
  view.screen = screen;
  sRender();
  navPush();
  navTop();
}

// בחירה חדשה נכתבת לטבלת ההגדרות ומסתנכרנת לכל המכשירים, והמסך עולה לראשו.
function pickGo(key, v) {
  sPickSet(key, v);
  sRender();
  navPush();
  navTop();
}

// השורה התחתונה — חזור · בית · יציאה; «יציאה» רק במעטפת, שקולטת את הקישור וסוגרת את האפליקציה.
function botBarHTML() {
  var it = function (act, ico, lab) { return '<button class="bb-it" data-act="' + act + '">' + icon(ico) + '<span>' + esc(lab) + '</span></button>'; };
  var exit = /\bwv\b/.test(navigator.userAgent)
    ? '<a class="bb-it" href="app-exit:close">' + icon('exit') + '<span>' + esc(MSG_NAV_EXIT) + '</span></a>' : '';
  return '<div class="in">' + it('nav-back', 'back', MSG_NAV_BACK) + it('go-home', 'home', MSG_NAV_HOME) + exit + '</div>';
}

// הסרגל נאסף בגלילה למטה וחוזר בגלילה למעלה — הדף לבדו על המסך.
var lastY = 0;
function calmOnScroll() {
  var y = window.scrollY;
  if (!document.body.classList.contains('reading')) { lastY = y; return; }
  if (y > lastY + 8 && y > 80) document.body.classList.add('calm');
  else if (y < lastY - 8 || y < 40) document.body.classList.remove('calm');
  lastY = y;
}

// ── מפת הפעולות ──
var DOM_ACTIONS = {
  'tab-go': function (el) { go(el.dataset.id); },
  'go-home': function () { go('home'); },
  'nav-back': function () { navBack(); },
  'lesson-pick': function (el) { lessonPickOpen(el.dataset.id); },
  'lesson-go': function (el) { closeModal(); go(el.dataset.id); },
  'read-toggle': function () { if (!pinchReset()) document.body.classList.toggle('calm'); },
  'pick-open': function (el) { pickerOpen(el.dataset.k); },
  'pick-go': function (el) {
    closeModal();
    var P = PICKERS[el.dataset.k];
    if (!P) { uiNoDialog('pick-go', el.dataset.k); return; }
    pickGo(P.key, +el.dataset.id);
  },
  'rambam-next': function (el) { pickGo(KEY_RAMBAM, +el.dataset.id); },
  'tanya-next':  function (el) { pickGo(KEY_TANYA, +el.dataset.id); },
  'hayom-next': function (el) { pickGo(KEY_HAYOM, +el.dataset.id); },
  'chumash-next': function (el) { pickGo(KEY_CHUMASH, +el.dataset.id); },
  'moreh-open': function () {
    closeModal();
    var ms = sQ('#moreh'), box = sQ('#moreh-pages');
    if (!ms || !box) { uiNoDialog('moreh-open', 'moreh'); return; }
    ms.classList.remove('hidden');
    if (!box.firstChild) rambamMorehFill(box);
    ms.scrollIntoView({ block: 'start' });
  },
  'moreh-close': function () { var ms = sQ('#moreh'); if (ms) ms.classList.add('hidden'); },
  'vilna-toggle': function (el) {
    var lesson = el.closest('.lesson'), vs = lesson && lesson.querySelector('[data-vil]');
    if (!vs) { uiNoDialog('vilna-toggle', el.dataset.id); return; }
    var open = vs.classList.toggle('hidden') === false;
    el.textContent = open ? MSG_VIL_CLOSE : MSG_VIL_OPEN;
    if (open && !vs.firstChild) rambamVilnaFill(vs, +el.dataset.id);
    if (open) vs.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },
  'ask-yes': function () { closeAsk(true); },
  'ask-no':  function () { closeAsk(false); },
  'modal-close': function () { closeModal(); },
  'ls-alert-close': function () { var el = document.getElementById('ls-alert'); if (el) el.remove(); },
  'pend-alert-ok':  function () { pendAlertDismiss(); },
  'sw-apply': function (el) { swApply(el); },
  'sw-dismiss': function () { swHideUpdate(); }
};

// ── המאזינים הגלובליים ──
// מאזין אחד לכל אירוע, בהאצלה מ-document — המסכים נבנים מחדש בכל רינדור, ומאזין שנקשר לאלמנט מת איתו.
actWire(DOM_ACTIONS);

document.addEventListener('input', function (e) {
  var el = e.target;
  if (el && el.dataset && el.dataset.inp === 'pick-q') pickerFilter(el.value);
});

window.addEventListener('scroll', calmOnScroll, { passive: true });

// touchmove אינו פסיבי — הצביטה עוצרת את הגלילה של הדפדפן בזמן שהיא מותחת את הדף.
document.addEventListener('touchstart', pinchStart, { passive: true });
document.addEventListener('touchmove', pinchMove, { passive: false });
document.addEventListener('touchend', pinchEnd);
document.addEventListener('touchcancel', pinchEnd);

// ── העלייה ──
function sBoot() {
  shell.sRender = sRender;
  var bb = sQ('#botbar');
  if (bb) bb.innerHTML = botBarHTML();
  S.sb = sbWatch(window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY));
  // הליבה עולה לפני הציור הראשון — המסך עולה מהמראה, והסימונים הממתינים מוצגים מהשנייה הראשונה.
  bootRun();
  sRender();
  try { history.replaceState(navState(0), ''); } catch (e) { /* בלי היסטוריה */ }
  sSyncPull().then(function () { sRender(); });
}

// האחסון נפתח לפני כל קריאה ממנו — אחרי שה-CFG הוגדרו, כי המרשם קורא אותם.
await lsOpen();
sBoot();

window.bootOk();
