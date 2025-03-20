import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore'; 

const firebaseConfig = {
    apiKey: "AIzaSyBelUvkmgzay05xMvC0sNTRexsxMV0rTCU",
    authDomain: "bill-gen-a4c7f.firebaseapp.com",
    projectId: "bill-gen-a4c7f",
    storageBucket: "bill-gen-a4c7f.firebasestorage.app",
    messagingSenderId: "682162688340",
    appId: "1:682162688340:web:b589e598ee827d556078c1",
    measurementId: "G-7M2MCZEY26"
  };

  const app = initializeApp(firebaseConfig);
  export const db = getFirestore(app);

  export default firebaseConfig;