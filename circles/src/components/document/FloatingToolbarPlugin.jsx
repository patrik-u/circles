//#region imports
import {
    Flex,
    Box,
    Text,
    CloseButton,
    Spinner,
    Button,
    Checkbox,
    useToast,
    Image,
    HStack,
    VStack,
    Tabs,
    Tab,
    TabList,
    TabPanels,
    TabPanel,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Icon,
    Tooltip,
    useDisclosure,
} from "@chakra-ui/react";
import { $isCodeHighlightNode } from "@lexical/code";
import { $isAtNodeEnd } from "@lexical/selection";
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
    $createNodeSelection,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $setSelection,
    COMMAND_PRIORITY_LOW,
    FORMAT_TEXT_COMMAND,
    LexicalEditor,
    SELECTION_CHANGE_COMMAND,
    MOVE_TO_END,
    KEY_ARROW_LEFT_COMMAND,
    KEY_ARROW_RIGHT_COMMAND,
    $createRangeSelection,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";
import { log } from "@/components/Helpers";
import { HiCheck, HiX } from "react-icons/hi";
//#endregion

export const AiAutoCompleteCheckButton = ({ onClick, isCheck, ...props }) => {
    const iconSize = 19;
    const iconSizePx = iconSize + "px";
    const buttonHighlight = "#dfe8fa4d";

    return (
        <Tooltip
            label={`${isCheck ? "Accept" : "Remove"} AI text completion`}
            aria-label="A tooltip"
            borderRadius="50px"
        >
            <Button
                className="popup-item"
                width="36px"
                height="36px"
                position="relative"
                justifyContent="center"
                _hover={{ backgroundColor: buttonHighlight }}
                alignItems="center"
                onClick={onClick}
                cursor="pointer"
                {...props}
            >
                {/* 9756ff c710ff */}
                <Icon
                    width={iconSizePx}
                    height={iconSizePx}
                    color={isCheck ? "#2af310" : "#f72626"}
                    as={isCheck ? HiCheck : HiX}
                    zIndex="10"
                />
            </Button>
        </Tooltip>
    );
};

export const getDOMRangeRect = (nativeSelection, rootElement) => {
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

    return rect;
};

export const getSelectedNode = (selection) => {
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
        return $isAtNodeEnd(anchor) ? anchorNode : focusNode;
    }
};

const VERTICAL_GAP = 10;
const HORIZONTAL_OFFSET = 0;

export const setFloatingElemPosition = (
    targetRect,
    floatingElem,
    anchorElem,
    verticalGap = VERTICAL_GAP,
    horizontalOffset = HORIZONTAL_OFFSET
) => {
    const scrollerElem = anchorElem.parentElement;

    if (targetRect === null || !scrollerElem) {
        floatingElem.style.opacity = "0";
        floatingElem.style.transform = "translate(-10000px, -10000px)";
        return;
    }

    const floatingElemRect = floatingElem.getBoundingClientRect();
    const anchorElementRect = anchorElem.getBoundingClientRect();
    const editorScrollerRect = scrollerElem.getBoundingClientRect();

    let top = targetRect.top - floatingElemRect.height - verticalGap;
    let left = targetRect.left - horizontalOffset;

    if (top < editorScrollerRect.top) {
        top += floatingElemRect.height + targetRect.height + verticalGap * 2;
    }

    if (left + floatingElemRect.width > editorScrollerRect.right) {
        left = editorScrollerRect.right - floatingElemRect.width - horizontalOffset;
    }

    top -= anchorElementRect.top;
    left -= anchorElementRect.left;

    top += targetRect.height + 60;

    floatingElem.style.opacity = "1";
    floatingElem.style.transform = `translate(${left}px, ${top}px)`;
};

