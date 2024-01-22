import React, { useState, useEffect, useRef } from "react";
import { Slide, Button, Box, useDisclosure, Flex, Icon } from "@chakra-ui/react";
import { FaThumbtack } from "react-icons/fa";
import { MdOutlineClose } from "react-icons/md";
import { useAtom } from "jotai";
import { isMobileAtom, userDataAtom } from "@/components/Atoms";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { CircleListItem, CircleListItemNormal } from "@/components/CircleListItem";
import { openCircle } from "@/components/Navigation";
import { globalCircle } from "@/components/Circle";
import Scrollbars from "react-custom-scrollbars-2";

const NavigationPanel = ({ isPinned, setIsPinned, onClose }) => {
    const iconSize = 16;
    const iconSizePx = iconSize + "px";
    const [isMobile] = useAtom(isMobileAtom);
    const [userData] = useAtom(userDataAtom);
    const [favoriteCircles, setFavoriteCircles] = useState([]);
    const navigate = useNavigateNoUpdates();
    const view = "compact";

    useEffect(() => {
        if (!userData?.circle_settings) return;

        let newFavoriteCircles = [];
        for (var circleId in userData.circle_settings) {
            let favorite = userData.circle_settings[circleId].favorite;
            if (favorite) {
                newFavoriteCircles.push(userData.circle_settings[circleId].circle);
            }
        }
        setFavoriteCircles(newFavoriteCircles);
    }, [userData?.circle_settings]);

    const onCircleClick = (item) => {
        openCircle(navigate, item);
        if (!isPinned) {
            onClose();
        }
    };

    const panelBackground = "#34384f";
    //const panelBackground = "#4a5179";
    //const panelBackground = "#3c3d42";

    return (
        <>
            <Box
                color="white"
                mt="0"
                bg={panelBackground}
                height="100vh"
                minH="100vh"
                maxW={isMobile ? "none" : "400px"}
                width="full"
                position="relative"
            >
                <Scrollbars autoHide>
                    <CircleListItem
                        item={globalCircle}
                        onClick={() => onCircleClick(globalCircle)}
                        isDark={true}
                        inSelect={true}
                        inNav={true}
                    />

                    {favoriteCircles
                        ?.filter((x) => x.id !== "global")
                        ?.map((item) =>
                            view === "compact" ? (
                                <CircleListItem
                                    key={item.id}
                                    item={item}
                                    onClick={() => onCircleClick(item)}
                                    isDark={true}
                                    inSelect={true}
                                    inNav={true}
                                />
                            ) : (
                                <CircleListItemNormal key={item.id} item={item} onClick={() => onCircleClick(item)} />
                            )
                        )}

                    {isMobile && (
                        <Flex
                            position="absolute"
                            top="10px"
                            right="10px"
                            width={iconSize + 8 + "px"}
                            height={iconSize + 8 + "px"}
                            _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                            _active={{ transform: "scale(0.98)" }}
                            borderRadius="50%"
                            justifyContent="center"
                            alignItems="center"
                            onClick={onClose}
                            cursor="pointer"
                            zIndex="100"
                        >
                            <Icon
                                width={iconSize + 8 + "px"}
                                height={iconSize + 8 + "px"}
                                color={"#ddd"}
                                as={MdOutlineClose}
                                cursor="pointer"
                            />
                        </Flex>
                    )}
                </Scrollbars>
                {!isMobile && (
                    <Flex
                        position="absolute"
                        top="10px"
                        right="10px"
                        width={iconSize + 8 + "px"}
                        height={iconSize + 8 + "px"}
                        _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                        _active={{ transform: "scale(0.98)" }}
                        borderRadius="50%"
                        justifyContent="center"
                        alignItems="center"
                        onClick={() => setIsPinned(!isPinned)}
                        cursor="pointer"
                        zIndex="100"
                    >
                        <Icon width={iconSizePx} height={iconSizePx} color={"#ddd"} as={FaThumbtack} cursor="pointer" />
                    </Flex>
                )}
            </Box>
        </>
    );
};

export default NavigationPanel;
