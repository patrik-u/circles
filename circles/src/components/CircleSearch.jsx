// #region imports
import React, { useState, useEffect } from "react";
import {
    Box,
    HStack,
    Input,
    Flex,
    InputGroup,
    InputLeftElement,
    Text,
    InputRightElement,
    Icon,
    Tag,
    TagLabel,
    TagCloseButton,
    Tooltip,
    Spinner,
} from "@chakra-ui/react";
import { openCircle } from "@/components/Navigation";
import { useNavigateNoUpdates } from "@/components/RouterUtils";
import { log } from "@/components/Helpers";
import { HiOutlineSearch } from "react-icons/hi";
import { MdOutlineClose } from "react-icons/md";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    searchResultsShownAtom,
    semanticSearchCirclesAtom,
    toggleWidgetEventAtom,
    circlesFilterAtom,
} from "@/components/Atoms";
import config from "@/Config";
import CircleListItem from "@/components/CircleListItem";
import i18n from "@/i18n/Localization";
import axios from "axios";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, useInstantSearch, useSearchBox, useHits } from "react-instantsearch-hooks-web";
import { RiSearchEyeLine, RiSearchLine } from "react-icons/ri";
import { FaRegLightbulb } from "react-icons/fa";
// #endregion

const searchClient = algoliasearch(config.algoliaId, config.algoliaSearchKey);

const SearchHit = ({
    hit,
    onClick,
    minWidth = "450px",
    maxWidth = null,
    condensed = false,
    openCircleOnClick = true,
}) => {
    const navigate = useNavigateNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);

    const onHitClick = () => {
        if (openCircleOnClick) {
            openCircle(navigate, { id: hit.objectID, host: "circles" });
            setToggleWidgetEvent({ name: "about", value: true });
        }
        if (onClick) {
            log("Search hit click: " + hit.objectID, 0, true);
            onClick(hit);
        }
    };

    return (
        <CircleListItem
            minWidth={isMobile ? "none" : minWidth}
            inSelect={true}
            item={hit}
            onClick={() => onHitClick()}
            maxWidth={maxWidth ?? "450px"}
            condensed={condensed}
        />
    );
};

const SearchHits = ({
    onClick,
    openCircleOnClick = true,
    minWidth = "450px",
    maxWidth = null,
    condensed = false,
    ...props
}) => {
    const { hits } = useHits(props);
    const [isMobile] = useAtom(isMobileAtom);

    return (
        <Flex flexDirection="column" justifyContent="center" alignItems="center" overflow="hidden" {...props}>
            {!condensed && (
                <Box border="1px" borderColor="gray.200" borderRadius="md" p={4} mt={2} bg="white">
                    <Text>
                        <Icon as={FaRegLightbulb} color="yellow.400" w={5} h={5} mr={2} />
                        Type in{" "}
                        <Text as="span" fontWeight="bold">
                            what you are looking for
                        </Text>{" "}
                        and press 'Enter' for a full semantic search.
                        <Text as="span" color="gray.500" ml={2}>
                            <br />
                            E.g., "circles that need help with volunteering"
                        </Text>
                    </Text>
                </Box>
            )}
            <Flex
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                borderRadius="20px"
                borderWidth="1px"
                borderColor="#e2e8f0"
                overflow="hidden"
                backgroundColor="white"
                mt={"4px"}
            >
                {!condensed && (
                    <Box fontWeight="700" marginTop="5px" marginBottom="5px">
                        Quick suggestions
                    </Box>
                )}
                {hits.length <= 0 && (
                    <Box
                        backgroundColor="white"
                        height="60px"
                        minWidth={isMobile ? "none" : minWidth}
                        maxWidth={isMobile ? "none" : maxWidth ?? "none"}
                    >
                        <Text marginLeft="10px">
                            {!condensed
                                ? "No quick suggestions. Type 'Enter' for a deeper semantic search."
                                : "No matches"}
                        </Text>
                    </Box>
                )}

                {hits.slice(0, 5).map((x) => (
                    <SearchHit
                        key={x.objectID}
                        hit={x}
                        onClick={onClick}
                        openCircleOnClick={openCircleOnClick}
                        condensed={condensed}
                        minWidth={minWidth}
                        maxWidth={maxWidth}
                    />
                ))}
            </Flex>
        </Flex>
    );
};