const TextFormatFloatingToolbar = ({
    editor,
    anchorElem,
    isLink,
    isBold,
    isItalic,
    isUnderline,
    isCode,
    isStrikethrough,
    onClose,
}) => {
    const popupCharStylesEditorRef = useRef(null);

    const insertLink = useCallback(() => {
        if (!isLink) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, "https://");
        } else {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        }
    }, [editor, isLink]);

    const updateTextFormatFloatingToolbar = useCallback(() => {
        const selection = $getSelection();

        const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
        const nativeSelection = window.getSelection();

        const selectedNode = getSelectedNode(selection);
        let elementKey = selectedNode?.getKey?.();
        let elementDOM = null;
        if (elementKey) {
            elementDOM = editor.getElementByKey(elementKey);
        }

        if (popupCharStylesEditorElem === null) {
            return;
        }

        if (!isCode) {
            popupCharStylesEditorElem.style.opacity = "0";
            popupCharStylesEditorElem.style.transform = "translate(-10000px, -10000px)";
            return;
        }

        const rootElement = editor.getRootElement();
        if (
            isCode ||
            (selection !== null &&
                nativeSelection !== null &&
                !nativeSelection.isCollapsed &&
                rootElement !== null &&
                rootElement.contains(nativeSelection.anchorNode))
        ) {
            const rangeRect = elementDOM?.getBoundingClientRect() ?? getDOMRangeRect(nativeSelection, rootElement);

            setFloatingElemPosition(rangeRect, popupCharStylesEditorElem, anchorElem);
        }
    }, [editor, anchorElem, isCode]);

    const onAcceptAiTextCompletion = (e) => {
        let selectedNode = null;
        editor.update(() => {
            const selection = $getSelection();
            selectedNode = getSelectedNode(selection);
            if (selectedNode) {
                selectedNode.setFormat({ isCode: false });
            }
        });
    };

    const onRemoveAiTextCompletion = () => {
        editor.update(() => {
            const selection = $getSelection();
            const selectedNode = getSelectedNode(selection);
            selectedNode.remove();
        });
    };

    useEffect(() => {
        const scrollerElem = anchorElem.parentElement;

        const update = () => {
            editor.getEditorState().read(() => {
                updateTextFormatFloatingToolbar();
            });
        };

        window.addEventListener("resize", update);
        if (scrollerElem) {
            scrollerElem.addEventListener("scroll", update);
        }

        return () => {
            window.removeEventListener("resize", update);
            if (scrollerElem) {
                scrollerElem.removeEventListener("scroll", update);
            }
        };
    }, [editor, updateTextFormatFloatingToolbar, anchorElem]);

    useEffect(() => {
        editor.getEditorState().read(() => {
            updateTextFormatFloatingToolbar();
        });
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateTextFormatFloatingToolbar();
                });
            }),

            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateTextFormatFloatingToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateTextFormatFloatingToolbar]);

    return (
        <Box ref={popupCharStylesEditorRef} className="floating-text-format-popup" height="42px">
            {editor.isEditable() && (
                <>
                    {isCode ? (
                        <>
                            <AiAutoCompleteCheckButton isCheck={true} onClick={onAcceptAiTextCompletion} />
                            <AiAutoCompleteCheckButton isCheck={false} onClick={onRemoveAiTextCompletion} />
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
                                }}
                                className={"popup-item spaced " + (isBold ? "active" : "")}
                                aria-label="Format text as bold"
                            >
                                <i className="format bold" />
                            </button>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
                                }}
                                className={"popup-item spaced " + (isItalic ? "active" : "")}
                                aria-label="Format text as italics"
                            >
                                <i className="format italic" />
                            </button>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
                                }}
                                className={"popup-item spaced " + (isUnderline ? "active" : "")}
                                aria-label="Format text to underlined"
                            >
                                <i className="format underline" />
                            </button>
                            <button
                                onClick={() => {
                                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
                                }}
                                className={"popup-item spaced " + (isStrikethrough ? "active" : "")}
                                aria-label="Format text with a strikethrough"
                            >
                                <i className="format strikethrough" />
                            </button>

                            <button
                                onClick={insertLink}
                                className={"popup-item spaced " + (isLink ? "active" : "")}
                                aria-label="Insert link"
                            >
                                <i className="format link" />
                            </button>
                        </>
                    )}
                </>
            )}
        </Box>
    );
};

const useFloatingTextFormatToolbar = (editor, anchorElem) => {
    const [isText, setIsText] = useState(false);
    const [isLink, setIsLink] = useState(false);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);

    const updatePopup = useCallback(() => {
        editor.update(() => {
            // Should not to pop up the floating toolbar when using IME input
            if (editor.isComposing()) {
                return;
            }

            const selection = $getSelection();
            const nativeSelection = window.getSelection();
            const rootElement = editor.getRootElement();

            if (
                nativeSelection !== null &&
                (!$isRangeSelection(selection) ||
                    rootElement === null ||
                    !rootElement.contains(nativeSelection.anchorNode))
            ) {
                setIsText(false);
                return;
            }

            if (!$isRangeSelection(selection)) {
                return;
            }

            const node = getSelectedNode(selection);

            // Update text format
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsUnderline(selection.hasFormat("underline"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));

            let isCode = node?.hasFormat?.("code");
            setIsCode(isCode);

            // Update links
            const parent = node.getParent();
            if ($isLinkNode(parent) || $isLinkNode(node)) {
                setIsLink(true);
            } else {
                setIsLink(false);
            }

            if (!$isCodeHighlightNode(selection.anchor.getNode()) && selection.getTextContent() !== "") {
                setIsText($isTextNode(node));
            } else {
                setIsText(isCode);
            }
        });
    }, [editor]);

    useEffect(() => {
        document.addEventListener("selectionchange", updatePopup);
        return () => {
            document.removeEventListener("selectionchange", updatePopup);
        };
    }, [updatePopup]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(() => {
                updatePopup();
            }),
            editor.registerRootListener(() => {
                if (editor.getRootElement() === null) {
                    setIsText(false);
                }
            })
        );
    }, [editor, updatePopup]);

    if (!isText || isLink || !isCode) {
        return null;
    }

    return createPortal(
        <TextFormatFloatingToolbar
            editor={editor}
            anchorElem={anchorElem}
            isLink={isLink}
            isBold={isBold}
            isItalic={isItalic}
            isStrikethrough={isStrikethrough}
            isUnderline={isUnderline}
            isCode={isCode}
        />,
        anchorElem
    );
};

const FloatingTextFormatToolbarPlugin = ({ anchorElem = document.body }) => {
    const [editor] = useLexicalComposerContext();
    return useFloatingTextFormatToolbar(editor, anchorElem);
};

export default FloatingTextFormatToolbarPlugin;
