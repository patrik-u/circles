const globalConfigs = {
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
};

const configs = {
    dev: {
        ...globalConfigs,
        environment: "dev",
        apiUrl: "http://localhost:5001/codo-fab51/europe-west1/api",
        logLevel: 0,
        alwaysShowGuide: false,
    },
    devprod: {
        ...globalConfigs,
        environment: "devprod",
        apiUrl: "http://localhost:5001/codo-fab51/europe-west1/api",
        logLevel: 0,
    },
    prod: {
        ...globalConfigs,
        environment: "prod",
        apiUrl: "https://europe-west1-codo-fab51.cloudfunctions.net/api",
        logLevel: 2,
    },
};

const getConfig = () => {
    switch (process.env.REACT_APP_ENVIRONMENT) {
        default:
        case "dev":
            return configs.dev;
        case "staging":
            return configs.prod;
        case "prod":
            return configs.prod;
        case "devprod":
            return configs.devprod;
    }
};

const config = getConfig();

export default config;
