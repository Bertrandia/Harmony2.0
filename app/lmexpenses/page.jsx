"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../firebasedata/config";
import { useAuth } from "../../app/context/AuthContext";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";

const ExpensesPage = () => {
  const { userDetails } = useAuth();
  const [invoiceAbsent, setInvoiceAbsent] = useState([]);
  const [crmNotAdded, setCrmNotAdded] = useState([]);
  const [crmAdded, setCrmAdded] = useState([]);
  const [activeTab, setActiveTab] = useState("invoiceAbsent");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // 🔹 Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // 🔹 Form state
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [formError, setFormError] = useState("");
  const [invoiceAdding, setInvoiceAdding] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "user", userDetails.id);

      const q = query(
        collection(db, "LMInvoices"),
        where("lmRef", "==", userRef),
        where("isDisabled", "==", false)
      );

      const querySnapshot = await getDocs(q);
      const allDocs = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const sortByCreatedAt = (a, b) => {
        const aTime = a.createdAt?.toDate?.().getTime?.() ?? 0;
        const bTime = b.createdAt?.toDate?.().getTime?.() ?? 0;
        return bTime - aTime;
      };

      setInvoiceAbsent(
        allDocs.filter((e) => e.isInvoiceAdded === false).sort(sortByCreatedAt)
      );
      setCrmNotAdded(
        allDocs
          .filter(
            (e) => e.isInvoiceAdded === true && e.isExpenseAdded === false
          )
          .sort(sortByCreatedAt)
      );
      setCrmAdded(
        allDocs
          .filter((e) => e.isInvoiceAdded === true && e.isExpenseAdded === true)
          .sort(sortByCreatedAt)
      );
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userDetails?.id) return;

    fetchExpenses();
  }, [userDetails?.id]);

  const ShimmerCard = () => (
    <div className="p-4 bg-gray-200 animate-pulse rounded-lg shadow-md flex justify-between items-center">
      <div className="w-3/4 space-y-2">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
      <div className="w-16 h-6 bg-gray-300 rounded"></div>
    </div>
  );

  const handleAddInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setInvoiceAdding(true);

    // ✅ Validation
    if (!invoiceFile) {
      setFormError("Invoice file is required.");
      setInvoiceAdding(false);
      return;
    }
    if (!invoiceNumber.trim()) {
      setFormError("Invoice number is required.");
      setInvoiceAdding(false);
      return;
    }
    if (!invoiceDate) {
      setFormError("Invoice date is required.");
      setInvoiceAdding(false);
      return;
    }

    setFormError("");

    try {
      const invoiceRef = doc(db, "LMInvoices", selectedInvoiceId);

      // 🔹 Fetch existing invoice
      const docSnap = await getDoc(invoiceRef);
      if (!docSnap.exists()) {
        setFormError("Invoice not found!");
        setInvoiceAdding(false);
        return;
      }
      const existingData = docSnap.data();

      // 🔹 Generate uniqueExpenseId
      const dateObj = new Date(invoiceDate);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const year = dateObj.getFullYear();
      const invoiceDateStr = `${day}${month}${year}`;

      const uniqueExpenseId = (
        (existingData?.newPatronName || "") +
        invoiceDateStr +
        (existingData?.invoiceAmount || "") +
        (existingData?.vendorName || "") +
        invoiceNumber
      )
        .replaceAll(" ", "")
        .replaceAll("-", "")
        .replaceAll(".", "")
        .toUpperCase();

      // 🔹 Check for duplicates using Firestore query
      const q = query(
        collection(db, "LMInvoices"),
        where("uniqueExpenseId", "==", uniqueExpenseId)
      );

      const querySnapshot = await getDocs(q);
      const duplicateFound = querySnapshot.docs.some(
        (docItem) => docItem.id !== selectedInvoiceId
      );

      if (duplicateFound) {
        setFormError(
          "Duplicate invoice detected. This invoice already exists."
        );
        setInvoiceAdding(false);
        return;
      }

      // 🔹 Upload file to Firebase Storage
      const storage = getStorage();
      const fileName = `${Date.now()}_${invoiceFile.name}`;
      const fileRef = ref(
        storage,
        `users/${userDetails?.id}/createCashMemo/${fileName}`
      );
      await uploadBytes(fileRef, invoiceFile);
      const invoiceUrl = await getDownloadURL(fileRef);

      // 🔹 Handle file type
      let base64String = "";
      let extractedText = "";
      let isPdf = {};

      const extension = invoiceFile.name.split(".").pop().toLowerCase();

      if (["jpg", "jpeg", "png"].includes(extension)) {
        const arrayBuffer = await invoiceFile.arrayBuffer();
        base64String = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        isPdf = { isPdf: false };
      } else if (extension === "pdf") {
        const formDataPDF = new FormData();
        formDataPDF.append("file", invoiceFile);
        isPdf = { isPdf: true };

        const response = await axios.post(
          "https://pdf-to-text-api-632406467525.us-central1.run.app/extract-text",
          formDataPDF,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (response.status === 200) {
          extractedText = response.data?.text || "";
        } else {
          console.warn("PDF extraction failed:", response.statusText);
        }
      }

      // 🔹 Prepare data to update
      const invoiceDataToUpdate = {
        isInvoiceAdded: true,
        invoice: invoiceUrl,
        invoiceNumber,
        invoiceDate: Timestamp.fromDate(new Date(invoiceDate)),
        uniqueExpenseId,
        base64: base64String,
        pdfText: extractedText,
        ...isPdf,
      };

      // 🔹 Update Firestore
      await updateDoc(invoiceRef, invoiceDataToUpdate);

      // 🔹 Refresh data
      await fetchExpenses();

      // 🔹 Reset form
      setShowModal(false);
      setInvoiceFile(null);
      setInvoiceNumber("");
      setInvoiceDate("");
    } catch (error) {
      console.error("Error updating invoice:", error);
      setFormError("Failed to update invoice. Please try again.");
    } finally {
      setInvoiceAdding(false);
    }
  };

  const filterList = (list) => {
    if (!searchText) return list;
    const lowerSearch = searchText.toLowerCase();
    return list.filter(
      (exp) =>
        exp.invoiceNumber?.toString().toLowerCase().includes(lowerSearch) ||
        exp.invoiceDescription?.toLowerCase().includes(lowerSearch) ||
        exp.invoiceAmount?.toString().toLowerCase().includes(lowerSearch)
    );
  };

  const renderList = (list) => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      );
    }

    const filteredList = filterList(list);

    if (filteredList.length === 0) {
      return <p className="text-gray-500">No expenses found</p>;
    }

    return (
      <ul className="space-y-3">
        {filteredList.map((exp) => (
          <li
            key={exp.id}
            className="p-4 bg-white-50 rounded-lg shadow-md flex justify-between items-center"
          >
            <div>
              <p>
                <strong>Invoice Number:</strong> {exp.invoiceNumber ?? "-"}
              </p>
              <p>
                <strong>Amount:</strong> {exp.invoiceAmount ?? "-"}
              </p>
              <p>
                <strong>Description:</strong> {exp.invoiceDescription ?? "-"}
              </p>
              <p>
                <strong>Payment Mode:</strong> {exp.paymentMode ?? "-"}
              </p>
              <p>
                <strong>Patron Name:</strong> {exp.patronName ?? "-"}
              </p>
              <p>
                <strong>CreatedAT:</strong>{" "}
                {exp.createdAt?.toDate?.().toLocaleString() ?? "-"}
              </p>
              <p>
                <strong>Submitted by:</strong> {exp.createdBy ?? "-"}
              </p>
            </div>
            <div>
              {exp.isInvoiceAdded === false ? (
                <button
                  className="bg-black text-white px-3 py-1 rounded"
                  onClick={() => handleAddInvoice(exp.id)}
                >
                  Add Invoice
                </button>
              ) : exp.invoice ? (
                <a
                  href={exp.invoice}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border bg-black text-white px-3 py-1 rounded inline-block"
                >
                  View Invoice
                </a>
              ) : (
                <button
                  className="border border-gray-500 text-gary-500 px-3 py-1 rounded"
                  disabled
                >
                  View Invoice
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  };

  const getCurrentList = () => {
    if (activeTab === "invoiceAbsent") return invoiceAbsent;
    if (activeTab === "crmNotAdded") return crmNotAdded;
    if (activeTab === "crmAdded") return crmAdded;
    return [];
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Expenses
          </h1>
          <p className="mt-2 text-muted-foreground">Manage Your Expenses</p>
        </div>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by invoice number, description or amount..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="mb-4 px-4 py-2 border rounded w-full focus:outline-orange-500"
      />

      {/* Tabs */}
      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setActiveTab("invoiceAbsent")}
          className={`px-4 py-2 rounded ${
            activeTab === "invoiceAbsent"
              ? "bg-black text-white"
              : "bg-gray-200"
          }`}
        >
          Invoice Absent
        </button>
        <button
          onClick={() => setActiveTab("crmNotAdded")}
          className={`px-4 py-2 rounded ${
            activeTab === "crmNotAdded" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          CRM Not Added
        </button>
        <button
          onClick={() => setActiveTab("crmAdded")}
          className={`px-4 py-2 rounded ${
            activeTab === "crmAdded" ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          CRM Added
        </button>
      </div>

      {/* Scrollable Tab Content */}
      <div className="flex-1 overflow-y-auto pr-2">
        {renderList(getCurrentList())}
      </div>

      {/* 🔹 Modal for Add Invoice */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Add Invoice</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invoice File (PDF/Image)
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(e) => setInvoiceFile(e.target.files[0])}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full border rounded p-2"
                />
              </div>

              {/* 🔹 Error Message */}
              {formError && (
                <p className="text-red-500 text-sm mt-2">{formError}</p>
              )}

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-black text-white"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoiceAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="loader mb-4"></div>
            <p className="text-gray-700">Uploading Invoice, please wait...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
