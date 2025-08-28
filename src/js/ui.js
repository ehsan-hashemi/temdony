// src/js/ui.js
import { listCourses, getCourse, getProgress, getTodayWatchLog } from './courses.js';
import { hasCourseAccess } from './license.js';
import { COURSES } from './config.js';

export const renderDashboardStats = async () => {
  // ویدئوهای امروز
  const today = await getTodayWatchLog();
  document.getElementById('statVideosToday').textContent = today.length;
  const listEl = document.getElementById('statVideosTodayList');
  listEl.innerHTML = today.slice(-3).map(x => `• ${x.title || 'ویدئو'}`).join('<br/>');

  // دوره‌های خریداری شده
  let owned = 0;
  for (const c of COURSES) if (await hasCourseAccess(c.id)) owned++;
  document.getElementById('statPurchased').textContent = owned;

  // پیشرفت کلی میانگین فصل‌های پاس‌شده
  let sumPct = 0;
  for (const c of COURSES) {
    const prog = await getProgress(c.id);
    const passedChapters = Object.values(prog).filter(x => (x?.quizScore ?? 0) >= (c.minScoreToUnlockNext ?? 70)).length;
    const pct = Math.round(100 * (passedChapters / (c.chapters.length || 1)));
    sumPct += pct;
  }
  const overall = Math.round(sumPct / (COURSES.length || 1));
  document.getElementById('overallProgress').textContent = `${overall}%`;
};

export const renderMyCourses = async () => {
  const wrap = document.getElementById('myCourses');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const c of listCourses()) {
    const allowed = await hasCourseAccess(c.id);
    if (!allowed) continue;
    const prog = await getProgress(c.id);
    const passedChapters = Object.values(prog).filter(x => (x?.quizScore ?? 0) >= (c.minScoreToUnlockNext ?? 70)).length;
    const pct = Math.round(100 * (passedChapters / (c.chapters.length || 1)));

    const a = document.createElement('a');
    a.href = `./course.html?courseId=${c.id}`;
    a.className = 'course-card enabled';
    a.innerHTML = `
      <div class="thumb"><img src="${c.cover}" alt=""></div>
      <div class="body">
        <div class="title">${c.title}</div>
        <div class="meta">دسترسی فعال</div>
        <div class="bar"><span style="width:${pct}%"></span></div>
      </div>
    `;
    wrap.appendChild(a);
  }
};

export const renderCatalog = async () => {
  const wrap = document.getElementById('catalogCourses');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (const c of listCourses()) {
    const owned = await hasCourseAccess(c.id);
    const card = document.createElement('div');
    card.className = 'course-card ' + (owned ? 'enabled' : '');
    card.innerHTML = `
      <div class="thumb"><img src="${c.cover}" alt=""></div>
      <div class="body">
        <div class="title">${c.title}</div>
        <div class="meta">${owned ? 'خریداری شده' : 'قابل خرید'}</div>
        <div class="flex items-center justify-between mt-3">
          <a class="btn-ghost" href="./course.html?courseId=${c.id}" ${owned ? '' : 'style="pointer-events:none;opacity:.5"'}>مشاهده</a>
          <a class="btn-primary" href="${c.purchaseUrl}" target="_blank" rel="noopener">خرید</a>
        </div>
      </div>
    `;
    wrap.appendChild(card);
  }
};
