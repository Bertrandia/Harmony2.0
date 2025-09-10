"use client";

import React, { useEffect, useState, useRef } from "react";
import { Timestamp } from "firebase/firestore";
import ApprovalDropdown from "../utils/ApprovalDropdown";
import CustomDropdown from "../utils/CustomDropdown";
import { useRouter } from "next/navigation";

const InvoiceForm = ({
  hideInvoiceFields,
  onSubmit,
  approvalIds,
  success,
  onDone,
  invoiceLoading,
}) => {
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
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(formatDateDDMMYYYY);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const fileNameRef = useRef(null);

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
  }, [hideInvoiceFields]);

   useEffect(() => {
    if (success) {
      router.push("/mytasks");
    }
  }, [success, router]);

  const handleSubmit = () => {
    const errors = {};
    const budgetLeft = parseFloat(approvalDocData?.budgetLeft);
    const budgetSpend = parseFloat(approvalDocData?.budgetSpent);

    const invoiceAmountNum = parseFloat(invoiceAmount);
    if (invoiceAmountNum > budgetLeft)
      errors.paymentDate = `Expense amount exceeds the available budget. Budget left:${budgetLeft}`;
    if (!paymentDate) errors.paymentDate = "Payment Date is required";
    if (!paymentMode) errors.paymentMode = "Payment Mode is required";

    if (!billingModel) errors.billingModel = "Billing Model is required";
    if (!approvalId) errors.approvalId = "Approval ID is required";

    if (!hideInvoiceFields) {
      if (!invoiceNumber) errors.invoiceNumber = "Invoice Number is required";
      if (!invoiceDate) errors.invoiceDate = "Invoice Date is required";
      if (!invoiceFile) errors.invoiceFile = "Invoice File is required";
    }

    if (
      !modesNotRequiringTransactionId.includes(paymentMode) &&
      !transactionId
    ) {
      errors.transactionId = "Transaction ID is required for this payment mode";
    }

    const numberRegex = /^\d+(\.\d{1,2})?$/; // allows numbers like 2 or 2.33 (up to 2 decimal places)

    if (!invoiceAmount) {
      errors.invoiceAmount = "Invoice Amount is required";
    } else if (!numberRegex.test(invoiceAmount)) {
      errors.invoiceAmount =
        "Invoice Amount must be a valid number (e.g., 2.33)";
    } else if (parseFloat(invoiceAmount) <= 0) {
      errors.invoiceAmount = "Invoice Amount must be greater than 0";
    }

    if (!invoiceDescription)
      errors.invoiceDescription = "Invoice Description is required";

    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      // Parse the date string into a Date object

      const parsedInvoiceDate =
        hideInvoiceFields || !invoiceDate
          ? null
          : Timestamp.fromDate(new Date(invoiceDate));

      const parsedPaymenteDate = !paymentDate
        ? null
        : Timestamp.fromDate(new Date(paymentDate));

      const formData = {
        paymentDate: parsedPaymenteDate,
        paymentMode,
        billingModel,
        approvalId,
        approvalDocId,
        invoiceAmount: parseFloat(invoiceAmount).toFixed(2), // always a number
        invoiceDate: parsedInvoiceDate,
        invoiceNumber: hideInvoiceFields ? null : invoiceNumber,
        invoiceFile: hideInvoiceFields ? null : invoiceFile,
        invoiceDescription,
        transactionId,
        budgetLeft,
        budgetSpend,
      };

      onSubmit(formData);
    }
  };

  const resetForm = () => {
    setPaymentDate(formatDateDDMMYYYY);
    setPaymentMode("OmniCardUPI");
    setBillingModel("Customer Billable Expenses");
    setApprovalId("");
    setApprovalDocId("");
    setInvoiceNumber("");
    setInvoiceDate(formatDateDDMMYYYY);
    setInvoiceAmount("");
    setInvoiceFile(null);
    setInvoiceDescription("");
    setTransactionId("");
    setFormErrors({});
    if (fileNameRef.current) {
      fileNameRef.current.value = ""; // clears the UI filename
    }
  };
  return (
    <div className="w-full max-w-7xl mx-auto mt-6 bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl p-10 border border-gray-100 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center mb-10">
        <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
          Invoice Details
        </h2>
      </div>

      {/* Form Grid - Horizontal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {/* Payment Date */}
        <div className="w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Payment Date
          </label>
          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl 
                     focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                     text-gray-700 shadow-sm hover:border-blue-300"
          />
        </div>

        {/* Payment Mode */}
        <div className="w-full">
          <CustomDropdown
            label="Payment Mode"
            value={paymentMode}
            onChange={(mode) => {
              setPaymentMode(mode);

              // Reset transactionId if mode doesn't require it
              if (modesNotRequiringTransactionId.includes(mode)) {
                setTransactionId("");
              }
            }}
            options={[
              {
                value: "Bank Transfer made already",
                label: "Bank Transfer made already",
              },
              { value: "Business Credit Card", label: "Business Credit Card" },
              {
                value: "Complementary Service",
                label: "Complementary Service",
              },
              { value: "OmniCard", label: "OmniCard" },
              { value: "OmniCardUPI", label: "OmniCardUPI" },
              { value: "Volopay Credit Card", label: "Volopay Credit Card" },
              { value: "Advance from Company", label: "Advance from Company" },
              { value: "OTS", label: "OTS" },
            ]}
          />
        </div>

        {/*  Transaction ID (conditional) */}

        {!modesNotRequiringTransactionId.includes(paymentMode) && (
          <div className="w-full">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Transaction ID
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID"
              className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl 
                 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                 text-gray-700 shadow-sm hover:border-blue-300"
            />
          </div>
        )}

        {/* Billing Model */}
        <div className="w-full">
          <CustomDropdown
            label="Billing Model"
            value={billingModel}
            onChange={setBillingModel}
            options={[
              {
                value: "Customer Billable Expenses",
                label: "Customer Billable Expenses",
              },
              {
                value: "Customer Non-Billable Expenses",
                label: "Customer Non-Billable Expenses",
              },
            ]}
          />
        </div>

        {/* Approval Dropdown full width */}
        <div className="lg:col-span-2 xl:col-span-3">
          <ApprovalDropdown
            approvalIds={approvalIds}
            approvalId={approvalId}
            setApprovalId={setApprovalId}
            setApprovalDocId={setApprovalDocId}
          />
        </div>

        {/* Invoice Fields (if not hidden) */}
        {!hideInvoiceFields && (
          <>
            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number"
                className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         text-gray-700 shadow-sm hover:border-blue-300"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Invoice Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         text-gray-700 shadow-sm hover:border-blue-300"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Upload Invoice (PDF/Image)
              </label>
              <input
                ref={fileNameRef}
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setInvoiceFile(e.target.files[0])}
                className="w-full px-5 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl 
                         focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                         text-gray-700 hover:border-blue-300 file:mr-4 file:py-2 file:px-4 
                         file:rounded-lg file:border-0 file:text-sm file:font-medium 
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </>
        )}

        <div className="w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Invoice Amount
          </label>
          <input
            type="text"
            value={invoiceAmount}
            onChange={(e) => setInvoiceAmount(e.target.value)}
            placeholder="Enter amount"
            className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl 
                     focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                     text-gray-700 shadow-sm hover:border-blue-300"
          />
        </div>

        <div className="lg:col-span-2 xl:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Invoice Description
          </label>
          <textarea
            value={invoiceDescription}
            onChange={(e) => setInvoiceDescription(e.target.value)}
            placeholder="Enter invoice description..."
            className="w-full px-5 py-3 bg-white border-2 border-gray-200 rounded-xl 
                     focus:ring-4 focus:ring-blue-100 focus:border-blue-500 
                     text-gray-700 shadow-sm hover:border-blue-300 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Error Box */}
      {Object.keys(formErrors).length > 0 && (
        <div className="mt-8 p-5 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-700 rounded-xl shadow-sm">
          <h4 className="font-semibold mb-2">
            Please fix the following errors:
          </h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            {Object.values(formErrors).map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Buttons Centered */}
      {!success ? (
        <div className="flex justify-center gap-8 mt-12 pt-8 border-t border-gray-200">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={invoiceLoading}
            className={`px-10 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 ${
              invoiceLoading
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-gray-600 to-gray-600 text-white hover:from-gary-700 hover:to-gary-700 focus:ring-gray-200 shadow-lg hover:shadow-xl"
            }`}
          >
            {invoiceLoading ? "Submitting..." : "Submit Invoice"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={invoiceLoading}
            className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 px-10 py-3 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="text-center mt-10 pt-8 border-t border-gray-200">
          <p className="text-xl font-bold text-green-600 mb-2">Success!</p>
          <p className="text-gray-600 mb-6">
            Invoice has been submitted successfully
          </p>
          {/* <button
            type="button"
            onClick={onDone}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-200 shadow-lg hover:shadow-xl"
          >
            Done
          </button> */}
        </div>
      )}
    </div>
  );

  // return (
  //   <div className="mt-6 bg-white shadow-md rounded-lg p-6 border border-gray-200">
  //     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  //       <div>
  //         <label className="block mb-1 text-sm font-semibold text-gray-700">
  //           Payment Date
  //         </label>
  //         <input
  //           type="date"
  //           value={paymentDate}
  //           onChange={(e) => setPaymentDate(e.target.value)}
  //           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //         />
  //       </div>

  //       <div>
  //         <label className="block mb-1 text-sm font-semibold text-gray-700">
  //           Payment Mode
  //         </label>
  //         <select
  //           value={paymentMode}
  //           onChange={(e) => setPaymentMode(e.target.value)}
  //           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //         >
  //           <option value="">Select mode</option>
  //           <option value="Bank Transfer made already">
  //             Bank Transfer made already
  //           </option>
  //           <option value="Business Credit Card">Business Credit Card</option>
  //           <option value="Complementary Service">Complementary Service</option>
  //           <option value="OmniCard">OmniCard</option>
  //           <option value="OmniCardUPI">OmniCardUPI</option>
  //           <option value="Volopay Credit Card">Volopay Credit Card</option>
  //           <option value="Advance from Company">Advance from Company</option>
  //           <option value="OTS">OTS</option>
  //         </select>
  //       </div>

  //       {(paymentMode === "OmniCard" || paymentMode === "OmniCardUPI") && (
  //         <div>
  //           <label className="block mb-1 text-sm font-semibold text-gray-700">
  //             Omni Transaction ID
  //           </label>
  //           <input
  //             type="text"
  //             value={omniTransactionId}
  //             onChange={(e) => setOmniTransactionId(e.target.value)}
  //             className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //           />
  //         </div>
  //       )}

  //       <div>
  //         <label className="block mb-1 text-sm font-semibold text-gray-700">
  //           Billing Model
  //         </label>
  //         <select
  //           value={billingModel}
  //           onChange={(e) => setBillingModel(e.target.value)}
  //           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //         >
  //           <option value="">Select model</option>
  //           <option value="Customer Billable Expenses">
  //             Customer Billable Expenses
  //           </option>
  //           <option value="Customer Non-Billable Expenses">
  //             Customer Non-Billable Expenses
  //           </option>
  //         </select>
  //       </div>

  //       <div className="md:col-span-2">
  //         <ApprovalDropdown
  //           approvalIds={approvalIds}
  //           approvalId={approvalId}
  //           setApprovalId={setApprovalId}
  //           setApprovalDocId={setApprovalDocId}
  //         />
  //       </div>

  //       {!hideInvoiceFields && (
  //         <>
  //           <div>
  //             <label className="block mb-1 text-sm font-semibold text-gray-700">
  //               Invoice Number
  //             </label>
  //             <input
  //               type="text"
  //               value={invoiceNumber}
  //               onChange={(e) => setInvoiceNumber(e.target.value)}
  //               className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //             />
  //           </div>

  //           <div>
  //             <label className="block mb-1 text-sm font-semibold text-gray-700">
  //               Invoice Date
  //             </label>
  //             <input
  //               type="date"
  //               value={invoiceDate}
  //               onChange={(e) => setInvoiceDate(e.target.value)}
  //               className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //             />
  //           </div>

  //           <div className="md:col-span-2">
  //             <label className="block mb-1 text-sm font-semibold text-gray-700">
  //               Upload Invoice (PDF/Image)
  //             </label>
  //             <input
  //               type="file"
  //               accept="application/pdf,image/*"
  //               onChange={(e) => setInvoiceFile(e.target.files[0])}
  //               className="w-full text-gray-700"
  //             />
  //           </div>
  //         </>
  //       )}

  //       <div>
  //         <label className="block mb-1 text-sm font-semibold text-gray-700">
  //           Invoice Amount
  //         </label>
  //         <input
  //           type="text"
  //           value={invoiceAmount}
  //           onChange={(e) => setInvoiceAmount(e.target.value)}
  //           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //         />
  //       </div>

  //       <div className="md:col-span-2">
  //         <label className="block mb-1 text-sm font-semibold text-gray-700">
  //           Invoice Description
  //         </label>
  //         <textarea
  //           value={invoiceDescription}
  //           onChange={(e) => setInvoiceDescription(e.target.value)}
  //           className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
  //           rows={3}
  //         />
  //       </div>
  //     </div>

  //     {Object.keys(formErrors).length > 0 && (
  //       <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
  //         <ul className="list-disc list-inside text-sm">
  //           {Object.values(formErrors).map((msg, idx) => (
  //             <li key={idx}>{msg}</li>
  //           ))}
  //         </ul>
  //       </div>
  //     )}

  //     {!success ? (
  //       <>
  //         <div className="flex flex-col md:flex-row gap-4 mt-6">
  //           <button
  //             type="button"
  //             onClick={handleSubmit}
  //             disabled={invoiceLoading}
  //             className={`w-full md:w-auto px-6 py-2 rounded transition-colors duration-200
  //         ${
  //           invoiceLoading
  //             ? "bg-gray-400 text-gray-700"
  //             : "bg-blue-600 text-white hover:bg-blue-700"
  //         }
  //       `}
  //           >
  //             {invoiceLoading ? "Submitting..." : "Submit"}
  //           </button>

  //           <button
  //             type="button"
  //             onClick={resetForm}
  //             disabled={invoiceLoading}
  //             className="w-full md:w-auto bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 transition-colors duration-200"
  //           >
  //             Cancel
  //           </button>
  //         </div>
  //       </>
  //     ) : (
  //       <div className="text-center">
  //         <p className="text-green-600 font-semibold mb-4">
  //           ✅ Invoice added successfully!
  //         </p>
  //         <button
  //           type="button"
  //           onClick={onDone}
  //           className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
  //         >
  //           Done
  //         </button>
  //       </div>
  //     )}
  //   </div>
  // );
};

export default InvoiceForm;
