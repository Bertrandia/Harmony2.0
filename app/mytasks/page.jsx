"use client";
import React, { useContext, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LMPatronContext, LMPatronProvider } from "../context/LmPatronsContext";
import { Sidebar } from "@/components/sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Filter,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  Plus,
  Search,
  SortAsc,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebasedata/config";
import MytasksTaskCard from "../../components/utils/MytasksTaskCard";

function MyTasksPage() {
  const { lmpatrons } = useContext(LMPatronContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [tasks, setTasks] = useState([]);
  //   const tasks = [
  //     {
  //       id: 1,
  //       title: "Dinner Reservation at Zaza",
  //       date: "Today",
  //       time: "7:30 PM",
  //       priority: "medium",
  //       status: "Pending",
  //       statusColor: "pending",
  //       icon: Clock,
  //       description: "Table for 4 at Zaza Restaurant",
  //       location: "Downtown",
  //     },
  //     {
  //       id: 2,
  //       title: "Dry Cleaning Pickup",
  //       date: "Tomorrow",
  //       time: "10:00 AM",
  //       priority: "low",
  //       status: "In Progress",
  //       statusColor: "progress",
  //       icon: Clock,
  //       description: "3 suits and 2 dresses",
  //       location: "Main Street Cleaners",
  //     },
  //     {
  //       id: 3,
  //       title: "Book Flight to London",
  //       date: "May 15, 2023",
  //       time: "All Day",
  //       priority: "high",
  //       status: "Completed",
  //       statusColor: "completed",
  //       icon: CheckCircle,
  //       description: "Round trip business class tickets",
  //       location: "Heathrow Airport",
  //     },
  //     {
  //       id: 4,
  //       title: "Grocery Delivery",
  //       date: "Yesterday",
  //       time: "2:00 PM",
  //       priority: "medium",
  //       status: "Cancelled",
  //       statusColor: "cancelled",
  //       icon: XCircle,
  //       description: "Weekly grocery order",
  //       location: "Home",
  //     },
  //     {
  //       id: 5,
  //       title: "Schedule Dentist Appointment",
  //       date: "Next Week",
  //       time: "Morning",
  //       priority: "medium",
  //       status: "Pending",
  //       statusColor: "pending",
  //       icon: Clock,
  //       description: "Regular checkup and cleaning",
  //       location: "Dr. Smith Dental",
  //     },
  //   ];

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

          setTasks((prevTasks) => {
            const otherTasks = prevTasks.filter(
              (task) => task.patronId1 !== patron.id
            );
            const updatedTasks = [...otherTasks, ...patronTasks];

            // Sort globally by createdAt descending
            return updatedTasks.sort((a, b) => {
              const timeA = a.createdAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || 0;
              return timeB - timeA; // Newest first
            });
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

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      (task?.taskInput?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (task?.taskDescription?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      );

    const matchesStatus =
      filterStatus === "all" ||
      (task?.taskStatusCategory?.toLowerCase() ?? "") ===
        filterStatus.toLowerCase();

    const matchesPriority =
      filterPriority === "all" ||
      (task?.priority?.toLowerCase() ?? "") === filterPriority.toLowerCase();

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="border-b border-border bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header content */}
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
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <MytasksTaskCard key={task.id} task={task} />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Tasks
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ||
                filterStatus !== "all" ||
                filterPriority !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first task to get started"}
              </p>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksListPage() {
  return (
    <ProtectedLayout>
      <LMPatronProvider>
        <MyTasksPage></MyTasksPage>
      </LMPatronProvider>
    </ProtectedLayout>
  );
}
