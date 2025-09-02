"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import { useRouter } from "next/navigation";
import PatronShimmer from "@/components/utils/PatronShimmer";

const Page = () => {
  const router = useRouter();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const q = query(
          collection(db, "LMInvoices"),
          where("isExpenseAdded", "==", false),
          where("isInvoiceAdded", "==", true),
          where("isDisabled", "==", false)
        );
        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return "N/A";
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleString(); // readable format
    }
    return "Invalid date";
  };

  // Filter invoices by lmName or newPatronName
  const filteredInvoices = invoices.filter((inv) => {
    const query = searchQuery.toLowerCase();
    return (
      inv.lmName?.toLowerCase().includes(query) ||
      inv.newPatronName?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return [1, 2, 3, 4, 5].map((index) => {
      return <PatronShimmer key={index}></PatronShimmer>;
    });
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">All LM Invoices</h1>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by LM Name or Patron Name"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 mb-6 border rounded shadow-sm"
      />

      {filteredInvoices.length === 0 ? (
        <p>No invoices found</p>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-md p-6 border hover:shadow-lg transition"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {invoice.lmName || "N/A"}
                  <span className="text-gray-500 text-sm ml-2">
                    (Patron:{" "}
                    {invoice.newPatronName || invoice.patronName || "N/A"})
                  </span>
                </h2>
                <span className="text-xs text-gray-400">
                  {formatDate(invoice.createdAt)}
                </span>
              </div>

              {/* Task Section */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mt-1">
                  TaskID: {invoice.taskID || "No description provided"}
                </p>
                <p className="text-sm font-medium text-gray-700">
                  Task Subject: {invoice.taskSubject || "N/A"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Description:{" "}
                  {invoice.taskDescription || "No description provided"}
                </p>
              </div>

              {/* Invoice Details */}
              <div className="text-sm text-gray-700 space-y-1 mb-4">
                <p>
                  <span className="font-medium">Invoice DocID:</span>{" "}
                  {invoice.id}
                </p>
                <p>
                  <span className="font-medium">Payment Mode:</span>{" "}
                  {invoice.paymentMode || "N/A"}
                </p>
              </div>

              {/* Button Row */}
              <div className="flex justify-end">
                {/* <button
                 disabled={true}
                  onClick={() =>
                    router.push(`/addexpenselongform/${invoice.id}`)
                  }
                  className="px-5 py-2 bg-gray-600 text-orange-600 text-sm rounded-lg shadow hover:bg-gray-700"
                >
                  Add Expense
                </button> */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;
