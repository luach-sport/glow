# Builds the store on Glow's site (site/static/packs/ → https://luach-sport.github.io/glow/packs/):
#   index.json            the list the app shows in the "store" tab
#   <id>/pack.json        a pack: sentences, or pictures with their files
#   <id>/img/*.jpg …      the pictures of a picture pack (drawn from code like the built-in ones)
# Add a pack: write it below, bump "version" when you change one, run: python3 tools/make-packs.py
import importlib.util, json, os, random
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'site', 'static', 'packs')
spec = importlib.util.spec_from_file_location('walls', os.path.join(ROOT, 'tools', 'make-walls.py'))
W = importlib.util.module_from_spec(spec); spec.loader.exec_module(W)

QUOTE_PACKS = [
    {'id': 'boker', 'name': 'בוקר טוב', 'version': 1, 'auto': True,
     'desc': 'משפטים קצרים לפתוח איתם את היום בכוח ובשמחה.',
     'items': ['בוקר חדש, הזדמנות חדשה.', 'קום, חייך, והתחל.', 'היום הזה עוד לא נכתב – תכתוב אותו יפה.', 'כל בוקר הוא מתנה.', 'תודה על עוד יום.',
               'שתייה, נשימה, ויוצאים לדרך.', 'הבוקר קובע את היום.', 'תן לשמש להזכיר לך להאיר.', 'צעד ראשון של היום – הכי חשוב.', 'היום אני בוחר בשמחה.',
               'עוד יום לעשות טוב.', 'בוקר של התחלות.', 'קודם כל – לחייך.', 'האנרגיה של הבוקר מחזיקה את כל היום.', 'אל תמהר. תתחיל נכון.',
               'יום חדש, לב פתוח.', 'מה הדבר הכי חשוב היום? תתחיל בו.', 'כל זריחה היא הבטחה.', 'קם עם כוונה, הולך עם כוח.', 'היום יהיה יום טוב.',
               'שגרה טובה בונה חיים טובים.', 'הבוקר שלך – הכללים שלך.', 'תתחיל מהקל, תמשיך לגדול.', 'אור חדש בחוץ, וגם בפנים.', 'בוקר של אמונה.',
               'מה שתעשה הבוקר ילווה אותך כל היום.', 'שמחה של בוקר – כוח לכל היום.', 'תודה, אני מוכן.', 'אחד, שתיים, שלוש – יוצאים!', 'יום מלא אפשרויות.']},
    {'id': 'hatzlacha', 'name': 'הצלחה ועשייה', 'version': 1,
     'desc': 'לימים של עבודה, לימודים ויעדים גדולים.',
     'items': ['הצלחה היא סכום של מאמצים קטנים.', 'תעבוד בשקט, תתקדם בבטחה.', 'מטרה ברורה – דרך ברורה.', 'כל שעה של עבודה מקרבת אותך.', 'תסיים את מה שהתחלת.',
               'אל תחכה לביטחון. הוא בא תוך כדי.', 'הפוקוס הוא כוח-על.', 'עדיף טוב היום ממושלם אף פעם.', 'מה שמודדים – משתפר.', 'תעשה את הקשה קודם.',
               'כל יום קצת יותר טוב.', 'הרגלים קטנים, תוצאות גדולות.', 'לימוד הוא השקעה לכל החיים.', 'תכנן את העבודה, ותעבוד לפי התכנון.', 'הסבלנות היא חלק מהתוכנית.',
               'תהיה גאה בתהליך, לא רק בתוצאה.', 'אל תפחד לשאול. כך לומדים.', 'אין עבודה קטנה כשעושים אותה בלב שלם.', 'לחץ הופך פחם ליהלום.', 'תחגוג כל התקדמות.',
               'מי שמתמיד – מגיע.', 'העתיד נבנה עכשיו.', 'תן לעבודה שלך לדבר.', 'קודם מתחילים, אחר כך משתפרים.', 'טעות היום – ניסיון מחר.',
               'כל משימה שנגמרה היא ניצחון.', 'תזכור למה זה חשוב לך.', 'החלומות לא עובדים אם אתה לא עובד.', 'עוד פרק, עוד שלב, עוד צעד.', 'יש לך את זה.']},
    {'id': 'shalva', 'name': 'שלווה והודיה', 'version': 1,
     'desc': 'משפטים רגועים לנשום, לעצור ולהודות.',
     'items': ['לנשום עמוק. הכל בסדר.', 'תודה על הדברים הקטנים.', 'הרגע הזה מספיק.', 'שקט בפנים – שקט בחוץ.', 'אין צורך למהר.',
               'כל נשימה היא מתנה.', 'תסתכל סביב: יש כל כך הרבה טוב.', 'הלב רגוע, הראש צלול.', 'מותר לעצור.', 'השמחה נמצאת בפשוט.',
               'תודה על מה שיש, ותודה על מה שיבוא.', 'פחות דאגה, יותר אמונה.', 'השלווה היא בחירה.', 'שים את הטלפון רגע, ותסתכל לשמיים.', 'לאט. בנחת. בשמחה.',
               'כל יום יש לפחות סיבה אחת להודות.', 'בית שמח מתחיל בלב שמח.', 'מילה טובה משנה יום.', 'תן לעצמך רגע של שקט.', 'החיים יפים, גם כשהם לא מושלמים.',
               'הטוב כבר כאן.', 'אור קטן בכל פינה.', 'מה שצריך לבוא – יבוא.', 'סבלנות היא סוג של שלווה.', 'הכל מתחיל בתודה.']},
]

