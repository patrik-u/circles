//#region imports
import React, { useState, useEffect, useContext } from "react";
import { Box, Flex, VStack, Text, Icon } from "@chakra-ui/react";
import i18n from "i18n/Localization";
import UserContext from "../../components/UserContext";
import axios from "axios";
import { getLatlng, getDistanceString, log, fromFsDate, getDateWithoutTime } from "../../components/old_Helpers";
import IsMobileContext from "../../components/IsMobileContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { routes, openCircle } from "../../components/Navigation";
import { CircleHeader, CirclePicture, CircleCover } from "../../components/CircleElements";
import { RiMapPinFill } from "react-icons/ri";
import { getPreciseDistance } from "geolib";
import CircleListItem from "./old_CircleListItem";
//#endregion

export const Circles = ({
    circle,
    setCircle,
    circles,
    setCircles,
    circleConnections,
    type,
    displayMode,
    setDisplayMode,
    userLocation,
    locationPickerPosition,
    setLocationPickerActive,
    setLocationPickerPosition,
    isSignedIn,
    isSigningIn,
    mustLogInOnOpen,
    focusItem,
    filterConnected,
    setFilterConnected,
    onConnect,
    isConnecting,
}) => {
    const isMobile = useContext(IsMobileContext);
    const user = useContext(UserContext);
    const navigate = useNavigate();
    const [unfilteredCircles, setUnfilteredCircles] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const mapOnly = searchParams.get("mapOnly") === "true";
    const { circleId } = useParams();

    const getCircleTypes = (sourceType, targetType) => {
        const types = [sourceType, targetType];
        return types.sort().join("_");
    };

    useEffect(() => {
        log("Circles.useEffect 1", 0);
        if (!circle?.type || !circleConnections) {
            setUnfilteredCircles([]);
            return;
        }

        // filter connections
        const circleTypes = getCircleTypes(circle.type, type);
        setUnfilteredCircles(circleConnections.filter((x) => x.circle_types === circleTypes).map((x) => x.display_circle));
    }, [circleConnections, circleId, type, circle?.type]);

    useEffect(() => {
        log("Circles.useEffect 2", 0);
        if (!unfilteredCircles) {
            setCircles([]);
            return;
        }

        let listCircles = !filterConnected ? unfilteredCircles : unfilteredCircles.filter((x) => user?.connections?.some((y) => y.target.id === x.id));

        if (type === "event") {
            // filter all past events
            let startDate = getDateWithoutTime(); // today
            listCircles = listCircles.filter((x) => fromFsDate(x.starts_at) > startDate);
        }

        if (!userLocation) {
            setCircles(listCircles);
            return;
        }

        let newFilteredCircles = [];
        if (userLocation.latitude && userLocation.longitude) {
            for (var circle of listCircles.filter((x) => x.base)) {
                var circleLocation = getLatlng(circle.base);
                var preciseDistance = getPreciseDistance(userLocation, circleLocation);
                newFilteredCircles.push({ ...circle, distance: preciseDistance });
            }

            newFilteredCircles.sort((a, b) => a.distance - b.distance);
            for (var circlesWithNoBase of listCircles.filter((x) => !x.base)) {
                newFilteredCircles.push(circlesWithNoBase);
            }
        } else {
            newFilteredCircles = listCircles;
        }

        if (type === "event") {
            // TODO if event we just sort by date and ignore proximity for now
            newFilteredCircles.sort((a, b) => fromFsDate(a.starts_at) - fromFsDate(b.starts_at));
        }

        setCircles(newFilteredCircles);
    }, [unfilteredCircles, userLocation, setCircles, user?.connections, filterConnected, type]);

    useEffect(() => {
        log("Circles.useEffect 3", 0);
        let circleId = circle?.id;
        if (!user?.id || !circleId) return;
        if (circleId === "earth") return;

        log("Circles.seen");

        // mark circles as seen
        axios
            .post(`/seen`, {
                category: `${type}s`,
                circleId: circleId,
            })
            .then((x) => {})
            .catch((error) => {});
    }, [user?.id, circle?.id, type]);

    //#region components

    const CircleMapItem = ({ item, onClick }) => {
        const user = useContext(UserContext);

        return (
            <Box
                key={item.id}
                className="circleItem"
                align="center"
                width="157px"
                height="220px"
                borderRadius="13px"
                role="group"
                color="black"
                cursor="pointer"
                border="0px solid #ebebeb"
                bg="white"
                _hover={{
                    bg: "#fdfdfd",
                    color: "black",
                }}
                overflow="hidden"
                position="relative"
                boxShadow="md"
                margin="5px"
                flexShrink="0"
            >
                <Box height="40%" backgroundColor="#b9b9b9" overflow="hidden">
                    <CircleCover circle={item} coverWidth={157} />
                </Box>
                <Box height="44px" position="relative" top="-22px">
                    <CirclePicture circle={item} size={44} />
                </Box>

                <VStack align="center" spacing="0px" marginTop="-22px">
                    <Text className="circle-list-title" fontSize="12px" fontWeight="700">
                        {item.name}
                    </Text>
                    <Box>
                        <Box marginLeft="2px" marginRight="2px">
                            <Text fontSize="10px">{item.description}</Text>
                        </Box>
                    </Box>
                </VStack>
                <Box position="absolute" onClick={onClick} top="0px" left="0px" width="157px" height="220px" />
                {item.distance && (
                    <Flex
                        position="absolute"
                        top="5px"
                        right="5px"
                        borderRadius="20px"
                        height="20px"
                        backgroundColor="#c242bb"
                        paddingLeft="2px"
                        paddingRight="5px"
                        align="center"
                        flexDirection="row"
                        justifyContent="center"
                        onClick={() => focusItem(item)}
                    >
                        <Icon width="12px" height="12px" color="white" as={RiMapPinFill} cursor="pointer" marginRight="2px" />
                        <Text fontWeight="700" color="#fff" fontSize="12px">
                            {getDistanceString(item.distance)}
                        </Text>
                    </Flex>
                )}
            </Box>
        );
    };

    //#endregion

    return displayMode === "map" && isMobile ? (
        <>
            <CircleHeader
                circle={circle}
                setCircle={setCircle}
                createNew={() => navigate(routes.circle(circle.id).new)}
                filterConnected={filterConnected}
                setFilterConnected={setFilterConnected}
                title={type}
                onConnect={onConnect}
            />
            <Flex
                flexGrow="1"
                flexDirection="row"
                width="100%"
                height="230px"
                align="center"
                position="absolute"
                bottom="3px"
                left="0px"
                overflowX="auto"
                overflowY="hidden"
                zIndex="15"
                paddingLeft="15px"
            >
                {circles?.map((item) => (
                    <CircleMapItem key={item.id} item={item} onClick={() => openCircle(navigate, user, item.id, circle, setCircle)} />
                ))}
            </Flex>
        </>
    ) : (
        <>
            {!mapOnly && (
                <Box flexGrow="1" width="100%" height="100%" align="center" position="relative" top="0px" left="0px">
                    <Flex width="100%" flexDirection="column" flexWrap="nowrap">
                        <CircleHeader
                            circle={circle}
                            setCircle={setCircle}
                            createNew={() => navigate(routes.circle(circle.id).new)}
                            filterConnected={filterConnected}
                            setFilterConnected={setFilterConnected}
                            title={type}
                            onConnect={onConnect}
                        />
                        {circles?.length > 0 && <Box height="1px" backgroundColor="#ebebeb" />}

                        {circles?.map((item) => (
                            <CircleListItem
                                key={item.id}
                                item={item}
                                setCircle={setCircle}
                                onClick={() => openCircle(navigate, user, item.id, circle, setCircle)}
                                focusItem={focusItem}
                                onConnect={onConnect}
                            />
                        ))}

                        {circles?.length <= 0 && (
                            <Text marginLeft="12px" marginTop="10px" alignSelf="start">
                                {i18n.t(`No ${type}s`)}
                            </Text>
                        )}
                    </Flex>
                </Box>
            )}
        </>
    );
};

export default Circles;
