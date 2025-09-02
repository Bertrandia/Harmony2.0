// components/utils/PatronSkeleton.jsx
'use client';
import React from 'react';

const PatronShimmer = () => {
  const base = 'bg-muted animate-pulse rounded';

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`${base} w-12 h-12 rounded-full`} />
        <div className="flex-1 space-y-2">
          <div className={`${base} h-4 w-3/4`} />
          <div className={`${base} h-3 w-1/2`} />
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2">
        <div className={`${base} h-3 w-5/6`} />
        <div className={`${base} h-3 w-4/6`} />
        <div className={`${base} h-3 w-3/6`} />
      </div>

      {/* Badges */}
      <div className="flex gap-2">
        <div className={`${base} h-6 w-20`} />
        <div className={`${base} h-6 w-16`} />
      </div>

      {/* Button */}
      <div className={`${base} h-8 w-full`} />
    </div>
  );
};

export default PatronShimmer;
