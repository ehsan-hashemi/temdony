// src/js/main.js
import { qs } from './utils.js';
import { getCourse, getProgress, canOpenChapter } from './courses.js';
import { hasCourseAccess } from './license.js';
import { renderQuiz } from './quiz.js';
import { playHLS } from './player.js';

export const initCoursePage = async () => {
  const courseId = qs('courseId');
  const course = getCourse(courseId);
  const titleEl = document.getElementById('courseTitle');
  const chaptersEl = document.getElementById('chapters');
  const tabVideos = document.getElementById('tab-videos');
  const tabQuiz = document.getElementById('tab-quiz');
  const tabFiles = document.getElementById('tab-files');
  const videoEl = document.getElementById('player');

  if (!course) {
    document.body.innerHTML = `<main class="max-w-3xl mx-auto p-6"><div class="alert">این دوره یافت نشد.</div><a class="link" href="./index.html">بازگشت</a></main>`;
    return;
  }
  if (!(await hasCourseAccess(course.id))) {
    document.body.innerHTML = `<main class="max-w-3xl mx-auto p-6"><div class="alert">شما به این دوره دسترسی ندارید.</div><a class="link" href="./index.html">بازگشت</a></main>`;
    return;
  }

  titleEl.textContent = course.title;
  let activeChapterId = course.chapters[0]?.id || null;

  // Toast
  window.toast = (msg) => {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=> t.classList.remove('show'), 2200);
  };

  const renderChapters = async () => {
    const prog = await getProgress(course.id);
    chaptersEl.innerHTML = '';
    for (const ch of course.chapters) {
      const unlocked = await canOpenChapter(course, ch);
      const passed = (prog[ch.id]?.quizScore ?? 0) >= (ch.quiz?.pass ?? course.minScoreToUnlockNext ?? 70);
      const btn = document.createElement('button');
      btn.className = `chapter ${activeChapterId === ch.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
      btn.setAttribute('data-ch-id', ch.id);
      btn.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="fi ${unlocked ? 'fi-unlock' : 'fi-lock'}"></span>
          <span>${ch.title}</span>
        </div>
        <div class="text-xs opacity-70">${passed ? 'پاس شده' : unlocked ? 'باز' : 'قفل'}</div>
      `;
      btn.disabled = !unlocked;
      btn.addEventListener('click', () => {
        if (!unlocked) return;
        activeChapterId = ch.id;
        renderChapters();
        renderTabs();
      });
      chaptersEl.appendChild(btn);
    }
  };
  window.renderChapters = renderChapters;

  window.tryUnlockNextChapter = async (currentChapterId) => {
    const idx = course.chapters.findIndex(c => c.id === currentChapterId);
    if (idx < 0 || idx >= course.chapters.length - 1) return;
    const next = course.chapters[idx + 1];
    if (await canOpenChapter(course, next)) {
      await renderChapters();
      const el = chaptersEl.querySelector(`[data-ch-id="${next.id}"]`);
      if (el) {
        el.classList.add('unlocked-flash');
        setTimeout(()=> el.classList.remove('unlocked-flash'), 1500);
      }
      window.toast && window.toast('فصل بعدی فعال شد! 🎉');
    }
  };

  const renderTabs = async () => {
    const chapter = course.chapters.find(c => c.id === activeChapterId);
    if (!chapter) return;

    // ویدئوها
    tabVideos.innerHTML = '';
    const videos = chapter.lessons.filter(l => l.type === 'video');
    if (videos.length === 0) {
      tabVideos.innerHTML = `<div class="hint">ویدئویی برای این فصل ثبت نشده.</div>`;
    } else {
      const list = document.createElement('div');
      list.className = 'lesson-list';
      videos.forEach(v => {
        const item = document.createElement('button');
        item.className = 'lesson-item';
        item.innerHTML = `<span class="fi fi-play"></span><span>${v.title}</span>`;
        item.addEventListener('click', async () => {
          await playHLS(videoEl, v.hls, {
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: v.id,
            title: v.title,
            onWatched: () => window.tryUnlockNextChapter(chapter.id)
          });
        });
        list.appendChild(item);
      });
      tabVideos.appendChild(list);
    }

    // آزمون
    await renderQuiz(tabQuiz, course, chapter);

    // فایل‌ها
    tabFiles.innerHTML = '';
    const files = chapter.lessons.filter(l => l.type === 'file');
    if (files.length === 0) {
      tabFiles.innerHTML = `<div class="hint">فایلی برای این فصل ثبت نشده است.</div>`;
    } else {
      const fl = document.createElement('div');
      fl.className = 'file-list';
      files.forEach(f => {
        const a = document.createElement('a');
        a.href = f.url; a.target = '_blank'; a.rel = 'noopener';
        a.className = 'file-item';
        a.innerHTML = `<span class="fi fi-download"></span><span>${f.title}</span>`;
        fl.appendChild(a);
      });
      tabFiles.appendChild(fl);
    }
  };

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById(`tab-${tab}`).classList.remove('hidden');
    });
  });

  await renderChapters();
  await renderTabs();
};