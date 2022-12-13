const configs = {
    dev: {
        environment: "dev",
        apiUrl: "http://localhost:5001/circles-325718/europe-west1/api",
        firebase: {
            apiKey: "AIzaSyDPPDB6kGT0lwjJkwyn3cP24geOg1kPXtk",
            authDomain: "circles-325718.firebaseapp.com",
            projectId: "circles-325718",
            storageBucket: "circles-325718.appspot.com",
            messagingSenderId: "174159362871",
            appId: "1:174159362871:web:f7429a0fa3bffc00deb8b2",
            measurementId: "G-T9FZSFRD99",
        },
        googleId: "174159362871-juqvepnc0ej66ggdmfpbrt2483jtbkjj.apps.googleusercontent.com",
        logLevel: 0, // -2: log renders, -1: log use effects, 0: log dev/stage, 1: log less, 2: log prod
        algoliaId: "H6R3ISRTF9",
        algoliaSearchKey: "89840fecc26ff7698e9c7c6b08aa0475",
        algoliaCirclesIndex: "staging_circles",
        alwaysShowGuide: true,
    },
    staging: {
        environment: "staging",
        apiUrl: "https://europe-west1-circles-325718.cloudfunctions.net/api",
        firebase: {
            apiKey: "AIzaSyDPPDB6kGT0lwjJkwyn3cP24geOg1kPXtk",
            authDomain: "circles-325718.firebaseapp.com",
            projectId: "circles-325718",
            storageBucket: "circles-325718.appspot.com",
            messagingSenderId: "174159362871",
            appId: "1:174159362871:web:f7429a0fa3bffc00deb8b2",
            measurementId: "G-T9FZSFRD99",
        },
        googleId: "174159362871-juqvepnc0ej66ggdmfpbrt2483jtbkjj.apps.googleusercontent.com",
        logLevel: 0,
        algoliaId: "H6R3ISRTF9",
        algoliaSearchKey: "89840fecc26ff7698e9c7c6b08aa0475",
        algoliaCirclesIndex: "staging_circles",
    },
    prod: {
        environment: "prod",
        apiUrl: "https://europe-west1-circles-83729.cloudfunctions.net/api",
        firebase: {
            apiKey: "AIzaSyC1fOcQ-PgqfyrUsHV2J7fMJPX0aLyZrco",
            authDomain: "circles-83729.firebaseapp.com",
            projectId: "circles-83729",
            storageBucket: "circles-83729.appspot.com",
            messagingSenderId: "329114176340",
            appId: "1:329114176340:web:50a2798a05f2674bc596c1",
            measurementId: "G-2B1294HJ2J",
        },
        googleId: "329114176340-7eepmp4poj59j1cv3ksrg935klvm9rc3.apps.googleusercontent.com",
        logLevel: 2,
        algoliaId: "-- PROD ALGOLIA ID --",
        algoliaSearchKey: "-- PROD ALGOLIA SEARCH KEY --",
        algoliaCirclesIndex: "-- PROD ALGOLIA SEARCH INDEX --",
    },
    devprod: {
        environment: "devprod",
        apiUrl: "http://localhost:5001/circles-83729/europe-west1/api",
        firebase: {
            apiKey: "AIzaSyC1fOcQ-PgqfyrUsHV2J7fMJPX0aLyZrco",
            authDomain: "circles-83729.firebaseapp.com",
            projectId: "circles-83729",
            storageBucket: "circles-83729.appspot.com",
            messagingSenderId: "329114176340",
            appId: "1:329114176340:web:50a2798a05f2674bc596c1",
            measurementId: "G-2B1294HJ2J",
        },
        googleId: "329114176340-7eepmp4poj59j1cv3ksrg935klvm9rc3.apps.googleusercontent.com",
        logLevel: 2,
        algoliaId: "-- PROD ALGOLIA ID --",
        algoliaSearchKey: "-- PROD ALGOLIA SEARCH KEY --",
        algoliaCirclesIndex: "-- PROD ALGOLIA SEARCH INDEX --",
    },
};

const getConfig = () => {
    switch (process.env.REACT_APP_ENVIRONMENT) {
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

//config = configs.dev; // DEV (local backend)
//config = configs.devprod; // DEV (prod backend)
//config = configs.staging; // STAGING (for deploy to staging)
//config = configs.prod; // PRODUCTION (for deploy to prod)

export default config;
