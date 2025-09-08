"use client";
import { useState } from "react";
import { Info, X } from "lucide-react";

export default function InfoNote({ content }) {
  const [open, setOpen] = useState(false);

  const renderContent = () => {
    if (!content) return "No details available";

    if (typeof content === "string") {
      return <p className="text-gray-700 leading-relaxed">{content}</p>;
    }

    if (typeof content === "object") {
      return (
        <div className="space-y-3">
          {Object.entries(content).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <span className="text-gray-800 font-medium">
                {String(value) || "N/A"}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return "Unsupported content format";
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-100 hover:to-indigo-200 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Centered Pop-up */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="w-80 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-800">
                      Details
                    </span>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-6 h-6 rounded-full hover:bg-white/60 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">{renderContent()}</div>

              {/* Footer */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-600 hover:from-gray-700 hover:to-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
