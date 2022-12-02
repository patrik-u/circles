// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box, Image, Input, Flex, InputGroup, InputLeftElement, SimpleGrid, Text, Button, InputRightElement, Icon } from "@chakra-ui/react";
import { CirclePicture } from "components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "components/Helpers";
import { openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { HiOutlineSearch } from "react-icons/hi";
import { MdOutlineClose } from "react-icons/md";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, searchResultsShownAtom } from "components/Atoms";
import { auth } from "components/Firebase";
import { signOut } from "firebase/auth";
import config from "Config";
import CircleListItem from "components/CircleListItem";
import i18n from "i18n/Localization";

import algoliasearch from "algoliasearch/lite";
import { InstantSearch, Hits, RefinementList, useInstantSearch, useSearchBox, useConnector, useHits } from "react-instantsearch-hooks-web";
// #endregion

const searchClient = algoliasearch(config.algoliaId, config.algoliaSearchKey);

const SearchHit = ({ hit, onClick }) => {
    const navigate = useNavigateNoUpdates();
    const [isMobile] = useAtom(isMobileAtom);

    const onHitClick = () => {
        openCircle(navigate, hit.objectID);
        if (onClick) {
            onClick();
        }
    };

    return <CircleListItem minWidth={isMobile ? "none" : "450px"} item={hit} onClick={() => onHitClick()} />;
};

const SearchHits = ({ onClick, ...props }) => {
    const { hits } = useHits(props);
    const [isMobile] = useAtom(isMobileAtom);

    return (
        <Flex flexDirection="column" {...props}>
            {hits.length <= 0 && (
                <Box backgroundColor="white" height="40px" minWidth={isMobile ? "none" : "450px"}>
                    <Text marginLeft="10px">No results</Text>
                </Box>
            )}

            {hits.map((x) => (
                <SearchHit key={x.objectID} hit={x} onClick={onClick} />
            ))}
        </Flex>
    );
};

export const SearchBox = ({ hidePlaceholder, size = "md", autofocus = false, query, setQuery, setSearchIsOpen, children, ...props }) => {
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

    const closeClick = () => {
        setQuery("");
        if (setSearchIsOpen) {
            setSearchIsOpen(false);
        }
    };

    return (
        <InputGroup {...props}>
            <InputLeftElement
                color="gray.300"
                pointerEvents="none"
                children={<HiOutlineSearch size={isMobile ? 20 : 28} />}
                height={isSmall ? "30px" : "50px"}
                marginLeft={isSmall ? "10px" : "20px"}
            />
            <Input
                paddingLeft={isSmall ? "30px" : "65px"}
                borderRadius="50px"
                height={isSmall ? "30px" : "50px"}
                width="100%"
                marginLeft="15px"
                marginRight="15px"
                value={query}
                onChange={handleChange}
                focusBorderColor="pink.400"
                placeholder={hidePlaceholder ? "" : i18n.t("Type search terms or enter URL")}
                _placeholder={{
                    fontSize: isSmall ? "10px" : isMobile ? "16px" : "22px",
                    height: isSmall ? "30px" : "50px",
                    textAlign: "center",
                    paddingRight: "32px",
                }}
                autoFocus={autofocus}
            />
            {(query || (isMobile && size === "sm")) && (
                <InputRightElement
                    color="gray.300"
                    children={<MdOutlineClose size={isSmall ? 20 : 28} />}
                    height={isSmall ? "30px" : "50px"}
                    marginRight={isSmall ? "10px" : "20px"}
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

export const MobileSearchBox = (props) => {
    const [searchIsOpen, setSearchIsOpen] = useState(false);
    const iconSize = "24px";
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

    return (
        <>
            <Box position="relative" height={iconSize} {...props}>
                <Icon
                    width={iconSize}
                    height={iconSize}
                    color={"#333"}
                    _hover={{ color: "#e6e6e6", transform: "scale(1.1)" }}
                    _active={{ transform: "scale(0.98)" }}
                    as={HiOutlineSearch}
                    onClick={openSearch}
                    cursor="pointer"
                />
            </Box>
            {searchIsOpen && (
                <Box zIndex="55" margin="0px" padding="0px" position="absolute" top="40px" left="0px" width="100%" height="40px" backgroundColor="white">
                    <CircleSearchBox
                        size="sm"
                        hidePlaceholder={true}
                        popover={true}
                        maxWidth="450px"
                        setSearchIsOpen={setSearchIsOpen}
                        onHitClick={onHitClick}
                        autofocus={true}
                    />
                </Box>
            )}
        </>
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
            <SearchBox size={size} autofocus={autofocus} hidePlaceholder={hidePlaceholder} query={query} setQuery={setQuery} {...props}>
                {popover && !isMobile && (
                    <EmptyQueryBoundary fallback={fallback}>
                        <Flex
                            position="absolute"
                            top="55px"
                            width="100%"
                            justifyContent="center"
                            alignItems="center"
                            borderRadius="20px"
                            borderWidth="1px"
                            borderColor="#e2e8f0"
                            overflow="hidden"
                            backgroundColor="white"
                        >
                            <Box width="450px" maxWidth="450px" minWidth="450px">
                                <SearchHits onClick={hitClick} />
                            </Box>
                        </Flex>
                    </EmptyQueryBoundary>
                )}
            </SearchBox>

            {popover && isMobile && (
                <EmptyQueryBoundary fallback={fallback}>
                    <Box position="absolute" width="100%" top="40px" left="0px" height="calc(100vh - 40px)" overflowY="scroll">
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

export default CircleSearchBox;
