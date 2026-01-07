import type { Metadata } from 'next';
import EditPostPage from '@/components/Community/EditPostPage';

export const metadata: Metadata = {
  title: 'Edit Post • Community',
};

export default async function Page(ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  return <EditPostPage slug={slug} />;
}
