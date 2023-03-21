//#region imports
import { useState, useEffect } from "react";
import { Box, HStack, VStack, Text, Button, useToast } from "@chakra-ui/react";
import { GeoPoint } from "firebase/firestore";
import { log } from "components/Helpers";
import { displayModes } from "components/Constants";
import axios from "axios";
import { i18n } from "i18n/Localization";
import { useAtom } from "jotai";
import { displayModeAtom, locationPickerActiveAtom, locationPickerPositionAtom, isMobileAtom } from "components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleBasePopupForm = ({ circle, isUpdateForm, isGuideForm, onCancel, onNext, onUpdate, toggleMapInteract }) => {
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [displayMode, setDisplayMode] = useAtom(displayModeAtom);
    const [locationPickerActive, setLocationPickerActive] = useAtom(locationPickerActiveAtom);
    const [locationPickerPosition] = useAtom(locationPickerPositionAtom);
    const toast = useToast();
    const [isMobile] = useAtom(isMobileAtom);

    useEffect(() => {
        setDisplayMode(displayModes.map_only);
        setLocationPickerActive(true);
        if (toggleMapInteract) {
            toggleMapInteract(true);
        }

        return () => {
            setLocationPickerActive(false);
            setDisplayMode(displayModes.map);
            if (toggleMapInteract) {
                toggleMapInteract(false);
            }
        };
    }, [setDisplayMode, setLocationPickerActive, toggleMapInteract]);

    const hasSetLocation = () => {
        return locationPickerPosition && typeof locationPickerPosition[0] === "number" && typeof locationPickerPosition[1] === "number";
    };

    const onSaveBase = async () => {
        if (hasSetLocation()) {
            // save location
            setIsSavingLocation(true);

            // update circle data
            let newBase = new GeoPoint(locationPickerPosition[1], locationPickerPosition[0]);
            let updatedCircleData = { base: newBase };
            await axios.put(`/circles/${circle.id}`, {
                circleData: updatedCircleData,
            });

            setIsSavingLocation(false);

            if (onUpdate) {
                onUpdate(updatedCircleData);
            }
        } else if (isGuideForm) {
            let updatedCircleData = { skipped_setting_location: true };
            await axios.put(`/circles/${circle.id}`, {
                circlePrivateData: updatedCircleData,
            });
        }

        if (hasSetLocation() && isUpdateForm) {
            toast({
                title: i18n.t("Location updated"),
                status: "success",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
        }

        if (isGuideForm || !isUpdateForm) {
            onNext();
        }
    };

    if (!circle) {
        return null;
    }

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t(`Choose ${circle.type} location`)}</Text>
            <Text>{i18n.t(`Place ${circle.type} location`)}</Text>
            <Box>
                <HStack align="center" marginTop="10px">
                    <Button colorScheme="blue" mr={3} borderRadius="25px" lineHeight="0" isLoading={isSavingLocation} onClick={onSaveBase}>
                        {isUpdateForm ? (isGuideForm ? (!hasSetLocation() ? i18n.t("Skip") : i18n.t("Continue")) : i18n.t("Save")) : i18n.t(`Save and go to ${circle.type}`)}
                    </Button>
                    {!isUpdateForm && (
                        <Button variant="ghost" borderRadius="25px" onClick={onCancel} lineHeight="0" isDisabled={isSavingLocation}>
                            {i18n.t("Close")}
                        </Button>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
};

export default CircleBasePopupForm;
