"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../app/context/AuthContext";
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



const Page = () => {
  const { taskid } = useParams();
  const { userDetails } = useAuth();
  const [taskdata, setTaskData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");


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
      };

      await addDoc(commentsRef, commentdoc);
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 🔹 Top Section (Task + Curator side by side, independent scrolls) */}
      <div
        className={`flex-1 min-h-[65%] max-h-[65%] grid ${
          taskdata?.isCuratorTask ? "md:grid-cols-2" : "md:grid-cols-1"
        } gap-4 p-4 bg-white border-b border-gray-200`}
      >
        {/* Task Details */}
        <div className="rounded-xl border border-gray-200 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-gray-900">
            Task ID: <span className="font-medium">{taskdata.taskID}</span>
          </h2>
          <h3 className="text-base font-semibold text-gray-800 mt-1">
            {taskdata.taskSubject || "No Subject"}
          </h3>

          <div className="grid grid-cols-1 gap-3 text-sm mt-3">
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

          <div className="space-y-2 border-t border-gray-200 pt-3 text-sm mt-3">
            <p>
              <span className="font-semibold text-gray-700">Category</span> —{" "}
              {taskdata.taskCategory || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-gray-700">Due Date</span> —{" "}
              {taskdata?.taskDueDate?.seconds
                ? new Date(
                    taskdata.taskDueDate.seconds * 1000
                  ).toLocaleDateString("en-IN")
                : "N/A"}
            </p>
            {taskdata.taskDescription && (
              <p>
                <span className="font-semibold text-gray-700">Description</span>{" "}
                — {taskdata.taskDescription}
              </p>
            )}
          </div>
        </div>

        {/* Curator Section */}
        {taskdata?.isCuratorTask && (
          <div className="rounded-xl border border-gray-200 p-4 overflow-y-auto">
            <TaskCuratorSection
              taskdata={taskdata}
              FeedbackHandel={FeedbackHandel}
            />
          </div>
        )}
      </div>

      {/* 🔹 Bottom Section: Comments (smaller like YouTube) */}
      <div className="min-h-[35%] max-h-[35%] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
          <h3 className="text-md font-semibold text-gray-800 mb-2">Comments</h3>

          {comments.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              No comments yet.
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
                      {c.comment_text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div className="flex-shrink-0 p-3 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Add a comment..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              onClick={handleAddComment}
              className="bg-gray-700 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-gray-800"
            >
              Post
            </button>
          </div>
          {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
};

export default Page;
