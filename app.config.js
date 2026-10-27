// app.config.js — תצורת האפליקציה
self.APP = Object.freeze({
  // ממנו נגזרים ה-scope, קידומת המטמון ושם הפרויקט באנדרואיד
  id: 'shiurim',
  name: 'שיעורים',
  shortName: 'שיעורים',
  description: 'שיעורים יומיים — רמב״ם שלושה פרקים ופרק תניא, מתוך הדפוס.',
  prefix: 's_',
  colors: { theme: '#1E3A6E', background: '#F3F2EE' },
  // דף האופליין של ה-service worker — הכהה לפי אסימוני הערכה הכהה של האפליקציה
  offline: { light: { bg: '#F3F2EE', ink: '#1D2433' }, dark: { bg: '#141821', ink: '#E8E6DF' }, mark: '📴' },
  // מפתח anon ציבורי ולא מפתח שירות — ההרשאות נאכפות במסד.
  supabase: {
    url: 'https://zrftjkghhjhqzopvdzou.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZnRqa2doaGpocXpvcHZkem91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDc4MzQsImV4cCI6MjEwMDg4MzgzNH0.DWcW3o4Y9Is3jGx1frHkrUz7cc045aH1m1uKsrwRhIA'
  },
  android: {
    package: 'com.shiurim.app',
    // ממנה נגזר המקור היחיד שגשר השיתוף מקבל
    url: 'https://ygtotlrl-lab.github.io/shiurim/',
    // משפט שלם ולא שם בלבד — הפועל מתאים למין השם
    offlineLine: 'השיעורים לא הצליחו להתחבר.',
    // צבע כפתור הניסיון החוזר בדף האופליין של המעטפת
    accent: '#1e3a6e',
    // לעולם אינו יורד — בלי קידום המכשיר המותקן אינו מקבל את ה-APK החדש.
    versionCode: 5,
    versionName: '1.0',
    launcherBg: { kind: 'gradient', angle: 270, start: '#F6EFE1', end: '#E6D8BC' },
    // אפליקציות אחרות שקישור intent: רשאי לפתוח — שם ⟵ חבילה; ריק — המעטפת אינה פותחת אף אחת
    launch: { tehillim: 'org.chabad.tehillim', shas: 'com.mogy.dafyomi' },
    // FileProvider ו-androidx — רק באפליקציה שמייצאת קובץ
    share: false
  },
  // sign-apk.sh מסרב לחתום בכל מפתח אחר
  signSha256: 'A5:47:D5:54:74:6E:90:6D:AB:19:41:22:18:DE:65:0B:F0:59:AE:06:45:B5:AD:2C:BD:1F:F2:5A:AF:C4:37:44',
  icon: {
    // svg הוא מאסטר גיאומטרי שנקרא ונצבע, ו-master רסטרי הוא ציור שהוקטן — ותואם את סיומת המאסטר.
    art: 'svg',
    master: 'design/icon-master.svg',
    // ריקים ולא נשמטים — המאסטר הגיאומטרי נושא בעצמו את הרקע, הדיו ותיבת הסמל; שדה חסר נקרא לא נשאל.
    ink: null,
    bg: null,
    mark: null,
    bgKey: null,
    keyTol: null,
  }
});
