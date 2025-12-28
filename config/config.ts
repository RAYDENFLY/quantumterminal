// Configuration for external/internal APIs used by the app
// RESEARCH_API_URL can be overridden at build/runtime via NEXT_PUBLIC_RESEARCH_API
export const RESEARCH_API_URL = process.env.NEXT_PUBLIC_RESEARCH_API || '/api/research';

export default {
  RESEARCH_API_URL,
};