export const SearchBox = ({
    hidePlaceholder,
    size = "md",
    autofocus = false,
    query,
    setQuery,
    setSearchIsOpen,
    children,
    onSemanticSearch,
    canClose = true,
    ...props
}) => {
    const { refine } = useSearchBox();
    const [isMobile] = useAtom(isMobileAtom);
    const [, setSearchResultsShown] = useAtom(searchResultsShownAtom);
    const isSmall = size === "sm";

    useEffect(() => {
        refine(query);
        setSearchResultsShown(query.length > 0);
    }, [query, setSearchResultsShown, refine]);

    useEffect(() => {}, []);

    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.keyCode === 13) {
            onSemanticSearch(e.target.value);
            setQuery("");
        }
    };

    const closeClick = () => {
        setQuery("");
        if (setSearchIsOpen) {
            setSearchIsOpen(false);
        }
    };

    return (
        <InputGroup {...props}>
            <InputLeftElement
                color="#333"
                pointerEvents="none"
                children={<RiSearchLine size={isMobile ? 20 : 28} />}
                height={isSmall ? "30px" : "38px"}
            />
            <Input
                borderRadius="50px"
                height={isSmall ? "30px" : "38px"}
                backgroundColor="#f4f4f4dd"
                width="100%"
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                focusBorderColor="pink.400"
                color="#333"
                placeholder={hidePlaceholder ? "" : i18n.t("E.g. people that like cats")}
                autoFocus={autofocus}
            />
            {canClose && (
                <InputRightElement
                    color="#333"
                    children={<MdOutlineClose size={isSmall ? 20 : 28} />}
                    height={isSmall ? "30px" : "38px"}
                    marginRight={isSmall ? "6px" : "5px"}
                    onClick={closeClick}
                    cursor="pointer"
                />
            )}
            {children}
        </InputGroup>
    );
};

const EmptyQueryBoundary = ({ children, fallback }) => {
    const { indexUiState } = useInstantSearch();

    if (!indexUiState.query) {
        return fallback;
    }
    return children;
};

const CircleMentionsQuery = ({ query }) => {
    const { refine } = useSearchBox();

    useEffect(() => {
        refine(query);
    }, [query, refine]);
};

export const CircleMention = ({ onMention, query, fallback = null }) => {
    const [isMobile] = useAtom(isMobileAtom);

    return (
        <InstantSearch searchClient={searchClient} indexName={config.algoliaCirclesIndex}>
            <CircleMentionsQuery query={query} />
            <EmptyQueryBoundary fallback={fallback}>
                <Flex position="absolute" bottom="50px" zIndex="100">
                    <Box width="380px" maxWidth="380px" minWidth="none">
                        <SearchHits
                            onClick={onMention}
                            openCircleOnClick={false}
                            condensed={true}
                            minWidth={"380px"}
                            maxWidth={"380px"}
                        />
                    </Box>
                </Flex>
            </EmptyQueryBoundary>
        </InstantSearch>
    );
};

