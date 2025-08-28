// src/js/license.js
import { getKV, saveKV } from './storage.js';
import { fromB64u } from './utils.js';

const KEY_LICENSES = 'licenses'; // Map: courseId -> { code, addedAt }

async function computeCurrentStudentId() {
  const deviceId = (await getKV('device-id')) || null;
  const profile = await getKV('user-profile');
  if (!deviceId || !profile?.phoneHash) return null;
  const raw = new TextEncoder().encode(`${deviceId}.${profile.phoneHash}.tamdooni-v1-usersalt`);
  const buf = await crypto.subtle.digest('SHA-256', raw);
  return btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

export const verifyAndStoreActivation = async (code) => {
  try {
    const payloadBytes = fromB64u(code);
    const payload = JSON.parse(new TextDecoder().decode(new Uint8Array(payloadBytes)));
    if (!payload?.studentId || !payload?.courseId) return false;

    const current = await computeCurrentStudentId();
    if (!current || payload.studentId !== current) return false;

    let licenses = await getKV(KEY_LICENSES) || {};
    licenses[payload.courseId] = { code, addedAt: Date.now() };
    await saveKV(KEY_LICENSES, licenses);
    return true;
  } catch { return false; }
};

export const hasCourseAccess = async (courseId) => {
  const licenses = await getKV(KEY_LICENSES) || {};
  return Boolean(licenses[courseId]);
};

export const getPurchasedTodayCount = async () => {
  const licenses = await getKV(KEY_LICENSES) || {};
  const start = new Date(); start.setHours(0,0,0,0);
  return Object.values(licenses).filter(x => (x.addedAt || 0) >= start.getTime()).length;
};
