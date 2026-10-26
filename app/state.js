// app/state.js — המצב המשותף בין המודולים

// מצב שמודולים שונים כותבים — אובייקט אחד, כי קישור מיובא אינו ניתן להשמה.
const S = {
  sb: null,
  _sSeenTs: null,
  _lastSeenOk: 0,
  _syncBusy: false,
  _sPullLogged: false
};

// ── מצב הריצה ──
// הבחירה עצמה אינה כאן — היא שורה בטבלת ההגדרות, והמסך קורא אותה מהמראה.
// shown — השיעור שמצויר עכשיו בראש המסך: ציור מחדש רק כשהבחירה זזה ממנו, והעמודים שנטענו נשארים.
var view = { screen: 'rambam', shown: { rambam: null, tanya: null } };

// ── מה שמסך צריך מ-main ──
// main רושם כאן בעלייה — מודול שמייבא מ-main סוגר מעגל, והרישום הוא הכיוון האחד.
const shell = { sRender: null };

export { S, shell, view };
