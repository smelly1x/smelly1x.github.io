/* Receives notifications for the Shaad & Fiaza app, even when it's closed.
   Lives next to index.html in the GitHub repo. Must keep this exact filename. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyDx5UmoKqq1fJ5tGtZsuqaALpvn7f7Pa7M",
  authDomain:"shaad-x-fiaza.firebaseapp.com",
  databaseURL:"https://shaad-x-fiaza-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:"shaad-x-fiaza",
  storageBucket:"shaad-x-fiaza.firebasestorage.app",
  messagingSenderId:"49327927291",
  appId:"1:49327927291:web:0286d5f58264cec193e55e"
});

// Notifications sent with a title and body are shown automatically by Firebase
// when the app isn't open, and tapping one opens the link it carries.
firebase.messaging();
