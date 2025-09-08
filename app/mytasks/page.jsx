"use client";
import React, { useContext, useMemo, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import MytasksTaskCard from "../../components/utils/MytasksTaskCard";
import PatronShimmer from "@/components/utils/PatronShimmer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useParams, useSearchParams } from "next/navigation";

function MyTasksPage() {
  const { contexttasks, tasksLoading } = useContext(TaskContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showCuratorOnly, setShowCuratorOnly] = useState(false); // 👈 NEW toggle state

  const searchParams = useSearchParams();
  const searchparamspatronId = searchParams.get("id");

  const filteredTasks = useMemo(() => {
    return contexttasks.filter((task) => {
      // ✅ if patronId exists → only show that patron’s tasks
      if (searchparamspatronId && task?.patronRef?.id !== searchparamspatronId)
        return false;

      const matchesSearch =
        (task?.taskInput?.toLowerCase() ?? "").includes(
          searchTerm.toLowerCase()
        ) ||
        (task?.taskDescription?.toLowerCase() ?? "").includes(
          searchTerm.toLowerCase()
        );

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "Delayed"
          ? task?.isDelayed === true
          : (task?.taskStatusCategory?.toLowerCase() ?? "") ===
            filterStatus.toLowerCase());

      const matchesPriority =
        filterPriority === "all" ||
        (task?.priority?.toLowerCase() ?? "") === filterPriority.toLowerCase();

      const matchesCurator = !showCuratorOnly || task?.isCuratorTask === true;

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesCurator
      );
    });
  }, [
    contexttasks,
    searchparamspatronId,
    searchTerm,
    filterStatus,
    filterPriority,
    showCuratorOnly,
  ]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="border-b border-border bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                My Tasks
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your personal and service requests
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="curator-toggle"
                checked={showCuratorOnly}
                onCheckedChange={setShowCuratorOnly}
              />
              <Label htmlFor="curator-toggle" className="text-sm">
                Curator Tasks
              </Label>
            </div>

            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Status</option>
                <option value="Created">Created</option>
                <option value="To be Started">To be Started</option>
                <option value="In Process">In Process</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="On Hold">On Hold</option>
                <option value="Delayed">Delayed</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Task List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {tasksLoading ? (
            [1, 2, 3, 4, 5].map((i) => <PatronShimmer key={i} />)
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <MytasksTaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              No tasks found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksListPage() {
  return <MyTasksPage />;
}
