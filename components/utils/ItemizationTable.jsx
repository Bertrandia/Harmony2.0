"use client";
import React, { useState, useEffect } from "react";
import { Trash2, Edit2, Check, Plus } from "lucide-react";

// ✅ Normalize API/raw item → table schema
const normalizeItem = (raw) => ({
  itemName: raw.item_name || raw.itemName || "",
  itemDescription: raw.item_description || raw.itemDescription || "",
  hsnSacCode: raw.hsn_snc || raw.hsnSacCode || "",
  itemTotal: Number(raw.item_total || raw.itemTotal) || 0,
  unit: raw.item_unit || raw.unit || "",
  quantity: Number(raw.item_quantity || raw.quantity) || 0,
  rate: Number(raw.item_rate || raw.rate) || 0,
  preTaxAmount: Number(raw.item_preTaxAmount || raw.preTaxAmount) || 0,
  cgstAmount: Number(raw.item_cgst || raw.cgstAmount) || 0,
});

const ItemizationTable = ({ items = [], onSubmit }) => {
  const [localItems, setLocalItems] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState("");

  // Load & normalize items when prop changes
  useEffect(() => {
    if (items.length) {
      setLocalItems(items.map(normalizeItem));
    }
  }, [items]);

  // Add new row
  const handleAdd = () => {
    setLocalItems([
      ...localItems,
      {
        itemName: "",
        itemDescription: "",
        hsnSacCode: "",
        itemTotal: 0,
        unit: "",
        quantity: 0,
        rate: 0,
        preTaxAmount: 0,
        cgstAmount: 0,
      },
    ]);
    setEditingIndex(localItems.length);
  };

  // Delete row
  const handleDelete = (index) => {
    const updated = [...localItems];
    updated.splice(index, 1);
    setLocalItems(updated);
  };

  // Start editing
  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  // Confirm changes
  const handleConfirm = () => {
    setEditingIndex(null);
    setError("");
  };

  // Handle input change
  const handleChange = (index, field, value) => {
    const updated = [...localItems];
    if (
      ["itemTotal", "quantity", "rate", "preTaxAmount", "cgstAmount"].includes(
        field
      )
    ) {
      updated[index][field] = value === "" ? 0 : Number(value);
    } else {
      updated[index][field] = value;
    }
    setLocalItems(updated);
  };

  // Validate & submit
  const handleComplete = () => {
    if (editingIndex !== null) {
      setError("Please confirm all rows before completing itemization.");
      return;
    }

    for (let i = 0; i < localItems.length; i++) {
      const row = localItems[i];
      if (
        !row.itemName ||
        !row.itemDescription ||
        !row.hsnSacCode ||
        !row.unit ||
        row.quantity <= 0 ||
        row.rate <= 0
      ) {
        setError(`Row ${i + 1} has missing or invalid values.`);
        return;
      }
    }

    setError("");
    onSubmit(localItems); // ✅ only send final data
  };

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      {/* Top bar */}
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
        >
          <Plus size={18} /> Add
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Action</th>
            <th className="border p-2">Item Name</th>
            <th className="border p-2">Item Description</th>
            <th className="border p-2">HSN/SAC</th>
            <th className="border p-2">Gross Amount</th>
            <th className="border p-2">Unit</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Rate</th>
            <th className="border p-2">Pre-Tax Amount</th>
            <th className="border p-2">CGST</th>
          </tr>
        </thead>
        <tbody>
          {localItems.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-gray-50">
              <td className="border p-2 flex items-center gap-2">
                {editingIndex === idx ? (
                  <Check
                    className="text-green-500 cursor-pointer"
                    size={18}
                    onClick={() => handleConfirm(idx)}
                  />
                ) : (
                  <Edit2
                    className="text-blue-500 cursor-pointer"
                    size={18}
                    onClick={() => handleEdit(idx)}
                  />
                )}
                <Trash2
                  className="text-red-500 cursor-pointer"
                  size={18}
                  onClick={() => handleDelete(idx)}
                />
              </td>

              {[
                "itemName",
                "itemDescription",
                "hsnSacCode",
                "itemTotal",
                "unit",
                "quantity",
                "rate",
                "preTaxAmount",
                "cgstAmount",
              ].map((field) => (
                <td key={field} className="border p-2">
                  {editingIndex === idx ? (
                    field === "unit" ? (
                      <select
                        value={row[field] ?? ""}
                        onChange={(e) =>
                          handleChange(idx, field, e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="">--Select--</option>
                        {[
                          "m",
                          "Ltr.",
                          "Box",
                          "Can",
                          "Btl.",
                          "Nos",
                          "Pcs.",
                          "PKT.",
                          "Dozen",
                          "Sft",
                          "L-Sip",
                          "Trips",
                          "Set",
                          "Foot",
                          "Bundle",
                          "SQM",
                          "Coil",
                          "Days",
                          "RFT",
                          "Pair",
                          "CRT",
                          "Tin",
                          "Jar",
                          "Roll",
                          "Hrs",
                        ].map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={
                          [
                            "itemTotal",
                            "quantity",
                            "rate",
                            "preTaxAmount",
                            "cgstAmount",
                          ].includes(field)
                            ? "number"
                            : "text"
                        }
                        value={row[field] ?? ""}
                        onChange={(e) =>
                          handleChange(idx, field, e.target.value)
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    )
                  ) : (
                    row[field] || ""
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total & Complete */}
      <div className="flex flex-col gap-2 p-3">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm">
            Total Amount:{" "}
            {localItems.reduce((sum, i) => sum + (Number(i.itemTotal) || 0), 0)}
          </span>
          <button
            onClick={handleComplete}
            className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
          >
            Complete Itemization
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemizationTable;
