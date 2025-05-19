
import { Skeleton } from "@/components/ui/skeleton";

const LoadingSkeletons = () => {
  return (
    <>
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
      
      <Skeleton className="h-8 w-64 mb-4" />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="flex-shrink-0 w-72 h-[500px]" />
        ))}
      </div>
    </>
  );
};

export default LoadingSkeletons;
