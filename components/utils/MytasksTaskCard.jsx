// components/TaskCard.jsx
"use client";
import { useRouter } from "next/navigation";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  PauseCircle,
  Ban,
  Hourglass,
  CircleDot,
  Calendar,
} from "lucide-react"; // You can change these icons as needed

const getStatusIcon = (status) => {
  switch ((status ?? "").toLowerCase()) {
    case "created":
      return CircleDot; // New task
    case "to be started":
      return Hourglass; // Waiting to start
    case "in process":
      return AlertCircle; // In progress or processing
    case "completed":
      return CheckCircle; // Done
    case "cancelled":
      return XCircle; // Cancelled or failed
    case "on hold":
      return PauseCircle; // Temporarily paused
    case "delayed":
      return Clock; // Delayed
    default:
      return Ban; // Unknown or fallback
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "Low":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    default:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  }
};

const MytasksTaskCard = ({ task }) => {
  const router = useRouter();

  const StatusIcon = getStatusIcon(task.taskStatusCategory);
  const statusColor = getStatusColor(task.taskStatusCategory || task.status);

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className={`p-2 rounded-full ${statusColor.bg}`}>
            <StatusIcon className={`w-5 h-5 ${statusColor.text}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {task?.taskInput || "No Task Input"}
              </h3>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <h6 className="text-l font-semibold text-card-foreground group-hover:text-primary transition-colors">
                PATRON NAME :{task?.partonName || "N/A"}
              </h6>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {task?.createdAt && (
                  <span>
                    {new Date(
                      task.createdAt.seconds * 1000
                    ).toLocaleDateString()}{" "}
                    •{" "}
                    {new Date(task.createdAt.seconds * 1000).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mb-3">
              {task?.taskDescription || "NO DESCRIPTION"}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Badge className={getPriorityColor(task?.priority)}>
                {task.priority}
              </Badge>
              <Badge className={`${statusColor.bg} ${statusColor.text}`}>
                {task.taskStatusCategory}
              </Badge>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {/* Edit Task Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent card click
                  router.push(`/taskfulldetails/${task?.id}`);
                }}
                className="text-xs px-3 py-1.5 rounded-md font-medium text-white bg-gray-500 hover:bg-gray-600 transition-colors"
              >
                Edit Task
              </button>

              {/* Task Comments Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent card click
                  router.push(`/taskcomments/${task?.id}`);
                }}
                className="text-xs px-3 py-1.5 rounded-md font-medium text-white bg-gray-500 hover:bg-gray-600 transition-colors"
              >
                View Comments
              </button>

              {/* Optional Add Expense Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent card click
                  router.push(`/addexpenseshotform/${task?.id}`);
                }}
                className="text-xs px-3 py-1.5 rounded-md font-medium text-white bg-gray-500 hover:bg-gray-600 transition-colors"
              >
                + Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MytasksTaskCard;
