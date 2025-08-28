// src/js/storage.js
const LS = window.localStorage;
const DB_NAME = 'tamdooni-db';
const STORE = 'kv';
let db;

export const ensurePersistence = async () => {
  if (navigator.storage?.persist) { try { await navigator.storage.persist(); } catch {} }
  await openDB();
};

const openDB = () => new Promise((res, rej) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  req.onsuccess = () => { db = req.result; res(); };
  req.onerror = () => rej(req.error);
});

const idb = {
  get: (k) => new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readonly'); const os = tx.objectStore(STORE);
    const rq = os.get(k); rq.onsuccess = () => res(rq.result); rq.onerror = () => rej(rq.error);
  }),
  set: (k, v) => new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite'); const os = tx.objectStore(STORE);
    const rq = os.put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
  })
};

export const saveKV = async (k, v) => {
  try { LS.setItem(k, JSON.stringify(v)); } catch {}
  try { await idb.set(k, v); } catch {}
};

export const getKV = async (k) => {
  const ls = LS.getItem(k); if (ls) return JSON.parse(ls);
  try { return await idb.get(k); } catch { return null; }
};