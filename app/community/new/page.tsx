import type { Metadata } from 'next';
import NewPostForm from '@/components/Community/NewPostForm';

export const metadata: Metadata = {
  title: 'Create post • Community • Quantum Terminal',
  description: 'Create a community post: discussion, coin analysis, jobs, or resources.',
};

export default function CommunityNew() {
  return <NewPostForm />;
}
