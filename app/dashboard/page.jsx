"use client";
import React, { useState, useEffect, useMemo, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedLayout from "../../components/ProtectedLayout";
import { LMPatronContext } from "../context/LmPatronsContext";
import { TaskContext } from "../context/TaskContext";
import { db } from "../../firebasedata/config";
import { useGeminiGenerateTask } from "../../components/hooks/useGeminiGenerateTask";
import { useExtraOrdinaryScore } from "../../components/hooks/useExtraOrdinaryScore";
import { useValueScore } from "../../components/hooks/useValueScore";
import GeneratedTaskFormModal from "../../components/utils/GeneratedTaskFormModal";
import FullPageLoader from "../../components/utils/FullPageLoader";
import OnlineToggle from "../../components/utils/OnlineToggle";
import { gapi } from "../../components/constants";
import { format } from "date-fns";
import TaskCard from "../../components/utils/lmtaskcard";
import AiScoreLoader from "../../components/utils/AiScoreLoader";
import TaskCardShimmer from "../../components/utils/TaskCardsShimmer";
import {
  doc,
  collection,
  updateDoc,
  getDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import InfoNote from "../../components/utils/InfoNote";
import { timeStamp } from "console";

function DashboardContent({ userDetails, contexttasks, tasksLoading }) {
  const { lmpatrons } = useContext(LMPatronContext);

  const [selectedPatron, setSelectedPatron] = useState("all");
  const displayedName = userDetails?.display_name || "N/A";
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const { isLoading, aiTasks, error, generateTasks } =
    useGeminiGenerateTask(gapi);
  const { extraOrdinaryScore, generateExtraOrdinaryScore } =
    useExtraOrdinaryScore(gapi);
  const { valueScore, generateValueScore } = useValueScore(gapi);
  const [showModal, setShowModal] = useState(false);
  const [aiTaskQueue, setAiTaskQueue] = useState([]);
  const [currentDraggedTask, setCurrentDraggedTask] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [aiScoringLoading, setAiScoringLoading] = useState(false);

  const [extraOrdinaryScoreOrValueScore, setExtraOrdinaryScoreOrValueScore] =
    useState(null);

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

  const filteredTasks =
    selectedPatron === "all"
      ? contexttasks
      : contexttasks.filter((task) => task.patronId1 === selectedPatron);

  const groupedTasks = useMemo(() => {
    // Keep category keys in proper case
    const categories = {
      Created: [],
      "To be Started": [],
      "In Process": [],
      Completed: [],
    };

    filteredTasks.forEach((task) => {
      const status = (task.taskStatusCategory || "").toLowerCase();

      if (status === "created") {
        categories.Created.push(task);
      } else if (status === "to be started") {
        categories["To be Started"].push(task);
      } else if (status === "in process") {
        categories["In Process"].push(task);
      } else if (status === "completed") {
        categories.Completed.push(task);
      }
    });

    return categories;
  }, [filteredTasks]);

  const handleNoteSubmit = async () => {
    if (note.length === 0) {
      setWarningMessage("⚠️Note Not Be NULL");
      setShowWarning(true);
      return;
    }
    if (!pendingStatusUpdate || !draggedTask) return;
    if (!draggedTask.taskDueDate) {
      setWarningMessage("⚠️ Task DUE Date Is MISSING");
      setShowWarning(true);
      return;
    }

    function checkIfTaskDelayed(taskDueDate) {
      if (!(taskDueDate instanceof Timestamp)) return false; // safety check

      const dueDate = taskDueDate.toDate(); // convert Firestore Timestamp → JS Date
      const now = new Date();

      return now > dueDate;
    }
    const IsDelayed = checkIfTaskDelayed(draggedTask.taskDueDate);

    let scoredoc = {};
    if (extraOrdinaryScoreOrValueScore.isExtraodinary == true) {
      scoredoc = {
        extraOrdinaryScore:
          extraOrdinaryScoreOrValueScore?.extraOrdinaryScore || 5,
      };
    }
    if (extraOrdinaryScoreOrValueScore.isValue == true) {
      scoredoc = {
        valueScore: extraOrdinaryScoreOrValueScore?.valueScore || 15,
      };
    }
      const userRef=doc(db,"user",userDetails?.id)
    try {
      const docRef = doc(db, "createTaskCollection", draggedTask.id);
      const statusLowerCaseName = pendingStatusUpdate
        .toLowerCase()
        .replace(/\s+/g, "");

      await updateDoc(docRef, {
        taskStatusCategory: pendingStatusUpdate,
        [`${statusLowerCaseName}At`]: Timestamp.now(),
        [`${statusLowerCaseName}By`]: userDetails?.email,
        lastComment: note,
        isDelayed: IsDelayed,
        ...scoredoc,
      });

      const updatedDocSnap = await getDoc(docRef);

      if (updatedDocSnap.exists()) {
        const commentDocRef = collection(docRef, "commentsThread");
        const commentDoc = {
          comment_text: note,
          isTaskUpdated: true,
          commentedBy: userDetails?.email,
          commentedAt: Timestamp.now(),
          comment_owner_name: userDetails?.display_name || userDetails?.email,
          comment_owner_img: userDetails?.photo_url || "",
          commentDate: Timestamp.now(),
          isUpdate: true,
          taskStatusCategory: pendingStatusUpdate,
          taskRef: docRef,
          timeStamp:Timestamp.now(),
          comment_owner_ref:userRef || ""

        };

        await addDoc(commentDocRef, commentDoc);
      } else {
        console.error("Document not found after update.");
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === draggedTask.id
            ? { ...task, taskStatusCategory: pendingStatusUpdate }
            : task
        )
      );
      setDraggedTask(null);
      setPendingStatusUpdate(null);
      setShowNoteModal(false);
      setNote("");
      setExtraOrdinaryScoreOrValueScore(null);
    } catch (error) {
      console.error("Error updating task status:", error.message);
    }

    // Cleanup
  };

  const handleNoteCancel = () => {
    setShowNoteModal(false);
    setPendingStatusUpdate(null);
    setNote("");
    setDraggedTask(null);
    setExtraOrdinaryScoreOrValueScore(null);
  };

  const handleDrop = async (newStatusRaw) => {
    if (!draggedTask) return;

    const currentStatus = (draggedTask.taskStatusCategory || "").toLowerCase();
    const newStatus = (newStatusRaw || "").toLowerCase();

    if (currentStatus === newStatus) return;

    if (newStatus === "created") {
      setWarningMessage(
        "⚠️ You cannot change the task back to Created after it’s set to In Process, To Be Started, or Completed."
      );
      setShowWarning(true);
      return;
    }

    if (newStatus === "completed" && currentStatus === "to be started") {
      setWarningMessage(
        "⚠️ You cannot change the task from To Be Started to Completed."
      );
      setShowWarning(true);
      return;
    }

    const fromCreatedToInvalid =
      currentStatus === "created" &&
      (newStatus === "in process" || newStatus === "completed");

    if (fromCreatedToInvalid) {
      setWarningMessage(
        "⚠️ You can't move a task directly from Created to In Process or Completed."
      );
      setShowWarning(true);
      return;
    }

    setAiScoringLoading(true);

    try {
      if (currentStatus === "to be started" && newStatus === "in process") {
        const score = await generateExtraOrdinaryScore(draggedTask);

        setExtraOrdinaryScoreOrValueScore({
          extraOrdinaryScore: score,
          isExtraodinary: true,
        });
      }

      if (currentStatus === "in process" && newStatus === "completed") {
        const score = await generateValueScore(draggedTask);
        setExtraOrdinaryScoreOrValueScore({
          valueScore: score,
          isValue: true,
        });
      }
    } catch (err) {
      console.error("AI Scoring Error:", err);
    } finally {
      setAiScoringLoading(false);
    }

    if (draggedTask.taskInput && currentStatus === "created") {
      const generated = await generateTasks(draggedTask.taskInput);

      if (generated && generated.length > 0) {
        setCurrentDraggedTask(draggedTask);
        setAiTaskQueue(generated);
        setShowModal(true);
        return;
      } else {
        setCurrentDraggedTask(null);
        setWarningMessage("No tasks generated by AI");
        setShowWarning(true);
        return;
      }
    }

    setPendingStatusUpdate(newStatusRaw); // keep original case for backend if needed
    setShowNoteModal(true);
  };

  const HandelGenerateTaskModelCancel = () => {
    setShowModal(false);
    setAiTaskQueue([]);
    setCurrentDraggedTask(null);
  };

  const HandelGenerateTaskModelSubmit = async (
    formData,
    index,
    setSubmissionStatus,
    markFirstSubmitted
  ) => {
    try {
      const patrondata = lmpatrons.filter(
        (p) => p.id == draggedTask?.patronRef?.id
      );

      if (!patrondata || patrondata.length === 0) {
        throw new Error("Patron not found");
      }

      const taskId = generateTaskId(
        formData.taskCategory,
        patrondata[0].newPatronName,
        formData.taskSubCategory
      );

      const baseTaskFields = {
        backupLmRef: patrondata[0].backupLmRef || "",
        backupLmName: patrondata[0].backupLmName || "",
        isAdminApproved: false,
        isCockpitTaskCreated: false,
        isCreatedBySpecialLM: false,
        isCuratorTask: false,
        isDelayed: false,
        lastComment: "To be Started",
        newPatronID: patrondata[0].newPatronID || "",
        newPatronName: patrondata[0].newPatronName || "",
        patronAddress:
          patrondata[0].addressLine1 +
            patrondata[0].addressLine2 +
            patrondata[0].landmark +
            patrondata[0].city +
            patrondata[0].landmark +
            patrondata[0].state +
            patrondata[0].pinCode || "",
        patronCity: patrondata[0].city || "",
        taskOwner: userDetails?.display_name || "",
        billingModel: "Billable",
        taskID: taskId,
        tobeStartedAt: Timestamp.now(),
        tobeStartedBy: userDetails?.email,
      };

      if (index === 0) {
        const enrichedFormData = {
          ...baseTaskFields,
          ...formData,
        };

        const docRef = doc(db, "createTaskCollection", draggedTask.id);
        await updateDoc(docRef, enrichedFormData);
        setTasks((prev) =>
          prev.map((task) =>
            task.id === draggedTask.id ? { ...task, ...enrichedFormData } : task
          )
        );
        setSubmissionStatus((prev) => ({ ...prev, [index]: "success" }));
        markFirstSubmitted?.();
      } else {
        const { id, patronId1, ...restDraggedTask } = draggedTask;
        const newTaskData = {
          ...restDraggedTask,
          ...baseTaskFields,
          ...formData,
        };
        const docRef = await addDoc(
          collection(db, "createTaskCollection"),
          newTaskData
        );
        setTasks((prev) => [...prev, { id: docRef.id, ...newTaskData }]);
        setSubmissionStatus((prev) => ({ ...prev, [index]: "success" }));
      }
    } catch (error) {
      console.error("Error in form submission:", error.message);
      setSubmissionStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  };
  const content = {
  "Online/Offline Toggle": "Set Online when you’re available to chat with patrons.",
  "Chat Availability": "Make sure you’re logged in before starting a chat.",
  "Patron Search": "Select a patron from the dropdown to view that patron’s tasks.",
  "Task Board": "Drag and drop a task to update its status.",
  "Status Order": "Follow this sequence: Created → To Be Started → In Progress → Completed (don’t skip steps)."
};


  return (
    <div className="p-6">
      {isLoading && <FullPageLoader />}
      {aiScoringLoading && <AiScoreLoader />}

      <div className="fixed top-4 right-4 z-50">
        <InfoNote content={content}></InfoNote>
        <OnlineToggle userId={userDetails?.id} />
      </div>

      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-semibold">
          Welcome: <span className="text-orange-600">{displayedName}</span>
        </h1>
      </div>

      <select
        className="mb-6 block w-full max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        value={selectedPatron}
        onChange={(e) => setSelectedPatron(e.target.value)}
      >
        <option value="all" className="text-gray-600">
          All Patrons
        </option>
        {lmpatrons.map((patron) => (
          <option key={patron.id} value={patron.id}>
            {patron.patronName}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Object.entries(groupedTasks).map(([status, taskList]) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className={`
            flex flex-col rounded-2xl shadow-md h-[80vh] p-4
            ${
              status === "Completed"
                ? "bg-green-50 border-l-4 border-green-500"
                : status === "In Process"
                ? "bg-orange-50 border-l-4 border-orange-400"
                : status === "Created"
                ? "bg-blue-50 border-l-4 border-blue-500"
                : status === "To be Started"
                ? "bg-yellow-50 border-l-4 border-yellow-500"
                : status === "to be started"
                ? "bg-blue-50 border-l-4 border-blue-500"
                : "bg-gray-50 border-l-4 border-gray-400"
            }
          `}
          >
            <h2 className="text-lg font-bold mb-3 text-gray-700 flex items-center gap-2 whitespace-nowrap">
              {/* Main status */}
              {status} {/* Count */}
              <span className="text-sm text-gray-500">({taskList.length})</span>
              {/* Arrow and next status */}
              {status !== "Completed" && (
                <span className="flex flex-col items-center text-gray-400 -mt-1">
                  <span className="text-[9px] leading-none text-orange-500">
                    Drag To Update
                  </span>
                  <ArrowRight className="w-12 h-4" />
                </span>
              )}
            </h2>

            <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar space-y-2">
              {tasksLoading ? (
                <TaskCardShimmer />
              ) : (
                taskList.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTask(task)}
                    className="cursor-move"
                  >
                    <TaskCard task={task} />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <GeneratedTaskFormModal
        isOpen={showModal}
        aiTasks={aiTaskQueue}
        draggedTask={currentDraggedTask}
        onClose={HandelGenerateTaskModelCancel}
        onFormSubmit={HandelGenerateTaskModelSubmit}
      />
      {showWarning && (
        <div className="fixed top-5 right-5 z-50 w-72 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg shadow-md p-4">
          <div className="mb-3 text-sm font-medium">{warningMessage}</div>
          <button
            onClick={() => setShowWarning(false)}
            className="px-3 py-1 bg-yellow-800 text-white text-sm rounded hover:bg-yellow-700 transition"
          >
            OK
          </button>
        </div>
      )}

      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
            <h2>
              You are Changing Task Status from{" "}
              <b className="text-orange-500">
                {draggedTask?.taskStatusCategory}
              </b>{" "}
              to <b className="text-orange-500">{pendingStatusUpdate}</b>
            </h2>
            <h2 className="text-lg font-bold mb-2">Add a note before moving</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              rows={4}
              placeholder="Enter your note here..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleNoteCancel}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleNoteSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { userDetails } = useAuth();
  const { contexttasks, tasksLoading } = useContext(TaskContext);

  return (
    <ProtectedLayout>
      <DashboardContent
        userDetails={userDetails}
        contexttasks={contexttasks}
        tasksLoading={tasksLoading}
      />
    </ProtectedLayout>
  );
}
