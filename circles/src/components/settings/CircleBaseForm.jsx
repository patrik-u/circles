//#region imports
import { useState, useEffect } from "react";
import { Box, HStack, VStack, Text, Button, useToast } from "@chakra-ui/react";
import { GeoPoint } from "firebase/firestore";
import { log } from "@/components/Helpers";
import { displayModes } from "@/components/Constants";
import axios from "axios";
import { i18n } from "@/i18n/Localization";
import { useAtom } from "jotai";
import {
    displayModeAtom,
    locationPickerActiveAtom,
    locationPickerPositionAtom,
    isMobileAtom,
} from "@/components/Atoms";
import "react-datepicker/dist/react-datepicker.css";
import "react-quill/dist/quill.snow.css";
//#endregion

export const CircleBaseForm = ({ circle, isUpdateForm, onCancel, onNext, onUpdate }) => {
    const [isSavingLocation, setIsSavingLocation] = useState(false);
    const [, setDisplayMode] = useAtom(displayModeAtom);
    const [locationPickerActive, setLocationPickerActive] = useAtom(locationPickerActiveAtom);
    const [locationPickerPosition] = useAtom(locationPickerPositionAtom);
    const toast = useToast();

    useEffect(() => {
        setDisplayMode(displayModes.map);
        setLocationPickerActive(true);

        return () => {
            setLocationPickerActive(false);
        };
    }, [setDisplayMode, setLocationPickerActive]);

    log("locationPickerActive: " + locationPickerActive);

    const onSaveBase = async () => {
        if (
            locationPickerPosition &&
            typeof locationPickerPosition[0] === "number" &&
            typeof locationPickerPosition[1] === "number"
        ) {
            // save location
            setIsSavingLocation(true);

            // update circle data
            let newBase = new GeoPoint(locationPickerPosition[1], locationPickerPosition[0]);
            let updatedCircleData = { base: newBase };
            try {
                await axios.put(`/circles/${circle.id}`, {
                    circleData: updatedCircleData,
                });
            } catch (err) {
                console.log(err);
            }

            setIsSavingLocation(false);

            if (onUpdate) {
                onUpdate(updatedCircleData);
            }
        }

        if (isUpdateForm) {
            toast({
                title: i18n.t("Location updated"),
                status: "success",
                position: "top",
                duration: 4500,
                isClosable: true,
            });
        }

        if (!isUpdateForm) {
            onNext();
        }
    };

    if (!circle) return null;

    return (
        <VStack align="center">
            <Text className="screenHeader">{i18n.t(`Choose ${circle.type} location`)}</Text>
            <Text>{i18n.t(`Place ${circle.type} location`)}</Text>
            <Box>
                <HStack align="center" marginTop="10px">
                    <Button
                        colorScheme="blue"
                        mr={3}
                        borderRadius="25px"
                        lineHeight="0"
                        isLoading={isSavingLocation}
                        onClick={onSaveBase}
                    >
                        {isUpdateForm ? i18n.t("Save") : i18n.t(`Save and go to ${circle.type}`)}
                    </Button>
                    {!isUpdateForm && (
                        <Button
                            variant="ghost"
                            borderRadius="25px"
                            onClick={onCancel}
                            lineHeight="0"
                            isDisabled={isSavingLocation}
                        >
                            {i18n.t("Close")}
                        </Button>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
};

export default CircleBaseForm;
