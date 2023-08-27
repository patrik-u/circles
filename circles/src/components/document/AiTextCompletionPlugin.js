//#region imports
import { useCallback, useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $isElementNode } from "lexical";
import { $isAtNodeEnd, $wrapNodes } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import {
    $createTextNode,
    $getNodeByKey,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $setSelection,
    COMMAND_PRIORITY_LOW,
    KEY_ARROW_RIGHT_COMMAND,
    KEY_TAB_COMMAND,
    KEY_ESCAPE_COMMAND,
} from "lexical";
import { $createQuoteNode } from "@lexical/rich-text";
import { useAtom } from "jotai";
import {
    triggerAiTextCompletionAtom,
    documentTreeAtom,
    aiTextCompletionActiveAtom,
    circleAtom,
    triggerSaveDocumentAtom,
    documentNodesAtom,
} from "components/Atoms";
import { log } from "components/Helpers";
import axios from "axios";
import { debounce } from "components/Helpers";
import { $createAiPromptNode } from "components/document/AiNodes";
import { getSelectedNode, isNodeSelected } from "components/document/DocumentTree";
//#endregion

const userPromptMaxLength = 15000; // text-davinci-003 allows a maximum of 4000 tokens = 4000 * 4 = 16000 characters, - some safety margin for the prompt

const getTextToSelection = (currentNode, textAr, selection) => {
    const childNodes = $isElementNode(currentNode) ? currentNode.getChildren() : [];

    if ($isTextNode(currentNode) && currentNode.isSimpleText()) {
        const textContent = currentNode.getTextContent();
        textAr.push(textContent);
    }

    if (isNodeSelected(currentNode, selection)) {
        return true;
    }

    for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (getTextToSelection(childNode, textAr, selection)) {
            return true;
        }
    }
    return false;
};

const getUserPrompt = (selection, maxPromptLength) => {
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
    }
    const node = selection.getNodes()[0];

    if (!$isTextNode(node) || !node.isSimpleText()) {
        return null;
    }

    // TODO get previous sibling nodes and add them to prompt to provide more context
    // text-davinci-003 supports 4097 tokens in total

    // first get all notes that are relevant to the section we are in
    const promptSentences = [];
    let text = node.getTextContent();

    let sibling = node.getPreviousSibling();
    log("sibling: " + sibling, 0, true);
    while (sibling) {
        if ($isTextNode(sibling) && sibling.isSimpleText()) {
            text = sibling.getTextContent() + text;
        }
        sibling = sibling.getPreviousSibling?.();
        log("sibling: " + sibling, 0, true);
    }

    // break text into sentences
    let sentences = text.split(".");

    // add sentences until we reach the max prompt limit
    let totalLength = 0;
    for (let i = sentences.length - 1; i >= 0; i--) {
        let sentence = sentences[i];
        if (sentence.length + totalLength > maxPromptLength) {
            // sentence override the limit
            if (promptSentences.length === 0) {
                // if the last sentence is too long simply take the last promptMaxLength characters
                promptSentences.unshift(sentence.substring(sentence.length - maxPromptLength));
            }
            break;
        } else {
            promptSentences.unshift(sentence);
            totalLength += sentence.length;
        }
    }
    let prompt = promptSentences.join(".");

    if (prompt.length === 0 || prompt.trim().length === 0) {
        return null;
    }
    return prompt;
};

