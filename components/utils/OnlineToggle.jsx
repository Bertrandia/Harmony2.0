"use client";
import { useAuth } from "../../app/context/AuthContext";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebasedata/config";

import { Switch } from "@/components/ui/switch";

export default function OnlineToggle() {
  const { userDetails } = useAuth();
  const [isOnline, setIsOnline] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Wait for userDetails to be ready
  useEffect(() => {
    if (!userDetails?.id) return;

    const userDocRef = doc(db, "user", userDetails.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsOnline(docSnap.data().isOnline);
      }
    });

    return () => unsubscribe();
  }, [userDetails?.id]);

  const toggleStatus = async () => {
    if (isOnline === null || updating || !userDetails?.id) return;
    try {
      setUpdating(true);
      const userDocRef = doc(db, "user", userDetails.id);
      await updateDoc(userDocRef, { isOnline: !isOnline });
    } catch (err) {
      console.error("Error updating isOnline:", err);
    } finally {
      setUpdating(false);
    }
  };

  if (!userDetails?.id || isOnline === null) return null;

  return (
    <div className="ml-4 inline-flex items-center gap-2">
      <Switch
        checked={isOnline}
        onCheckedChange={toggleStatus}
        disabled={updating}
        className="data-[state=checked]:bg-green-500" // track turns green
      />
      <span className="text-sm text-gray-700">
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
}
