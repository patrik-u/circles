//#region imports
import { useEffect, lazy, useState } from "react";
import { log } from "@/components/Helpers";
import { useAtom } from "jotai";
import { ModalPopup } from "@/components/CircleElements";
import { newUserPopupAtom, isMobileAtom } from "@/components/Atoms";
//#endregion

const NewUserGuide = lazy(() => import("@/components/NewUserGuide"));

// handles actions triggered by components
export const NewUserPopup = () => {
    log("ConnectPopup.render", -1);

    const [newUserPopup, setNewUserPopup] = useAtom(newUserPopupAtom);
    const [mapInteract, setMapInteract] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);

    //#region useEffects

    useEffect(() => {
        if (newUserPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [newUserPopup]);

    //#endregion

    const onClose = () => {
        setNewUserPopup(null);
    };

    const toggleMapInteract = (value) => {
        setMapInteract(value);
    };

    if (!newUserPopup) return null;

    return (
        <ModalPopup onClose={onClose} mapInteract={mapInteract} fullscreen={isMobile}>
            <NewUserGuide onClose={onClose} toggleMapInteract={toggleMapInteract} />
        </ModalPopup>
    );
};

export default NewUserPopup;
