"use client";

import React, { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import ApprovalDropdown from "./ApprovalDropdown";
export default function CashMemoInvoiceForm({
  approvalIds,
  submitting,
  cashMemoInvoicesuccess,
  onDone,
  onSubmit,
}) {
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [billingModel, setBillingModel] = useState("");
  const [approvalId, setApprovalId] = useState("");
  const [approvalDocId, setApprovalDocId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [omniTransactionId, setOmniTransactionId] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const approvalDocData = approvalIds.find(
    (doc) => doc.ApprovalID === approvalId
  );

  useEffect(() => {
    resetForm();
  }, []);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

  // ⛔ Prevent double submit
  if (submitting){
    console("not allowed")
    return
  };
    const errors = {};
    const budgetLeft = parseFloat(approvalDocData?.budgetLeft || 0);
    const budgetSpend = parseFloat(approvalDocData?.budgetSpent || 0);

    const invoiceAmountNum = parseFloat(invoiceAmount);
    if (invoiceAmountNum > budgetLeft)
      errors.invoiceAmount = `Expense amount exceeds available budget. Budget left: ₹${budgetLeft}`;
    if (!paymentDate) errors.paymentDate = "Payment Date is required";
    if (!paymentMode) errors.paymentMode = "Payment Mode is required";

    if (
      (paymentMode === "OmniCard" || paymentMode === "OmniCardUPI") &&
      !omniTransactionId
    ) {
      errors.omniTransactionId = "Omni Transaction ID is required";
    }

    if (!billingModel) errors.billingModel = "Billing Model is required";
    if (!approvalId) errors.approvalId = "Approval ID is required";

    const numberRegex = /^\d+(\.\d{1,2})?$/;
    if (!invoiceAmount) {
      errors.invoiceAmount = "Invoice Amount is required";
    } else if (!numberRegex.test(invoiceAmount)) {
      errors.invoiceAmount =
        "Invoice Amount must be a valid number (e.g., 2500.50)";
    } else if (parseFloat(invoiceAmount) <= 0) {
      errors.invoiceAmount = "Invoice Amount must be greater than 0";
    }

    if (!invoiceDescription)
      errors.invoiceDescription = "Invoice Description is required";

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      const parsedInvoiceDate = invoiceDate
        ? Timestamp.fromDate(new Date(invoiceDate))
        : null;

      const formData = {
        paymentDate,
        paymentMode,
        billingModel,
        approvalId,
        approvalDocId,
        invoiceAmount: parseFloat(invoiceAmount).toFixed(2),
        invoiceDescription,
        omniTransactionId:
          paymentMode === "OmniCard" || paymentMode === "OmniCardUPI"
            ? omniTransactionId
            : null,
        budgetLeft,
        budgetSpend,
      };

      onSubmit(formData);
      // resetForm();
    }
  };

  const resetForm = () => {
    setPaymentDate("");
    setPaymentMode("");
    setBillingModel("");
    setApprovalId("");
    setApprovalDocId("");
    setInvoiceDate("");
    setInvoiceAmount("");
    setInvoiceDescription("");
    setOmniTransactionId("");
    setFormErrors({});
  };

  return (
    <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Payment Date
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Payment Mode
          </label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select mode</option>
            <option value="Bank Transfer made already">
              Bank Transfer made already
            </option>
            <option value="Business Credit Card">Business Credit Card</option>
            <option value="Complementary Service">Complementary Service</option>
            <option value="OmniCard">OmniCard</option>
            <option value="OmniCardUPI">OmniCardUPI</option>
            <option value="Volopay Credit Card">Volopay Credit Card</option>
            <option value="Advance from Company">Advance from Company</option>
            <option value="OTS">OTS</option>
          </select>
        </div>

        {(paymentMode === "OmniCard" || paymentMode === "OmniCardUPI") && (
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Omni Transaction ID
            </label>
            <input
              type="text"
              value={omniTransactionId}
              onChange={(e) => setOmniTransactionId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Billing Model
          </label>
          <select
            value={billingModel}
            onChange={(e) => setBillingModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Select model</option>
            <option value="Customer Billable Expenses">
              Customer Billable Expenses
            </option>
            <option value="Customer Non-Billable Expenses">
              Customer Non-Billable Expenses
            </option>
          </select>
        </div>

        <div className="md:col-span-2">
          <ApprovalDropdown
            approvalIds={approvalIds}
            approvalId={approvalId}
            setApprovalId={setApprovalId}
            setApprovalDocId={setApprovalDocId}
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Invoice Amount
          </label>
          <input
            type="text"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1 text-sm font-semibold text-gray-700">
            Invoice Description
          </label>
          <textarea
            value={invoiceDescription}
            onChange={(e) => setInvoiceDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            rows={3}
          />
        </div>
      </div>

      {Object.keys(formErrors).length > 0 && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <ul className="list-disc list-inside text-sm">
            {Object.values(formErrors).map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        {cashMemoInvoicesuccess ? (
          <div className="w-full text-center">
            <p className="text-green-600 font-semibold mb-3">
              ✅ Invoice added successfully!
            </p>
            <button
              type="button"
              onClick={onDone}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => resetForm()}
              disabled={submitting}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
