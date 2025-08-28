"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user?.uid) {
        setUserDetailsLoading(true);
        setUserDetailsError(null);

        try {
          const docRef = doc(db, "user", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserDetails({ id: docSnap.id, ...docSnap.data() });
          } else {
            console.warn(`No user details found for UID: ${user.uid}`);
            setUserDetails(null);
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
          setUserDetails(null);
          setUserDetailsError("Failed to load user details.");
        } finally {
          setUserDetailsLoading(false);
        }
      } else {
        setUserDetails(null);
        setUserDetailsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
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
