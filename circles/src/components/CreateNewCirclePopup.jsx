//#region imports
import { useEffect, lazy, Suspense, useState } from "react";
import { log } from "@/components/Helpers";
import { useAtom } from "jotai";
import { ModalPopup } from "@/components/CircleElements";
import { newCirclePopupAtom, isMobileAtom } from "@/components/Atoms";
//#endregion

const NewCircleGuide = lazy(() => import("@/components/NewCircleGuide"));

export const CreateNewCirclePopup = () => {
    log("ConnectPopup.render", -1);

    const [newCirclePopup, setNewCirclePopup] = useAtom(newCirclePopupAtom);
    const [mapInteract, setMapInteract] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);

    const toggleMapInteract = (value) => {
        setMapInteract(value);
    };

    //#region useEffects

    useEffect(() => {
        if (newCirclePopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [newCirclePopup]);

    //#endregion

    const onClose = () => {
        setNewCirclePopup(null);
    };

    if (!newCirclePopup) return null;

    return (
        <ModalPopup onClose={onClose} fullscreen={isMobile} mapInteract={mapInteract}>
            <Suspense fallback={<div></div>}>
                <NewCircleGuide
                    onClose={onClose}
                    type={newCirclePopup?.type}
                    parent_circle={newCirclePopup?.parent_circle}
                    circle={newCirclePopup?.circle}
                    message={newCirclePopup?.message}
                    isUpdateForm={newCirclePopup?.isUpdateForm}
                    toggleMapInteract={toggleMapInteract}
                />
            </Suspense>
        </ModalPopup>
    );
};

export default CreateNewCirclePopup;
