"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import {
  collection,
  query,
  where,
  doc,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebasedata/config";
import { LMPatronContext } from "./LmPatronsContext";

export const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [contexttasks, setContextTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const { lmpatrons } = useContext(LMPatronContext);

  useEffect(() => {
    setContextTasks([]); // ✅ immediately clear old tasks
    setTasksLoading(true);
    if (!lmpatrons?.length) {
      setContextTasks([]);
      setTasksLoading(false); // ✅ no patrons, nothing to load
      return;
    }
    // ✅ start loading when patrons change
    const unsubscribes = [];

    lmpatrons.forEach((patron) => {
      const patronRef = doc(db, "addPatronDetails", patron.id);

      const q = query(
        collection(db, "createTaskCollection"),
        where("patronRef", "==", patronRef),
        where("isTaskDisabled", "==", false), // ✅ fixed
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

          setContextTasks((prevTasks) => {
            const otherTasks = prevTasks.filter(
              (task) => task.patronId1 !== patron.id
            );
            const updated = [...otherTasks, ...patronTasks].sort((a, b) => {
              const timeA = a.createdAt?.seconds || 0;
              const timeB = b.createdAt?.seconds || 0;
              return timeB - timeA;
            });
            return updated;
          });

          setTasksLoading(false); // ✅ stop loading after first snapshot
        },
        (error) => {
          console.error(
            "Error listening to tasks for patron:",
            patron.id,
            error
          );
          setTasksLoading(false);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [lmpatrons]);

  return (
    <TaskContext.Provider
      value={{ contexttasks, setContextTasks, tasksLoading }}
    >
      {children}
    </TaskContext.Provider>
  );
};