IMAGE_PACKS = [
    {'id': 'zrichot', 'name': 'זריחות ושקיעות', 'version': 1, 'desc': '10 תמונות של שמיים בוערים – לבוקר ולערב.', 'seed': 500, 'make': [
        ('שחר סגלגל', ['morning'], lambda r: W.mountains(r, [(0, '#2D2F6B'), (0.42, '#D98AB5'), (0.6, '#FFD7B8')], ['#8A5A9A', '#664180', '#432C63', '#271A42'], (0.55, 0.5, 60, '#FFE6C8', '#FFF6E8'), 0.3)),
        ('בוקר כתום', ['morning'], lambda r: W.sea(r, [(0, '#4A5F9A'), (0.42, '#F7A86E'), (0.56, '#FFE2B0')], [(0, '#F4B080'), (0.4, '#6F6F99'), (1, '#1F2448')], (0.4, 0.53, 60, '#FFE9BC', '#FFF7E0'))),
        ('זריחה בדיונות', ['morning'], lambda r: W.dunes(r, [(0, '#6A7FB8'), (0.45, '#F7C08E'), (0.57, '#FFE8C2')], [('#E2A46A', '#A3663A'), ('#D08F54', '#8F542C'), ('#BA7840', '#77431F')], (0.62, 0.52, 58, '#FFF0CC', '#FFFBEA'))),
        ('הר בשחר', ['morning'], lambda r: W.mountains(r, [(0, '#1B2A55'), (0.5, '#8A86C2'), (0.62, '#F4CDBF')], ['#5A5C94', '#454679', '#30315C', '#1C1D3D'], (0.3, 0.55, 48, '#FFE5D0', '#FFF5EC'), 0.4)),
        ('זהב של בוקר', ['morning', 'noon'], lambda r: W.mountains(r, [(0, '#7C9BD0'), (0.5, '#F6D39E'), (0.62, '#FFF1D6')], ['#C9A57C', '#A98560', '#866547', '#5E4530'], (0.7, 0.45, 56, '#FFF3D2', '#FFFCEF'), 0.35)),
        ('שקיעה אדומה', ['evening'], lambda r: W.sea(r, [(0, '#2A1A4A'), (0.4, '#D2455A'), (0.55, '#FF9C5A')], [(0, '#E0704E'), (0.35, '#6A2E55'), (1, '#140C26')], (0.5, 0.52, 68, '#FFC27A', '#FFE6B8'))),
        ('ערב ורוד', ['evening'], lambda r: W.forest(r, [(0, '#4A2A72'), (0.45, '#E57AA6'), (0.6, '#FFC9B0')], ['#9A4F80', '#743A66', '#4E264A', '#2A1429'], 0.3)),
        ('רכס בשקיעה', ['evening'], lambda r: W.mountains(r, [(0, '#3A2468'), (0.45, '#F0855E'), (0.6, '#FFCF86')], ['#7A4458', '#5C3245', '#3E2231', '#22131C'], (0.45, 0.57, 62, '#FFD99A', '#FFF0CC'), 0.2)),
        ('אחרון האור', ['evening', 'night'], lambda r: W.sea(r, [(0, '#151A40'), (0.45, '#6A4C8E'), (0.56, '#E88C86')], [(0, '#A3667E'), (0.4, '#3A2A5E'), (1, '#0A0A1E')], (0.6, 0.55, 40, '#FFB8A0', '#FFDCCC'))),
        ('שקיעה במדבר', ['evening'], lambda r: W.dunes(r, [(0, '#2E2458'), (0.45, '#D9677A'), (0.58, '#FFB38A')], [('#A2505E', '#5C2636'), ('#863F50', '#4A1C2C'), ('#673043', '#361421')], (0.35, 0.55, 56, '#FFCB9A', '#FFE8CC'))),
    ]},
    {'id': 'tzvaim', 'name': 'צבעים רכים', 'version': 1, 'desc': '10 רקעים צבעוניים ונקיים – המשפט בולט עליהם במיוחד.', 'seed': 700, 'make': [
        ('סגול עמוק', ['evening', 'night'], lambda r: W.waves(r, ['#6A2FC8', '#9A3FD0', '#C94FB8'], [(0, '#1C0C36'), (1, '#2E1250')])),
        ('ורוד בהיר', ['morning', 'noon'], lambda r: W.waves(r, ['#F7A8C8', '#F089B5', '#E06AA0'], [(0, '#FFE4EF'), (1, '#FFD0E3')])),
        ('תכלת רגוע', ['morning', 'noon'], lambda r: W.waves(r, ['#8FD0F5', '#5FB2EA', '#3E8ED6'], [(0, '#E4F5FD'), (1, '#C6E8FA')])),
        ('ירוק מנטה', ['morning', 'noon'], lambda r: W.waves(r, ['#8EE0C0', '#5CC9A2', '#2FAE85'], [(0, '#E2FAF0'), (1, '#C2F0DD')])),
        ('לילה כחול', ['night'], lambda r: W.bokeh(r, [(0, '#081030'), (1, '#16224E')], ['#7FA8FF', '#FFFFFF', '#B8A2FF'])),
        ('זהב חם', ['morning', 'evening'], lambda r: W.bokeh(r, [(0, '#3A1E0A'), (1, '#6A3A12')], ['#FFD27A', '#FFB060', '#FFF0C8'])),
        ('אפרסק', ['morning', 'noon'], lambda r: W.vgrad([(0, '#FFD6C2'), (0.5, '#FFB8A8'), (1, '#F59AB0')])),
        ('לבנדר', ['noon', 'evening'], lambda r: W.vgrad([(0, '#E6DAFF'), (0.5, '#C8B4F5'), (1, '#A98EE8')])),
        ('ים כהה', ['evening', 'night'], lambda r: W.waves(r, ['#0E5A7A', '#0B4560', '#08324A'], [(0, '#03141F'), (1, '#062436')])),
        ('גחלים', ['night'], lambda r: W.bokeh(r, [(0, '#140808'), (1, '#2A0E14')], ['#FF7A50', '#FFB070', '#FF5A7A'])),
    ]},
]

