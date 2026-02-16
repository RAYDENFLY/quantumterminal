export function getQuantumTradeBaseUrl() {
  // Prefer server-side env when deployed; allow NEXT_PUBLIC for client components.
  // Example: http://127.0.0.1:8000
  const v = process.env.NEXT_PUBLIC_QUANTUM_TRADE_API_BASE_URL || process.env.QUANTUM_TRADE_API_BASE_URL;
  return (v || 'http://127.0.0.1:8000').replace(/\/$/, '');
}
