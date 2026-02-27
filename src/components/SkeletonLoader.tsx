interface SkeletonProps {
    className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-white/10 rounded-xl ${className}`} />
    )
}

export function SkeletonCircle({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-white/10 rounded-full ${className}`} />
    )
}

export function PFPHeaderSkeleton() {
    return (
        <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-3xl p-6 flex items-center gap-5">
            <SkeletonCircle className="w-20 h-20 flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
    )
}

export function BadgeCardSkeleton() {
    return (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-5 flex flex-col items-center gap-4">
            <Skeleton className="w-28 h-28 rounded-2xl" />
            <div className="w-full space-y-2">
                <Skeleton className="h-5 w-20 mx-auto" />
                <Skeleton className="h-4 w-28 mx-auto" />
                <Skeleton className="h-2 w-full rounded-full" />
            </div>
        </div>
    )
}

export function BadgeGridSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <BadgeCardSkeleton key={i} />
            ))}
        </div>
    )
}
