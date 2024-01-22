//#region imports
import React, { useState, useEffect, useRef } from "react";
import { $getRoot, $getSelection, $isElementNode, $setSelection, $createNodeSelection } from "lexical";
import { Flex, Box, Text, Image } from "@chakra-ui/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Tree } from "react-arborist";
import { MdArrowDropDown, MdArrowRight } from "react-icons/md";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { singleLineEllipsisStyle, log } from "@/components/Helpers";
import { useAtom } from "jotai";
import { includeParagraphsAtom, documentTreeAtom, documentNodesAtom } from "@/components/Atoms";
import useWindowDimensions from "@/components/useWindowDimensions";
import { ParagraphToggleButton } from "@/components/document/PageElements";
import { documentExplorerWidthPx } from "@/components/Constants";
import { CgClapperBoard } from "react-icons/cg";
import { BiBook } from "react-icons/bi";
import { BsFileEarmarkText } from "react-icons/bs";
import { VscFiles } from "react-icons/vsc";
import { Scrollbars } from "react-custom-scrollbars-2";
//#endregion

export const isNodeSelected = (node, selection) => {
    if (!selection) return false;

    let selectedNodes = selection.getNodes();
    for (let i = 0; i < selectedNodes.length; i++) {
        if (selectedNodes[i].getKey() === node.getKey()) {
            return true;
        }
    }
    return false;
};

export const convertToTree = (nodes, includeParagraphs, includeMisc) => {
    const rootNodes = [];
    let curParent = nodes?.[0];

    // iterate through the list of nodes
    for (const node of nodes) {
        if (node.category === "misc" && (!includeMisc || !includeParagraphs)) {
            if (node.isSelected && curParent) {
                curParent.isSelected = true;
            }
            continue;
        }
        if (node.type === "paragraph" && !includeParagraphs) {
            if (node.isSelected && curParent) {
                curParent.isSelected = true;
            }
            continue;
        }
        if (!node.name) {
            if (node.isSelected && curParent) {
                curParent.isSelected = true;
            }
            continue;
        }

        // Create a new tree node for the current element
        const treeNode = {
            ...node,
            children: [],
        };

        if (curParent && curParent.level < node.level) {
            curParent.children.push(treeNode);
        } else {
            while (curParent && curParent.level >= node.level) {
                curParent = curParent.parent;
            }
            if (curParent) {
                curParent.children.push(treeNode);
            } else {
                rootNodes.push(treeNode);
            }
        }

        treeNode.parent = curParent;

        // Set the previous node to be the current node
        curParent = treeNode;
    }

    return rootNodes;
};

export const getSelectedNode = (documentTree, includeText = false) => {
    let selectedNode = null;
    const visit = (node) => {
        if (node.isSelected) {
            if (!includeText && node.category === "text") {
                // get parent heading
                let curParent = node.parent;
                while (curParent && curParent.category === "text") {
                    curParent = curParent.parent;
                }
                return curParent;
            }
            return node;
        }
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const selectedChild = visit(child);
            if (selectedChild) {
                return selectedChild;
            }
        }
        return null;
    };
    for (let i = 0; i < documentTree.length; i++) {
        const node = documentTree[i];
        selectedNode = visit(node);
        if (selectedNode) {
            break;
        }
    }
    return selectedNode;
};

export const NodeIcon = ({ category }) => {
    const getNodeIcon = () => {
        switch (category) {
            case "book":
                return BiBook;
            case "act":
                return VscFiles;
            case "chapter":
                return BsFileEarmarkText;
            case "scene":
                return CgClapperBoard;
            default:
                return MdArrowDropDown;
        }
    };

    return <Image as={getNodeIcon()} color="#666666" width="18px" minWidth="18px" height="18px" marginRight="5px" />;
};

