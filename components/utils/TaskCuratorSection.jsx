"use client";
import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebasedata/config";

const TaskCuratorSection = ({ taskdata, FeedbackHandel }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [curatorData, setCuratorData] = useState(null);
  const [error, setError] = useState("");

  if (!taskdata) return null;
  if (taskdata?.isCuratorTask === false) return null;
  
 
  // 🔹 Fetch curator details if assigned
  useEffect(() => {
    const fetchCurator = async () => {
      if (
        taskdata?.isTaskAssignedToCurator &&
        taskdata?.taskAssignedToCurator
      ) {
        try {
          const curatorRef = doc(
            db,
            "Consultants",
            taskdata.taskAssignedToCurator
          );
          const curatorSnap = await getDoc(curatorRef);

          if (curatorSnap.exists()) {
            let curatorInfo = curatorSnap.data();

            // 🔹 Fetch single document from subcollection: Profile/userProfile
            const profileRef = doc(curatorRef, "Profile", "userProfile");
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
              curatorInfo.userProfile = profileSnap.data();
            } else {
              curatorInfo.userProfile = null;
              console.warn(
                "No userProfile doc found in Profile subcollection!"
              );
            }

            setCuratorData(curatorInfo);
          } else {
            console.warn("No such curator found in Consultants!");
          }
        } catch (error) {
          console.error("Error fetching curator:", error);
        }
      }
    };

    fetchCurator();
  }, [taskdata?.isTaskAssignedToCurator, taskdata?.taskAssignedToCurator]);

  const handleSubmit = () => {
    if (rating === 0) {
      setError("⭐ Please select a rating before submitting.");
      return;
    }

    if (!feedback.trim()) {
      setError("Enter Proper Feedback.");
      return;
    }
    setError("");
    FeedbackHandel({
      rating,
      feedback,
      taskId: taskdata?.id,
    });
    setRating(0);
    setFeedback("");
  };

  return (
    <div className="flex-shrink-0 p-4">
      <div className="bg-white  border-gray-200  space-y-4">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-lg font-bold text-gray-900">Curator Section</h2>
        </div>

        {/* Always show taskdata fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <p className="flex flex-col">
            <span className="font-semibold text-gray-700">
              Selected Department
            </span>
            <span className="text-gray-600">
              {taskdata?.selectedHomeCuratorDepartment || "—"}
            </span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-700">Location Mode</span>
            <span className="text-gray-600">
              {taskdata?.locationMode || "—"}
            </span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-700">
              Assigned Time Slot
            </span>
            <span className="text-gray-600">
              {taskdata?.assignedTimeSlot || "—"}
            </span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-700">Task Price</span>
            <span className="text-gray-600">
              {taskdata?.taskPriceByAdmin || "—"}
            </span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-700">Task Start Time</span>
            <span className="text-gray-600">
              {taskdata?.taskStartTime
                ? new Date(
                    taskdata.taskStartTime.seconds * 1000
                  ).toLocaleString("en-IN")
                : "—"}
            </span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-700">Task End Time</span>
            <span className="text-gray-600">
              {taskdata?.taskEndTime
                ? new Date(taskdata.taskEndTime.seconds * 1000).toLocaleString(
                    "en-IN"
                  )
                : "—"}
            </span>
          </p>
        </div>

        {/* Extra curator details only if assigned */}
        {taskdata?.isTaskAssignedToCurator && curatorData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm pt-4 border-t border-gray-200">
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">Curator Name</span>
              <span className="text-gray-600">
                {curatorData?.fullName || "—"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">
                Curator Number
              </span>
              <span className="text-gray-600">
                {curatorData?.userProfile?.contactNumber || "—"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">
                Curator Location
              </span>
              <span className="text-gray-600">
                {curatorData?.userProfile?.city || "—"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">
                Task Acccepted At
              </span>
              {/* <span className="text-gray-600">{taskdata?.curatorTaskStatus || "—"}</span> */}
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">
                Curator Task Status
              </span>
              <span className="text-gray-600">
                {taskdata?.curatorTaskStatus || "—"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">
                Task Start Time
              </span>
              <span className="text-gray-600">
                {taskdata?.taskStartTime
                  ? new Date(
                      taskdata.taskStartTime.seconds * 1000
                    ).toLocaleString("en-IN")
                  : "—"}
              </span>
            </p>
            <p className="flex flex-col">
              <span className="font-semibold text-gray-700">Task End Time</span>
              <span className="text-gray-600">
                {taskdata?.taskEndTime
                  ? new Date(
                      taskdata.taskEndTime.seconds * 1000
                    ).toLocaleString("en-IN")
                  : "—"}
              </span>
            </p>
          </div>
        )}

        {/* --- Rating & Feedback Section --- */}
        {(["under verification", "payment due", "completed"].includes(
          taskdata?.curatorTaskStatus?.toLowerCase() || ""
        ) ||
          taskdata?.curatorTaskRating) && (
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">
              Task Rating & Feedback
            </h3>

            {taskdata?.curatorTaskRating ? (
              // ✅ Show read-only rating & feedback
              <div className="space-y-2">
                <p className="font-semibold text-sm">Task Rating:</p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        taskdata.curatorTaskRating >= star
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="font-semibold text-sm">Task Feed Back :</p>
                <p className="text-gray-700 text-sm ">
                  {taskdata.curatorFeedBack}
                </p>
              </div>
            ) : (
              // ✅ Show interactive rating form
              <>
                {/* Star Rating Input */}
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (hover || rating) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Feedback Input */}
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write your feedback..."
                  className="w-full border rounded-lg p-2 text-sm focus:ring focus:ring-blue-200"
                />

                {error && (
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
                >
                  Submit Feedback
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCuratorSection;
