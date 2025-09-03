// src/js/auth.js
import { APP } from './config.js';
import { sha256, toB64u } from './utils.js';
import { saveKV, getKV } from './storage.js';

const KEYS = {
  deviceId: 'device-id',
  user: 'user-profile',
};

// ساخت یا گرفتن deviceId
async function ensureDeviceId() {
  let id = await getKV(KEYS.deviceId);
  if (!id) {
    id = crypto.randomUUID();
    await saveKV(KEYS.deviceId, id);
  }
  return id;
}

// محاسبه studentId (هش)
async function computeStudentId(profile) {
  const deviceId = await ensureDeviceId();
  const raw = new TextEncoder().encode(`${deviceId}.${profile.phoneHash}.${APP.userSalt}`);
  return toB64u(await sha256(raw));
}

// گرفتن IP عمومی
async function getIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return 'نامشخص';
  }
}

// ثبت پروفایل
export const initProfile = () => {
  const form = document.getElementById('profileForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value.trim();
    const lastName  = document.getElementById('lastName').value.trim();
    const phone     = document.getElementById('phone').value.trim();
    if (!phone) return;
    const phoneHash = toB64u(await sha256(phone));
    const profile = { firstName, lastName, phone, phoneHash, createdAt: Date.now() };
    await saveKV(KEYS.user, profile);
    await showStudentId(true);
  });
};

// نمایش کد هنرجو (شامل همه اطلاعات)
export const showStudentId = async () => {
  const box = document.getElementById('studentIdBox');
  const input = document.getElementById('studentId');
  if (!box || !input) return;
  const profile = await getKV('user-profile');
  if (!profile) return;

  const studentId = await computeStudentId(profile);
  const ip = await getIP();

  // ساخت payload کامل
  const payload = {
    studentId,
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
    ip,
    ts: Date.now()
  };

  // تبدیل به Base64URL
  const enc = new TextEncoder();
  const code = toB64u(enc.encode(JSON.stringify(payload)));

  input.value = code;
  box.classList.remove('hidden');
  document.getElementById('copyStudentId')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(code);
  });
};