const DocumentTree = () => {
    const [documentTree, setDocumentTree] = useAtom(documentTreeAtom);
    const [documentNodes, setDocumentNodes] = useAtom(documentNodesAtom);
    const [includeParagraphs] = useAtom(includeParagraphsAtom);
    const documentTreeRef = useRef(null);
    const [editor] = useLexicalComposerContext();
    const { windowHeight } = useWindowDimensions();
    const containerRef = useRef(null);
    const [treeHeight, setTreeHeight] = useState(1000);

    const FolderArrow = ({ node }) => {
        return (
            <Box width="16px" minWidth="16px">
                {node.children?.length > 0 && (
                    <>
                        {node.isLeaf ? null : node.isOpen ? (
                            <MdArrowDropDown cursor="pointer" onClick={() => node.isInternal && node.toggle()} />
                        ) : (
                            <MdArrowRight cursor="pointer" onClick={() => node.isInternal && node.toggle()} />
                        )}
                    </>
                )}
            </Box>
        );
    };

    const DocumentTreeNode = ({ node, style }) => {
        const isSmallHeader =
            node.data.type === "paragraph" || node.data.type === "listitem" || node.data.type === "link";

        return (
            <Flex
                style={style}
                flexDirection="row"
                alignItems="center"
                // backgroundColor={node.data.isSelected ? (isDark ? "#363636" : "#ededed") : "transparent"}
                backgroundColor={node.data.isSelected ? "#feffb4" : "transparent"}
                //#fdfdf4
                //#feffb4
                //#fbfab7
                cursor="pointer"
                // borderRadius="0px 50px 50px 0px"
                paddingBottom="0px"
                borderRadius="6px"
                _hover={{
                    backgroundColor: "#fdfdf4",
                }}
                userSelect="none"
                onClick={(e) => {
                    switch (e.detail) {
                        default:
                        case 1:
                            //single click
                            editor.update(() => {
                                const nodeSelection = $createNodeSelection();
                                nodeSelection.add(node.data.key);
                                $setSelection(nodeSelection);
                                node.data.isSelected = true;
                            });

                            let element = editor.getElementByKey(node.data.key);
                            if (element) {
                                let yOffset = -50;
                                let y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                                //window.scrollTo({ top: y, behavior: "smooth" });

                                element.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                            break;
                        case 2:
                            //double click
                            node.isInternal && node.toggle();
                            break;
                    }
                }}
            >
                <Flex marginLeft="10px" flexDirection="row" align="center">
                    <FolderArrow node={node} />
                    {node.data.type === "document-heading" && <NodeIcon category={node.data.category} />}
                    <Text
                        color={isSmallHeader ? "#a3a3a3" : "#5f5f5f"}
                        fontSize={isSmallHeader ? "14px" : "16px"}
                        style={singleLineEllipsisStyle}
                        height="21px"
                        fontWeight={isSmallHeader ? "400" : "400"}
                    >
                        {node.data.name}
                    </Text>
                </Flex>
            </Flex>
        );
    };

    const visitTree = (currentNode, nodes, selection) => {
        const childNodes = $isElementNode(currentNode) ? currentNode.getChildren() : [];
        const nodeKey = currentNode.getKey();
        const nodeType = currentNode.getType();

        let isHeading = false;
        let node = {
            id: nodeKey,
            key: nodeKey,
            type: nodeType,
            isSelected: isNodeSelected(currentNode, selection),
            url: "",
        };
        let category = "text";
        if (nodeType === "link") {
            node.url = currentNode.getURL()?.toString();
        }

        let level = 0;
        if (nodeType === "document-heading") {
            const headingTag = currentNode.getTag();
            isHeading = true;
            switch (headingTag) {
                case "h1":
                    level = 1;
                    category = "book";
                    break;
                case "h2":
                    level = 2;
                    category = "act";
                    break;
                case "h3":
                    level = 3;
                    category = "chapter";
                    break;
                case "h4":
                    level = 4;
                    category = "scene";
                    break;
                case "h5":
                    level = 5;
                    break;
                case "h6":
                    level = 6;
                    break;
                default:
                case "paragraph":
                    level = 7;
                    break;
            }

            node.id = currentNode.getId();

            //console.log(node.id, ": ", node.getId());
            //console.log(currentNode.exportJSON());
        } else if (nodeType === "paragraph") {
            // we can include paragraph in tree for now
            isHeading = true;
            level = 7;
            category = "paragraph";
        } else if (nodeType === "listitem") {
            isHeading = true;
            level = 7;
            category = "misc";
        } else if (nodeType === "link") {
            isHeading = true;
            level = 7;
            category = "misc";
        } else if (nodeType === "root") {
            level = 0;
            node.name = "root";
            category = "root";
        } else if (nodeType === "text") {
            level = 7;
            category = "text";
            node.format = currentNode.getFormat();
        } else {
            log("unmanaged node: " + node.type, ", name: " + node.name, 0, true);
            level = 7;
        }

        node.level = level;
        node.category = category;
        node.type = nodeType;

        nodes.push(node);

        let noName = !node.name;
        childNodes.forEach((childNode, i) => {
            if (noName) {
                const childNodeType = childNode.getType();
                // if node has no name itself it is a placeholder for child content - add it to the name
                if (isHeading) {
                    if (childNodeType === "text" || childNodeType === "link") {
                        const childNodeText = childNode.getTextContent();
                        node.name = (node.name ?? "") + childNodeText;

                        // if node is a heading and it has a single selected text then this node is selected
                        if (isNodeSelected(childNode, selection)) {
                            node.isSelected = true;
                        }
                    }
                }
            }

            visitTree(childNode, nodes, selection);
        });
    };

    const onEditorChange = (editorState) => {
        const nodes = [];
        editorState.read(() => {
            const selection = $getSelection();
            visitTree($getRoot(), nodes, selection);
        });

        setDocumentNodes(nodes);
    };

    useEffect(() => {
        let nodeTree = convertToTree(documentNodes, includeParagraphs);
        setDocumentTree(nodeTree?.[0]?.children ?? []);

        // calculate the height of the tree
        let height = 0;
        const visit = (node) => {
            height += 24;
            node.children.forEach((child) => visit(child));
        };
        nodeTree.forEach((node) => visit(node));
        setTreeHeight(height);
    }, [documentNodes, includeParagraphs, setDocumentTree]);

    useEffect(() => {
        return () => {
            // cleanup
            setDocumentNodes([]);
            setDocumentTree([]);
        };
    }, []);

    return (
        <>
            <Box
                ref={containerRef}
                color={"black"}
                position="fixed"
                width={documentExplorerWidthPx}
                backgroundColor={"transparent"}
            >
                <Flex flexDirection="row" paddingTop="16px">
                    <Text fontSize="22px" color="#666666" fontWeight="400" marginLeft="24px">
                        Document Outline
                    </Text>
                    <Box flexGrow="1" />
                    <ParagraphToggleButton />
                </Flex>
                <Box
                    width="100%"
                    height={`${windowHeight - (90 + 53)}px`}
                    overflow="hidden"
                    _hover={{
                        overflowY: "auto",
                    }}
                    paddingTop="10px"
                    // paddingRight="1px"
                    paddingLeft="10px"
                    paddingRight="10px"
                >
                    <Scrollbars autoHide>
                        <Tree ref={documentTreeRef} data={documentTree} width="100%" height={treeHeight} indent={10}>
                            {DocumentTreeNode}
                        </Tree>
                    </Scrollbars>
                </Box>
            </Box>

            <OnChangePlugin onChange={onEditorChange} />
        </>
    );
};
export default DocumentTree;
