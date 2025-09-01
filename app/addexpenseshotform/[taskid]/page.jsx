"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../firebasedata/config";
import InvoiceForm from "../../../components/utils/InvoiceForm";
import { useAuth } from "../../../app/context/AuthContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { encode } from "base64-arraybuffer";
import CashMemoForm from "../../../components/utils/CashMemoForm";

import axios from "axios";

const addexpensesPage = () => {
  const { taskid } = useParams();
  const { userDetails } = useAuth();
  const [task, setTask] = useState(null);
  const [patron, setPatron] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isInvoiceAvailable, setIsInvoiceAvailable] = useState("");
  const [isCashMemoConfirmed, setIsCashMemoConfirmed] = useState(false);
  const [approvalIds, setApprovalIds] = useState([]);
  const [invoiceSuccess, setInvoiceSuccess] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceDropdownOpen, setInvoiceDropdownOpen] = useState(false);

  const fetchTaskAndPatron = async () => {
    try {
      if (!taskid) return;
      const taskSnap = await getDoc(doc(db, "createTaskCollection", taskid));
      if (taskSnap.exists()) {
        const taskData = { id: taskSnap.id, ...taskSnap.data() };
        setTask(taskData);
        if (taskData.patronRef) {
          const patronSnap = await getDoc(taskData.patronRef);
          if (patronSnap.exists()) {
            setPatron({ id: patronSnap.id, ...patronSnap.data() });
          }

          const financeQuery = query(
            collection(db, "advanceApprovalFinance"),
            where("patronRef", "==", taskData.patronRef)
          );

          const financeSnapshot = await getDocs(financeQuery);
          const financeDocs = financeSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setApprovalIds(financeDocs);
        }
      }
    } catch (error) {
      console.error("Error fetching task/patron/appprovalids:", error);
    }
  };

  const fetchVendors = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "mainVendorNameList"), orderBy("vendorName"))
      );
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchTaskAndPatron(), fetchVendors()]);
      setLoading(false);
    };
    fetchAll();
  }, [taskid]);

  useEffect(() => {
    const vendor = vendors.find((v) => v.id === selectedVendorId);
    setSelectedVendor(vendor || null);
    if (vendor) {
      setSearchQuery(vendor.vendorName);
      setIsInvoiceAvailable(""); // Reset invoice selection on vendor change
    }
  }, [selectedVendorId, vendors]);

  const filteredVendors = vendors.filter((v) =>
    v.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvoiceSubmit = async (formData) => {
    try {
      setInvoiceLoading(true);
      const taskRef = doc(db, "createTaskCollection", taskid);
      const approvalRef = doc(
        db,
        "advanceApprovalFinance",
        formData?.approvalDocId
      );
      const lmRef = doc(db, "user", userDetails?.id);

      let invoiceUrl = "";
      let base64String = "";
      let extractedText = "";
      let uniqueExpenseId = "";
      const file = formData.invoiceFile;
      let isPdf = {};

      if (file && isInvoiceAvailable === "yes") {
        const date = formData?.invoiceDate?.toDate?.();
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
        const year = date.getFullYear(); // Full 4-digit year

        const invoiceDateStr = `${day}${month}${year}`; // e.g., "19082025"
        // 1. Upload to Firebase Storage
        const storage = getStorage();
        const fileName = `${Date.now()}_${file.name}`;
        const fileRef = ref(
          storage,
          `users/${userDetails?.id}/createCashMemo/${fileName}`
        );
        await uploadBytes(fileRef, file);
        invoiceUrl = await getDownloadURL(fileRef);

        // 2. Handle file type
        const extension = file.name.split(".").pop().toLowerCase();

        if (["jpg", "jpeg", "png"].includes(extension)) {
          // Convert to base64 for image
          const arrayBuffer = await file.arrayBuffer();
          base64String = encode(arrayBuffer);
          isPdf = {
            isPdf: false,
          };
        } else if (extension === "pdf") {
          // Extract text from PDF
          const formDataPDF = new FormData();
          formDataPDF.append("file", file);
          isPdf = {
            isPdf: true,
          };

          const response = await axios.post(
            "https://pdf-to-text-api-632406467525.us-central1.run.app/extract-text",
            formDataPDF,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          if (response.status === 200) {
            extractedText = response.data?.text || "";
          } else {
            console.warn("PDF extraction failed:", response.statusText);
          }
        }

        // 3. Generate uniqueExpenseId
        uniqueExpenseId = (
          (patron?.newPatronName || "") +
          invoiceDateStr +
          formData.invoiceAmount +
          selectedVendor?.vendorName +
          formData.invoiceNumber
        )
          .replaceAll(" ", "")
          .replaceAll("-", "")
          .replaceAll(".", "")
          .toUpperCase();
      }

      // Build invoice fields based on availability
      let invoicedatarelatedFields = {};

      if (isInvoiceAvailable === "yes") {
        invoicedatarelatedFields = {
          uniqueExpenseId,
          invoice: invoiceUrl,
          invoiceNumber: formData.invoiceNumber,
          invoiceAvailable: "Yes",
          isInvoiceAdded: true,
          base64: base64String,
          pdfText: extractedText,
          invoiceDate: formData.invoiceDate,
        };
      } else if (isInvoiceAvailable === "no") {
        invoicedatarelatedFields = {
          invoiceAvailable: "Yes, Will Share Later",
          isInvoiceAdded: false,
        };
      }

      // Final object
      const Finaldetails = {
        vendorName: selectedVendor?.vendorName || "",
        taskRef,
        patronRef: task.patronRef,
        billingModel: formData.billingModel,
        taskID: task.taskID,
        paymentMode: formData.paymentMode,
        invoiceAmount: formData.invoiceAmount,
        createdAt: Timestamp.now(),
        createdBy: userDetails?.email || "",
        isExpenseAdded: false,
        approvalId: formData.approvalId,
        invoiceDescription: formData.invoiceDescription,
        isDisabled: false,
        patronName: patron?.patronName || "",
        patronID: patron?.newPatronID || "",
        taskSubject: task?.taskSubject || "",
        taskDescription: task?.taskDescription || "",
        taskAssignDate: task?.taskAssignDate || "",
        taskDueDate: task?.taskDueDate || "",
        patronBusinessID: patron?.patronBusinessID || "",
        isRejected: false,
        lmRef,
        lmName: userDetails?.display_name || "",
        paymentTransactionDate: formData.paymentDate,
        transctionId: formData.transactionId,
        isExpenseAddedBySpecialLM: false,
        newPatronName: patron?.newPatronName || "",
        newPatronID: patron?.newPatronID || "",
        approvalRef,
        ...invoicedatarelatedFields,
        ...isPdf,
      };

     

      await addDoc(collection(db, "LMInvoices"), Finaldetails);

      const budgetLeft = parseFloat(formData.budgetLeft);
      const budgetSpend = parseFloat(formData.budgetSpend);
      const invoiceAmount = parseFloat(formData.invoiceAmount);

      // Ensure numbers, fallback to 0 if NaN
      const safeBudgetLeft = isNaN(budgetLeft) ? 0 : budgetLeft;
      const safeBudgetSpend = isNaN(budgetSpend) ? 0 : budgetSpend;
      const safeInvoiceAmount = isNaN(invoiceAmount) ? 0 : invoiceAmount;

      const updateadvanceApprovalFinance = {
        budgetLeft:
          Math.round((safeBudgetLeft - safeInvoiceAmount) * 100) / 100,
        budgetSpent:
          Math.round((safeBudgetSpend + safeInvoiceAmount) * 100) / 100,
      };

      const approvalDocRef = doc(
        db,
        "advanceApprovalFinance",
        formData?.approvalDocId
      );
    // console.log(updateadvanceApprovalFinance);
      await updateDoc(approvalDocRef, updateadvanceApprovalFinance);
     
      setInvoiceSuccess(true);

      await fetchTaskAndPatron();
    } catch (error) {
      console.error("Error during invoice submission:", error);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const isLocalVendor =
    selectedVendor?.vendorName.toLowerCase() === "local vendor";

  if (loading) return <div className="p-4 text-center">Loading...</div>;

 if (["To be Started", "Created"].includes(task.taskStatusCategory)) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="p-6 bg-yellow-100 border border-yellow-300 rounded-xl text-center max-w-lg">
        <h1 className="text-red-600 font-semibold text-lg">
          The task is in "{task.taskStatusCategory}" mode. <br />
          You are not supposed to add an expense yet.
        </h1>
      </div>
    </div>
  );
}

  return (
    <div className="max-w-3xl mx-auto p-8 bg-gradient-to-br from-white via-gray-50 to-stone-50 rounded-3xl shadow-lg border border-gray-100 space-y-8">
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-stone-200 to-stone-300 rounded-2xl flex items-center justify-center mr-4 shadow">
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-700">
          Select a Vendor
        </h1>
      </div>

      {/* Vendor Search */}
      <div className="relative">
        <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-amber-200 transition-all">
          <svg
            className="w-5 h-5 text-gray-400 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search vendor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDropdownOpen(true);
            }}
            className="w-full bg-transparent focus:outline-none text-gray-600 placeholder-gray-400"
            onFocus={() => setDropdownOpen(true)}
          />
          <button
            className="ml-2 text-gray-400 hover:text-gray-600 transition"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <svg
              className={`w-5 h-5 transform transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-md max-h-56 overflow-hidden">
            <ul className="overflow-y-auto max-h-56">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <li
                    key={vendor.id}
                    onClick={() => {
                      setSelectedVendorId(vendor.id);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-3 flex items-center cursor-pointer hover:bg-stone-100 transition ${
                      selectedVendorId === vendor.id
                        ? "bg-amber-50 border-l-4 border-amber-300"
                        : ""
                    }`}
                  >
                    <div className="w-9 h-9 bg-stone-200 rounded-full flex items-center justify-center text-gray-600 font-medium mr-3">
                      {vendor.vendorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-700">{vendor.vendorName}</span>
                    {selectedVendorId === vendor.id && (
                      <svg
                        className="w-4 h-4 text-amber-500 ml-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-gray-400 text-sm">
                  No results found
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Invoice Section */}
      {selectedVendor && (
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100 space-y-4">
          <label className="block text-gray-600 font-medium">
            Is invoice available?
          </label>

          <div
            onClick={() => setInvoiceDropdownOpen(!invoiceDropdownOpen)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
              text-gray-700 font-medium cursor-pointer flex justify-between items-center
              hover:border-amber-200 transition-all"
          >
            {isInvoiceAvailable
              ? isInvoiceAvailable === "yes"
                ? "✅ Yes"
                : isInvoiceAvailable === "no"
                ? "⏳ Yes, I will share later"
                : "🧾 No, Generate Cash Memo"
              : "Select an option"}
            <svg
              className={`w-4 h-4 ml-2 transform transition-transform ${
                invoiceDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {invoiceDropdownOpen && (
            <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-lg">
              <ul className="max-h-56 overflow-y-auto">
                <li
                  onClick={() => {
                    setIsInvoiceAvailable("yes");
                    setInvoiceDropdownOpen(false);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-amber-50"
                >
                  ✅ Yes
                </li>
                <li
                  onClick={() => {
                    setIsInvoiceAvailable("no");
                    setInvoiceDropdownOpen(false);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-amber-50"
                >
                  ⏳ Yes, I will share later
                </li>
                {isLocalVendor && (
                  <li
                    onClick={() => {
                      setIsInvoiceAvailable("cash-memo");
                      setInvoiceDropdownOpen(false);
                    }}
                    className="px-4 py-2 cursor-pointer hover:bg-amber-50"
                  >
                    🧾 No, Generate Cash Memo
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Cash Memo Option */}
      {selectedVendor && isInvoiceAvailable === "cash-memo" && (
        <div className="p-6 rounded-2xl border-2 border-amber-100 bg-gradient-to-br from-amber-50 via-yellow-50 to-white shadow-inner">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isCashMemoConfirmed}
              onChange={(e) => setIsCashMemoConfirmed(e.target.checked)}
              className="w-5 h-5 text-amber-500 border-gray-300 rounded focus:ring-amber-400"
            />
            <span className="text-gray-700">
              I confirm that this expense does not have any official supporting
              bill/invoice, and it is not from listed vendors such as Amazon,
              Blinkit, etc. I acknowledge and accept this cash memo as valid for
              record purposes ..
            </span>
          </label>

          {isCashMemoConfirmed && (
            <div className="mt-6">
              <CashMemoForm
                selectedVendor={selectedVendor}
                userDetails={userDetails}
                patron={patron}
                task={task}
                approvalIds={approvalIds}
                onRefreshApprovals={fetchTaskAndPatron}
                onCashmemoInvoiceDone={() => {
                  setSelectedVendor(null);
                  setSelectedVendorId("");
                  setSearchQuery("");
                  setIsInvoiceAvailable("");
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Invoice Form */}
      {selectedVendor &&
        isInvoiceAvailable &&
        isInvoiceAvailable !== "cash-memo" && (
          <div className="animate-in fade-in duration-300">
            <InvoiceForm
              hideInvoiceFields={isInvoiceAvailable === "no"}
              onSubmit={handleInvoiceSubmit}
              approvalIds={approvalIds}
              success={invoiceSuccess}
              onDone={() => {
                setInvoiceSuccess(false);
                setSelectedVendor(null);
                setSelectedVendorId("");
                setSearchQuery("");
                setIsInvoiceAvailable("");
              }}
              invoiceLoading={invoiceLoading}
            />
          </div>
        )}
    </div>
  );

  // return (
  //   <div className="max-w-md mx-auto p-6">
  //     <h1 className="text-xl font-bold mb-4">Select a Vendor</h1>

  //     {/* Vendor Search and Dropdown */}
  //     <div className="relative">
  //       <div className="flex items-center border border-gray-300 rounded px-3 py-2">
  //         <input
  //           type="text"
  //           placeholder="Search vendor..."
  //           value={searchQuery}
  //           onChange={(e) => {
  //             setSearchQuery(e.target.value);
  //             setDropdownOpen(true);
  //           }}
  //           className="w-full focus:outline-none"
  //           onFocus={() => setDropdownOpen(true)}
  //         />
  //         <span
  //           className="ml-2 text-gray-400 cursor-pointer"
  //           onClick={() => setDropdownOpen(!dropdownOpen)}
  //         >
  //           ▼
  //         </span>
  //       </div>

  //       {dropdownOpen && (
  //         <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow max-h-60 overflow-y-auto">
  //           {filteredVendors.length > 0 ? (
  //             filteredVendors.map((vendor) => (
  //               <li
  //                 key={vendor.id}
  //                 onClick={() => {
  //                   setSelectedVendorId(vendor.id);
  //                   setDropdownOpen(false);
  //                 }}
  //                 className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${
  //                   selectedVendorId === vendor.id ? "bg-blue-200" : ""
  //                 }`}
  //               >
  //                 {vendor.vendorName}
  //               </li>
  //             ))
  //           ) : (
  //             <li className="px-3 py-2 text-sm text-gray-500">
  //               No results found
  //             </li>
  //           )}
  //         </ul>
  //       )}
  //     </div>

  //     {/* Invoice Selection */}
  //     {selectedVendor && (
  //       <div className="mt-4">
  //         <label htmlFor="invoiceAvailable" className="block mb-1 font-medium">
  //           Is invoice available?
  //         </label>
  //         <select
  //           id="invoiceAvailable"
  //           value={isInvoiceAvailable}
  //           onChange={(e) => setIsInvoiceAvailable(e.target.value)}
  //           className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
  //         >
  //           <option value="">Select</option>
  //           <option value="yes">Yes</option>
  //           <option value="no">Yes, I will share later</option>
  //           {isLocalVendor && (
  //             <option value="cash-memo">No,Generate Cash Memo</option>
  //           )}
  //         </select>
  //       </div>
  //     )}

  //     {/* Render based on invoice option */}
  //     {selectedVendor && isInvoiceAvailable === "cash-memo" && (
  //       <div className="mt-6 p-4 border border-yellow-400 bg-yellow-50 rounded">
  //         <label className="flex items-start space-x-2">
  //           <input
  //             type="checkbox"
  //             checked={isCashMemoConfirmed}
  //             onChange={(e) => setIsCashMemoConfirmed(e.target.checked)}
  //             className="mt-1"
  //           />
  //           <span className="text-sm text-yellow-800">
  //             I confirm to Terms And Conditions
  //           </span>
  //         </label>

  //         {isCashMemoConfirmed && (
  //           <CashMemoForm
  //             userDetails={userDetails}
  //             patron={patron}
  //             task={task}
  //             approvalIds={approvalIds}
  //             onRefreshApprovals={fetchTaskAndPatron}
  //             onCashmemoInvoiceDone={() => {
  //               setSelectedVendor(null); // reset page to normal state
  //               setSelectedVendorId(""); // clear selectedVendorId
  //               setSearchQuery(""); // clear the input box
  //               setIsInvoiceAvailable("");
  //             }}
  //           />
  //         )}
  //       </div>
  //     )}

  //     {selectedVendor &&
  //       isInvoiceAvailable &&
  //       isInvoiceAvailable !== "cash-memo" && (
  //         <InvoiceForm
  //           hideInvoiceFields={isInvoiceAvailable === "no"}
  //           onSubmit={handleInvoiceSubmit}
  //           approvalIds={approvalIds}
  //           success={invoiceSuccess}
  //           onDone={() => {
  //             setInvoiceSuccess(false);
  //             setSelectedVendor(null); // reset page to normal state
  //             setSelectedVendorId(""); // clear selectedVendorId
  //             setSearchQuery(""); // clear the input box
  //             setIsInvoiceAvailable("");
  //           }}
  //           invoiceLoading={invoiceLoading}
  //         />
  //       )}
  //   </div>
  // );
};

export default addexpensesPage;
