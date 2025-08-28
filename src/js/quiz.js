// src/js/quiz.js
import { setQuizScore, getProgress } from './courses.js';

function normalize(s) { return (s || '').toString().trim(); }
function matchShort(answer, rules=[]) {
  const a = normalize(answer);
  for (const r of rules) {
    if (r.value !== undefined) {
      const re = new RegExp('^' + r.value + '$', r.flags || '');
      if (re.test(a)) return true;
    } else if (r.regex) {
      const re = new RegExp(r.regex, r.flags || '');
      if (re.test(a)) return true;
    }
  }
  return false;
}

export const renderQuiz = async (el, course, chapter) => {
  el.innerHTML = '';
  const qz = chapter.quiz;
  if (!qz) { el.innerHTML = '<div class="hint">برای این فصل آزمونی تعریف نشده.</div>'; return; }

  // محدودیت تلاش
  const prog = await getProgress(course.id);
  const prevAttempts = prog?.[chapter.id]?.attempts || 0;
  const maxA = qz.maxAttempts ?? 0;
  const reachedLimit = maxA > 0 && prevAttempts >= maxA;

  const form = document.createElement('form');
  form.className = 'quiz-form';

  qz.questions.forEach((q,i) => {
    const box = document.createElement('div');
    box.className = 'quiz-q';
    box.innerHTML = `<div class="quiz-q-title">${i+1}. ${q.text}</div>`;

    if (q.type === 'mcq') {
      const options = q.options || [];
      options.forEach((opt, idx) => {
        const row = document.createElement('label');
        row.className = 'quiz-opt';
        row.innerHTML = `
          <input type="radio" name="${q.id}" value="${idx}" ${reachedLimit?'disabled':''}>
          <span>${opt}</span>`;
        box.appendChild(row);
      });
    } else if (q.type === 'short') {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = q.id;
      input.placeholder = 'پاسخ کوتاه...';
      input.className = 'input';
      if (reachedLimit) input.disabled = true;
      box.appendChild(input);
    } else {
      box.innerHTML += `<div class="hint">نوع سؤال پشتیبانی نمی‌شود.</div>`;
    }

    form.appendChild(box);
  });

  const actions = document.createElement('div');
  actions.className = 'quiz-actions';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn-primary';
  btn.textContent = 'ثبت پاسخ‌ها';
  if (reachedLimit) {
    btn.disabled = true;
    btn.classList.add('disabled');
  }

  const result = document.createElement('div');
  result.className = 'quiz-result';

  const meta = document.createElement('div');
  meta.className = 'quiz-meta';
  if (maxA > 0) meta.textContent = `تلاش‌ها: ${prevAttempts}/${maxA}`;

  actions.appendChild(btn);
  form.appendChild(actions);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // نمره‌دهی
    let correct = 0;
    qz.questions.forEach(q => {
      if (q.type === 'mcq') {
        const sel = form.querySelector(`input[name="${q.id}"]:checked`);
        const ans = sel ? Number(sel.value) : -1;
        if (ans === q.correct) correct++;
      } else if (q.type === 'short') {
        const val = form.querySelector(`input[name="${q.id}"]`)?.value || '';
        if (matchShort(val, q.acceptableAnswers || [])) correct++;
      }
    });
    const score = Math.round((correct / qz.questions.length) * 100);
    await setQuizScore(course.id, chapter.id, score);

    const passNeed = qz.pass ?? course.minScoreToUnlockNext ?? 70;
    const isPass = score >= passNeed;

    // پیام دقیق
    result.innerHTML = isPass
      ? `<div class="alert-success">آفرین! آزمون با موفقیت پاس شد (${score}٪)</div>`
      : `<div class="alert-warn">نمره شما: ${score}٪ — حد نصاب: ${passNeed}٪</div>`;

    // Toast + تلاش برای آنلاک فصل بعد
    if (isPass && typeof window.toast === 'function') window.toast('آزمون با موفقیت پاس شد! 🎉');
    if (typeof window.tryUnlockNextChapter === 'function') window.tryUnlockNextChapter(chapter.id);
    if (typeof window.renderChapters === 'function') window.renderChapters();

    // اگر محدودیت تلاش دارید، وضعیت دکمه و متا را به‌روز کنید
    if (maxA > 0) {
      const nowProg = await getProgress(course.id);
      const attempts = nowProg?.[chapter.id]?.attempts || 0;
      meta.textContent = `تلاش‌ها: ${attempts}/${maxA}`;
      if (attempts >= maxA) {
        btn.disabled = true; btn.classList.add('disabled');
        const blocker = document.createElement('div');
        blocker.className = 'alert-warn';
        blocker.textContent = 'حداکثر تلاش‌ها به پایان رسید.';
        result.appendChild(blocker);
      }
    }
  });

  el.appendChild(form);
  el.appendChild(meta);
  el.appendChild(result);
};