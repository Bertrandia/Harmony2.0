"use client";
import React, { useState, useEffect } from "react";
import NewTaskForm from "./NewTaskForm";

export default function GeneratedTaskFormModal({
  isOpen,
  aiTasks,
  onClose,
  onFormSubmit,
}) {
  const [submissionStatus, setSubmissionStatus] = useState({});
  const [aiTaskQueue, setAiTaskQueue] = useState([]);
  const [isFirstTaskSubmitted, setIsFirstTaskSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && aiTasks.length > 0) {
      const enrichedTasks = aiTasks.map((task) => ({
        ...task,
        dummyId: `id-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      }));
      setAiTaskQueue(enrichedTasks);
    }
  }, [isOpen, aiTasks]);

  if (!isOpen || !aiTaskQueue.length) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-[95%] max-w-6xl rounded-lg shadow-lg flex flex-col relative max-h-[90vh] w-full">
        {/* Header */}
        <div className="relative p-4 border-b">
          <button
            className="absolute top-1 right-4 text-gray-600 hover:text-black text-xl"
            onClick={() => {
              setAiTaskQueue([]);
              onClose();
              setSubmissionStatus({});
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable forms */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="flex flex-col items-center space-y-6">
            {aiTaskQueue.map((task, index) => (
              <NewTaskForm
                key={task.dummyId}
                index={index}
                initialData={task}
                isFirstTaskSubmitted={isFirstTaskSubmitted}
                submissionStatus={submissionStatus[index]}
                onDelete={(i) => {
                  const updatedTasks = [...aiTaskQueue];
                  updatedTasks.splice(i, 1);
                  console.log(updatedTasks);
                  setAiTaskQueue(updatedTasks);
                }}
                onSubmit={(formData) =>
                  onFormSubmit(formData, index, setSubmissionStatus, () =>
                    setIsFirstTaskSubmitted(true)
                  )
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
