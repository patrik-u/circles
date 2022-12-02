// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box, Image, Input, Flex, InputGroup, InputLeftElement, SimpleGrid, Text, Button, InputRightElement } from "@chakra-ui/react";
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

    return (
        <Flex flexDirection="column">
            {hits.map((x) => (
                <SearchHit key={x.objectID} hit={x} onClick={onClick} />
            ))}
        </Flex>
    );
};

export const SearchBox = ({ hidePlaceholder, query, setQuery, children, ...props }) => {
    const { refine } = useSearchBox();
    const [isMobile] = useAtom(isMobileAtom);
    const [, setSearchResultsShown] = useAtom(searchResultsShownAtom);

    useEffect(() => {
        refine(query);
        setSearchResultsShown(query.length > 0);
    }, [query, setSearchResultsShown, refine]);

    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    return (
        <InputGroup {...props}>
            <InputLeftElement color="gray.300" pointerEvents="none" children={<HiOutlineSearch size={28} />} height="50px" marginLeft="20px" />
            <Input
                paddingLeft="65px"
                borderRadius="50px"
                height="50px"
                width="100%"
                marginLeft="15px"
                marginRight="15px"
                value={query}
                onChange={handleChange}
                focusBorderColor="pink.400"
                placeholder={hidePlaceholder ? "" : i18n.t("Type search terms or enter URL")}
                _placeholder={{ fontSize: isMobile ? "16px" : "22px", height: "50px", textAlign: "center", paddingRight: "32px" }}
            />
            {query && (
                <InputRightElement
                    color="gray.300"
                    children={<MdOutlineClose size={28} />}
                    height="50px"
                    marginRight="20px"
                    onClick={() => setQuery("")}
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

export const CircleSearchBox = ({ children, popover, hidePlaceholder, fallback = null, ...props }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const [query, setQuery] = useState("");
    const onHitClick = () => {
        setQuery("");
    };

    return (
        <InstantSearch searchClient={searchClient} indexName={config.algoliaCirclesIndex}>
            <SearchBox hidePlaceholder={hidePlaceholder} query={query} setQuery={setQuery} {...props}>
                {popover && !isMobile && (
                    <EmptyQueryBoundary fallback={fallback}>
                        {/* <RefinementList attribute="type" /> */}
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
                                <SearchHits onClick={onHitClick} />
                            </Box>
                        </Flex>
                    </EmptyQueryBoundary>
                )}
            </SearchBox>

            {popover && isMobile && (
                <EmptyQueryBoundary fallback={fallback}>
                    <Box position="absolute" width="100%" top="40px" left="0px" height="calc(100vh - 40px)" overflowY="scroll">
                        {/* <RefinementList attribute="type" /> */}
                        <SearchHits onClick={onHitClick} />
                    </Box>
                </EmptyQueryBoundary>
            )}

            {!popover && (
                <EmptyQueryBoundary fallback={fallback}>
                    {/* <RefinementList attribute="type" /> */}
                    <SearchHits />
                </EmptyQueryBoundary>
            )}

            {children}
        </InstantSearch>
    );
};

export default CircleSearchBox;
