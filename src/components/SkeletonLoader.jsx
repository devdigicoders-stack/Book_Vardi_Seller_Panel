import React from 'react';

export function SkeletonText({ className = '', width = 'w-24', height = 'h-4', as: Component = 'span' }) {
  return (
    <Component
      className={`animate-pulse bg-slate-200/80 rounded-md inline-block ${width} ${height} ${className}`}
    />
  );
}

export function SkeletonAvatar({ size = 'w-8 h-8', className = '' }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded-full ${size} ${className}`}
    />
  );
}

export function SkeletonCard({ className = '', height = 'h-32' }) {
  return (
    <div
      className={`animate-pulse bg-white rounded-2xl border border-gray-200 p-5 shadow-xs ${height} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-slate-200/80" />
        <div className="w-5 h-5 rounded-md bg-slate-200/80" />
      </div>
      <div className="mt-4 w-24 h-3 bg-slate-200/80 rounded" />
      <div className="mt-2 w-32 h-6 bg-slate-200/80 rounded" />
    </div>
  );
}

export function SkeletonHeader() {
  return (
    <div className="flex items-center gap-3">
      <SkeletonAvatar size="w-10 h-10" className="bg-white/20" />
      <div className="space-y-1.5">
        <SkeletonText width="w-40" height="h-5" className="bg-white/20" />
        <SkeletonText width="w-24" height="h-3" className="bg-white/20" />
      </div>
    </div>
  );
}

export function SkeletonMiniProfile() {
  return (
    <div className="p-3 rounded-xl border border-teal-100 bg-teal-50/40 space-y-2 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3.5 bg-teal-200/70 rounded w-28" />
        <div className="h-3 bg-teal-200/70 rounded w-4" />
      </div>
      <div className="h-2.5 bg-teal-200/50 rounded w-20" />
      <div className="pt-2 border-t border-teal-100 flex items-center justify-between">
        <div className="h-3 bg-teal-200/70 rounded w-16" />
        <div className="h-3 bg-teal-200/70 rounded w-10" />
      </div>
    </div>
  );
}

export function SkeletonTableRows({ rows = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200/80" />
            <div className="space-y-1.5">
              <div className="w-36 h-3.5 bg-gray-200/80 rounded" />
              <div className="w-24 h-2.5 bg-gray-200/80 rounded" />
            </div>
          </div>
          <div className="w-20 h-5 bg-gray-200/80 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome Heading Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-2">
          <SkeletonText width="w-48" height="h-3.5" className="bg-teal-200/60" />
          <SkeletonText width="w-72" height="h-8" className="bg-slate-200/80" />
          <SkeletonText width="w-96" height="h-3.5" className="bg-slate-200/60" />
        </div>
        <SkeletonText width="w-44" height="h-9" className="bg-teal-100 rounded-xl" />
      </div>

      {/* 4 Metrics Cards Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Action Items Skeleton */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <SkeletonText width="w-40" height="h-5" />
            <SkeletonText width="w-64" height="h-3" />
          </div>
          <div className="w-5 h-5 rounded-full bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3.5 border border-gray-100">
              <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
              <div className="w-full h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
