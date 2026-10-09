export const config = { runtime: 'edge' };

/* Pool besar: randomuser 0-99 (men+women+med), picsum, pravatar, unsplash source */
const POOL_MALE = [];
const POOL_FEMALE = [];

for (let i = 0; i < 100; i++) {
  POOL_MALE.push(`https://randomuser.me/api/portraits/men/${i}.jpg`);
  POOL_MALE.push(`https://randomuser.me/api/portraits/med/men/${i}.jpg`);
  POOL_MALE.push(`https://randomuser.me/api/portraits/thumb/men/${i}.jpg`);
  POOL_FEMALE.push(`https://randomuser.me/api/portraits/women/${i}.jpg`);
  POOL_FEMALE.push(`https://randomuser.me/api/portraits/med/women/${i}.jpg`);
  POOL_FEMALE.push(`https://randomuser.me/api/portraits/thumb/women/${i}.jpg`);
}

/* pravatar 1-70 pria/wanita */
const PRAV_MALE = [];
const PRAV_FEMALE = [];
for (let i = 1; i <= 70; i++) {
  PRAV_MALE.push(`https://i.pravatar.cc/400?img=${i}`);
}
/* pravatar img 1-70 campur — kita pisah berdasarkan index ganjil/genap sbg proxy */
for (let i = 1; i <= 70; i++) {
  PRAV_FEMALE.push(`https://i.pravatar.cc/400?img=${i}`);
}

function pickFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildSources(gender) {
  const nocache = () => `?v=${Date.now()}-${Math.random()}`;

  if (gender === 'male') {
    return [
      {
        name: 'randomuser-male',
        url: () => pickFrom(POOL_MALE) + nocache(),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      },
      {
        name: 'pravatar-male',
        url: () => pickFrom(PRAV_MALE) + '&v=' + Date.now() + Math.random(),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      },
      {
        name: 'thispersondoesnotexist-male',
        url: () => 'https://thispersondoesnotexist.com/image?v=' + Date.now() + '-' + Math.random(),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://thispersondoesnotexist.com/',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      },
      {
        name: 'picsum-portrait',
        url: () => `https://picsum.photos/seed/${Date.now()}-${Math.random()}-${Math.random()}/400/533`,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      }
    ];
  }

  if (gender === 'female') {
    return [
      {
        name: 'randomuser-female',
        url: () => pickFrom(POOL_FEMALE) + nocache(),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      },
      {
        name: 'pravatar-female',
        url: () => pickFrom(PRAV_FEMALE) + '&v=' + Date.now() + Math.random(),
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      },
      {
        name: 'thispersondoesnotexist-female',
        url: () => 'https://thispersondoesnotexist.com/image?v=' + Date.now() + '-' + Math.random(),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://thispersondoesnotexist.com/',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      },
      {
        name: 'picsum-portrait',
        url: () => `https://picsum.photos/seed/${Date.now()}-${Math.random()}-${Math.random()}/400/533`,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      }
    ];
  }

  return [
    {
      name: 'randomuser-any',
      url: () => pickFrom([...POOL_MALE, ...POOL_FEMALE]) + nocache(),
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
    },
    {
      name: 'thispersondoesnotexist',
      url: () => 'https://thispersondoesnotexist.com/image?v=' + Date.now() + '-' + Math.random(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://thispersondoesnotexist.com/',
        'Cache-Control': 'no-cache, no-store'
      }
    },
    {
      name: 'picsum-portrait',
      url: () => `https://picsum.photos/seed/${Date.now()}-${Math.random()}-${Math.random()}/400/533`,
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
    }
  ];
}

async function trySource(source) {
  try {
    const url = source.url();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: source.headers,
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'follow'
    });
    clearTimeout(timeout);
    if (!res.ok) return { ok: false, reason: `${source.name}: HTTP ${res.status}` };
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return { ok: false, reason: `${source.name}: not image (${ct})` };
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 1000) return { ok: false, reason: `${source.name}: too small` };
    return { ok: true, buffer, contentType: ct.split(';')[0], sourceName: source.name };
  } catch (e) {
    return { ok: false, reason: `${source.name}: ${e.message}` };
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }

  const url = new URL(req.url);
  const gender = (url.searchParams.get('gender') || '').toLowerCase();
  const sources = buildSources(gender);
  const errors = [];

  for (const source of sources) {
    const result = await trySource(source);
    if (result.ok) {
      return new Response(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': result.contentType,
          'Content-Length': result.buffer.byteLength.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'X-Source': result.sourceName,
          'X-Gender': gender || 'any'
        }
      });
    }
    errors.push(result.reason);
  }

  return new Response(JSON.stringify({ error: 'all sources failed', details: errors }), {
    status: 502,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
