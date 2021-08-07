import { getVQD as ddgGetVQD } from 'duck-duck-scrape';

const vqdCache = new Map<string, { c: number; v: string }>();

const TTL = parseInt(process.env.API_CACHE_TTL!);

export function flushCache() {
  const now = Date.now();
  for (const id in vqdCache) {
    const vqd = vqdCache.get(id)!;
    if (vqd.c < now + TTL) vqdCache.delete(id);
  }
}

export async function getVQD(query: string) {
  if (vqdCache.has(query)) return vqdCache.get(query).v;
  const vqd = await ddgGetVQD(query);
  vqdCache.set(query, {
    c: Date.now(),
    v: vqd
  });
  return vqd;
}
