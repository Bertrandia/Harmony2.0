// components/utils/InfoNote.js
"use client";
import { useState } from "react";
import { Info } from "lucide-react";

export default function InfoNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-lg bg-white p-3 shadow-lg border border-gray-200 text-sm text-gray-700 z-50">
          This is the static information note.
           This is the static information note.
            This is the static information note.
             This is the static information note.
        </div>
      )}
    </div>
  );
}
