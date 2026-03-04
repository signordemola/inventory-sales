import { Skeleton } from "@/components/ui/skeleton";

const Loading = () => {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={`skel-${i}`} className="h-32 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </div>
  );
};

export default Loading;
