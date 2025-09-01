"use client";
import React from "react";

const CashMemoTable = ({ items = [] }) => {
  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Item Name</th>
            <th className="border p-2 text-left">Item Description</th>
            <th className="border p-2 text-center">Unit</th>
            <th className="border p-2 text-center">Rate</th>
            <th className="border p-2 text-center">Quantity</th>
            <th className="border p-2 text-center">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-gray-50">
              <td className="border p-2">{row?.itemName || ""}</td>
              <td className="border p-2">{row?.itemDescription || ""}</td>
              <td className="border p-2 text-center">{row?.itemUnits || ""}</td>
              <td className="border p-2 text-center">{row?.itemRate || 0}</td>
              <td className="border p-2 text-center">{row?.itemQuantity || 0}</td>
              <td className="border p-2 text-center">{row.itemTotal|| 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashMemoTable;
