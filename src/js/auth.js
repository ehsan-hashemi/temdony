// src/js/auth.js
import { APP } from './config.js';
import { sha256, toB64u } from './utils.js';
import { saveKV, getKV } from './storage.js';

const KEYS = {
  deviceId: 'device-id',
  user: 'user-profile',
};

async function ensureDeviceId() {
  let id = await getKV(KEYS.deviceId);
  if (!id) {
    id = crypto.randomUUID();
    await saveKV(KEYS.deviceId, id);
  }
  return id;
}

async function computeStudentId(profile) {
  const deviceId = await ensureDeviceId();
  const raw = new TextEncoder().encode(`${deviceId}.${profile.phoneHash}.${APP.userSalt}`);
  return toB64u(await sha256(raw));
}

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

export const showStudentId = async () => {
  const box = document.getElementById('studentIdBox');
  const input = document.getElementById('studentId');
  if (!box || !input) return;
  const profile = await getKV('user-profile');
  if (!profile) return;
  const code = await computeStudentId(profile);
  input.value = code;
  box.classList.remove('hidden');
  document.getElementById('copyStudentId')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(code);
  });
};