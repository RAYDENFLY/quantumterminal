export const COMMUNITY_CATEGORIES = [
  { id: 'discussion', label: 'Discussion', description: 'General market talk, questions, and ideas.' },
  { id: 'coin-analysis', label: 'Coin Analysis', description: 'Long-form analysis and thesis. Not financial advice.' },
  { id: 'jobs', label: 'Jobs', description: 'Crypto jobs: dev, analyst, marketing, ops.' },
  { id: 'resources', label: 'Resources / Tools', description: 'Useful tools, dashboards, datasets, learning resources.' },
] as const;

export type CommunityCategoryId = (typeof COMMUNITY_CATEGORIES)[number]['id'];
