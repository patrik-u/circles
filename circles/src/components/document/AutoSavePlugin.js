//#region imports
import { useEffect, useState } from "react";
import { $getRoot } from "lexical";
import axios from "axios";
import { useAtom } from "jotai";
import { circleAtom, saveIdAtom, triggerSaveDocumentAtom } from "components/Atoms";
import { debounce } from "components/Helpers";
import { log } from "components/Helpers";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
//#endregion

const save = (inDocument) => {
    // save document
    log(`saving document ${inDocument.name} version ${inDocument.version}`);

    axios
        .put(`/circles/${inDocument.id}`, {
            circleData: inDocument,
        })
        .then((res) => {
            log(`saved document ${inDocument.name} version ${inDocument.version}`);
        });
};

const updateDocumentFromEditorState = (editorState, inDocument, setDocument, inSaveId) => {
    if (!inDocument) return;

    // get title from editorState
    let content = null;
    let lexical_content = null;
    editorState.read(() => {
        // update title if editorState is provided
        const root = $getRoot();
        content = $convertToMarkdownString(TRANSFORMERS);
        lexical_content = JSON.stringify(editorState);
    });

    //console.log("updating document content from updated editor state");
    let newDocument = {
        ...inDocument,
        content,
        lexical_content: lexical_content,
        hasChanged: true,
        save_id: inSaveId,
    };
    setDocument(newDocument);
};

const autoSaveInterval = 800;
const updateDocumentFromEditorStateInterval = 2000;
const debounceUpdateDocumentFromEditorState = debounce(updateDocumentFromEditorState, updateDocumentFromEditorStateInterval);
const debouncedSave = debounce(save, autoSaveInterval);

// saves the document if it's changed
const AutoSavePlugin = ({ latestSaveId, setContentLength, disableAutoSave, document, setDocument }) => {
    const [loadedDocumentId, setLoadedDocumentId] = useState(null);
    const [saveId, setSaveId] = useAtom(saveIdAtom);
    const [triggerSaveDocument, setTriggerSaveDocument] = useAtom(triggerSaveDocumentAtom);

    useEffect(() => {
        if (!document) {
            return;
        }

        if (document.hasChanged) {
            // document has been changed, save
            log("calling debounced save");
            if (!disableAutoSave) {
                debouncedSave(document);
            }
            setDocument({ ...document, hasChanged: false });
            if (disableAutoSave) {
                setSaveId(null);
            }
        }
    }, [document, setDocument, disableAutoSave, setSaveId]);

    useEffect(() => {
        return () => {
            // if document id changes reset state
            setSaveId(null);
            setLoadedDocumentId(null);
        };
    }, [document?.id, setSaveId]);

    useEffect(() => {
        if (!triggerSaveDocument || disableAutoSave) return;

        log("save triggered", 0, true);
        setTriggerSaveDocument(false);
        debouncedSave(document);
    }, [document, triggerSaveDocument, setTriggerSaveDocument, disableAutoSave]);

    const onEditorChange = (editorState) => {
        //log("onEditorChange", 0, true);

        // ignore first editor change triggered by load of document
        if (loadedDocumentId !== document?.id) {
            //log("onEditorChange ignored", 0, true);
            setLoadedDocumentId(document?.id);
            return;
        }

        // TODO see if this doesn't cause to much performance issues
        let text_content = "";
        editorState.read(() => {
            // update title if editorState is provided
            const root = $getRoot();
            text_content = root.getTextContent();
        });
        setContentLength(text_content.length);

        //setEditorState(editorState);
        //log("setting isDirty to true in updateDocumentFromEditorState", 0, true);
        // save ID is used to track when a save is in progress
        let newSaveId = Math.random() * 1000000;
        setSaveId(newSaveId);
        debounceUpdateDocumentFromEditorState(editorState, document, setDocument, newSaveId);
    };

    useEffect(() => {
        if (saveId === latestSaveId) {
            // latest changes has been saved
            setSaveId(null);
        }
    }, [saveId, setSaveId, latestSaveId]);

    return <OnChangePlugin onChange={onEditorChange} ignoreSelectionChange={true} />;
};
export default AutoSavePlugin;
