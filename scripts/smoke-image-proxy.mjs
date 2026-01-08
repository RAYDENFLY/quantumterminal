// Smoke-test the /api/image-proxy endpoint.
// Usage: node scripts/smoke-image-proxy.mjs "https://i.ibb.co/.../image.png"
// Requires the dev server running at http://localhost:3000

const rawUrl = process.argv[2];
if (!rawUrl) {
  console.error('Missing URL argument');
  process.exit(2);
}

const endpoint = `http://localhost:3000/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;

const res = await fetch(endpoint);
console.log('status', res.status);
console.log('content-type', res.headers.get('content-type'));
console.log('cache-control', res.headers.get('cache-control'));

if (!res.ok) process.exit(1);

const ct = (res.headers.get('content-type') || '').toLowerCase();
if (!ct.startsWith('image/')) {
  console.error('Expected image/* content-type');
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
console.log('bytes', buf.length);
