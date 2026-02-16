export function getLayer1BaseUrl() {
  // Example: http://127.0.0.1:8000
  const v = process.env.LAYER1_API_BASE_URL;
  return (v || 'http://127.0.0.1:8000').replace(/\/$/, '');
}
