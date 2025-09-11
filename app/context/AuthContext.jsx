"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { app } from "../../firebasedata/config";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const auth = getAuth(app);
const db = getFirestore(app);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);
  const [userDetailsError, setUserDetailsError] = useState(null);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user?.uid) {
        setUserDetailsLoading(true);
        setUserDetailsError(null);

        const userDocRef = doc(db, "user", user.uid);

        // 👇 set up real-time Firestore listener
        unsubscribeUserDoc = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserDetails({ id: docSnap.id, ...docSnap.data() });
            } else {
              console.warn(`No user details found for UID: ${user.uid}`);
              setUserDetails(null);
            }
            setUserDetailsLoading(false);
          },
          (error) => {
            console.error("Error streaming user details:", error);
            setUserDetails(null);
            setUserDetailsError("Failed to load user details.");
            setUserDetailsLoading(false);
          }
        );
      } else {
        setUserDetails(null);
        setUserDetailsLoading(false);
        if (unsubscribeUserDoc) unsubscribeUserDoc();
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      setCurrentUser(null);
      setUserDetails(null); // 👈 force-clear so patrons/tasks reset immediately
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      authLoading,
      userDetails,
      userDetailsLoading,
      userDetailsError,
      logout,
    }),
    [
      currentUser,
      authLoading,
      userDetails,
      userDetailsLoading,
      userDetailsError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
