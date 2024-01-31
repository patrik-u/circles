const configs = {
    dev: {
        environment: "dev",
        apiUrl: "http://localhost:5001/circles-a0ce1/europe-west1/api",
        firebase: {
            apiKey: "AIzaSyD4PvlvtCDQeiWJejOlqBCyWi0gItOQO2E",
            authDomain: "circles-a0ce1.firebaseapp.com",
            projectId: "circles-a0ce1",
            storageBucket: "circles-a0ce1.appspot.com",
            messagingSenderId: "1036474383038",
            appId: "1:1036474383038:web:d733eb7b732a6b248cbcef",
            measurementId: "G-08KCLCJ8PH",
        },
        imageKitEndpoint: "https://ik.imagekit.io/4nfhhm6unw/",
        googleId: "1036474383038-qgds5mhp5ve3osdv5m9q73fqqi7t4gsr.apps.googleusercontent.com",
        logLevel: -2, // -2: log renders, -1: log use effects, 0: log dev/stage, 1: log less, 2: log prod
        algoliaId: "9DJTDE292B",
        algoliaSearchKey: "e55e959c8c6ada2f9f2134e4ca998235",
        algoliaCirclesIndex: "circles",
        alwaysShowGuide: false,
        oneSignalAppId: "3afbd553-d3cb-49b6-87b2-2356b676d545",
        mapBoxToken:
            "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        ai_agent: "tN05inp7an26vZMaAAWw",
        disableOnActive: false,
        ui_variant: 4, // 0 = default, 1 = with circle header and tabs, 2 = without user dashboard, 4 = with vertical tabs in circle dashboard
    },
    staging: {
        environment: "staging",
        apiUrl: "https://europe-west1-circles-a0ce1.cloudfunctions.net/api",
        firebase: {
            apiKey: "AIzaSyD4PvlvtCDQeiWJejOlqBCyWi0gItOQO2E",
            authDomain: "circles-a0ce1.firebaseapp.com",
            projectId: "circles-a0ce1",
            storageBucket: "circles-a0ce1.appspot.com",
            messagingSenderId: "1036474383038",
            appId: "1:1036474383038:web:d733eb7b732a6b248cbcef",
            measurementId: "G-08KCLCJ8PH",
        },
        imageKitEndpoint: "https://ik.imagekit.io/4nfhhm6unw/",
        googleId: "1036474383038-qgds5mhp5ve3osdv5m9q73fqqi7t4gsr.apps.googleusercontent.com",
        logLevel: 2,
        algoliaId: "9DJTDE292B",
        algoliaSearchKey: "e55e959c8c6ada2f9f2134e4ca998235",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "3afbd553-d3cb-49b6-87b2-2356b676d545",
        mapBoxToken:
            "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        ai_agent: "tN05inp7an26vZMaAAWw",
    },
    devprod: {
        environment: "devprod",
        firebase: {
            apiKey: "AIzaSyBUmtUd5_a7mNKn59kPWrrPreGk3twJcp8",
            authDomain: "codo-fab51.firebaseapp.com",
            projectId: "codo-fab51",
            storageBucket: "codo-fab51.appspot.com",
            messagingSenderId: "994631299779",
            appId: "1:994631299779:web:a327c252bac8c9a6c0e876",
        },
        googleId: "994631299779-kr195vbmqi6rvlnd3ta1ju4n6cokgf66.apps.googleusercontent.com",
        imageKitEndpoint: "https://ik.imagekit.io/4nfhhm6unw/",
        algoliaId: "8CVZ4GVTU1",
        algoliaSearchKey: "3f9b50c89e72c70378042f930ea7aa44",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "f5691af6-6908-4ddb-8f37-1a8a00463692",
        mapBoxToken: "pk.eyJ1IjoidGltYW9sc3NvbiIsImEiOiJjbGQyMW05M2YwMXVhM3lvYzMweWllbDZtIn0.ar7LH2YZverGDBWGjxQ65w",
        environment: "devprod",
        apiUrl: "http://localhost:5000/codo-fab51/europe-west1/api",
        logLevel: 0,
        ai_agent: "1p64TIEPMcwIdxdRjzvJ",
    },
    prod: {
        environment: "prod",
        firebase: {
            apiKey: "AIzaSyBUmtUd5_a7mNKn59kPWrrPreGk3twJcp8",
            authDomain: "codo-fab51.firebaseapp.com",
            projectId: "codo-fab51",
            storageBucket: "codo-fab51.appspot.com",
            messagingSenderId: "994631299779",
            appId: "1:994631299779:web:a327c252bac8c9a6c0e876",
        },
        googleId: "994631299779-kr195vbmqi6rvlnd3ta1ju4n6cokgf66.apps.googleusercontent.com",
        imageKitEndpoint: "https://ik.imagekit.io/4nfhhm6unw/",
        algoliaId: "8CVZ4GVTU1",
        algoliaSearchKey: "3f9b50c89e72c70378042f930ea7aa44",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "f5691af6-6908-4ddb-8f37-1a8a00463692",
        mapBoxToken: "pk.eyJ1IjoidGltYW9sc3NvbiIsImEiOiJjbGQyMW05M2YwMXVhM3lvYzMweWllbDZtIn0.ar7LH2YZverGDBWGjxQ65w",
        apiUrl: "https://europe-west1-codo-fab51.cloudfunctions.net/api",
        logLevel: 2,
        ai_agent: "1p64TIEPMcwIdxdRjzvJ",
    },
};

const getConfig = () => {
    switch (import.meta.env.VITE_APP_ENVIRONMENT) {
        default:
        case "dev":
            return configs.dev;
        case "staging":
            return configs.staging;
        case "prod":
            return configs.prod;
        case "devprod":
            return configs.devprod;
    }
};

const config = getConfig();

export default config;
