import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
    return (
        <div
            className={cn("animate-pulse rounded-md overflow-hidden relative", className)}
            style={{ background: "var(--skeleton-bg)" }}
        >
            <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                style={{ background: "linear-gradient(to right, transparent, var(--skeleton-shine), transparent)" }}
            />
        </div>
    );
};

export const MovieCardSkeleton = () => {
    return (
        <div className="space-y-2">
            <Skeleton className="aspect-[2/3] rounded-xl w-full" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <Skeleton className="h-3 w-2/5 rounded" />
        </div>
    );
};

export const SectionSkeleton = () => {
    return (
        <div className="space-y-6 px-4 md:px-12 py-8">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};

export const MovieRowSkeleton = () => {
    return (
        <div className="space-y-4 px-4 sm:px-8 md:px-12 py-4">
            {/* Editorial header skeleton */}
            <div className="flex items-center gap-4 mb-2">
                <div className="h-px flex-1" style={{ background: "var(--skeleton-shine)" }} />
                <Skeleton className="h-3 w-24 rounded" />
                <div className="h-px flex-1" style={{ background: "var(--skeleton-shine)" }} />
            </div>
            <Skeleton className="h-7 w-44 mb-5" />
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                    <MovieCardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
};
