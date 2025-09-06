"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import { useAuth } from "../../app/context/AuthContext";
import Lminvoiceshimmer from "@/components/utils/Lminvoiceshimmer";

const LMInvoicePage = () => {
  const { userDetails } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true); // show shimmer immediately
      if (!userDetails?.id) {
        setLoading(false);
        return;
      }

      const lmRef = doc(db, "user", userDetails.id);

      try {
        const q = query(
          collection(db, "LMInvoices"),
          where("isExpenseAdded", "==", false),
          where("isInvoiceAdded", "==", true),
          where("isDisabled", "==", false),
          where("lmRef", "==", lmRef)
        );

        const querySnapshot = await getDocs(q);

        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setInvoices(data);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        setLoading(false); // hide shimmer after fetch
      }
    };

    fetchInvoices();
  }, [userDetails?.id]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp instanceof Timestamp) return timestamp.toDate().toLocaleString();
    return "Invalid date";
  };

  const filteredInvoices = invoices.filter((inv) =>
    (inv.newPatronName || inv.patronName || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">All LM Invoices</h1>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Patron Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
      </div>

      {loading ? (
        // Shimmer while loading
        [1, 2, 3, 4, 5].map((i) => <Lminvoiceshimmer key={i} />)
      ) : !loading && invoices.length === 0 ? (
        // Show message if no invoices exist
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No invoices found</p>
        </div>
      ) : !loading && filteredInvoices.length === 0 ? (
        // Show message if search yields no result
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No matching invoices found</p>
          <p className="text-gray-400 text-sm mt-2">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        // Render invoices
        <div className="grid gap-6">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-white rounded-2xl shadow-md p-6 border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {invoice.lmName || "N/A"}
                  <span className="text-gray-500 text-sm ml-2 font-normal">
                    (Patron: {invoice.newPatronName || invoice.patronName || "N/A"})
                  </span>
                </h2>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {formatDate(invoice.createdAt)}
                </span>
              </div>

              {/* Task Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Task ID:</span> {invoice.taskID || "N/A"}
                </p>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  <span className="font-semibold">Subject:</span> {invoice.taskSubject || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {invoice.taskDescription || "No description provided"}
                </p>
              </div>

              {/* Invoice Details */}
              <div className="text-sm text-gray-700 space-y-2 mb-4">
                <p className="flex items-center">
                  <span className="font-medium text-gray-800 w-32">Invoice DocID:</span>
                  <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    {invoice.id}
                  </span>
                </p>
                <p className="flex items-center">
                  <span className="font-medium text-gray-800 w-32">Payment Mode:</span>
                  <span className="text-blue-600 font-medium">
                    {invoice.paymentMode || "N/A"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LMInvoicePage;
