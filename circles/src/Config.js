const configs = {
    dev: {
        environment: "dev",
        apiUrl: "http://localhost:5000/circles-a0ce1/europe-west1/api",
        firebase: {
            apiKey: "AIzaSyD4PvlvtCDQeiWJejOlqBCyWi0gItOQO2E",
            authDomain: "circles-a0ce1.firebaseapp.com",
            projectId: "circles-a0ce1",
            storageBucket: "circles-a0ce1.appspot.com",
            messagingSenderId: "1036474383038",
            appId: "1:1036474383038:web:d733eb7b732a6b248cbcef",
            measurementId: "G-08KCLCJ8PH",
        },
        imageKitEndpoint: "https://ik.imagekit.io/circles/",
        googleId: "174159362871-juqvepnc0ej66ggdmfpbrt2483jtbkjj.apps.googleusercontent.com",
        logLevel: -2, // -2: log renders, -1: log use effects, 0: log dev/stage, 1: log less, 2: log prod
        algoliaId: "H6R3ISRTF9",
        algoliaSearchKey: "89840fecc26ff7698e9c7c6b08aa0475",
        algoliaCirclesIndex: "staging_circles",
        alwaysShowGuide: false,
        oneSignalAppId: "7e05d942-3834-48dc-8e49-53f3512da179",
        mapBoxToken:
            "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        ai_agent: "tN05inp7an26vZMaAAWw",
        disableOnActive: false,
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
        imageKitEndpoint: "https://ik.imagekit.io/circles/",
        googleId: "329114176340-7eepmp4poj59j1cv3ksrg935klvm9rc3.apps.googleusercontent.com",
        logLevel: 2,
        algoliaId: "DMKZGLF95G",
        algoliaSearchKey: "c591d5d39ac865fccecc9daa2f639fa9",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "eaedf76e-ff64-4261-995b-5c6bdafb6548",
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
