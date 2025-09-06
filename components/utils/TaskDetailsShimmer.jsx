"use client";

import React from "react";

export default function TaskDetailsShimmer() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      {/* Header shimmer */}
      <div className="text-center mb-8">
        <div className="h-8 w-64 bg-gray-200 rounded mx-auto mb-2"></div>
        <div className="h-4 w-80 bg-gray-200 rounded mx-auto"></div>
      </div>

      {/* Patron card shimmer */}
      <div className="bg-white shadow rounded-2xl p-8 space-y-4">
        <div className="h-6 w-40 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-200 rounded-xl"
            ></div>
          ))}
        </div>
      </div>

      {/* Task details shimmer */}
      <div className="bg-white shadow rounded-2xl p-8 space-y-6">
        <div className="h-6 w-40 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 rounded-xl"
            ></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-200 rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
