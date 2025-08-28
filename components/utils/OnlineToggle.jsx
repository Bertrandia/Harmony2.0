'use client';
import { useAuth } from "../../app/context/AuthContext";
import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../firebasedata/config';

export default function OnlineToggle() {
  const { userDetails } = useAuth();
  const [isOnline, setIsOnline] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Wait for userDetails to be ready
  useEffect(() => {
    if (!userDetails?.id) return;

    const userDocRef = doc(db, 'user', userDetails.id);
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
      const userDocRef = doc(db, 'user', userDetails.id);
      await updateDoc(userDocRef, { isOnline: !isOnline });
    } catch (err) {
      console.error('Error updating isOnline:', err);
    } finally {
      setUpdating(false);
    }
  };

  if (!userDetails?.id || isOnline === null) return null;

  return (
    <label className="ml-4 inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={isOnline}
        onChange={toggleStatus}
        disabled={updating}
      />
      <div
        className={`w-10 h-5 bg-gray-300 rounded-full shadow-inner transition-colors duration-200 ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
            isOnline ? 'translate-x-5' : 'translate-x-1'
          }`}
        ></div>
      </div>
      <span className="ml-2 text-sm text-gray-700">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </label>
  );
}
