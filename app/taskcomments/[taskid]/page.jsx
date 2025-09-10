"use client";
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../app/context/AuthContext";
import { ChevronDown } from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  addDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import TaskCuratorSection from "../../../components/utils/TaskCuratorSection";
import { useGeminiGenerateTask } from "../../../components/hooks/useGeminiGenerateTask";
import { useExtraOrdinaryScore } from "../../../components/hooks/useExtraOrdinaryScore";
import { useValueScore } from "../../../components/hooks/useValueScore";
import { gapi } from "../../../components/constants";
import AiScoreLoader from "../../../components/utils/AiScoreLoader";
import { LMPatronContext } from "../../context/LmPatronsContext";
import GeneratedTaskFormModal from "@/components/utils/GeneratedTaskFormModal";
import { format } from "date-fns";
import Infonote from "../../../components/utils/InfoNote";
import FullPageLoader from "@/components/utils/FullPageLoader";

const Page = () => {
  const { taskid } = useParams();
  const { userDetails } = useAuth();
  const { lmpatrons } = useContext(LMPatronContext);
  const [taskdata, setTaskData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCuratorOpen, setIsCuratorOpen] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newStatusCategory, setNewStatusCategory] = useState("");
  const [note, setNote] = useState("");
  const { extraOrdinaryScore, generateExtraOrdinaryScore } =
    useExtraOrdinaryScore(gapi);
  const { valueScore, generateValueScore } = useValueScore(gapi);
  const { isLoading, aiTasks, error, generateTasks } =
    useGeminiGenerateTask(gapi);
  const [extraOrdinaryScoreOrValueScore, setExtraOrdinaryScoreOrValueScore] =
    useState(null);
  const [noteError, setNoteError] = useState("");
  const [aiScoringLoading, setAiScoringLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [aiTaskQueue, setAiTaskQueue] = useState([]);

  const fetchTask = async () => {
    try {
      const docRef = doc(db, "createTaskCollection", taskid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setTaskData({
          id: docSnap.id,
          ref: docSnap.ref,
          ...docSnap.data(),
        });
      } else {
        setTaskData(null);
      }
    } catch (error) {
      console.error("Error fetching task:", error);
      setTaskData(null);
    }
  };

  const getActionButtons = () => {
    const status = taskdata?.taskStatusCategory?.toLowerCase();

    switch (status) {
      case "to be started":
        return ["In Process", "Cancelled", "On Hold"];
      case "in process":
        return ["Completed", "Cancelled", "On Hold"];
      case "completed":
        return [];
      case "created":
        return ["To be Started", "Cancelled"];
      default:
        return [];
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "Created":
        return {
          bg: "bg-gray-100 dark:bg-gray-900",
          text: "text-gray-600 dark:text-gray-400",
        };
      case "To be Started":
        return {
          bg: "bg-pink-100 dark:bg-pink-900",
          text: "text-pink-600 dark:text-pink-400",
        };
      case "In Process":
        return {
          bg: "bg-blue-100 dark:bg-blue-900",
          text: "text-blue-600 dark:text-blue-400",
        };
      case "Completed":
        return {
          bg: "bg-green-100 dark:bg-green-900",
          text: "text-green-600 dark:text-green-400",
        };
      case "Cancelled":
        return {
          bg: "bg-red-100 dark:bg-red-900",
          text: "text-red-600 dark:text-red-400",
        };
      case "On Hold":
        return {
          bg: "bg-orange-100 dark:bg-orange-900",
          text: "text-orange-600 dark:text-orange-400",
        };
      case "Delayed":
        return {
          bg: "bg-yellow-100 dark:bg-yellow-900",
          text: "text-yellow-600 dark:text-yellow-400",
        };
      default:
        return { bg: "bg-muted dark:bg-muted", text: "text-muted-foreground" };
    }
  };
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
  // 🔹 Fetch task + stream comments
  useEffect(() => {
    if (!taskid) return;

    fetchTask();

    const commentsRef = collection(
      db,
      "createTaskCollection",
      taskid,
      "commentsThread"
    );

    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
      const commentsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      commentsData.sort((a, b) => {
        const timeA = a?.commentDate?.seconds
          ? a.commentDate.seconds * 1000
          : new Date(a?.commentDate).getTime();
        const timeB = b?.commentDate?.seconds
          ? b.commentDate.seconds * 1000
          : new Date(b?.commentDate).getTime();
        return timeB - timeA;
      });

      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [taskid]);

  // 🔹 Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setErrorMsg("Comment cannot be empty!");
      return;
    }
    const userRef = doc(db, "user", userDetails?.id);
    try {
      const commentsRef = collection(
        db,
        "createTaskCollection",
        taskid,
        "commentsThread"
      );

      const commentdoc = {
        comment_text: newComment.trim(),
        comment_owner_name: userDetails?.display_name,
        comment_owner_img: userDetails?.photo_url,
        commentDate: Timestamp.now(),
        isUpdate: true,
        taskStatusCategory: taskdata?.taskStatusCategory,
        taskRef: taskdata?.ref,
        isTaskUpdated: false,
        isFromPatron: false,
        isLM: true,
        commentRecipientId: taskdata?.patronID || taskdata?.patronRef?.id || "",
        isTaskStatusUpdate: false,
        timeStamp: Timestamp.now(),
        comment_owner_ref: userRef,
      };

      await addDoc(commentsRef, commentdoc);
      const docRef = doc(db, "createTaskCollection", taskid);
      await updateDoc(docRef, {
        lastComment: newComment.trim(),
        lastCommentTime: Timestamp.now(),
      });

      setNewComment("");
      setErrorMsg("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  if (!taskdata) return <div>Loading...</div>;

  const FeedbackHandel = async (feedbackdata) => {
    try {
      if (!feedbackdata?.taskId) {
        console.error("❌ No taskId provided");
        return;
      }

      const taskRef = doc(db, "createTaskCollection", feedbackdata.taskId);

      const finalUpdatedata = {
        curatorFeedBack: feedbackdata.feedback,
        curatorTaskRating: feedbackdata.rating,
        curatorTaskStatus: "Payment Due",
        taskVerifiedTimeByLm: Timestamp.now(),
      };

      await updateDoc(taskRef, finalUpdatedata);

      fetchTask();
    } catch (error) {
      console.error("🔥 Error updating task:", error.message);
    }
  };

  const handleNoteSubmit = async () => {
    if (note.length === 0) {
      setNoteError("Add note before submitting");
      return;
    }
    setNoteError("");
    if (!newStatusCategory || !taskdata) return;
    if (
      !taskdata.taskDueDate &&
      taskdata.taskStatusCategory.toLowerCase() !== "created"
    ) {
      return;
    }

    function checkIfTaskDelayed(taskDueDate) {
      if (!(taskDueDate instanceof Timestamp)) return false; // safety check

      const dueDate = taskDueDate.toDate(); // convert Firestore Timestamp → JS Date
      const now = new Date();

      return now > dueDate;
    }

    const IsDelayed = checkIfTaskDelayed(taskdata?.taskDueDate);

    let scoredoc = {};
    let completedDoc = {};
    if (extraOrdinaryScoreOrValueScore?.isExtraodinary == true) {
      scoredoc = {
        extraOrdinaryScore:
          extraOrdinaryScoreOrValueScore?.extraOrdinaryScore || 5,
      };
    }
    if (extraOrdinaryScoreOrValueScore?.isValue == true) {
      scoredoc = {
        valueScore: extraOrdinaryScoreOrValueScore?.valueScore || 15,
      };
    }

    if (newStatusCategory.toLowerCase() == "completed") {
      completedDoc = {
        taskCompletedDate: Timestamp.now(),
      };
    }

    try {
      const docRef = doc(db, "createTaskCollection", taskdata.id);
      const userRef = doc(db, "user", userDetails.id);
      const statusLowerCaseName = newStatusCategory
        .toLowerCase()
        .replace(/\s+/g, "");

      await updateDoc(docRef, {
        taskStatusCategory: newStatusCategory,
        [`${statusLowerCaseName}At`]: Timestamp.now(),
        [`${statusLowerCaseName}By`]: userDetails?.email,
        lastComment: note,
        isDelayed: IsDelayed,
        ...scoredoc,
        ...completedDoc,
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
          taskStatusCategory: newStatusCategory,
          taskRef: docRef,
          timeStamp: Timestamp.now(),
          comment_owner_ref: userRef,
        };

        await addDoc(commentDocRef, commentDoc);
      } else {
        console.error("Document not found after update.");
      }

      setNewStatusCategory(null);
      setShowNoteModal(false);
      setNote("");
      setNoteError("");
      setExtraOrdinaryScoreOrValueScore(null);
      fetchTask();
    } catch (error) {
      console.error("Error updating task status:", error.message);
    }
  };

  const handleNoteCancel = () => {
    setShowNoteModal(false);
    setNewStatusCategory(null);
    setNote("");
    setNoteError("");
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      if (!taskdata?.id) return;
      if (
        taskdata?.taskStatusCategory.toLowerCase() === "created" &&
        newStatus.toLowerCase() === "to be started" &&
        taskdata.taskInput
      ) {
        const generated = await generateTasks(taskdata.taskInput);

        if (generated && generated.length > 0) {
          setAiTaskQueue(generated);
          setShowModal(true);
          return;
        } else {
          return;
        }
      }
      const currentStatus = taskdata.taskStatusCategory.toLowerCase();
      const newStatus1 = newStatus.toLowerCase();

      setAiScoringLoading(true);

      try {
        if (currentStatus === "to be started" && newStatus1 === "in process") {
          const score = await generateExtraOrdinaryScore(taskdata);

          setExtraOrdinaryScoreOrValueScore({
            extraOrdinaryScore: score,
            isExtraodinary: true,
          });
        }

        if (currentStatus === "in process" && newStatus1 === "completed") {
          const score = await generateValueScore(taskdata);
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
      setNewStatusCategory(newStatus);
      setShowNoteModal(true);
    } catch (error) {
      console.error("❌ Error updating status:", error.message);
    }
  };

  const HandelGenerateTaskModelCancel = () => {
    setShowModal(false);
    setAiTaskQueue([]);
  };

  const HandelGenerateTaskModelSubmit = async (
    formData,
    index,
    setSubmissionStatus,
    markFirstSubmitted
  ) => {
    try {
      const patrondata = lmpatrons.filter(
        (p) => p.id == taskdata?.patronRef?.id
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

        const docRef = doc(db, "createTaskCollection", taskdata.id);

        await updateDoc(docRef, enrichedFormData);
        setSubmissionStatus((prev) => ({ ...prev, [index]: "success" }));
        markFirstSubmitted?.();
        fetchTask();
      } else {
        const { id, patronId1, ...restDraggedTask } = taskdata;
        const newTaskData = {
          ...restDraggedTask,
          ...baseTaskFields,
          ...formData,
        };

        const docRef = await addDoc(
          collection(db, "createTaskCollection"),
          newTaskData
        );

        setSubmissionStatus((prev) => ({ ...prev, [index]: "success" }));
      }
    } catch (error) {
      console.error("Error in form submission:", error.message);
      setSubmissionStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  };

  const content = {
    Created: "You can change status to To Be Started or Cancelled.",
    "To Be Started":
      "You can change status to In Process, Cancelled, or On Hold.",
    "In Process": "You can change status to Completed, Cancelled, or On Hold.",
    Completed: "Status cannot be changed further.",
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {aiScoringLoading && <AiScoreLoader />}
      {isLoading && <FullPageLoader />}

      {/* 🔹 Top Section - Two Columns */}
      <div className="flex-shrink-0 grid md:grid-cols-2 gap-2 p-3 bg-white border-b border-gray-200">
        {/* Left Column: Task Details + More Details Accordion */}
        <div className="flex flex-col gap-2">
          {/* Task Details Card */}
          <div className="rounded-xl border border-gray-200 p-3">
            <h2 className="text-lg font-bold text-gray-900">
              Task ID: <span className="font-medium">{taskdata.taskID}</span>
            </h2>
            <h3 className="text-base font-semibold text-gray-800 mt-1">
              {taskdata.taskSubject || "No Subject"}
            </h3>

            <div className="grid grid-cols-1 gap-2 text-sm mt-3">
              <p>
                <span className="font-semibold text-gray-700">Patron</span> —{" "}
                {taskdata?.patronName || taskdata.newPatronName || "N/A"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Owner</span> —{" "}
                {taskdata.taskOwner || "N/A"}
              </p>
              <p>
                <span className="font-semibold text-gray-700">Status</span> —{" "}
                <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  {taskdata.taskStatusCategory || "N/A"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-gray-700">Created</span> —{" "}
                {taskdata?.createdAt
                  ? new Date(taskdata.createdAt.seconds * 1000).toLocaleString(
                      "en-IN"
                    )
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* More Details Accordion */}
          <div className="rounded-xl border border-gray-200">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="w-full flex justify-between items-center px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-t-xl"
            >
              More Details
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div className="px-3 pb-2 pt-1 text-sm text-gray-600 space-y-1 max-h-48 overflow-y-auto">
                <p>
                  <span className="font-semibold">Created By:</span>{" "}
                  {taskdata?.createdBy || "N/A"}
                </p>

                {taskdata?.tobeStartedBy && (
                  <>
                    <p>
                      <span className="font-semibold">To Be Started By:</span>{" "}
                      {taskdata?.tobeStartedBy}
                    </p>
                    <p>
                      <span className="font-semibold">To Be Started At:</span>{" "}
                      {taskdata?.tobeStartedAt?.seconds
                        ? new Date(
                            taskdata.tobeStartedAt.seconds * 1000
                          ).toLocaleString("en-IN")
                        : "N/A"}
                    </p>
                  </>
                )}

                {taskdata?.inprocessBy && (
                  <>
                    <p>
                      <span className="font-semibold">In Process By:</span>{" "}
                      {taskdata?.inprocessBy}
                    </p>
                    <p>
                      <span className="font-semibold">In Process At:</span>{" "}
                      {taskdata?.inprocessAt?.seconds
                        ? new Date(
                            taskdata.inprocessAt.seconds * 1000
                          ).toLocaleString("en-IN")
                        : "N/A"}
                    </p>
                  </>
                )}

                {taskdata?.completedBy && (
                  <>
                    <p>
                      <span className="font-semibold">Completed By:</span>{" "}
                      {taskdata?.completedBy}
                    </p>
                    <p>
                      <span className="font-semibold">Completed At:</span>{" "}
                      {taskdata?.completedAt?.seconds
                        ? new Date(
                            taskdata.completedAt.seconds * 1000
                          ).toLocaleString("en-IN")
                        : "N/A"}
                    </p>
                  </>
                )}

                {taskdata?.aiCreatedCategory && (
                  <p>
                    <span className="font-semibold">AI Category:</span>{" "}
                    {taskdata.aiCreatedCategory}
                  </p>
                )}
                {taskdata?.aiCreatedCategoryTag && (
                  <p>
                    <span className="font-semibold">AI Category Tag:</span>{" "}
                    {taskdata.aiCreatedCategoryTag}
                  </p>
                )}
                {taskdata?.aiCreatedSubCategory && (
                  <p>
                    <span className="font-semibold">AI Sub-Category:</span>{" "}
                    {taskdata.aiCreatedSubCategory}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Task Status + Curator Accordion */}
        <div className="flex flex-col gap-2">
          {/* Task Status (always visible) */}
          <div className="rounded-xl border border-gray-200 p-3">
            {(() => {
              const { bg, text } = getStatusColor(taskdata.taskStatusCategory);
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-l font-bold">Task Status:</h2>
                    <h3
                      className={`text-l font-bold px-2 py-1 rounded ${bg} ${text}`}
                    >
                      {taskdata.taskStatusCategory}
                    </h3>
                  </div>
                  <div className="ml-4">
                    <Infonote content={content} />
                  </div>
                </div>
              );
            })()}

            {getActionButtons().length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {getActionButtons().map((status) => {
                  const { bg, text } = getStatusColor(status);
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(status)}
                      className={`px-3 py-1.5 text-xs rounded-lg border ${bg} ${text} hover:opacity-80`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Curator Accordion Section */}
          {taskdata?.isCuratorTask && (
            <div className="rounded-xl border border-gray-200">
              <button
                onClick={() => setIsCuratorOpen((prev) => !prev)}
                className="w-full flex justify-between items-center px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-t-xl"
              >
                Curator Details
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isCuratorOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isCuratorOpen && (
                <div className="px-3 pb-2 pt-1 max-h-48 overflow-y-auto">
                  <TaskCuratorSection
                    taskdata={taskdata}
                    FeedbackHandel={FeedbackHandel}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Full Width Comments Section */}
      <div className="flex-1 flex flex-col min-h-0 mx-3 mb-3 rounded-xl border border-gray-200 bg-gray-50">
        <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200 rounded-t-xl">
          <h3 className="text-sm font-semibold text-gray-700">Comments</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No messages yet.
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="flex gap-2 p-2 rounded-lg bg-white border border-gray-200 shadow-sm"
                >
                  <img
                    src={c.comment_owner_img || "/default-avatar.png"}
                    alt={c.comment_owner_name}
                    className="w-6 h-6 rounded-full object-cover border border-gray-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 text-xs">
                        {c.comment_owner_name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {c.commentDate?.seconds
                          ? new Date(
                              c.commentDate.seconds * 1000
                            ).toLocaleString("en-IN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "N/A"}
                      </span>
                    </div>
                    <p className="text-gray-700 text-xs leading-snug">
                      Task Status: {c.taskStatusCategory}
                    </p>
                    <p className="text-gray-700 text-m leading-snug">
                      {c.comment_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200 rounded-b-xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              onClick={handleAddComment}
              className="bg-gray-700 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-gray-800"
            >
              Send
            </button>
          </div>
          {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
        </div>
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px] shadow-xl">
            <h2>
              You are Changing Task Status from{" "}
              <b className="text-orange-500">{taskdata?.taskStatusCategory}</b>{" "}
              to <b className="text-orange-500">{newStatusCategory}</b>
            </h2>
            <h2 className="text-lg font-bold mb-2">Add a note before moving</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-2 border rounded mb-4"
              rows={4}
              placeholder="Enter your note here..."
            />
            {noteError && (
              <h1 className="text-sm text-red-500 p-2">{noteError}</h1>
            )}
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

      {/* Generated Task Modal */}
      <GeneratedTaskFormModal
        isOpen={showModal}
        aiTasks={aiTaskQueue}
        draggedTask={taskdata}
        onClose={HandelGenerateTaskModelCancel}
        onFormSubmit={HandelGenerateTaskModelSubmit}
        isPatronTask={true}
      />
    </div>
  );
};

export default Page;
