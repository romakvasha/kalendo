import { Card, CardBody, Skeleton } from "@/components/ui";
import { range } from "@/lib/utils";

export interface ModuleSkeletonProps {
  /** How many placeholder cards to draw under the header. */
  rows?: number;
}

export function ModuleSkeleton({ rows = 4 }: ModuleSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardBody className="flex flex-col gap-4">
          {range(rows).map((index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
