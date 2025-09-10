"use client";

import React, { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import ApprovalDropdown from "./ApprovalDropdown";
import { useRouter } from "next/navigation";
export default function CashMemoInvoiceForm({
  approvalIds,
  submitting,
  cashMemoInvoicesuccess,
  onDone,
  onSubmit,
  itemstotalAmount,
}) {
  const router = useRouter(); 
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const formatDateDDMMYYYY = `${yyyy}-${mm}-${dd}`;
  const [paymentDate, setPaymentDate] = useState(formatDateDDMMYYYY);
  const [paymentMode, setPaymentMode] = useState("OmniCardUPI");
  const [billingModel, setBillingModel] = useState(
    "Customer Billable Expenses"
  );
  const [approvalId, setApprovalId] = useState("");
  const [approvalDocId, setApprovalDocId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const modesNotRequiringTransactionId = [
    "OTS",
    "Advance from Company",
    "Business Credit Card",
    "Complementary Service",
  ];

  const approvalDocData = approvalIds.find(
    (doc) => doc.ApprovalID === approvalId
  );

  useEffect(() => {
    resetForm();
  }, []);

  useEffect(() => {
    // 🔹 Auto navigate after success
    if (cashMemoInvoicesuccess) {
      router.push("/mytasks"); // <-- navigate to mytasks page
    }
  }, [cashMemoInvoicesuccess, router]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (submitting) {
      console("not allowed");
      return;
    }
    const errors = {};
    const budgetLeft = parseFloat(approvalDocData?.budgetLeft || 0);
    const budgetSpend = parseFloat(approvalDocData?.budgetSpent || 0);

    if (itemstotalAmount > budgetLeft)
      errors.invoiceAmount = `Expense amount exceeds available budget. Budget left: ₹${budgetLeft}`;
    if (!paymentDate) errors.paymentDate = "Payment Date is required";
    if (!paymentMode) errors.paymentMode = "Payment Mode is required";

    if (!modesNotRequiringTransactionId.includes(paymentMode)) {
      if (!transactionId) errors.transactionId = "Transaction ID is required";
    }

    if (!billingModel) errors.billingModel = "Billing Model is required";
    if (!approvalId) errors.approvalId = "Approval ID is required";

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
        invoiceAmount: itemstotalAmount,
        invoiceDescription,
        transactionId,
        budgetLeft,
        budgetSpend,
      };

     
      onSubmit(formData);
      // resetForm();
    }
  };

  const resetForm = () => {
    setPaymentDate(formatDateDDMMYYYY);
    setPaymentMode("OmniCardUPI"); // default
    setBillingModel("Customer Billable Expenses");
    setApprovalId("");
    setApprovalDocId("");
    setInvoiceDate("");
    setInvoiceAmount("");
    setInvoiceDescription("");
    setTransactionId("");
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

        {!modesNotRequiringTransactionId.includes(paymentMode) && (
          <div>
            <label className="block mb-1 text-sm font-semibold text-gray-700">
              Transaction ID
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
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
            readOnly={true}
            value={itemstotalAmount}
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
              className="px-4 py-2 bg-black text-white rounded hover:bg-black"
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
              className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
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
