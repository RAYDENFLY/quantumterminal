import TopBarShell from '@/components/TopBarShell';
import SiteFooter from '@/components/SiteFooter';
import HeatmapTerminal from '@/components/heatmap/HeatmapTerminal';

export default function HeatmapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBarShell />
      <main className="flex-1 p-4 space-y-4">
        <HeatmapTerminal />
      </main>
      <SiteFooter />
    </div>
  );
}
