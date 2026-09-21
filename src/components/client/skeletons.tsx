import { Skeleton } from "@/components/ui";
import { range } from "@/lib/utils";

export interface ScreenSkeletonProps {
  /** Number of card-sized blocks under the header. */
  rows?: number;
  hero?: boolean;
}

export function ScreenSkeleton({ rows = 3, hero = true }: ScreenSkeletonProps) {
  return (
    <div className="space-y-4 px-4 py-6">
      <Skeleton className="h-8 w-44 rounded-md" />
      <Skeleton className="h-11 w-full rounded-md" />
      {hero ? <Skeleton className="h-44 w-full rounded-2xl" /> : null}
      <div className="flex gap-2">
        {range(4).map((index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      {range(rows).map((index) => (
        <Skeleton key={index} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
