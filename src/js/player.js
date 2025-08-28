// src/js/player.js
import Hls from 'https://cdn.jsdelivr.net/npm/hls.js@latest/+esm';
import { setLessonProgress, setLessonWatched, appendWatchLog } from './courses.js';

export const playHLS = async (videoEl, url, meta) => {
  videoEl.setAttribute('controlsList', 'nodownload');
  videoEl.addEventListener('contextmenu', e => e.preventDefault());

  if (videoEl.__hls) {
    videoEl.__hls.destroy();
    videoEl.removeAttribute('src');
    videoEl.load();
  }
  videoEl.currentTime = 0;

  if (Hls.isSupported()) {
    const hls = new Hls({ maxBufferLength: 30, enableWorker: true, lowLatencyMode: true });
    hls.loadSource(url);
    hls.attachMedia(videoEl);
    videoEl.__hls = hls;
  } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.src = url;
  } else {
    videoEl.outerHTML = `<div class="alert">مرورگر شما از HLS پشتیبانی نمی‌کند.</div>`;
    return;
  }

  let lastSaved = 0;
  const saveTick = async () => {
    const now = Date.now();
    if (now - lastSaved < 1200) return;
    lastSaved = now;
    await setLessonProgress(meta.courseId, meta.chapterId, meta.lessonId, videoEl.currentTime || 0, videoEl.duration || 0);
    if (typeof window.tryUnlockNextChapter === 'function') {
      window.tryUnlockNextChapter(meta.chapterId);
    }
  };

  videoEl.addEventListener('timeupdate', saveTick);
  videoEl.addEventListener('loadedmetadata', saveTick);

  videoEl.addEventListener('ended', async () => {
    await setLessonWatched(meta.courseId, meta.chapterId, meta.lessonId);
    await appendWatchLog({ courseId: meta.courseId, chapterId: meta.chapterId, lessonId: meta.lessonId, title: meta.title || '' });
    if (typeof window.tryUnlockNextChapter === 'function') window.tryUnlockNextChapter(meta.chapterId);
    if (typeof meta.onWatched === 'function') meta.onWatched();
  });
};
