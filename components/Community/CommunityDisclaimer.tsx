export default function CommunityDisclaimer() {
  return (
    <div className="rounded-xl border border-terminal-border bg-terminal-panel p-4 text-sm text-gray-300">
      <div className="font-semibold text-terminal-accent">Community disclaimer</div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-400">
        <li>This is <span className="text-gray-200">not</span> a trading signal platform.</li>
        <li>Posts are user-generated and may be wrong, outdated, or biased.</li>
        <li>Nothing here is financial advice. Do your own research.</li>
      </ul>
    </div>
  );
}
