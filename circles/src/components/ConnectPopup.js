//#region imports
import { useEffect, Suspense, lazy } from "react";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import { log } from "components/Helpers";
import i18n from "i18n/Localization";
import { useAtom } from "jotai";
import { ModalPopup, CirclePicture } from "components/CircleElements";
import { connectPopupAtom } from "components/Atoms";
import { RiLinksLine } from "react-icons/ri";
//#endregion

const CircleConnections = lazy(() => import("components/CircleConnections"));

// handles actions triggered by components
export const ConnectPopup = () => {
    log("ConnectPopup.render", -1);

    const [connectPopup, setConnectPopup] = useAtom(connectPopupAtom);

    //#region useEffects

    useEffect(() => {
        if (connectPopup) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [connectPopup]);

    //#endregion

    const onClose = () => {
        log("closing popup");
        setConnectPopup(null);
    };

    if (!connectPopup) return null;

    return (
        <ModalPopup onClose={onClose}>
            <Flex alignItems="center">
                <Box flexShrink="0" marginRight="5px">
                    <HStack spacing="10px">
                        <CirclePicture circle={connectPopup.source} size={30} />
                        <RiLinksLine size={18} />
                        <CirclePicture circle={connectPopup.target} size={30} />
                    </HStack>
                </Box>
                <Text marginLeft="10px" fontWeight="700" fontSize="20px">
                    {i18n.t("Connections to")} {connectPopup.target?.name}
                </Text>
            </Flex>
            <Suspense fallback={<Box></Box>}>
                <CircleConnections source={connectPopup.source} target={connectPopup.target} option={connectPopup.option} onClose={onClose} />
            </Suspense>
        </ModalPopup>
    );
};

export default ConnectPopup;
