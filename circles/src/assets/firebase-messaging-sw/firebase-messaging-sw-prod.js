// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
try {
    importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

    // Initialize the Firebase app in the service worker by passing in
    // your app's Firebase config object.
    // https://firebase.google.com/docs/web/setup#config-object
    const firebaseApp = firebase.initializeApp({
        apiKey: "AIzaSyC1fOcQ-PgqfyrUsHV2J7fMJPX0aLyZrco",
        authDomain: "circles-83729.firebaseapp.com",
        projectId: "circles-83729",
        storageBucket: "circles-83729.appspot.com",
        messagingSenderId: "329114176340",
        appId: "1:329114176340:web:50a2798a05f2674bc596c1",
        measurementId: "G-2B1294HJ2J",
    });

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function (payload) {
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: payload.notification.image,
        };

        self.registration.showNotification(notificationTitle, notificationOptions);

        // add badge on the app icon
        self.registration.getNotifications().then(function (notifications) {
            self.registration.setAppBadge(notifications.length);
        });
    });
} catch {}
