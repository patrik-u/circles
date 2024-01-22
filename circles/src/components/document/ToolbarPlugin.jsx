//#region imports
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    REDO_COMMAND,
    UNDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    KEY_SPACE_COMMAND,
    $getSelection,
    $isRangeSelection,
    $createParagraphNode,
    $getNodeByKey,
} from "lexical";
import { useToast, Flex, Box, Tooltip, Icon, Show, Hide, Image, VStack, Text } from "@chakra-ui/react";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { $isParentElementRTL, $wrapNodes, $isAtNodeEnd } from "@lexical/selection";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
    INSERT_ORDERED_LIST_COMMAND,
    INSERT_UNORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
    $isListNode,
    ListNode,
} from "@lexical/list";
import { createPortal } from "react-dom";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text";
import { $createCodeNode, $isCodeNode, getDefaultCodeLanguage, getCodeLanguages } from "@lexical/code";
import { useAtom } from "jotai";
import {
    isMobileAtom,
    triggerAiTextCompletionAtom,
    aiTextCompletionActiveAtom,
    documentNodesAtom,
} from "@/components/Atoms";
import { MdAutoFixHigh } from "react-icons/md";
import { log } from "@/components/Helpers";
import useWindowDimensions from "@/components/useWindowDimensions";
import { toastInfo, toastError, toastSuccess } from "@/components/Helpers";
import { GrDocumentUpdate } from "react-icons/gr";
import { convertToTree } from "@/components/document/DocumentTree";
import axios from "axios";
//#endregion

const LowPriority = 1;

const supportedBlockTypes = new Set(["paragraph", "quote", "code", "h1", "h2", "h3", "h4", "ul", "ol"]);

const blockTypeToBlockName = {
    code: "Code Block",
    h1: "Document Title",
    h2: "Primary Heading",
    h3: "Secondary Heading",
    h4: "Tertiary Heading",
    h5: "Heading",
    ol: "Numbered List",
    paragraph: "Normal",
    quote: "Quote",
    ul: "Bulleted List",
};

export const getDocumentChunks = (documentTree) => {
    const result = [];

    const traverse = (node, context = []) => {
        // Extend the current context with the node's name.
        // ignore root in context
        let currentContext;
        if (node.category === "root") {
            currentContext = context;
        } else {
            currentContext = context.concat(node.name);
        }

        // If the node is a heading, collect its paragraphs and create a document chunk.
        let hasParagraph = false;
        let text = `# ${node.name}\n`;

        // Iterate over its children looking for paragraphs.
        for (const child of node.children) {
            if (child.category === "paragraph") {
                text += "\n" + child.name;
                hasParagraph = true;
            } else if (child.category === "misc") {
                switch (child.type) {
                    case "link":
                        let test = { ...child };
                        test.parent = null;
                        test.children = null;
                        // log(JSON.stringify(test, null, 2), 0, true);
                        text += `[${child.name}](${child.url})`;
                        break;
                    case "listitem":
                        text += `\n- ${child.name}\n`;
                        break;
                    default:
                        break;
                }
            }
        }

        if (hasParagraph) {
            result.push({
                context: currentContext.join(" > "),
                content: text.trim(),
            });
        }

        // Continue traversing the children.
        for (const child of node.children) {
            traverse(child, currentContext);
        }
    };

    // Start the traversal for each root node.
    for (const node of documentTree) {
        traverse(node);
    }

    return result;
};

export const AiUpdateButton = ({ onClick, document, ...props }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [documentNodes] = useAtom(documentNodesAtom);
    const iconSize = 19;
    const iconSizePx = iconSize + "px";
    const toast = useToast();

    const upsertDocumentChunks = () => {
        if (!document?.id) return;

        // get document chunks
        setIsLoading(true);
        let documentTree = convertToTree(documentNodes, true, true);
        let documentChunks = getDocumentChunks(documentTree);

        log(JSON.stringify(documentChunks, null, 2), 0, true);
        log(`upserting document chunks`);

        // save document chunks
        axios
            .put(`/circles/${document.id}/chunks`, {
                chunks: documentChunks,
            })
            .then((res) => {
                setIsLoading(false);
                if (res.data.error) {
                    toastError(
                        toast,
                        "Error uploading document for AI",
                        `Error uploading document ${document.name} for AI`
                    );
                } else {
                    toastSuccess(toast, "Document uploaded for AI", `Document ${document.name} uploaded for AI`);
                }
            })
            .catch((err) => {
                setIsLoading(false);
                toastError(
                    toast,
                    "Error uploading document for AI",
                    `Error uploading document ${document.name} for AI`
                );
            });
    };

    return (
        <Tooltip label={"Upload document for AI"} aria-label="A tooltip" borderRadius="50px">
            <Flex
                width="36px"
                height="36px"
                position="relative"
                justifyContent="center"
                alignItems="center"
                onClick={upsertDocumentChunks}
                cursor="pointer"
                // className={aiTextCompletionActive && isLoading ? "aiButtonActive" : "aiButton"}
                {...props}
            >
                {isLoading ? (
                    <Image
                        src="/Spinner-1s-20px.gif"
                        style={{ display: "inline", width: "1em", height: "1em" }}
                        zIndex="10"
                    />
                ) : (
                    <Icon width={iconSizePx} height={iconSizePx} color="#666666" as={GrDocumentUpdate} zIndex="10" />
                )}
            </Flex>
        </Tooltip>
    );
};

