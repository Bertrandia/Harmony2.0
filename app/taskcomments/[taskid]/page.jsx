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
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import { ChevronDown, ChevronUp } from "lucide-react"

const Page = () => {
  const { taskid } = useParams();
  const { userDetails } = useAuth();
  const [taskdata, setTaskData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showMore,setShowMore]=useState(false)

 

  useEffect(() => {
    if (!taskid) return;

    // 🔹 Fetch task document
    const fetchTask = async () => {
      try {
        const docRef = doc(db, "createTaskCollection", taskid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTaskData({
            id: docSnap.id,
            ref: docSnap.ref,
            ...data,
          });
        } else {
          console.warn("No such task!");
          setTaskData(null);
        }
      } catch (error) {
        console.error("Error fetching task:", error);
        setTaskData(null);
      }
    };

    fetchTask();

    // 🔹 Stream comments
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

      // 🔹 Sort locally (latest → oldest)
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

    // 🔹 Validate input
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
        isUpdate: false,
        taskStatusCategory: taskdata?.taskStatusCategory,
        taskRef: taskdata?.ref,
        isTaskUpdated: false,
        isFromPatron: false,
        isLM: true,
        commentRecipientId: taskdata?.patronID,
        isTaskStatusUpdate: false,
      };

      await addDoc(commentsRef, commentdoc);

      // reset states
      setNewComment("");
      setErrorMsg("");
    } catch (error) {
      console.error("Error adding comment:", error);
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  console.log(taskdata)
  if (!taskdata) return <div>Loading...</div>;
 
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Task details (accordion) */}
      <div className="flex-shrink-0 p-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-4">
          {/* Header */}
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-lg font-bold text-gray-900">
              <span className="text-gray-600 font-medium">Task ID:</span>{" "}
              {taskdata.taskID}
            </h2>
            <h3 className="text-base font-semibold text-gray-800">
              {taskdata.taskSubject || "No Subject"}
            </h3>
          </div>

          {/* Always visible (key fields) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">Patron Name</span>
              <span className="text-gray-600">
                {taskdata?.patronName || taskdata.newPatronName || "N/A"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">Task Owner</span>
              <span className="text-gray-600">
                {taskdata.taskOwner || "N/A"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">Status</span>
              <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium w-fit">
                {taskdata.taskStatusCategory || "N/A"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">Created At</span>
              <span className="text-gray-600">
                {taskdata?.createdAt
                  ? new Date(taskdata.createdAt.seconds * 1000).toLocaleString(
                      "en-IN"
                    )
                  : "N/A"}
              </span>
            </p>
          </div>

          {/* Accordion toggle */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-sm text-gray-800 hover:underline"
          >
            {showMore ? (
              <>
                Show Less <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                Show More <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Hidden details */}
          {showMore && (
            <div className="space-y-3 border-t border-gray-200 pt-3 text-sm">
              <p className="flex flex-col">
                <span className="font-semibold text-gray-700">Category</span>
                <span className="text-gray-600">
                  {taskdata.taskCategory || "N/A"}
                </span>
              </p>
              <p className="flex flex-col">
                <span className="font-semibold text-gray-700">Due Date</span>
                <span className="text-gray-600">
                  {taskdata?.taskDueDate?.seconds
                    ? new Date(
                        taskdata.taskDueDate.seconds * 1000
                      ).toLocaleDateString("en-IN")
                    : "N/A"}
                </span>
              </p>
              {taskdata.taskDescription && (
                <p className="flex flex-col">
                  <span className="font-semibold text-gray-700">
                    Description
                  </span>
                  <span className="text-gray-600">
                    {taskdata.taskDescription}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comments (main big area) */}
      <div className="flex-1 px-6 min-h-0">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
          <div className="flex-shrink-0 p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Latest Comments
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500 text-sm">No comments yet.</p>
              </div>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-150 border border-gray-100"
                >
                  <img
                    src={c.comment_owner_img || "/default-avatar.png"}
                    alt={c.comment_owner_name}
                    className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 text-sm">
                        {c.comment_owner_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {c.commentDate?.seconds
                          ? new Date(
                              c.commentDate.seconds * 1000
                            ).toLocaleString("en-IN")
                          : "N/A"}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {c.comment_text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Input field (bottom) */}

      <div className="flex-shrink-0 p-6 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="Write a comment..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <button
              onClick={handleAddComment}
              className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-800 active:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all duration-200 font-medium shadow-sm"
            >
              Post
            </button>
          </div>

          {errorMsg && (
            <p className="text-gray-600 text-sm mt-2 px-1">{errorMsg}</p>
          )}
        </div>
      </div>
    </div>
  );


};

export default Page;
