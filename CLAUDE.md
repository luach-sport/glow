# Glow – הוראות לעבודה על הפרויקט

## כלל ראשון: הרבה קבצים קטנים
כל יכולת בקובץ קטן משלה (בערך עד 120 שורות). מוסיפים קובץ בתיקייה המתאימה ומוסיפים אותו ל-`www/index.html` (הסדר שם קובע).

## מה האפליקציה עושה
שלושה חלקים נפרדים (`state`):
- **משפטים** (`quotes`): דולק/כבוי, קבוצה, סדר (`random` / `list` לפי `qOrder`), מתי (`seconds` / `interval` / `screen` / `parts` / `manual`), ובמסך הנעילה (`notification` / `wallpaper` / `off`). במסך הבית – תמיד בווידג'ט.
- **רקעים מ-Glow** (`walls.home`, `walls.lock`): לא חובה. מסך כבוי = הרקע של המשתמש, לא נוגעים בו. `mode` = `same` (סבב `both`) או `separate` (`home` ו-`lock`); לכל סבב `album` ו-`img` (מתי).
- **הווידג'ט** (`widget`): מראה (`glass`/`dark`/`light`/`clear`/`brand`), צבע, יישור, כפתורים.

## איך זה בנוי
- `www/` – האפליקציה (HTML/JS/CSS בלי תלויות) בתוך Capacitor. הכל תחת `window.GL`:
  - `core/` עזרים, אייקונים והלוגו, גשר לאנדרואיד, רשת, שמירה, קבצי תמונות (`files`), שיתוף (`device`).
  - `data/` התמונות המובנות (`walls.js`, נוצר), המשפטים (`quotes.js`), ברירות מחדל, בדיקת נתונים, מצב, וספרייה (`library`: כל התמונות והמשפטים, אלבומים, מועדפים, מחוץ לסבב).
  - `engine/` – `bridge` (קריאות למנוע, ובדפדפן תחליף בזיכרון: `GL.EN.sim`), `sync` (בונה את `engine.json` ושולח אחרי כל שינוי), `compose` (ציור הרקע עם המשפט ב-canvas – אותם כללים כמו `Composer.java`).
  - `views/` מסך לכל קובץ, `sheets/` חלון לכל קובץ, `actions/` מה כל כפתור עושה (`data-action`), `features/` עדכונים, פניות, שיתוף, חנות.
- `android-native/` – המנוע (Java), מועתק לפרויקט ב-`scripts/patch-android.sh`:
  `GlowPlugin` (הדלת מהאפליקציה), `Engine` (רקעים: "שקית" מעורבבת, הגדרת הרקע, היסטוריה, חזרה), `Quotes` (המשפט: בחירה, סדר, מתי), `Composer` (ציור), `Store` (engine.json ומצב), `Scheduler` + `AlarmReceiver` (לפי זמן), `ScreenService` (שירות קדמי: מחליף כשהמסך **נכבה**, וההודעה שלו היא המשפט במסך הנעילה), `BootReceiver`, `GlowWidget` + `GlowWidgetService` (AdapterViewFlipper: במצב "כל כמה שניות" המשגר מחליף לבד).
- `android-res/` – אייקונים, ווידג'ט (layout, xml, drawables). `tools/make-icons.mjs` מייצר את האייקונים.
- `tools/make-walls.py` מצייר את 50 התמונות המובנות (`www/img/walls`, `www/img/thumbs`, `www/js/data/walls.js`). `tools/make-packs.py` בונה את החנות ב-`site/static/packs/` (נכנס לאתר ב-`/glow/packs/`). להוספת חבילה: כותבים אותה שם, מעלים `version` כשמשנים, ומריצים.
- `tests/smoke.mjs` – בדיקה בדפדפן של כל המסכים (שרת על `www` בפורט 8765).

## אתר ההסבר
- https://luach-sport.github.io/glow/ (`.github/workflows/site.yml`, ענף `gh-pages`), מהערכה המשותפת `luach-sport/itzko` (`kit/`). האפליקציה רשומה ב-`apps.json` שם.
- `site/site.json`, `site/parts/` (פרק לכל מסך), `site/css/brand.css`, צילומים אוטומטיים מ-`scripts/site/scenes.mjs`.
- **בכל שינוי במסך, כפתור או יכולת – מעדכנים באותו commit גם את הפרק ב-`site/parts/`.**

## חשוב לדעת
- **מה חדש**: `release-notes.txt` לפני כל גרסה.
- גרסה: `APP_VERSION` ב-`.github/workflows/build.yml`.
- חתימה: `signing/release.jks` (כינוי `glow`), הסיסמה רק ב-Secret `GLOW_KEY_PASS`.
- שינוי ב-`android-native/`, `android-res/`, `patch-android.sh`, `capacitor.config.json` או בתוספים מחייב APK חדש (האפליקציה מזהה ומציעה להוריד).
- הנתונים: `state-a.json` / `state-b.json` בתיקיית הנתונים; תמונות המשתמש ב-`glow/img`, `glow/thumb`; חבילות ב-`glow/packs/<id>`; המנוע קורא `glow/engine.json`.
- פניות: אותו Apps Script של שאר האפליקציות, `app: 'glow'`.
- קרדיט: "פותח על ידי Itzko" / "Developed by Itzko" בתחתית ההגדרות.