export const CircleSearchBox = ({
    children,
    size = "md",
    popover,
    hidePlaceholder,
    searchActive,
    onHitClick,
    setSearchActive,
    onSemanticSearch,
    autofocus = false,
    fallback = null,
    canClose = true,
    ...props
}) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [query, setQuery] = useState("");
    const hitClick = () => {
        setQuery("");
        if (onHitClick) {
            onHitClick();
        }
    };

    return (
        <InstantSearch searchClient={searchClient} indexName={config.algoliaCirclesIndex}>
            <SearchBox
                size={size}
                autofocus={autofocus}
                hidePlaceholder={hidePlaceholder}
                query={query}
                setQuery={setQuery}
                onSemanticSearch={onSemanticSearch}
                canClose={canClose}
                {...props}
            >
                {popover && !isMobile && (
                    <EmptyQueryBoundary fallback={fallback}>
                        <Flex position="absolute" top="35px">
                            <Box width="450px" maxWidth="450px" minWidth="450px">
                                <SearchHits onClick={hitClick} />
                            </Box>
                        </Flex>
                    </EmptyQueryBoundary>
                )}
            </SearchBox>

            {popover && isMobile && (
                <EmptyQueryBoundary fallback={fallback}>
                    <Box
                        position="absolute"
                        width="100%"
                        top="40px"
                        left="0px"
                        height="calc(100vh - 40px)"
                        overflowY="scroll"
                        backgroundColor="white"
                    >
                        <SearchHits onClick={onHitClick} />
                    </Box>
                </EmptyQueryBoundary>
            )}

            {!popover && (
                <EmptyQueryBoundary fallback={fallback}>
                    <SearchHits marginTop="10px" />
                </EmptyQueryBoundary>
            )}

            {children}
        </InstantSearch>
    );
};

export const CircleSearchBoxIcon = (props) => {
    const [searchIsOpen, setSearchIsOpen] = useState(false);
    const [isMobile] = useAtom(isMobileAtom);
    const [semanticSearchCircles, _setSemanticSearchCircles] = useAtom(semanticSearchCirclesAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);

    const iconSize = "26px";
    const openSearch = () => {
        if (searchIsOpen) {
            setSearchIsOpen(false);
        } else {
            setSearchIsOpen(true);
        }
    };
    const onHitClick = () => {
        setSearchIsOpen(false);
    };

    const getRandomColor = () => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return { r, g, b };
    };

    const getLuminance = (r, g, b) => {
        const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const getContrastRatio = (luminance) => {
        const l1 = 1; // luminance of white
        const l2 = luminance;
        return (l1 + 0.05) / (l2 + 0.05);
    };

    const rgbToHex = (r, g, b) => {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    };

    const generateColorForWhiteText = () => {
        let color = getRandomColor();
        let luminance = getLuminance(color.r, color.g, color.b);
        let contrastRatio = getContrastRatio(luminance);

        while (contrastRatio < 4.5) {
            color = getRandomColor();
            luminance = getLuminance(color.r, color.g, color.b);
            contrastRatio = getContrastRatio(luminance);
        }

        return rgbToHex(color.r, color.g, color.b);
    };

    const onSemanticSearch = (query) => {
        setSearchIsOpen(false);

        // check so query isn't already in list
        if (semanticSearchCircles.find((x) => x.query === query)) {
            return;
        }

        // show tag with current semantic query
        //openCircle(navigate, { id: query, host: "circles" });

        // do semantic search
        const randomColor = generateColorForWhiteText();
        setSemanticSearchCircles([
            ...semanticSearchCircles,
            { query: query, circles: [], loading: true, color: randomColor, index: semanticSearchCircles.length },
        ]);

        // call api to do semantic search
        axios.post("/search", { query: query, topK: 10 }).then(
            (res) => {
                let data = res?.data;
                if (!data || data.error) {
                    setSemanticSearchCircles(
                        semanticSearchCircles.map((y) => {
                            if (y.query === query) {
                                return { ...y, loading: false, error: true };
                            }
                            return y;
                        })
                    );
                    return;
                }

                // log("Semantic search results: " + data.circles?.length, 0, true);
                // log(JSON.stringify(data.circles, null, 2));

                setSemanticSearchCircles((x) =>
                    x.map((y) => {
                        if (y.query === query) {
                            return { ...y, circles: data.circles, loading: false };
                        }
                        return y;
                    })
                );

                // open discover in search category
                setCirclesFilter({ ...circlesFilter, categories: ["search"] });
                setToggleWidgetEvent({ name: "discover", value: true });
            },
            (error) => {
                setSemanticSearchCircles(
                    semanticSearchCircles.map((y) => {
                        if (y.query === query) {
                            return { ...y, loading: false, error: true };
                        }
                        return y;
                    })
                );

                log(JSON.stringify(error), 0);
            }
        );
    };

    const onSemanticSearchClear = (item) => {
        setSemanticSearchCircles(semanticSearchCircles.filter((x) => x.query !== item.query));
    };

    const setSemanticSearchCircles = (circles) => {
        // TODO calculate colors and filter duplicate circles
        _setSemanticSearchCircles(circles);
    };

    return (
        <Tooltip label="Search circles" placement="bottom">
            <Box>
                <Box position="relative" height={iconSize} {...props}>
                    <Icon
                        width={iconSize}
                        height={iconSize}
                        color={"white"}
                        _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                        _active={{ transform: "scale(0.98)" }}
                        as={RiSearchEyeLine}
                        onClick={openSearch}
                        cursor="pointer"
                    />
                </Box>
                {semanticSearchCircles.length > 0 && (
                    <Flex
                        zIndex="55"
                        margin="0px"
                        padding="0px"
                        position="absolute"
                        top={isMobile ? "40px" : "60px"}
                        left="0px"
                        width="100%"
                        height="40px"
                        pointerEvents={"none"}
                        alignItems="center"
                        justifyContent="center"
                    >
                        <HStack>
                            {semanticSearchCircles.map((item) => (
                                <Tag
                                    key={item.query}
                                    size={"md"}
                                    borderRadius="full"
                                    variant="solid"
                                    backgroundColor={item.color}
                                    pointerEvents="auto"
                                >
                                    {item.loading ? (
                                        <Spinner size={"xs"} marginRight="5px" />
                                    ) : (
                                        <Icon as={RiSearchEyeLine} marginRight="5px" />
                                    )}

                                    <TagLabel>{item.query}</TagLabel>
                                    <TagCloseButton onClick={() => onSemanticSearchClear(item)} />
                                </Tag>
                            ))}
                        </HStack>
                    </Flex>
                )}

                {searchIsOpen && (
                    <Box
                        zIndex="55"
                        margin="0px"
                        padding="0px"
                        position="absolute"
                        top={isMobile ? "40px" : "60px"}
                        left="0px"
                        width="100%"
                        height="40px"
                        pointerEvents={"none"}
                    >
                        <CircleSearchBox
                            size={isMobile ? "sm" : "md"}
                            hidePlaceholder={false}
                            popover={true}
                            maxWidth="450px"
                            setSearchIsOpen={setSearchIsOpen}
                            onHitClick={onHitClick}
                            autofocus={true}
                            pointerEvents={"auto"}
                            onSemanticSearch={onSemanticSearch}
                        />
                    </Box>
                )}
            </Box>
        </Tooltip>
    );
};

