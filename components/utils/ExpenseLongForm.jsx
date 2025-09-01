"use client";

import React, { useState, useEffect } from "react";

import CashMemoTable from "../utils/CashMemoTable";

const ExpenseLongForm = ({ onSubmit, initialData }) => {
  const dueDateTypes = [
    "Regular payment- Thursday",
    "As per invoice due date",
    "Due date is already over",
    "Urgent payment",
    "Pay in next 15 days",
    "Pay in next 30 days",
  ];
  const paymentModes = [
    "Bank Transfer to be made",
    "Paid by Employee",
    "Bank Transfer made already",
    "Business Credit Card",
    "Volopay Credit Card",
    "Advance from Company",
    "Company Cash",
    "Internal Co. service",
    "Complementary service",
    "OmniCard",
    "OmniCardUPI",
    "OTS",
  ];
  const approvalExpenseSubCategoryTypes = [
    "Customer Non-Billable Expenses",
    "Customer Billable Expenses",
  ];
  const fieldLabels = {
    invoiceNumber: "Invoice Number",
    invoiceDate: "Invoice Date",
    invoiceDueDate: "Invoice Due Date",
    expenseDescription: "Expense Description",
    remarks: "Remarks",
    vendorName: "Vendor Name",
    pnlMonth: "PnL Month",
    approvalExpenseSubCategory: "Expense Sub-Category",
    dueDateType: "Due Date Type",
    paymentMode: "Payment Mode",
    typeOfExpenditure: "Type of Expenditure",
    DropdownGST: "Is Invoice in the name of our company",
    isGSTNumber: "GST Number Correct in Invoice",
    isGstApplicable: "Is GST Applicable",
    approvalId: "Approval ID",
    preTaxAmount: "Pre-Tax Amount",
    cgstAmount: "CGST Amount",
    igstAmount: "IGST Amount",
    otherCharges: "Other Charges",
    totalAmount: "Total Amount",
    aitotalAmount: "AI Total Amount",
    paidAdvanceAmount: "Paid Advance Amount",
  };



  const [formData, setFormData] = useState({
    invoiceNumber: "",
    invoiceDate: "",
    invoiceDueDate: "",
    expenseDescription: "",
    remarks: "",
    vendorName: "",
    pnlMonth: "",
    vendorName: "",
    approvalExpenseSubCategory: "",
    dueDateType: "",
    paymentMode: "",
    typeOfExpenditure: "",
    DropdownGST: "",
    isGSTNumber: "",
    isGstApplicable: "",
    approvalId: "",
    preTaxAmount: 0,
    cgstAmount: 0,
    igstAmount: 0,
    sgstAmount: 0,
    otherCharges: 0,
    totalAmount: 0,
    paidAdvanceAmount: 0,
    aitotalAmount: 0,
  });
  console.log("intial", initialData);
  console.log("form", formData);
  const [errors, setErrors] = useState([]);

  const isCashMemoInvoice = initialData?.isCashMemoInvoice === true;

  useEffect(() => {
    if (!initialData) return;

    setFormData((prev) => ({
      ...prev,
      ...initialData, // apply all initial fields first
      ...(isCashMemoInvoice && {
        totalAmount: initialData?.invoiceAmount || 0, // ✅ only override totalAmount
      }),
    }));
  }, [initialData, isCashMemoInvoice]);

  useEffect(() => {
    if (isCashMemoInvoice) {
      // ✅ Cash Memo → only set from invoiceAmount, no plus
      setFormData((prev) => ({
        ...prev,
        totalAmount: initialData?.invoiceAmount || 0,
      }));
      return;
    }

    // ✅ Normal invoice → calculate sum
    const {
      preTaxAmount,
      cgstAmount,
      igstAmount,
      otherCharges,
      sgstAmount,
      paidAdvanceAmount,
    } = formData;

    const total =
      (parseFloat(preTaxAmount) || 0) +
      (parseFloat(cgstAmount) || 0) +
      (parseFloat(igstAmount) || 0) +
      (parseFloat(otherCharges) || 0) +
      (parseFloat(sgstAmount) || 0) +
      (parseFloat(paidAdvanceAmount) || 0);

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
    }));
  }, [
    formData.preTaxAmount,
    formData.cgstAmount,
    formData.igstAmount,
    formData.otherCharges,
    formData.paidAdvanceAmount,
    formData.sgstAmount,
    isCashMemoInvoice, // 👈 important
    initialData?.invoiceAmount, // 👈 also track invoiceAmount
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = [];
    Object.entries(formData).forEach(([key, value]) => {
      // skip remarks only
      if (["remarks", "MbudgetLeft"].includes(key)) return;

      const label = fieldLabels[key] || key; // fallback to key if not mapped

      // check empty
      if (value === "" || value === null || value === undefined) {
        newErrors.push(`${label} is required`);
      }

      // check numbers not negative
      if (
        [
          "preTaxAmount",
          "cgstAmount",
          "igstAmount",
          "otherCharges",
          "paidAdvanceAmount",
        ].includes(key)
      ) {
        if (parseFloat(value) < 0) {
          newErrors.push(`${label} cannot be negative`);
        }
      }

      // ✅ totalAmount must be > 0
      if (key === "totalAmount") {
        if (parseFloat(value) <= 0) {
          newErrors.push(`${label} must be greater than 0`);
        }
      }
    });

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Optional: validate required fields
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const { MbudgetLeft, cashMemoItems, ...cleanFormData } = formData;

    if (initialData?.MbudgetLeft !== undefined) {
      const budgetLeft = parseFloat(initialData.MbudgetLeft) || 0;
      const totalAmount = parseFloat(formData.totalAmount) || 0;

      if (totalAmount > budgetLeft) {
        setErrors([
          `Budget Left (${budgetLeft}) is less than Total Amount (${totalAmount})`,
        ]);
        return; // stop submission
      }
    }

    // Clear errors if any
    setErrors([]);

    if (initialData?.cashMemoItems && initialData?.cashMemoItems.length > 0) {
      console.log("clean", ...cleanFormData);
      onSubmit({ ...cleanFormData, isCashMemo: true });
    } else if (
      initialData?.itemozationText &&
      initialData?.itemozationText !== ""
    ) {
      console.log("clean", { ...cleanFormData });
      onSubmit({ ...cleanFormData, isCashMemo: false });
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-2 gap-4 p-6 bg-white rounded-xl shadow"
      >
        <div className="col-span-2 font-semibold text-blue-600 mt-4">
          Invoice Details*
        </div>
        {/* Invoice Info */}
        <div>
          <label className="block text-sm font-medium">Invoice Number</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            readOnly={true}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Enter Invoice Number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Invoice Date</label>
          <input
            type="date"
            name="invoiceDate"
            readOnly={true}
            value={formData.invoiceDate}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">invioce Due Date </label>
          <input
            type="date"
            name="invoiceDueDate"
            value={formData.invoiceDueDate}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">PNL Month</label>
          <input
            type="date"
            name="pnlMonth"
            value={formData.pnlMonth}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Serviceable months"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium">
            Expense Description
          </label>
          <input
            type="text"
            name="expenseDescription"
            value={formData.expenseDescription}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Enter Expense Description"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium">Remarks</label>
          <input
            type="text"
            name="remarks"
            value={formData.remarks}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Enter Remarks"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium">Vendor Name</label>
          <input
            type="text"
            name="vendorName"
            readOnly={true}
            value={formData.vendorName}
            onChange={handleChange}
            className="w-full border rounded p-2"
            placeholder="Enter vendorName"
          />
        </div>

        {/* Expense Details Section */}
        <div className="col-span-2 font-semibold text-blue-600 mt-4">
          Expense Details*
        </div>

        <div>
          <label className="block text-sm font-medium">
            Approval Expense SubCategory
          </label>
          <select
            name="approvalExpenseSubCategory"
            value={formData.approvalExpenseSubCategory}
            disabled
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="">Select approval Expense SubCategory</option>
            {approvalExpenseSubCategoryTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Due Date Type</label>
          <select
            name="dueDateType"
            value={formData.dueDateType}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="">Select Due Date Type</option>
            {dueDateTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Payment Mode</label>
          <select
            name="paymentMode"
            value={formData.paymentMode}
            onChange={handleChange}
            disabled
            className="w-full border rounded p-2"
          >
            <option value="">Select Payment Mode</option>
            {paymentModes.map((mode, idx) => (
              <option key={idx} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Type of Expenditure
          </label>
          <select
            name="typeOfExpenditure"
            value={formData.typeOfExpenditure}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="">Select</option>
            <option value="Capex">Capex</option>
            <option value="Opex">Opex</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Is Invoice in the name of our company?
          </label>
          <select
            name="DropdownGST"
            value={formData.DropdownGST}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            GST Number Correct in Invoice
          </label>
          <select
            name="isGSTNumber"
            value={formData.isGSTNumber}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Is GST Applicable</label>
          <select
            name="isGstApplicable"
            value={formData.isGstApplicable}
            onChange={handleChange}
            className="w-full border rounded p-2"
          >
            <option value="">Select</option>
            <option value="Applicable">Applicable</option>
            <option value="Non Applicable">Non Applicable</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Approval ID</label>
          <input
            type="text"
            name="approvalId"
            value={formData.approvalId}
            readOnly={true}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        {/* Payment Details Section */}
        <div className="col-span-2 font-semibold text-blue-600 mt-4">
          Payment Details*
        </div>

        <div>
          <label className="block text-sm font-medium">Pre Tax Amount</label>
          <input
            type="number"
            step="0.01"
            name="preTaxAmount"
            value={formData.preTaxAmount}
            readOnly={isCashMemoInvoice}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">CGST Amount</label>
          <input
            type="number"
            step="0.01"
            name="cgstAmount"
            value={formData.cgstAmount}
            readOnly={isCashMemoInvoice}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">IGST Amount</label>
          <input
            type="number"
            step="0.01"
            name="igstAmount"
            value={formData.igstAmount}
            readOnly={isCashMemoInvoice}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">SGST Amount</label>
          <input
            type="number"
            step="0.01"
            name="sgstAmount"
            value={formData.sgstAmount}
            readOnly={isCashMemoInvoice}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Other Charges</label>
          <input
            type="number"
            step="0.01"
            name="otherCharges"
            value={formData.otherCharges}
            readOnly={isCashMemoInvoice}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Paid Advance Amount
          </label>
          <input
            type="number"
            step="0.01"
            name="paidAdvanceAmount"
            value={formData.paidAdvanceAmount}
            readOnly={isCashMemoInvoice}
            onChange={handleChange}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Total Amount</label>
          <input
            type="number"
            step="0.01"
            name="totalAmount"
            value={formData.totalAmount}
            readOnly={true} // always readonly anyway
            className="w-full border rounded p-2"
          />
        </div>
        {!isCashMemoInvoice && (
          <div>
            <label className="block text-sm font-medium">ai total</label>
            <input
              type="number"
              step="0.01"
              name="aimount"
              value={formData.aitotalAmount}
              readOnly={true} // always readonly anyway
              className="w-full border rounded p-2"
            />
          </div>
        )}

        {/* ✅ Show validation errors */}
        {errors.length > 0 && (
          <div className="col-span-2 text-red-600 font-medium mb-2">
            <ul className="list-disc pl-5">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {initialData?.cashMemoItems && initialData?.cashMemoItems.length > 0 ? (
          // ✅ Show Cash Memo Items Table Component
          <CashMemoTable items={initialData.cashMemoItems} />
        ) : (
          <div></div>
        )}
        <div className="col-span-2 flex justify-end mt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseLongForm;
