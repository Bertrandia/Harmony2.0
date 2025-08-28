import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

 const firebaseConfig = {
    apiKey: "AIzaSyCf9HdZzG46z26qsXYYh9oUS7Fqf2gd34o",
    authDomain: "procure-to-pay-9604a.firebaseapp.com",
    projectId: "procure-to-pay-9604a",
    storageBucket: "procure-to-pay-9604a.appspot.com",
    messagingSenderId: "632406467525",
    appId: "1:632406467525:web:38754584c80d1fb4d0e1ac",
    databaseURL: "https://procure-to-pay-9604a-default-rtdb.firebaseio.com"
  };
 
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
 