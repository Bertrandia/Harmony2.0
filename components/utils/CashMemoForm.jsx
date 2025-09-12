import React, { useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import useHandleGeneratePDF from "../hooks/useHandleGeneratePDF";
import CashMemoInvoiceForm from "../utils/cashMemoInvoiceForm";

const CashMemoForm = ({
  userDetails,
  patron,
  task,
  approvalIds,
  onRefreshApprovals,
  onCashmemoInvoiceDone,
  selectedVendor,
  onSubmissionSuccess,
}) => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const formatDateDDMMYYYY = `${yyyy}-${mm}-${dd}`;

  const [vendorName, setVendorName] = useState("");
  const [file, setFile] = useState(null);
  const [soldTo, setSoldTo] = useState(
    patron?.newPatronName || patron?.patronName || ""
  );
  const [invoiceDate, setInvoiceDate] = useState(formatDateDDMMYYYY);
  const [formErrors, setFormErrors] = useState({});
  const [items, setItems] = useState([
    {
      itemName: "",
      itemUnits: "Nos",
      itemQuantity: "",
      itemTotal: "",
      itemRate: "",
      itemDescription: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cashMemoInfo, setCashMemoInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cashMemoInvoicesuccess, setCashMemoInvoiceSuccess] = useState(false);

  // Generate Cash Memo number
  const generateInvoiceNumber = (patronName, lmName, totalAmount) => {
    const getInitials = (name) =>
      name
        .trim()
        .split(" ")
        .map((part) => (part ? part[0].toUpperCase() : ""))
        .join("");

    const now = new Date();
    const padZero = (num) => (num < 10 ? `0${num}` : num);

    const day = padZero(now.getDate());
    const month = padZero(now.getMonth() + 1);
    const year = now.getFullYear().toString().slice(-2);
    const hour = padZero(now.getHours());
    const minutes = padZero(now.getMinutes());

    const dateCode = `${day}${month}${year}`;
    const timeCode = `${hour}${minutes}`;
    const patronCode = getInitials(patronName);
    const lmCode = getInitials(lmName);
    const amountCode = Math.round(parseFloat(totalAmount));

    return `CM-${patronCode}-${dateCode}/${timeCode}-${lmCode}-${amountCode}`;
  };

  // Add Item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: "",
        itemUnits: "Nos",
        itemQuantity: "",
        itemTotal: "",
        itemRate: "",
        itemDescription: "",
      },
    ]);
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "itemQuantity" || field === "itemTotal") {
      const quantity = parseFloat(newItems[index].itemQuantity) || 0;
      const total = parseFloat(newItems[index].itemTotal) || 0;
      newItems[index].itemRate =
        quantity > 0 ? (total / quantity).toFixed(2) : "";
    }

    setItems(newItems);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!vendorName.trim()) errors.vendorName = "Vendor Name is required";
    if (!soldTo.trim()) errors.soldTo = "Sold To is required";
    if (!invoiceDate) errors.invoiceDate = "Invoice Date is required";
    if (!file) errors.file = "File upload is required";
    if (items.length < 1) errors.items = "At least 1 item should be added";

    items.forEach((item, index) => {
      if (!item.itemName.trim())
        errors[`itemName_${index}`] = `Item ${index + 1}: Name is required`;
      if (!item.itemUnits.trim())
        errors[`itemUnits_${index}`] = `Item ${index + 1}: Units are required`;
      if (!item.itemQuantity || parseFloat(item.itemQuantity) <= 0)
        errors[`itemQuantity_${index}`] = `Item ${
          index + 1
        }: Quantity must be greater than 0`;
      if (!item.itemTotal || parseFloat(item.itemTotal) < 0)
        errors[`itemTotal_${index}`] = `Item ${
          index + 1
        }: Total must be 0 or more`;
      if (!item.itemDescription.trim())
        errors[`itemDescription_${index}`] = `Item ${
          index + 1
        }: Description is required`;
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      const lmRef = doc(db, "user", userDetails?.id);
      const parsedInvoiceDate = Timestamp.fromDate(new Date(invoiceDate));
      const totalItemsAmount = items.reduce(
        (acc, item) => acc + (parseFloat(item.itemTotal) || 0),
        0
      );

      const generatedInvoiceNumber = generateInvoiceNumber(
        patron?.patronName,
        patron?.assignedLM || "LM",
        totalItemsAmount
      );

      const cashMemoDataForm = {
        vendorName,
        soldTo,
        invoiceDate: parsedInvoiceDate,
        items,
        totalAmount: totalItemsAmount,
        file,
        invoiceNumber: generatedInvoiceNumber,
      };

      const cashMemoPdfUrl = await useHandleGeneratePDF(
        cashMemoDataForm,
        userDetails?.id
      );

      const cashMemoTemplate = {
        invoice: cashMemoPdfUrl || "",
        cashMemoPdf: cashMemoPdfUrl || "",
        dateOfSubmission: Timestamp.now(),
        invoiceDate: cashMemoDataForm.invoiceDate,
        isTaxable: false,
        isUsed: false,
        items: cashMemoDataForm.items,
        lmRef: lmRef,
        patronName: patron.patronName,
        patronRef: task.patronRef,
        reportingManager: userDetails?.reportingManager,
        reportingManagerRef: userDetails?.reportingMRef,
        soldTo: cashMemoDataForm.soldTo,
        submittedBy: userDetails?.email,
        totalAmount: String(Number(cashMemoDataForm.totalAmount).toFixed(2)),
        vendorName: cashMemoDataForm.vendorName,
        invoiceNumber: cashMemoDataForm.invoiceNumber,
      };

      const crmCashMemoCol = collection(db, "crmCashMemo");
      const docRef = await addDoc(crmCashMemoCol, cashMemoTemplate);

      setCashMemoInfo({
        vendorName: cashMemoDataForm.vendorName,
        invoiceNumber: cashMemoDataForm.invoiceNumber,
        invoiceDate: cashMemoDataForm.invoiceDate,
        cashMemoPdfUrl,
        cashMemoRef: docRef,
        cashMemoallItemsTotal: totalItemsAmount,
      });

      setSuccess(true);
      if (onSubmissionSuccess) {
        onSubmissionSuccess();
      }
    } catch (error) {
      console.error("❌ Error while submitting Cash Memo:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Step 1: define the submit handler function outside JSX
  const handleCashMemoInvoiceSubmit = async (formData) => {
    try {
      setSubmitting(true);

      const taskRef = task?.id
        ? doc(db, "createTaskCollection", task.id)
        : null;
      const approvalRef = formData?.approvalDocId
        ? doc(db, "advanceApprovalFinance", formData.approvalDocId)
        : null;
      const lmRef = userDetails?.id ? doc(db, "user", userDetails.id) : null;

      if (!cashMemoInfo?.invoiceDate) {
        throw new Error("Cash Memo Invoice Date is missing.");
      }

      const date = cashMemoInfo.invoiceDate.toDate();
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const invoiceDateStr = `${day}${month}${year}`;

      // 🔹 Unique expense ID
      const uniqueExpenseId = (
        (patron?.newPatronName || "") +
        invoiceDateStr +
        (formData?.invoiceAmount || "") +
        (selectedVendor.vendorName || "") +
        (cashMemoInfo?.invoiceNumber || "")
      )
        .replaceAll(" ", "")
        .replaceAll("-", "")
        .replaceAll(".", "")
        .toUpperCase();

      const q = query(
        collection(db, "LMInvoices"),
        where("uniqueExpenseId", "==", uniqueExpenseId)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        return;
      }

      const invoicedatarelatedFields = {
        uniqueExpenseId,
        invoice: cashMemoInfo?.cashMemoPdfUrl || "",
        invoiceNumber: cashMemoInfo?.invoiceNumber || "",
        invoiceAvailable: "No, Generate CashMemo",
        isInvoiceAdded: true,
        invoiceDate: cashMemoInfo?.invoiceDate,
        cashMemoRef: cashMemoInfo?.cashMemoRef || null,
        isCashMemoApplied: true,
      };
      const parsedPaymenteDate = !formData?.paymentDate
        ? null
        : Timestamp.fromDate(new Date(formData.paymentDate));

      const Finaldetails = {
        vendorName: selectedVendor.vendorName,
        taskRef,
        patronRef: task?.patronRef || null,
        billingModel: formData?.billingModel || "",
        taskID: task?.taskID || "",
        paymentMode: formData?.paymentMode || "",
        invoiceAmount: formData?.invoiceAmount
          ? parseFloat(formData.invoiceAmount).toFixed(2)
          : "0.00",
        transactionId: formData?.transactionId || "",
        createdAt: Timestamp.now(),
        createdBy: userDetails?.email || "",
        isExpenseAdded: false,
        approvalId: formData?.approvalId || "",
        invoiceDescription: formData?.invoiceDescription || "",
        isDisabled: false,
        patronName: patron?.patronName || "",
        patronID: patron?.clientCode || "",
        taskSubject: task?.taskSubject || "",
        taskDescription: task?.taskDescription || "",
        taskAssignDate: task?.taskAssignDate || "",
        taskDueDate: task?.taskDueDate || "",
        patronBusinessID: patron?.patronBusinessID || "",
        isRejected: false,
        lmRef,
        lmName: userDetails?.display_name || "",
        paymentTransactionDate: parsedPaymenteDate || "",
        isExpenseAddedBySpecialLM: false,
        newPatronName: patron?.newPatronName || "",
        newPatronID: patron?.newPatronID || "",
        patronEmail: patron?.email || "",
        approvalRef,
        isPdf: true,
        pdfText: "",
        volopayTransactionID: "",
        ...invoicedatarelatedFields,
      };

      const lmInvoicesRef = collection(db, "LMInvoices");
      await addDoc(lmInvoicesRef, Finaldetails);

      // 🔹 Budget updates
      const budgetLeft = parseFloat(formData?.budgetLeft);
      const budgetSpend = parseFloat(formData?.budgetSpend);
      const invoiceAmount = parseFloat(formData?.invoiceAmount);

      const safeBudgetLeft = isNaN(budgetLeft) ? 0 : budgetLeft;
      const safeBudgetSpend = isNaN(budgetSpend) ? 0 : budgetSpend;
      const safeInvoiceAmount = isNaN(invoiceAmount) ? 0 : invoiceAmount;

      const updateadvanceApprovalFinance = {
        budgetLeft: safeBudgetLeft - safeInvoiceAmount,
        budgetSpent: safeBudgetSpend + safeInvoiceAmount,
      };

      const approvalDocRef = doc(
        db,
        "advanceApprovalFinance",
        formData?.approvalDocId
      );

      await updateDoc(approvalDocRef, updateadvanceApprovalFinance);

      if (typeof onRefreshApprovals === "function") {
        await onRefreshApprovals();
      }

      setCashMemoInvoiceSuccess(true);
    } catch (error) {
      console.error("❌ Error in onSubmit:", error);
      alert(error.message || "Something went wrong while processing the form.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Cash Memo Form */}

      {!success && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 bg-white shadow-md rounded-lg p-6 space-y-6"
        >
          {/* Vendor & Sold To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-2">Vendor Name</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">Sold To</label>
              <input
                type="text"
                value={soldTo}
                onChange={(e) => setSoldTo(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
              />
            </div>
          </div>

          {/* Invoice Date & File Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-2">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block font-medium mb-2">
                Upload File/Image
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          {/* Items Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Items</h2>
            {items.map((item, index) => (
              <div
                key={index}
                className="border p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 relative"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) =>
                      handleItemChange(index, "itemName", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Item Units
                  </label>
                  <select
                    value={item.itemUnits}
                    onChange={(e) =>
                      handleItemChange(index, "itemUnits", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                  >
                    <option value="">Select Unit</option>
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={item.itemQuantity}
                    onChange={(e) =>
                      handleItemChange(index, "itemQuantity", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Total
                  </label>
                  <input
                    type="number"
                    value={item.itemTotal}
                    onChange={(e) =>
                      handleItemChange(index, "itemTotal", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rate (auto)
                  </label>
                  <input
                    type="text"
                    value={item.itemRate}
                    readOnly
                    className="w-full border px-3 py-2 rounded bg-gray-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={item.itemDescription}
                    onChange={(e) =>
                      handleItemChange(index, "itemDescription", e.target.value)
                    }
                    className="w-full border px-3 py-2 rounded focus:ring focus:ring-blue-200"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newItems = items.filter((_, i) => i !== index);
                    setItems(newItems);
                  }}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ✕ Delete
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddItem}
              disabled={success}
              className="mt-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              + Add Item
            </button>
          </div>

          {/* Error Display */}
          {Object.keys(formErrors).length > 0 && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <ul className="list-disc list-inside text-sm">
                {Object.values(formErrors).map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success or Submit */}
          {success ? (
            <div className="mt-4 px-4 py-3 rounded bg-green-100 text-green-700 font-semibold text-center">
              ✅ Cash Memo Generated Successfully!
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className={`mt-4 px-6 py-2 rounded-lg text-white font-medium ${
                loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Generating..." : "Generate Cash Memo"}
            </button>
          )}
        </form>
      )}

      {success && cashMemoInfo?.cashMemoPdfUrl && (
        <div className="mt-4 text-center">
          <a
            href={cashMemoInfo.cashMemoPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🔗 View Cash Memo PDF
          </a>
        </div>
      )}

      {success && (
        <div className="mt-4 px-4 py-3 rounded bg-green-100 text-green-700 font-semibold text-center">
          ✅ Cash Memo Generated Successfully!
        </div>
      )}

      {/* Invoice Section */}
      {success && (
        <div className="p-6 border rounded-lg bg-white shadow-md mt-6">
          <CashMemoInvoiceForm
            itemstotalAmount={cashMemoInfo.cashMemoallItemsTotal}
            approvalIds={approvalIds}
            submitting={submitting}
            cashMemoInvoicesuccess={cashMemoInvoicesuccess}
            onDone={onCashmemoInvoiceDone}
            onSubmit={handleCashMemoInvoiceSubmit}
          />
        </div>
      )}
    </>
  );
};

export default CashMemoForm;
