//#region imports
import { toastError, toastInfo } from "components/Helpers";
import { log } from "components/Helpers";
import { useAtom } from "jotai";
import { saveIdAtom } from "components/Atoms";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { useToast } from "@chakra-ui/react";
import { useEffect, useState } from "react";
//#endregion

export const useSaveAndNavigate = () => {
    const [saveId] = useAtom(saveIdAtom);
    const [navigateIntent, setNavigateIntent] = useState(null);
    const navigate = useNavigateNoUpdates();
    const toast = useToast();

    useEffect(() => {
        if (navigateIntent && !saveId) {
            navigate(navigateIntent);
            setNavigateIntent(null);
        } else if (navigateIntent) {
            // TODO wait at most 5000 seconds and navigate anyway
        }
    }, [navigateIntent, saveId, navigate]);

    const saveAndNavigate = (path) => {
        if (saveId) {
            // TODO show popup instead that allows user to override and navigate anyway
            toast({
                title: "Waiting for autosave to complete",
                status: "info",
                position: "top",
                duration: 3000,
                variant: "left-accent",
            });

            setNavigateIntent(path);
            return;
        }
        // set last page visited in local storage
        localStorage.setItem("lastPage", window.location.pathname);
        navigate(path);
    };

    return saveAndNavigate;
};

export default useSaveAndNavigate;
