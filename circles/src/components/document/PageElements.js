//#region imports
import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import {
    Flex,
    Box,
    Text,
    Menu,
    Image,
    MenuButton,
    MenuDivider,
    MenuItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Tooltip,
    Spinner,
    Button,
    Center,
    Avatar,
    Icon,
    Heading,
    LinkOverlay,
    MenuList,
    useToast,
    HStack,
    VStack,
    LinkBox,
    FormControl,
    Input,
    FormErrorMessage,
    InputGroup,
    InputRightElement,
    useDisclosure,
    Link,
    useOutsideClick,
    Fade,
} from "@chakra-ui/react";
import { useAtom } from "jotai";
import { isMobileAtom, includeParagraphsAtom } from "components/Atoms";
import { RiParagraph } from "react-icons/ri";
//#endregion

export const ParagraphToggleButton = ({ ...props }) => {
    const [includeParagraphs, setIncludeParagraphs] = useAtom(includeParagraphsAtom);
    const [isMobile] = useAtom(isMobileAtom);

    return (
        <Tooltip label={includeParagraphs ? "Hide paragraphs" : "Show paragraphs"} aria-label="A tooltip" borderRadius="50px">
            <Flex
                width="32px"
                minWidth="32px"
                height="32px"
                borderRadius="10px"
                position="relative"
                _hover={{ backgroundColor: "#dfe8fa4d" }}
                justifyContent="center"
                alignItems="center"
                onClick={() => {
                    setIncludeParagraphs(!includeParagraphs);
                }}
                cursor="pointer"
                {...props}
            >
                <Icon width="19px" height="19px" color={includeParagraphs ? "#666" : "#d5d5d5"} as={RiParagraph} />
            </Flex>
        </Tooltip>
    );
};
