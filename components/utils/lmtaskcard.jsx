"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LmTaskCard({ task }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const maxChars = 80;
  const description = task.taskDescription || "";
  const isLong = description.length > maxChars;
  const visibleText = expanded ? description : description.slice(0, maxChars);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          button: "bg-green-500 hover:bg-green-600",
        };
      case "In Process":
        return {
          bg: "bg-orange-100",
          text: "text-orange-700",
          button: "bg-orange-500 hover:bg-orange-600",
        };
      case "To be Started":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          button: "bg-yellow-500 hover:bg-yellow-600 text-black",
        };
        case "Created":
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          button: "bg-blue-500 hover:bg-blue-600 text-black",
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          button: "bg-gray-500 hover:bg-gray-600",
        };
    }
  };

  const statusStyles = getStatusColor(task?.taskStatusCategory);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 p-4 border border-gray-200 flex flex-col justify-between h-full">
      
      {/* Title & Status */}
      <div className="mb-3">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2 pr-2">
            {task?.taskSubject || task?.taskInput}
          </h4>
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusStyles.bg} ${statusStyles.text}`}
          >
            {task?.taskStatusCategory}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 break-words">
          {visibleText}
          {isLong && !expanded && "... "}
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-orange-500 text-xs font-medium hover:underline ml-1"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </p>
      </div>

      {/* Footer Section */}
      <div className="mt-auto border-t border-gray-200 pt-3 flex flex-col gap-3 text-xs text-gray-500">
        
        {/* Info Section */}
        <div className="flex flex-col gap-1">
          <p>
            <span className="font-medium text-gray-700">Assigned To:</span>{" "}
            {task.taskOwner || "N/A"}
          </p>
          <p>
            <span className="font-medium text-gray-700">Requested By:</span>{" "}
            {task.partonName || "N/A"}
          </p>
        </div>

        {/* Date & Button */}
        <div className="flex justify-between items-center mt-2">
          {task?.createdAt && (
            <div className="flex items-center gap-1 text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(task.createdAt.seconds * 1000).toLocaleDateString()}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              if (task?.id) {
                router.push(`/taskfulldetails/${task.id}`);
              } else {
                console.warn("No taskId in message");
              }
            }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium text-white transition-colors duration-300 shadow ${statusStyles.button}`}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
