import type { Metadata } from 'next';
import CommunityPage from '@/components/Community/CommunityPage';

export const metadata: Metadata = {
  title: 'Community • Quantum Terminal',
  description: 'Discussions, coin analysis, jobs, and tools from the Quantum Terminal community.',
};

export default function Community() {
  return <CommunityPage />;
}
