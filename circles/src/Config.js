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
        alwaysShowGuide: false,
        oneSignalAppId: "7e05d942-3834-48dc-8e49-53f3512da179",
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
        oneSignalAppId: "7e05d942-3834-48dc-8e49-53f3512da179",
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
        algoliaId: "DMKZGLF95G",
        algoliaSearchKey: "c591d5d39ac865fccecc9daa2f639fa9",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "eaedf76e-ff64-4261-995b-5c6bdafb6548",
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
        algoliaId: "DMKZGLF95G",
        algoliaSearchKey: "c591d5d39ac865fccecc9daa2f639fa9",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "eaedf76e-ff64-4261-995b-5c6bdafb6548",
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

export default config;
