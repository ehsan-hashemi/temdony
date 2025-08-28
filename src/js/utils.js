// src/js/utils.js
export const enc = new TextEncoder();
export const dec = new TextDecoder();

export const sha256 = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', typeof text==='string' ? enc.encode(text) : text);
  return buf;
};

export const toB64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

export const fromB64u = (b64u) => {
  const b64 = b64u.replace(/-/g,'+').replace(/_/g,'/');
  const bin = atob(b64);
  return new Uint8Array([...bin].map(c=>c.charCodeAt(0))).buffer;
};

export const uuid = () =>
  ([1e7]+-1e3+-4e3+-8e3+-1e11)
    .replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

export const qs = (k) => new URLSearchParams(location.search).get(k);