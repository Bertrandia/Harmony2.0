"use client";

import React, { useContext, useState, useMemo } from "react";
import { LMPatronContext } from "../context/LmPatronsContext";
import PatronCard from "../../components/utils/PatronCard";
import { useGenerateEODReport } from "../../components/hooks/useGenerateEODReport";
import { gapi } from "../../components/constants";
import { useGeminiGenerateTask } from "../../components/hooks/useGeminiGenerateTask";
import { useGeminiGenerateTaskWithImage } from "../../components/hooks/useGeminiGenerateTaskWithImage";
import { useAuth } from "../../app/context/AuthContext";
import FullPageLoader from "@/components/utils/FullPageLoader";
import EODModal from "../../components/utils/EODModal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import GeneratedTaskFormModal from "@/components/utils/GeneratedTaskFormModal";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import { format } from "date-fns";
import PatronShimmer from "../../components/utils/PatronShimmer";
import { useRouter } from "next/navigation";
import { TaskContext } from "../context/TaskContext";

const Page = () => {
  const { lmpatrons } = useContext(LMPatronContext);
  const { contexttasks, tasksLoading } = useContext(TaskContext);
  const router = useRouter();
  const { userDetails } = useAuth();
  const { generateEODReport } = useGenerateEODReport();
  const { isLoading, generateTasks } = useGeminiGenerateTask(gapi);
  const { isImageLoading, generateTasksFromImage } =
    useGeminiGenerateTaskWithImage(gapi);

  const [aishowModal, setAiShowModal] = useState(false);
  const [aiTaskQueue, setAiTaskQueue] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState(null);
  const [searchText, setSearchText] = useState("");

  // Create Task popup state
  const [showTaskPopup, setShowTaskPopup] = useState(false);
  const [AiShowTaskPopup, setAiShowTaskPopup] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [taskPatron, setTaskPatron] = useState(null);
  const [taskError, setTaskError] = useState("");
  const [taskImage, setTaskImage] = useState(null); // <-- NEW STATE for error

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

  // Utility: Convert File -> Base64
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = () => {
        // Remove the "data:image/png;base64," prefix
        const base64String = reader.result.split(",")[1];
        resolve(base64String);
      };

      reader.onerror = (error) => reject(error);
    });
  };

  const handleOpenModal = (patron) => {
    setSelectedPatron(patron);
    setShowModal(true);
  };

  const handleCreateTask = (patrondata) => {
    setTaskPatron(patrondata);
    setTaskError("");
    setShowTaskPopup(true);
  };

  const handleCreateTaskWithImage = (patrondata) => {
    setTaskPatron(patrondata);
    setTaskError("");
    setAiShowTaskPopup(true);
  };

  const handelAlltasks = (patrondata) => {
    router.push(`/mytasks?id=${patrondata.id}`);
  };

  const handelAllExpenses = (patrondata) => {
    console.log("aE", patrondata.patronName || "na");
  };

  const handelCancelTask = () => {
    setTaskInput("");
    setTaskError("");
    setShowTaskPopup(false);
    setAiShowTaskPopup(false);
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

  const handleConfirmGenerate = async (fields) => {
    if (!selectedPatron) return;

    let todaysExpense = 0;
    let mtdExpense = 0;
    let advanceLeftAmout = 0;

    const summary = {};
    const patronRef = doc(db, "addPatronDetails", selectedPatron.id);

    const now = new Date();
    const todaysDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ); // Today at 00:00:00

    // Filter tasks for selected patron
    const patronTasks = contexttasks.filter(
      (task) => task.patronRef?.id === selectedPatron.id && !task.isTaskDisabled
    );

    const startedTasks = patronTasks.filter(
      (task) => task.taskStatusCategory === "To be Started"
    );

    const inProcessTasks = patronTasks.filter(
      (task) => task.taskStatusCategory === "In Process"
    );

    // Completed Today
    const completedTasks = patronTasks.filter((task) => {
      if (
        task?.taskStatusCategory !== "Completed" ||
        !task?.taskCompletedDate
      ) {
        return false;
      }

      const completedDate = task.taskCompletedDate.toDate(); // ✅ FIXED
      return completedDate >= todaysDate;
    });

    // Combine all tasks for report
    const tasks = [...startedTasks, ...inProcessTasks, ...completedTasks].sort(
      (a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return aDate - bDate; // Ascending order
      }
    );

    if (fields.allTasksNum) {
      const totalTasksNumber = contexttasks.filter(
        (t) =>
          t.patronRef?.id === patronRef?.id &&
          t?.taskStatusCategory !== "Cancelled" &&
          t?.isTaskDisabled === false
      ).length;

      summary.allTasksNum = totalTasksNumber;
    }

    if (fields.budgertLeft) {
      const q = query(
        collection(db, "mainNewApprovalManagement"),
        where("patronRef", "==", patronRef),
        where("approvalStatus", "==", "Approved"),
        limit(1)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        advanceLeftAmout = parseFloat(data.budgetLeft) || 0;
        summary.budgertLeft = advanceLeftAmout;
      } else {
        advanceLeftAmout = 0;
      }
    }

    if (fields.lmInvoicesExpense) {
      const q = query(
        collection(db, "LMInvoices"),
        where("patronRef", "==", patronRef),
        where("isDisabled", "==", false),
        where("isInvoiceAdded", "==", true)
      );
      const snap = await getDocs(q);

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      let i = 0;
      snap.forEach((docSnap) => {
        const data = docSnap.data();

        const amount = parseFloat(data.invoiceAmount) || 0;
        const date = data.createdAt?.toDate?.() || null;

        if (date) {
          if (fields.todaysExpense) {
            if (date >= todayStart) todaysExpense += amount;
          }

          if (fields.mtdExpense) {
            if (date >= monthStart) mtdExpense += amount;
          }
        }
      });
    }

    if (!fields.lmInvoicesExpense) {
      const q = query(
        collection(db, "crmExpenseApproval"),
        where("patronRef", "==", patronRef),
        where("approvalStatus", "==", "financeApproved")
      );
      const snap = await getDocs(q);

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      snap.forEach((docSnap) => {
        const data = docSnap.data();

        const amount = parseFloat(data.totalAmount) || 0;
        const date = data.createdAt?.toDate?.() || null;

        if (date) {
          if (fields.todaysExpense) {
            if (date >= todayStart) todaysExpense += amount;
          }

          if (fields.mtdExpense) {
            if (date >= monthStart) mtdExpense += amount;
          }
        }
      });
    }

    if (fields.mtdExpense) {
      summary.mtdExpense = mtdExpense;
    }
    if (fields.todaysExpense) {
      summary.todaysExpense = todaysExpense;
    }

    generateEODReport(summary, tasks, selectedPatron);
    setShowModal(false);
  };

  const handleCreateTaskInput = async () => {
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

  const handleCreateTaskWithImageToGenerateTasks = async () => {
    if (!taskImage) {
      setTaskError("⚠️ Please add an image.");
      return;
    }

    try {
      setTaskError(""); // clear error

      // Convert to base64
      const base64Image = await convertImageToBase64(taskImage);

      const generated = await generateTasksFromImage(base64Image);
      if (generated && generated.length > 0) {
        setAiTaskQueue(generated);
        setAiShowModal(true);
        setAiShowTaskPopup(false);
        setTaskImage(null);
      } else {
        setTaskError(
          "No tasks generated. Please provide a proper Image to generate tasks."
        );
      }
    } catch (err) {
      console.error("Image conversion failed:", err);
      setTaskError("Failed to process image. Try again.");
    }
  };

  const handelGenerateTaskCancel = () => {
    setAiShowModal(false);
    setAiTaskQueue([]);
    setTaskInput("");
    setTaskImage(null);
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
        assignedLMName: patrondata?.assignedLM || "",
        createdAt: Timestamp.now(),
        createdBy: userDetails.email,
        createdById: userDetails.id,
        isTaskDisabled: false,
        lmRef: lmRef,
        partonName: patrondata?.newPatronName || patrondata?.patronName || "",
        patronID: patrondata.id,
        patronRef: patronRef,
        taskAssignDate: Timestamp.now(),
        taskInput: taskInput,
      };

      const enrichedFormData = {
        ...baseTaskFields,
        ...formData,
      };

      const docRef = await addDoc(
        collection(db, "createTaskCollection"),
        enrichedFormData
      );

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
    return [1, 2, 3, 4, 5].map((index) => {
      return <PatronShimmer key={index}></PatronShimmer>;
    });
  }

  return (
    <div className="p-4">
      {(isLoading || isImageLoading) && <FullPageLoader />}

      <div className="mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Patrons
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your personal and service requests
          </p>
        </div>
      </div>
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
            handelCreateTask={handleCreateTask}
            handelAlltasks={handelAlltasks}
            handelAllExpenses={handelAllExpenses}
            handelCreateTaskWithImage={handleCreateTaskWithImage}
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
            <textarea
              placeholder="Enter Task Input"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              rows={4}
              className="w-full mb-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-y"
            />

            {taskError && (
              <p className="text-red-600 text-sm mb-3">{taskError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handelCancelTask}>
                Cancel
              </Button>
              <Button onClick={handleCreateTaskInput}>
                Generate Task With AI
              </Button>
            </div>
          </div>
        </div>
      )}

      {AiShowTaskPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-lg font-semibold mb-4">
              Create Task for {taskPatron?.patronName}
            </h2>

            {/* Image Upload */}
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 text-gray-400 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9V17a3 3 0 11-6 0H9a3 3 0 01-2-5.291"
                />
              </svg>
              <span className="text-sm text-gray-500">
                Click to upload image
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setTaskImage(e.target.files[0]); // save file in state
                  }
                }}
              />
            </label>

            {/* Show selected file name + remove option */}
            {taskImage && (
              <div className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md mb-3">
                <span className="text-sm text-gray-700 truncate max-w-[70%]">
                  {taskImage.name}
                </span>
                <button
                  onClick={() => setTaskImage(null)}
                  className="text-red-500 text-xs font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {taskError && (
              <p className="text-red-600 text-sm mb-3">{taskError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handelCancelTask}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTaskWithImageToGenerateTasks}
                disabled={!taskImage} // prevent submit if no image
              >
                Generate Task With AI
              </Button>
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