function Divider() {
    return <div className="divider" />;
}

function positionEditorElement(editor, rect) {
    if (rect === null) {
        editor.style.opacity = "0";
        editor.style.top = "-1000px";
        editor.style.left = "-1000px";
    } else {
        editor.style.opacity = "1";
        editor.style.top = `${rect.top + rect.height + window.pageYOffset + 10}px`;
        editor.style.left = `${rect.left + window.pageXOffset - editor.offsetWidth / 2 + rect.width / 2}px`;
    }
}

function FloatingLinkEditor({ editor }) {
    const editorRef = useRef(null);
    const inputRef = useRef(null);
    const mouseDownRef = useRef(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [isEditMode, setEditMode] = useState(false);
    const [lastSelection, setLastSelection] = useState(null);

    const updateLinkEditor = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent)) {
                setLinkUrl(parent.getURL());
            } else if ($isLinkNode(node)) {
                setLinkUrl(node.getURL());
            } else {
                setLinkUrl("");
            }
        }
        const editorElem = editorRef.current;
        const nativeSelection = window.getSelection();
        const activeElement = document.activeElement;

        if (editorElem === null) {
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            selection !== null &&
            !nativeSelection.isCollapsed &&
            rootElement !== null &&
            rootElement.contains(nativeSelection.anchorNode)
        ) {
            const domRange = nativeSelection.getRangeAt(0);
            let rect;
            if (nativeSelection.anchorNode === rootElement) {
                let inner = rootElement;
                while (inner.firstElementChild != null) {
                    inner = inner.firstElementChild;
                }
                rect = inner.getBoundingClientRect();
            } else {
                rect = domRange.getBoundingClientRect();
            }

            if (!mouseDownRef.current) {
                positionEditorElement(editorElem, rect);
            }
            setLastSelection(selection);
        } else if (!activeElement || activeElement.className !== "link-input") {
            positionEditorElement(editorElem, null);
            setLastSelection(null);
            setEditMode(false);
            setLinkUrl("");
        }

        return true;
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateLinkEditor();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateLinkEditor();
                    return true;
                },
                LowPriority
            )
        );
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateLinkEditor();
        });
    }, [editor, updateLinkEditor]);

    useEffect(() => {
        if (isEditMode && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditMode]);

    return (
        <div ref={editorRef} className="link-editor">
            {isEditMode ? (
                <input
                    ref={inputRef}
                    className="link-input"
                    value={linkUrl}
                    onChange={(event) => {
                        setLinkUrl(event.target.value);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            if (lastSelection !== null) {
                                if (linkUrl !== "") {
                                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
                                }
                                setEditMode(false);
                            }
                        } else if (event.key === "Escape") {
                            event.preventDefault();
                            setEditMode(false);
                        }
                    }}
                />
            ) : (
                <>
                    <div className="link-input">
                        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
                            {linkUrl}
                        </a>
                        <div
                            className="link-edit"
                            role="button"
                            tabIndex={0}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                setEditMode(true);
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}

function Select({ onChange, className, options, value }) {
    return (
        <select className={className} onChange={onChange} value={value} type="button">
            <option hidden={true} value="" type="button" />
            {options.map((option) => (
                <option key={option} value={option} type="button">
                    {option}
                </option>
            ))}
        </select>
    );
}

function getSelectedNode(selection) {
    const anchor = selection.anchor;
    const focus = selection.focus;
    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();
    if (anchorNode === focusNode) {
        return anchorNode;
    }
    const isBackward = selection.isBackward();
    if (isBackward) {
        return $isAtNodeEnd(focus) ? anchorNode : focusNode;
    } else {
        return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
    }
}

function BlockOptionsDropdownList({ editor, blockType, toolbarRef, setShowBlockOptionsDropDown }) {
    const dropDownRef = useRef(null);

    useEffect(() => {
        const toolbar = toolbarRef.current;
        const dropDown = dropDownRef.current;

        if (toolbar !== null && dropDown !== null) {
            const { top, left } = toolbar.getBoundingClientRect();
            dropDown.style.top = `${top + 40}px`;
            dropDown.style.left = `${left}px`;
        }
    }, [dropDownRef, toolbarRef]);

    useEffect(() => {
        const dropDown = dropDownRef.current;
        const toolbar = toolbarRef.current;

        if (dropDown !== null && toolbar !== null) {
            const handle = (event) => {
                const target = event.target;

                if (!dropDown.contains(target) && !toolbar.contains(target)) {
                    setShowBlockOptionsDropDown(false);
                }
            };
            document.addEventListener("click", handle);

            return () => {
                document.removeEventListener("click", handle);
            };
        }
    }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

    const formatParagraph = () => {
        if (blockType !== "paragraph") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createParagraphNode());
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatH1Heading = () => {
        if (blockType !== "h1") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h1"));
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatH2Heading = () => {
        if (blockType !== "h2") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h2"));
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatH3Heading = () => {
        if (blockType !== "h3") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h3"));
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatH4Heading = () => {
        if (blockType !== "h4") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createHeadingNode("h4"));
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatBulletList = () => {
        if (blockType !== "ul") {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND);
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatNumberedList = () => {
        if (blockType !== "ol") {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
        } else {
            editor.dispatchCommand(REMOVE_LIST_COMMAND);
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatQuote = () => {
        if (blockType !== "quote") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createQuoteNode());
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    const formatCode = () => {
        if (blockType !== "code") {
            editor.update(() => {
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    $wrapNodes(selection, () => $createCodeNode());
                }
            });
        }
        setShowBlockOptionsDropDown(false);
    };

    return (
        <div className="dropdown" ref={dropDownRef}>
            <button className="item" onClick={formatParagraph}>
                <span className="icon paragraph" />
                <span className="text">Normal</span>
                {blockType === "paragraph" && <span className="active" />}
            </button>
            <button className="item" onClick={formatH1Heading}>
                <span className="icon h1-heading" />
                <span className="text">Document Title</span>
                {blockType === "h1" && <span className="active" />}
            </button>
            <button className="item" onClick={formatH2Heading}>
                <span className="icon h2-heading" />
                <span className="text">Primary Heading</span>
                {blockType === "h2" && <span className="active" />}
            </button>
            <button className="item" onClick={formatH3Heading}>
                <span className="icon h3-heading" />
                <span className="text">Secondary Heading</span>
                {blockType === "h3" && <span className="active" />}
            </button>
            <button className="item" onClick={formatH4Heading}>
                <span className="icon h4-heading" />
                <span className="text">Tertiary Heading</span>
                {blockType === "h4" && <span className="active" />}
            </button>
            <button className="item" onClick={formatBulletList}>
                <span className="icon bullet-list" />
                <span className="text">Bullet List</span>
                {blockType === "ul" && <span className="active" />}
            </button>
            <button className="item" onClick={formatNumberedList}>
                <span className="icon numbered-list" />
                <span className="text">Numbered List</span>
                {blockType === "ol" && <span className="active" />}
            </button>
            <button className="item" onClick={formatQuote}>
                <span className="icon quote" />
                <span className="text">Quote</span>
                {blockType === "quote" && <span className="active" />}
            </button>
            <button className="item" onClick={formatCode}>
                <span className="icon code" />
                <span className="text">Code Block</span>
                {blockType === "code" && <span className="active" />}
            </button>
        </div>
    );
}

export const AiAutoCompleteButton = ({ onClick, size = "", ...props }) => {
    const [isLoading, setIsLoading] = useState(false);
    const iconSize = 19;
    const iconSizePx = iconSize + "px";
    const buttonHighlight = "#dfe8fa4d";
    const [, setTriggerAiTextCompletion] = useAtom(triggerAiTextCompletionAtom);
    const [aiTextCompletionActive] = useAtom(aiTextCompletionActiveAtom);
    const toast = useToast();
    const getTooltip = () => {
        switch (size) {
            default:
                return "AI text completion (CTRL + Space)";
            case "M":
                return "AI text completion (medium output)";
            case "L":
                return "AI text completion (large output)";
        }
    };

    useEffect(() => {
        setTriggerAiTextCompletion(false);
    }, [setTriggerAiTextCompletion]);

    useEffect(() => {
        if (!aiTextCompletionActive) {
            setIsLoading(false);
        }
    }, [aiTextCompletionActive]);

    return (
        <Tooltip label={getTooltip()} aria-label="A tooltip" borderRadius="50px">
            <Flex
                width="36px"
                height="36px"
                position="relative"
                justifyContent="center"
                alignItems="center"
                onClick={() => {
                    if (!aiTextCompletionActive) {
                        // for now only allow one ai text completion at a time
                        setIsLoading(true);
                        setTriggerAiTextCompletion({ outputSize: size });
                    } else {
                        toastInfo(toast, "Please wait for the AI to finish its current task.");
                    }
                }}
                cursor="pointer"
                className={aiTextCompletionActive && isLoading ? "aiButtonActive" : "aiButton"}
                {...props}
            >
                {/* 9756ff c710ff */}
                {aiTextCompletionActive && isLoading ? (
                    <Image
                        src="/Spinner-1s-20px.gif"
                        style={{ display: "inline", width: "1em", height: "1em" }}
                        zIndex="10"
                    />
                ) : (
                    <Icon width={iconSizePx} height={iconSizePx} color="#666666" as={MdAutoFixHigh} zIndex="10" />
                )}
                <Text fontSize="10px" lineHeight="8px" position="absolute" bottom="4px" right="4px" zIndex="10">
                    {size}
                </Text>
            </Flex>
        </Tooltip>
    );
};

export const ToolbarPlugin = ({ document, condensed }) => {
    const [editor] = useLexicalComposerContext();
    const toolbarRef = useRef(null);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [blockType, setBlockType] = useState("paragraph");
    const [selectedElementKey, setSelectedElementKey] = useState(null);
    const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(false);
    const [codeLanguage, setCodeLanguage] = useState("");
    const [isRTL, setIsRTL] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);
    //const [activeNote] = useAtom(activeNoteAtom); // NOTES123
    const [breakpointModifier, setBreakpointModifier] = useState(0);
    const [, setTriggerAiTextCompletion] = useAtom(triggerAiTextCompletionAtom);
    const [isMobile] = useAtom(isMobileAtom);
    // get window dimensions
    const { windowWidth } = useWindowDimensions();

    // NOTES123
    // useEffect(() => {
    //     let bp = activeNote ? activeNotePanelWidth - notesPanelWidth : 0;
    //     log(bp, 0, true);
    //     setBreakpointModifier(activeNote ? activeNotePanelWidth - notesPanelWidth : 0);
    // }, [activeNote]);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const element = anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
            const elementKey = element.getKey();
            const elementDOM = editor.getElementByKey(elementKey);
            if (elementDOM !== null) {
                setSelectedElementKey(elementKey);
                if ($isListNode(element)) {
                    const parentList = $getNearestNodeOfType(anchorNode, ListNode);
                    const type = parentList ? parentList.getTag() : element.getTag();
                    setBlockType(type);
                } else {
                    const type = $isHeadingNode(element) ? element.getTag() : element.getType();
                    setBlockType(type);
                    if ($isCodeNode(element)) {
                        setCodeLanguage(element.getLanguage() || getDefaultCodeLanguage());
                    }
                }
            }
            // Update text format
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            //setIsUnderline(selection.hasFormat("underline"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
            setIsCode(selection.hasFormat("code"));
            setIsRTL($isParentElementRTL(selection));

            // Update links
            const node = getSelectedNode(selection);
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }
        }
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                (_payload, newEditor) => {
                    updateToolbar();
                    return false;
                },
                LowPriority
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload) => {
                    setCanUndo(payload);
                    return false;
                },
                LowPriority
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload) => {
                    setCanRedo(payload);
                    return false;
                },
                LowPriority
            ),
            editor.registerCommand(
                KEY_SPACE_COMMAND,
                (payload) => {
                    const event = payload;
                    if (event.ctrlKey) {
                        event.preventDefault();
                        setTriggerAiTextCompletion({ outputSize: "" });
                        return true;
                    }
                    return false;
                },
                LowPriority
            )
        );
    }, [editor, updateToolbar, setTriggerAiTextCompletion]);

    const codeLanguges = useMemo(() => getCodeLanguages(), []);
    const onCodeLanguageSelect = useCallback(
        (e) => {
            editor.update(() => {
                if (selectedElementKey !== null) {
                    const node = $getNodeByKey(selectedElementKey);
                    if ($isCodeNode(node)) {
                        node.setLanguage(e.target.value);
                    }
                }
            });
        },
        [editor, selectedElementKey]
    );

    const insertLink = useCallback(() => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
        } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    return (
        <Box className="toolbar" ref={toolbarRef}>
            <button
                disabled={!canUndo}
                onClick={() => {
                    editor.dispatchCommand(UNDO_COMMAND);
                }}
                className="toolbar-item spaced"
                aria-label="Undo"
                style={{ marginLeft: isMobile ? "40px" : "0px" }}
                type="button"
            >
                <i className="format undo" />
            </button>
            <button
                disabled={!canRedo}
                onClick={() => {
                    editor.dispatchCommand(REDO_COMMAND);
                }}
                className="toolbar-item"
                aria-label="Redo"
                type="button"
            >
                <i className="format redo" />
            </button>
            <Divider />
            {supportedBlockTypes.has(blockType) && (
                <>
                    <button
                        className="toolbar-item block-controls"
                        onClick={() => setShowBlockOptionsDropDown(!showBlockOptionsDropDown)}
                        aria-label="Formatting Options"
                        type="button"
                    >
                        <span className={"icon block-type " + blockType} />
                        <span className="text">{blockTypeToBlockName[blockType]}</span>
                        <i className="chevron-down" />
                    </button>
                    {showBlockOptionsDropDown &&
                        createPortal(
                            <BlockOptionsDropdownList
                                editor={editor}
                                blockType={blockType}
                                toolbarRef={toolbarRef}
                                setShowBlockOptionsDropDown={setShowBlockOptionsDropDown}
                            />,
                            document.body
                        )}
                    <Divider />
                </>
            )}
            {blockType === "code" ? (
                <>
                    <Select
                        className="toolbar-item code-language"
                        onChange={onCodeLanguageSelect}
                        options={codeLanguges}
                        value={codeLanguage}
                        type="button"
                    />
                    <i className="chevron-down inside" />
                </>
            ) : (
                <>
                    <button
                        onClick={() => {
                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                        }}
                        className={"toolbar-item spaced " + (isBold ? "active" : "")}
                        aria-label="Format Bold"
                        type="button"
                    >
                        <i className="format bold" />
                    </button>
                    <button
                        onClick={() => {
                            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                        }}
                        className={"toolbar-item spaced " + (isItalic ? "active" : "")}
                        aria-label="Format Italics"
                        type="button"
                    >
                        <i className="format italic" />
                    </button>
                    <Flex flexDirection="row">
                        {/* <button
                            onClick={() => {
                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                            }}
                            className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
                            aria-label="Format Underline"
                        >
                            <i className="format underline" />
                        </button> */}
                        <button
                            onClick={() => {
                                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                            }}
                            className={"toolbar-item spaced " + (isStrikethrough ? "active" : "")}
                            aria-label="Format Strikethrough"
                            type="button"
                        >
                            <i className="format strikethrough" />
                        </button>
                        <button
                            onClick={insertLink}
                            className={"toolbar-item spaced " + (isLink ? "active" : "")}
                            aria-label="Insert Link"
                            type="button"
                        >
                            <i className="format link" />
                        </button>
                    </Flex>
                    {isLink && createPortal(<FloatingLinkEditor editor={editor} />, document.body)}
                    {!condensed && (
                        <Flex flexDirection="row">
                            <Divider />
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
                                }}
                                className="toolbar-item spaced"
                                aria-label="Left Align"
                                type="button"
                            >
                                <i className="format left-align" />
                            </button>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
                                }}
                                className="toolbar-item spaced"
                                aria-label="Center Align"
                                type="button"
                            >
                                <i className="format center-align" />
                            </button>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
                                }}
                                className="toolbar-item spaced"
                                aria-label="Right Align"
                                type="button"
                            >
                                <i className="format right-align" />
                            </button>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
                                }}
                                className="toolbar-item"
                                aria-label="Justify Align"
                                type="button"
                            >
                                <i className="format justify-align" />
                            </button>
                        </Flex>
                    )}
                    {document?.id && (
                        <>
                            <Divider />
                            <AiUpdateButton document={document} />
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

export default ToolbarPlugin;
