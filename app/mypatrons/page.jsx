"use client";

import React, { useContext, useState, useMemo } from "react";
import { LMPatronContext } from "../context/LmPatronsContext";
import PatronCard from "../../components/utils/PatronCard";
import { useGenerateEODReport } from "../../components/hooks/useGenerateEODReport";
import { gapi } from "../../components/constants";
import { useGeminiGenerateTask } from "../../components/hooks/useGeminiGenerateTask";
import { useAuth } from "../../app/context/AuthContext";
import FullPageLoader from "@/components/utils/FullPageLoader";
import EODModal from "../../components/utils/EODModal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import GeneratedTaskFormModal from "@/components/utils/GeneratedTaskFormModal";
import { addDoc, collection, doc, Timestamp } from "firebase/firestore";
import { db } from "@/firebasedata/config";
import { format } from "date-fns";
import  PatronShimmer from '../../components/utils/PatronShimmer'



const Page = () => {
  const { lmpatrons } = useContext(LMPatronContext);
  const { userDetails } = useAuth();
  const { generateEODReport } = useGenerateEODReport();
  const { isLoading, aiTasks, error, generateTasks } =
    useGeminiGenerateTask(gapi);

  const [aishowModal, setAiShowModal] = useState(false);
  const [aiTaskQueue, setAiTaskQueue] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Create Task popup state
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [taskPatron, setTaskPatron] = useState(null);
  const [taskError, setTaskError] = useState(""); // <-- NEW STATE for error

  function generateTaskId(taskCategory, patronName, subCategory) {
    // --- Patron Name Code ---
    let nameCode = "";
    if (patronName) {
      nameCode =
        patronName.length >= 3
          ? patronName[0].toUpperCase() + patronName.slice(-2).toUpperCase()
          : patronName.toUpperCase();
    }

    // --- Task Category Code ---
    let categoryCode = "UNK";
    if (taskCategory) {
      categoryCode =
        taskCategory.length >= 3
          ? taskCategory.substring(0, 3).toUpperCase()
          : taskCategory.toUpperCase();
    }

    // --- Subcategory Code ---
    let subCategoryCode = "";
    if (subCategory) {
      subCategoryCode =
        subCategory.length >= 2
          ? subCategory.substring(0, 2).toUpperCase()
          : subCategory.toUpperCase();
    }

    // --- Date & Time Codes ---
    const dateCode = format(new Date(), "ddMMyy");
    const timeCode = format(new Date(), "HHmmss");

    // --- Final Task ID ---
    const taskId = `${nameCode}${categoryCode}${dateCode}${timeCode}${subCategoryCode}`;
    return taskId;
  }

  const handleOpenModal = (patron) => {
    setSelectedPatron(patron);
    setShowModal(true);
  };

  const handelCreateTask = (patrondata) => {
    setTaskPatron(patrondata);
    setTaskError("");
    setShowTaskPopup(true);
  };

  const handelAlltasks = (patrondata) => {
    console.log("at", patrondata.patronName || "na");
  };

  const handelAllExpenses = (patrondata) => {
    console.log("aE", patrondata.patronName || "na");
  };

  const handleCancelTask = () => {
    setTaskInput("");
    setTaskError("");
    setShowTaskPopup(false);
  };

  // Always return dummy single task (since no patron.tasks)
  const buildTasksForPatron = (patron) => [
    {
      details: patron?.name ?? "Task subject",
      update: "To be started",
      status: "Pending",
      dueDate: "26-09-2025",
    },
  ];

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

  const handleCreateTask = async () => {
    if (!taskInput.trim()) {
      setTaskError("⚠️ Please enter a valid task input.");
      return;
    }

    try {
      setTaskError(""); // clear error

      const generated = await generateTasks(taskInput);

      if (generated && generated.length > 0) {
        setAiTaskQueue(generated);
        setAiShowModal(true);
        setShowTaskPopup(false);
      } else {
        setTaskError(
          "No tasks generated. Please provide a proper input to generate tasks."
        );
      }
    } catch (err) {
      console.error("Error while generating task:", err);
      setTaskError(
        "Something went wrong while generating tasks. Please try again."
      );
    }
  };

  const handelGenerateTaskCancel = () => {
    setAiShowModal(false);
    setAiTaskQueue([]);
    setTaskInput("");
    setTaskPatron(null);
  };

  const handelGenerateTaskSubmit = async (
    formData,
    index,
    setSubmissionStatus,
    markFirstSubmitted
  ) => {
    try {
      const patrondata = taskPatron;

      // Guard: Required fields check
      if (
        !patrondata?.id ||
        !formData?.taskCategory ||
        !formData?.taskSubCategory
      ) {
        throw new Error("Missing required fields for task creation.");
      }

      // Guard: userDetails check
      if (
        !userDetails?.id ||
        !userDetails?.email ||
        !userDetails?.display_name
      ) {
        throw new Error("Missing required user details for task creation.");
      }

      const taskId = generateTaskId(
        formData.taskCategory,
        patrondata.newPatronName,
        formData.taskSubCategory
      );

      const patronRef = doc(db, "addPatronDetails", patrondata.id);
      const lmRef = doc(db, "user", userDetails.id);

      const fullAddress = [
        patrondata?.addressLine1,
        patrondata?.addressLine2,
        patrondata?.landmark,
        patrondata?.city,
        patrondata?.state,
        patrondata?.pinCode,
      ]
        .filter(Boolean)
        .join(", ");

      const baseTaskFields = {
        backupLmRef: patrondata?.backupLmRef || "",
        backupLmName: patrondata?.backupLmName || "",
        isAdminApproved: false,
        isCockpitTaskCreated: false,
        isCreatedBySpecialLM: false,
        isCuratorTask: false,
        isDelayed: false,
        lastComment: "To be Started",
        newPatronID: patrondata?.newPatronID || "",
        newPatronName: patrondata?.newPatronName || "",
        patronAddress: fullAddress,
        patronCity: patrondata?.city || "",
        taskOwner: userDetails.display_name,
        billingModel: "Billable",
        taskID: taskId,
        tobeStartedAt: Timestamp.now(),
        tobeStartedBy: userDetails.email,
        assignedLmName: patrondata?.assignedLM || "",
        createdAt: Timestamp.now(),
        createdBy: userDetails.email,
        createdById: userDetails.id,
        isTasDisabled: false,
        lmRef: lmRef,
        patronName: patrondata?.newPatronName || patrondata?.patronName || "",
        patronID: patrondata.id,
        patronRef: patronRef,
        taskAssignDate: Timestamp.now(),
        taskInput: taskInput,
      };

      const enrichedFormData = {
        ...baseTaskFields,
        ...formData,
      };

      console.log(enrichedFormData);

      // const docRef = await addDoc(
      //   collection(db, "createTaskCollection"),
      //   enrichedFormData
      // );

      if (index === 0) {
        setSubmissionStatus((prev) => ({
          ...prev,
          [index]: "success",
        }));

        markFirstSubmitted?.();
      } else {
        setSubmissionStatus((prev) => ({
          ...prev,
          [index]: "success",
        }));
      }
    } catch (error) {
      console.error("Error in form submission:", error?.message || error);
      setSubmissionStatus((prev) => ({
        ...prev,
        [index]: "error",
      }));
    }
  };

  const filteredPatrons = useMemo(() => {
    if (!searchText.trim()) return lmpatrons || [];
    return (lmpatrons || []).filter((p) =>
      p.patronName.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, lmpatrons]);

 if (!lmpatrons || lmpatrons.length === 0) {
  return (
    [1,2,3,4,5].map((index)=>{
      return (
          <PatronShimmer key={index}></PatronShimmer>
      )
    })
  );
}

  return (
    <div className="p-4">
      {isLoading && <FullPageLoader />}

      {/* Search Bar */}
      <div className="mb-4 w-full max-w relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search patrons..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patron Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatrons?.map((patron) => (
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

      {/* EOD Modal */}
      <EODModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirmGenerate}
        patron={selectedPatron}
      />

      {/* Create Task Popup */}
      {showTaskPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              Create Task for {taskPatron?.patronName}
            </h2>
            <Input
              placeholder="Enter Task Input"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              className="mb-2"
            />
            {taskError && (
              <p className="text-red-600 text-sm mb-3">{taskError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelTask}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>Generate Task With Ai</Button>
            </div>
          </div>
        </div>
      )}

      <GeneratedTaskFormModal
        isOpen={aishowModal}
        aiTasks={aiTaskQueue}
        onClose={handelGenerateTaskCancel}
        onFormSubmit={handelGenerateTaskSubmit}
      />
    </div>
  );
};

export default Page;
