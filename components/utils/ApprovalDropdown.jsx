import React, { useState } from "react";

const ApprovalDropdown = ({ approvalIds, approvalId, setApprovalId ,setApprovalDocId}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApprovals = approvalIds.filter((doc) =>
    doc.ApprovalID.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id,docId) => {
    setApprovalId(id);
    setApprovalDocId(docId)
    setDropdownOpen(false);
    setSearchTerm(""); // clear after select
  };

  return (
    <div className="mb-4 relative">
      <label className="block mb-1 font-medium">Select Approval</label>

      {/* Dropdown toggle */}
      <div
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer bg-white"
      >
        {approvalId ? `Selected: ${approvalId}` : "Select Approval ID"}
      </div>

      {/* Dropdown panel */}
      {dropdownOpen && (
        <div className="absolute w-full z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
          {/* Search input */}
          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search by Approval ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
            />
          </div>

          {/* Approval "cards" */}
          {filteredApprovals.length > 0 ? (
            filteredApprovals.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  handleSelect(doc.ApprovalID,doc.id)
                  
                }}
                className="cursor-pointer p-3 border-b hover:bg-gray-50"
              >
                <div className="font-semibold text-blue-800">
                  {doc.ApprovalID}
                </div>
                <div className="text-sm text-gray-600">
                  Approved By: {doc.approvedBy}
                </div>
                <div className="text-sm text-gray-600">
                  Patron: {doc.patronName}
                </div>
                <div className="text-sm text-gray-600">
                  Budget Spent: ₹{Number(doc.budgetSpent).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Budget Left: ₹{Number(doc.budgetLeft).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">
                  Purchase Description: {doc.purchaseDescription}
                </div>
                <div className="text-sm text-gray-600">
                  Date of Submission:{" "}
                  {doc.dateOfSubmission?.toDate
                    ? doc.dateOfSubmission.toDate().toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "N/A"}
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ApprovalDropdown;
