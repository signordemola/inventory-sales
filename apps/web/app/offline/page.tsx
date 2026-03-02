import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white gap-6 p-4">
      <div className="p-6 bg-slate-800 rounded-full">
        <WifiOff className="size-16 text-slate-400" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">You&apos;re Offline</h1>
        <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
          NaijaStock is still working. Your POS is fully functional. Any new
          sales made will be securely saved and synced automatically when
          you&apos;re back online.
        </p>
      </div>
      <Button
        size="lg"
        className="mt-4 font-bold rounded-xl h-12 px-8"
        onClick={() => (window.location.href = "/pos")}
      >
        Continue to POS &rarr;
      </Button>
    </div>
  );
}