const AiTextCompletionPlugin = () => {
    const [editor] = useLexicalComposerContext();
    const [triggerAiTextCompletion, setTriggerAiTextCompletion] = useAtom(triggerAiTextCompletionAtom);
    const [aiTextCompletionActive, setAiTextCompletionActive] = useAtom(aiTextCompletionActiveAtom);
    const [documentTree] = useAtom(documentTreeAtom);
    const [document] = useAtom(circleAtom);

    const clearAiPromptNode = (aiPromptNodeKey) => {
        const aiPromptNode = $getNodeByKey(aiPromptNodeKey);
        if (aiPromptNode !== null && aiPromptNode.isAttached()) {
            aiPromptNode.remove();
        }
    };

    const aiTextComplete = useCallback(
        (outputSize, instructions) => {
            let aiPromptNodeKey = null;

            //log(JSON.stringify(documentNodes, null, 2), 0, true);
            let userPrompt = null;

            // create ai prompt indicator node
            editor.update(
                () => {
                    const selection = $getSelection();
                    let textAr = [];
                    getTextToSelection($getRoot(), textAr, selection);
                    userPrompt = textAr.join("\n");

                    //userPrompt = getUserPrompt(selection, userPromptMaxLength);

                    // add decorator node to show that text completion is active
                    const selectionCopy = selection.clone();
                    const node = $createAiPromptNode("ai-prompt-node");
                    selection.insertNodes([node]);
                    $setSelection(selectionCopy);
                    aiPromptNodeKey = node.getKey();

                    //let root = $getRoot();
                    //userPrompt = root.getTextContent();
                },
                { tag: "hidocument-merge" }
            );

            // get node ids associated with the current node and its parents (e.g. the headings)
            let selectedNode = getSelectedNode(documentTree, true);
            let currentNode = selectedNode;
            //log("node IDs:", 0, true);
            let nodeIds = [];
            while (currentNode) {
                //log(currentNode?.id, 0, true);
                if (currentNode?.id) {
                    nodeIds.push(currentNode.id);
                }
                currentNode = currentNode?.parent;
            }

            // get notes associated with those ids
            let notes = [];
            document.notes
                ?.filter((x) => x.type !== "other")
                ?.forEach((note) => {
                    if (note.tags?.some((x) => nodeIds.includes(x?.id))) {
                        notes.push({ title: note.title, type: note.type, content: note.text_content });
                    }
                });

            // log(JSON.stringify(notes, null, 2), 0, true);
            // // let notes = document.notes.((note) => {
            // //     JSON.stringify(note.tags, null, 2);

            // //     return note.tags?.some((x) => x?.id in nodeIds);
            // // });
            // // log(JSON.stringify(notes, null, 2), 0, true);
            // //log(JSON.stringify(document.notes, null, 2), 0, true);

            //log("userPrompt: " + userPrompt, 0, true);

            // call api to get text completion
            axios
                .post("/text-completion", {
                    userPrompt: userPrompt,
                    notes: notes,
                    outputSize: outputSize,
                    instructions: instructions,
                })
                .then((response) => {
                    if (response.data.error) {
                        log("/text-completion error: " + JSON.stringify(response.data.error), 0, true);
                    }

                    //log("/text-completion response: " + response.data.textCompletion, 0, true);
                    const textCompletion = response.data.textCompletion;
                    editor.update(() => {
                        if (!textCompletion) {
                            setAiTextCompletionActive(false);
                            clearAiPromptNode(aiPromptNodeKey);
                            return;
                        }

                        const selection = $getSelection();
                        const selectionCopy = selection.clone();

                        const textNode = $createTextNode(textCompletion);
                        textNode.setFormat("code");
                        selection.insertNodes([textNode]);
                        $setSelection(selectionCopy);
                        textNode.select();

                        setAiTextCompletionActive(false);
                        clearAiPromptNode(aiPromptNodeKey);
                        //setTriggerSaveDocument(true);
                    });
                })
                .catch((error) => {
                    // aborted
                    log("autoCompleteApiCall aborted: " + error, 0, true);
                    setAiTextCompletionActive(false);
                    editor.update(
                        () => {
                            clearAiPromptNode(aiPromptNodeKey);
                        },
                        { tag: "hidocument-merge" }
                    );
                });
        },
        [editor, setAiTextCompletionActive, documentTree, document]
    );

    useEffect(() => {
        if (!triggerAiTextCompletion) return; // ai text completion is not triggered by the user
        if (aiTextCompletionActive) return; // ai text completion is already active

        let outputSize = triggerAiTextCompletion.outputSize;
        let instructions = triggerAiTextCompletion.instructions;
        // ai text completion is triggered by the user
        setTriggerAiTextCompletion(false);
        setAiTextCompletionActive(true);
        aiTextComplete(outputSize, instructions);
    }, [triggerAiTextCompletion, setTriggerAiTextCompletion, aiTextComplete, aiTextCompletionActive, setAiTextCompletionActive]);

    useEffect(() => {
        return () => {
            setAiTextCompletionActive(false);
        };
    }, [setAiTextCompletionActive]);

    return null;
};

export default AiTextCompletionPlugin;
