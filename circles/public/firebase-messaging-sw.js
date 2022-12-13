// file overwritten in deploy process by src\assets\firebase-messaging-sw\firebase-messaging-sw-<env>.js
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseApp = firebase.initializeApp({
    apiKey: "AIzaSyDPPDB6kGT0lwjJkwyn3cP24geOg1kPXtk",
    authDomain: "circles-325718.firebaseapp.com",
    projectId: "circles-325718",
    storageBucket: "circles-325718.appspot.com",
    messagingSenderId: "174159362871",
    appId: "1:174159362871:web:f7429a0fa3bffc00deb8b2",
    measurementId: "G-T9FZSFRD99",
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log("%cReceived background message " + payload, "background: #222; color: #bada55");

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);

    // add badge on the app icon
    self.registration.getNotifications().then(function (notifications) {
        self.registration.setAppBadge(notifications.length);
    });
});
