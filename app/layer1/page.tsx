import TopBarShell from '@/components/TopBarShell';
import SiteFooter from '@/components/SiteFooter';
import Layer1Terminal from '@/components/layer1/Layer1Terminal';

export default function Layer1Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBarShell />

      <main className="flex-1 p-4 space-y-4">
        <Layer1Terminal />
      </main>

      <SiteFooter />
    </div>
  );
}
