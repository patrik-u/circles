//#region imports
import React, { lazy } from "react";
import { createRoot } from "react-dom/client";
import reportWebVitals from "./reportWebVitals";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./index.css";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import config from "./Config";
import axios from "axios";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/700.css";
import App from "./App";
//import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import RouterUtils from "components/RouterUtils";
//#endregion

//#region initializations
const theme = extendTheme({
    fonts: {
        heading: "Roboto",
        body: "Roboto",
    },
    styles: {
        global: (props) => ({
            body: {
                bg: "",
            },
        }),
    },
});

if (config.environment === "prod") {
    Sentry.init({
        dsn: "https://8215e7c90308434ca191ecfddf8c7813@o1111584.ingest.sentry.io/6140853",
        beforeSend(event, hint) {
            // Check if it is an exception, and if so, show the report dialog
            if (event.exception) {
                let reportDialogOptions = { eventId: event.event_id };
                if (event.user) {
                    reportDialogOptions.user = {
                        email: event.user?.email,
                        name: event.user?.username,
                    };
                }

                Sentry.showReportDialog(reportDialogOptions);
            }
            return event;
        },
        release: "circles@0.2.0",
        environment: config.environment,
        integrations: [new Integrations.BrowserTracing()],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 0.2,
    });
}

axios.defaults.baseURL = config.apiUrl;
//#endregion

const PrivacyPolicy = lazy(() => import("components/PrivacyPolicy"));

const root = createRoot(document.getElementById("root"));
root.render(
    <Router>
        <RouterUtils>
            <ChakraProvider theme={theme}>
                <React.StrictMode>
                    <Routes>
                        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
                        <Route path="/*" element={<App />} />
                    </Routes>
                </React.StrictMode>
            </ChakraProvider>
        </RouterUtils>
    </Router>
);

serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
