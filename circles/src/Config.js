const configs = {
    circles_dev: {
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
        imageKitEndpoint: "https://ik.imagekit.io/circles/",
        googleId: "174159362871-juqvepnc0ej66ggdmfpbrt2483jtbkjj.apps.googleusercontent.com",
        logLevel: -1, // -2: log renders, -1: log use effects, 0: log dev/stage, 1: log less, 2: log prod
        algoliaId: "H6R3ISRTF9",
        algoliaSearchKey: "89840fecc26ff7698e9c7c6b08aa0475",
        algoliaCirclesIndex: "staging_circles",
        alwaysShowGuide: false,
        oneSignalAppId: "7e05d942-3834-48dc-8e49-53f3512da179",
        mapBoxToken: "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        jitsiJaasKey: "vpaas-magic-cookie-c4aaf34c686040deb4d92e5246619db2",
    },
    circles_staging: {
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
        alwaysShowGuide: false,
        imageKitEndpoint: "https://ik.imagekit.io/circles/",
        googleId: "174159362871-juqvepnc0ej66ggdmfpbrt2483jtbkjj.apps.googleusercontent.com",
        logLevel: 0,
        algoliaId: "H6R3ISRTF9",
        algoliaSearchKey: "89840fecc26ff7698e9c7c6b08aa0475",
        algoliaCirclesIndex: "staging_circles",
        oneSignalAppId: "7e05d942-3834-48dc-8e49-53f3512da179",
        mapBoxToken: "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        jitsiJaasKey: "vpaas-magic-cookie-c4aaf34c686040deb4d92e5246619db2",
    },
    circles_prod: {
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
        imageKitEndpoint: "https://ik.imagekit.io/circles/",
        googleId: "329114176340-7eepmp4poj59j1cv3ksrg935klvm9rc3.apps.googleusercontent.com",
        logLevel: 2,
        algoliaId: "DMKZGLF95G",
        algoliaSearchKey: "c591d5d39ac865fccecc9daa2f639fa9",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "eaedf76e-ff64-4261-995b-5c6bdafb6548",
        mapBoxToken: "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        jitsiJaasKey: "vpaas-magic-cookie-c4aaf34c686040deb4d92e5246619db2",
    },
    circles_devprod: {
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
        imageKitEndpoint: "https://ik.imagekit.io/circles/",
        googleId: "329114176340-7eepmp4poj59j1cv3ksrg935klvm9rc3.apps.googleusercontent.com",
        logLevel: 2,
        algoliaId: "DMKZGLF95G",
        algoliaSearchKey: "c591d5d39ac865fccecc9daa2f639fa9",
        algoliaCirclesIndex: "circles",
        oneSignalAppId: "eaedf76e-ff64-4261-995b-5c6bdafb6548",
        mapBoxToken: "pk.eyJ1IjoiZXhtYWtpbmEtYWRtaW4iLCJhIjoiY2t1cjJkOWJuMDB0MDJvbWYweWx5emR0dSJ9.elxjxO7DHA2UyXs0j7GTHA",
        jitsiJaasKey: "vpaas-magic-cookie-c4aaf34c686040deb4d92e5246619db2",
    },
    codo_devprod: {
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
        apiUrl: "http://localhost:5001/codo-fab51/europe-west1/api",
        jitsiJaasKey: "vpaas-magic-cookie-c4aaf34c686040deb4d92e5246619db2",
        logLevel: 0,
    },
    codo_prod: {
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
        environment: "prod",
        apiUrl: "https://europe-west1-codo-fab51.cloudfunctions.net/api",
        jitsiJaasKey: "vpaas-magic-cookie-c4aaf34c686040deb4d92e5246619db2",
        logLevel: 2,
    },
};

const getConfig = () => {
    switch (process.env.REACT_APP_ENVIRONMENT) {
        default:
        case "circles_dev":
            return configs.circles_dev;
        case "circles_staging":
            return configs.circles_staging;
        case "circles_prod":
            return configs.circles_prod;
        case "circles_devprod":
            return configs.circles_devprod;
        case "codo_prod":
            return configs.codo_prod;
        case "codo_devprod":
            return configs.codo_devprod;
    }
};

const config = getConfig();

export default config;
