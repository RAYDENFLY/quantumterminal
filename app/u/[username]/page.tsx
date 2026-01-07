import type { Metadata } from 'next';
import ProfilePage from '@/components/Profile/ProfilePage';

export async function generateMetadata(
  ctx: { params: Promise<{ username: string }> }
): Promise<Metadata> {
  const { username } = await ctx.params;
  const u = String(username || '').toLowerCase();

  return {
    title: `${u} • Profile • Quantum Terminal`,
    description: `Community profile for ${u} on Quantum Terminal.`,
    alternates: {
      canonical: `/u/${u}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function UserProfilePage(
  ctx: { params: Promise<{ username: string }> }
) {
  const { username } = await ctx.params;
  return <ProfilePage username={String(username)} />;
}
