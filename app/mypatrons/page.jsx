"use client";

import React, { useContext, useState } from "react";
import { LMPatronContext } from "../context/LmPatronsContext";
import PatronCard from "../../components/utils/PatronCard";
import { useGenerateEODReport } from "../../components/hooks/useGenerateEODReport";
import EODModal from "../../components/utils/EODModal";

const Page = () => {
  const { lmpatrons } = useContext(LMPatronContext);
  const { generateEODReport } = useGenerateEODReport();

  const [showModal, setShowModal] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState(null);

  const handleOpenModal = (patron) => {
    setSelectedPatron(patron);
    setShowModal(true);
  };

  const handelCreateTask = (patrondata) => {
    console.log("ct", patrondata.patronName || "na");
  };
  const handelAlltasks = (patrondata) => {
    console.log("at", patrondata.patronName || "na");
  };

  const handelAllExpenses = (patrondata) => {
    console.log("aE", patrondata.patronName || "na");
  };

  // Always return dummy single task (since no patron.tasks)
  const buildTasksForPatron = (patron) => {
    return [
      {
        details: patron?.name ?? "Task subject",
        update: "To be started",
        status: "Pending",
        dueDate: "26-09-2025",
      },
    ];
  };

  // Summary only includes fields user checked
  const handleConfirmGenerate = (fields) => {
    if (!selectedPatron) return;

    const summary = {};

    if (fields.allTasksNum) summary.allTasksNum = 1;
    if (fields.budgertLeft) summary.budgertLeft = 1000.0;
    if (fields.todaysExpense) summary.todaysExpense = 72.0;
    if (fields.mtdExpense) summary.mtdExpense = 22372.0;

    const tasks = buildTasksForPatron(selectedPatron);

    generateEODReport(summary, tasks, selectedPatron);
    setShowModal(false);
  };

  return (
    <div className="p-4">
      {/* Patron Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lmpatrons?.map((patron) => (
          <PatronCard
            key={patron.id}
            patrondata={patron}
            onGenerate={handleOpenModal}
            handelCreateTask={handelCreateTask}
            handelAlltasks={handelAlltasks}
            handelAllExpenses={handelAllExpenses}
          />
        ))}
      </div>

      {/* Modal */}
      <EODModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmGenerate}
        patron={selectedPatron}
      />
    </div>
  );
};

export default Page;
