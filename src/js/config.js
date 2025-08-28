// src/js/config.js
export const APP = {
  name: 'تمدونی',
  userSalt: 'tamdooni-v1-usersalt',
};

export const COURSES = [
  {
    id: 'theme-customization',
    title: 'دوره آموزش شخصی‌سازی تم',
    cover: './assets/cover-theme.jpg',
    purchaseUrl: 'https://example.com/buy/theme-customization',
    minScoreToUnlockNext: 70,
    chapters: [
      {
        id: 'ch1',
        title: 'فصل ۱ — مبانی',
        requires: { enabled: false }, // فصل آزاد
        quiz: {
          pass: 70,
          maxAttempts: 0, // 0 یعنی نامحدود
          questions: [
            // چندگزینه‌ای (MCQ)
            { id:'q1', type:'mcq', text:'CSS Variable چیست؟',
              options:['متغیر سمت سرور','متغیر استایل','نوع فونت','هیچ‌کدام'], correct:1 },
            // درست/نادرست (TF)
            { id:'q2', type:'mcq', text:'rem وابسته به اندازه فونت root است.',
              options:['درست','نادرست'], correct:0 },
            // سوالی (SHORT)
            { id:'q3', type:'short', text:'واحد پایه rem چیست؟ (یک کلمه انگلیسی)',
              acceptableAnswers: [
                { value:'root', flags:'i' },             // غیرحساس به حروف
                { regex:'^root\\s*element$', flags:'i' } // الگوی قابل قبول
              ]
            },
          ]
        },
        lessons: [
          { id:'l1', title:'مقدمه', type:'video', hls:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
          { id:'l2', title:'ساختار پروژه', type:'video', hls:'https://test-streams.mux.dev/pts_shift/master.m3u8' },
          { id:'f1', title:'فایل‌های تمرین', type:'file', url:'https://example.com/theme/files.zip' },
        ]
      },
      {
        id: 'ch2',
        title: 'فصل ۲ — رنگ و تایپوگرافی',
        // قفل فصل بعد: یا آزمون فصل قبل پاس شود، یا 60 ثانیه از درس l2 دیده شود
        requires: {
          enabled: true,
          chapter: 'ch1',
          byQuiz:  { enabled: true, pass: 70 },
          byWatch: { enabled: true, lessonId: 'l2', seconds: 60 },
          operator: 'or'
        },
        quiz: {
          pass: 70,
          maxAttempts: 0,
          questions: [
            { id:'q4', type:'mcq', text:'rem بر چه اساسی است؟',
              options:['root font-size','viewport width','px ثابت','em والد'], correct:0 },
            { id:'q5', type:'short', text:'یک رنگ استاندارد CSS نام ببرید (مثلاً red).',
              acceptableAnswers:[ { regex:'^(red|blue|green|black|white)$', flags:'i' } ] },
          ]
        },
        lessons: [
          { id:'l1', title:'پالت و تمینگ', type:'video', hls:'https://test-streams.mux.dev/bbb_30fps/bbb_30fps.m3u8' },
        ]
      },
      {
        id: 'ch3',
        title: 'فصل ۳ — توکن‌های طراحی',
        // قفل سخت‌گیرانه: هم آزمون و هم تماشای ویدئو لازم است
        requires: {
          enabled: true,
          chapter: 'ch2',
          byQuiz:  { enabled: true, pass: 80 },
          byWatch: { enabled: true, lessonId: 'l1', seconds: 0 },
          operator: 'and'
        },
        lessons: [
          { id:'l1', title:'تعریف و پیاده‌سازی توکن‌ها', type:'video', hls:'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
        ]
      }
    ]
  }
];