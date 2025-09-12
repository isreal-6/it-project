// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyOMthpGpzeolCoob_MytHn5PddssUJj4",
  authDomain: "it-project-4a71c.firebaseapp.com",
  projectId: "it-project-4a71c",
  storageBucket: "it-project-4a71c.firebasestorage.app",
  messagingSenderId: "1085607018365",
  appId: "1:1085607018365:web:9f580dbbe6871d89af5614",
  measurementId: "G-C24JTFVJD0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);