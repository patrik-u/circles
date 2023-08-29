//#region imports
import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
    useToast,
    Flex,
    Box,
    Menu,
    Text,
    MenuButton,
    MenuItem,
    Button,
    MenuList,
    useDisclosure,
    IconButton,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Skeleton,
    Select,
    Image,
    Textarea,
    Tooltip,
} from "@chakra-ui/react";
import { doc, onSnapshot } from "firebase/firestore";
import { routes } from "components/Navigation";
import EditorTheme from "components/document/EditorTheme";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import TreeViewPlugin from "components/document/TreeViewPlugin";
import ToolbarPlugin from "components/document/ToolbarPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";

import ListMaxIndentLevelPlugin from "components/document/ListMaxIndentLevelPlugin";
import CodeHighlightPlugin from "components/document/CodeHighlightPlugin";
import AutoLinkPlugin from "components/document/AutoLinkPlugin";
import db from "components/Firebase";

import DocumentTree from "components/document/DocumentTree";
import AutoSavePlugin from "components/document/AutoSavePlugin";

import { Scrollbars } from "react-custom-scrollbars-2";
import { useAtom } from "jotai";
import {
    userAtom,
    signInStatusAtom,
    circleAtom,
    aiAutoCompleteActiveAtom,
    isMobileAtom,
    // activeNoteAtom, NOTES123
    triggerAiTextCompletionAtom,
    aiTextCompletionActiveAtom,
    userDataAtom,
} from "components/Atoms";
import config from "Config";
import { HiOutlineCog, HiOutlineTrash } from "react-icons/hi";
import {
    navigationMenuWidth,
    documentExplorerWidth,
    documentExplorerWidthPx,
    notesPanelWidth,
    //    notesPanelWidthPx, NOTES123
    activeNotePanelWidth,
    //    activeNotePanelWidthPx, NOTES123
    navigationMenuWidthPx,
} from "components/Constants";
import AiTextCompletionPlugin from "components/document/AiTextCompletionPlugin";
import { AiPromptNode, AiTextNode } from "components/document/AiNodes";
import FocusFirstNodeOnLoadPlugin from "components/document/FocusFirstNodeOnLoadPlugin";
// import Notes from "components/document/Notes"; NOTES123
import useSaveAndNavigate from "components/document/useSaveAndNavigate";
import { log } from "components/Helpers";
import { v4 as uuidv4 } from "uuid";
import { DocumentHeadingNode } from "components/document/DocumentHeadingNode";
import CommandListenerPlugin from "components/document/CommandListenerPlugin";
import FloatingTextFormatToolbarPlugin from "components/document/FloatingToolbarPlugin";
import { IoMdSend } from "react-icons/io";
import { defaultUserPicture } from "components/Constants";
import { toastInfo, fromFsDate, toISODate } from "components/Helpers";
import { MdArrowDropDown } from "react-icons/md";
import "./DocumentEditor.css";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
//#endregion

