//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
//#endregion

const JitsiMeetComponent = ({ roomName, user }) => {
    const jitsiContainer = useRef(null);

    useEffect(() => {
        let api = null;
        if (window.JitsiMeetExternalAPI) {
            api = new window.JitsiMeetExternalAPI("jitsi.codo.earth", {
                roomName: roomName,
                parentNode: jitsiContainer.current,
                configOverwrite: {
                    startWithAudioMuted: true,
                    disableModeratorIndicator: true,
                    startScreenSharing: true,
                    enableEmailInStats: false,
                    logging: {
                        defaultLogLevel: "error",
                    },
                },
                interfaceConfigOverwrite: {
                    DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                    SHOW_CHROME_EXTENSION_BANNER: false,
                    DISPLAY_WELCOME_PAGE_CONTENT: false,
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    TOOLBAR_BUTTONS: [
                        "microphone",
                        "camera",
                        "closedcaptions",
                        "desktop",
                        "fullscreen",
                        "recording",
                        "sharedvideo",
                        "settings",
                        "raisehand",
                        "filmstrip",
                        "invite",
                        "stats",
                        "shortcuts",
                        "tileview",
                        "hangup",
                        "participants-pane",
                    ],
                },
                userInfo: {
                    displayName: user?.name,
                },
            });
        }

        return () => {
            if (api) {
                api.dispose();
            }
        };
    }, [user?.name, roomName]);

    return <div ref={jitsiContainer} style={{ width: "100%", height: "100%" }} />;
};

export default JitsiMeetComponent;
