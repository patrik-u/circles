// #region imports
import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import ReactFlow, { MiniMap, Controls, useNodesState, useEdgesState, addEdge, Handle, Position } from "reactflow";
import { Box, Image, Input, Flex, InputGroup, InputLeftElement, SimpleGrid, Text, Button } from "@chakra-ui/react";
import { CirclePicture } from "components/CircleElements";
import { getImageKitUrl, log, singleLineEllipsisStyle } from "components/Helpers";
import { openCircle } from "components/Navigation";
import { useNavigateNoUpdates } from "components/RouterUtils";
import { HiOutlineSearch } from "react-icons/hi";
import { useAtom } from "jotai";
import { isMobileAtom, userAtom, userDataAtom, showNetworkLogoAtom, searchResultsShownAtom } from "components/Atoms";
import { auth } from "components/Firebase";
import { signOut } from "firebase/auth";
import config from "Config";
import CircleListItem from "screens/circle/CircleListItem";

import algoliasearch from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits, RefinementList, useInstantSearch, useSearchBox } from "react-instantsearch-hooks-web";

// #endregion

const searchClient = algoliasearch(config.algoliaId, config.algoliaSearchKey);

const SearchHit = ({ hit }) => {
    const navigate = useNavigateNoUpdates();

    return <CircleListItem item={hit} onClick={() => openCircle(navigate, hit.objectID)} />;
};

const CirclesSearchBox = (props) => {
    const { refine } = useSearchBox();
    const [isMobile] = useAtom(isMobileAtom);
    const [searchResultsShown, setSearchResultsShown] = useAtom(searchResultsShownAtom);

    const handleChange = (e) => {
        refine(e.target.value);
    };

    return (
        <InputGroup marginTop="35px" marginBottom="35px">
            <InputLeftElement color="gray.300" pointerEvents="none" children={<HiOutlineSearch size={28} />} height="50px" marginLeft="20px" />
            <Input
                paddingLeft="65px"
                borderRadius="50px"
                height="50px"
                width="100%"
                marginLeft="15px"
                marginRight="15px"
                onChange={handleChange}
                focusBorderColor="pink.400"
                placeholder="Type search terms or enter URL"
                _placeholder={{ fontSize: isMobile ? "16px" : "22px", height: "50px", textAlign: "center", paddingRight: "32px" }}
            />
        </InputGroup>

        // <InputGroup>
        //     <InputLeftElement pointerEvents="none" children={<HiOutlineSearch />} />
        //     <Input
        //         type="text"
        //         placeholder="Search circles"
        //         onChange={handleChange}
        //         onFocus={() => setSearchResultsShown(true)}
        //         onBlur={() => setSearchResultsShown(false)}
        //     />
        // </InputGroup>
    );
};

const EmptyQueryBoundary = ({ children, fallback }) => {
    const { indexUiState } = useInstantSearch();
    const [, setSearchResultsShownAtom] = useAtom(searchResultsShownAtom);

    useEffect(() => {
        setSearchResultsShownAtom(!indexUiState.query === false);
    }, [indexUiState.query, setSearchResultsShownAtom]);

    if (!indexUiState.query) {
        return fallback;
    }

    return children;
};

export const CircleInstantSearchBox = () => {
    return (
        <InstantSearch searchClient={searchClient} indexName={config.algoliaCirclesIndex}>
            <CirclesSearchBox />

            {/* <SearchBox width="100%" height="50px" /> */}
            <EmptyQueryBoundary fallback={null}>
                {/* <RefinementList attribute="type" /> */}
                <Hits hitComponent={SearchHit} />
            </EmptyQueryBoundary>
        </InstantSearch>
    );
};

export default CircleInstantSearchBox;
