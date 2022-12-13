//#region imports
import { useEffect, lazy } from "react";
import { log } from "components/Helpers";
import { useAtom } from "jotai";
import { ModalPopup } from "components/CircleElements";
import { newUserPopupAtom } from "components/Atoms";
//#endregion

const NewUserGuide = lazy(() => import("components/NewUserGuide"));

// handles actions triggered by components
export const NewUserPopup = () => {
    log("ConnectPopup.render", -1);

    const [newUserPopup, setNewUserPopup] = useAtom(newUserPopupAtom);

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

    if (!newUserPopup) return null;

    return (
        <ModalPopup onClose={onClose}>
            <NewUserGuide onClose={onClose} />
        </ModalPopup>
    );
};

export default NewUserPopup;
