// components/modals/EODModal.js
"use client";

import React, { useEffect, useState } from "react";

export default function EODModal({ open, onClose, onConfirm, patron }) {
  const [fields, setFields] = useState({
    allTasksNum: true,
    budgertLeft: true,
    todaysExpense: true,
    mtdExpense: true,
    lmInvoicesExpense: false, // new field (default unchecked)
  });

  useEffect(() => {
    if (open) {
      // reset each time it's opened
      setFields({
        allTasksNum: true,
        budgertLeft: true,
        todaysExpense: true,
        mtdExpense: true,
        lmInvoicesExpense: false,
      });
    }
  }, [open]);

  if (!open) return null;

  const toggle = (key) =>
    setFields((f) => ({ ...f, [key]: !f[key] }));

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white text-gray-900 dark:bg-neutral-900 dark:text-white shadow-xl">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="text-lg font-semibold">
            Generate EOD {patron?.name ? `— ${patron.name}` : ""}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Select which summary fields to include in the EOD.
          </div>
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={fields.allTasksNum}
              onChange={() => toggle("allTasksNum")}
            />
            <span>TOTAL TASKS</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={fields.budgertLeft}
              onChange={() => toggle("budgertLeft")}
            />
            <span>LEFT ADVANCE AMOUNT</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={fields.todaysExpense}
              onChange={() => toggle("todaysExpense")}
            />
            <span>EXPENSES TODAY</span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={fields.mtdExpense}
              onChange={() => toggle("mtdExpense")}
            />
            <span>EXPENSES MTD</span>
          </label>

          {/* ✅ New field */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={fields.lmInvoicesExpense}
              onChange={() => toggle("lmInvoicesExpense")}
            />
            <span>EXPENSES FROM LM INVOICES</span>
          </label>
        </div>

        <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-neutral-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(fields)}
            className="px-4 py-2 rounded-xl bg-gray-600 text-white shadow"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
