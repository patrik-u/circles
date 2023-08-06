// #region imports
import React, { useState, useEffect } from "react";
import { Box, Input, Flex, InputGroup, InputLeftElement, Text, InputRightElement, Icon, Tag, TagLabel, TagCloseButton, Spinner } from "@chakra-ui/react";
import { openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { log } from "components/Helpers";
import { HiOutlineSearch } from "react-icons/hi";
import { MdOutlineClose } from "react-icons/md";
import { useAtom } from "jotai";
import { isMobileAtom, searchResultsShownAtom, semanticSearchCirclesAtom } from "components/Atoms";
import config from "Config";
import CircleListItem from "components/CircleListItem";
import i18n from "i18n/Localization";
import axios from "axios";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch, useInstantSearch, useSearchBox, useHits } from "react-instantsearch-hooks-web";
import { RiSearchEyeLine } from "react-icons/ri";
import { FaRegLightbulb } from "react-icons/fa";
// #endregion

const searchClient = algoliasearch(config.algoliaId, config.algoliaSearchKey);

const SearchHit = ({ hit, onClick }) => {
    const navigate = useNavigateNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);

    const onHitClick = () => {
        openCircle(navigate, { id: hit.objectID, host: "circles" });
        if (onClick) {
            onClick();
        }
    };

    return <CircleListItem minWidth={isMobile ? "none" : "450px"} inSelect={true} item={hit} onClick={() => onHitClick()} />;
};

const SearchHits = ({ onClick, ...props }) => {
    const { hits } = useHits(props);
    const [isMobile] = useAtom(isMobileAtom);

    return (
        <Flex flexDirection="column" justifyContent="center" alignItems="center" overflow="hidden" {...props}>
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
                <Box fontWeight="700" marginTop="5px" marginBottom="5px">
                    Quick suggestions
                </Box>
                {hits.length <= 0 && (
                    <Box backgroundColor="white" height="60px" minWidth={isMobile ? "none" : "450px"}>
                        <Text marginLeft="10px">No quick suggestions. Type 'Enter' for a deeper semantic search.</Text>
                    </Box>
                )}

                {hits.slice(0, 5).map((x) => (
                    <SearchHit key={x.objectID} hit={x} onClick={onClick} />
                ))}
            </Flex>
        </Flex>
    );
};

export const SearchBox = ({ hidePlaceholder, size = "md", autofocus = false, query, setQuery, setSearchIsOpen, children, onSemanticSearch, ...props }) => {
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
            <InputLeftElement color="#333" pointerEvents="none" children={<RiSearchEyeLine size={isMobile ? 20 : 28} />} height={isSmall ? "30px" : "38px"} />
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
                // _placeholder={{
                //     fontSize: isSmall ? "10px" : isMobile ? "16px" : "22px",
                //     height: isSmall ? "30px" : "38px",
                //     textAlign: "center",
                //     paddingRight: "32px",
                // }}
                autoFocus={autofocus}
            />
            <InputRightElement
                color="#333"
                children={<MdOutlineClose size={isSmall ? 20 : 28} />}
                height={isSmall ? "30px" : "38px"}
                marginRight={isSmall ? "6px" : "5px"}
                onClick={closeClick}
                cursor="pointer"
            />
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
                    <Box position="absolute" width="100%" top="40px" left="0px" height="calc(100vh - 40px)" overflowY="scroll" backgroundColor="white">
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
    const [semanticSearchQuery, setSemanticSearchQuery] = useState(null);
    const [semanticSearchLoading, setSemanticSearchLoading] = useState(false);
    const [, setSemanticSearchCirclesAtom] = useAtom(semanticSearchCirclesAtom);

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

    const onSemanticSearch = (query) => {
        setSearchIsOpen(false);
        setSemanticSearchQuery(!query ? "recommended" : query);
        // show tag with current semantic query
        //openCircle(navigate, { id: query, host: "circles" });

        // do semantic search
        setSemanticSearchLoading(true);

        // call api to do semantic search
        axios.post("/search", { query: query }).then(
            (res) => {
                let data = res?.data;
                if (!data || data.error) {
                    setSemanticSearchCirclesAtom([]);
                    return;
                }

                // log("Semantic search results: " + data.circles?.length, 0, true);
                // log(JSON.stringify(data.circles, null, 2));
                setSemanticSearchCirclesAtom(data.circles);
                setSemanticSearchLoading(false);
            },
            (error) => {
                log(JSON.stringify(error), 0);
                setSemanticSearchCirclesAtom([]);
            }
        );
    };

    const onSemanticSearchClear = () => {
        setSemanticSearchQuery(null);
        setSemanticSearchCirclesAtom(null);
    };

    return (
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
            {semanticSearchQuery && (
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
                    <Tag size={"md"} borderRadius="full" variant="solid" colorScheme="purple" pointerEvents="auto">
                        {semanticSearchLoading ? <Spinner size={"xs"} marginRight="5px" /> : <Icon as={RiSearchEyeLine} marginRight="5px" />}

                        <TagLabel>{semanticSearchQuery}</TagLabel>
                        <TagCloseButton onClick={onSemanticSearchClear} />
                    </Tag>
                </Box>
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
    );
};

export default CircleSearchBox;
