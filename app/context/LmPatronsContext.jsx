import React, { createContext, useState, useEffect } from "react";
import { collection, getDocs, query, where, doc } from "firebase/firestore";
import { db } from "../../firebasedata/config";
import { useAuth } from "../context/AuthContext";

export const LMPatronContext = createContext();

export const LMPatronProvider = ({ children }) => {
  const [lmpatrons, setlmPatrons] = useState([]);
  const { userDetails } = useAuth();

  useEffect(() => {
    const fetchPatrons = async () => {
      if (!userDetails?.id) return;

      try {
        const lmRef = doc(db, "user", userDetails.id);
        const q = query(
          collection(db, "addPatronDetails"),
          where("lmRef", "==", lmRef)
        );

        const snapshot = await getDocs(q);
        const patrons = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setlmPatrons(patrons);
      } catch (error) {
        console.error("Error fetching patrons:", error);
      }
    };

    fetchPatrons();
  }, [userDetails]);

  return (
    <LMPatronContext.Provider value={{ lmpatrons, setlmPatrons }}>
      {children}
    </LMPatronContext.Provider>
  );
};