def main():
    os.makedirs(OUT, exist_ok=True)
    index = []
    for p in QUOTE_PACKS:
        d = os.path.join(OUT, p['id']); os.makedirs(d, exist_ok=True)
        items = [{'id': str(i + 1), 't': t} for i, t in enumerate(p['items'])]
        json.dump({'id': p['id'], 'name': p['name'], 'kind': 'quotes', 'version': p['version'], 'items': items}, open(os.path.join(d, 'pack.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        e = {'id': p['id'], 'name': p['name'], 'kind': 'quotes', 'version': p['version'], 'count': len(items), 'desc': p['desc'], 'sample': p['items'][0]}
        if p.get('auto'): e['auto'] = True
        index.append(e)
    for p in IMAGE_PACKS:
        d = os.path.join(OUT, p['id']); os.makedirs(os.path.join(d, 'img'), exist_ok=True); os.makedirs(os.path.join(d, 'thumb'), exist_ok=True)
        items, total = [], 0
        for i, (name, parts, fn) in enumerate(p['make'], 1):
            rng = random.Random(p['seed'] + i)
            im = W.finish(fn(rng), rng)
            fid = '%02d' % i
            im.save(os.path.join(d, 'img', fid + '.jpg'), quality=84, optimize=True, progressive=True)
            im.resize((270, 540), Image.LANCZOS).save(os.path.join(d, 'thumb', fid + '.jpg'), quality=80, optimize=True)
            total += os.path.getsize(os.path.join(d, 'img', fid + '.jpg'))
            items.append({'id': fid, 'name': name, 'file': 'img/' + fid + '.jpg', 'thumb': 'thumb/' + fid + '.jpg', 'parts': parts})
        json.dump({'id': p['id'], 'name': p['name'], 'kind': 'images', 'version': p['version'], 'items': items}, open(os.path.join(d, 'pack.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        index.append({'id': p['id'], 'name': p['name'], 'kind': 'images', 'version': p['version'], 'count': len(items), 'desc': p['desc'], 'size': str(round(total / 1048576, 1)) + ' MB'})
        print(p['id'], len(items), total // 1024, 'KB')
    json.dump({'v': 1, 'packs': index}, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('index', len(index), 'packs')

if __name__ == '__main__':
    main()