export const DocumentEditorPlaceholder = ({ condensed }) => {
    const [isMobile] = useAtom(isMobileAtom);
    const rightPanelWidth = notesPanelWidth;
    const rightPanelWidthPx = rightPanelWidth + "px";
    const panelBackground = "#ffffff"; //"#f4f4f4";

    return (
        <Flex minHeight="100vh" width={"100%"} flexGrow="0" flexShrink="0" overflow="hidden">
            {/* Document explorer */}
            {!condensed && !isMobile && (
                <Box width={documentExplorerWidthPx} minWidth={documentExplorerWidthPx} height="100%" backgroundColor={panelBackground}>
                    <Skeleton width="150px" height="30px" marginLeft="20px" marginTop="20px" />
                    <Skeleton width="200px" height="25px" marginLeft="20px" marginTop="10px" />
                    <Skeleton width="100px" height="18px" marginLeft="32px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="44px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="44px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                    <Skeleton width="100px" height="18px" marginLeft="56px" marginTop="5px" />
                </Box>
            )}

            {/* Editor panel */}
            <Flex flexDirection="column" width={isMobile ? "100%" : `calc(100% - ${documentExplorerWidth + rightPanelWidth}px)`} maxWidth="100%">
                {/* Toolbar */}
                <Box flexBasis="45px" height="45px" minHeight="45px" minWidth="100px" width="100%" flexDirection="row">
                    <Flex
                        width={isMobile ? "100%" : `calc(100% - ${documentExplorerWidth + rightPanelWidth + navigationMenuWidth}px)`}
                        align="center"
                        backgroundColor="white"
                    >
                        <Box className="toolbar" marginTop="4px">
                            <Skeleton width="30px" height="30px" marginLeft="0px" marginTop="0px" />
                            <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                            <Skeleton width="130px" height="30px" marginLeft="12px" marginTop="0px" />
                            {/* 11 */}
                            <Skeleton width="30px" height="30px" marginLeft="12px" marginTop="0px" />
                            <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                            <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                            <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                            {!condensed && (
                                <>
                                    <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="12px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="12px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                                    <Skeleton width="30px" height="30px" marginLeft="6px" marginTop="0px" />
                                </>
                            )}
                        </Box>
                    </Flex>
                    <Box minWidth="100px" height="45px" minHeight="45px" />
                </Box>
                <Box className="editor-container">
                    <Box className="editor-inner">
                        <Box marginLeft="24px" marginRight="24px">
                            <Skeleton width="500px" height="58px" marginTop="18px" />
                            <Skeleton width="260px" height="34px" marginTop="12px" />
                            <Skeleton width="100%" height="16px" marginTop="12px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="260px" height="34px" marginTop="12px" />
                            <Skeleton width="100%" height="16px" marginTop="12px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                            <Skeleton width="100%" height="16px" marginTop="8px" />
                        </Box>
                    </Box>
                </Box>
            </Flex>

            {/* Notes panel NOTES123 */}
            {/* {!isMobile && (
                <Box width={rightPanelWidthPx} minWidth={rightPanelWidthPx} height="100%" backgroundColor={panelBackground} zIndex="100">
                    <Box marginLeft="10px">
                        <Skeleton width="85px" height="30px" marginLeft="0px" marginTop="20px" />
                        <Skeleton width="230px" height="44px" marginLeft="0px" marginTop="10px" />
                        <Skeleton width="230px" height="20px" marginLeft="0px" marginTop="18px" />
                        <Skeleton width="230px" height="12px" marginLeft="0px" marginTop="6px" />
                        <Skeleton width="230px" height="12px" marginLeft="0px" marginTop="8px" />
                        <Skeleton width="230px" height="12px" marginLeft="0px" marginTop="8px" />
                        <Skeleton width="230px" height="12px" marginLeft="0px" marginTop="8px" />
                        <Skeleton width="230px" height="12px" marginLeft="0px" marginTop="8px" />
                        <Skeleton width="230px" height="12px" marginLeft="0px" marginTop="8px" />
                    </Box>
                </Box>
            )} */}
        </Flex>
    );
};

