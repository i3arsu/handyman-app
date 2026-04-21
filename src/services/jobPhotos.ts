import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/services/supabase';

const BUCKET = 'job-photos';

const extFromUri = (uri: string): string => {
  const match = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(uri);
  return (match?.[1] ?? 'jpg').toLowerCase();
};

const mimeForExt = (ext: string): string => {
  switch (ext) {
    case 'png':  return 'image/png';
    case 'webp': return 'image/webp';
    case 'heic': return 'image/heic';
    case 'jpg':
    case 'jpeg':
    default:     return 'image/jpeg';
  }
};

// Uploads a single local image URI from expo-image-picker to the job-photos
// bucket and returns the public URL. Path convention is
// `<user_id>/<job_draft_id>/<index>.<ext>` so Storage RLS can match the
// uploader's folder.
export const uploadJobPhoto = async (
  uri: string,
  userId: string,
  jobDraftId: string,
  index: number,
): Promise<string> => {
  const ext = extFromUri(uri);
  const path = `${userId}/${jobDraftId}/${index}.${ext}`;
  const contentType = mimeForExt(ext);

  // RN fetch on a `file://` URI gives a Blob that Supabase-js accepts on web
  // but is unreliable on native. Reading to base64 and decoding into an
  // ArrayBuffer is the portable path.
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const bytes = decodeBase64(base64);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

export const uploadJobPhotos = async (
  uris: string[],
  userId: string,
  jobDraftId: string,
): Promise<string[]> => {
  const urls: string[] = [];
  for (let i = 0; i < uris.length; i++) {
    urls.push(await uploadJobPhoto(uris[i], userId, jobDraftId, i));
  }
  return urls;
};

// Lightweight base64 → Uint8Array decoder so we don't pull in a polyfill.
const decodeBase64 = (b64: string): Uint8Array => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const padded = (clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0);
  const byteLen = (len * 3) / 4 - padded;
  const out = new Uint8Array(byteLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = lookup[clean.charCodeAt(i)];
    const e2 = lookup[clean.charCodeAt(i + 1)];
    const e3 = lookup[clean.charCodeAt(i + 2)];
    const e4 = lookup[clean.charCodeAt(i + 3)];
    if (p < byteLen) out[p++] = (e1 << 2) | (e2 >> 4);
    if (p < byteLen) out[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < byteLen) out[p++] = ((e3 & 3) << 6) | e4;
  }
  return out;
};