export const CircleSearcher = (props) => {
    const [searchIsOpen, setSearchIsOpen] = useState(true);
    const [isMobile] = useAtom(isMobileAtom);
    const [semanticSearchCircles, _setSemanticSearchCircles] = useAtom(semanticSearchCirclesAtom);
    const [circlesFilter, setCirclesFilter] = useAtom(circlesFilterAtom);
    const [, setToggleWidgetEvent] = useAtom(toggleWidgetEventAtom);

    const iconSize = "26px";
    const openSearch = () => {
        if (searchIsOpen) {
            setSearchIsOpen(false);
        } else {
            setSearchIsOpen(true);
        }
    };
    const onHitClick = () => {
        setSearchIsOpen(false);
    };

    const getRandomColor = () => {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return { r, g, b };
    };

    const getLuminance = (r, g, b) => {
        const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const getContrastRatio = (luminance) => {
        const l1 = 1; // luminance of white
        const l2 = luminance;
        return (l1 + 0.05) / (l2 + 0.05);
    };

    const rgbToHex = (r, g, b) => {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    };

    const generateColorForWhiteText = () => {
        let color = getRandomColor();
        let luminance = getLuminance(color.r, color.g, color.b);
        let contrastRatio = getContrastRatio(luminance);

        while (contrastRatio < 4.5) {
            color = getRandomColor();
            luminance = getLuminance(color.r, color.g, color.b);
            contrastRatio = getContrastRatio(luminance);
        }

        return rgbToHex(color.r, color.g, color.b);
    };

    const onSemanticSearch = (query) => {
        setSearchIsOpen(false);

        // check so query isn't already in list
        if (semanticSearchCircles.find((x) => x.query === query)) {
            return;
        }

        // show tag with current semantic query
        //openCircle(navigate, { id: query, host: "circles" });

        // do semantic search
        const randomColor = generateColorForWhiteText();
        setSemanticSearchCircles([
            ...semanticSearchCircles,
            { query: query, circles: [], loading: true, color: randomColor, index: semanticSearchCircles.length },
        ]);

        // call api to do semantic search
        axios.post("/search", { query: query, topK: 10 }).then(
            (res) => {
                let data = res?.data;
                if (!data || data.error) {
                    setSemanticSearchCircles(
                        semanticSearchCircles.map((y) => {
                            if (y.query === query) {
                                return { ...y, loading: false, error: true };
                            }
                            return y;
                        })
                    );
                    return;
                }

                // log("Semantic search results: " + data.circles?.length, 0, true);
                // log(JSON.stringify(data.circles, null, 2));

                setSemanticSearchCircles((x) =>
                    x.map((y) => {
                        if (y.query === query) {
                            return { ...y, circles: data.circles, loading: false };
                        }
                        return y;
                    })
                );

                // open discover in search category
                setCirclesFilter({ ...circlesFilter, categories: ["search"] });
                setToggleWidgetEvent({ name: "discover", value: true });
            },
            (error) => {
                setSemanticSearchCircles(
                    semanticSearchCircles.map((y) => {
                        if (y.query === query) {
                            return { ...y, loading: false, error: true };
                        }
                        return y;
                    })
                );

                log(JSON.stringify(error), 0);
            }
        );
    };

    const onSemanticSearchClear = (item) => {
        setSemanticSearchCircles(semanticSearchCircles.filter((x) => x.query !== item.query));
    };

    const setSemanticSearchCircles = (circles) => {
        // TODO calculate colors and filter duplicate circles
        _setSemanticSearchCircles(circles);
    };

    return (
        <Flex flexGrow="1">
            <Box zIndex="55" margin="10px" padding="0px" left="0px" width="100%" height="40px" pointerEvents={"none"}>
                <CircleSearchBox
                    size={isMobile ? "sm" : "md"}
                    hidePlaceholder={true}
                    popover={true}
                    setSearchIsOpen={setSearchIsOpen}
                    onHitClick={onHitClick}
                    autofocus={true}
                    pointerEvents={"auto"}
                    onSemanticSearch={onSemanticSearch}
                    canClose={false}
                />
                {semanticSearchCircles.length > 0 && (
                    <Flex
                        zIndex="55"
                        margin="0px"
                        padding="0px"
                        left="0px"
                        width="100%"
                        height="40px"
                        pointerEvents={"none"}
                        alignItems="center"
                        justifyContent="left"
                    >
                        <HStack>
                            {semanticSearchCircles.map((item) => (
                                <Tag
                                    key={item.query}
                                    size={"md"}
                                    borderRadius="full"
                                    variant="solid"
                                    backgroundColor={item.color}
                                    pointerEvents="auto"
                                >
                                    {item.loading ? (
                                        <Spinner size={"xs"} marginRight="5px" />
                                    ) : (
                                        <Icon as={RiSearchLine} marginRight="5px" />
                                    )}

                                    <TagLabel>{item.query}</TagLabel>
                                    <TagCloseButton onClick={() => onSemanticSearchClear(item)} />
                                </Tag>
                            ))}
                        </HStack>
                    </Flex>
                )}
            </Box>
        </Flex>
    );
};

export default CircleSearchBox;