// save document
export const DocumentEditor = ({ initialDocument, disableAutoSave, condensed, document, setDocument, ...props }) => {
    const [user] = useAtom(userAtom);
    const navigate = useSaveAndNavigate();
    //const [document, setDocument] = useAtom(circleAtom);
    const middlePanelRef = useRef(null);
    const [signInStatus] = useAtom(signInStatusAtom);
    const [latestSaveId, setLatestSaveId] = useState(null);
    // const [activeNote] = useAtom(activeNoteAtom); // NOTES123
    const [isMobile] = useAtom(isMobileAtom);
    const [contentLength, setContentLength] = useState(initialDocument?.content?.length ?? 0);

    const Placeholder = () => {
        return <div className="editor-placeholder"></div>;
    };

    const editorConfig = useMemo(() => {
        return {
            namespace: "DocumentEditor",
            // The editor theme
            theme: EditorTheme,
            // Handling of errors during update
            onError(error) {
                throw error;
            },
            // Any custom nodes go here
            nodes: [
                HeadingNode,
                ListNode,
                ListItemNode,
                QuoteNode,
                CodeNode,
                CodeHighlightNode,
                TableNode,
                TableCellNode,
                TableRowNode,
                AutoLinkNode,
                LinkNode,
                AiPromptNode,
                DocumentHeadingNode,
                {
                    replace: HeadingNode,
                    with: (node) => {
                        return new DocumentHeadingNode(uuidv4(), node.getTag());
                    },
                },
            ],
            editorState: () => $convertFromMarkdownString(document?.content ?? "", TRANSFORMERS),
        };
    }, [document?.content]);

    useEffect(() => {
        if (!user?.id || !document?.id || !signInStatus.signedIn || !initialDocument?.id) return;
        if (initialDocument?.id !== document?.id) {
            return;
        }

        //log("subcribing to document: " + document?.id + ", " + document?.version + ", initial document: " + initialDocument.id, 0, true);

        // subscribe to document in firestore
        let getDocumentSubscription = null;
        getDocumentSubscription = onSnapshot(doc(db, "circles", document.id), (doc) => {
            if (doc.exists()) {
                const newDocument = doc.data();
                newDocument.id = doc.id;
                if (newDocument?.version > document?.version) {
                    console.log("updating document from server, document?.version= " + document?.version + ", newDocument?.version =" + newDocument?.version);
                    // update document
                    setDocument(newDocument);
                }
                setLatestSaveId(newDocument?.save_id);
            }
        });

        return () => {
            // unsubscribe from document in firestore
            if (getDocumentSubscription) {
                getDocumentSubscription();
            }
        };
    }, [document?.id, user?.id, document?.version, setDocument, signInStatus, initialDocument?.id]);

    const onSelectVersion = (version) => {
        // get old document from firestore
    };

    if (initialDocument?.id) {
        if (!document?.id || !initialDocument?.id || initialDocument?.id !== document?.id) {
            return <DocumentEditorPlaceholder condensed={condensed} />;
        }
    }

    const panelBackground = "#ffffff"; //"#f4f4f4";
    const rightPanelWidth = 0; // activeNote ? activeNotePanelWidth : notesPanelWidth; // NOTES123
    const rightPanelWidthPx = rightPanelWidth + "px";

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <Flex flexDirection="column" height="100%" {...props}>
                {/* Toolbar */}
                <Box flexBasis="45px" height="45px" minHeight="45px" minWidth="100px" width="100%" flexDirection="row" borderBottom="1px solid #E2E8F0">
                    <Flex zIndex="10" align="center">
                        <ToolbarPlugin condensed={condensed} />
                    </Flex>
                </Box>
                <Scrollbars autoHide>
                    <Flex flexGrow="1">
                        {/* Document outline */}
                        {!isMobile && !condensed && (
                            <Box width={documentExplorerWidthPx} minWidth={documentExplorerWidthPx} height="100%" backgroundColor={panelBackground}>
                                <DocumentTree />
                            </Box>
                        )}

                        {/* Editor panel */}
                        <Flex ref={middlePanelRef} flexDirection="column" width="100%" maxWidth="100%" minHeight="300px">
                            <Box className="editor-container">
                                <Box className="editor-inner">
                                    <RichTextPlugin
                                        contentEditable={<ContentEditable className="editor-input" />}
                                        placeholder={<Placeholder />}
                                        ErrorBoundary={LexicalErrorBoundary}
                                    />
                                    <HistoryPlugin />
                                    {config.showDebug && <TreeViewPlugin />}
                                    <AutoFocusPlugin />
                                    <CodeHighlightPlugin />
                                    <ListPlugin />
                                    <LinkPlugin />
                                    <AutoLinkPlugin />
                                    <AutoSavePlugin
                                        latestSaveId={latestSaveId}
                                        setContentLength={setContentLength}
                                        disableAutoSave={disableAutoSave}
                                        document={document}
                                        setDocument={setDocument}
                                    />
                                    <ListMaxIndentLevelPlugin maxDepth={7} />
                                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                                    <FocusFirstNodeOnLoadPlugin />
                                    {/* <AiTextCompletionPlugin /> */}
                                    <CommandListenerPlugin />
                                    <FloatingTextFormatToolbarPlugin />
                                </Box>
                            </Box>
                        </Flex>

                        {/* NOTES123 Notes panel */}
                        {/* {!isMobile && (
                    <Box width={rightPanelWidthPx} minWidth={rightPanelWidthPx} height="100%" backgroundColor={panelBackground}>
                        <Notes />
                    </Box>
                )} */}
                    </Flex>
                </Scrollbars>
                {/* Bottom panel */}
                {!condensed && (
                    <Box backgroundColor="#f9f9f9" height="22px">
                        <Flex height="22px" backgroundColor="#e5e5e5" align="center" flexDirection="row">
                            <Button
                                variant="ghost"
                                size="xs"
                                fontSize="12px"
                                value={document.version}
                                onChange={(e) => onSelectVersion(e.target.value)}
                                height="22px"
                                width="150px"
                                // rightIcon={<MdArrowDropDown />}
                                fontWeight="400"
                            >
                                v{toISODate(document?.updated_at)}.{document?.version}
                                {/* If open get older versions */}
                            </Button>
                            <Text fontSize="12px" marginLeft="auto" marginRight="10px" color="#3f4357">
                                Characters: <b>{contentLength}</b>
                            </Text>
                        </Flex>
                    </Box>
                )}
            </Flex>
        </LexicalComposer>
    );
};

export default DocumentEditor;
