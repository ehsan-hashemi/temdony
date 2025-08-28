// src/js/courses.js
import { COURSES } from './config.js';
import { getKV, saveKV } from './storage.js';

const KEY_PROGRESS = 'progress';
const KEY_WATCHLOG = 'watch-log'; // [{courseId,chapterId,lessonId,title,ts}]

export const listCourses = () => COURSES;
export const getCourse = (id) => COURSES.find(c => c.id === id);

export const getProgress = async (courseId) => {
  const p = await getKV(KEY_PROGRESS) || {};
  return p[courseId] || {};
};

const saveProgress = async (courseId, prog) => {
  const all = await getKV(KEY_PROGRESS) || {};
  all[courseId] = prog;
  await saveKV(KEY_PROGRESS, all);
};

export const appendWatchLog = async (entry) => {
  const log = await getKV(KEY_WATCHLOG) || [];
  log.push({ ...entry, ts: Date.now() });
  await saveKV(KEY_WATCHLOG, log);
};

export const getTodayWatchLog = async () => {
  const log = await getKV(KEY_WATCHLOG) || [];
  const start = new Date(); start.setHours(0,0,0,0);
  return log.filter(x => x.ts >= start.getTime());
};

export const setLessonProgress = async (courseId, chapterId, lessonId, seconds, duration) => {
  const prog = await getProgress(courseId);
  prog[chapterId] = prog[chapterId] || {};
  prog[chapterId].lessons = prog[chapterId].lessons || {};
  const entry = prog[chapterId].lessons[lessonId] || {};
  entry.seconds = Math.max(entry.seconds || 0, Math.floor(seconds || 0));
  if (duration) entry.duration = Math.floor(duration);
  if (entry.seconds > 0) entry.watched = true;
  entry.updatedAt = Date.now();
  prog[chapterId].lessons[lessonId] = entry;
  await saveProgress(courseId, prog);
};

export const setLessonWatched = async (courseId, chapterId, lessonId) => {
  const prog = await getProgress(courseId);
  prog[chapterId] = prog[chapterId] || {};
  prog[chapterId].lessons = prog[chapterId].lessons || {};
  prog[chapterId].lessons[lessonId] = { ...(prog[chapterId].lessons[lessonId] || {}), watched: true, updatedAt: Date.now() };
  await saveProgress(courseId, prog);
};

export const setQuizScore = async (courseId, chapterId, score) => {
  const prog = await getProgress(courseId);
  prog[chapterId] = prog[chapterId] || {};
  // تلاش‌ها
  const attempts = (prog[chapterId].attempts || 0) + 1;
  prog[chapterId].attempts = attempts;
  prog[chapterId].quizScore = Math.max(prog[chapterId].quizScore || 0, score); // بهترین نمره
  await saveProgress(courseId, prog);
};

// ارزیابی شرط بازشدن فصل نسبت به «فصل مرجع»
export const canOpenChapter = async (course, chapter) => {
  const idx = course.chapters.findIndex(c => c.id === chapter.id);
  const req = chapter.requires;
  if (idx === 0 || !req || req.enabled === false) return true;

  const targetPrevId = req.chapter || course.chapters[idx - 1]?.id;
  if (!targetPrevId) return true;

  const prog = await getProgress(course.id);
  const prevState = prog[targetPrevId] || {};
  const passNeed = req.byQuiz?.pass ?? course.minScoreToUnlockNext ?? 70;

  let okQuiz = true, okWatch = true;

  if (req.byQuiz?.enabled) {
    okQuiz = (prevState.quizScore ?? 0) >= passNeed;
  }
  if (req.byWatch?.enabled) {
    const lid = req.byWatch.lessonId;
    const needSec = req.byWatch.seconds ?? 0;
    const ls = prevState.lessons?.[lid];
    okWatch = (ls?.seconds ?? 0) >= needSec;
  }

  if (req.byQuiz?.enabled && req.byWatch?.enabled) {
    return req.operator === 'and' ? (okQuiz && okWatch) : (okQuiz || okWatch);
  }
  return req.byQuiz?.enabled ? okQuiz : (req.byWatch?.enabled ? okWatch : true);
};
