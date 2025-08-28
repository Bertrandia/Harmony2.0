"use client";
import React, { useState, useEffect, useMemo, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import ProtectedLayout from "../../components/ProtectedLayout";
import { LMPatronProvider, LMPatronContext } from "../context/LmPatronsContext";
import { db } from "../../firebasedata/config";
import { useGeminiGenerateTask } from "../../components/hooks/useGeminiGenerateTask";
import GeneratedTaskFormModal from "../../components/utils/GeneratedTaskFormModal";
import FullPageLoader from "../../components/utils/FullPageLoader";
import OnlineToggle from "../../components/utils/OnlineToggle";
import { gapi } from "../../components/constants";
import { format } from "date-fns";
import TaskCard from "../../components/utils/lmtaskcard";
import {
  getDocs,
  doc,
  collection,
  where,
  query,
  updateDoc,
  getDoc,
  addDoc,
  Timestamp,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

function DashboardContent({ userDetails }) {
  const { lmpatrons } = useContext(LMPatronContext);
  const [selectedPatron, setSelectedPatron] = useState("all");
  const displayedName = userDetails?.display_name || "N/A";
  const [tasks, setTasks] = useState([]);
  const [draggedTask, setDraggedTask] = useState(null);
  const { isLoading, aiTasks, error, generateTasks } =
    useGeminiGenerateTask(gapi);
  const [showModal, setShowModal] = useState(false);
  const [aiTaskQueue, setAiTaskQueue] = useState([]);
  const [currentDraggedTask, setCurrentDraggedTask] = useState(null);
  const [warningMessage, setWarningMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [note, setNote] = useState("");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);

  useEffect(() => {
    if (!lmpatrons?.length) return;

    // Array to hold unsubscribe functions for each listener
    const unsubscribes = [];

    lmpatrons.forEach((patron) => {
      const patronRef = doc(db, "addPatronDetails", patron.id);

      const q = query(
        collection(db, "createTaskCollection"),
        where("patronRef", "==", patronRef),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const patronTasks = snapshot.docs.map((doc) => ({
            id: doc.id,
            patronId1: patron.id,
            ...doc.data(),
          }));

          // Update tasks state safely by merging tasks from all patrons
          setTasks((prevTasks) => {
            // Remove old tasks of this patron and add the new ones
            const otherTasks = prevTasks.filter(
              (task) => task.patronId1 !== patron.id
            );
            return [...otherTasks, ...patronTasks];
          });
        },
        (error) => {
          console.error("Error listening to tasks:", error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [lmpatrons]);

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
      ? tasks
      : tasks.filter((task) => task.patronId1 === selectedPatron);

  const groupedTasks = useMemo(() => {
    const categories = {
      Created: [],
      "To be Started": [],
      "In Process": [],
      Completed: [],
    };

    filteredTasks.forEach((task) => {
      const status = task.taskStatusCategory || "";
      if (categories[status]) {
        categories[status].push(task);
      }
    });

    Object.keys(categories).forEach((status) => {
      categories[status].sort((a, b) => {
        const aTime = a.createdAt?.toMillis
          ? a.createdAt.toMillis()
          : new Date(a.createdAt).getTime();
        const bTime = b.createdAt?.toMillis
          ? b.createdAt.toMillis()
          : new Date(b.createdAt).getTime();

        return bTime - aTime;
      });
    });

    return categories;
  }, [filteredTasks]);

  const handleNoteSubmit = async () => {
    if(note.length === 0) return;
    if (!pendingStatusUpdate || !draggedTask) return;

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
      });

      const updatedDocSnap = await getDoc(docRef);

      if (updatedDocSnap.exists()) {
        const commentDocRef = collection(docRef, "commentsThread");
        const commentDoc={
          comment_text: note,
          isTaskUpdated: true,
          commentedBy: userDetails?.email,
          commentedAt: Timestamp.now(),
          comment_owner_name: userDetails?.display_name || userDetails?.email,
          comment_owner_img: userDetails?.photo_url || "",
          commentDate: Timestamp.now(),
          isUpdate: true,   
          taskStatusCategory:pendingStatusUpdate,
          taskRef: docRef,
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
    } catch (error) {
      console.error("Error updating task status:", error.message);
    }

    // Cleanup
    setDraggedTask(null);
    setPendingStatusUpdate(null);
    setShowNoteModal(false);
    setNote("");
  };

  const handleNoteCancel = () => {
    setShowNoteModal(false);
    setPendingStatusUpdate(null);
    setNote("");
    setDraggedTask(null);
  };

  const handleDrop = async (newStatus) => {
    if (!draggedTask || draggedTask.taskStatusCategory === newStatus) return;
    if (newStatus === "Created") {
      setWarningMessage(
        "⚠️ You cannot change the task back to Created after it’s set to In Process, To Be Started, or Completed."
      );
      setShowWarning(true);
      return;
    }

    const fromCreatedToInvalid =
      draggedTask.taskStatusCategory === "Created" &&
      (newStatus === "In Process" || newStatus === "Completed");

    if (fromCreatedToInvalid) {
      setWarningMessage(
        "⚠️ You can't move a task directly from Created to In Process or Completed."
      );
      setShowWarning(true);
      return;
    }

    if (draggedTask.taskInput && draggedTask.taskStatusCategory === "Created") {
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

    setPendingStatusUpdate(newStatus);

    setShowNoteModal(true);
  };

  return (
    <div className="p-6">
      {isLoading && <FullPageLoader />}

      <div className="flex items-center mb-4">
        <h1 className="text-2xl font-semibold">
          Welcome: <span className="text-orange-600">{displayedName}</span>
          <OnlineToggle userId={userDetails?.id} />
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                : status === "To be Started"
                ? "bg-blue-50 border-l-4 border-blue-500"
                : "bg-gray-50 border-l-4 border-gray-400"
            }
          `}
          >
            <h2 className="text-lg font-bold mb-3 text-gray-700">
              {status}{" "}
              <span className="text-sm text-gray-500">({taskList.length})</span>
            </h2>

            <div className="flex-1 overflow-y-auto pr-1 hide-scrollbar space-y-2">
              {taskList.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedTask(task)}
                  className="cursor-move"
                >
                  <TaskCard task={task} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <GeneratedTaskFormModal
        isOpen={showModal}
        aiTasks={aiTaskQueue}
        draggedTask={currentDraggedTask}
        onClose={() => {
          setShowModal(false);
          setAiTaskQueue([]);
          setCurrentDraggedTask(null);
        }}
        onFormSubmit={async (
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
                ...formData,
                ...baseTaskFields,
              };
              const docRef = doc(db, "createTaskCollection", draggedTask.id);
              await updateDoc(docRef, enrichedFormData);
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === draggedTask.id
                    ? { ...task, ...enrichedFormData }
                    : task
                )
              );
              setSubmissionStatus((prev) => ({ ...prev, [index]: "success" }));
              markFirstSubmitted?.();
            } else {
              const { id, patronId1, ...restDraggedTask } = draggedTask;
              const newTaskData = {
                ...restDraggedTask,
                ...formData,
                ...baseTaskFields,
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
        }}
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

  return (
    <ProtectedLayout>
      <LMPatronProvider>
        <DashboardContent userDetails={userDetails} />
      </LMPatronProvider>
    </ProtectedLayout>
  );
}
