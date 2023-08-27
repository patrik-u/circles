//#region imports
import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { $isLinkNode, LinkNode } from "@lexical/link";
import { $isMarkNode } from "@lexical/mark";
import { mergeRegister } from "@lexical/utils";
import { $getRoot, $getSelection, $isElementNode, $isRangeSelection, $isTextNode, DEPRECATED_$isGridSelection } from "lexical";
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
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Tree } from "react-arborist";
import { MdArrowDropDown, MdArrowRight } from "react-icons/md";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import axios from "axios";
import { useAtom } from "jotai";
import { editorStateAtom, isMobileAtom, userAtom, userDataAtom } from "components/Atoms";
import { Routes, Navigate, Route, useHistory, useParams, useLocation, useSearchParams, match, matchPath, useMatch, matchRoutes } from "react-router-dom";
import { debounce, log } from "components/Helpers";
//#endregion

const FocusFirstNodeOnLoadPlugin = () => {
    const { documentId } = useParams();
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        // focus first heading on mount
        if (editor) {
            editor.update(() => {
                const firstNode = $getRoot()?.getFirstChild();
                if (firstNode) {
                    firstNode.select();
                }
            });
        }
    }, [documentId, editor]);

    return null;
};
export default FocusFirstNodeOnLoadPlugin;
